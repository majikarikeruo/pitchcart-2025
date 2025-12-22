import { Workflow } from "@mastra/core";
import { z } from "zod";
import { evaluateAgent } from "../agents/index.js";

// Define schemas for type safety in workflow steps
const InputSchema = z.object({
  slides_text: z.string(),
  personas: z.array(z.any()), // PersonaConfig[]
});

// Step 1: Parallel Evaluation
// Note: In a real Mastra workflow, we might iterate or fan-out.
// Here we simplify by assuming the step receives all necessary context.
const evaluateStep = {
  id: "evaluate",
  agent: evaluateAgent,
  inputSchema: InputSchema,
  execute: async ({ context, agent }: { context: any, agent: any }) => {
    // Custom logic to iterate over personas could go here,
    // or we can rely on the agent to handle the batch if prompt is structured so.
    
    // For now, let's just return context to show connectivity.
    // Suppress unused variable warning
    void agent; 
    return { status: "evaluated", data: context };
  }
};

export const analysisWorkflow = new Workflow({
  name: "Pitch Analysis Workflow",
  triggerSchema: InputSchema,
  steps: [evaluateStep as any], // Cast to any to avoid 'Step' class issues
} as any); // Cast Workflow config if 'name' is issue
