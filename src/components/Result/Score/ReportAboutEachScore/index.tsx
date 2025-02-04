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

export const ReportAboutEachScore = ({
  mainCategories,
  explanationByScore,
  selectedMainCategory,
}) => {
  console.log(explanationByScore);

  const labelObj = {
    market_alignment: "市場適合度",
    value_proposition: "価値提案",
    competitive_advantage: "競争優位性",
    technical_viability: "技術的実現性",
    resource_availability: "リソースの充足度",
    execution_capability: "実行力",
    clarity: "説明の明確さ",
    structure: "構造の適切さ",
    engagement: "聴衆の関心度",
  };

  const subCategoryKeys = Object.keys(explanationByScore.components);
  //   console.log(explanationByScore, subCategoryKeys);

  return (
    <Paper shadow="md">
      <SummarySection
        mainCategories={mainCategories}
        selectedMainCategory={selectedMainCategory}
        explanationByScore={explanationByScore}
      />

      <Divider />

      {/* サブカテゴリーのグリッド表示 */}
      <SimpleGrid cols={3} style={{ padding: "16px" }} bg="white">
        {subCategoryKeys.map((componentKey, index) => (
          <Stack key={index} px="md">
            <Flex align="center" justify="center">
              <RingProgress
                size={200}
                roundCaps
                thickness={12}
                ta="center"
                sections={[
                  {
                    value: explanationByScore.components[componentKey].score,
                    color: "red",
                  },
                ]}
                label={
                  <>
                    <Title order={6} c="dimmed">
                      {labelObj[componentKey]}
                    </Title>
                    <Text fw={700} fz={40}>
                      {explanationByScore.components[componentKey].score}
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
                    <Text fw={"bold"}>
                      {explanationByScore.components[componentKey].explanation}
                    </Text>
                  </Box>
                </Flex>
              </Box>
              <Box mt={16}>
                <Flex align="start" style={{ fontSize: "14px" }} mb={4}>
                  <ThemeIcon mr={8} mb={4} variant="white">
                    <Info size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text>
                      {explanationByScore.components[componentKey].evidence}
                    </Text>
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
