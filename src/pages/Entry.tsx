import { Title, Text, Container, Flex, Stack } from "@mantine/core";
import { PresentationCheck } from "@/components/features/Entry/PresentationCheck";

export default function Entry() {
  return (
    <Stack py={40}>
      <Flex direction="column" align="center" justify="center" gap="md" mb={16}>
        <Text ta="center">
          オーディエンスの反応を予測するプレゼン作成支援ツール🎨
        </Text>
        <Title ta="center">Pitch Cart</Title>
        <Text ta="center">ステークホルダーに あなたの思いが的確に伝わる</Text>
      </Flex>

      <Container
        size="sm"
        style={{ backgroundColor: "white", borderRadius: 16 }}
        px={16}
        pt={8}
        py={24}
      >
        <PresentationCheck />
      </Container>
    </Stack>
  );
}
