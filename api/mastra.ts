import type { PersonaOutput, Consensus } from './schema.js';
import { fallbackPersona } from './schema.js';
import { llmEvaluatePersonaWithOpts, llmMergeConsensusWithOpts, type LlmPersonaOpts, type LlmMergeOpts } from './llm.js';

type PersonaConfig = {
  persona_id: string;
  role: string;
  tone: string;
  weighting: { clarity: number; uniqueness: number; persuasiveness: number };
  dealbreakers?: string[];
};

// Mastra agetns/workflows definitions would go here.
// For now, this module acts as a placeholder and high-level orchestrator.
// It decides whether to use a (future) Mastra workflow or fall back to direct LLM calls.

/**
 * Evaluates the input against a set of personas in parallel.
 * This function will be replaced by a Mastra workflow in the future.
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
  // Currently, we fall back to direct, parallel LLM calls.
  // A future Mastra implementation would replace this with a `Workflow.run()`.
  const tasks = personas.map((cfg) =>
    llmEvaluatePersonaWithOpts(input, cfg, opts || {}).catch(() => fallbackPersona(cfg.persona_id))
  );
  return Promise.all(tasks);
}

/**
 * Merges the outputs from multiple personas into a single consensus.
 * This function will be replaced by a Mastra workflow in the future.
 *
 * @param personasOut An array of persona evaluation outputs.
 * @param opts Options for the LLM call.
 * @returns A promise that resolves to a consensus object.
 */
export async function mastraMergeConsensus(personasOut: PersonaOutput[], opts?: LlmMergeOpts): Promise<Consensus> {
  // Currently, we fall back to a direct LLM call for merging.
  // A future Mastra implementation would replace this.
  return llmMergeConsensusWithOpts(personasOut, opts || {});
}
