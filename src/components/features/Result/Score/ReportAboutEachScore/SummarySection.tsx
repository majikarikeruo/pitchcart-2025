import { List, ThemeIcon, Text, Title, Flex, Box } from "@mantine/core";
import { AnalysisCategoryProps, ScoreExplanationProps, AnalysisCategoryData } from "@/types/Result";
import { IconCheck } from "@tabler/icons-react";

interface ReportProps {
  analysisCategories: AnalysisCategoryData[];
  explanationByScore: ScoreExplanationProps;
  selectedCategory: AnalysisCategoryProps;
}

export const SummarySection = ({ analysisCategories, selectedCategory, explanationByScore }: ReportProps) => {
  return (
    <Box mb={40} p={24} ta={"center"}>
      <Flex direction={"column-reverse"} justify={"center"} align={"center"} mb={40}>
        <Title order={2} mb={16} p={8} px={12} fz={34} c="#228be6" ta={"center"}>
          {analysisCategories.find((category) => category.id === selectedCategory)?.label}
        </Title>
        <Text size="sm" c="#228be6" fw={700} tt="uppercase">
          {analysisCategories.find((category) => category.id === selectedCategory)?.id}
        </Text>
        <ThemeIcon variant="white">
          <IconCheck size={24} />
        </ThemeIcon>
      </Flex>
      <Text fz={18} lh={1.75} c="#333333" tt="uppercase" fw={700} mb={32}>
        {explanationByScore.total_explanation.summary}
      </Text>
      <Flex direction={"column"} align={"center"} mt={16}>
        <Box>
          {explanationByScore.total_explanation.key_factors.map((item: string, index: number) => (
            <List ta={"left"} key={index}>
              <List.Item
                py={4}
                icon={
                  <ThemeIcon color="teal" size={24} radius="xl">
                    <IconCheck size={16} />
                  </ThemeIcon>
                }
              >
                {item}
              </List.Item>
            </List>
          ))}
        </Box>
      </Flex>
    </Box>
  );
};
