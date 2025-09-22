import assert from 'node:assert';
import { describe, it } from 'node:test';
import { validateAndRepairJson, AnalysisResponseSchema, } from '../schema.js';
describe('Schema Validation and Repair', () => {
    // A sample valid response structure for testing
    const createValidResponse = () => ({
        schema_version: '1.0',
        personas: [
            {
                persona_id: 'vc_seed',
                summary: 'Good potential, but needs clearer GTM strategy.',
                scores: { clarity: 80, uniqueness: 70, persuasiveness: 60 },
                comment: 'The team is strong, but the go-to-market is weak.',
                evidence: [{ slide: 5, quote: 'Our target market is everyone.' }],
                confidence: 0.8,
                slide_evaluations: [{ slide: 5, comment: 'This is too broad.' }]
            }
        ],
        consensus: {
            agreements: ['Strong team'],
            disagreements: ['Weak GTM strategy'],
            overall_score: 70,
            top_todos: ['Define target customer segment'],
            what_if: [{ change: 'Define GTM', expected_gain: 10, uncertainty: 3 }]
        },
        slides_struct: [{ index: 1, title: 'Intro', texts: ['Hello'] }]
    });
    it('should validate a correct AnalysisResponse object', () => {
        const validResponse = createValidResponse();
        const result = validateAndRepairJson(validResponse, AnalysisResponseSchema);
        assert.notStrictEqual(result, null);
        assert.deepStrictEqual(result, validResponse);
    });
    it('should invalidate an AnalysisResponse with a missing required field (e.g., consensus)', () => {
        const invalidResponse = createValidResponse();
        delete invalidResponse.consensus;
        const result = validateAndRepairJson(invalidResponse, AnalysisResponseSchema);
        assert.strictEqual(result, null);
    });
    it('should invalidate an AnalysisResponse with a wrong data type (e.g., overall_score as string)', () => {
        const invalidResponse = createValidResponse();
        invalidResponse.consensus.overall_score = '70'; // Should be a number
        const result = validateAndRepairJson(invalidResponse, AnalysisResponseSchema);
        assert.strictEqual(result, null);
    });
    it('should successfully parse a valid JSON string and validate it', () => {
        const validResponse = createValidResponse();
        const jsonString = JSON.stringify(validResponse);
        const result = validateAndRepairJson(jsonString, AnalysisResponseSchema);
        assert.notStrictEqual(result, null);
        assert.deepStrictEqual(result, validResponse);
    });
    it('should extract and validate a JSON object from a string with extra text', () => {
        const validResponse = createValidResponse();
        const stringWithExtraText = `Here is the analysis result: ${JSON.stringify(validResponse)} That is all.`;
        const result = validateAndRepairJson(stringWithExtraText, AnalysisResponseSchema);
        assert.notStrictEqual(result, null);
        assert.deepStrictEqual(result, validResponse);
    });
    it('should return null for a string that does not contain a valid JSON object', () => {
        const invalidString = 'This is just some text without any JSON.';
        const result = validateAndRepairJson(invalidString, AnalysisResponseSchema);
        assert.strictEqual(result, null);
    });
    it('should return null for malformed JSON string', () => {
        const malformedJson = '{"key": "value",'; // Missing closing brace
        const result = validateAndRepairJson(malformedJson, AnalysisResponseSchema);
        assert.strictEqual(result, null);
    });
});
