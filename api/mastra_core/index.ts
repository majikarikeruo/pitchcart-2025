
import { Mastra } from "@mastra/core";
import { evaluateAgent, mergeAgent } from "./agents/index.js";
import { analysisWorkflow } from "./workflows/index.js";

export const mastra = new Mastra({
  agents: { evaluateAgent, mergeAgent },
  workflows: { analysisWorkflow },
});

