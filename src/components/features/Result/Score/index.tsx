import { useState } from "react";
import {
  Transition,
  Paper,
  SimpleGrid,
  Box,
  Flex,
  Divider,
  Text,
  Title,
  ThemeIcon,
} from "@mantine/core";
import { IconPresentation } from "@tabler/icons-react";

import { TotalScore } from "@/components/features/Result/Score/TotalScore";
import { ScoreByCategory } from "@/components/features/Result/Score/ScoreByCategory";
import { ReportAboutEachScore } from "@/components/features/Result/Score/ReportAboutEachScore";

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

  // Memo:
  //Text2のanasysicの中の構造が実態と合わなくていじったのでDify側の調整が必要かもしれない

  return (
    <Box mb="xl">
      <Paper shadow="md" radius="md" bg="white" mb={16} px={40} py={24}>
        <Flex direction="column-reverse" align="center">
          <Title mb={40} fw={700} fz={56}>
            分析結果
          </Title>
          <Text mb={4} fw={500} c="#228be6" tt="uppercase">
            Analysis Result
          </Text>
          <ThemeIcon variant="white" mb={8}>
            <IconPresentation />
          </ThemeIcon>
        </Flex>
        <Divider />
        <TotalScore input={input} analysis={analysis} />
      </Paper>

      {/* メインカテゴリー選択 */}
      <Box mb="8">
        <SimpleGrid cols={3} className="gap-4 justify-center">
          {analysisCategories.map((category, index) => (
            <Paper
              mb="16"
              shadow="md"
              key={index}
              onClick={() => setSelectedCategory(category.id)}
            >
              <ScoreByCategory
                key={index}
                category={category}
                isActive={selectedCategory === category.id}
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
