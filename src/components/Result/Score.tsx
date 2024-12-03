import { Stack, SimpleGrid, List, RingProgress, Card, Progress, Text, Title, Flex, Button, ListItem, Box } from "@mantine/core";
import { useState } from "react";

export const Score = () => {
  const [selectedMainCategory, setSelectedMainCategory] = useState("impact");
  console.log(selectedMainCategory);

  const mainCategories = [
    { id: "impact", label: "影響", score: 80 },
    { id: "feasibility", label: "実現可能性", score: 75 },
    { id: "presentation", label: "プレゼンテーション", score: 70 },
  ];

  const subCategories = {
    impact: [
      {
        title: "市場適合度",
        score: 70,
        items: [
          "評価できる点: プレゼンの中で「相手が知りたい情報を的確に把握できる」との発言があり、市場ニーズを意識したアプローチが見られる。",
          "懸念される点: 市場ニーズの具体的なデータが不足しており、説得力に欠ける。",
          "改善の余地: 市場調査データや顧客からのフィードバックを具体的に提示することが必要。",
        ],
      },
      {
        title: "価値提案",
        score: 75,
        items: [
          "評価できる点: AIを活用した具体的なサービス内容が紹介され、独自性がある。",
          "懸念される点: 競合との差別化が曖昧で、具体的な利点が伝わりにくい。",
          "改善の余地: 競合分析を強化し、Pitch Cartの特異性を明確にする。",
        ],
      },
      {
        title: "競争優位性",
        score: 65,
        items: [
          "評価できる点: 技術的な裏付けがあり、プレゼンの中で具体的な技術スタックが紹介されている。",
          "懸念される点: 競合優位性の持続可能性に関する情報が不足している。",
          "改善の余地: 技術の進化や市場動向に対する適応戦略を示す。",
        ],
      },
    ],
    feasibility: [
      {
        title: "技術的実現性",
        score: 80,
        items: [
          "評価できる点:  使用技術（React, Pythonなど）の具体的な説明があり、技術的な裏付けがある。",
          "懸念される点:  MVPの開発段階での技術的課題が予想される。",
          "改善の余地: 開発中の具体的な技術課題とその解決策を提示すること。",
        ],
      },
      {
        title: "リソースの充足度",
        score: 70,
        items: [
          "評価できる点: 資金調達の計画が示されているが、チーム構成や専門性に関する情報が不足。",
          "懸念される点: 必要なリソースの確保が不十分に見える。",
          "改善の余地: チームメンバーの紹介や役割分担を明示する。",
        ],
      },
      {
        title: "実行力",
        score: 75,
        items: [
          "評価できる点: 明確なロードマップが提示され、実行計画が見える。",
          "懸念される点: 実行の実績が不足しているため、信頼性に欠ける。",
          "改善の余地:  過去の実績や成功事例を示す。",
        ],
      },
    ],
    presentation: [
      {
        title: "説明の明確さ",
        score: 75,
        items: [
          "評価できる点: プレゼンの内容は概ね明確だが、一部専門用語が多く、理解しづらい部分がある。",
          "懸念される点: 聴衆の理解を助けるための具体例が不足。",
          "改善の余地: 視覚的なスライドを用いて具体例を提示する。",
        ],
      },
      {
        title: "構造の適切さ",
        score: 70,
        items: [
          "評価できる点: 論理的な構造で進んでいるが、一部のスライドのつながりが不明確。",
          "懸念される点: 各セクションの関連性が弱い。",
          "改善の余地: 各セクションのつながりを強調する。",
        ],
      },
      {
        title: "聴衆の関心度 ",
        score: 65,
        items: [
          "評価できる点: 聴衆の興味を引く要素が多く、インタラクティブな要素もある。",
          "懸念される点: さらに参加を促す要素があれば良い。",
          "改善の余地:  質問タイムやディスカッションを取り入れる。",
        ],
      },
    ],
  };

  return (
    <Box px={24}>
      <Card withBorder radius="md" padding="xl" bg="white" mb={24} px={24} py={16}>
        <Flex gap={48} align="center">
          <RingProgress
            size={184}
            roundCaps
            thickness={8}
            sections={[{ value: 72, color: "red" }]}
            label={
              <Flex direction="column" align="center" justify="center">
                <Text fz="md" tt="uppercase" fw={700} c="dimmed">
                  総合スコア
                </Text>
                <Flex fz="lg" fw={500} gap={8} align="baseline">
                  <Text fz={48} fw={700}>
                    72
                  </Text>
                  <Text fz={16} fw={500}>
                    /
                  </Text>
                  <Text fz={16} fw={500}>
                    100
                  </Text>
                </Flex>
              </Flex>
            }
          />

          <Box>
            <Text fz="md">
              「Pitch
              Cart」は、資金調達に向けた強い価値提案を持っているものの、いくつかの改善点が指摘されました。特に、競合優位性の強化と提案内容の明確化が求められます。これにより、プレゼンテーションの質を向上させ、投資家の関心を引きつけることができるでしょう。
            </Text>
          </Box>
        </Flex>
      </Card>

      {/* メインカテゴリー選択 */}
      <Stack mb="md">
        <SimpleGrid cols={3} className="gap-4 justify-center mb-8">
          {mainCategories.map((category) => (
            <Button
              key={category.id}
              onClick={() => setSelectedMainCategory(category.id)}
              w="100%"
              style={{
                height: 64,
                backgroundColor: selectedMainCategory === category.id ? "#007bff" : "#fff",
                color: selectedMainCategory === category.id ? "#fff" : "#000",
                border: selectedMainCategory === category.id ? "1px solid #007bff" : "1px solid #ddd",
              }}
              styles={{
                inner: {
                  width: "100%",
                },
              }}
            >
              <Text fz={16}>{category.label}</Text>
              <Text fw={700} fz={32} ml={24}>
                {category.score}
              </Text>
            </Button>
          ))}
        </SimpleGrid>
      </Stack>

      <Title order={4} my={24}>
        {mainCategories.find((category) => category.id === selectedMainCategory)?.label}
      </Title>

      {/* サブカテゴリーのグリッド表示 */}
      <SimpleGrid cols={3} style={{ border: "1px solid #ddd", padding: "16px" }} bg="white">
        {subCategories[selectedMainCategory].map((subCategory, index) => (
          <Stack key={index} px="sm">
            <Flex align="center" justify="center">
              <RingProgress
                size={144}
                roundCaps
                thickness={8}
                ta="center"
                sections={[{ value: subCategory.score, color: "red" }]}
                label={
                  <>
                    <Title order={6} c="dimmed">
                      {subCategory.title}
                    </Title>
                    <Text fw={700} fz={27}>
                      {subCategory.score}
                    </Text>
                  </>
                }
              />
            </Flex>

            <List>
              {subCategory.items.map((item, itemIndex) => (
                <ListItem key={itemIndex} style={{ fontSize: "14px" }} mt="xs">
                  {item}
                </ListItem>
              ))}
            </List>
          </Stack>
        ))}
      </SimpleGrid>
    </Box>
  );
};
