import { Stack, ThemeIcon, RingProgress, Text, Title, Flex, Box } from "@mantine/core";

import { ScoreExplanationProps } from "@/types/Result";
import { IconCheck, IconInfoCircle } from "@tabler/icons-react";

export const SubCategory = ({ subcategory, label, explanationByScore }: { subcategory: string; label: string; explanationByScore: ScoreExplanationProps }) => {
  const { components } = explanationByScore;

  return (
    <Stack px="md">
      <Flex align="center" justify="center">
        <RingProgress
          size={200}
          roundCaps
          thickness={12}
          ta="center"
          sections={[
            {
              value: components[subcategory].score,
              color: "red",
            },
          ]}
          label={
            <>
              <Title order={6} c="dimmed">
                {label}
              </Title>
              <Text fw={700} fz={40}>
                {components[subcategory].score}
              </Text>
            </>
          }
        />
      </Flex>
      <Box>
        <Box mt={16}>
          <Flex align="start" style={{ fontSize: "14px" }} mb={4}>
            <ThemeIcon mr={8} mb={4} variant="white">
              <IconCheck size={16} />
            </ThemeIcon>
            <Box>
              <Text fw={"bold"}>{components[subcategory].explanation}</Text>
            </Box>
          </Flex>
        </Box>
        <Box mt={16}>
          <Flex align="start" style={{ fontSize: "14px" }} mb={4}>
            <ThemeIcon mr={8} mb={4} variant="white">
              <IconInfoCircle size={16} />
            </ThemeIcon>
            <Box>
              <Text>{components[subcategory].evidence}</Text>
            </Box>
          </Flex>
        </Box>
      </Box>
    </Stack>
  );
};
