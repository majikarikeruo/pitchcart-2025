import { Transition, Paper, SimpleGrid, Box } from "@mantine/core";
import { useState } from "react";
import { TotalScore } from "@/components/Result/Score/TotalScore";
import { ScoreByCategory } from "@/components/Result/Score/ScoreByCategory";
import { ReportAboutEachScore } from "@/components/Result/Score/ReportAboutEachScore";

interface UserInput {
  target: string;
  goal: string;
  industry: string;
  summary: string;
}

// 分析のコンポーネントの型
interface AnalysisComponent {
  total: number;
  breakdown: {
    [key: string]: number;
  };
}

type MainCategory = "impact_score" | "feasibility_score" | "presentation_score";

// 分析全体の型
interface Analysis {
  impact_score: AnalysisComponent;
  feasibility_score: AnalysisComponent;
  presentation_score: AnalysisComponent;
}

// スコア説明のコンポーネントの型
interface ScoreExplanationComponent {
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

// スコア説明全体の型
interface ScoreExplanation {
  impact_score: ScoreExplanationComponent;
  feasibility_score: ScoreExplanationComponent;
  presentation_score: ScoreExplanationComponent;
}

// text2全体の型
interface Text2Data {
  analysis: Analysis;
  score_explanation: ScoreExplanation;
}

// コンポーネントのProps型
interface ScoreProps {
  analysisWithScore: Text2Data;
  input: UserInput; // UserInputの型は別途定義が必要
}

export const Score = ({ analysisWithScore, input }: ScoreProps) => {
  const [selectedMainCategory, setSelectedMainCategory] =
    useState<MainCategory>("impact_score");

  const labelObj = {
    impact_score: "影響力",
    feasibility_score: "実現可能性",
    presentation_score: "プレゼンテーション",
  };
  const { analysis, score_explanation } = analysisWithScore;
  const mainCategories = Object.entries(analysis).map(([key, value]) => ({
    id: key as MainCategory,
    total: value.total,
    label: labelObj[key as MainCategory],
  }));

  const explanationByScore = score_explanation[selectedMainCategory];

  /**
   * 総合スコアを平均値から出力する
   */
  const averageScore =
    Object.values(analysis).reduce((sum, { total }) => sum + total, 0) /
      Object.keys(analysis).length || 0;

  // Memo:Text2のanasysicの中の構造が実態と合わなくていじったのでDify側の調整が必要かもしれない

  return (
    <Box mb="xl">
      <TotalScore input={input} averageScore={averageScore} />

      {/* メインカテゴリー選択 */}
      <Box mb="8">
        <SimpleGrid cols={3} className="gap-4 justify-center">
          {mainCategories.map((category, index) => (
            <Paper mb="16" shadow="md">
              <ScoreByCategory
                key={index}
                category={category}
                selectedMainCategory={selectedMainCategory}
                setSelectedMainCategory={setSelectedMainCategory}
              />
            </Paper>
          ))}
        </SimpleGrid>
      </Box>

      <Transition
        mounted={true}
        transition="fade"
        duration={400}
        timingFunction="ease"
      >
        {(_) => (
          <ReportAboutEachScore
            mainCategories={mainCategories}
            explanationByScore={explanationByScore}
            selectedMainCategory={selectedMainCategory}
          />
        )}
      </Transition>
    </Box>
  );
};
