import { Box, Tabs, Title, Text, Container, Flex, Stack } from "@mantine/core";
import { PresentationCheck } from "@/components/Entry/PresentationCheck";

export default function Entry() {
  return (
    <Stack py={40}>
      <Flex direction="column" align="center" justify="center" gap="md" mb={16}>
        <Text ta="center">オーディエンスの反応を予測するプレゼン作成支援ツール🎨</Text>
        <Title ta="center">Pitch Cart</Title>
        <Text ta="center">ステークホルダーに あなたの思いが的確に伝わる</Text>
      </Flex>

      <Container size="sm" style={{ backgroundColor: "white", borderRadius: 16 }} px={16} pt={8} py={24}>
        <Tabs defaultValue="pitch">
          <Tabs.List my={16}>
            <Tabs.Tab value="pitch">プレゼンチェックモード</Tabs.Tab>
            <Tabs.Tab value="rehearsal">リハーサルモード（作成中）</Tabs.Tab>
            <Tabs.Tab value="simulation">シミュレーションモード（作成中）</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pitch">
            <PresentationCheck />
          </Tabs.Panel>
          <Tabs.Panel value="rehearsal">
            <Text ta="center">リハーサルモード</Text>
          </Tabs.Panel>
          <Tabs.Panel value="simulation">
            <Text ta="center">シミュレーションモード</Text>
          </Tabs.Panel>
        </Tabs>
      </Container>
    </Stack>
  );
}
