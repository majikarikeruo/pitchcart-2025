import { Grid, Text, Box } from "@mantine/core";
import { UserInputProps } from "@/types/Result";

export const UserInput = ({ input }: { input: UserInputProps }) => {
  return (
    <Box mb="md" w={"100%"}>
      <Grid>
        <Grid.Col span={4}>
          <Text size="sm" fw={700} c="dimmed">
            プレゼン相手
          </Text>
          <Text fz={25} fw={700}>
            {input.target}
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text size="sm" fw={700} c="dimmed">
            プレゼンの目的
          </Text>
          <Text fz={25} fw={700}>
            {input.goal}
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text size="sm" fw={700} c="dimmed">
            業界
          </Text>
          <Text fz={25} fw={700}>
            {input.industry}
          </Text>
        </Grid.Col>
      </Grid>
      <Text mt={"xl"} maw={"42rem"} fz={18}>
        {input.summary}
      </Text>
    </Box>
  );
};
