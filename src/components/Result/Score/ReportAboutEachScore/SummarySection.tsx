import { List, ThemeIcon, Text, Title, Flex, Box } from "@mantine/core";
import { Check } from "lucide-react";
import {
  AnalysisCategoryProps,
  ScoreExplanationProps,
  AnalysisCategoryData,
} from "@/types/Result";

interface ReportProps {
  analysisCategories: AnalysisCategoryData[];
  explanationByScore: ScoreExplanationProps;
  selectedCategory: AnalysisCategoryProps;
}

export const SummarySection = ({
  analysisCategories,
  selectedCategory,
  explanationByScore,
}: ReportProps) => {
  return (
    <Box mb={40} p={24} ta={"center"}>
      <Title order={2} fz={40} mb={16} c="#228be6" ta={"center"}>
        {
          analysisCategories.find(
            (category) => category.id === selectedCategory
          )?.label
        }
      </Title>
      <Text fz={16} lh={1.75} c="#333333" tt="uppercase" fw={700}>
        {explanationByScore.total_explanation.summary}
      </Text>
      <Flex direction={"column"} align={"center"} mt={16}>
        <Box>
          {explanationByScore.total_explanation.key_factors.map(
            (item: string, index: number) => (
              <List ta={"left"} key={index}>
                <List.Item
                  py={4}
                  icon={
                    <ThemeIcon color="teal" size={24} radius="xl">
                      <Check size={16} />
                    </ThemeIcon>
                  }
                >
                  {item}
                </List.Item>
              </List>
            )
          )}
        </Box>
      </Flex>
    </Box>
  );
};
