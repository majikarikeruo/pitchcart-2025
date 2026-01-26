export * from "./input";
export * from "./analysisWithScore";
export * from "./Question";
export * from "./improvement";
export * from "./flow";

import { UserInputProps } from "./input";
import { analysisWithScoreProps } from "./analysisWithScore";
import { QuestionItems } from "./Question";
import { ImprovementProps } from "./improvement";
import { HeatmapData, structureData, prerequisiteData } from "./flow";
import { AnalysisResponse } from '../analysis';


export type Score = { clarity: number; uniqueness: number; persuasiveness: number };
export type Evidence = { slide?: number; quote?: string };

export type SlideEvaluation = {
  slide: number;
  comment: string;
};

export type PersonaOutput = {
  persona_id: string;
  summary: string;
  scores: Score;
  comment: string;
  evidence: Evidence[];
  confidence: number; // 0..1
  slide_evaluations?: SlideEvaluation[];
};

export type Consensus = {
  agreements: string[];
  disagreements: string[];
  overall_score: number;
  top_todos: string[];
  what_if?: { change: string; expected_gain: number; uncertainty: number }[];
};

export type StructureSimulationStep = {
  title: string;
  slide_indices: number[];
  description: string;
};

export type StructureSimulation = {
  simulation_type: 'prep' | 'custom';
  title: string;
  steps: StructureSimulationStep[];
};

export interface ResultData {
  presentationId?: string;
  presentationTitle?: string;
  // Legacy fields for older analysis format
  input?: UserInputProps;
  analysisWithScore?: analysisWithScoreProps;
  predictedQuestions?: QuestionItems;
  improvement?: ImprovementProps;
  heatmapFlow?: HeatmapData;
  structureFlow?: structureData;
  prerequisiteCheck?: prerequisiteData;

  // New field for consensus-based analysis
  consensusMvp?: AnalysisResponse;
  slideImages?: string[];
}
