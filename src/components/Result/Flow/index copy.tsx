import { Box, Flex, Text, Popover } from "@mantine/core";
import { SlideNode } from "@/components/Result/Flow/SlideNode";
import { FlowArrow } from "@/components/Result/Flow/FlowArrow";
import { FlowHeading } from "@/components/Result/Flow/FlowHeading";

export const Flow = ({ heatmapFlow }) => {
  const {
    slide_heatmap: { slides },
  } = heatmapFlow;
  console.log(slides);

  const sequenceIssues = [
    {
      location: "プロダクト説明から市場分析への移行部分",
      issue:
        "Pitch Cartの機能説明から市場分析への流れが唐突であり、一貫性が欠けている。",
      suggestion:
        "プロダクトの利点とその背景となる市場ニーズを関連づけて説明し、その後に市場分析へとつなげることで流れを自然にする。",
    },
    {
      location: "「私たちが実現したい世界」のセクション",
      issue:
        "「私たちが実現したい世界」のセクションで具体的なビジョンから離れてしまい、聴衆との関連性が薄れる。",
      suggestion:
        "「私たちが実現したい世界」のビジョンとPitch Cartの具体的な効果や利点を結びつけて話すことで、一貫したメッセージとして強調する。",
    },
    {
      location: "技術スタックから収益モデルへの展開",
      issue:
        "技術的な特徴の説明から収益モデルへの展開が急激で、価値提供の説明が不足している。",
      suggestion:
        "技術的優位性がどのように顧客価値につながり、収益化できるのかのストーリーを段階的に説明する。",
    },
  ];

  // スライド間の問題を特定する関数
  const getFlowIssue = (currentIndex: number) => {
    return sequenceIssues.find(
      (issue) =>
        issue.location.includes(slides[currentIndex].title) ||
        issue.location.includes(slides[currentIndex + 1]?.title)
    );
  };

  return (
    <Box mb={"xl"}>
      <FlowHeading />

      <Box style={{ overflowX: "auto" }}>
        <Flex align="center" pb="md" style={{ minWidth: "max-content" }}>
          {slides.map((slide, index) => (
            <Flex key={index} align="center">
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
                      このスライドには{slide.issues.length}
                      個の改善点があります。
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
