import React, { useState } from 'react';
import {
  Container,
  Title,
  Stack,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  Select,
  Tabs,
  Paper,
  SimpleGrid
} from '@mantine/core';
import { IconTrendingUp, IconPresentationAnalytics, IconTarget, IconCalendar } from '@tabler/icons-react';
import { ScoreProgressChart } from '../components/features/Dashboard/ScoreProgressChart';
import { CategoryRadarChart } from '../components/features/Dashboard/CategoryRadarChart';
import { FeedbackSummary } from '../components/features/Dashboard/FeedbackSummary';
import { AchievementBadges } from '../components/features/Dashboard/AchievementBadges';
import { GoalTracker } from '../components/features/Dashboard/GoalTracker';
import { PresentationCalendar } from '../components/features/Dashboard/PresentationCalendar';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [timeRange, setTimeRange] = useState('3months');

  const timeRangeOptions = [
    { value: '1month', label: '過去1ヶ月' },
    { value: '3months', label: '過去3ヶ月' },
    { value: '6months', label: '過去6ヶ月' },
    { value: '1year', label: '過去1年' }
  ];

  if (!userProfile) {
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
            <Text c="dimmed">
              {userProfile.displayName || 'ユーザー'}さんのプレゼンテーション成長記録
            </Text>
          </div>
          
          <Select
            value={timeRange}
            onChange={(value) => value && setTimeRange(value)}
            data={timeRangeOptions}
            w={180}
          />
        </Group>

        {/* 概要統計 */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          <Card withBorder>
            <Group gap="xs">
              <IconPresentationAnalytics size={20} color="blue" />
              <div>
                <Text size="xs" c="dimmed">総分析回数</Text>
                <Text fw={700} size="lg">{userProfile.usage.analysisCount || 0}</Text>
              </div>
            </Group>
          </Card>

          <Card withBorder>
            <Group gap="xs">
              <IconTrendingUp size={20} color="teal" />
              <div>
                <Text size="xs" c="dimmed">平均スコア</Text>
                <Text fw={700} size="lg">82.4</Text>
                <Badge size="xs" color="teal" variant="light">+5.2↑</Badge>
              </div>
            </Group>
          </Card>

          <Card withBorder>
            <Group gap="xs">
              <IconTarget size={20} color="orange" />
              <div>
                <Text size="xs" c="dimmed">達成目標</Text>
                <Text fw={700} size="lg">4/6</Text>
                <Badge size="xs" color="orange" variant="light">67%</Badge>
              </div>
            </Group>
          </Card>

          <Card withBorder>
            <Group gap="xs">
              <IconCalendar size={20} color="violet" />
              <div>
                <Text size="xs" c="dimmed">実践回数</Text>
                <Text fw={700} size="lg">12</Text>
                <Badge size="xs" color="violet" variant="light">月平均4回</Badge>
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
            <Grid>
              <Grid.Col span={{ base: 12, lg: 8 }}>
                <ScoreProgressChart timeRange={timeRange} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 4 }}>
                <CategoryRadarChart timeRange={timeRange} />
              </Grid.Col>
            </Grid>
            
            <Grid mt="lg">
              <Grid.Col span={12}>
                <FeedbackSummary timeRange={timeRange} />
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="analysis" pt="lg">
            <Grid>
              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Paper p="lg" withBorder>
                  <Title order={4} mb="md">分析パターン</Title>
                  <Text size="sm" c="dimmed">開発中...</Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Paper p="lg" withBorder>
                  <Title order={4} mb="md">質問傾向分析</Title>
                  <Text size="sm" c="dimmed">開発中...</Text>
                </Paper>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="achievements" pt="lg">
            <Stack>
              <AchievementBadges />
              <Paper p="lg" withBorder>
                <Title order={4} mb="md">成長マイルストーン</Title>
                <Text size="sm" c="dimmed">開発中...</Text>
              </Paper>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="goals" pt="lg">
            <Grid>
              <Grid.Col span={{ base: 12, lg: 8 }}>
                <GoalTracker />
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 4 }}>
                <PresentationCalendar />
              </Grid.Col>
            </Grid>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};