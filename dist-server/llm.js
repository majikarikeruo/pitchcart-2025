import 'dotenv/config';
import { getLlmClient } from './llm_client.js';
import { PersonaOutputSchema, ConsensusSchema, EmotionalArcSchema, StructureSimulationSchema, // Added import
validateAndRepairJson, fallbackPersona, } from './schema.js';
// --- DUMMY DATA ---
const DUMMY_EMOTIONAL_ARC = {
    title: 'プレゼンテーションの感情アーク分析',
    summary: 'このプレゼンテーションは、序盤で聞き手の課題への共感を呼び、中盤で解決策への期待感を高め、終盤で具体的な行動を促す納得感を与える構成になっています。特に、顧客の成功事例を提示するスライドで感情のピークを迎えます。',
    points: [
        { slide: 1, emotion: '興味', intensity: 0.6, reason: '問題提起により、聞き手の関心を引きつけています。' },
        { slide: 3, emotion: '共感', intensity: 0.8, reason: '具体的な課題を示すことで、強い共感を生んでいます。' },
        { slide: 6, emotion: '期待', intensity: 0.9, reason: '解決策の提示が、未来への期待感を大きく膨らせています。' },
        { slide: 9, emotion: '納得', intensity: 0.8, reason: 'ビジネスモデルの説明が、事業の実現可能性を納得させています。' },
        { slide: 12, emotion: '興奮', intensity: 1.0, reason: '将来の展望が、聞き手の興奮を最高潮に高めます。' },
    ],
};
// --- PROMPTS ---
const PERSONA_SYSTEM_PROMPTS = {
    vc_seed: `あなたはシードステージのVCだ。投資判断のために、極めて厳しい視点でピッチを評価する。事業としての成立可能性を評価しろ。特に以下の点を重点的に確認し、一人称で厳しくコメントすること：
- **前提の欠如:** 専門用語が説明なく使われていないか？なぜこのチームがやるのか(Why us?)、なぜ今なのか(Why now?)が明確に語られているか？聞き手を置いてけぼりにする表現は許さない。
- **市場と顧客:** TAM/SAM/SOMは妥当か？最初の顧客(IUC)は誰で、どう獲得するのか？机上の空論ではなく、具体的なアクションプランを要求する。
- **事業性:** ビジネスモデルは明確か？収益を上げるための具体的な数字はあるか？根拠のない主張やフワッとした見込みは厳しく指摘しろ。
各主張には必ず根拠（slide番号/引用）と確信度(0-1)を付すこと。
**さらに、最も重要だと感じたスライドを最大3枚選び、slide_evaluationsとして個別の評価コメントを生成すること。**
応答はJSONのみ。`,
    accelerator_judge: `あなたはアクセラレーターの審査員だ。3ヶ月で急成長できるポテンシャルがあるかを見極める。特に以下の点を重点的に確認し、一人称で建設的にコメントすること：
- **チームの実行力:** 課題解決へのアプローチは妥当か？学習サイクルを高速で回せるチームか？過去の実績やチーム構成からそのポテンシャルを評価しろ。
- **マイルストーン:** 3ヶ月後、半年後の具体的な目標(KPI)は明確か？その目標は野心的かつ達成可能か？
- **プロダクトの拡張性:** このプロダクトは単なる一点ものか？将来的に大きな事業にスケールする可能性はあるか？
各主張には必ず根拠（slide番号/引用）と確信度(0-1)を付すこと。
**さらに、最も重要だと感じたスライドを最大3枚選び、slide_evaluationsとして個別の評価コメントを生成すること。**
応答はJSONのみ。`,
    early_user: `あなたはこのプロダクトが解決しようとしている課題に日々直面しているアーリーアダプターだ。ユーザーとしての本音を率直に伝える。特に以下の点を重点的に確認し、一人称でコメントすること：
- **課題への共感:** 提示された課題は、本当に「自分の課題」だと感じるか？解像度は高いか？
- **解決策への期待:** このプロダクトは本当に自分の課題を解決してくれそうか？具体的な利用シーンがイメージできるか？「これがあれば今すぐお金を払う」と思えるか？
- **UI/UX:** コンセプトだけでなく、実際の使いやすさはどうか？デモや画面イメージから、直感的に使えるかどうかを判断しろ。
各主張には必ず根拠（slide番号/引用）と確信度(0-1)を付すこと。
**さらに、最も重要だと感じたスライドを最大3枚選び、slide_evaluationsとして個別の評価コメントを生成すること。**
応答はJSONのみ。`,
};
// --- HELPERS ---
const log = (message, ...args) => {
    if (String(process.env.LOG_ANALYSIS || '').toLowerCase() === 'true') {
        console.log(message, ...args);
    }
};
// --- CORE FUNCTIONS ---
export async function llmEvaluatePersona(input, persona) {
    return llmEvaluatePersonaWithOpts(input, persona, {});
}
export async function llmEvaluatePersonaWithOpts(input, persona, opts) {
    const client = getLlmClient(opts.provider);
    if (!client) {
        log(`[llm] persona=${persona.persona_id} DUMMY MODE`);
        return new Promise(r => setTimeout(() => r(fallbackPersona(persona.persona_id)), 500));
    }
    const model = opts.model || process.env.PERSONA_MODEL || 'gpt-4o-mini';
    const system = PERSONA_SYSTEM_PROMPTS[persona.persona_id] || 'あなたは評価者です。';
    const user = `入力サマリ: ${typeof input?.summary === 'string' ? input.summary : (input?.slides_summary || '')}\nスライド抽出テキスト: ${input?.slides_text || ''}\nスライド構造: ${JSON.stringify(Array.isArray(input?.slides_struct) ? input?.slides_struct.slice(0, 30) : []).slice(0, 20)}\nトーン: ${persona.tone}\n重み: clarity=${persona.weighting.clarity}, uniqueness=${persona.weighting.uniqueness}, persuasiveness=${persona.weighting.persuasiveness}\n出力方針: ${opts.detail === 'high' ? `コメントは6-10文で具体的に。evidenceは最大${opts.evidenceMax || 5}件。各スコアの根拠に触れる。` : opts.detail === 'normal' ? `コメントは4-6文で要点を具体的に。evidenceは最大${opts.evidenceMax || 5}件。` : `コメントは3-4文で簡潔に。evidenceは最大${opts.evidenceMax || 5}件。`}\nスキーマ: PersonaOutput = { persona_id: string; summary: string; scores: {clarity:number(0-100整数); uniqueness:number(0-100整数); persuasiveness:number(0-100整数)}; comment: string; evidence: {slide?: number; quote?: string}[]; confidence: number; slide_evaluations?: {slide: number; comment: string}[] }\n必ず persona_id='${persona.persona_id}' を含め、このスキーマのJSONだけを返す。`;
    try {
        const tStart = Date.now();
        const res = await client.post(client.endpoints.chat, {
            model,
            messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
            response_format: { type: 'json_object' },
            max_tokens: 2048,
        });
        log(`[llm] persona=${persona.persona_id} provider=${client.provider} model=${model} duration_ms=${Date.now() - tStart}`);
        const rawContent = res.data?.choices?.[0]?.message?.content || '';
        log(`[llm] RAW RESPONSE for persona=${persona.persona_id}:`, rawContent);
        const repaired = validateAndRepairJson(rawContent, PersonaOutputSchema, `persona_${persona.persona_id}`);
        return repaired || fallbackPersona(persona.persona_id);
    }
    catch (e) {
        console.error(`[llm] detailed error for persona=${persona.persona_id}:`, e);
        return fallbackPersona(persona.persona_id);
    }
}
export async function llmMergeConsensus(personas) {
    return llmMergeConsensusWithOpts(personas, {});
}
export async function llmMergeConsensusWithOpts(personas, opts) {
    const client = getLlmClient(opts.provider);
    if (!client) {
        log(`[llm] consensus DUMMY MODE (no api key)`);
        // NOTE: This now hits the local fallback logic directly.
        return llmMergeConsensusWithOpts(personas, { ...opts, provider: 'dummy' });
    }
    const model = opts.model || process.env.MERGE_MODEL || 'gpt-4o';
    const system = `あなたは複数の審査員の評価から合議を作る。レイアウト/視覚情報への言及は、各審査員の根拠と一致する場合のみ採用する。応答はJSONのみ（余分な説明禁止）。`;
    const user = `入力: ${JSON.stringify(personas).slice(0, 12000)}\nスキーマ: Consensus = { agreements: string[]; disagreements: string[]; overall_score: number; top_todos: string[]; what_if?: { change: string; expected_gain: number; uncertainty: number }[] }\n必ずこのスキーマのJSONだけを返す。`;
    try {
        const tStart = Date.now();
        const res = await client.post(client.endpoints.chat, {
            model,
            messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
            response_format: { type: 'json_object' },
            max_tokens: 2048,
        });
        log(`[llm] consensus provider=${client.provider} model=${model} duration_ms=${Date.now() - tStart}`);
        const rawContent = res.data?.choices?.[0]?.message?.content || '';
        const repaired = validateAndRepairJson(rawContent, ConsensusSchema, 'consensus');
        return repaired || { agreements: [], disagreements: [], overall_score: 0, top_todos: [], what_if: [] };
    }
    catch (e) {
        console.error(`[llm] detailed consensus error:`, e);
        // Dynamic local consensus fallback (no static strings)
        const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
        const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
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
        const sdUniq = stdev(cat.uniqueness);
        const sdPers = stdev(cat.persuasiveness);
        const agreements = [];
        if (avgClarity < 85)
            agreements.push(`clarity avg=${avgClarity}`);
        if (avgUniq < 85)
            agreements.push(`uniqueness avg=${avgUniq}`);
        if (avgPers < 85)
            agreements.push(`persuasiveness avg=${avgPers}`);
        if (agreements.length === 0)
            agreements.push(`balanced scores overall=${overall}`);
        const disagreements = [];
        if (sdUniq > 8)
            disagreements.push(`uniqueness stdev=${sdUniq.toFixed(1)}`);
        if (sdPers > 8 && disagreements.length < 2)
            disagreements.push(`persuasiveness stdev=${sdPers.toFixed(1)}`);
        const entries = [
            { key: 'clarity', avg: avgClarity },
            { key: 'uniqueness', avg: avgUniq },
            { key: 'persuasiveness', avg: avgPers },
        ].sort((a, b) => a.avg - b.avg);
        const top_todos = [];
        const slidesHint = personas
            .flatMap((p) => (Array.isArray(p.evidence) ? p.evidence : []))
            .map((e) => (Number.isInteger(e.slide) ? Number(e.slide) : null))
            .filter((n) => n !== null)
            .slice(0, 3);
        for (const e2 of entries) {
            if (top_todos.length >= 3)
                break;
            if (e2.avg < 85) {
                const hint = slidesHint.length ? `slides=${slidesHint.join(',')}` : '';
                top_todos.push(`${e2.key}: avg=${e2.avg} (<85) ${hint}`.trim());
            }
        }
        if (top_todos.length === 0)
            top_todos.push(`stability: overall=${overall}`);
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
}
export async function llmSimulateStructure(slidesStruct, opts) {
    const client = getLlmClient(opts.provider);
    if (!client) {
        log(`[llm] simulateStructure DUMMY MODE (no api key)`);
        return new Promise((resolve) => {
            setTimeout(() => resolve({
                simulation_type: 'prep',
                title: 'PREP法に基づく構成案',
                steps: [
                    {
                        title: 'Point (結論)',
                        slide_indices: [1, 2],
                        description: 'まず、スライド1,2を使い、誰のどんな課題を解決するのか、その結論を最初に提示します。',
                    },
                    {
                        title: 'Reason (理由)',
                        slide_indices: [3, 4, 5],
                        description: '次に、スライド3,4,5で、なぜその課題が重要なのか、市場にどんなペインが存在するのかをデータや顧客の声で裏付けます。',
                    },
                    {
                        title: 'Example (具体例)',
                        slide_indices: [6, 7, 8, 9],
                        description: 'そして、スライド6-9で、プロダクトのデモや具体的なユースケースを示し、どのように課題を解決するのかを具体的に伝えます。',
                    },
                    {
                        title: 'Point (結論の再提示)',
                        slide_indices: [10, 11, 12],
                        description: '最後に、スライド10-12で、ビジネスモデルやチームを紹介し、この事業が成功する必然性を改めて強調して締めくくります。',
                    },
                ],
            }), 1000);
        });
    }
    const model = opts.model || process.env.MERGE_MODEL || 'gpt-4o';
    const slideTitles = slidesStruct.map((s) => `Slide ${s.index}: ${s.title}`).join('\n');
    const system = `あなたは優秀な構成作家です。与えられたスライドの構成案を、聞き手にとって最も分かりやすく説得力のある「PREP法（Point, Reason, Example, Point）」に基づいて再構成し、提案してください。応答は指定されたJSON形式以外を一切含んではいけません。`;
    const user = `以下のスライド構成をPREP法で再構成してください。各ステップで言及するスライド番号は、必ずしも連番である必要はありません。文脈に応じて柔軟にグループ化してください。

現在の構成:
${slideTitles}

出力スキーマ:
StructureSimulation = {
  simulation_type: "prep";
  title: string; // "PREP法に基づく構成案"など
  steps: {
    title: string; // "Point (結論)" など
    slide_indices: number[]; // このステップで使うべきスライド番号の配列
    description: string; // このステップで何を語るべきかの簡潔な説明
  }[];
}
`;
    try {
        const tStart = Date.now();
        const res = await client.post(client.endpoints.chat, {
            model,
            messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
            response_format: { type: 'json_object' },
            max_tokens: 2048,
        });
        log(`[llm] simulateStructure provider=${client.provider} model=${model} duration_ms=${Date.now() - tStart}`);
        const rawContent = res.data?.choices?.[0]?.message?.content || '{}';
        const repaired = validateAndRepairJson(rawContent, StructureSimulationSchema, 'structure_simulation');
        if (repaired) {
            return repaired;
        }
        throw new Error('invalid structure simulation');
    }
    catch (e) {
        console.error(`[llm] detailed simulateStructure error:`, e);
        throw new Error(`Failed to simulate structure: ${e.message}`);
    }
}
export async function llmAnalyzeEmotionalArc(slides_struct, opts) {
    const isLoggingEnabled = opts.log ?? true;
    const client = getLlmClient(opts.provider);
    if (!client) {
        if (isLoggingEnabled) {
            console.log(`[llm] analyzeEmotionalArc DUMMY MODE (no api key)`);
        }
        return new Promise((resolve) => {
            setTimeout(() => resolve(DUMMY_EMOTIONAL_ARC), 1000);
        });
    }
    const model = opts.model || process.env.EMOTIONAL_ARC_MODEL || 'gpt-4o';
    const system = `あなたはプロのストーリーテリングコンサルタントです。以下のスライド構成を分析し、聞き手が体験する感情の起伏（感情アーク）を分析してください。最終的なアウトプットは、指定されたJSON形式に従ってください。`;
    const user = `
# 分析対象スライド
${slides_struct.map((s) => `## スライド ${s.index}: ${s.title}\n${s.texts.join('\n')}`).join('\n\n')}

# 出力形式
\`\`\`json
{
  "title": "プレゼンテーションの感情アーク分析",
  "summary": "（ここに感情アーク全体の要約を記述）",
  "points": [
    {
      "slide": "（スライド番号）",
      "emotion": "（特定した感情名）",
      "intensity": "（感情の強度 0.0-1.0）",
      "reason": "（なぜその感情が引き起こされるのかの簡潔な解説）"
    }
  ]
}
\`\`\`
`;
    try {
        const tStart = Date.now();
        const res = await client.post(client.endpoints.chat, {
            model,
            messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
            response_format: { type: 'json_object' },
            max_tokens: 2048,
        });
        if (isLoggingEnabled) {
            console.log(`[llm] analyzeEmotionalArc provider=${client.provider} model=${model} duration_ms=${Date.now() - tStart}`);
        }
        const rawContent = res.data.choices[0].message.content || '{}';
        const repaired = validateAndRepairJson(rawContent, EmotionalArcSchema, 'emotional_arc');
        if (!repaired) {
            console.error(`[llm] Failed to validate or repair emotional arc JSON.`);
            return {
                title: "分析失敗",
                summary: "AIからの応答形式エラー",
                points: []
            };
        }
        return repaired;
    }
    catch (e) {
        if (isLoggingEnabled) {
            console.error(`[llm] detailed analyzeEmotionalArc error:`, e);
        }
        // Do not throw, return a fallback object
        return {
            title: "分析例外",
            summary: `エラーが発生しました: ${e.message}`,
            points: []
        };
    }
}
