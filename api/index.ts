import "dotenv/config";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { parse as parseUrl } from "url";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import type { AnalysisResponse, PersonaOutput, Consensus, SlideStruct } from "./schema.js";
import { fallbackPersona, makeResponse, validateAndRepairJson } from "./schema.js";
import { PersonaOutputSchema } from "./schema.js";
import { llmEvaluatePersonaWithOpts, llmMergeConsensusWithOpts, llmSimulateStructure, llmAnalyzeEmotionalArc } from "./llm.js";
import { mastraEvaluatePersonas, mastraMergeConsensus } from "./mastra.js";
import formidable from "formidable";
import { verifyRequest } from "./auth.js";
import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

type PersonaConfig = {
  persona_id: string;
  role: string;
  tone: string;
  weighting: { clarity: number; uniqueness: number; persuasiveness: number };
  dealbreakers?: string[];
};

const PORT = Number(process.env.PORT || 8787);
const PERSONA_TIMEOUT_MS = Number(process.env.PERSONA_TIMEOUT_MS || 10000);
// Default behavior: LLM ON unless explicitly set to "false"
const ENV_USE_LLM = String(process.env.USE_LLM || "").toLowerCase();
const USE_LLM_DEFAULT = ENV_USE_LLM === "" ? true : ENV_USE_LLM === "true";
const ENV_USE_MASTRA = String(process.env.USE_MASTRA || "").toLowerCase();
const USE_MASTRA_DEFAULT = ENV_USE_MASTRA === "" ? false : ENV_USE_MASTRA === "true";
const LLM_PROVIDER_DEFAULT = (process.env.LLM_PROVIDER || "").toLowerCase();
const PERSONA_MODEL_DEFAULT = process.env.PERSONA_MODEL || "";
const MERGE_MODEL_DEFAULT = process.env.MERGE_MODEL || "";

// Debug: Log environment variables on startup
console.log("[ENV] LLM_PROVIDER:", LLM_PROVIDER_DEFAULT || "NOT SET");
console.log("[ENV] OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "SET (length: " + process.env.OPENAI_API_KEY.length + ")" : "NOT SET");
console.log("[ENV] GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY ? "SET" : "NOT SET");
console.log("[ENV] USE_LLM:", USE_LLM_DEFAULT);

// Harden server: log and keep process alive on unexpected errors
process.on("uncaughtException", (err) => {
  try {
    console.error("[server] uncaughtException:", err);
  } catch {}
});
process.on("unhandledRejection", (reason) => {
  try {
    console.error("[server] unhandledRejection:", reason);
  } catch {}
});

// Vercel環境では、apiディレクトリからの相対パスで静的ファイルを解決
function loadPersonas(): PersonaConfig[] {
  // Use resolved __dirname. We are in api/index.ts. Config is in ../config relative to api/
  const path = join(__dirname, "..", "config", "personas.json");
  if (!existsSync(path)) {
      console.warn(`[server] personas.json not found at ${path}`);
      return [];
  }
  const text = readFileSync(path, "utf-8");
  return JSON.parse(text);
}

// Debug memory for last extraction (dev only)
let lastExtractDebug: { slidesCount: number; sampleTitles: string[] } | null = null;

function heuristicScoreFromSlides(summary: string, slidesText: string, slidesStruct: any[] | undefined, weighting: PersonaConfig["weighting"]) {
  const text = `${summary || ""}\n${slidesText || ""}`.trim();
  const len = text.length;
  const sentences = (text.match(/[。\.\!\?]/g) || []).length;
  const words = (text.match(/\S+/g) || []).length;
  const slideCount = Array.isArray(slidesStruct) ? slidesStruct.length : Math.max(1, (slidesText.match(/Slide\s+\d+:/g) || []).length);
  const avgWordsPerSlide = slideCount ? Math.round(words / slideCount) : words;
  const imageHints = Array.isArray(slidesStruct) ? slidesStruct.reduce((s, x) => s + Number(x?.imageCount || 0), 0) : 0;
  const chartHints = Array.isArray(slidesStruct) ? slidesStruct.reduce((s, x) => s + Number(x?.chartCount || 0), 0) : 0;

  // Baselines with simple heuristics
  const base = 55 + Math.min(10, Math.floor(sentences / 3));
  let clarity = base + (avgWordsPerSlide > 40 ? 6 : -2);
  let uniqueness = base + (chartHints + imageHints > Math.max(2, slideCount / 4) ? 6 : -1);
  let persuasiveness = base + (len > 600 ? 6 : -1) + (chartHints > 0 ? 2 : 0);

  // clamp
  clarity = Math.max(35, Math.min(92, clarity));
  uniqueness = Math.max(30, Math.min(90, uniqueness));
  persuasiveness = Math.max(35, Math.min(92, persuasiveness));

  // light weighting
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

function getRuntimeOptsFromBody(body: any): RuntimeOpts {
  const normBool = (v: any, d: boolean) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return v.toLowerCase() === "true";
    return d;
  };
  const toNum = (v: any, d?: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : d;
  };
  return {
    useLLM: normBool(body?.use_llm, USE_LLM_DEFAULT),
    useMastra: normBool(body?.use_mastra, USE_MASTRA_DEFAULT),
    provider: (body?.llm_provider || LLM_PROVIDER_DEFAULT || "").toLowerCase() || undefined,
    personaModel: body?.persona_model || PERSONA_MODEL_DEFAULT || undefined,
    mergeModel: body?.merge_model || MERGE_MODEL_DEFAULT || undefined,
    personaTimeoutMs: toNum(body?.persona_timeout_ms, Number(process.env.PERSONA_TIMEOUT_MS || 10000)),
    mergeTimeoutMs: toNum(body?.merge_timeout_ms, Number(process.env.MERGE_TIMEOUT_MS || 10000)),
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

    // Call LLM immediately
    (async () => {
      try {
        if (runtime.useLLM) {
          console.log(`[LLM] Calling LLM for persona ${persona.persona_id}, provider: ${runtime.provider || 'default'}`);
          const result = await llmEvaluatePersonaWithOpts(input, persona, {
            provider: runtime.provider,
            model: runtime.personaModel,
            timeoutMs: runtime.personaTimeoutMs,
            detail: runtime.detail || "high",
            slidesTextLimit: runtime.slidesTextLimit,
            evidenceMax: runtime.evidenceMax,
          });
          console.log(`[LLM] ✅ Success for persona ${persona.persona_id}`);
          // Use LLM result directly
          resolve(result);
        } else {
          const summaryText = typeof input?.summary === "string" ? input.summary : input?.slides_summary || "";
          const slidesText = String(input?.slides_text || "");
          const slidesStruct = Array.isArray(input?.slides_struct) ? input.slides_struct : undefined;
          const scores = heuristicScoreFromSlides(summaryText, slidesText, slidesStruct, persona.weighting);

          // evidence selection
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
      } catch (e: any) {
        console.error(`[LLM] ❌ Error for persona ${persona.persona_id}:`, e?.message || e);
        reject(e);
      } finally {
        clearTimeout(timeoutId);
        signal.removeEventListener("abort", onAbort);
      }
    })();

    // Increase timeout to 30 seconds for LLM calls
    const timeoutMs = Number(runtime.personaTimeoutMs || 30000);
    const timeoutId = setTimeout(() => {
      console.error(`[LLM] ⏱️ Timeout for persona ${persona.persona_id} after ${timeoutMs}ms`);
      controller.abort();
      reject(new Error("timeout"));
      signal.removeEventListener("abort", onAbort);
    }, timeoutMs);
  });
}

function createConsensus(personas: PersonaOutput[]): Consensus {
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  // Category stats
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

  // Evidence stats (pick common slide numbers if present)
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

  // Agreements: purely data-centric statements (no canned advice)
  const agreements: string[] = [];
  if (avgClarity < 85) agreements.push(`clarity avg=${avgClarity}`);
  if (avgUniq < 85) agreements.push(`uniqueness avg=${avgUniq}`);
  if (avgPers < 85) agreements.push(`persuasiveness avg=${avgPers}`);
  if (agreements.length === 0) agreements.push(`balanced scores overall=${overall}`);

  // Disagreements: where stdev is high, include sigma
  const disagreements: string[] = [];
  if (sdUniq > 8) disagreements.push(`独自性評価のばらつき（σ=${sdUniq.toFixed(1)}）`);
  if (sdPers > 8 && disagreements.length < 2) disagreements.push(`説得力評価のばらつき（σ=${sdPers.toFixed(1)}）`);
  if (sdClarity > 8 && disagreements.length < 2) disagreements.push(`明確性評価のばらつき（σ=${sdClarity.toFixed(1)}）`);

  // Top TODOs: metric-style, assembled from data only (no canned phrasing)
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

  // What-if simulation with expected gains derived from deficits
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

async function analyze(input: any, runtime: RuntimeOpts) {
  const personasCfg = loadPersonas();
  // If we receive raw slides text/speech text, optionally summarize here (LLM/Mastra)
  let personaOutputs: PersonaOutput[] = [];
  if (runtime.useMastra) {
    // Route through Mastra adapter (falls back to LLM path if Mastra not present)
    personaOutputs = await mastraEvaluatePersonas(input, personasCfg, {
      provider: runtime.provider,
      model: runtime.personaModel,
      timeoutMs: runtime.personaTimeoutMs,
    }).catch(async () => {
      const ac = new AbortController();
      const tasks = personasCfg.map((cfg) =>
        personaEvaluate(input, cfg, ac.signal, runtime).then(
          (p) => ({ status: "fulfilled" as const, value: p }),
          (e) => ({ status: "rejected" as const, reason: e, persona_id: cfg.persona_id })
        )
      );
      const settled = await Promise.all(tasks);
      return settled.map((r, idx) =>
        r.status === "fulfilled" ? r.value : fallbackPersona((r as any).persona_id || personasCfg[idx]?.persona_id || `persona_${idx}`)
      );
    });
  } else {
    const ac = new AbortController();
    const tasks = personasCfg.map((cfg) =>
      personaEvaluate(input, cfg, ac.signal, runtime).then(
        (p) => ({ status: "fulfilled" as const, value: p }),
        (e) => ({ status: "rejected" as const, reason: e, persona_id: cfg.persona_id })
      )
    );
    const settled = await Promise.all(tasks);
    personaOutputs = settled.map((r, idx) =>
      r.status === "fulfilled" ? r.value : fallbackPersona((r as any).persona_id || personasCfg[idx]?.persona_id || `persona_${idx}`)
    );
  }

  // Validate/repair each persona output; fallback only if invalid
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

  const response: AnalysisResponse = makeResponse(repaired, consensus, (input as any)?.slides_struct);
  return response;
}

// メインのサーバーレス関数
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { pathname: rawPathname } = parseUrl(req.url || "/", true);
  // On Vercel catch-all functions, req.url may be "/analyze/stream" (without "/api").
  // Normalize to always compare against "/api/..." style paths.
  const pathname = rawPathname && rawPathname.startsWith("/api") ? rawPathname : ("/api" + (rawPathname || "/"));
  
  // Debug logging
  console.log("[API] req.url:", req.url);
  console.log("[API] rawPathname:", rawPathname);
  console.log("[API] pathname:", pathname);
  console.log("[API] method:", req.method);

  // CORS: allow only configured origins if provided
  const configured = String(process.env.ALLOWED_ORIGIN || "*").trim();
  const originHeader = String((req.headers as any)["origin"] || "");
  let allowOrigin = "*";
  if (configured !== "*") {
    const allowedList = configured.split(',').map((s) => s.trim()).filter(Boolean);
    allowOrigin = allowedList.includes(originHeader) ? originHeader : allowedList[0] || "";
  }
  if (allowOrigin) res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  // /api へのGETリクエストをヘルスチェックとして扱う
  if (
    req.method === "GET" &&
    (pathname === "/api" || pathname === "/api/" || pathname === "/api/index")
  ) {
    return sendJson(res, 200, { ok: true, version: "v1.0-serverless" });
  }

  if (req.method === "POST" && pathname === "/api/analyze/emotional_arc") {
    console.log("[API] ⚠️ SKIPPING AUTH - FOR TESTING ONLY");
    /* TODO: Re-enable auth
    try {
      await verifyRequest(req);
    } catch (e: any) {
      const code = e?.message === 'missing_bearer' ? 401 : 401;
      return sendJson(res, code, { error: 'Unauthorized' });
    }
    */
    try {
      const body = req.body;
      const slides = Array.isArray(body) ? body : (body?.slides_struct || []);
      const result = await llmAnalyzeEmotionalArc(slides, { provider: LLM_PROVIDER_DEFAULT });
      return sendJson(res, 200, result);
    } catch (e) {
      console.error("[serverless] /api/analyze/emotional_arc error:", e);
      return sendJson(res, 500, { error: "Internal Server Error" });
    }
  }

  if (req.method === "POST" && pathname === "/api/simulate/structure") {
    console.log("[API] ⚠️ SKIPPING AUTH - FOR TESTING ONLY");
    /* TODO: Re-enable auth
    try {
      await verifyRequest(req);
    } catch (e: any) {
      const code = e?.message === 'missing_bearer' ? 401 : 401;
      return sendJson(res, code, { error: 'Unauthorized' });
    }
    */
    try {
      const body = req.body;
      const slides = Array.isArray(body) ? body : (body?.slides_struct || []);
      const result = await llmSimulateStructure(slides, { provider: LLM_PROVIDER_DEFAULT });
      return sendJson(res, 200, result);
    } catch (e) {
      console.error("[serverless] /api/simulate/structure error:", e);
      return sendJson(res, 500, { error: "Internal Server Error" });
    }
  }

  if (req.method === "POST" && pathname === "/api/analyze/stream") {
    // TEMPORARY: Skip auth to test analysis functionality
    console.log("[API] ⚠️ SKIPPING AUTH - FOR TESTING ONLY");
    /* TODO: Re-enable auth after firebase-admin is fixed
    try {
      await verifyRequest(req);
      console.log("[API] ✅ Auth verified successfully");
    } catch (e: any) {
      console.error("[API] ❌ Auth failed:", e?.message || e);
      console.error("[API] Authorization header:", req.headers.authorization ? "present" : "missing");
      console.error("[API] Full error:", e);
      const code = e?.message === 'missing_bearer' ? 401 : 401;
      return sendJson(res, code, { error: 'Unauthorized', details: e?.message });
    }
    */
    try {
      sseHeaders(res);

      const form = formidable({ multiples: true });
      const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) return reject(err);
          resolve({ fields, files });
        });
      });

      // Added: Process file to get slides_struct
      let slides_struct: SlideStruct[] = [];
      const uploadedFile = (files.file as formidable.File[])?.[0];
      if (uploadedFile) {
        try {
           const zip = new AdmZip(uploadedFile.filepath);
           slides_struct = parseSlides(zip);
        } catch(e) {
           console.error("Failed to parse slides from zip:", e);
        }
      }

      const body = {
        summary: `${fields.target_person || ""} ${fields.goal || ""} ${fields.industry || ""}`.trim(),
        slides_text: slides_struct.map((s) => `Slide ${s.index}: ${s.title}\n${s.texts.join(" ")}`).join("\n\n"),
        slides_struct: slides_struct,
        speech_text: "",
      };
      const runtime = getRuntimeOptsFromBody(fields);
      const personasCfg = loadPersonas();

      const ac = new AbortController();
      req.on("close", () => ac.abort());

      const tasks = personasCfg.map((cfg) =>
        personaEvaluate(body, cfg, ac.signal, runtime)
          .then((p) => ({ status: "fulfilled", value: p, persona_id: cfg.persona_id }))
          .catch((reason) => ({ status: "rejected", reason, persona_id: cfg.persona_id }))
      );

      const personaOutputs: PersonaOutput[] = [];
      for (const task of tasks) {
        const result = await task;
        const output = result.status === "fulfilled" ? result.value : fallbackPersona(result.persona_id);
        console.log(`[Stream] Before validation for ${output.persona_id}:`, JSON.stringify(output).slice(0, 150));
        const validated = validateAndRepairJson(output, PersonaOutputSchema, "persona");
        console.log(`[Stream] After validation for ${output.persona_id}: ${validated ? 'OK' : 'NULL'}`);
        const final = validated ?? fallbackPersona(result.persona_id);
        personaOutputs.push(final);
        writeSse(res, "message", { type: "persona", data: validated });
      }

      let consensus = createConsensus(personaOutputs);
      
      if (runtime.useMastra) {
        try {
          consensus = await mastraMergeConsensus(personaOutputs, {
            provider: runtime.provider,
            model: runtime.mergeModel,
            timeoutMs: runtime.mergeTimeoutMs,
          });
        } catch(e) {
            console.error("Mastra consensus failed, falling back", e);
        }
      } else if (runtime.useLLM) {
        try {
          consensus = await llmMergeConsensusWithOpts(personaOutputs, {
            provider: runtime.provider,
            model: runtime.mergeModel,
            timeoutMs: runtime.mergeTimeoutMs,
          });
        } catch(e) {
             console.error("LLM consensus failed", e);
        }
      }

      writeSse(res, "message", { type: "consensus", data: consensus });
      writeSse(res, "done", { slides_struct }); // Send back struct for client visualization

      return res.end();
    } catch (e: any) {
      console.error("[serverless] /api/analyze/stream error:", e);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.end();
      }
    }
    return;
  }

  // analyze エンドポイントも残しておく
  if (req.method === "POST" && pathname === "/api/analyze") {
    console.log("[API] ⚠️ SKIPPING AUTH - FOR TESTING ONLY");
    /* TODO: Re-enable auth
    try {
      await verifyRequest(req);
    } catch (e: any) {
      const code = e?.message === 'missing_bearer' ? 401 : 401;
      return sendJson(res, code, { error: 'Unauthorized' });
    }
    */
    try {
      if (String(req.headers["content-type"] || "").startsWith("multipart/form-data")) {
        const form = formidable({ multiples: true });
        const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
          form.parse(req, (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
          });
        });

        const uploadedFile = (files.file as formidable.File[])?.[0];
        if (!uploadedFile) {
          return sendJson(res, 400, { message: "file is required" });
        }
        const zip = new AdmZip(uploadedFile.filepath);
        const slides_struct = parseSlides(zip);

        const body = {
          summary: `${fields.target_person || ""} ${fields.goal || ""} ${fields.industry || ""}`.trim(),
          slides_text: slides_struct.map((s) => `Slide ${s.index}: ${s.title}\n${s.texts.join(" ")}`).join("\n\n"),
          slides_struct: slides_struct,
          speech_text: "",
        };
        const runtime = getRuntimeOptsFromBody(fields);
        const analysisResult = await analyze(body, runtime);
        return sendJson(res, 200, analysisResult);
      } else {
        const body = req.body;
        const runtime = getRuntimeOptsFromBody(body || {});
        const result = await analyze(body, runtime);
        return sendJson(res, 200, result);
      }
    } catch (e: any) {
      console.error(`[serverless] /api/analyze error:`, e);
      return sendJson(res, 400, { error: "Bad Request", message: String(e?.message || e) });
    }
  }

  console.log("[API] 404 - No route matched. pathname:", pathname, "method:", req.method);
  res.status(404).json({ error: "Not Found", pathname, method: req.method });
}

// Vercelのレスポンス関数
function sendJson(res: VercelResponse, code: number, data: any) {
  res.status(code).json(data);
}

function sseHeaders(res: VercelResponse) {
  res.setHeader("Content-Type", "text/event-stream;charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
}

function writeSse(res: VercelResponse, event: string, data: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function handleOptions(res: VercelResponse) {
  res.status(204).send("");
}

// formidableの設定をVercel用に調整
const form = formidable({
  multiples: true,
  keepExtensions: true,
  maxFileSize: Number(process.env.MAX_UPLOAD_BYTES || 25 * 1024 * 1024),
  allowEmptyFiles: false,
});

// legacy: merged into extractPptxAll
async function extractPptxAll(filePath: string): Promise<{ text: string; slides: any[] }> {
    try {
      const zip = new AdmZip(filePath);
      const parser = new XMLParser({ ignoreAttributes: false, ignoreDeclaration: true, trimValues: true });
      const entries = zip.getEntries();
      const slides: any[] = [];
      const textChunks: string[] = [];
  
      const slideXmls = entries.filter((e) => /ppt\/slides\/slide\d+\.xml$/.test(e.entryName));
      for (const e of slideXmls) {
        const xml = e.getData().toString("utf-8");
        const doc = parser.parse(xml);
        const slideIdxMatch = e.entryName.match(/slide(\d+)\.xml$/);
        const index = slideIdxMatch ? Number(slideIdxMatch[1]) : slides.length + 1;
  
        const collectTexts = (node: any, out: string[]) => {
          if (!node || typeof node !== "object") return;
          for (const k of Object.keys(node)) {
            const v = node[k];
            if (k.endsWith(":t") || k === "a:t") {
              if (typeof v === "string") out.push(v);
            } else if (Array.isArray(v)) {
              v.forEach((x) => collectTexts(x, out));
            } else if (typeof v === "object") {
              collectTexts(v, out);
            }
          }
        };
        const texts: string[] = [];
        collectTexts(doc, texts);
  
        const countByKey = (node: any, matcher: (k: string) => boolean): number => {
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
        slides.push({ index, title: titleGuess, wordCount, imageCount, chartCount, shapeCount, texts: texts.slice(0, 30) });
        textChunks.push(`Slide ${index}: ${texts.join(" ")}`);
      }
  
      return { text: textChunks.join("\n"), slides };
    } catch (e) {
      return { text: "", slides: [] };
    }
  }
