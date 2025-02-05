import { useEffect, useState } from "react";

import { Container, Stack } from "@mantine/core";

import { Score } from "@/components/Result/Score";
import { Question } from "@/components/Result/Question";
import { Improvement } from "@/components/Result/Improvement";
import { Flow } from "@/components/Result/Flow";

import { ResultData } from "@/types/Result";

export default function Result() {
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      const response = await fetch("../testdata.json");
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const resultData: ResultData = await response.json();
      setResult(resultData);
    };

    fetchData();
  }, []);

  return (
    <Stack>
      {result && (
        <Container py={48} size="xl">
          <Score
            analysisWithScore={result.analysisWithScore}
            input={result.input}
          />
          <Flow
            heatmapFlow={result.flow.heatmapFlow}
            structureFlow={result.flow.structureFlow}
            prerequisiteCheck={result.flow.prerequisiteCheck}
          />
          <Question predictedQuestions={result.predictedQuestions} />
          <Improvement improvement={result.improvement} />
        </Container>
      )}
    </Stack>
  );
}
