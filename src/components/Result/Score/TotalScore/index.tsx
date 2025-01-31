import { Grid, Card, Text, Flex, Box } from "@mantine/core";

import { ScoreRing } from "@/components/Result/Score/TotalScore/ScoreRing";
import { UserInput } from "@/components/Result/Score/TotalScore/UserInput";

interface UserInput {
  target: string;
  goal: string;
  industry: string;
  summary: string;
}

export const TotalScore = ({
  input,
  averageScore,
}: {
  input: UserInput;
  averageScore: number;
}) => {
  return (
    <Card
      withBorder
      radius="md"
      padding="xl"
      bg="white"
      mb={24}
      px={40}
      py={24}
    >
      <Flex gap={48} align="center">
        <ScoreRing averageScore={averageScore} />
        <UserInput input={input} />
      </Flex>
    </Card>
  );
};
