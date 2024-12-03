import { Accordion, Timeline, Stack, Title, Text, Box } from "@mantine/core";
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info } from "lucide-react";

export const Improvement = () => {
  const items = [
    {
      value: "1",
      title: "優先度・高の改善提案",
      icon: <AlertCircle style={{ marginRight: 8 }} color="red" />,
      description: (
        <Box style={{ border: "1px solid #E9ECEF" }}>
          <Box bg={"white"} p={16}>
            <Timeline bulletSize={24} lineWidth={2} p={16} ml={16}>
              <Timeline.Item title="対象" fw={500}>
                <Text mb={12} fz={14} mt={8}>
                  市場適合度
                </Text>
              </Timeline.Item>
              <Timeline.Item title="現状">
                <Text mb={12} fz={14} mt={8}>
                  市場ニーズのデータが欠如
                </Text>
              </Timeline.Item>
              <Timeline.Item title="改善案">
                <Text mb={12} fz={14} mt={8}>
                  顧客調査を行い、具体的なデータを収集。次回のプレゼンに反映
                </Text>
              </Timeline.Item>
              <Timeline.Item title="期待される結果">
                <Text mb={12} fz={14} mt={8}>
                  プレゼンの説得力向上
                </Text>
              </Timeline.Item>
            </Timeline>
          </Box>
        </Box>
      ),
    },
    {
      value: "2",
      title: "優先度・中の改善提案",
      icon: <AlertTriangle style={{ marginRight: 8 }} color="orange" />,
      description: (
        <Box style={{ border: "1px solid #E9ECEF" }}>
          <Timeline bulletSize={24} lineWidth={2} p={16} ml={16}>
            <Timeline.Item title="対象" fw={500}>
              <Text mb={12} fz={14} mt={8}>
                競争優位性
              </Text>
            </Timeline.Item>
            <Timeline.Item title="現状">
              <Text mb={12} fz={14} mt={8}>
                競合分析が不足
              </Text>
            </Timeline.Item>
            <Timeline.Item title="改善案">
              <Text mb={12} fz={14} mt={8}>
                投資家の理解を深める
              </Text>
            </Timeline.Item>
          </Timeline>

          <Timeline bulletSize={24} lineWidth={2} p={16} ml={16}>
            <Timeline.Item title="対象" fw={500}>
              <Text mb={12} fz={14} mt={8}>
                収益モデル
              </Text>
            </Timeline.Item>
            <Timeline.Item title="現状">
              <Text mb={12} fz={14} mt={8}>
                長期的な収益性の説明が不足
              </Text>
            </Timeline.Item>
            <Timeline.Item title="改善案">
              <Text mb={12} fz={14} mt={8}>
                3年間の収支計画と成長戦略の詳細を追加
              </Text>
            </Timeline.Item>
            <Timeline.Item title="期待される結果">
              <Text mb={12} fz={14} mt={8}>
                ビジネスの持続可能性の理解促進
              </Text>
            </Timeline.Item>
          </Timeline>
        </Box>
      ),
    },
    {
      value: "3",
      title: "優先度・低の改善提案",
      icon: <Info style={{ marginRight: 8 }} color="blue" />,
      description: (
        <Box style={{ border: "1px solid #E9ECEF" }}>
          <Timeline bulletSize={24} lineWidth={2} p={16} ml={16}>
            <Timeline.Item title="提案1">
              <Text mb={12} fz={14} mt={8}>
                提案内容
              </Text>
            </Timeline.Item>
          </Timeline>
        </Box>
      ),
    },
  ];

  return (
    <Stack my={80}>
      <Title order={3} align="center">
        改善提案
      </Title>
      <Text align="center">優先度別に、プレゼン改善のための具体的な提案を行います。</Text>

      <Accordion defaultValue="Apples" styles={{ label: { display: "flex", alignItems: "center" } }}>
        {items.map((item) => (
          <Accordion.Item key={item.value} value={item.value} bg="gray.1" radius={8} my={16} px={8}>
            <Accordion.Control style={{ backgroundColor: "white" }}>
              {item.icon}
              {item.title}
            </Accordion.Control>
            <Accordion.Panel style={{ backgroundColor: "white" }} py={8}>
              {item.description}
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
};
