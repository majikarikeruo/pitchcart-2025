import React, { useEffect, useState } from "react";
import { Paper, Stack, Text, Group, List, ThemeIcon, Alert, Button, Collapse, ActionIcon, Loader, Center } from "@mantine/core";
import { IconBrain, IconTrendingUp, IconBulb, IconTarget, IconChevronDown, IconChevronUp, IconSparkles } from "@tabler/icons-react";
import { useEnhancedAnalysis } from "../../../hooks/useEnhancedAnalysis";

interface AnalysisInsightsProps {
  presentationId: string;
  onStartEnhancedAnalysis: () => void;
}

export const AnalysisInsights: React.FC<AnalysisInsightsProps> = ({ presentationId, onStartEnhancedAnalysis }) => {
  const { getAnalysisInsights, loading } = useEnhancedAnalysis();
  const [insights, setInsights] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [presentationId]);

  const loadInsights = async () => {
    const data = await getAnalysisInsights(presentationId);
    setInsights(data);
  };

  if (loading) {
    return (
      <Center h={100}>
        <Loader size="sm" />
      </Center>
    );
  }

  if (!insights) return null;

  // 初回分析の場合
  if (!insights.hasHistory) {
    return (
      <Paper p="md" withBorder>
        <Group>
          <ThemeIcon variant="light" color="blue">
            <IconBrain size={18} />
          </ThemeIcon>
          <div>
            <Text fw={600} size="sm">
              初回分析
            </Text>
            <Text size="xs" c="dimmed">
              {insights.message}
            </Text>
          </div>
        </Group>
      </Paper>
    );
  }

  // 履歴はあるがフィードバックがない場合
  if (!insights.hasFeedback) {
    return (
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Group>
            <ThemeIcon variant="light" color="orange">
              <IconBulb size={18} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="sm">
                分析精度を向上させませんか？
              </Text>
              <Text size="xs" c="dimmed">
                {insights.message}
              </Text>
            </div>
          </Group>

          <Alert icon={<IconTarget size={16} />} color="blue" variant="light">
            <Text size="xs">{insights.suggestion}</Text>
          </Alert>
        </Stack>
      </Paper>
    );
  }

  // フィードバックがある場合の詳細表示
  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Group>
            <ThemeIcon variant="light" color="teal">
              <IconSparkles size={18} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="sm">
                パーソナライズ分析
              </Text>
              <Text size="xs" c="dimmed">
                {insights.message}
              </Text>
            </div>
          </Group>

          <ActionIcon variant="light" onClick={() => setExpanded(!expanded)}>
            {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </ActionIcon>
        </Group>

        <Button fullWidth leftSection={<IconSparkles size={16} />} onClick={onStartEnhancedAnalysis} gradient={{ from: "teal", to: "blue", deg: 45 }}>
          過去の実績を活かした高精度分析を開始
        </Button>

        <Collapse in={expanded}>
          <Stack gap="md">
            {/* 強み */}
            {insights.insights.strengths.length > 0 && (
              <div>
                <Group gap="xs" mb="xs">
                  <ThemeIcon size="sm" color="teal" variant="light">
                    <IconTrendingUp size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="sm" c="teal">
                    確認された強み
                  </Text>
                </Group>
                <List spacing="xs" size="xs" icon={<Text c="teal">✓</Text>}>
                  {insights.insights.strengths.map((strength: string, index: number) => (
                    <List.Item key={index}>{strength}</List.Item>
                  ))}
                </List>
              </div>
            )}

            {/* 改善エリア */}
            {insights.insights.weaknesses.length > 0 && (
              <div>
                <Group gap="xs" mb="xs">
                  <ThemeIcon size="sm" color="orange" variant="light">
                    <IconTarget size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="sm" c="orange">
                    重点改善エリア
                  </Text>
                </Group>
                <List spacing="xs" size="xs" icon={<Text c="orange">⚠</Text>}>
                  {insights.insights.weaknesses.map((weakness: string, index: number) => (
                    <List.Item key={index}>{weakness}</List.Item>
                  ))}
                </List>
              </div>
            )}

            {/* 推移 */}
            {insights.insights.trends.length > 0 && (
              <div>
                <Group gap="xs" mb="xs">
                  <ThemeIcon size="sm" color="blue" variant="light">
                    <IconTrendingUp size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="sm" c="blue">
                    スコア推移
                  </Text>
                </Group>
                <List spacing="xs" size="xs" icon={<Text c="blue">📈</Text>}>
                  {insights.insights.trends.map((trend: string, index: number) => (
                    <List.Item key={index}>{trend}</List.Item>
                  ))}
                </List>
              </div>
            )}

            {/* 推奨事項 */}
            {insights.insights.recommendations.length > 0 && (
              <div>
                <Group gap="xs" mb="xs">
                  <ThemeIcon size="sm" color="violet" variant="light">
                    <IconBulb size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="sm" c="violet">
                    AI推奨事項
                  </Text>
                </Group>
                <List spacing="xs" size="xs" icon={<Text c="violet">💡</Text>}>
                  {insights.insights.recommendations.map((rec: string, index: number) => (
                    <List.Item key={index}>{rec}</List.Item>
                  ))}
                </List>
              </div>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
};
