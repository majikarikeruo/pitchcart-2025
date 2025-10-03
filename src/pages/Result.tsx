import { Container, Stack } from "@mantine/core";

import { Score } from "@/components/features/Result/Score";
import { Question } from "@/components/features/Result/Question";
import { Improvement } from "@/components/features/Result/Improvement";
import { Flow } from "@/components/features/Result/Flow";
import { useLocation } from "react-router-dom";

export default function Result() {
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
