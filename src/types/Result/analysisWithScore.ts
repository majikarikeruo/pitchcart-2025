export interface ScoreExplanationProps {
  total_explanation: {
    score: number;
    summary: string;
    key_factors: string[];
  };
  components: {
    [key: string]: {
      score: number;
      explanation: string;
      evidence: string;
    };
  };
}
export type AnalysisCategoryProps = "impact_score" | "feasibility_score" | "presentation_score";

export const CATEGORY_LABELS = {
  impact_score: "影響力",
  feasibility_score: "実現可能性",
  presentation_score: "プレゼンテーション",
} as const;

export type DetailCategory =
  | "market_alignment"
  | "value_proposition"
  | "competitive_advantage"
  | "technical_viability"
  | "resource_availability"
  | "execution_capability"
  | "clarity"
  | "structure"
  | "engagement";

// ラベルの定義
export const IMPACT_SCORE_DETAILS = {
  market_alignment: "市場適合度",
  value_proposition: "価値提案",
  competitive_advantage: "競争優位性",
} as const;

export const FEASIBILITY_SCORE_DETAILS = {
  technical_viability: "技術的実現性",
  resource_availability: "リソースの充足度",
  execution_capability: "実行力",
} as const;

export const PRESENTATION_SCORE_DETAILS = {
  clarity: "説明の明確さ",
  structure: "構造の適切さ",
  engagement: "聴衆の関心度",
} as const;

export type CategoryLabel = (typeof CATEGORY_LABELS)[AnalysisCategoryProps];

export const CATEGORY_DETAILS = {
  impact_score: IMPACT_SCORE_DETAILS,
  feasibility_score: FEASIBILITY_SCORE_DETAILS,
  presentation_score: PRESENTATION_SCORE_DETAILS,
} as const;

export type CategoryDetail = (typeof CATEGORY_DETAILS)[AnalysisCategoryProps];

export interface AnalysisCategoryData {
  id: AnalysisCategoryProps;
  total: number;
  label: CategoryLabel;
}

export interface AnalysisProps {
  total: number;
  breakdown: {
    [key: string]: number;
  };
}
export interface analysisWithScoreProps {
  analysis: Record<AnalysisCategoryProps, AnalysisProps>;
  score_explanation: Record<AnalysisCategoryProps, ScoreExplanationProps>;
}
