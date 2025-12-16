
import { Mastra } from "@mastra/core";
import { evaluateAgent, mergeAgent } from "./agents";
import { analysisWorkflow } from "./workflows";

export const mastra = new Mastra({
  agents: { evaluateAgent, mergeAgent },
  workflows: { analysisWorkflow },
});

