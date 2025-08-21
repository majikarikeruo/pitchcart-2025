import React, { useState } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Button,
  Group,
  Text,
  Title,
  Divider,
  Rating,
  Checkbox,
  ActionIcon,
  Paper,
  Badge
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus, IconTrash, IconMessageQuestion } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { analysisService, PracticeFeedback } from '../../../services/analysis.service';
import { useAuth } from '../../../contexts/AuthContext';

interface FeedbackFormProps {
  opened: boolean;
  onClose: () => void;
  analysisId: string;
  onSubmit: () => void;
}

interface QuestionInput {
  question: string;
  category: string;
  wasAnticipated: boolean;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  opened,
  onClose,
  analysisId,
  onSubmit
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      presentationDate: new Date(),
      audienceSize: 10,
      audienceType: 'internal',
      overallSuccess: 3,
      audienceEngagement: 3,
      clarityOfMessage: 3,
      achievement: '',
      questions: [] as QuestionInput[],
      whatWentWell: '',
      whatToImprove: '',
      keyLearnings: ''
    },
    validate: {
      audienceSize: (value) => value > 0 ? null : '聴衆の人数を入力してください',
      achievement: (value) => value.trim() ? null : '達成した成果を入力してください',
      whatWentWell: (value) => value.trim() ? null : 'うまくいった点を入力してください',
      whatToImprove: (value) => value.trim() ? null : '改善点を入力してください'
    }
  });

  const audienceTypes = [
    { value: 'internal', label: '社内' },
    { value: 'client', label: 'クライアント' },
    { value: 'investor', label: '投資家' },
    { value: 'conference', label: 'カンファレンス' },
    { value: 'academic', label: '学術発表' },
    { value: 'other', label: 'その他' }
  ];

  const questionCategories = [
    { value: 'content', label: 'コンテンツ' },
    { value: 'data', label: 'データ・根拠' },
    { value: 'feasibility', label: '実現可能性' },
    { value: 'impact', label: 'インパクト' },
    { value: 'technical', label: '技術的詳細' },
    { value: 'business', label: 'ビジネス面' },
    { value: 'other', label: 'その他' }
  ];

  const addQuestion = () => {
    form.insertListItem('questions', {
      question: '',
      category: 'content',
      wasAnticipated: false
    });
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!user) return;

    try {
      setLoading(true);

      const feedback: Omit<PracticeFeedback, 'id' | 'createdAt'> = {
        analysisId,
        userId: user.uid,
        presentationDate: values.presentationDate,
        audience: {
          size: values.audienceSize,
          type: values.audienceType
        },
        outcomes: {
          overallSuccess: values.overallSuccess as 1 | 2 | 3 | 4 | 5,
          audienceEngagement: values.audienceEngagement as 1 | 2 | 3 | 4 | 5,
          clarityOfMessage: values.clarityOfMessage as 1 | 2 | 3 | 4 | 5,
          achievement: values.achievement
        },
        questionsReceived: values.questions,
        reflections: {
          whatWentWell: values.whatWentWell,
          whatToImprove: values.whatToImprove,
          keyLearnings: values.keyLearnings
        }
      };

      await analysisService.saveFeedback(feedback);

      notifications.show({
        title: '保存完了',
        message: 'フィードバックを保存しました',
        color: 'teal'
      });

      form.reset();
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Failed to save feedback:', error);
      notifications.show({
        title: 'エラー',
        message: 'フィードバックの保存に失敗しました',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconMessageQuestion size={24} />
          <Title order={3}>実践フィードバック</Title>
        </Group>
      }
      size="lg"
      closeOnClickOutside={false}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* 基本情報 */}
          <Paper p="md" withBorder>
            <Stack gap="sm">
              <Text fw={600}>プレゼンテーション情報</Text>
              
              <Group grow>
                <TextInput
                  type="date"
                  label="実施日"
                  {...form.getInputProps('presentationDate')}
                  value={form.values.presentationDate.toISOString().split('T')[0]}
                  onChange={(e) => form.setFieldValue('presentationDate', new Date(e.target.value))}
                />
                
                <Select
                  label="聴衆のタイプ"
                  data={audienceTypes}
                  {...form.getInputProps('audienceType')}
                />
              </Group>

              <NumberInput
                label="聴衆の人数"
                placeholder="10"
                min={1}
                {...form.getInputProps('audienceSize')}
              />
            </Stack>
          </Paper>

          {/* 成果評価 */}
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Text fw={600}>成果評価</Text>
              
              <div>
                <Text size="sm" mb="xs">全体的な成功度</Text>
                <Rating size="lg" {...form.getInputProps('overallSuccess')} />
              </div>

              <div>
                <Text size="sm" mb="xs">聴衆の関心度</Text>
                <Rating size="lg" {...form.getInputProps('audienceEngagement')} />
              </div>

              <div>
                <Text size="sm" mb="xs">メッセージの明確さ</Text>
                <Rating size="lg" {...form.getInputProps('clarityOfMessage')} />
              </div>

              <Textarea
                label="達成した成果"
                placeholder="例: 予算承認を獲得、次のステップへの合意を得た等"
                minRows={2}
                {...form.getInputProps('achievement')}
              />
            </Stack>
          </Paper>

          {/* 質問記録 */}
          <Paper p="md" withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={600}>受けた質問</Text>
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconPlus size={14} />}
                  onClick={addQuestion}
                >
                  質問を追加
                </Button>
              </Group>

              {form.values.questions.map((_, index) => (
                <Paper key={index} p="sm" withBorder>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Badge size="sm">質問 {index + 1}</Badge>
                      <ActionIcon
                        color="red"
                        variant="light"
                        size="sm"
                        onClick={() => form.removeListItem('questions', index)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                    
                    <TextInput
                      placeholder="質問内容を入力"
                      {...form.getInputProps(`questions.${index}.question`)}
                    />
                    
                    <Group grow>
                      <Select
                        size="sm"
                        placeholder="カテゴリ"
                        data={questionCategories}
                        {...form.getInputProps(`questions.${index}.category`)}
                      />
                      
                      <Checkbox
                        label="想定していた質問"
                        {...form.getInputProps(`questions.${index}.wasAnticipated`, {
                          type: 'checkbox'
                        })}
                      />
                    </Group>
                  </Stack>
                </Paper>
              ))}

              {form.values.questions.length === 0 && (
                <Text size="sm" c="dimmed" ta="center">
                  受けた質問を記録しておくと、次回の準備に役立ちます
                </Text>
              )}
            </Stack>
          </Paper>

          {/* 振り返り */}
          <Paper p="md" withBorder>
            <Stack gap="sm">
              <Text fw={600}>振り返り</Text>
              
              <Textarea
                label="うまくいった点"
                placeholder="例: ストーリーが明確だった、視覚的に分かりやすかった等"
                minRows={3}
                {...form.getInputProps('whatWentWell')}
              />

              <Textarea
                label="改善すべき点"
                placeholder="例: 時間配分、技術的説明の深さ等"
                minRows={3}
                {...form.getInputProps('whatToImprove')}
              />

              <Textarea
                label="主な学び（任意）"
                placeholder="今回のプレゼンから得た気づきや学び"
                minRows={2}
                {...form.getInputProps('keyLearnings')}
              />
            </Stack>
          </Paper>

          <Divider />

          <Group justify="flex-end">
            <Button variant="light" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" loading={loading}>
              保存する
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};