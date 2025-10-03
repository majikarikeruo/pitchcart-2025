import 'dotenv/config';
import http from 'http';
import { parse as parseUrl } from 'url';
// Use specific imports to avoid conflicts
import { readFileSync, existsSync, createReadStream } from 'fs';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { fallbackPersona, makeResponse, validateAndRepairJson } from './schema.js';
import { PersonaOutputSchema } from './schema.js';
import { llmEvaluatePersonaWithOpts, llmMergeConsensusWithOpts, llmSimulateStructure, llmAnalyzeEmotionalArc } from './llm.js';
import { mastraEvaluatePersonas, mastraMergeConsensus } from './mastra.js';
import formidable from 'formidable';
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
// Function to parse basic slide structure
const parseSlides = (zip) => {
    const parser = new XMLParser({ ignoreAttributes: false, ignoreDeclaration: true, trimValues: true });
    const slideEntries = zip.getEntries().filter(e => /ppt\/slides\/slide\d+\.xml$/.test(e.entryName));
    const slides = [];
    for (const entry of slideEntries) {
        const xml = entry.getData().toString('utf-8');
        const doc = parser.parse(xml);
        const slideIdxMatch = entry.entryName.match(/slide(\d+)\.xml$/);
        const index = slideIdxMatch ? Number(slideIdxMatch[1]) : slides.length + 1;
        const texts = [];
        const collectTexts = (node) => {
            if (!node || typeof node !== 'object')
                return;
            for (const key in node) {
                if (key.endsWith(':t') || key === 'a:t') {
                    if (typeof node[key] === 'string')
                        texts.push(node[key]);
                }
                else if (Array.isArray(node[key])) {
                    node[key].forEach(collectTexts);
                }
                else if (typeof node[key] === 'object') {
                    collectTexts(node[key]);
                }
            }
        };
        collectTexts(doc);
        const countByKey = (node, matcher) => {
            let c = 0;
            const walk = (n) => {
                if (!n || typeof n !== 'object')
                    return;
                for (const k of Object.keys(n)) {
                    const v = n[k];
                    if (matcher(k))
                        c += 1;
                    if (Array.isArray(v))
                        v.forEach(walk);
                    else if (typeof v === 'object')
                        walk(v);
                }
            };
            walk(node);
            return c;
        };
        const imageCount = countByKey(doc, (k) => k.endsWith(':pic') || k === 'p:pic');
        const chartCount = countByKey(doc, (k) => k.endsWith(':chart') || k === 'c:chart');
        const shapeCount = countByKey(doc, (k) => k.endsWith(':sp') || k === 'p:sp');
        const titleGuess = texts[0]?.slice(0, 100) || '';
        const wordCount = texts.join(' ').split(/\s+/).filter(Boolean).length;
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
const PORT = Number(process.env.PORT || 8787);
const PERSONA_TIMEOUT_MS = Number(process.env.PERSONA_TIMEOUT_MS || 10000);
// Default behavior: LLM ON unless explicitly set to "false"
const ENV_USE_LLM = String(process.env.USE_LLM || '').toLowerCase();
const USE_LLM_DEFAULT = ENV_USE_LLM === '' ? true : ENV_USE_LLM === 'true';
const ENV_USE_MASTRA = String(process.env.USE_MASTRA || '').toLowerCase();
const USE_MASTRA_DEFAULT = ENV_USE_MASTRA === '' ? false : ENV_USE_MASTRA === 'true';
const LLM_PROVIDER_DEFAULT = (process.env.LLM_PROVIDER || '').toLowerCase();
const PERSONA_MODEL_DEFAULT = process.env.PERSONA_MODEL || '';
const MERGE_MODEL_DEFAULT = process.env.MERGE_MODEL || '';
// Harden server: log and keep process alive on unexpected errors
process.on('uncaughtException', (err) => {
    try {
        console.error('[server] uncaughtException:', err);
    }
    catch { }
});
process.on('unhandledRejection', (reason) => {
    try {
        console.error('[server] unhandledRejection:', reason);
    }
    catch { }
});
async function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', (chunk) => (raw += chunk));
        req.on('end', () => {
            try {
                const obj = raw ? JSON.parse(raw) : {};
                resolve(obj);
            }
            catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}
function loadPersonas() {
    const path = join(process.cwd(), 'config', 'personas.json');
    if (!existsSync(path))
        return [];
    const text = readFileSync(path, 'utf-8');
    return JSON.parse(text);
}
// Debug memory for last extraction (dev only)
let lastExtractDebug = null;
function heuristicScoreFromSlides(summary, slidesText, slidesStruct, weighting) {
    const text = `${summary || ''}\n${slidesText || ''}`.trim();
    const len = text.length;
    const sentences = (text.match(/[。\.\!\?]/g) || []).length;
    const words = (text.match(/\S+/g) || []).length;
    const slideCount = Array.isArray(slidesStruct) ? slidesStruct.length : Math.max(1, (slidesText.match(/Slide\s+\d+:/g) || []).length);
    const avgWordsPerSlide = slideCount ? Math.round(words / slideCount) : words;
    const imageHints = Array.isArray(slidesStruct) ? slidesStruct.reduce((s, x) => s + (Number(x?.imageCount || 0)), 0) : 0;
    const chartHints = Array.isArray(slidesStruct) ? slidesStruct.reduce((s, x) => s + (Number(x?.chartCount || 0)), 0) : 0;
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
    const wc = (v, w) => Math.round(Math.max(0, Math.min(100, v + (w / wsum - 1 / 3) * 10)));
    return {
        clarity: wc(clarity, weighting.clarity),
        uniqueness: wc(uniqueness, weighting.uniqueness),
        persuasiveness: wc(persuasiveness, weighting.persuasiveness),
    };
}
function getRuntimeOptsFromBody(body) {
    const normBool = (v, d) => {
        if (typeof v === 'boolean')
            return v;
        if (typeof v === 'string')
            return v.toLowerCase() === 'true';
        return d;
    };
    const toNum = (v, d) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? n : d;
    };
    return {
        useLLM: normBool(body?.use_llm, USE_LLM_DEFAULT),
        useMastra: normBool(body?.use_mastra, USE_MASTRA_DEFAULT),
        provider: (body?.llm_provider || LLM_PROVIDER_DEFAULT || '').toLowerCase() || undefined,
        personaModel: body?.persona_model || PERSONA_MODEL_DEFAULT || undefined,
        mergeModel: body?.merge_model || MERGE_MODEL_DEFAULT || undefined,
        personaTimeoutMs: toNum(body?.persona_timeout_ms, Number(process.env.PERSONA_TIMEOUT_MS || 10000)),
        mergeTimeoutMs: toNum(body?.merge_timeout_ms, Number(process.env.MERGE_TIMEOUT_MS || 10000)),
        detail: (['low', 'normal', 'high'].includes(String(body?.detail)) ? String(body?.detail) : undefined),
        slidesTextLimit: toNum(body?.slides_text_limit),
        evidenceMax: toNum(body?.evidence_max),
    };
}
function personaEvaluate(input, persona, signal, runtime) {
    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const onAbort = () => reject(new Error('timeout'));
        signal.addEventListener('abort', onAbort, { once: true });
        // Simulate async compute 100-500ms
        const delay = Math.floor(100 + Math.random() * 400);
        const timer = setTimeout(async () => {
            try {
                if (runtime.useLLM) {
                    const result = await llmEvaluatePersonaWithOpts(input, persona, {
                        provider: runtime.provider,
                        model: runtime.personaModel,
                        timeoutMs: runtime.personaTimeoutMs,
                        detail: runtime.detail || 'high',
                        slidesTextLimit: runtime.slidesTextLimit,
                        evidenceMax: runtime.evidenceMax,
                    });
                    // If LLM failed and returned generic fallback, synthesize heuristic result instead
                    const looksFallback = !result ||
                        (result.scores.clarity === 50 && result.scores.uniqueness === 50 && result.scores.persuasiveness === 50) ||
                        /暫定値/.test(result.summary || '') ||
                        (result.confidence ?? 0) < 0.5;
                    if (looksFallback) {
                        const summaryText = typeof input?.summary === 'string' ? input.summary : (input?.slides_summary || '');
                        const slidesText = String(input?.slides_text || '');
                        const slidesStruct = Array.isArray(input?.slides_struct) ? input.slides_struct : undefined;
                        const scores = heuristicScoreFromSlides(summaryText, slidesText, slidesStruct, persona.weighting);
                        const evidences = [];
                        if (Array.isArray(slidesStruct) && slidesStruct.length > 0) {
                            const best = slidesStruct
                                .slice(0, 10)
                                .sort((a, b) => (Number(b?.wordCount || 0) + Number(b?.chartCount || 0)) - (Number(a?.wordCount || 0) + Number(a?.chartCount || 0)))[0];
                            if (best) {
                                evidences.push({ slide: Number(best.index || 1), quote: String(best.title || (best.texts?.[0] || '')).slice(0, 60) });
                            }
                        }
                        if (evidences.length === 0 && slidesText) {
                            const m = slidesText.match(/Slide\s+(\d+):\s*([^\n]{10,80})/);
                            if (m)
                                evidences.push({ slide: Number(m[1]), quote: m[2] });
                        }
                        if (evidences.length === 0) {
                            evidences.push({ quote: (summaryText || '提案内容の要旨').slice(0, 60) });
                        }
                        const heuristic = {
                            persona_id: persona.persona_id,
                            summary: `${persona.role}視点: ${summaryText ? '初見評価を実施' : '資料テキストから推定'}`,
                            scores,
                            comment: `私は${persona.role}として評価します。${persona.tone}。自動代替（LLM失敗）としてヒューリスティック評価を提示します。`,
                            evidence: evidences.slice(0, 3),
                            confidence: (summaryText || slidesText) ? 0.6 : 0.45,
                        };
                        resolve(heuristic);
                    }
                    else {
                        resolve(result);
                    }
                }
                else {
                    const summaryText = typeof input?.summary === 'string' ? input.summary : (input?.slides_summary || '');
                    const slidesText = String(input?.slides_text || '');
                    const slidesStruct = Array.isArray(input?.slides_struct) ? input.slides_struct : undefined;
                    const scores = heuristicScoreFromSlides(summaryText, slidesText, slidesStruct, persona.weighting);
                    // evidence selection
                    const evidences = [];
                    if (Array.isArray(slidesStruct) && slidesStruct.length > 0) {
                        const best = slidesStruct
                            .slice(0, 10)
                            .sort((a, b) => (Number(b?.wordCount || 0) + Number(b?.chartCount || 0)) - (Number(a?.wordCount || 0) + Number(a?.chartCount || 0)))[0];
                        if (best) {
                            evidences.push({ slide: Number(best.index || 1), quote: String(best.title || (best.texts?.[0] || '')).slice(0, 60) });
                        }
                    }
                    if (evidences.length === 0 && slidesText) {
                        const m = slidesText.match(/Slide\s+(\d+):\s*([^\n]{10,80})/);
                        if (m)
                            evidences.push({ slide: Number(m[1]), quote: m[2] });
                    }
                    if (evidences.length === 0) {
                        evidences.push({ quote: (summaryText || '提案内容の要旨').slice(0, 60) });
                    }
                    const result = {
                        persona_id: persona.persona_id,
                        summary: `${persona.role}視点: ${summaryText ? '初見評価を実施' : '資料テキストから推定'}`,
                        scores,
                        comment: (() => {
                            const countSlides = Array.isArray(slidesStruct) ? slidesStruct.length : Math.max(1, (slidesText.match(/Slide\s+\d+:/g) || []).length);
                            const charts = Array.isArray(slidesStruct) ? slidesStruct.reduce((s, x) => s + Number(x?.chartCount || 0), 0) : 0;
                            const images = Array.isArray(slidesStruct) ? slidesStruct.reduce((s, x) => s + Number(x?.imageCount || 0), 0) : 0;
                            const firstTitle = Array.isArray(slidesStruct) && slidesStruct[0]?.title ? String(slidesStruct[0].title).slice(0, 40) : undefined;
                            return `私は${persona.role}として評価します。${persona.tone}。スライド${countSlides}枚、図表${charts}、画像${images}。` + (firstTitle ? `最初のタイトル「${firstTitle}」を確認。` : '');
                        })(),
                        evidence: evidences.slice(0, 2),
                        confidence: (summaryText || slidesText) ? 0.68 : 0.45,
                    };
                    resolve(result);
                }
            }
            catch (e) {
                reject(e);
            }
            finally {
                clearTimeout(timeoutId);
                signal.removeEventListener('abort', onAbort);
            }
        }, delay);
        const timeoutMs = Number(runtime.personaTimeoutMs || PERSONA_TIMEOUT_MS);
        const timeoutId = setTimeout(() => {
            controller.abort();
            reject(new Error('timeout'));
            clearTimeout(timer);
            signal.removeEventListener('abort', onAbort);
        }, timeoutMs);
    });
}
function createConsensus(personas) {
    const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
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
    const variance = (xs) => (xs.length ? avg(xs.map((x) => (x - avg(xs)) ** 2)) : 0);
    const stdev = (xs) => Math.sqrt(variance(xs));
    const sdClarity = stdev(cat.clarity);
    const sdUniq = stdev(cat.uniqueness);
    const sdPers = stdev(cat.persuasiveness);
    // Evidence stats (pick common slide numbers if present)
    const evidenceSlides = personas
        .flatMap((p) => (Array.isArray(p.evidence) ? p.evidence : []))
        .map((e) => (Number.isInteger(e.slide) ? Number(e.slide) : null))
        .filter((n) => n !== null);
    const slideCounts = new Map();
    for (const s of evidenceSlides)
        slideCounts.set(s, (slideCounts.get(s) || 0) + 1);
    const commonSlides = Array.from(slideCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([n]) => n)
        .slice(0, 3);
    const firstSlide = commonSlides[0] || 1;
    // Agreements: purely data-centric statements (no canned advice)
    const agreements = [];
    if (avgClarity < 85)
        agreements.push(`clarity avg=${avgClarity}`);
    if (avgUniq < 85)
        agreements.push(`uniqueness avg=${avgUniq}`);
    if (avgPers < 85)
        agreements.push(`persuasiveness avg=${avgPers}`);
    if (agreements.length === 0)
        agreements.push(`balanced scores overall=${overall}`);
    // Disagreements: where stdev is high, include sigma
    const disagreements = [];
    if (sdUniq > 8)
        disagreements.push(`独自性評価のばらつき（σ=${sdUniq.toFixed(1)}）`);
    if (sdPers > 8 && disagreements.length < 2)
        disagreements.push(`説得力評価のばらつき（σ=${sdPers.toFixed(1)}）`);
    if (sdClarity > 8 && disagreements.length < 2)
        disagreements.push(`明確性評価のばらつき（σ=${sdClarity.toFixed(1)}）`);
    // Top TODOs: metric-style, assembled from data only (no canned phrasing)
    const entries = [
        { key: 'clarity', avg: avgClarity },
        { key: 'uniqueness', avg: avgUniq },
        { key: 'persuasiveness', avg: avgPers },
    ].sort((a, b) => a.avg - b.avg);
    const top_todos = [];
    for (const e of entries) {
        if (top_todos.length >= 3)
            break;
        if (e.avg < 85) {
            const label = e.key;
            const title = String((personas[0]?.evidence?.find(ev => ev.slide === firstSlide)?.quote) || '').slice(0, 30);
            const slidesHint = commonSlides.length ? `slides=${commonSlides.join(',')}` : `slide=${firstSlide}`;
            top_todos.push(`${label}: avg=${e.avg} (<85), focus_${slidesHint}${title ? `, hint="${title}"` : ''}`);
            continue;
        }
    }
    if (top_todos.length === 0)
        top_todos.push(`stability: overall=${overall}`);
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
async function analyze(input, runtime) {
    const personasCfg = loadPersonas();
    // If we receive raw slides text/speech text, optionally summarize here (LLM/Mastra)
    let personaOutputs = [];
    if (runtime.useMastra) {
        // Route through Mastra adapter (falls back to LLM path if Mastra not present)
        personaOutputs = await mastraEvaluatePersonas(input, personasCfg, {
            provider: runtime.provider,
            model: runtime.personaModel,
            timeoutMs: runtime.personaTimeoutMs,
        }).catch(async () => {
            const ac = new AbortController();
            const tasks = personasCfg.map((cfg) => personaEvaluate(input, cfg, ac.signal, runtime).then((p) => ({ status: 'fulfilled', value: p }), (e) => ({ status: 'rejected', reason: e, persona_id: cfg.persona_id })));
            const settled = await Promise.all(tasks);
            return settled.map((r, idx) => (r.status === 'fulfilled' ? r.value : fallbackPersona(r.persona_id || personasCfg[idx]?.persona_id || `persona_${idx}`)));
        });
    }
    else {
        const ac = new AbortController();
        const tasks = personasCfg.map((cfg) => personaEvaluate(input, cfg, ac.signal, runtime).then((p) => ({ status: 'fulfilled', value: p }), (e) => ({ status: 'rejected', reason: e, persona_id: cfg.persona_id })));
        const settled = await Promise.all(tasks);
        personaOutputs = settled.map((r, idx) => (r.status === 'fulfilled' ? r.value : fallbackPersona(r.persona_id || personasCfg[idx]?.persona_id || `persona_${idx}`)));
    }
    // Validate/repair each persona output; fallback only if invalid
    const repaired = personaOutputs.map((p) => validateAndRepairJson(p, PersonaOutputSchema, 'persona') ?? fallbackPersona(p.persona_id));
    let consensus = createConsensus(repaired);
    if (runtime.useMastra) {
        try {
            consensus = await mastraMergeConsensus(repaired, {
                provider: runtime.provider,
                model: runtime.mergeModel,
                timeoutMs: runtime.mergeTimeoutMs,
            });
        }
        catch { }
    }
    else if (runtime.useLLM) {
        try {
            consensus = await llmMergeConsensusWithOpts(repaired, {
                provider: runtime.provider,
                model: runtime.mergeModel,
                timeoutMs: runtime.mergeTimeoutMs,
            });
        }
        catch { }
    }
    const response = makeResponse(repaired, consensus, input?.slides_struct);
    return response;
}
function sendJson(res, code, data) {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(data));
}
function handleOptions(res) {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    // Accept や Authorization など、ブラウザが要求してくる一般的なヘッダを許可
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
    // 認証は現状未使用だが、将来に備えて明示
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.end();
}
function sseHeaders(res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    // avoid proxy buffering (if any)
    res.setHeader('X-Accel-Buffering', 'no');
}
function writeSse(res, event, data) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
}
// legacy: merged into extractPptxAll
async function extractPptxAll(filePath) {
    try {
        const zip = new AdmZip(filePath);
        const parser = new XMLParser({ ignoreAttributes: false, ignoreDeclaration: true, trimValues: true });
        const entries = zip.getEntries();
        const slides = [];
        const textChunks = [];
        const slideXmls = entries.filter((e) => /ppt\/slides\/slide\d+\.xml$/.test(e.entryName));
        for (const e of slideXmls) {
            const xml = e.getData().toString('utf-8');
            const doc = parser.parse(xml);
            const slideIdxMatch = e.entryName.match(/slide(\d+)\.xml$/);
            const index = slideIdxMatch ? Number(slideIdxMatch[1]) : slides.length + 1;
            const collectTexts = (node, out) => {
                if (!node || typeof node !== 'object')
                    return;
                for (const k of Object.keys(node)) {
                    const v = node[k];
                    if (k.endsWith(':t') || k === 'a:t') {
                        if (typeof v === 'string')
                            out.push(v);
                    }
                    else if (Array.isArray(v)) {
                        v.forEach((x) => collectTexts(x, out));
                    }
                    else if (typeof v === 'object') {
                        collectTexts(v, out);
                    }
                }
            };
            const texts = [];
            collectTexts(doc, texts);
            const countByKey = (node, matcher) => {
                let c = 0;
                const walk = (n) => {
                    if (!n || typeof n !== 'object')
                        return;
                    for (const k of Object.keys(n)) {
                        const v = n[k];
                        if (matcher(k))
                            c += 1;
                        if (Array.isArray(v))
                            v.forEach(walk);
                        else if (typeof v === 'object')
                            walk(v);
                    }
                };
                walk(node);
                return c;
            };
            const imageCount = countByKey(doc, (k) => k.endsWith(':pic') || k === 'p:pic');
            const chartCount = countByKey(doc, (k) => k.endsWith(':chart') || k === 'c:chart');
            const shapeCount = countByKey(doc, (k) => k.endsWith(':sp') || k === 'p:sp');
            const titleGuess = texts[0]?.slice(0, 100) || '';
            const wordCount = texts.join(' ').split(/\s+/).filter(Boolean).length;
            slides.push({ index, title: titleGuess, wordCount, imageCount, chartCount, shapeCount, texts: texts.slice(0, 30) });
            textChunks.push(`Slide ${index}: ${texts.join(' ')}`);
        }
        return { text: textChunks.join('\n'), slides };
    }
    catch (e) {
        return { text: '', slides: [] };
    }
}
const server = http.createServer(async (req, res) => {
    const { pathname } = parseUrl(req.url || '/', true);
    if (req.method === 'OPTIONS')
        return handleOptions(res);
    // Health check
    if (req.method === 'GET' && pathname === '/api/health') {
        return sendJson(res, 200, { ok: true, version: 'v1.0' });
    }
    // Runtime status (debug)
    if (req.method === 'GET' && pathname === '/api/debug/status') {
        return sendJson(res, 200, {
            USE_LLM: USE_LLM_DEFAULT,
            USE_MASTRA: USE_MASTRA_DEFAULT,
            LLM_PROVIDER: LLM_PROVIDER_DEFAULT,
            PERSONA_MODEL: PERSONA_MODEL_DEFAULT,
            MERGE_MODEL: MERGE_MODEL_DEFAULT,
        });
    }
    // Personas config
    if (req.method === 'GET' && pathname === '/api/personas') {
        return sendJson(res, 200, { personas: loadPersonas() });
    }
    if (req.method === 'POST' && pathname === '/api/analyze') {
        try {
            // request start log (minimal)
            if (String(process.env.LOG_ANALYSIS || '').toLowerCase() === 'true') {
                console.log(`[server] POST /api/analyze ctype=${req.headers['content-type']}`);
            }
            const ctype = String(req.headers['content-type'] || '');
            if (ctype.startsWith('multipart/form-data')) {
                const { fields, files } = await new Promise((resolve, reject) => {
                    const form = formidable({
                        multiples: true,
                        keepExtensions: true,
                        maxFileSize: Number(process.env.MAX_UPLOAD_BYTES || 25 * 1024 * 1024),
                        allowEmptyFiles: false,
                    });
                    form.parse(req, (err, fields, files) => {
                        if (err)
                            return reject(err);
                        resolve({ fields, files });
                    });
                });
                const uploadedFile = files.file?.[0];
                const speechFile = files.speech_text?.[0];
                if (!uploadedFile) {
                    return sendJson(res, 400, { message: 'file is required' });
                }
                const zip = new AdmZip(uploadedFile.filepath);
                const slides_struct = parseSlides(zip);
                let slidesText = slides_struct.map(s => `Slide ${s.index}: ${s.title}\n${s.texts.join(' ')}`).join('\n\n');
                let speechText = '';
                if (speechFile?.filepath) {
                    try {
                        speechText = await fsPromises.readFile(speechFile.filepath, 'utf-8');
                    }
                    catch (e) {
                        console.error("Could not read speech file", e);
                    }
                }
                const getFirst = (v) => (Array.isArray(v) ? v[0] : v);
                const meta = {
                    target_person: String(getFirst(fields.target_person) || ''),
                    goal: String(getFirst(fields.goal) || ''),
                    industry: String(getFirst(fields.industry) || ''),
                };
                const summarySeed = `${meta.industry} ${meta.goal} ${meta.target_person}`.trim();
                const body = { summary: summarySeed, slides_text: slidesText, slides_struct: slides_struct, speech_text: speechText };
                const runtime = getRuntimeOptsFromBody({
                    use_llm: getFirst(fields.use_llm),
                    use_mastra: getFirst(fields.use_mastra),
                    llm_provider: getFirst(fields.llm_provider),
                    persona_model: getFirst(fields.persona_model),
                    merge_model: getFirst(fields.merge_model),
                    persona_timeout_ms: getFirst(fields.persona_timeout_ms),
                    merge_timeout_ms: getFirst(fields.merge_timeout_ms),
                });
                const analysisResult = await analyze(body, runtime);
                return sendJson(res, 200, analysisResult);
            }
            else {
                const body = await readJsonBody(req);
                const runtime = getRuntimeOptsFromBody(body || {});
                const result = await analyze(body, runtime);
                return sendJson(res, 200, result);
            }
        }
        catch (e) {
            console.error('[server] /api/analyze error:', e);
            return sendJson(res, 400, { error: 'Bad Request', message: String(e?.message || e) });
        }
    }
    if (req.method === 'POST' && pathname === '/api/analyze/stream') {
        try {
            if (String(process.env.LOG_ANALYSIS || '').toLowerCase() === 'true') {
                console.log(`[server] POST /api/analyze/stream ctype=${req.headers['content-type']}`);
            }
            const ctype = String(req.headers['content-type'] || '');
            let body = {};
            if (ctype.startsWith('multipart/form-data')) {
                const { fields, files } = await new Promise((resolve, reject) => {
                    const form = formidable({
                        multiples: true,
                        keepExtensions: true,
                        maxFileSize: Number(process.env.MAX_UPLOAD_BYTES || 25 * 1024 * 1024),
                        allowEmptyFiles: false,
                    });
                    form.parse(req, (err, fields, files) => {
                        if (err)
                            return reject(err);
                        resolve({ fields, files });
                    });
                });
                const pptx = Array.isArray(files.file) ? files.file[0] : files.file;
                const speech = Array.isArray(files.speech_text) ? files.speech_text[0] : files.speech_text;
                let slidesText = '';
                let slidesStruct = [];
                if (pptx?.filepath && String(pptx.originalFilename || '').toLowerCase().endsWith('.pptx')) {
                    const ext = await extractPptxAll(pptx.filepath);
                    slidesText = ext.text;
                    slidesStruct = ext.slides;
                    if (String(process.env.LOG_ANALYSIS || '').toLowerCase() === 'true') {
                        const titles = ext.slides.map((s) => String(s?.title || '')).filter(Boolean).slice(0, 5);
                        console.log(`[server] extract pptx: slides=${ext.slides.length} titles=${JSON.stringify(titles)}`);
                    }
                    lastExtractDebug = { slidesCount: Array.isArray(ext.slides) ? ext.slides.length : 0, sampleTitles: Array.isArray(ext.slides) ? ext.slides.map((s) => String(s?.title || '')).filter(Boolean).slice(0, 3) : [] };
                }
                let speechText = '';
                if (speech?.filepath) {
                    try {
                        speechText = await fsPromises.readFile(speech.filepath, 'utf-8');
                    }
                    catch { }
                }
                const getFirst2 = (v) => (Array.isArray(v) ? v[0] : v);
                const meta = {
                    target_person: String(getFirst2(fields.target_person) || ''),
                    goal: String(getFirst2(fields.goal) || ''),
                    industry: String(getFirst2(fields.industry) || ''),
                };
                const summarySeed = `${meta.industry} ${meta.goal} ${meta.target_person}`.trim();
                body = { summary: summarySeed, slides_text: slidesText, slides_struct: slidesStruct, speech_text: speechText };
            }
            else {
                body = await readJsonBody(req);
            }
            const personasCfg = loadPersonas();
            const runtime = getRuntimeOptsFromBody(body || {});
            sseHeaders(res);
            if (typeof res.flushHeaders === 'function') {
                try {
                    res.flushHeaders();
                }
                catch { }
            }
            // Start persona tasks
            const ac = new AbortController();
            const tasks = personasCfg.map((cfg) => personaEvaluate(body, cfg, ac.signal, runtime).then((p) => ({ type: 'persona', data: p, persona_id: cfg.persona_id }), () => ({ type: 'persona', data: fallbackPersona(cfg.persona_id), persona_id: cfg.persona_id })));
            // As-completed streaming
            const pending = new Set(tasks);
            const safeWrite = (fn) => { try {
                if (!res.writableEnded)
                    fn();
            }
            catch { } };
            tasks.forEach((t) => {
                t.then((msg) => {
                    const data = validateAndRepairJson(msg.data, PersonaOutputSchema, 'persona') ?? fallbackPersona(msg.persona_id);
                    safeWrite(() => writeSse(res, 'message', { type: 'persona', data }));
                    pending.delete(t);
                });
            });
            // Wait all, then send consensus
            const settled = await Promise.allSettled(tasks);
            const personaOutputs = settled.map((r, idx) => (r.status === 'fulfilled' ? r.value.data : null) || fallbackPersona(personasCfg[idx].persona_id));
            let consensus = createConsensus(personaOutputs);
            if (runtime.useMastra) {
                try {
                    consensus = await mastraMergeConsensus(personaOutputs, { provider: runtime.provider, model: runtime.mergeModel, timeoutMs: runtime.mergeTimeoutMs });
                }
                catch { }
            }
            else if (runtime.useLLM) {
                try {
                    consensus = await llmMergeConsensusWithOpts(personaOutputs, { provider: runtime.provider, model: runtime.mergeModel, timeoutMs: runtime.mergeTimeoutMs });
                }
                catch { }
            }
            safeWrite(() => writeSse(res, 'message', { type: 'consensus', data: consensus }));
            safeWrite(() => writeSse(res, 'done', {}));
            if (!res.writableEnded)
                res.end();
            res.on('error', () => { try {
                res.end();
            }
            catch { } });
            res.on('close', () => { try {
                ac.abort();
            }
            catch { } });
            return;
        }
        catch (e) {
            console.error('[server] /api/analyze/stream error:', e);
            res.statusCode = 500;
            res.end();
            return;
        }
    }
    if (req.method === 'POST' && pathname === '/api/simulate/structure') {
        try {
            const body = await readJsonBody(req);
            const runtime = getRuntimeOptsFromBody(body || {});
            // We need slides_struct from the original analysis data.
            // In a real app, this would likely be passed from the client,
            // which would have the full analysis response.
            // For now, we'll use a placeholder or assume it's passed in the body.
            const slidesStruct = body.slides_struct || [];
            if (slidesStruct.length === 0) {
                return sendJson(res, 400, { error: 'Bad Request', message: 'slides_struct is required for simulation.' });
            }
            const result = await llmSimulateStructure(slidesStruct, {
                provider: runtime.provider,
                model: runtime.mergeModel,
                timeoutMs: runtime.mergeTimeoutMs,
            });
            return sendJson(res, 200, result);
        }
        catch (e) {
            console.error('[server] /api/simulate/structure error:', e);
            return sendJson(res, 500, { error: 'Internal Server Error', message: String(e?.message || e) });
        }
    }
    if (req.method === 'POST' && pathname === '/api/analyze/emotional_arc') {
        try {
            const jsonBody = await readJsonBody(req);
            const slides_struct = jsonBody.slides_struct;
            if (!slides_struct) {
                return sendJson(res, 400, { message: 'slides_struct is required' });
            }
            const result = await llmAnalyzeEmotionalArc(slides_struct, {});
            return sendJson(res, 200, result);
        }
        catch (error) {
            console.error('[/api/analyze/emotional_arc] error:', error);
            return sendJson(res, 500, { message: error.message });
        }
    }
    // Serve sample JSON for convenience
    if (req.method === 'GET' && pathname === '/api/sample') {
        const samplePath = join(process.cwd(), 'docs', 'sample-analysis-response.json');
        if (existsSync(samplePath)) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            createReadStream(samplePath).pipe(res);
        }
        else {
            sendJson(res, 404, { error: 'Not Found' });
        }
        return;
    }
    // Debug: return last extraction summary
    if (req.method === 'GET' && pathname === '/api/debug/extract') {
        return sendJson(res, 200, lastExtractDebug || { slidesCount: 0, sampleTitles: [] });
    }
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify({ error: 'Not Found' }));
});
server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on http://localhost:${PORT}`);
    console.log(`[server] defaults USE_MASTRA=${USE_MASTRA_DEFAULT} USE_LLM=${USE_LLM_DEFAULT} LLM_PROVIDER=${LLM_PROVIDER_DEFAULT} PERSONA_MODEL=${PERSONA_MODEL_DEFAULT} MERGE_MODEL=${MERGE_MODEL_DEFAULT}`);
});
