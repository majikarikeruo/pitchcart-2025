import React, { useState, useEffect } from "react";
import { Paper, Title, Stack, Text, Group, Badge, Progress, SimpleGrid, Card, Timeline, ThemeIcon, Loader, Center } from "@mantine/core";
import { IconMoodHappy, IconTarget, IconCalendar, IconUsers } from "@tabler/icons-react";
import { useAuth } from "../../../contexts/AuthContext";
import { analysisService } from "../../../services/analysis.service";
import { generateDummyAnalysisHistory, generateDummyFeedback } from "../../../services/dummy.service";

interface FeedbackSummaryProps {
  timeRange: string;
}

export const FeedbackSummary: React.FC<FeedbackSummaryProps> = ({ timeRange }) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFeedbackSummary();
    }
  }, [user, timeRange]);

  const loadFeedbackSummary = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 匿名ユーザーの場合はダミーデータを使用
      if (user.isAnonymous) {
        const dummyHistory = generateDummyAnalysisHistory(user.uid);
        const allFeedbacks = [];

        for (const analysis of dummyHistory.slice(0, 3)) {
          const dummyFeedbacks = generateDummyFeedback(analysis.id, user.uid);
          allFeedbacks.push(...dummyFeedbacks);
        }

        if (allFeedbacks.length === 0) {
          setSummary({ noFeedback: true });
          return;
        }

        // サマリー統計を計算（ダミーデータ用）
        const avgRatings = {
          overall: 0,
          engagement: 0,
          clarity: 0,
        };

        let totalQuestions = 0;
        let unanticipatedQuestions = 0;
        const audienceTypes = new Map();
        const recentFeedbacks = allFeedbacks.slice(0, 3);

        allFeedbacks.forEach((fb) => {
          avgRatings.overall += fb.outcomes.overallSuccess;
          avgRatings.engagement += fb.outcomes.audienceEngagement;
          avgRatings.clarity += fb.outcomes.clarityOfMessage;

          totalQuestions += fb.questionsReceived.length;
          unanticipatedQuestions += fb.questionsReceived.filter((q) => !q.wasAnticipated).length;

          const type = fb.audience.type;
          audienceTypes.set(type, (audienceTypes.get(type) || 0) + 1);
        });

        // 平均を計算
        (Object.keys(avgRatings) as (keyof typeof avgRatings)[]).forEach((key) => {
          avgRatings[key] = avgRatings[key] / allFeedbacks.length;
        });

        const mostCommonAudience = Array.from(audienceTypes.entries()).sort((a, b) => b[1] - a[1])[0];

        setSummary({
          totalFeedbacks: allFeedbacks.length,
          avgRatings,
          totalQuestions,
          unanticipatedRate: totalQuestions > 0 ? (unanticipatedQuestions / totalQuestions) * 100 : 0,
          mostCommonAudience: mostCommonAudience ? mostCommonAudience[0] : null,
          recentFeedbacks,
        });
      } else {
        // 通常ユーザーの処理
        const history = await analysisService.getAnalysisHistory(user.uid);

        if (history.length === 0) {
          setSummary(null);
          return;
        }

        // 全てのフィードバックを取得
        const allFeedbacks = [];
        for (const analysis of history.slice(0, 10)) {
          const feedbacks = await analysisService.getFeedback(analysis.id);
          allFeedbacks.push(...feedbacks.map((fb) => ({ ...fb, analysisId: analysis.id })));
        }

        if (allFeedbacks.length === 0) {
          setSummary({ noFeedback: true });
          return;
        }

        // サマリー統計を計算
        const avgRatings = {
          overall: 0,
          engagement: 0,
          clarity: 0,
        };

        let totalQuestions = 0;
        let unanticipatedQuestions = 0;
        const audienceTypes = new Map();
        const recentFeedbacks = allFeedbacks.slice(0, 3);

        allFeedbacks.forEach((fb) => {
          avgRatings.overall += fb.outcomes.overallSuccess;
          avgRatings.engagement += fb.outcomes.audienceEngagement;
          avgRatings.clarity += fb.outcomes.clarityOfMessage;

          totalQuestions += fb.questionsReceived.length;
          unanticipatedQuestions += fb.questionsReceived.filter((q) => !q.wasAnticipated).length;

          const type = fb.audience.type;
          audienceTypes.set(type, (audienceTypes.get(type) || 0) + 1);
        });

        // 平均を計算
        (Object.keys(avgRatings) as (keyof typeof avgRatings)[]).forEach((key) => {
          avgRatings[key] = avgRatings[key] / allFeedbacks.length;
        });

        const mostCommonAudience = Array.from(audienceTypes.entries()).sort((a, b) => b[1] - a[1])[0];

        setSummary({
          totalFeedbacks: allFeedbacks.length,
          avgRatings,
          totalQuestions,
          unanticipatedRate: totalQuestions > 0 ? (unanticipatedQuestions / totalQuestions) * 100 : 0,
          mostCommonAudience: mostCommonAudience ? mostCommonAudience[0] : null,
          recentFeedbacks,
        });
      }
    } catch (error) {
      console.error("Failed to load feedback summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAudienceTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      internal: "社内",
      client: "クライアント",
      investor: "投資家",
      conference: "カンファレンス",
      academic: "学術発表",
      other: "その他",
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <Paper p="xl" withBorder>
        <Center h={200}>
          <Loader />
        </Center>
      </Paper>
    );
  }

  if (!summary || summary.noFeedback) {
    return (
      <Paper p="xl" withBorder>
        <Stack align="center" gap="md">
          <Title order={4}>💬 実践フィードバック要約</Title>
          <Text c="dimmed" ta="center">
            まだ実践フィードバックがありません。
            <br />
            プレゼン後の振り返りを記録して、より詳細な成長分析を受けましょう。
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="xl" withBorder>
      <Stack gap="lg">
        <Title order={4}>💬 実践フィードバック要約</Title>

        {/* 評価指標サマリー */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Card p="md" withBorder>
            <Group gap="xs">
              <ThemeIcon color="teal" variant="light" size="sm">
                <IconMoodHappy size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  全体満足度
                </Text>
                <Text fw={700} size="lg">
                  {summary.avgRatings.overall.toFixed(1)}
                </Text>
                <Progress value={summary.avgRatings.overall * 20} color="teal" size="xs" mt="xs" />
              </div>
            </Group>
          </Card>

          <Card p="md" withBorder>
            <Group gap="xs">
              <ThemeIcon color="blue" variant="light" size="sm">
                <IconUsers size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  聴衆関心度
                </Text>
                <Text fw={700} size="lg">
                  {summary.avgRatings.engagement.toFixed(1)}
                </Text>
                <Progress value={summary.avgRatings.engagement * 20} color="blue" size="xs" mt="xs" />
              </div>
            </Group>
          </Card>

          <Card p="md" withBorder>
            <Group gap="xs">
              <ThemeIcon color="orange" variant="light" size="sm">
                <IconTarget size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  メッセージ明確性
                </Text>
                <Text fw={700} size="lg">
                  {summary.avgRatings.clarity.toFixed(1)}
                </Text>
                <Progress value={summary.avgRatings.clarity * 20} color="orange" size="xs" mt="xs" />
              </div>
            </Group>
          </Card>
        </SimpleGrid>

        {/* 統計情報 */}
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          <div style={{ textAlign: "center" }}>
            <Text size="xs" c="dimmed">
              総フィードバック数
            </Text>
            <Text fw={700} size="lg">
              {summary.totalFeedbacks}
            </Text>
          </div>

          <div style={{ textAlign: "center" }}>
            <Text size="xs" c="dimmed">
              受けた質問数
            </Text>
            <Text fw={700} size="lg">
              {summary.totalQuestions}
            </Text>
          </div>

          <div style={{ textAlign: "center" }}>
            <Text size="xs" c="dimmed">
              想定外質問率
            </Text>
            <Text fw={700} size="lg" c={summary.unanticipatedRate > 50 ? "red" : "teal"}>
              {summary.unanticipatedRate.toFixed(0)}%
            </Text>
          </div>

          <div style={{ textAlign: "center" }}>
            <Text size="xs" c="dimmed">
              主な聴衆
            </Text>
            <Badge variant="light" size="sm">
              {summary.mostCommonAudience ? getAudienceTypeLabel(summary.mostCommonAudience) : "なし"}
            </Badge>
          </div>
        </SimpleGrid>

        {/* 最近のフィードバック */}
        {summary.recentFeedbacks.length > 0 && (
          <div>
            <Title order={5} mb="md">
              最近の実践記録
            </Title>
            <Timeline bulletSize={24} lineWidth={2}>
              {summary.recentFeedbacks.map((feedback: any, index: number) => {
                let date: Date;
                if (feedback.presentationDate instanceof Date) {
                  date = feedback.presentationDate;
                } else if (feedback.presentationDate?.toDate) {
                  date = feedback.presentationDate.toDate();
                } else if (feedback.presentationDate?.seconds) {
                  date = new Date(feedback.presentationDate.seconds * 1000);
                } else {
                  date = new Date(feedback.presentationDate);
                }

                return (
                  <Timeline.Item key={index} bullet={<IconCalendar size={12} />} title={date.toLocaleDateString("ja-JP")}>
                    <Group gap="xs" mb="xs">
                      <Badge size="xs" variant="light">
                        {getAudienceTypeLabel(feedback.audience.type)}
                      </Badge>
                      <Badge size="xs" variant="light" color="gray">
                        {feedback.audience.size}名
                      </Badge>
                      <Text size="xs" c="dimmed">
                        満足度: {feedback.outcomes.overallSuccess}/5
                      </Text>
                    </Group>

                    <Text size="sm" lineClamp={2}>
                      {feedback.outcomes.achievement}
                    </Text>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          </div>
        )}
      </Stack>
    </Paper>
  );
};
