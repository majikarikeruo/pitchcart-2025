import { Container, Stack, Alert, Loader, Text } from "@mantine/core";

import { Score } from "@/components/features/Result/Score";
import { Question } from "@/components/features/Result/Question";
import { Improvement } from "@/components/features/Result/Improvement";
import { Flow } from "@/components/features/Result/Flow";
import { useLocation } from "react-router-dom";

import { useResult } from "@/hooks/useResults";

export default function Result() {
  // const { result, isLoading, error } = useResult();
  const location = useLocation();
  const {
    predictedQuestions,
    improvement,
    input,
    analysisWithScore,
    prerequisite_check,
    heatmapFlow,
    structureFlow,
  } = location.state || {};
  // if (isLoading) {
  //   return (
  //     <Container py={48} size="xl">
  //       <Stack align="center">
  //         <Loader size="xl" />
  //         <Text size="lg">分析結果を読み込んでいます...</Text>
  //       </Stack>
  //     </Container>
  //   );
  // }

  // if (error) {
  //   return (
  //     <Container py={48} size="xl">
  //       <Alert
  //         icon={<IconAlertCircle />}
  //         title="エラーが発生しました"
  //         color="red"
  //       >
  //         {error.message}
  //       </Alert>
  //     </Container>
  //   );
  // }

  if (
    !predictedQuestions ||
    !improvement ||
    !input ||
    !analysisWithScore ||
    !prerequisite_check ||
    !heatmapFlow ||
    !structureFlow
  )
    return <div>何かがおかしい</div>;

  return (
    <Stack>
      <Container py={48} size="xl">
        <Score analysisWithScore={analysisWithScore} input={input} />
        <Flow
          heatmapFlow={heatmapFlow}
          structureFlow={structureFlow}
          prerequisiteCheck={prerequisite_check}
        />
        <Question predictedQuestions={predictedQuestions} />
        <Improvement improvement={improvement} />
      </Container>
    </Stack>
  );
}
