import React, { useState } from "react";
import { Container, Title, Stack, Grid, Card, Text, Group, Badge, Select, Tabs, Paper, SimpleGrid } from "@mantine/core";
import { IconTrendingUp, IconPresentationAnalytics, IconTarget, IconCalendar } from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("3months");

  const timeRangeOptions = [
    { value: "1month", label: "過去1ヶ月" },
    { value: "3months", label: "過去3ヶ月" },
    { value: "6months", label: "過去6ヶ月" },
    { value: "1year", label: "過去1年" },
  ];

  if (!user) {
    return (
      <Container py={48} size="xl">
        <Text>ログインが必要です</Text>
      </Container>
    );
  }

  return (
    <Container py={48} size="xl">
      <Stack gap="xl">
        {/* ヘッダー */}
        <Group justify="space-between">
          <div>
            <Title order={2}>📊 成長ダッシュボード</Title>
            <Text c="dimmed">プレゼンテーション成長記録</Text>
          </div>

          <Select value={timeRange} onChange={(value) => value && setTimeRange(value)} data={timeRangeOptions} w={180} />
        </Group>

        {/* 概要統計 */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          <Card withBorder>
            <Group gap="xs">
              <IconPresentationAnalytics size={20} color="blue" />
              <div>
                <Text size="xs" c="dimmed">
                  総分析回数
                </Text>
                <Text fw={700} size="lg">
                  3
                </Text>
              </div>
            </Group>
          </Card>

          <Card withBorder>
            <Group gap="xs">
              <IconTrendingUp size={20} color="teal" />
              <div>
                <Text size="xs" c="dimmed">
                  平均スコア
                </Text>
                <Text fw={700} size="lg">
                  82.4
                </Text>
                <Badge size="xs" color="teal" variant="light">
                  +5.2↑
                </Badge>
              </div>
            </Group>
          </Card>

          <Card withBorder>
            <Group gap="xs">
              <IconTarget size={20} color="orange" />
              <div>
                <Text size="xs" c="dimmed">
                  達成目標
                </Text>
                <Text fw={700} size="lg">
                  4/6
                </Text>
                <Badge size="xs" color="orange" variant="light">
                  67%
                </Badge>
              </div>
            </Group>
          </Card>

          <Card withBorder>
            <Group gap="xs">
              <IconCalendar size={20} color="violet" />
              <div>
                <Text size="xs" c="dimmed">
                  実践回数
                </Text>
                <Text fw={700} size="lg">
                  12
                </Text>
                <Badge size="xs" color="violet" variant="light">
                  月平均4回
                </Badge>
              </div>
            </Group>
          </Card>
        </SimpleGrid>

        {/* メインコンテンツ */}
        <Tabs defaultValue="progress">
          <Tabs.List>
            <Tabs.Tab value="progress">📈 成長推移</Tabs.Tab>
            <Tabs.Tab value="analysis">🔍 分析詳細</Tabs.Tab>
            <Tabs.Tab value="achievements">🏆 実績・バッジ</Tabs.Tab>
            <Tabs.Tab value="goals">🎯 目標管理</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="progress" pt="lg">
            <Stack gap="lg">
              <Paper p="lg" withBorder>
                <Title order={4} mb="md">
                  📈 成長推移
                </Title>
                <Text>過去のプレゼンテーション分析結果から成長の軌跡を確認できます。</Text>
                <Text size="sm" c="dimmed" mt="md">
                  • 総合スコアの推移
                  <br />
                  • カテゴリ別評価の変化
                  <br />• 改善傾向の分析
                </Text>
              </Paper>

              <Paper p="lg" withBorder>
                <Title order={4} mb="md">
                  💬 実践フィードバック
                </Title>
                <Text>実際のプレゼンテーション後の振り返りデータから学習効果を分析します。</Text>
                <Text size="sm" c="dimmed" mt="md">
                  • 聴衆の反応分析
                  <br />
                  • 質問傾向の把握
                  <br />• 実践スキルの向上度
                </Text>
              </Paper>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="analysis" pt="lg">
            <Grid>
              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Paper p="lg" withBorder>
                  <Title order={4} mb="md">
                    分析パターン
                  </Title>
                  <Text size="sm" c="dimmed">
                    開発中...
                  </Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Paper p="lg" withBorder>
                  <Title order={4} mb="md">
                    質問傾向分析
                  </Title>
                  <Text size="sm" c="dimmed">
                    開発中...
                  </Text>
                </Paper>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="achievements" pt="lg">
            <Paper p="lg" withBorder>
              <Title order={4} mb="md">
                🏆 実績・バッジ
              </Title>
              <Text>プレゼンテーションスキルの向上に応じて様々なバッジを獲得できます。</Text>
              <Text size="sm" c="dimmed" mt="md">
                • 継続学習バッジ
                <br />
                • スコア向上バッジ
                <br />• 実践記録バッジ
              </Text>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="goals" pt="lg">
            <Paper p="lg" withBorder>
              <Title order={4} mb="md">
                🎯 目標管理
              </Title>
              <Text>個人の学習目標を設定し、達成状況を追跡できます。</Text>
              <Text size="sm" c="dimmed" mt="md">
                • 月間分析目標
                <br />
                • スコア向上目標
                <br />• 実践回数目標
              </Text>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};
