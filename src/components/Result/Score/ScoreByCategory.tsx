import { Dispatch, SetStateAction } from "react";

import { Progress, Card, Text, Box } from "@mantine/core";

import { AnalysisCategoryData, AnalysisCategoryProps } from "@/types/Result";

export const ScoreByCategory = ({
  category,
  selectedCategory,
  setSelectedCategory,
}: {
  category: AnalysisCategoryData;
  selectedCategory: AnalysisCategoryProps;
  setSelectedCategory: Dispatch<SetStateAction<AnalysisCategoryProps>>;
}) => {
  /**
   * 各カードのStyleを適用する
   * @returns
   */
  const cardStyle = () => {
    return {
      backgroundColor: selectedCategory === category.id ? "#e7f2ff" : "#fff",
      color: selectedCategory === category.id ? "#007bff" : "#000",
      border:
        selectedCategory === category.id
          ? "1px solid #007bff"
          : "1px solid #ddd",
    };
  };

  return (
    <Card
      withBorder
      key={category.id}
      onClick={() => setSelectedCategory(category.id)}
      w="100%"
      style={cardStyle}
    >
      <Text fz={16} fw={700} c="dimmed">
        {category.label}
      </Text>
      <Box fw={700} fz={40} style={{ display: "flex", alignItems: "baseline" }}>
        {category.total}
        <Text fz={16} mx={4}>
          /
        </Text>
        <Text fz={16}>100</Text>
      </Box>
      <Progress value={category.total} mt="md" size="lg" radius="xl" />
    </Card>
  );
};
