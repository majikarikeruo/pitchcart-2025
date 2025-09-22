import React, { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Stack,
  Group,
  Text,
  Badge,
  Loader,
  Center,
  Switch
} from '@mantine/core';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../../contexts/AuthContext';
import { analysisService } from '../../../services/analysis.service';
import { generateDummyGrowthData, generateDummyAnalysisHistory } from '../../../services/dummy.service';

interface ScoreProgressChartProps {
  timeRange: string;
}

interface ChartData {
  date: string;
  totalScore: number;
  contentScore: number;
  designScore: number;
  persuasivenessScore: number;
  technicalScore: number;
  version: number;
}

export const ScoreProgressChart: React.FC<ScoreProgressChartProps> = ({ timeRange }) => {
  const { user } = useAuth();
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    if (user) {
      loadChartData();
    }
  }, [user, timeRange]);

  const loadChartData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      let history;
      // 匿名ユーザーまたはデータがない場合はダミーデータを使用
      if (user.isAnonymous) {
        history = generateDummyAnalysisHistory(user.uid);
      } else {
        history = await analysisService.getAnalysisHistory(user.uid);
        if (history.length === 0) {
          history = generateDummyAnalysisHistory(user.uid);
        }
      }
      
      // 時間範囲でフィルタリング
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (timeRange) {
        case '1month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case '1year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const filteredHistory = history.filter(h => {
        let date: Date;
        if (h.createdAt instanceof Date) {
          date = h.createdAt;
        } else if (h.createdAt?.toDate) {
          date = h.createdAt.toDate();
        } else if (h.createdAt?.seconds) {
          date = new Date(h.createdAt.seconds * 1000);
        } else {
          date = new Date(h.createdAt);
        }
        return date >= cutoffDate;
      });

      // チャート用データに変換
      const chartData = filteredHistory
        .slice(0, 20) // 最大20ポイント
        .reverse() // 時系列順にする
        .map(h => {
          let date: Date;
          if (h.createdAt instanceof Date) {
            date = h.createdAt;
          } else if (h.createdAt?.toDate) {
            date = h.createdAt.toDate();
          } else if (h.createdAt?.seconds) {
            date = new Date(h.createdAt.seconds * 1000);
          } else {
            date = new Date(h.createdAt);
          }
          return {
            date: date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
            totalScore: Math.round(h.metadata.totalScore * 10) / 10,
            contentScore: Math.round(h.metadata.categoryScores.content * 10) / 10,
            designScore: Math.round(h.metadata.categoryScores.design * 10) / 10,
            persuasivenessScore: Math.round(h.metadata.categoryScores.persuasiveness * 10) / 10,
            technicalScore: Math.round(h.metadata.categoryScores.technicalQuality * 10) / 10,
            version: h.version
          };
        });

      setData(chartData);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Paper p="xl" withBorder>
        <Center h={300}>
          <Loader />
        </Center>
      </Paper>
    );
  }

  if (data.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Stack align="center" gap="md">
          <Title order={4}>📈 スコア推移</Title>
          <Text c="dimmed" ta="center">
            選択した期間にデータがありません。
            <br />
            プレゼンテーション分析を実行して、成長を記録しましょう。
          </Text>
        </Stack>
      </Paper>
    );
  }

  // 最新と最初のスコアを比較
  const latestScore = data[data.length - 1]?.totalScore || 0;
  const firstScore = data[0]?.totalScore || 0;
  const improvement = latestScore - firstScore;

  return (
    <Paper p="xl" withBorder>
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={4}>📈 スコア推移</Title>
            <Group gap="xs" mt="xs">
              <Text size="sm" c="dimmed">現在のスコア:</Text>
              <Text fw={700} size="lg">{latestScore}</Text>
              {improvement !== 0 && (
                <Badge 
                  color={improvement > 0 ? 'teal' : 'red'} 
                  variant="light" 
                  size="sm"
                >
                  {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}
                </Badge>
              )}
            </Group>
          </div>
          
          <Switch
            label="全カテゴリ表示"
            checked={showAllCategories}
            onChange={(e) => setShowAllCategories(e.currentTarget.checked)}
            size="sm"
          />
        </Group>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
              />
              <YAxis 
                domain={[0, 100]}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `${value}点`, 
                  name === 'totalScore' ? '総合スコア' :
                  name === 'contentScore' ? 'コンテンツ' :
                  name === 'designScore' ? 'デザイン' :
                  name === 'persuasivenessScore' ? '説得力' :
                  name === 'technicalScore' ? '技術品質' : name
                ]}
                labelFormatter={(label) => `日付: ${label}`}
              />
              <Legend 
                formatter={(value) => 
                  value === 'totalScore' ? '総合スコア' :
                  value === 'contentScore' ? 'コンテンツ' :
                  value === 'designScore' ? 'デザイン' :
                  value === 'persuasivenessScore' ? '説得力' :
                  value === 'technicalScore' ? '技術品質' : value
                }
              />
              
              <Line 
                type="monotone" 
                dataKey="totalScore" 
                stroke="#228be6" 
                strokeWidth={3}
                dot={{ fill: '#228be6', r: 4 }}
              />
              
              {showAllCategories && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="contentScore" 
                    stroke="#20c997" 
                    strokeWidth={2}
                    dot={{ fill: '#20c997', r: 3 }}
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="designScore" 
                    stroke="#fd7e14" 
                    strokeWidth={2}
                    dot={{ fill: '#fd7e14', r: 3 }}
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="persuasivenessScore" 
                    stroke="#e03131" 
                    strokeWidth={2}
                    dot={{ fill: '#e03131', r: 3 }}
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="technicalScore" 
                    stroke="#9775fa" 
                    strokeWidth={2}
                    dot={{ fill: '#9775fa', r: 3 }}
                    strokeDasharray="5 5"
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 分析サマリー */}
        <Group gap="xl" justify="center">
          <div style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed">総分析回数</Text>
            <Text fw={700}>{data.length}回</Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed">最高スコア</Text>
            <Text fw={700}>{Math.max(...data.map(d => d.totalScore))}点</Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed">平均スコア</Text>
            <Text fw={700}>
              {(data.reduce((sum, d) => sum + d.totalScore, 0) / data.length).toFixed(1)}点
            </Text>
          </div>
        </Group>
      </Stack>
    </Paper>
  );
};