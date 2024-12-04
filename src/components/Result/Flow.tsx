import { Box, Flex, Text, Title, Paper, Badge, Popover } from "@mantine/core";
import { ChevronRight } from "lucide-react";

const SlideNode = ({ data, onClick }: { data: any; onClick: () => void }) => {
  const getHeatColor = (issues: number) => {
    if (issues === 0) return { bg: "var(--mantine-color-green-1)", border: "var(--mantine-color-green-2)" };
    if (issues <= 2) return { bg: "var(--mantine-color-yellow-1)", border: "var(--mantine-color-yellow-2)" };
    return { bg: "var(--mantine-color-red-1)", border: "var(--mantine-color-red-2)" };
  };

  const heatColor = getHeatColor(data.issues);

  return (
    <Paper
      p="md"
      w={200}
      radius="lg"
      style={{
        backgroundColor: heatColor.bg,
        borderColor: heatColor.border,
        borderWidth: 2,
        borderStyle: "solid",
        cursor: "pointer",
        transition: "transform 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
        },
      }}
      onClick={onClick}
    >
      <Flex direction="column" gap="xs">
        <Text size="sm" c="dimmed">
          スライド {data.id}
        </Text>
        <Text fw={500} lineClamp={2}>
          {data.title}
        </Text>
        <Badge color={data.issues > 0 ? "red" : "green"} variant="light">
          改善点: {data.issues}
        </Badge>
      </Flex>
    </Paper>
  );
};

const FlowArrow = ({ hasIssue, onClick }: { hasIssue: boolean; onClick?: () => void }) => (
  <Flex align="center" mx="xs" style={{ cursor: hasIssue ? "pointer" : "default" }}>
    <ChevronRight
      size={24}
      color={hasIssue ? "var(--mantine-color-red-6)" : "var(--mantine-color-gray-6)"}
      style={{ opacity: hasIssue ? 1 : 0.5 }}
      onClick={onClick}
    />
  </Flex>
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

  // スライド間の問題を特定する関数
  const getFlowIssue = (currentIndex: number) => {
    return sequenceIssues.find((issue) => issue.location.includes(slides[currentIndex].title) || issue.location.includes(slides[currentIndex + 1]?.title));
  };

  return (
    <Box>
      <Box mb="xl">
        <Flex direction="column-reverse" gap="xs">
          <Title order={2} mb="lg" c="#228be6">
            プレゼンテーションフロー分析
          </Title>
          <Text size="sm" c="#228be6" fw={700} tt="uppercase">
            Flow Analysis
          </Text>
        </Flex>
      </Box>

      <Box style={{ overflowX: "auto" }}>
        <Flex align="center" pb="md" style={{ minWidth: "max-content" }}>
          {slides.map((slide, index) => (
            <Flex key={slide.id} align="center">
              <Popover width={300} position="bottom" withArrow shadow="md">
                <Popover.Target>
                  <Box>
                    <SlideNode
                      data={slide}
                      onClick={() => {}} // ポップオーバーが自動で開閉を制御
                    />
                  </Box>
                </Popover.Target>
                <Popover.Dropdown>
                  <Text fw={500} mb="xs">
                    改善点
                  </Text>
                  {slide.issues > 0 ? (
                    <Text size="sm">
                      このスライドには{slide.issues}個の改善点があります。
                      {/* 実際の改善点の詳細をここに表示 */}
                    </Text>
                  ) : (
                    <Text size="sm" c="green">
                      問題点はありません
                    </Text>
                  )}
                </Popover.Dropdown>
              </Popover>

              {index < slides.length - 1 && (
                <Popover width={300} position="bottom" withArrow shadow="md">
                  <Popover.Target>
                    <Box>
                      <FlowArrow
                        hasIssue={!!getFlowIssue(index)}
                        onClick={() => {}} // ポップオーバーが自動で開閉を制御
                      />
                    </Box>
                  </Popover.Target>
                  {getFlowIssue(index) && (
                    <Popover.Dropdown>
                      <Text fw={500} mb="xs">
                        フローの問題点
                      </Text>
                      <Text size="sm">{getFlowIssue(index)?.issue}</Text>
                      <Text fw={500} mt="sm" mb="xs" c="green">
                        改善案
                      </Text>
                      <Text size="sm">{getFlowIssue(index)?.suggestion}</Text>
                    </Popover.Dropdown>
                  )}
                </Popover>
              )}
            </Flex>
          ))}
        </Flex>
      </Box>
    </Box>
  );
};
