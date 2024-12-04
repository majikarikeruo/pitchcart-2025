import { Tabs, Title, Text, Container, Pill, Flex, FileInput, Input, Stack, Button, Group } from "@mantine/core";

import { Score } from "@/components/Result/Score";
import { Question } from "@/components/Result/Question";
import { Improvement } from "@/components/Result/Improvement";
import { Flow } from "@/components/Result/Flow";

export default function Home() {
  return (
    <Stack>
      <Container py={48} size="xl">
        <Flex direction="column-reverse" align="start">
          <Title mb={40} fw={700} fz={64} c="#228be6">
            分析結果
          </Title>
          <Text mb={4} fw={500} c="#228be6" tt="uppercase">
            Analysis Result
          </Text>
        </Flex>
        <Score />
        <Flow />
        <Improvement />
        <Question />
      </Container>
    </Stack>
  );
}
