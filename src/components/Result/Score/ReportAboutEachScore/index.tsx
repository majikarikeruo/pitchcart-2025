import { Info, Check } from "lucide-react";
import {
  Stack,
  Divider,
  SimpleGrid,
  ThemeIcon,
  RingProgress,
  Text,
  Title,
  Flex,
  Box,
  Paper,
} from "@mantine/core";

import { SummarySection } from "@/components/Result/Score/ReportAboutEachScore/SummarySection";
import {
  CATEGORY_DETAILS,
  AnalysisCategoryProps,
  ScoreExplanationProps,
  AnalysisCategoryData,
} from "@/types/Result";

interface ReportProps {
  analysisCategories: AnalysisCategoryData[];
  explanationByScore: ScoreExplanationProps;
  selectedCategory: AnalysisCategoryProps;
}

export const ReportAboutEachScore = ({
  analysisCategories,
  explanationByScore,
  selectedCategory,
}: ReportProps) => {
  const { components } = explanationByScore;
  const categoryDetails = CATEGORY_DETAILS[selectedCategory];

  return (
    <Paper shadow="md">
      <SummarySection
        analysisCategories={analysisCategories}
        selectedCategory={selectedCategory}
        explanationByScore={explanationByScore}
      />

      <Divider />

      {/* サブカテゴリーのグリッド表示 */}
      <SimpleGrid cols={3} style={{ padding: "16px" }} bg="white">
        {Object.entries(categoryDetails).map(([key, label]) => (
          <Stack key={key} px="md">
            <Flex align="center" justify="center">
              <RingProgress
                size={200}
                roundCaps
                thickness={12}
                ta="center"
                sections={[
                  {
                    value: components[key].score,
                    color: "red",
                  },
                ]}
                label={
                  <>
                    <Title order={6} c="dimmed">
                      {label}
                    </Title>
                    <Text fw={700} fz={40}>
                      {components[key].score}
                    </Text>
                  </>
                }
              />
            </Flex>
            <Box>
              <Box mt={16}>
                <Flex align="start" style={{ fontSize: "14px" }} mb={4}>
                  <ThemeIcon mr={8} mb={4} variant="white">
                    <Check size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={"bold"}>{components[key].explanation}</Text>
                  </Box>
                </Flex>
              </Box>
              <Box mt={16}>
                <Flex align="start" style={{ fontSize: "14px" }} mb={4}>
                  <ThemeIcon mr={8} mb={4} variant="white">
                    <Info size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text>{components[key].evidence}</Text>
                  </Box>
                </Flex>
              </Box>
            </Box>
          </Stack>
        ))}
      </SimpleGrid>
    </Paper>
  );
};
