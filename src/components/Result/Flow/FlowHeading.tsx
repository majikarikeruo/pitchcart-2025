import { Box, Flex, Text, Title } from "@mantine/core";

export const FlowHeading = () => {
  return (
    <Box mb="xl">
      <Flex direction="column-reverse" gap="xs">
        <Title order={2} mb="lg" c="#228be6">
          プレゼンテーションフロー分析
        </Title>
        <Text size="sm" c="#228be6" fw={700} tt="uppercase">
          Flow Analysis
        </Text>
      </Flex>
    </Box>
  );
};
