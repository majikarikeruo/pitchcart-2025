import React, { useState, useEffect } from "react";
import { Paper, Stack, Title, Group, Select, Text, Grid, Card, Progress, List, ThemeIcon, Divider, Center, Loader } from "@mantine/core";
import { IconTrendingUp, IconTrendingDown, IconEqual, IconChevronRight, IconCheck, IconX, IconArrowsHorizontal } from "@tabler/icons-react";
import { AnalysisHistory, analysisService } from "../../../services/analysis.service";

interface VersionComparisonProps {
  presentationId: string;
  currentVersionId?: string;
}

interface ScoreComparison {
  category: string;
  oldScore: number;
  newScore: number;
  difference: number;
  percentChange: number;
}

export const VersionComparison: React.FC<VersionComparisonProps> = ({ presentationId }) => {
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [version1, setVersion1] = useState<string>("");
  const [version2, setVersion2] = useState<string>("");
  const [analysis1, setAnalysis1] = useState<AnalysisHistory | null>(null);
  const [analysis2, setAnalysis2] = useState<AnalysisHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [presentationId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await analysisService.getAnalysisHistory("", presentationId);
      setHistory(data);

      if (data.length >= 2) {
        setVersion1(data[1].id);
        setVersion2(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (version1) {
      const a1 = history.find((h) => h.id === version1);
      setAnalysis1(a1 || null);
    }
  }, [version1, history]);

  useEffect(() => {
    if (version2) {
      const a2 = history.find((h) => h.id === version2);
      setAnalysis2(a2 || null);
    }
  }, [version2, history]);

  if (loading) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    );
  }

  if (history.length < 2) {
    return (
      <Paper p="xl" withBorder>
        <Center>
          <Text c="dimmed">比較するには2つ以上のバージョンが必要です</Text>
        </Center>
      </Paper>
    );
  }

  const getScoreComparisons = (): ScoreComparison[] => {
    if (!analysis1 || !analysis2) return [];

    const categories = [
      { key: "content", label: "コンテンツ" },
      { key: "design", label: "デザイン" },
      { key: "persuasiveness", label: "説得力" },
      { key: "technicalQuality", label: "技術品質" },
    ];

    return categories.map(({ key, label }) => {
      const oldScore = analysis1.metadata.categoryScores[key as keyof typeof analysis1.metadata.categoryScores];
      const newScore = analysis2.metadata.categoryScores[key as keyof typeof analysis2.metadata.categoryScores];
      const difference = newScore - oldScore;
      const percentChange = oldScore > 0 ? (difference / oldScore) * 100 : 0;

      return {
        category: label,
        oldScore,
        newScore,
        difference,
        percentChange,
      };
    });
  };

  const getScoreIcon = (difference: number) => {
    if (difference > 0) return <IconTrendingUp size={16} color="teal" />;
    if (difference < 0) return <IconTrendingDown size={16} color="red" />;
    return <IconEqual size={16} color="gray" />;
  };

  const getScoreColor = (difference: number) => {
    if (difference > 0) return "teal";
    if (difference < 0) return "red";
    return "gray";
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  return (
    <Paper p="xl" withBorder>
      <Stack gap="lg">
        <Title order={3}>バージョン比較</Title>

        <Grid>
          <Grid.Col span={5}>
            <Select
              label="比較元バージョン"
              value={version1}
              onChange={(value) => value && setVersion1(value)}
              data={history.map((h) => ({
                value: h.id,
                label: `v${h.version} - ${formatDate(h.createdAt)}`,
              }))}
            />
          </Grid.Col>

          <Grid.Col span={2}>
            <Center h="100%">
              <IconArrowsHorizontal size={24} color="gray" />
            </Center>
          </Grid.Col>

          <Grid.Col span={5}>
            <Select
              label="比較先バージョン"
              value={version2}
              onChange={(value) => value && setVersion2(value)}
              data={history.map((h) => ({
                value: h.id,
                label: `v${h.version} - ${formatDate(h.createdAt)}`,
              }))}
            />
          </Grid.Col>
        </Grid>

        {analysis1 && analysis2 && (
          <>
            <Divider />

            {/* 総合スコア比較 */}
            <Card withBorder>
              <Stack gap="md">
                <Text fw={600}>総合スコア</Text>
                <Group justify="space-between" align="center">
                  <Stack gap="xs" align="center">
                    <Text size="xs" c="dimmed">
                      v{analysis1.version}
                    </Text>
                    <Text size="xl" fw={700}>
                      {analysis1.metadata.totalScore.toFixed(1)}
                    </Text>
                  </Stack>

                  <Stack gap="xs" align="center">
                    {getScoreIcon(analysis2.metadata.totalScore - analysis1.metadata.totalScore)}
                    <Text size="sm" fw={600} c={getScoreColor(analysis2.metadata.totalScore - analysis1.metadata.totalScore)}>
                      {analysis2.metadata.totalScore - analysis1.metadata.totalScore > 0 ? "+" : ""}
                      {(analysis2.metadata.totalScore - analysis1.metadata.totalScore).toFixed(1)}点
                    </Text>
                  </Stack>

                  <Stack gap="xs" align="center">
                    <Text size="xs" c="dimmed">
                      v{analysis2.version}
                    </Text>
                    <Text size="xl" fw={700}>
                      {analysis2.metadata.totalScore.toFixed(1)}
                    </Text>
                  </Stack>
                </Group>
              </Stack>
            </Card>

            {/* カテゴリ別スコア比較 */}
            <Stack gap="sm">
              <Text fw={600}>カテゴリ別スコア</Text>
              {getScoreComparisons().map((comparison) => (
                <Card key={comparison.category} p="sm" withBorder>
                  <Group justify="space-between" align="center">
                    <Text size="sm" fw={500} w={100}>
                      {comparison.category}
                    </Text>

                    <Group gap="xs" flex={1}>
                      <Text size="sm" c="dimmed">
                        {comparison.oldScore.toFixed(1)}
                      </Text>
                      <Progress value={comparison.oldScore} color="gray" size="sm" style={{ flex: 1 }} />
                    </Group>

                    <Group gap="xs" w={80} justify="center">
                      {getScoreIcon(comparison.difference)}
                      <Text size="xs" fw={600} c={getScoreColor(comparison.difference)}>
                        {comparison.difference > 0 ? "+" : ""}
                        {comparison.difference.toFixed(1)}
                      </Text>
                    </Group>

                    <Group gap="xs" flex={1}>
                      <Progress value={comparison.newScore} color={getScoreColor(comparison.difference)} size="sm" style={{ flex: 1 }} />
                      <Text size="sm" fw={600}>
                        {comparison.newScore.toFixed(1)}
                      </Text>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>

            {/* 改善点と新規課題 */}
            {analysis2.comparison && (
              <>
                <Divider />

                <Grid>
                  <Grid.Col span={6}>
                    <Stack gap="sm">
                      <Group>
                        <ThemeIcon color="teal" size="sm">
                          <IconCheck size={16} />
                        </ThemeIcon>
                        <Text fw={600} size="sm">
                          改善された点
                        </Text>
                      </Group>
                      <List
                        spacing="xs"
                        size="sm"
                        icon={
                          <ThemeIcon color="teal" size={20} radius="xl">
                            <IconChevronRight size={12} />
                          </ThemeIcon>
                        }
                      >
                        {analysis2.comparison.improvedAreas.map((area, index) => (
                          <List.Item key={index}>{area}</List.Item>
                        ))}
                      </List>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={6}>
                    <Stack gap="sm">
                      <Group>
                        <ThemeIcon color="red" size="sm">
                          <IconX size={16} />
                        </ThemeIcon>
                        <Text fw={600} size="sm">
                          新たな課題
                        </Text>
                      </Group>
                      <List
                        spacing="xs"
                        size="sm"
                        icon={
                          <ThemeIcon color="red" size={20} radius="xl">
                            <IconChevronRight size={12} />
                          </ThemeIcon>
                        }
                      >
                        {analysis2.comparison.newIssues.map((issue, index) => (
                          <List.Item key={index}>{issue}</List.Item>
                        ))}
                      </List>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
};
