import React, { useState, useEffect } from "react";
import { Container, Title, Stack, Grid, Card, Text, Group, Badge, Select, Tabs, Paper, SimpleGrid, Loader, Progress } from "@mantine/core";
import { IconTrendingUp, IconPresentationAnalytics, IconTarget, IconCalendar } from "@tabler/icons-react";
import type { PracticeFeedback } from "@/services/analysis.service";
import { useAuth } from "../contexts/AuthContext";
import { analysisService, AnalysisHistory } from "@/services/analysis.service";
import { ScoreProgressChart } from "@/components/features/Dashboard/ScoreProgressChart";
import { CategoryRadarChart } from "@/components/features/Dashboard/CategoryRadarChart";
import { AchievementBadges } from "@/components/features/Dashboard/AchievementBadges";
import { GoalTracker } from "@/components/features/Dashboard/GoalTracker";
import { FeedbackSummary } from "@/components/features/Dashboard/FeedbackSummary";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("3months");
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [feedbacks, setFeedbacks] = useState<PracticeFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const timeRangeOptions = [
    { value: "1month", label: "過去1ヶ月" },
    { value: "3months", label: "過去3ヶ月" },
    { value: "6months", label: "過去6ヶ月" },
    { value: "1year", label: "過去1年" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setLoading(true);
        try {
          const history = await analysisService.getAnalysisHistory(user.uid);
          setAnalysisHistory(history);
          // 全分析のフィードバックを取得
          const allFeedbacks: PracticeFeedback[] = [];
          for (const h of history.slice(0, 10)) {
            try {
              const fb = await analysisService.getFeedback(h.id);
              allFeedbacks.push(...fb);
            } catch { /* skip */ }
          }
          setFeedbacks(allFeedbacks);
        } catch (error) {
          console.error("Failed to fetch analysis history:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user]);

  if (!user) {
    return (
      <Container py={48} size="xl">
        <Text>ログインが必要です</Text>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container py={48} size="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>データを読み込んでいます...</Text>
        </Stack>
      </Container>
    );
  }

  // 統計データの計算
  const totalAnalysisCount = analysisHistory.length;
  const averageScore = totalAnalysisCount > 0
    ? Math.round(analysisHistory.reduce((sum, item) => sum + item.metadata.totalScore, 0) / totalAnalysisCount * 10) / 10
    : 0;

  // スコアの推移を計算（最新3件を比較）
  const recentAnalyses = analysisHistory.slice(0, 3);
  const scoreImprovement = recentAnalyses.length >= 2
    ? Math.round((recentAnalyses[0].metadata.totalScore - recentAnalyses[recentAnalyses.length - 1].metadata.totalScore) * 10) / 10
    : 0;

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
                  {totalAnalysisCount}
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
                  {averageScore.toFixed(1)}
                </Text>
                {scoreImprovement !== 0 && (
                  <Badge size="xs" color={scoreImprovement > 0 ? "teal" : "red"} variant="light">
                    {scoreImprovement > 0 ? `+${scoreImprovement}↑` : `${scoreImprovement}↓`}
                  </Badge>
                )}
              </div>
            </Group>
          </Card>

          <Card withBorder>
            <Group gap="xs">
              <IconTarget size={20} color="orange" />
              <div>
                <Text size="xs" c="dimmed">
                  最高スコア
                </Text>
                <Text fw={700} size="lg">
                  {totalAnalysisCount > 0 ? Math.max(...analysisHistory.map(h => h.metadata.totalScore)).toFixed(0) : 0}
                </Text>
              </div>
            </Group>
          </Card>

          <Card withBorder>
            <Group gap="xs">
              <IconCalendar size={20} color="violet" />
              <div>
                <Text size="xs" c="dimmed">
                  プレゼン数
                </Text>
                <Text fw={700} size="lg">
                  {new Set(analysisHistory.map(h => h.presentationId)).size}
                </Text>
                <Badge size="xs" color="violet" variant="light">
                  {totalAnalysisCount}回分析
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
              <ScoreProgressChart timeRange={timeRange} />
              <CategoryRadarChart timeRange={timeRange} />

              <Paper p="lg" withBorder>
                <Title order={4} mb="md">
                  📈 分析履歴
                </Title>
                {totalAnalysisCount === 0 ? (
                  <Text c="dimmed">まだ分析履歴がありません。プレゼンチェックから分析を開始しましょう。</Text>
                ) : (
                  <Stack gap="md">
                    {analysisHistory.slice(0, 5).map((item) => (
                      <Card key={item.id} withBorder p="md">
                        <Group justify="space-between" mb="xs">
                          <div>
                            <Text fw={600}>{item.presentationTitle}</Text>
                            <Text size="xs" c="dimmed">
                              バージョン {item.version} • {item.createdAt?.toDate?.().toLocaleDateString() || "日付不明"}
                            </Text>
                          </div>
                          <Badge color={item.metadata.totalScore >= 80 ? "teal" : item.metadata.totalScore >= 60 ? "orange" : "red"}>
                            {item.metadata.totalScore.toFixed(0)}点
                          </Badge>
                        </Group>
                        <Group gap="xs">
                          <Badge size="sm" variant="light">明確性: {item.metadata.categoryScores.content.toFixed(0)}</Badge>
                          <Badge size="sm" variant="light">デザイン: {item.metadata.categoryScores.design.toFixed(0)}</Badge>
                          <Badge size="sm" variant="light">説得力: {item.metadata.categoryScores.persuasiveness.toFixed(0)}</Badge>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Paper>

              <FeedbackSummary timeRange={timeRange} />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="analysis" pt="lg">
            <Grid>
              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Paper p="lg" withBorder>
                  <Title order={4} mb="md">
                    分析パターン
                  </Title>
                  {totalAnalysisCount === 0 ? (
                    <Text size="sm" c="dimmed">分析データがありません</Text>
                  ) : (
                    <Stack gap="md">
                      {(() => {
                        const avgCategories = {
                          content: analysisHistory.reduce((s, h) => s + h.metadata.categoryScores.content, 0) / totalAnalysisCount,
                          design: analysisHistory.reduce((s, h) => s + h.metadata.categoryScores.design, 0) / totalAnalysisCount,
                          persuasiveness: analysisHistory.reduce((s, h) => s + h.metadata.categoryScores.persuasiveness, 0) / totalAnalysisCount,
                          technicalQuality: analysisHistory.reduce((s, h) => s + h.metadata.categoryScores.technicalQuality, 0) / totalAnalysisCount,
                        };
                        const categories = [
                          { key: "content", label: "コンテンツ", color: "blue" },
                          { key: "design", label: "デザイン・構成", color: "violet" },
                          { key: "persuasiveness", label: "説得力", color: "orange" },
                          { key: "technicalQuality", label: "技術的品質", color: "teal" },
                        ] as const;
                        const sorted = [...categories].sort(
                          (a, b) => avgCategories[b.key] - avgCategories[a.key]
                        );
                        return sorted.map((cat) => (
                          <div key={cat.key}>
                            <Group justify="space-between" mb={4}>
                              <Text size="sm">{cat.label}</Text>
                              <Text size="sm" fw={600}>{avgCategories[cat.key].toFixed(1)}</Text>
                            </Group>
                            <Progress value={avgCategories[cat.key]} color={cat.color} size="md" />
                          </div>
                        ));
                      })()}
                      {recentAnalyses.length >= 2 && (
                        <Card withBorder p="sm" mt="xs">
                          <Text size="xs" fw={600} mb={4}>直近の傾向</Text>
                          {(() => {
                            const latest = recentAnalyses[0].metadata.categoryScores;
                            const prev = recentAnalyses[1].metadata.categoryScores;
                            const diffs = [
                              { label: "コンテンツ", diff: latest.content - prev.content },
                              { label: "デザイン", diff: latest.design - prev.design },
                              { label: "説得力", diff: latest.persuasiveness - prev.persuasiveness },
                              { label: "技術的品質", diff: latest.technicalQuality - prev.technicalQuality },
                            ];
                            return (
                              <Group gap="xs">
                                {diffs.map((d) => (
                                  <Badge key={d.label} size="sm" variant="light" color={d.diff > 0 ? "teal" : d.diff < 0 ? "red" : "gray"}>
                                    {d.label}: {d.diff > 0 ? "+" : ""}{d.diff.toFixed(0)}
                                  </Badge>
                                ))}
                              </Group>
                            );
                          })()}
                        </Card>
                      )}
                    </Stack>
                  )}
                </Paper>
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Paper p="lg" withBorder>
                  <Title order={4} mb="md">
                    質問傾向分析
                  </Title>
                  {feedbacks.length === 0 ? (
                    <Text size="sm" c="dimmed">フィードバックデータがありません。プレゼン実施後にフィードバックを記録すると表示されます。</Text>
                  ) : (
                    <Stack gap="md">
                      {(() => {
                        const categoryLabels: Record<string, string> = {
                          content: "コンテンツ内容",
                          data: "データ・根拠",
                          feasibility: "実現可能性",
                          impact: "インパクト",
                          technical: "技術的詳細",
                          business: "ビジネス面",
                        };
                        const catCount = new Map<string, { total: number; unanticipated: number }>();
                        feedbacks.forEach((fb) =>
                          fb.questionsReceived.forEach((q) => {
                            const entry = catCount.get(q.category) || { total: 0, unanticipated: 0 };
                            entry.total++;
                            if (!q.wasAnticipated) entry.unanticipated++;
                            catCount.set(q.category, entry);
                          })
                        );
                        const sorted = Array.from(catCount.entries()).sort((a, b) => b[1].total - a[1].total);
                        const maxCount = sorted[0]?.[1].total || 1;
                        return (
                          <>
                            {sorted.map(([cat, counts]) => (
                              <div key={cat}>
                                <Group justify="space-between" mb={4}>
                                  <Text size="sm">{categoryLabels[cat] || cat}</Text>
                                  <Group gap={4}>
                                    <Text size="sm" fw={600}>{counts.total}件</Text>
                                    {counts.unanticipated > 0 && (
                                      <Badge size="xs" color="red" variant="light">想定外{counts.unanticipated}</Badge>
                                    )}
                                  </Group>
                                </Group>
                                <Progress value={(counts.total / maxCount) * 100} color="blue" size="sm" />
                              </div>
                            ))}
                            <Card withBorder p="sm" mt="xs">
                              <Text size="xs" fw={600} mb={4}>想定外の質問率</Text>
                              {(() => {
                                const totalQ = feedbacks.reduce((s, fb) => s + fb.questionsReceived.length, 0);
                                const unanticipatedQ = feedbacks.reduce(
                                  (s, fb) => s + fb.questionsReceived.filter((q) => !q.wasAnticipated).length, 0
                                );
                                const rate = totalQ > 0 ? Math.round((unanticipatedQ / totalQ) * 100) : 0;
                                return (
                                  <Group gap="xs">
                                    <Progress value={rate} color={rate > 50 ? "red" : rate > 30 ? "orange" : "teal"} size="lg" style={{ flex: 1 }} />
                                    <Text size="sm" fw={600}>{rate}%</Text>
                                  </Group>
                                );
                              })()}
                            </Card>
                          </>
                        );
                      })()}
                    </Stack>
                  )}
                </Paper>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="achievements" pt="lg">
            <AchievementBadges />
          </Tabs.Panel>

          <Tabs.Panel value="goals" pt="lg">
            <GoalTracker />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};
