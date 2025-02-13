import {
  Paper,
  Stack,
  Title,
  Text,
  Box,
  ThemeIcon,
  Stepper,
  Grid,
  Badge,
  Flex,
} from "@mantine/core";
import {
  IconRoadSign,
  IconAlertCircle,
  IconBulb,
  IconTarget,
  IconListCheck,
} from "@tabler/icons-react";

import {
  ImprovementProps,
  OverallItemProps,
  ImplementationStepsProps,
} from "@/types/Result";

export const Improvement = ({
  improvement,
}: {
  improvement: ImprovementProps;
}) => {
  const {
    improvements: { overall },
  } = improvement;

  return (
    <Paper p="40" radius="md" withBorder my="xl" shadow="md">
      <Stack>
        {/* ヘッダー - 既存のデザインパターンを踏襲 */}
        <Flex direction={"column-reverse"} justify={"center"} align={"center"}>
          <Title
            order={2}
            mb={16}
            p={8}
            px={12}
            fz={34}
            ta={"center"}
            c="#228be6"
          >
            改善計画
          </Title>
          <Text size="sm" c="#228be6" fw={700} tt={"uppercase"}>
            Improvement Plan
          </Text>
          <ThemeIcon variant="white">
            <IconRoadSign size={24} />
          </ThemeIcon>
        </Flex>

        {/* 改善項目 */}
        <Grid>
          {overall.map((item: OverallItemProps, index: number) => (
            <Grid.Col span={6} key={index}>
              <Paper key={index} shadow="md" p="xl" radius="md">
                <Badge size="lg" mb={24}>
                  {item.category}
                </Badge>

                {/* ステップ形式での表示 */}
                <Stepper
                  active={-1}
                  orientation="vertical"
                  allowNextStepsSelect={false}
                >
                  <Stepper.Step
                    label="現状の課題"
                    description={item.issue}
                    icon={<IconAlertCircle size={18} />}
                    fz={24}
                  />

                  <Stepper.Step
                    label="改善案"
                    description={item.improvement.action}
                    icon={<IconBulb size={18} />}
                  />

                  <Stepper.Step
                    label="期待される効果"
                    description={item.improvement.expected_result}
                    icon={<IconTarget size={18} />}
                  />
                  {item.improvement.implementation_steps && (
                    <Box mt="md">
                      <Flex align="center" mb="md">
                        <ThemeIcon variant="light" mr="md">
                          <IconListCheck size={20} />
                        </ThemeIcon>
                        <Title order={3}>改善計画ステップ</Title>
                      </Flex>
                      <Box>
                        {item.improvement.implementation_steps.map(
                          (step: ImplementationStepsProps, i: number) => (
                            <Flex bg={"#f8f9fa"} align={"start"} p={16} key={i}>
                              <ThemeIcon
                                display={"block"}
                                radius={"50%"}
                                size={64}
                                variant="light"
                                ta={"center"}
                                fz={14}
                                lh={1.25}
                                mr={16}
                                p={12}
                                fw={"bold"}
                              >
                                <Box>Step</Box>

                                <Box fz={21}>{i + 1}</Box>
                              </ThemeIcon>
                              <Box
                                key={step.step}
                                title={`Step ${step.step}`}
                                color="blue"
                              >
                                <Text size="md" fw={500}>
                                  {step.description}
                                </Text>
                                <Text size="xs" c="dimmed" mt={4}>
                                  予定期間: {step.estimated_time}
                                </Text>
                              </Box>
                            </Flex>
                          )
                        )}
                      </Box>
                    </Box>
                  )}
                </Stepper>
              </Paper>
            </Grid.Col>
          ))}
        </Grid>
      </Stack>
    </Paper>
  );
};
