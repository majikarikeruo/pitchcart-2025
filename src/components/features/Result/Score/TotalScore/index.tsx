import { Flex } from "@mantine/core";

import { ScoreRing } from "@/components/features/Result/Score/TotalScore/ScoreRing";
import { UserInput } from "@/components/features/Result/Score/TotalScore/UserInput";

import { UserInputProps, analysisWithScoreProps } from "@/types/Result";

interface TotalScoreProps {
  input: UserInputProps;
  analysis: analysisWithScoreProps["analysis"];
}

export const TotalScore = ({ input, analysis }: TotalScoreProps) => {
  /**
   * @function calculateAverageScore
   * スコアの平均値を出す =
   */
  const calculateAverageScore = (
    analysis: analysisWithScoreProps["analysis"]
  ) => {
    const scores = Object.values(analysis);
    if (scores.length === 0) return 0;
    return Math.floor(
      scores.reduce((sum, { total }) => sum + total, 0) / scores.length
    );
  };

  /**
   * 総合スコアを平均値から出力する
   */
  const averageScore = calculateAverageScore(analysis);

  return (
    <Flex gap={48} align="center">
      <ScoreRing averageScore={averageScore} />
      <UserInput input={input} />
    </Flex>
  );
};
