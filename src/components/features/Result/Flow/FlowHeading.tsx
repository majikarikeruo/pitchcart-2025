import { Flex, Text, Title, ThemeIcon } from "@mantine/core";
import { IconHammer } from "@tabler/icons-react";

export const FlowHeading = () => {
  return (
    <Flex direction={"column-reverse"} justify={"center"} align={"center"} mb={40}>
      <Title order={2} mb={16} p={8} px={12} fz={34} c="#228be6">
        プレゼンテーションフロー分析
      </Title>
      <Text size="sm" c="#228be6" fw={700} tt="uppercase">
        Flow Analysis
      </Text>
      <ThemeIcon variant="white">
        <IconHammer size={24} />
      </ThemeIcon>
    </Flex>
  );
};
