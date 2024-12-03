import { Box, Card, Flex, Grid, Image, Paper, Text, Badge, Title } from "@mantine/core";

const SlideNode = ({ data }: { data: any }) => {
  const getHeatColor = (issues: number) => {
    if (issues === 0) return { bg: "var(--mantine-color-green-1)", border: "var(--mantine-color-green-2)" };
    if (issues <= 2) return { bg: "var(--mantine-color-yellow-1)", border: "var(--mantine-color-yellow-2)" };
    return { bg: "var(--mantine-color-red-1)", border: "var(--mantine-color-red-2)" };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "red";
      case "medium":
        return "yellow";
      case "low":
        return "blue";
      default:
        return "gray";
    }
  };

  const heatColor = getHeatColor(data.issues);

  return (
    <Paper
      p="md"
      w={256}
      radius="lg"
      style={{
        backgroundColor: heatColor.bg,
        borderColor: heatColor.border,
        borderWidth: 2,
        borderStyle: "solid",
        minWidth: 256,
      }}
    >
      <Flex direction="column" gap="sm">
        <Box style={{ aspectRatio: "16/9", overflow: "hidden", borderRadius: "var(--mantine-radius-md)" }}>
          <Image src={`https://placehold.co/320x180`} alt={`スライド ${data.id} のプレビュー`} h="100%" w="100%" />
        </Box>

        <Text size="sm" c="dimmed">
          スライド {data.id}
        </Text>
        <Text fw={500}>{data.title}</Text>
        <Flex align="center" gap="sm">
          <Badge color={getPriorityColor(data.priority)} variant="light">
            {data.priority === "high" ? "高" : data.priority === "medium" ? "中" : "低"}
          </Badge>
          <Text size="sm" c="dimmed">
            改善点: {data.issues}
          </Text>
        </Flex>
      </Flex>
    </Paper>
  );
};

const SequenceIssue = ({ data }: { data: any }) => (
  <Paper p="md" radius="lg" withBorder>
    <Text size="sm" fw={500} c="dimmed" mb="xs">
      {data.location}
    </Text>
    <Flex direction="column" gap="sm">
      <Box>
        <Text size="sm" fw={500} c="red" mb="xs">
          問題点
        </Text>
        <Text size="sm">{data.issue}</Text>
      </Box>
      <Box>
        <Text size="sm" fw={500} c="green" mb="xs">
          改善案
        </Text>
        <Text size="sm">{data.suggestion}</Text>
      </Box>
    </Flex>
  </Paper>
);

export const Flow = () => {
  const slides = [
    { id: 1, title: "イントロダクション", issues: 3, priority: "high", type: "section" },
    { id: 2, title: "Pitch Cart概要", issues: 2, priority: "medium", type: "section" },
    { id: 3, title: "市場分析", issues: 1, priority: "medium", type: "subsection" },
    { id: 4, title: "技術スタック", issues: 0, priority: "low", type: "subsection" },
    { id: 5, title: "ビジネスモデル", issues: 2, priority: "high", type: "section" },
    { id: 6, title: "収益計画", issues: 1, priority: "medium", type: "subsection" },
    { id: 7, title: "マーケティング戦略", issues: 2, priority: "medium", type: "section" },
    { id: 8, title: "実績と指標", issues: 1, priority: "low", type: "subsection" },
    { id: 9, title: "今後の展望", issues: 2, priority: "medium", type: "section" },
    { id: 10, title: "まとめ", issues: 1, priority: "high", type: "section" },
  ];

  const sequenceIssues = [
    {
      location: "プロダクト説明から市場分析への移行部分",
      issue: "Pitch Cartの機能説明から市場分析への流れが唐突であり、一貫性が欠けている。",
      suggestion: "プロダクトの利点とその背景となる市場ニーズを関連づけて説明し、その後に市場分析へとつなげることで流れを自然にする。",
    },
    {
      location: "「私たちが実現したい世界」のセクション",
      issue: "「私たちが実現したい世界」のセクションで具体的なビジョンから離れてしまい、聴衆との関連性が薄れる。",
      suggestion: "「私たちが実現したい世界」のビジョンとPitch Cartの具体的な効果や利点を結びつけて話すことで、一貫したメッセージとして強調する。",
    },
    {
      location: "技術スタックから収益モデルへの展開",
      issue: "技術的な特徴の説明から収益モデルへの展開が急激で、価値提供の説明が不足している。",
      suggestion: "技術的優位性がどのように顧客価値につながり、収益化できるのかのストーリーを段階的に説明する。",
    },
  ];

  return (
    <Box p="md">
      <Box mb="xl">
        <Title order={2} mb="sm">
          スライドヒートマップ
        </Title>
        <Flex gap="md">
          {[
            { color: "green", label: "問題なし" },
            { color: "yellow", label: "軽度の改善点" },
            { color: "red", label: "重要な改善点" },
          ].map((item) => (
            <Flex key={item.color} align="center" gap="xs">
              <Box
                w={16}
                h={16}
                style={{
                  backgroundColor: `var(--mantine-color-${item.color}-1)`,
                  border: `1px solid var(--mantine-color-${item.color}-2)`,
                  borderRadius: "var(--mantine-radius-sm)",
                }}
              />
              <Text size="sm">{item.label}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      <Box style={{ overflowX: "auto" }}>
        <Flex gap="md" pb="md">
          {slides.map((slide) => (
            <SlideNode key={slide.id} data={slide} />
          ))}
        </Flex>
      </Box>

      <Box mt="xl">
        <Title order={3} mb="md">
          ロジックフローの問題点
        </Title>
        <Grid>
          {sequenceIssues.map((issue, index) => (
            <Grid.Col key={index} span={12}>
              <SequenceIssue data={issue} />
            </Grid.Col>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};
