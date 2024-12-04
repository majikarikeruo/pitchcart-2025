import { Stack, Box, Title, Text, Pill, Flex, ThemeIcon } from "@mantine/core";
import { Bot, User2 } from "lucide-react";

export const Question = () => {
  return (
    <Flex align="start">
      <Flex direction="column-reverse" gap="xs" style={{ flexBasis: "50%" }} mr={80}>
        <Title order={2} fz={40} mb="lg" c="#228be6">
          予測される質問
        </Title>
        <Text size="sm" c="#228be6" fw={700} tt="uppercase">
          Questions
        </Text>
      </Flex>

      <Box>
        <Stack
          style={{ backgroundColor: "white", border: "1px solid #E5E5E5", borderTop: "6px solid #b91c1c", borderRadius: 8, position: "relative" }}
          px={24}
          pt={16}
          py={24}
          mb={16}
        >
          <Flex align="start" mt={8}>
            <Box style={{ minWidth: 80 }} ta="center">
              <ThemeIcon radius="xl" color="red">
                <User2 style={{ width: "70%", height: "70%" }} />
              </ThemeIcon>
            </Box>
            <Title order={4}>Pitch Cartの市場規模や成長率はどのように見積もっていますか？</Title>
            <Pill
              defaultChecked
              styles={{ root: { backgroundColor: "#f8d7da", borderRadius: 8, color: "#b91c1c", position: "absolute", left: -40, top: 16, fontSize: 12 } }}
            >
              優先度・高
            </Pill>
          </Flex>

          <Flex align="start" mt={8}>
            <Box style={{ minWidth: 80 }} ta="center">
              <ThemeIcon radius="xl" color="blue">
                <Bot style={{ width: "70%", height: "70%" }} />
              </ThemeIcon>
            </Box>

            <Text>
              プレゼンテーション支援ツールの市場は年々成長しており、特にAIを活用したサービスが注目されています。市場規模や成長率を具体的に示すことで、投資家にとってのビジネスのポテンシャルを理解させることが重要です。{" "}
            </Text>
          </Flex>
        </Stack>

        <Stack
          style={{ backgroundColor: "white", border: "1px solid #E5E5E5", borderTop: "6px solid #EF8844", borderRadius: 8, position: "relative" }}
          px={24}
          pt={16}
          py={24}
          mb={16}
        >
          <Flex align="start" mt={8}>
            <Box style={{ minWidth: 80 }} ta="center">
              <ThemeIcon radius="xl" color="red">
                <User2 style={{ width: "70%", height: "70%" }} />
              </ThemeIcon>
            </Box>
            <Title order={4}>Pitch CartのAI分析機能は、競合他社と比較してどの程度の精度を持っていますか？ </Title>
            <Pill
              defaultChecked
              styles={{ root: { backgroundColor: "#ffedd5", borderRadius: 8, color: "#EF8844", position: "absolute", left: -40, top: 16, fontSize: 12 } }}
            >
              優先度・中
            </Pill>
          </Flex>

          <Flex align="start" mt={8}>
            <Box style={{ minWidth: 80 }} ta="center">
              <ThemeIcon radius="xl" color="blue">
                <Bot style={{ width: "70%", height: "70%" }} />
              </ThemeIcon>
            </Box>

            <Text>
              AIを活用したプレゼンテーション分析ツールは増えており、競合との差別化が重要です。具体的な精度を示すことで、投資家の信頼を得やすくなります。
            </Text>
          </Flex>
        </Stack>

        <Stack
          style={{ backgroundColor: "white", border: "1px solid #E5E5E5", borderTop: "6px solid #228be6", borderRadius: 8, position: "relative" }}
          px={24}
          pt={16}
          py={24}
          mb={16}
        >
          <Flex align="start" mt={8}>
            <Box style={{ minWidth: 80 }} ta="center">
              <ThemeIcon radius="xl" color="red">
                <User2 style={{ width: "70%", height: "70%" }} />
              </ThemeIcon>
            </Box>
            <Title order={4}>具体的な成功事例や失敗事例はありますか？それらからどのような教訓を得ましたか？ </Title>

            <Pill
              defaultChecked
              styles={{ root: { backgroundColor: "#e7f5ff", borderRadius: 8, color: "#228be6", position: "absolute", left: -40, top: 16, fontSize: 12 } }}
            >
              優先度・低
            </Pill>
          </Flex>

          <Flex align="start" mt={8}>
            <Box style={{ minWidth: 80 }} ta="center">
              <ThemeIcon radius="xl" color="blue">
                <Bot style={{ width: "70%", height: "70%" }} />
              </ThemeIcon>
            </Box>

            <Text>過去の実績を示すことで、Pitch Cartの信頼性を高めることができます。</Text>
          </Flex>
        </Stack>
      </Box>
    </Flex>
  );
};
