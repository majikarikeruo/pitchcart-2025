import { Pill, Grid, Timeline, Stack, Title, Text, Box, Flex, ThemeIcon, Modal, Button } from "@mantine/core";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useState } from "react";

export const Improvement = () => {
  const [opened, setOpened] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const items = [
    {
      value: "1",
      title: (
        <Pill defaultChecked styles={{ root: { backgroundColor: "#f8d7da", borderRadius: 8, color: "#b91c1c", fontSize: 12 } }}>
          優先度・高
        </Pill>
      ),
      icon: <AlertCircle style={{ marginRight: 8 }} color="red" size={80} />,
      description: (
        <>
          <Title order={5} mt={16}>
            競合分析を明示する
          </Title>
          <Timeline bulletSize={24} lineWidth={2} p={16} ml={16} styles={{ itemTitle: { fontWeight: 700, marginBottom: 16 } }}>
            <Timeline.Item title="現状" fw={500}>
              <Text mb={12} fz={14} mt={8}>
                競合との違いが不明瞭
              </Text>
              <Text mb={12} fz={14} mt={8}>
                競合優位性が伝わりにくい
              </Text>
              <Text mb={12} fz={14} mt={8}>
                投資家の信頼を得られない可能性がある
              </Text>
            </Timeline.Item>
            <Timeline.Item title="改善案">
              <Text mb={12} fz={14} mt={8}>
                競合調査を行う (2週間)
              </Text>
              <Text mb={12} fz={14} mt={8}>
                競合との差別化ポイントをスライドに追加 (3日)
              </Text>
            </Timeline.Item>
            <Timeline.Item title="期待される結果">
              <Text mb={12} fz={14} mt={8}>
                投資家からの信頼度が向上
              </Text>
              <Text mb={12} fz={14} mt={8}>
                市場での位置づけが明確になる
              </Text>
              <Text mb={12} fz={14} mt={8}>
                投資家からの信頼度が15%向上
              </Text>
            </Timeline.Item>
          </Timeline>
        </>
      ),
    },
    {
      value: "2",
      title: (
        <Pill defaultChecked styles={{ root: { backgroundColor: "#ffedd5", borderRadius: 8, color: "#EF8844", fontSize: 12 } }}>
          優先度・中
        </Pill>
      ),
      icon: <AlertTriangle style={{ marginRight: 8 }} color="orange" size={80} />,
      description: (
        <>
          <Title order={5} mt={16}>
            収益モデルの説明を強化
          </Title>
          <Timeline bulletSize={24} lineWidth={2} p={16} ml={16} styles={{ itemTitle: { fontWeight: 700, marginBottom: 16 } }}>
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
        </>
      ),
    },
    {
      value: "3",
      title: (
        <Pill defaultChecked styles={{ root: { backgroundColor: "#e7f5ff", borderRadius: 8, color: "#228be6", fontSize: 12 } }}>
          優先度・低
        </Pill>
      ),
      icon: <Info style={{ marginRight: 8 }} color="blue" size={80} />,
      description: (
        <>
          <Title order={5} mt={16}>
            市場ニーズの具体性を増す
          </Title>
          <Timeline bulletSize={24} lineWidth={2} p={16} ml={16} styles={{ itemTitle: { fontWeight: 700, marginBottom: 16 } }}>
            <Timeline.Item title="現状" fw={500}>
              <Text mb={12} fz={14} mt={8}>
                ・市場ニーズの具体的なデータが不足
              </Text>
              <Text mb={12} fz={14} mt={8}>
                ・具体的な市場調査データがない
              </Text>
              <Text mb={12} fz={14} mt={8}>
                ・投資家の信頼を得られない可能性がある
              </Text>
            </Timeline.Item>
            <Timeline.Item title="改善計画">
              <Text mb={12} fz={14} mt={8}>
                市場調査を実施する (1ヶ月)
              </Text>
              <Text mb={12} fz={14} mt={8}>
                調査結果をスライドに組み込む (1週間)
              </Text>
            </Timeline.Item>
            <Timeline.Item title="期待される結果">
              <Text mb={12} fz={14} mt={8}>
                即時効果: 投資家の関心を引く
              </Text>
              <Text mb={12} fz={14} mt={8}>
                長期的利点: 市場との適合性が向上
              </Text>
              <Text mb={12} fz={14} mt={8}>
                指標への影響: 投資家からの関心度が20%向上
              </Text>
            </Timeline.Item>
          </Timeline>
        </>
      ),
    },
  ];

  return (
    <Stack my={100}>
      <Flex direction="column-reverse" gap="xs">
        <Title order={2} fz={40} mb="lg" c="#228be6">
          改善提案
        </Title>
        <Text size="sm" c="#228be6" fw={700} tt="uppercase">
          Improvement
        </Text>
      </Flex>

      <Grid>
        {items.map((item) => (
          <Grid.Col span={4} key={item.value}>
            <Box bg={"white"} p={16} style={{ border: "1px solid #E9ECEF" }} pos="relative">
              <ThemeIcon size={80} radius="xl" variant="white" color="#228be6">
                {item.icon}
              </ThemeIcon>
              <Text size="sm" c="#228be6" fw={700} tt="uppercase">
                {item.title}{" "}
              </Text>

              <Title order={4} mt={16}>
                {item.description.props.children[0].props.children}
              </Title>
              <Button
                variant="light"
                color="blue"
                fullWidth
                mt="md"
                onClick={() => {
                  setSelectedItem(item);
                  setOpened(true);
                }}
              >
                詳細を見る
              </Button>
            </Box>
          </Grid.Col>
        ))}
      </Grid>

      <Modal opened={opened} onClose={() => setOpened(false)} title={selectedItem?.description.props.children[0]} size="lg">
        {selectedItem?.description.props.children[1]}
      </Modal>
    </Stack>
  );
};
