import { Transition, Grid, Progress, Stack, SimpleGrid, ThemeIcon, RingProgress, Card, Text, Title, Flex, Button, ListItem, Box } from "@mantine/core";
import { useState } from "react";
import { Info, Check, X } from "lucide-react";

export const Score = () => {
  const [selectedMainCategory, setSelectedMainCategory] = useState("impact");
  console.log(selectedMainCategory);

  const mainCategories = [
    { id: "impact", label: "影響力", score: 80 },
    { id: "feasibility", label: "実現可能性", score: 75 },
    { id: "presentation", label: "プレゼンテーション", score: 70 },
  ];

  const subCategories = {
    impact: [
      {
        title: "市場適合度",
        score: 70,
        items: [
          {
            icon: <Check size={16} color="#2772dd" />,
            label: "評価できる点",
            text: "プレゼンの中で「相手が知りたい情報を的確に把握できる」との発言があり、市場ニーズを意識したアプローチが見られる。",
          },
          {
            icon: <X size={16} color="red" />,
            label: "懸念される点",
            text: "市場ニーズの具体的なデータが不足しており、説得力に欠ける。",
          },
          {
            icon: <Info size={16} color="#059669" />,
            label: "改善の余地",
            text: "市場調査データや顧客からのフィードバックを具体的に提示することが必要。",
          },
        ],
      },
      {
        title: "価値提案",
        score: 75,
        items: [
          {
            icon: <Check size={16} color="#2772dd" />,
            label: "評価できる点",
            text: "AIを活用した具体的なサービス内容が紹介され、独自性がある。",
          },
          {
            icon: <X size={16} color="red" />,
            label: "懸念される点",
            text: "競合との差別化が曖昧で、具体的な利点が伝わりにくい。",
          },
          {
            icon: <Info size={16} color="#059669" />,
            label: "改善の余地",
            text: "競合分析を強化し、Pitch Cartの特異性を明確にする。",
          },
        ],
      },
      {
        title: "競争優位性",
        score: 65,
        items: [
          {
            icon: <Check size={16} color="#2772dd" />,
            label: "評価できる点",
            text: "技術的な裏付けがあり、プレゼンの中で具体的な技術スタックが紹介されている。",
          },
          {
            icon: <X size={16} color="red" />,
            label: "懸念される点",
            text: "競合優位性の持続可能性に関する情報が不足している。",
          },
          {
            icon: <Info size={16} color="#059669" />,
            label: "改善の余地",
            text: "技術の進化や市場動向に対する適応戦略を示す。",
          },
        ],
      },
    ],
    feasibility: [
      {
        title: "技術的実現性",
        score: 80,
        items: [
          {
            icon: <Check size={16} color="#2772dd" />,
            label: "評価できる点",
            text: "使用技術（React, Pythonなど）の具体的な説明があり、技術的な裏付けがある。",
          },
          {
            icon: <X size={16} color="red" />,
            label: "懸念される点",
            text: "MVPの開発段階での技術的課題が予想される。",
          },
          {
            icon: <Info size={16} color="#059669" />,
            label: "改善の余地",
            text: "開発中の具体的な技術課題とその解決策を提示すること。",
          },
        ],
      },
      {
        title: "リソースの充足度",
        score: 70,
        items: [
          {
            icon: <Check size={16} color="#2772dd" />,
            label: "評価できる点",
            text: "資金調達の計画が示されているが、チーム構成や専門性に関する情報が不足。",
          },
          {
            icon: <X size={16} color="red" />,
            label: "懸念される点",
            text: "必要なリソースの確保が不十分に見える。",
          },
          {
            icon: <Info size={16} color="#059669" />,
            label: "改善の余地",
            text: "チームメンバーの紹介や役割分担を明示する。",
          },
        ],
      },
      {
        title: "実行力",
        score: 75,
        items: [
          {
            icon: <Check size={16} color="#2772dd" />,
            label: "評価できる点",
            text: "明確なロードマップが提示され、実行計画が見える。",
          },
          {
            icon: <X size={16} color="red" />,
            label: "懸念される点",
            text: "実行の実績が不足しているため、信頼性に欠ける。",
          },
          {
            icon: <Info size={16} color="#059669" />,
            label: "改善の余地",
            text: "過去の実績や成功事例を示す。",
          },
        ],
      },
    ],
    presentation: [
      {
        title: "説明の明確さ",
        score: 75,
        items: [
          {
            icon: <Check size={16} color="#2772dd" />,
            label: "評価できる点",
            text: "プレゼンの内容は概ね明確だが、一部専門用語が多く、理解しづらい部分がある。",
          },
          {
            icon: <X size={16} color="red" />,
            label: "懸念される点",
            text: "聴衆の理解を助けるための具体例が不足。",
          },
          {
            icon: <Info size={16} color="#059669" />,
            label: "改善の余地",
            text: "視覚的なスライドを用いて具体例を提示する。",
          },
        ],
      },
      {
        title: "構造の適切さ",
        score: 70,
        items: [
          {
            icon: <Check size={16} color="#2772dd" />,
            label: "評価できる点",
            text: "論理的な構造で進んでいるが、一部のスライドのつながりが不明確。",
          },
          {
            icon: <X size={16} color="red" />,
            label: "懸念される点",
            text: "各セクションの関連性が弱い。",
          },
          {
            icon: <Info size={16} color="#059669" />,
            label: "改善の余地",
            text: "各セクションのつながりを強調する。",
          },
        ],
      },
      {
        title: "聴衆の関心度 ",
        score: 65,
        items: [
          {
            icon: <Check size={16} color="#2772dd" />,
            label: "評価できる点",
            text: "聴衆の興味を引く要素が多く、インタラクティブな要素もある。",
          },
          {
            icon: <X size={16} color="red" />,
            label: "懸念される点",
            text: "さらに参加を促す要素があれば良い。",
          },
          {
            icon: <Info size={16} color="#059669" />,
            label: "改善の余地",
            text: "質問タイムやディスカッションを取り入れる。",
          },
        ],
      },
    ],
  };

  return (
    <Box mb="xl">
      <Card withBorder radius="md" padding="xl" bg="white" mb={24} px={40} py={24}>
        <Flex gap={48} align="center">
          <RingProgress
            size={240}
            roundCaps
            thickness={14}
            sections={[{ value: 72, color: "red" }]}
            label={
              <Flex direction="column" align="center" justify="center">
                <Text fz="md" tt="uppercase" fw={700} c="dimmed">
                  総合スコア
                </Text>
                <Flex fw={500} gap={8} align="baseline">
                  <Text fz={48} fw={700} lh={1.1}>
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
            <Box mb="md">
              <Grid>
                <Grid.Col span={4}>
                  <Text size="sm" fw={700} c="dimmed">
                    プレゼン相手
                  </Text>
                  <Text size="lg" fw={700}>
                    ベンチャーキャピタル
                  </Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="sm" fw={700} c="dimmed">
                    プレゼンの目的
                  </Text>
                  <Text size="lg" fw={700}>
                    シリーズAの資金調達
                  </Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="sm" fw={700} c="dimmed">
                    業界
                  </Text>
                  <Text size="lg" fw={700}>
                    SaaS / AI
                  </Text>
                </Grid.Col>
              </Grid>
            </Box>
            <Text fz="md" lh={1.75}>
              「Pitch
              Cart」は、資金調達に向けた強い価値提案を持っているものの、いくつかの改善点が指摘されました。特に、競合優位性の強化と提案内容の明確化が求められます。これにより、プレゼンテーションの質を向上させ、投資家の関心を引きつけることができるでしょう。
            </Text>
          </Box>
        </Flex>
      </Card>

      {/* メインカテゴリー選択 */}
      <Stack mb="xl">
        <SimpleGrid cols={3} className="gap-4 justify-center mb-8">
          {mainCategories.map((category) => (
            <Card
              withBorder
              key={category.id}
              onClick={() => setSelectedMainCategory(category.id)}
              w="100%"
              style={{
                backgroundColor: selectedMainCategory === category.id ? "#e7f2ff" : "#fff",
                color: selectedMainCategory === category.id ? "#007bff" : "#000",
                border: selectedMainCategory === category.id ? "1px solid #007bff" : "1px solid #ddd",
              }}
            >
              <Text fz={16} fw={700} c="dimmed">
                {category.label}
              </Text>
              <Box fw={700} fz={32} style={{ display: "flex", alignItems: "baseline" }}>
                {category.score}
                <Text fz={16} mx={4}>
                  /
                </Text>
                <Text fz={16}>100</Text>
              </Box>
              <Progress value={category.score} mt="md" size="lg" radius="xl" />
            </Card>
          ))}
        </SimpleGrid>
      </Stack>

      <Transition mounted={true} transition="fade" duration={400} timingFunction="ease">
        {(styles) => (
          <Box style={styles}>
            <Flex direction="column-reverse" gap={8}>
              <Title order={2} fz={40} mb={16} c="#228be6">
                {mainCategories.find((category) => category.id === selectedMainCategory)?.label}
              </Title>
              <Text fz={16} lh={1.75} c="#228be6" tt="uppercase" fw={700}>
                {mainCategories.find((category) => category.id === selectedMainCategory)?.id}
              </Text>
            </Flex>
            {/* サブカテゴリーのグリッド表示 */}
            <SimpleGrid cols={3} style={{ border: "1px solid #ddd", padding: "16px" }} bg="white">
              {subCategories[selectedMainCategory as keyof typeof subCategories].map((subCategory, index) => (
                <Stack key={index} px="md">
                  <Flex align="center" justify="center">
                    <RingProgress
                      size={200}
                      roundCaps
                      thickness={12}
                      ta="center"
                      sections={[{ value: subCategory.score, color: "red" }]}
                      label={
                        <>
                          <Title order={6} c="dimmed">
                            {subCategory.title}
                          </Title>
                          <Text fw={700} fz={40}>
                            {subCategory.score}
                          </Text>
                        </>
                      }
                    />
                  </Flex>

                  <Box>
                    {subCategory.items.map((item, itemIndex) => (
                      <Box mt={16} key={itemIndex}>
                        <Flex align="start" key={itemIndex} style={{ fontSize: "14px" }} mb={4}>
                          <ThemeIcon mr={8} mb={4} variant="white">
                            {item.icon}
                          </ThemeIcon>
                          <Box>
                            <Title order={6}>{item.label}</Title>
                            <Text fz={14}>{item.text}</Text>
                          </Box>
                        </Flex>
                      </Box>
                    ))}
                  </Box>
                </Stack>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Transition>
    </Box>
  );
};
