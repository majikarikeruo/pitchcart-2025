import React, { useState, useEffect } from "react";
import { Paper, Stack, Title, Text, Badge, Group, Card, Timeline, ThemeIcon, Rating, Spoiler, Loader, Center, Button } from "@mantine/core";
import { IconCalendar, IconUsers, IconTarget, IconBulb, IconQuestionMark, IconPlus, IconChevronRight } from "@tabler/icons-react";
import { analysisService, PracticeFeedback } from "../../../services/analysis.service";
import { FeedbackForm } from "./FeedbackForm";

interface FeedbackListProps {
  analysisId: string;
}

export const FeedbackList: React.FC<FeedbackListProps> = ({ analysisId }) => {
  const [feedbacks, setFeedbacks] = useState<PracticeFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadFeedbacks();
  }, [analysisId]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await analysisService.getFeedback(analysisId);
      setFeedbacks(data);
    } catch (error) {
      console.error("Failed to load feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    const d = date instanceof Date ? date : date?.toDate?.() || new Date(date);
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
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

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      content: "コンテンツ",
      data: "データ・根拠",
      feasibility: "実現可能性",
      impact: "インパクト",
      technical: "技術的詳細",
      business: "ビジネス面",
      other: "その他",
    };
    return categories[category] || category;
  };

  if (loading) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    );
  }

  return (
    <Paper p="xl" withBorder>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={3}>実践フィードバック履歴</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setShowForm(true)} variant="light">
            フィードバックを追加
          </Button>
        </Group>

        {feedbacks.length === 0 ? (
          <Card p="xl" withBorder>
            <Stack align="center" gap="md">
              <ThemeIcon size={48} variant="light" color="gray">
                <IconBulb size={24} />
              </ThemeIcon>
              <Text c="dimmed" ta="center">
                まだフィードバックがありません。
                <br />
                プレゼン実施後の振り返りを記録しましょう。
              </Text>
              <Button leftSection={<IconPlus size={16} />} onClick={() => setShowForm(true)}>
                最初のフィードバックを追加
              </Button>
            </Stack>
          </Card>
        ) : (
          <Timeline active={feedbacks.length} bulletSize={24} lineWidth={2}>
            {feedbacks.map((feedback) => (
              <Timeline.Item key={feedback.id} bullet={<IconCalendar size={12} />} title={formatDate(feedback.presentationDate)}>
                <Card mt="sm" p="md" withBorder>
                  <Stack gap="md">
                    {/* 基本情報 */}
                    <Group gap="xs">
                      <Badge leftSection={<IconUsers size={12} />} variant="light">
                        {getAudienceTypeLabel(feedback.audience.type)}
                      </Badge>
                      <Badge variant="light" color="gray">
                        {feedback.audience.size}名
                      </Badge>
                    </Group>

                    {/* 評価スコア */}
                    <Group gap="xl">
                      <div>
                        <Text size="xs" c="dimmed">
                          全体評価
                        </Text>
                        <Rating value={feedback.outcomes.overallSuccess} readOnly size="sm" />
                      </div>
                      <div>
                        <Text size="xs" c="dimmed">
                          関心度
                        </Text>
                        <Rating value={feedback.outcomes.audienceEngagement} readOnly size="sm" />
                      </div>
                      <div>
                        <Text size="xs" c="dimmed">
                          明確さ
                        </Text>
                        <Rating value={feedback.outcomes.clarityOfMessage} readOnly size="sm" />
                      </div>
                    </Group>

                    {/* 達成成果 */}
                    <Paper p="sm" withBorder>
                      <Group gap="xs" mb="xs">
                        <ThemeIcon size="sm" variant="light" color="teal">
                          <IconTarget size={14} />
                        </ThemeIcon>
                        <Text size="sm" fw={600}>
                          達成成果
                        </Text>
                      </Group>
                      <Text size="sm">{feedback.outcomes.achievement}</Text>
                    </Paper>

                    {/* 受けた質問 */}
                    {feedback.questionsReceived.length > 0 && (
                      <div>
                        <Group gap="xs" mb="xs">
                          <ThemeIcon size="sm" variant="light" color="blue">
                            <IconQuestionMark size={14} />
                          </ThemeIcon>
                          <Text size="sm" fw={600}>
                            受けた質問
                          </Text>
                          <Badge size="xs" variant="light">
                            {feedback.questionsReceived.length}件
                          </Badge>
                        </Group>
                        <Stack gap="xs">
                          {feedback.questionsReceived.slice(0, 2).map((q, idx) => (
                            <Group key={idx} gap="xs">
                              <Badge size="xs" variant="dot">
                                {getCategoryLabel(q.category)}
                              </Badge>
                              <Text size="xs" c={q.wasAnticipated ? "dimmed" : undefined}>
                                {q.question}
                              </Text>
                              {q.wasAnticipated && (
                                <Badge size="xs" color="green" variant="light">
                                  想定済み
                                </Badge>
                              )}
                            </Group>
                          ))}
                          {feedback.questionsReceived.length > 2 && (
                            <Text size="xs" c="dimmed">
                              他{feedback.questionsReceived.length - 2}件の質問
                            </Text>
                          )}
                        </Stack>
                      </div>
                    )}

                    {/* 振り返り */}
                    <Spoiler
                      maxHeight={80}
                      showLabel={
                        <Group gap="xs">
                          <Text size="xs">振り返りを表示</Text>
                          <IconChevronRight size={14} />
                        </Group>
                      }
                      hideLabel="閉じる"
                    >
                      <Stack gap="sm" mt="sm">
                        <div>
                          <Text size="xs" fw={600} c="teal">
                            うまくいった点
                          </Text>
                          <Text size="sm">{feedback.reflections.whatWentWell}</Text>
                        </div>
                        <div>
                          <Text size="xs" fw={600} c="orange">
                            改善点
                          </Text>
                          <Text size="sm">{feedback.reflections.whatToImprove}</Text>
                        </div>
                        {feedback.reflections.keyLearnings && (
                          <div>
                            <Text size="xs" fw={600} c="blue">
                              学び
                            </Text>
                            <Text size="sm">{feedback.reflections.keyLearnings}</Text>
                          </div>
                        )}
                      </Stack>
                    </Spoiler>
                  </Stack>
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        )}

        <FeedbackForm
          opened={showForm}
          onClose={() => setShowForm(false)}
          analysisId={analysisId}
          onSubmit={() => {
            loadFeedbacks();
            setShowForm(false);
          }}
        />
      </Stack>
    </Paper>
  );
};
