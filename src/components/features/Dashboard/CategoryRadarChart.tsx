import React, { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Stack,
  Text,
  Loader,
  Center,
  Group,
  Badge
} from '@mantine/core';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../../../contexts/AuthContext';
import { analysisService } from '../../../services/analysis.service';

interface CategoryRadarChartProps {
  timeRange: string;
}

interface RadarData {
  category: string;
  current: number;
  previous?: number;
  fullMark: 100;
}

export const CategoryRadarChart: React.FC<CategoryRadarChartProps> = ({ timeRange }) => {
  const { user } = useAuth();
  const [data, setData] = useState<RadarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [improvement, setImprovement] = useState<{ improved: number; declined: number }>({ improved: 0, declined: 0 });

  useEffect(() => {
    if (user) {
      loadRadarData();
    }
  }, [user, timeRange]);

  const loadRadarData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const history = await analysisService.getAnalysisHistory(user.uid);
      
      if (history.length === 0) {
        setData([]);
        return;
      }

      const latest = history[0];
      const previous = history.length > 1 ? history[1] : null;

      const categories = [
        { key: 'content', label: 'コンテンツ' },
        { key: 'design', label: 'デザイン' },
        { key: 'persuasiveness', label: '説得力' },
        { key: 'technicalQuality', label: '技術品質' }
      ];

      const radarData = categories.map(({ key, label }) => {
        const currentScore = latest.metadata.categoryScores[key as keyof typeof latest.metadata.categoryScores];
        const previousScore = previous?.metadata.categoryScores[key as keyof typeof previous.metadata.categoryScores];

        return {
          category: label,
          current: Math.round(currentScore * 10) / 10,
          previous: previousScore ? Math.round(previousScore * 10) / 10 : undefined,
          fullMark: 100
        };
      });

      setData(radarData);

      // 改善・悪化したカテゴリ数をカウント
      let improved = 0;
      let declined = 0;
      
      radarData.forEach(item => {
        if (item.previous !== undefined) {
          if (item.current > item.previous) improved++;
          else if (item.current < item.previous) declined++;
        }
      });

      setImprovement({ improved, declined });
    } catch (error) {
      console.error('Failed to load radar data:', error);
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
          <Title order={4}>🎯 カテゴリ分析</Title>
          <Text c="dimmed" ta="center">
            データがありません
          </Text>
        </Stack>
      </Paper>
    );
  }

  const hasComparison = data.some(item => item.previous !== undefined);

  return (
    <Paper p="xl" withBorder>
      <Stack gap="lg">
        <div>
          <Title order={4}>🎯 カテゴリ分析</Title>
          {hasComparison && (
            <Group gap="xs" mt="xs">
              {improvement.improved > 0 && (
                <Badge color="teal" variant="light" size="sm">
                  {improvement.improved}項目改善
                </Badge>
              )}
              {improvement.declined > 0 && (
                <Badge color="red" variant="light" size="sm">
                  {improvement.declined}項目低下
                </Badge>
              )}
            </Group>
          )}
        </div>

        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid />
              <PolarAngleAxis 
                dataKey="category" 
                fontSize={12}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                fontSize={10}
                tickCount={4}
              />
              
              <Radar
                name="現在"
                dataKey="current"
                stroke="#228be6"
                fill="#228be6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              
              {hasComparison && (
                <Radar
                  name="前回"
                  dataKey="previous"
                  stroke="#adb5bd"
                  fill="transparent"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              )}
              
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* スコア詳細 */}
        <Stack gap="xs">
          {data.map((item, index) => {
            const improvement = item.previous ? item.current - item.previous : 0;
            return (
              <Group key={index} justify="space-between" p="xs">
                <Text size="sm">{item.category}</Text>
                <Group gap="xs">
                  <Text size="sm" fw={600}>{item.current}点</Text>
                  {item.previous !== undefined && improvement !== 0 && (
                    <Text 
                      size="xs" 
                      c={improvement > 0 ? 'teal' : 'red'}
                    >
                      ({improvement > 0 ? '+' : ''}{improvement.toFixed(1)})
                    </Text>
                  )}
                </Group>
              </Group>
            );
          })}
        </Stack>
      </Stack>
    </Paper>
  );
};