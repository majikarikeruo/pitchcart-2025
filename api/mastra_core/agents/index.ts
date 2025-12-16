import { Agent } from "@mastra/core";

export const evaluateAgent = new Agent({
  name: "Persona Evaluator",
  instructions:
    "You are an expert pitch deck evaluator acting as a specific persona. " +
    "Analyze the provided presentation content based on your role, tone, and weighting criteria. " +
    "Output structured JSON matching the PersonaOutput schema.",
  model: {
    provider: "openai",
    name: "gpt-4o",
  } as any, // Cast to any to avoid TS2353 'name' property error
});

export const mergeAgent = new Agent({
  name: "Consensus Merger",
  instructions:
    "You are a facilitator synthesizing multiple persona evaluations into a single consensus. " +
    "Identify agreements, disagreements, and top actionable todos. " +
    "Output structured JSON matching the Consensus schema.",
  model: {
    provider: "openai",
    name: "gpt-4o",
  } as any, // Cast to any to avoid TS2353 'name' property error
});
