import { RingProgress, Text, Flex } from "@mantine/core";

export const ScoreRing = ({ averageScore }: { averageScore: number }) => {
  return (
    <RingProgress
      size={320}
      roundCaps
      thickness={24}
      sections={[{ value: averageScore, color: "#228be6" }]}
      label={
        <Flex direction="column" align="center" justify="center">
          <Text fz="lg" tt="uppercase" fw={700} c="dimmed">
            総合スコア
          </Text>
          <Flex fw={500} gap={8} align="baseline">
            <Text fz={64} fw={700} lh={1.1}>
              {averageScore}
            </Text>
            <Text fz={16} fw={500}>
              /
            </Text>
            <Text fz={16} fw={500}>
              100
            </Text>
          </Flex>
        </Flex>
      }
    />
  );
};
