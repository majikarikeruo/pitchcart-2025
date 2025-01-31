import { Title, Text, Flex } from "@mantine/core";

export const QuestionHeading = () => {
  return (
    <Flex
      direction="column-reverse"
      gap="xs"
      style={{ flexBasis: "50%" }}
      mr={80}
    >
      <Title order={2} fz={40} mb="lg" c="#228be6">
        予測される質問
      </Title>
      <Text size="sm" c="#228be6" fw={700} tt="uppercase">
        Questions
      </Text>
    </Flex>
  );
};
