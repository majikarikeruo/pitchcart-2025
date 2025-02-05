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

export interface ResultData {
  input: UserInputProps;
  analysisWithScore: analysisWithScoreProps;
  predictedQuestions: QuestionItems;
  improvement: ImprovementProps;
  heatmapFlow: HeatmapData;
  structureFlow: structureData;
  prerequisiteCheck: prerequisiteData;
}
