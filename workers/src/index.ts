// Cloudflare Workers entrypoint
import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";

import type { AnalysisResponse, PersonaOutput, Consensus, SlideStruct } from "../../api/schema.js";
import { fallbackPersona, makeResponse, validateAndRepairJson } from "../../api/schema.js";
import { PersonaOutputSchema } from "../../api/schema.js";
import { llmEvaluatePersonaWithOpts, llmMergeConsensusWithOpts, llmAnalyzeEmotionalArc, llmSimulateStructure } from "../../api/llm.js";
import { mastraEvaluatePersonas, mastraMergeConsensus } from "../../api/mastra.js";

// Personas configuration (embedded, since Workers can't access filesystem)
const PERSONAS_CONFIG = [
  {
    persona_id: "vc_seed",
    role: "VC（シード/ディープテック寄り）",
    tone: "端的・厳しめ・事実基調・一人称",
    weighting: { clarity: 0.3, uniqueness: 0.3, persuasiveness: 0.4 },
    dealbreakers: ["市場導線が不明", "根拠のない主張"],
  },
  {
    persona_id: "accelerator_judge",
    role: "アクセラ審査員",
    tone: "建設的・実務寄り",
    weighting: { clarity: 0.4, uniqueness: 0.2, persuasiveness: 0.4 },
  },
  {
    persona_id: "early_user",
    role: "アーリーアダプター顧客",
    tone: "率直・体験重視",
    weighting: { clarity: 0.5, uniqueness: 0.1, persuasiveness: 0.4 },
  },
];

type PersonaConfig = {
  persona_id: string;
  role: string;
  tone: string;
  weighting: { clarity: number; uniqueness: number; persuasiveness: number };
  dealbreakers?: string[];
};

type Env = {
  PERSONA_TIMEOUT_MS?: string;
  MERGE_TIMEOUT_MS?: string;
  USE_LLM?: string;
  USE_MASTRA?: string;
  LLM_PROVIDER?: string;
  PERSONA_MODEL?: string;
  MERGE_MODEL?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  LLM_API_KEY?: string;
  LLM_BASE_URL?: string;
};

// Function to parse basic slide structure
const parseSlides = (zip: AdmZip): SlideStruct[] => {
  const parser = new XMLParser({ ignoreAttributes: false, ignoreDeclaration: true, trimValues: true });
  const slideEntries = zip.getEntries().filter((e) => /ppt\/slides\/slide\d+\.xml$/.test(e.entryName));
  const slides: SlideStruct[] = [];

  for (const entry of slideEntries) {
    const xml = entry.getData().toString("utf-8");
    const doc = parser.parse(xml);
    const slideIdxMatch = entry.entryName.match(/slide(\d+)\.xml$/);
    const index = slideIdxMatch ? Number(slideIdxMatch[1]) : slides.length + 1;

    const texts: string[] = [];
    const collectTexts = (node: any) => {
      if (!node || typeof node !== "object") return;
      for (const key in node) {
        if (key.endsWith(":t") || key === "a:t") {
          if (typeof node[key] === "string") texts.push(node[key]);
        } else if (Array.isArray(node[key])) {
          node[key].forEach(collectTexts);
        } else if (typeof node[key] === "object") {
          collectTexts(node[key]);
        }
      }
    };
    collectTexts(doc);

    const countByKey = (node: any, matcher: (key: string) => boolean): number => {
      let c = 0;
      const walk = (n: any) => {
        if (!n || typeof n !== "object") return;
        for (const k of Object.keys(n)) {
          const v = n[k];
          if (matcher(k)) c += 1;
          if (Array.isArray(v)) v.forEach(walk);
          else if (typeof v === "object") walk(v);
        }
      };
      walk(node);
      return c;
    };

    const imageCount = countByKey(doc, (k) => k.endsWith(":pic") || k === "p:pic");
    const chartCount = countByKey(doc, (k) => k.endsWith(":chart") || k === "c:chart");
    const shapeCount = countByKey(doc, (k) => k.endsWith(":sp") || k === "p:sp");
    const titleGuess = texts[0]?.slice(0, 100) || "";
    const wordCount = texts.join(" ").split(/\s+/).filter(Boolean).length;

    slides.push({
      index,
      title: titleGuess,
      texts: texts.slice(0, 50),
      wordCount,
      imageCount,
      chartCount,
      shapeCount,
    });
  }
  return slides.sort((a, b) => a.index - b.index);
};

function heuristicScoreFromSlides(summary: string, slidesText: string, slidesStruct: any[] | undefined, weighting: PersonaConfig["weighting"]) {
  const text = `${summary || ""}\n${slidesText || ""}`.trim();
  const len = text.length;
  const sentences = (text.match(/[。\.\!\?]/g) || []).length;
  const words = (text.match(/\S+/g) || []).length;
  const slideCount = Array.isArray(slidesStruct) ? slidesStruct.length : Math.max(1, (slidesText.match(/Slide\s+\d+:/g) || []).length);
  const avgWordsPerSlide = slideCount ? Math.round(words / slideCount) : words;
  const imageHints = Array.isArray(slidesStruct) ? slidesStruct.reduce((s, x) => s + Number(x?.imageCount || 0), 0) : 0;
  const chartHints = Array.isArray(slidesStruct) ? slidesStruct.reduce((s, x) => s + Number(x?.chartCount || 0), 0) : 0;

  const base = 55 + Math.min(10, Math.floor(sentences / 3));
  let clarity = base + (avgWordsPerSlide > 40 ? 6 : -2);
  let uniqueness = base + (chartHints + imageHints > Math.max(2, slideCount / 4) ? 6 : -1);
  let persuasiveness = base + (len > 600 ? 6 : -1) + (chartHints > 0 ? 2 : 0);

  clarity = Math.max(35, Math.min(92, clarity));
  uniqueness = Math.max(30, Math.min(90, uniqueness));
  persuasiveness = Math.max(35, Math.min(92, persuasiveness));

  const wsum = weighting.clarity + weighting.uniqueness + weighting.persuasiveness || 1;
  const wc = (v: number, w: number) => Math.round(Math.max(0, Math.min(100, v + (w / wsum - 1 / 3) * 10)));
  return {
    clarity: wc(clarity, weighting.clarity),
    uniqueness: wc(uniqueness, weighting.uniqueness),
    persuasiveness: wc(persuasiveness, weighting.persuasiveness),
  };
}

type RuntimeOpts = {
  useLLM: boolean;
  useMastra: boolean;
  provider?: string;
  personaModel?: string;
  mergeModel?: string;
  personaTimeoutMs?: number;
  mergeTimeoutMs?: number;
  detail?: "low" | "normal" | "high";
  slidesTextLimit?: number;
  evidenceMax?: number;
};

function getRuntimeOptsFromBody(body: any, env: Env): RuntimeOpts {
  const normBool = (v: any, d: boolean) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return v.toLowerCase() === "true";
    return d;
  };
  const toNum = (v: any, d?: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : d;
  };
  const ENV_USE_LLM = String(env.USE_LLM || "").toLowerCase();
  const USE_LLM_DEFAULT = ENV_USE_LLM === "" ? true : ENV_USE_LLM === "true";
  const ENV_USE_MASTRA = String(env.USE_MASTRA || "").toLowerCase();
  const USE_MASTRA_DEFAULT = ENV_USE_MASTRA === "" ? false : ENV_USE_MASTRA === "true";
  const LLM_PROVIDER_DEFAULT = (env.LLM_PROVIDER || "").toLowerCase();
  const PERSONA_MODEL_DEFAULT = env.PERSONA_MODEL || "";
  const MERGE_MODEL_DEFAULT = env.MERGE_MODEL || "";

  return {
    useLLM: normBool(body?.use_llm, USE_LLM_DEFAULT),
    useMastra: normBool(body?.use_mastra, USE_MASTRA_DEFAULT),
    provider: (body?.llm_provider || LLM_PROVIDER_DEFAULT || "").toLowerCase() || undefined,
    personaModel: body?.persona_model || PERSONA_MODEL_DEFAULT || undefined,
    mergeModel: body?.merge_model || MERGE_MODEL_DEFAULT || undefined,
    personaTimeoutMs: toNum(body?.persona_timeout_ms, Number(env.PERSONA_TIMEOUT_MS || 10000)),
    mergeTimeoutMs: toNum(body?.merge_timeout_ms, Number(env.MERGE_TIMEOUT_MS || 10000)),
    detail: (["low", "normal", "high"].includes(String(body?.detail)) ? String(body?.detail) : undefined) as any,
    slidesTextLimit: toNum(body?.slides_text_limit),
    evidenceMax: toNum(body?.evidence_max),
  };
}

function personaEvaluate(input: any, persona: PersonaConfig, signal: AbortSignal, runtime: RuntimeOpts): Promise<PersonaOutput> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const onAbort = () => reject(new Error("timeout"));
    signal.addEventListener("abort", onAbort, { once: true });

    const delay = Math.floor(100 + Math.random() * 400);
    const timer = setTimeout(async () => {
      try {
        if (runtime.useLLM) {
          const result = await llmEvaluatePersonaWithOpts(input, persona, {
            provider: runtime.provider,
            model: runtime.personaModel,
            timeoutMs: runtime.personaTimeoutMs,
            detail: runtime.detail || "high",
            slidesTextLimit: runtime.slidesTextLimit,
            evidenceMax: runtime.evidenceMax,
          });
          const looksFallback =
            !result ||
            (result.scores.clarity === 50 && result.scores.uniqueness === 50 && result.scores.persuasiveness === 50) ||
            /暫定値/.test(result.summary || "") ||
            (result.confidence ?? 0) < 0.5;
          if (looksFallback) {
            const summaryText = typeof input?.summary === "string" ? input.summary : input?.slides_summary || "";
            const slidesText = String(input?.slides_text || "");
            const slidesStruct = Array.isArray(input?.slides_struct) ? input.slides_struct : undefined;
            const scores = heuristicScoreFromSlides(summaryText, slidesText, slidesStruct, persona.weighting);
            const evidences: { slide?: number; quote?: string }[] = [];
            if (Array.isArray(slidesStruct) && slidesStruct.length > 0) {
              const best = slidesStruct
                .slice(0, 10)
                .sort((a: any, b: any) => Number(b?.wordCount || 0) + Number(b?.chartCount || 0) - (Number(a?.wordCount || 0) + Number(a?.chartCount || 0)))[0];
              if (best) {
                evidences.push({ slide: Number(best.index || 1), quote: String(best.title || best.texts?.[0] || "").slice(0, 60) });
              }
            }
            if (evidences.length === 0 && slidesText) {
              const m = slidesText.match(/Slide\s+(\d+):\s*([^\n]{10,80})/);
              if (m) evidences.push({ slide: Number(m[1]), quote: m[2] });
            }
            if (evidences.length === 0) {
              evidences.push({ quote: (summaryText || "提案内容の要旨").slice(0, 60) });
            }
            const heuristic: PersonaOutput = {
              persona_id: persona.persona_id,
              summary: `${persona.role}視点: ${summaryText ? "初見評価を実施" : "資料テキストから推定"}`,
              scores,
              comment: `私は${persona.role}として評価します。${persona.tone}。自動代替（LLM失敗）としてヒューリスティック評価を提示します。`,
              evidence: evidences.slice(0, 3),
              confidence: summaryText || slidesText ? 0.6 : 0.45,
            };
            resolve(heuristic);
          } else {
            resolve(result);
          }
        } else {
          const summaryText = typeof input?.summary === "string" ? input.summary : input?.slides_summary || "";
          const slidesText = String(input?.slides_text || "");
          const slidesStruct = Array.isArray(input?.slides_struct) ? input.slides_struct : undefined;
          const scores = heuristicScoreFromSlides(summaryText, slidesText, slidesStruct, persona.weighting);

          const evidences: { slide?: number; quote?: string }[] = [];
          if (Array.isArray(slidesStruct) && slidesStruct.length > 0) {
            const best = slidesStruct
              .slice(0, 10)
              .sort((a: any, b: any) => Number(b?.wordCount || 0) + Number(b?.chartCount || 0) - (Number(a?.wordCount || 0) + Number(a?.chartCount || 0)))[0];
            if (best) {
              evidences.push({ slide: Number(best.index || 1), quote: String(best.title || best.texts?.[0] || "").slice(0, 60) });
            }
          }
          if (evidences.length === 0 && slidesText) {
            const m = slidesText.match(/Slide\s+(\d+):\s*([^\n]{10,80})/);
            if (m) evidences.push({ slide: Number(m[1]), quote: m[2] });
          }
          if (evidences.length === 0) {
            evidences.push({ quote: (summaryText || "提案内容の要旨").slice(0, 60) });
          }

          const result: PersonaOutput = {
            persona_id: persona.persona_id,
            summary: `${persona.role}視点: ${summaryText ? "初見評価を実施" : "資料テキストから推定"}`,
            scores,
            comment: (() => {
              const countSlides = Array.isArray(slidesStruct) ? slidesStruct.length : Math.max(1, (slidesText.match(/Slide\s+\d+:/g) || []).length);
              const charts = Array.isArray(slidesStruct) ? slidesStruct.reduce((s: number, x: any) => s + Number(x?.chartCount || 0), 0) : 0;
              const images = Array.isArray(slidesStruct) ? slidesStruct.reduce((s: number, x: any) => s + Number(x?.imageCount || 0), 0) : 0;
              const firstTitle = Array.isArray(slidesStruct) && slidesStruct[0]?.title ? String(slidesStruct[0].title).slice(0, 40) : undefined;
              return (
                `私は${persona.role}として評価します。${persona.tone}。スライド${countSlides}枚、図表${charts}、画像${images}。` +
                (firstTitle ? `最初のタイトル「${firstTitle}」を確認。` : "")
              );
            })(),
            evidence: evidences.slice(0, 2),
            confidence: summaryText || slidesText ? 0.68 : 0.45,
          };
          resolve(result);
        }
      } catch (e) {
        reject(e);
      } finally {
        clearTimeout(timeoutId);
        signal.removeEventListener("abort", onAbort);
      }
    }, delay);

    const timeoutMs = Number(runtime.personaTimeoutMs || 10000);
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error("timeout"));
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
    }, timeoutMs);
  });
}

function createConsensus(personas: PersonaOutput[]): Consensus {
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const cat = {
    clarity: personas.map((p) => p.scores.clarity),
    uniqueness: personas.map((p) => p.scores.uniqueness),
    persuasiveness: personas.map((p) => p.scores.persuasiveness),
  };
  const avgClarity = Math.round(avg(cat.clarity));
  const avgUniq = Math.round(avg(cat.uniqueness));
  const avgPers = Math.round(avg(cat.persuasiveness));
  const overall = Math.round(avg(personas.map((p) => (p.scores.clarity + p.scores.uniqueness + p.scores.persuasiveness) / 3)));

  const variance = (xs: number[]) => (xs.length ? avg(xs.map((x) => (x - avg(xs)) ** 2)) : 0);
  const stdev = (xs: number[]) => Math.sqrt(variance(xs));
  const sdClarity = stdev(cat.clarity);
  const sdUniq = stdev(cat.uniqueness);
  const sdPers = stdev(cat.persuasiveness);

  const evidenceSlides = personas
    .flatMap((p) => (Array.isArray(p.evidence) ? p.evidence : []))
    .map((e) => (Number.isInteger(e.slide) ? Number(e.slide) : null))
    .filter((n): n is number => n !== null);
  const slideCounts = new Map<number, number>();
  for (const s of evidenceSlides) slideCounts.set(s, (slideCounts.get(s) || 0) + 1);
  const commonSlides = Array.from(slideCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([n]) => n)
    .slice(0, 3);
  const firstSlide = commonSlides[0] || 1;

  const agreements: string[] = [];
  if (avgClarity < 85) agreements.push(`clarity avg=${avgClarity}`);
  if (avgUniq < 85) agreements.push(`uniqueness avg=${avgUniq}`);
  if (avgPers < 85) agreements.push(`persuasiveness avg=${avgPers}`);
  if (agreements.length === 0) agreements.push(`balanced scores overall=${overall}`);

  const disagreements: string[] = [];
  if (sdUniq > 8) disagreements.push(`独自性評価のばらつき（σ=${sdUniq.toFixed(1)}）`);
  if (sdPers > 8 && disagreements.length < 2) disagreements.push(`説得力評価のばらつき（σ=${sdPers.toFixed(1)}）`);
  if (sdClarity > 8 && disagreements.length < 2) disagreements.push(`明確性評価のばらつき（σ=${sdClarity.toFixed(1)}）`);

  const entries: { key: "clarity" | "uniqueness" | "persuasiveness"; avg: number }[] = [
    { key: "clarity" as const, avg: avgClarity },
    { key: "uniqueness" as const, avg: avgUniq },
    { key: "persuasiveness" as const, avg: avgPers },
  ].sort((a, b) => a.avg - b.avg);
  const top_todos: string[] = [];
  for (const e of entries) {
    if (top_todos.length >= 3) break;
    if (e.avg < 85) {
      const label = e.key;
      const title = String(personas[0]?.evidence?.find((ev) => ev.slide === firstSlide)?.quote || "").slice(0, 30);
      const slidesHint = commonSlides.length ? `slides=${commonSlides.join(",")}` : `slide=${firstSlide}`;
      top_todos.push(`${label}: avg=${e.avg} (<85), focus_${slidesHint}${title ? `, hint="${title}"` : ""}`);
      continue;
    }
  }
  if (top_todos.length === 0) top_todos.push(`stability: overall=${overall}`);

  const what_if = top_todos.slice(0, 2).map((t) => {
    const baseDeficit = 100 - Math.min(90, overall);
    const expected_gain = clamp(Math.round(baseDeficit / 3), 2, 12);
    const uncertainty = 2;
    return { change: t, expected_gain, uncertainty };
  });

  return {
    agreements: agreements.slice(0, 3),
    disagreements: disagreements.slice(0, 2),
    overall_score: clamp(overall, 0, 100),
    top_todos: top_todos.slice(0, 3),
    what_if,
  };
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream;charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
    "Access-Control-Allow-Origin": "*",
  };
}

function writeSse(encoder: TextEncoder, event: string, data: any): Uint8Array {
  const text = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return encoder.encode(text);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
        },
      });
    }

    // Health check
    if (request.method === "GET" && (pathname === "/" || pathname === "/api" || pathname === "/api/")) {
      return jsonResponse({ ok: true, version: "v1.0-workers" });
    }

    // Stream analyze endpoint (multipart/form-data)
    if (request.method === "POST" && (pathname === "/api/analyze/stream" || pathname === "/analyze/stream")) {
      try {
        const contentType = request.headers.get("content-type") || "";

        let body: any;
        let slides_struct: SlideStruct[];

        if (contentType.includes("multipart/form-data")) {
          // Parse multipart form data
          const formData = await request.formData();
          const file = formData.get("file") as File | null;

          if (!file) {
            return jsonResponse({ error: "file is required" }, 400);
          }

          // Convert File to Buffer for AdmZip
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const zip = new AdmZip(buffer);
          slides_struct = parseSlides(zip);

          body = {
            summary: `${formData.get("target_person") || ""} ${formData.get("goal") || ""} ${formData.get("industry") || ""}`.trim(),
            slides_text: slides_struct.map((s) => `Slide ${s.index}: ${s.title}\n${s.texts.join(" ")}`).join("\n\n"),
            slides_struct: slides_struct,
            speech_text: "",
          };
        } else {
          // JSON body
          body = await request.json();
          slides_struct = body.slides_struct || [];
        }

        const runtime = getRuntimeOptsFromBody(body, env);
        const personasCfg = PERSONAS_CONFIG;

        // Set up streaming response
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        // Process in background
        (async () => {
          try {
            const ac = new AbortController();
            const tasks = personasCfg.map((cfg) =>
              personaEvaluate(body, cfg, ac.signal, runtime)
                .then((p) => ({ status: "fulfilled", value: p, persona_id: cfg.persona_id }))
                .catch((reason) => ({ status: "rejected", reason, persona_id: cfg.persona_id }))
            );

            const personaOutputs: PersonaOutput[] = [];
            for (const task of tasks) {
              const result = await task;
              const output = result.status === "fulfilled" ? result.value : fallbackPersona((result as any).persona_id);
              const validated = validateAndRepairJson(output, PersonaOutputSchema, "persona") ?? fallbackPersona((result as any).persona_id);
              personaOutputs.push(validated);
              await writer.write(writeSse(encoder, "message", { type: "persona", data: validated }));
            }

            let consensus = createConsensus(personaOutputs);

            if (runtime.useMastra) {
              try {
                consensus = await mastraMergeConsensus(personaOutputs, {
                  provider: runtime.provider,
                  model: runtime.mergeModel,
                  timeoutMs: runtime.mergeTimeoutMs,
                });
              } catch {}
            } else if (runtime.useLLM) {
              try {
                consensus = await llmMergeConsensusWithOpts(personaOutputs, {
                  provider: runtime.provider,
                  model: runtime.mergeModel,
                  timeoutMs: runtime.mergeTimeoutMs,
                });
              } catch {}
            }

            await writer.write(writeSse(encoder, "message", { type: "consensus", data: consensus }));
            await writer.write(writeSse(encoder, "done", { slides_struct }));
          } catch (e: any) {
            console.error("[workers] stream error:", e);
            await writer.write(writeSse(encoder, "error", { error: String(e?.message || e) }));
          } finally {
            await writer.close();
          }
        })();

        return new Response(readable, { headers: sseHeaders() });
      } catch (e: any) {
        console.error("[workers] /api/analyze/stream error:", e);
        return jsonResponse({ error: "Internal Server Error", message: String(e?.message || e) }, 500);
      }
    }

    // Non-streaming analyze endpoint
    if (request.method === "POST" && (pathname === "/api/analyze" || pathname === "/analyze")) {
      try {
        const contentType = request.headers.get("content-type") || "";
        let body: any;

        if (contentType.includes("multipart/form-data")) {
          const formData = await request.formData();
          const file = formData.get("file") as File | null;

          if (!file) {
            return jsonResponse({ error: "file is required" }, 400);
          }

          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const zip = new AdmZip(buffer);
          const slides_struct = parseSlides(zip);

          body = {
            summary: `${formData.get("target_person") || ""} ${formData.get("goal") || ""} ${formData.get("industry") || ""}`.trim(),
            slides_text: slides_struct.map((s) => `Slide ${s.index}: ${s.title}\n${s.texts.join(" ")}`).join("\n\n"),
            slides_struct: slides_struct,
            speech_text: "",
          };
        } else {
          body = await request.json();
        }

        const runtime = getRuntimeOptsFromBody(body, env);
        const personasCfg = PERSONAS_CONFIG;

        const ac = new AbortController();
        const tasks = personasCfg.map((cfg) =>
          personaEvaluate(body, cfg, ac.signal, runtime).then(
            (p) => ({ status: "fulfilled" as const, value: p }),
            (e) => ({ status: "rejected" as const, reason: e, persona_id: cfg.persona_id })
          )
        );
        const settled = await Promise.all(tasks);
        const personaOutputs = settled.map((r, idx) =>
          r.status === "fulfilled" ? r.value : fallbackPersona((r as any).persona_id || personasCfg[idx]?.persona_id || `persona_${idx}`)
        );

        const repaired = personaOutputs.map((p) => validateAndRepairJson(p, PersonaOutputSchema, "persona") ?? fallbackPersona(p.persona_id));

        let consensus = createConsensus(repaired);

        if (runtime.useMastra) {
          try {
            consensus = await mastraMergeConsensus(repaired, {
              provider: runtime.provider,
              model: runtime.mergeModel,
              timeoutMs: runtime.mergeTimeoutMs,
            });
          } catch {}
        } else if (runtime.useLLM) {
          try {
            consensus = await llmMergeConsensusWithOpts(repaired, {
              provider: runtime.provider,
              model: runtime.mergeModel,
              timeoutMs: runtime.mergeTimeoutMs,
            });
          } catch {}
        }

        const response: AnalysisResponse = makeResponse(repaired, consensus, (body as any)?.slides_struct);
        return jsonResponse(response);
      } catch (e: any) {
        console.error("[workers] /api/analyze error:", e);
        return jsonResponse({ error: "Bad Request", message: String(e?.message || e) }, 400);
      }
    }

    // emotional_arc endpoint
    if (request.method === "POST" && (pathname === "/api/analyze/emotional_arc" || pathname === "/analyze/emotional_arc")) {
      try {
        const body = await request.json();
        const slides_struct = body?.slides_struct;

        if (!Array.isArray(slides_struct) || slides_struct.length === 0) {
          return jsonResponse({ error: "Bad Request", message: "slides_struct is required and must be a non-empty array" }, 400);
        }

        const runtime = getRuntimeOptsFromBody(body || {}, env);
        const emotionalArc = await llmAnalyzeEmotionalArc(slides_struct, {
          provider: runtime.provider,
          model: runtime.mergeModel,
          timeoutMs: runtime.mergeTimeoutMs,
          log: true,
        });

        return jsonResponse(emotionalArc);
      } catch (e: any) {
        console.error("[workers] /api/analyze/emotional_arc error:", e);
        return jsonResponse({ error: "Internal Server Error", message: String(e?.message || e) }, 500);
      }
    }

    // simulate/structure endpoint
    if (request.method === "POST" && (pathname === "/api/simulate/structure" || pathname === "/simulate/structure")) {
      try {
        const body = await request.json();
        const slides_struct = body?.slides_struct;

        if (!Array.isArray(slides_struct) || slides_struct.length === 0) {
          return jsonResponse({ error: "Bad Request", message: "slides_struct is required and must be a non-empty array" }, 400);
        }

        const runtime = getRuntimeOptsFromBody(body || {}, env);
        const structureSimulation = await llmSimulateStructure(slides_struct, {
          provider: runtime.provider,
          model: runtime.mergeModel,
          timeoutMs: runtime.mergeTimeoutMs,
          log: true,
        });

        return jsonResponse(structureSimulation);
      } catch (e: any) {
        console.error("[workers] /api/simulate/structure error:", e);
        return jsonResponse({ error: "Internal Server Error", message: String(e?.message || e) }, 500);
      }
    }

    return jsonResponse({ error: "Not Found" }, 404);
  },
};
