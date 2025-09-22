import type { Score, Evidence, PersonaOutput, Consensus, SlideEvaluation, StructureSimulation } from '@/types/Result';

export type AnalysisResponse = {
  schema_version: '1.0';
  personas: PersonaOutput[];
  consensus: Consensus;
  slides_struct?: { index: number; title: string; texts: string[] }[];
};

export type StreamEvent =
  | { type: 'persona'; data: PersonaOutput }
  | { type: 'consensus'; data: Consensus }
  | { type: 'done'; data?: {} };

export type EmotionalArcPoint = {
  slide: number;
  emotion: string;
  intensity: number;
  reason: string; // backend uses `reason`; keep backward compat via UI fallback
};

export type EmotionalArc = {
  title: string;
  summary: string;
  points: EmotionalArcPoint[];
};

export type { Score, Evidence, PersonaOutput, Consensus, SlideEvaluation, StructureSimulation };
