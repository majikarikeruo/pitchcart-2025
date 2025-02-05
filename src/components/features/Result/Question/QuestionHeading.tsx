import { Title, Text, Flex, ThemeIcon } from "@mantine/core";
import { IconMessageQuestion } from "@tabler/icons-react";

export const QuestionHeading = () => {
  return (
    <Flex direction={"column-reverse"} justify={"center"} align={"center"} mb={40}>
      <Title order={2} mb={16} p={8} px={12} fz={34} c="#228be6">
        予測される質問
      </Title>
      <Text size="sm" c="#228be6" fw={700} tt="uppercase">
        Questions
      </Text>
      <ThemeIcon variant="white">
        <IconMessageQuestion size={24} />
      </ThemeIcon>
    </Flex>
  );
};
