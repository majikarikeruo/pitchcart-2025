import React, { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Stack,
  Group,
  Badge,
  Text,
  SimpleGrid,
  Card,
  ThemeIcon,
  Progress,
  Tooltip,
  Center,
  Loader
} from '@mantine/core';
import {
  IconTrophy,
  IconStar,
  IconFlame,
  IconTarget,
  IconTrendingUp,
  IconBrain,
  IconUsers,
  IconCalendar,
  IconQuestionMark,
  IconCheck
} from '@tabler/icons-react';
import { useAuth } from '../../../contexts/AuthContext';
import { analysisService } from '../../../services/analysis.service';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt?: Date;
}

export const AchievementBadges: React.FC = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      calculateAchievements();
    }
  }, [user]);

  const calculateAchievements = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // ユーザーのデータを取得
      const history = await analysisService.getAnalysisHistory(user.uid);
      
      // フィードバックデータを取得
      const allFeedbacks = [];
      for (const analysis of history.slice(0, 20)) {
        const feedbacks = await analysisService.getFeedback(analysis.id);
        allFeedbacks.push(...feedbacks);
      }

      // 実績の定義と計算
      const achievementList: Achievement[] = [
        // 基本実績
        {
          id: 'first_analysis',
          name: '初回分析',
          description: '初めてのプレゼン分析を完了',
          icon: <IconStar size={20} />,
          color: 'yellow',
          unlocked: history.length >= 1,
          progress: Math.min(history.length, 1),
          maxProgress: 1
        },
        {
          id: 'analysis_streak_5',
          name: '継続分析者',
          description: '5回連続で分析を実行',
          icon: <IconFlame size={20} />,
          color: 'orange',
          unlocked: history.length >= 5,
          progress: Math.min(history.length, 5),
          maxProgress: 5
        },
        {
          id: 'analysis_master',
          name: '分析マスター',
          description: '20回以上の分析を実行',
          icon: <IconBrain size={20} />,
          color: 'violet',
          unlocked: history.length >= 20,
          progress: Math.min(history.length, 20),
          maxProgress: 20
        },

        // スコア関連
        {
          id: 'high_scorer',
          name: 'ハイスコアラー',
          description: '総合スコア90点以上を達成',
          icon: <IconTrophy size={20} />,
          color: 'gold',
          unlocked: history.some(h => h.metadata.totalScore >= 90),
          progress: Math.max(...history.map(h => h.metadata.totalScore), 0),
          maxProgress: 90
        },
        {
          id: 'improvement_champion',
          name: '改善チャンピオン',
          description: '前回から10点以上のスコアアップ',
          icon: <IconTrendingUp size={20} />,
          color: 'teal',
          unlocked: history.some(h => h.comparison && h.comparison.scoreImprovement >= 10),
          progress: Math.max(...history.map(h => h.comparison?.scoreImprovement || 0), 0),
          maxProgress: 10
        },

        // フィードバック関連
        {
          id: 'feedback_collector',
          name: 'フィードバックコレクター',
          description: '5回以上の実践フィードバックを記録',
          icon: <IconCheck size={20} />,
          color: 'blue',
          unlocked: allFeedbacks.length >= 5,
          progress: Math.min(allFeedbacks.length, 5),
          maxProgress: 5
        },
        {
          id: 'crowd_pleaser',
          name: 'クラウドプリーザー',
          description: '100名以上の聴衆にプレゼン',
          icon: <IconUsers size={20} />,
          color: 'cyan',
          unlocked: allFeedbacks.some(f => f.audience.size >= 100),
          progress: Math.max(...allFeedbacks.map(f => f.audience.size), 0),
          maxProgress: 100
        },

        // 質問関連
        {
          id: 'question_master',
          name: '質問マスター',
          description: '想定外質問率を30%以下に抑制',
          icon: <IconQuestionMark size={20} />,
          color: 'green',
          unlocked: (() => {
            if (allFeedbacks.length === 0) return false;
            const totalQuestions = allFeedbacks.reduce((sum, f) => sum + f.questionsReceived.length, 0);
            const unanticipated = allFeedbacks.reduce((sum, f) => 
              sum + f.questionsReceived.filter(q => !q.wasAnticipated).length, 0);
            const rate = totalQuestions > 0 ? (unanticipated / totalQuestions) * 100 : 100;
            return rate <= 30;
          })(),
          progress: (() => {
            if (allFeedbacks.length === 0) return 100;
            const totalQuestions = allFeedbacks.reduce((sum, f) => sum + f.questionsReceived.length, 0);
            const unanticipated = allFeedbacks.reduce((sum, f) => 
              sum + f.questionsReceived.filter(q => !q.wasAnticipated).length, 0);
            const rate = totalQuestions > 0 ? (unanticipated / totalQuestions) * 100 : 100;
            return Math.max(0, 30 - rate);
          })(),
          maxProgress: 30
        },

        // 満足度関連
        {
          id: 'satisfaction_king',
          name: '満足度キング',
          description: '平均満足度4.5以上を達成',
          icon: <IconTarget size={20} />,
          color: 'red',
          unlocked: (() => {
            if (allFeedbacks.length === 0) return false;
            const avgSatisfaction = allFeedbacks.reduce((sum, f) => sum + f.outcomes.overallSuccess, 0) / allFeedbacks.length;
            return avgSatisfaction >= 4.5;
          })(),
          progress: allFeedbacks.length > 0 
            ? allFeedbacks.reduce((sum, f) => sum + f.outcomes.overallSuccess, 0) / allFeedbacks.length
            : 0,
          maxProgress: 4.5
        }
      ];

      setAchievements(achievementList);
    } catch (error) {
      console.error('Failed to calculate achievements:', error);
    } finally {
      setLoading(false);
    }
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

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <Paper p="xl" withBorder>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={4}>🏆 実績バッジ</Title>
          <Badge size="lg" variant="gradient" gradient={{ from: 'gold', to: 'yellow' }}>
            {unlockedCount}/{achievements.length} 獲得
          </Badge>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {achievements.map((achievement) => (
            <Tooltip
              key={achievement.id}
              label={achievement.description}
              position="top"
              withArrow
            >
              <Card 
                p="md" 
                withBorder
                style={{
                  opacity: achievement.unlocked ? 1 : 0.6,
                  cursor: 'pointer'
                }}
              >
                <Stack gap="sm">
                  <Group justify="space-between">
                    <ThemeIcon
                      color={achievement.unlocked ? achievement.color : 'gray'}
                      variant={achievement.unlocked ? 'filled' : 'light'}
                      size="lg"
                    >
                      {achievement.icon}
                    </ThemeIcon>
                    
                    {achievement.unlocked && (
                      <Badge size="xs" color={achievement.color} variant="light">
                        獲得済み
                      </Badge>
                    )}
                  </Group>

                  <div>
                    <Text fw={600} size="sm">
                      {achievement.name}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {achievement.description}
                    </Text>
                  </div>

                  {!achievement.unlocked && (
                    <div>
                      <Group justify="space-between" mb="xs">
                        <Text size="xs" c="dimmed">進捗</Text>
                        <Text size="xs" c="dimmed">
                          {Math.round(achievement.progress)}/{achievement.maxProgress}
                        </Text>
                      </Group>
                      <Progress
                        value={(achievement.progress / achievement.maxProgress) * 100}
                        color={achievement.color}
                        size="xs"
                      />
                    </div>
                  )}
                </Stack>
              </Card>
            </Tooltip>
          ))}
        </SimpleGrid>

        {/* 次の目標 */}
        <Paper p="md" withBorder>
          <Title order={5} mb="sm">🎯 次の目標</Title>
          <Stack gap="xs">
            {achievements
              .filter(a => !a.unlocked)
              .slice(0, 3)
              .map((achievement) => (
                <Group key={achievement.id} justify="space-between">
                  <Group gap="xs">
                    <ThemeIcon size="sm" variant="light" color={achievement.color}>
                      {achievement.icon}
                    </ThemeIcon>
                    <Text size="sm">{achievement.name}</Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {Math.round(achievement.progress)}/{achievement.maxProgress}
                  </Text>
                </Group>
              ))}
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
};