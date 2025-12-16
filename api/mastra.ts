import type { PersonaOutput, Consensus } from './schema.js';
import { fallbackPersona, validateAndRepairJson, PersonaOutputSchema, ConsensusSchema } from './schema.js';
import { llmEvaluatePersonaWithOpts, llmMergeConsensusWithOpts, type LlmPersonaOpts, type LlmMergeOpts } from './llm.js';
// Import actual Mastra agents
import { evaluateAgent, mergeAgent } from '../src/lib/mastra/agents/index';

type PersonaConfig = {
  persona_id: string;
  role: string;
  tone: string;
  weighting: { clarity: number; uniqueness: number; persuasiveness: number };
  dealbreakers?: string[];
};

/**
 * Evaluates the input against a set of personas in parallel using Mastra Agents.
 *
 * @param input The analysis input data.
 * @param personas An array of persona configurations.
 * @param opts Options for the LLM calls.
 * @returns A promise that resolves to an array of persona outputs.
 */
export async function mastraEvaluatePersonas(
  input: any,
  personas: PersonaConfig[],
  opts?: LlmPersonaOpts,
): Promise<PersonaOutput[]> {
  // Use Mastra Agent for each persona in parallel
  const tasks = personas.map(async (cfg) => {
    try {
      // Construct a prompt context similar to what llm.ts does
      const userPrompt = JSON.stringify({
        task: "evaluate_pitch_deck",
        input: {
          summary: input.summary,
          slides: input.slides_text,
        },
        persona: cfg,
        options: {
            detail: opts?.detail
        }
      });

      console.log(`[Mastra] invoking agent for ${cfg.persona_id}...`);

      // Call Mastra Agent (Using generateVNext as per error message instructions)
      // Casting to any because generateVNext might not be in the type definition yet
      const result = await (evaluateAgent as any).generateVNext(userPrompt);
      
      console.log(`[Mastra] agent result for ${cfg.persona_id}:`, result ? "OK" : "Empty");

      // Parse result
      // With generateVNext, the result structure might be different. 
      // Assuming it returns an object with 'text' or 'output', or is the result directly.
      const text = (result as any)?.text || (result as any)?.output || (typeof result === 'string' ? result : JSON.stringify(result));
      
      if (!text || text === "{}") {
          throw new Error(`Empty response from Mastra Agent: ${JSON.stringify(result)}`);
      }

      const json = validateAndRepairJson(JSON.parse(text), PersonaOutputSchema, "persona");
      
      return json || fallbackPersona(cfg.persona_id);

    } catch (e) {
      console.error(`[Mastra] Agent failed for ${cfg.persona_id}:`, e);
      // Fallback to direct LLM call if Mastra fails
      console.log(`[Mastra] Falling back to LLM direct for ${cfg.persona_id}`);
      return llmEvaluatePersonaWithOpts(input, cfg, opts || {}).catch(() => fallbackPersona(cfg.persona_id));
    }
  });

  return Promise.all(tasks);
}

/**
 * Merges the outputs from multiple personas into a single consensus using Mastra Agent.
 *
 * @param personasOut An array of persona evaluation outputs.
 * @param opts Options for the LLM call.
 * @returns A promise that resolves to a consensus object.
 */
export async function mastraMergeConsensus(personasOut: PersonaOutput[], opts?: LlmMergeOpts): Promise<Consensus> {
  try {
     const userPrompt = JSON.stringify({
        task: "merge_consensus",
        personas_outputs: personasOut
      });

      console.log(`[Mastra] invoking consensus agent...`);
      // Use generateVNext
      const result = await (mergeAgent as any).generateVNext(userPrompt);
      const text = (result as any)?.text || (result as any)?.output || (typeof result === 'string' ? result : JSON.stringify(result));
      
      if (!text) throw new Error("Empty response from Consensus Agent");

      const json = validateAndRepairJson(JSON.parse(text), ConsensusSchema, "consensus");
      
      // If validation fails, fall back to LLM direct
      if (!json) throw new Error("Mastra consensus validation failed");

      return json;
  } catch (e) {
    console.error("[Mastra] Consensus Agent failed:", e);
    return llmMergeConsensusWithOpts(personasOut, opts || {});
  }
}
