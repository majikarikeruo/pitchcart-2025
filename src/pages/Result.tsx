import { Title, Text, Container, Flex, Stack } from "@mantine/core";

import { Score } from "@/components/Result/Score";
import { Question } from "@/components/Result/Question";
import { Improvement } from "@/components/Result/Improvement";
import { Flow } from "@/components/Result/Flow";

import {
  prerequisiteCheck,
  analysisWithScore,
  predictedQuestions,
  improvement,
  heatmapFlow,
  structureFlow,
  input,
} from "@/testdata.json";

export default function Result() {
  return (
    <Stack>
      <Container py={48} size="xl">
        <Score analysisWithScore={analysisWithScore} input={input} />
        <Flow
          heatmapFlow={heatmapFlow}
          structureFlow={structureFlow}
          prerequisiteCheck={prerequisiteCheck}
        />
        <Improvement improvement={improvement} />
        <Question question_items={predictedQuestions.question_items} />
      </Container>
    </Stack>
  );
}
