import { Title, Paper, Text, Flex, Divider, ThemeIcon } from "@mantine/core";

import { ScoreRing } from "@/components/Result/Score/TotalScore/ScoreRing";
import { UserInput } from "@/components/Result/Score/TotalScore/UserInput";
import { IconPresentation } from "@tabler/icons-react";

import { UserInputProps } from "@/types/Result";

export const TotalScore = ({
  input,
  averageScore,
}: {
  input: UserInputProps;
  averageScore: number;
}) => {
  return (
    <Paper shadow="md" radius="md" bg="white" mb={16} px={40} py={24}>
      <Flex direction="column-reverse" align="center">
        <Title mb={40} fw={700} fz={56}>
          分析結果
        </Title>
        <Text mb={4} fw={500} c="#228be6" tt="uppercase">
          Analysis Result
        </Text>
        <ThemeIcon variant="white" mb={8}>
          <IconPresentation />
        </ThemeIcon>
      </Flex>
      <Divider />
      <Flex gap={48} align="center">
        <ScoreRing averageScore={averageScore} />
        <UserInput input={input} />
      </Flex>
    </Paper>
  );
};
