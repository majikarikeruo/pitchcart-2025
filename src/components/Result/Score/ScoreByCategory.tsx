import { Progress, Card, Text, Box } from "@mantine/core";

export const ScoreByCategory = ({
  category,
  selectedMainCategory,
  setSelectedMainCategory,
}) => {
  /**
   * 各カードのStyleを適用する
   * @returns
   */
  const cardStyle = () => {
    return {
      backgroundColor:
        selectedMainCategory === category.id ? "#e7f2ff" : "#fff",
      color: selectedMainCategory === category.id ? "#007bff" : "#000",
      border:
        selectedMainCategory === category.id
          ? "1px solid #007bff"
          : "1px solid #ddd",
    };
  };

  return (
    <Card
      withBorder
      key={category.id}
      onClick={() => setSelectedMainCategory(category.id)}
      w="100%"
      style={cardStyle}
    >
      <Text fz={16} fw={700} c="dimmed">
        {category.label}
      </Text>
      <Box fw={700} fz={32} style={{ display: "flex", alignItems: "baseline" }}>
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
