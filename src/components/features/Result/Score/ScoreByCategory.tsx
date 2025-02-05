import { Progress, Card, Text, Box } from "@mantine/core";

import { AnalysisCategoryData } from "@/types/Result";

interface ScoreByCategoryProps {
  category: AnalysisCategoryData;
  isActive: boolean;
}

export const ScoreByCategory = ({ category, isActive }: ScoreByCategoryProps) => {
  /**
   * 各カードのStyleを適用する
   * @returns
   */
  const cardStyle = () => {
    return {
      backgroundColor: isActive ? "#e7f2ff" : "#fff",
      color: isActive ? "#007bff" : "#000",
      border: isActive ? "1px solid #007bff" : "1px solid #ddd",
    };
  };

  return (
    <Card withBorder key={category.id} w="100%" style={cardStyle}>
      <Text fz={16} fw={700} c="dimmed">
        {category.label}
      </Text>
      <Box style={{ display: "flex", alignItems: "baseline" }}>
        <Text fz={40} fw={700} mx={4}>
          {category.total}
        </Text>
        <Text fz={16} mx={4}>
          /
        </Text>
        <Text fz={16}>100</Text>
      </Box>
      <Progress value={category.total} mt="md" size="lg" radius="xl" />
    </Card>
  );
};
