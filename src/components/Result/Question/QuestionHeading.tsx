import { Title, Text, Flex, ThemeIcon } from "@mantine/core";
import { IconMessageQuestion } from "@tabler/icons-react";

export const QuestionHeading = () => {
  return (
    <Flex
      direction={"column-reverse"}
      justify={"center"}
      align={"center"}
      mb={40}
    >
      <Title order={2} fz={40} mb="lg" c="#228be6">
        予測される質問
      </Title>
      <Text size="sm" c="#228be6" fw={700} tt="uppercase">
        Questions
      </Text>
      <ThemeIcon variant="white">
        <IconMessageQuestion />
      </ThemeIcon>
    </Flex>
  );
};
