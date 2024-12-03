import { Tabs, Title, Text, Container, Pill, Flex, FileInput, Input, Stack, Button, Group } from "@mantine/core";

import { Score } from "@/components/Result/Score";
import { Question } from "@/components/Result/Question";
import { Improvement } from "@/components/Result/Improvement";
import { Flow } from "@/components/Result/Flow";

export default function Home() {
  return (
    <Stack>
      <Container py={48}>
        <Title align="center" mb={24}>
          分析結果
        </Title>
        <Score />
        <Flow />
        <Improvement />
        <Question />
      </Container>
    </Stack>
  );
}
