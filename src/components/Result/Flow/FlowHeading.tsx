import { Flex, Text, Title, ThemeIcon } from "@mantine/core";
import { IconMessageQuestion } from "@tabler/icons-react";

export const FlowHeading = () => {
  return (
    <Flex
      direction={"column-reverse"}
      justify={"center"}
      align={"center"}
      mb={40}
    >
      <Title order={1} mb="lg" c="#228be6">
        プレゼンテーションフロー分析
      </Title>
      <Text size="sm" c="#228be6" fw={700} tt="uppercase">
        Flow Analysis
      </Text>
      <ThemeIcon variant="white">
        <IconMessageQuestion />
      </ThemeIcon>
    </Flex>
  );
};
