import { Container, Stack, Alert, Loader, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

import { Score } from "@/components/features/Result/Score";
import { Question } from "@/components/features/Result/Question";
import { Improvement } from "@/components/features/Result/Improvement";
import { Flow } from "@/components/features/Result/Flow";

import { useResult } from "@/hooks/useResults";

export default function Result() {
  const { result, isLoading, error } = useResult();

  if (isLoading) {
    return (
      <Container py={48} size="xl">
        <Stack align="center">
          <Loader size="xl" />
          <Text size="lg">分析結果を読み込んでいます...</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container py={48} size="xl">
        <Alert icon={<IconAlertCircle />} title="エラーが発生しました" color="red">
          {error.message}
        </Alert>
      </Container>
    );
  }

  if (!result) return null;

  return (
    <Stack>
      <Container py={48} size="xl">
        <Score analysisWithScore={result.analysisWithScore} input={result.input} />
        <Flow heatmapFlow={result.heatmapFlow} structureFlow={result.structureFlow} prerequisiteCheck={result.prerequisiteCheck} />
        <Question predictedQuestions={result.predictedQuestions} />
        <Improvement improvement={result.improvement} />
      </Container>
    </Stack>
  );
}
