import React from "react";
import { Select, Group, Text, Badge, Paper, Stack, Loader, Center } from "@mantine/core";
import { IconHistory, IconTrendingUp, IconTrendingDown, IconMinus } from "@tabler/icons-react";
import { useAnalysisHistory } from "../../../hooks/useAnalysisHistory";
import { AnalysisHistory } from "../../../services/analysis.service";

interface HistorySelectorProps {
  currentAnalysisId?: string;
  presentationId?: string;
  onVersionChange: (analysisId: string) => void;
}

export const HistorySelector: React.FC<HistorySelectorProps> = ({ currentAnalysisId, presentationId, onVersionChange }) => {
  const { history, loading } = useAnalysisHistory(presentationId);

  if (loading) {
    return (
      <Center>
        <Loader size="sm" />
      </Center>
    );
  }

  if (history.length === 0) {
    return null;
  }

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getScoreTrend = (item: AnalysisHistory) => {
    if (!item.comparison) return null;

    const improvement = item.comparison.scoreImprovement;
    if (improvement > 0) {
      return (
        <Group gap="xs">
          <IconTrendingUp size={16} color="teal" />
          <Text size="sm" c="teal">
            +{improvement.toFixed(1)}点
          </Text>
        </Group>
      );
    } else if (improvement < 0) {
      return (
        <Group gap="xs">
          <IconTrendingDown size={16} color="red" />
          <Text size="sm" c="red">
            {improvement.toFixed(1)}点
          </Text>
        </Group>
      );
    } else {
      return (
        <Group gap="xs">
          <IconMinus size={16} color="gray" />
          <Text size="sm" c="dimmed">
            変化なし
          </Text>
        </Group>
      );
    }
  };

  const selectData = history.map((item) => ({
    value: item.id,
    label: `Version ${item.version} - ${formatDate(item.createdAt)}`,
    description: `総合スコア: ${item.metadata.totalScore.toFixed(1)}点`,
    score: item.metadata.totalScore,
    trend: getScoreTrend(item),
    version: item.version,
  }));

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Group>
          <IconHistory size={20} />
          <Text fw={600}>分析履歴</Text>
          <Badge size="sm" variant="light">
            {history.length}件の履歴
          </Badge>
        </Group>

        <Select
          value={currentAnalysisId || history[0]?.id}
          onChange={(value) => value && onVersionChange(value)}
          data={selectData}
          placeholder="バージョンを選択"
          renderOption={({ option }) => {
            const typedOption = option as (typeof selectData)[0];
            return (
              <Group flex="1" justify="space-between">
                <div>
                  <Text size="sm" fw={500}>
                    {typedOption.label}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {typedOption.description}
                  </Text>
                </div>
                {typedOption.trend}
              </Group>
            );
          }}
        />

        {history.length > 1 && (
          <Text size="xs" c="dimmed">
            ヒント: 複数のバージョンを比較して改善の推移を確認できます
          </Text>
        )}
      </Stack>
    </Paper>
  );
};
