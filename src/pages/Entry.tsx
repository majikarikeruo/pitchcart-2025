import { Tabs, Title, Text, Container, Flex, FileInput, Input, Stack, Button, Group } from "@mantine/core";

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
            <Stack my={16}>
              <Input.Wrapper label="オーディエンス相手は誰ですか？">
                <Input placeholder="例）Tech系VC" />
              </Input.Wrapper>
              <Input.Wrapper label="プレゼンの目的は何ですか？">
                <Input placeholder="例）シリーズA資金調達" />
              </Input.Wrapper>

              <FileInput
                label="プレゼン資料をアップロードしてください"
                placeholder="ここにスライドの資料をドラッグするか、クリックしてファイルを選択してください(pptx。容量●MB。)"
              />
              <FileInput
                label="プレゼン原稿をアップロードしてください"
                placeholder="ここにスライドの資料をドラッグするか、クリックしてファイルを選択してください(pptx。容量●MB。)"
              />
            </Stack>
            <Group justify="center">
              <Button>分析を開始する</Button>
            </Group>
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
