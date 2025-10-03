import { z } from 'zod';
// ---------- Base Schemas & Types ----------
export const ScoreSchema = z.object({
    clarity: z.number()
        .transform(v => (v > 0 && v <= 1 ? v * 100 : v))
        .pipe(z.number().min(0).max(100).int()),
    uniqueness: z.number()
        .transform(v => (v > 0 && v <= 1 ? v * 100 : v))
        .pipe(z.number().min(0).max(100).int()),
    persuasiveness: z.number()
        .transform(v => (v > 0 && v <= 1 ? v * 100 : v))
        .pipe(z.number().min(0).max(100).int()),
});
export const EvidenceSchema = z.object({
    slide: z.number().optional(),
    quote: z.string().optional(),
});
export const SlideEvaluationSchema = z.object({
    slide: z.number(),
    comment: z.string(),
});
export const PersonaOutputSchema = z.object({
    persona_id: z.string(),
    summary: z.string(),
    scores: ScoreSchema,
    comment: z.string(),
    evidence: z.array(EvidenceSchema),
    confidence: z.number().min(0).max(1),
    slide_evaluations: z.array(SlideEvaluationSchema).optional(),
});
export const ConsensusSchema = z.object({
    agreements: z.array(z.string()),
    disagreements: z.array(z.string()),
    overall_score: z.number().min(0).max(100),
    top_todos: z.array(z.string()),
    what_if: z.array(z.object({
        change: z.string(),
        expected_gain: z.number(),
        uncertainty: z.number(),
    })).optional(),
});
// ---------- Feature Schemas & Types ----------
const StringToNumber = z.preprocess((val) => {
    if (typeof val === 'string') {
        const match = val.match(/\d+(\.\d+)?/);
        if (match) {
            return parseFloat(match[0]);
        }
        return val; // Let Zod handle the error if no number is found
    }
    return val;
}, z.number());
export const EmotionalArcPointSchema = z.object({
    slide: StringToNumber.pipe(z.number().int({ message: 'Slide number must be an integer.' })),
    intensity: StringToNumber.pipe(z.number().min(0, 'Intensity must be at least 0.').max(1, 'Intensity must be at most 1.')),
    emotion: z.string().min(1, 'Emotion cannot be empty.'),
    reason: z.string().min(1, 'Reason cannot be empty.'),
});
export const EmotionalArcSchema = z.object({
    title: z.string(),
    summary: z.string(),
    points: z.array(EmotionalArcPointSchema),
});
export const StructureSimulationStepSchema = z.object({
    title: z.string(),
    slide_indices: z.array(z.number()),
    description: z.string(),
});
export const StructureSimulationSchema = z.object({
    simulation_type: z.enum(['prep', 'custom']),
    title: z.string(),
    steps: z.array(StructureSimulationStepSchema),
});
export const AnalysisResponseSchema = z.object({
    schema_version: z.literal("1.0"),
    personas: z.array(PersonaOutputSchema),
    consensus: ConsensusSchema,
    slides_struct: z.array(z.object({
        index: z.number(),
        title: z.string(),
        texts: z.array(z.string()),
    })).optional(),
});
// ---------- Validation & Repair Function ----------
export const validateAndRepairJson = (json, schema, logContext = 'validate') => {
    console.log(`[schema:${logContext}] Starting validation. Input type: ${typeof json}`);
    // 1. Direct Parse on raw input
    const directParse = schema.safeParse(json);
    if (directParse.success) {
        console.log(`[schema:${logContext}] Direct parse successful.`);
        return directParse.data;
    }
    console.log(`[schema:${logContext}] Direct parse failed. Trying repairs.`);
    // 2. Repair logic
    let candidate = json;
    if (typeof candidate === 'string') {
        console.log(`[schema:${logContext}] Input is a string. Attempting to extract and parse JSON.`);
        try {
            const match = candidate.match(/\{[\s\S]*\}/);
            if (match) {
                candidate = JSON.parse(match[0]);
                console.log(`[schema:${logContext}] Successfully parsed JSON from string.`);
            }
            else {
                console.error(`[schema:${logContext}] Repair failed: No JSON object found in the string.`);
                return null;
            }
        }
        catch (e) {
            console.error(`[schema:${logContext}] Repair failed: Could not parse JSON from string.`, e);
            return null;
        }
    }
    // 3. Second/Final Parse on the repaired/parsed candidate
    console.log(`[schema:${logContext}] Attempting final parse on candidate of type: ${typeof candidate}`);
    const secondParse = schema.safeParse(candidate);
    if (secondParse.success) {
        console.log(`[schema:${logContext}] Final parse successful.`);
        return secondParse.data;
    }
    // 4. If still failing, log comprehensive error info
    console.error(`[schema:${logContext}] Zod validation failed after all repair attempts. Errors:`, secondParse.error.issues);
    try {
        console.error(`[schema:${logContext}] Failing candidate object:`, JSON.stringify(candidate, null, 2));
    }
    catch {
        console.error(`[schema:${logContext}] Failing candidate object (could not stringify):`, candidate);
    }
    return null;
};
// ---------- Fallbacks & Constructors ----------
export function fallbackPersona(persona_id) {
    return {
        persona_id,
        summary: "評価生成に失敗したため暫定値を返します",
        scores: { clarity: 50, uniqueness: 50, persuasiveness: 50 },
        comment: "自動フォールバック：スコアは一律50、信頼度は低いです",
        evidence: [],
        confidence: 0.3,
        slide_evaluations: [],
    };
}
export function makeResponse(personas, consensus, slides_struct) {
    return { schema_version: "1.0", personas, consensus, slides_struct };
}
