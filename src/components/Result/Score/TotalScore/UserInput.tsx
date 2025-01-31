import { Grid, Text, Box } from "@mantine/core";

interface UserInput {
  target: string;
  goal: string;
  industry: string;
  summary: string;
}

export const UserInput = ({ input }: { input: UserInput }) => {
  return (
    <Box mb="md" w={"100%"}>
      <Grid>
        <Grid.Col span={4}>
          <Text size="sm" fw={700} c="dimmed">
            プレゼン相手
          </Text>
          <Text size="xl" fw={700}>
            {input.target}
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text size="sm" fw={700} c="dimmed">
            プレゼンの目的
          </Text>
          <Text size="xl" fw={700}>
            {input.goal}
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text size="sm" fw={700} c="dimmed">
            業界
          </Text>
          <Text size="xl" fw={700}>
            {input.industry}
          </Text>
        </Grid.Col>
      </Grid>
      <Text mt={"xl"}>{input.summary}</Text>
    </Box>
  );
};
