import { useState } from "react";

import { Transition, Paper, SimpleGrid, Box } from "@mantine/core";
import { TotalScore } from "@/components/Result/Score/TotalScore";
import { ScoreByCategory } from "@/components/Result/Score/ScoreByCategory";
import { ReportAboutEachScore } from "@/components/Result/Score/ReportAboutEachScore";

import {
  UserInputProps,
  analysisWithScoreProps,
  AnalysisCategoryProps,
  CATEGORY_LABELS,
  AnalysisCategoryData,
} from "@/types/Result";

interface ScoreProps {
  analysisWithScore: analysisWithScoreProps;
  input: UserInputProps;
}

export const Score = ({ analysisWithScore, input }: ScoreProps) => {
  const [selectedCategory, setSelectedCategory] =
    useState<AnalysisCategoryProps>("impact_score");
  const { analysis, score_explanation } = analysisWithScore;

  const explanationByScore = score_explanation[selectedCategory];

  const analysisCategories: AnalysisCategoryData[] = Object.entries(
    analysis
  ).map(([key, value]) => ({
    id: key as AnalysisCategoryProps,
    total: value.total,
    label: CATEGORY_LABELS[key as AnalysisCategoryProps],
  }));

  /**
   * @function calculateAverageScore
   * スコアの平均値を出す =
   */
  const calculateAverageScore = (
    analysis: analysisWithScoreProps["analysis"]
  ) => {
    const scores = Object.values(analysis);
    if (scores.length === 0) {
      return 0;
    }

    return (
      Object.values(analysis).reduce((sum, { total }) => sum + total, 0) /
      scores.length
    );
  };

  /**
   * 総合スコアを平均値から出力する
   */
  const averageScore = calculateAverageScore(analysis);

  // Memo:
  //Text2のanasysicの中の構造が実態と合わなくていじったのでDify側の調整が必要かもしれない

  return (
    <Box mb="xl">
      <TotalScore input={input} averageScore={averageScore} />

      {/* メインカテゴリー選択 */}
      <Box mb="8">
        <SimpleGrid cols={3} className="gap-4 justify-center">
          {analysisCategories.map((category, index) => (
            <Paper mb="16" shadow="md" key={index}>
              <ScoreByCategory
                key={index}
                category={category}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
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
            analysisCategories={analysisCategories}
            explanationByScore={explanationByScore}
            selectedCategory={selectedCategory}
          />
        )}
      </Transition>
    </Box>
  );
};
