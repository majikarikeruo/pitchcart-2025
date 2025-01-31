import { Stack, Box, Title, Text, Pill, Flex, ThemeIcon } from "@mantine/core";
import { Bot, User2 } from "lucide-react";

import { QuestionHeading } from "@/components/Result/Question/QuestionHeading";
import { QuestionPill } from "@/components/Result/Question/QuestionPill";

type StyleLevel = "high" | "medium" | "low";

interface StyleConfig {
  label: string;
  color: string;
  backgroundColor: string;
}

interface QuestionItem {
  question: string;
  background: string;
  source: string;
  priority: StyleLevel;
}

interface PredictedQuestions {
  question_items: QuestionItem[];
}

const styles: Record<StyleLevel, StyleConfig> = {
  high: {
    label: "高",
    color: "#b91c1c",
    backgroundColor: "#f8d7da",
  },
  medium: {
    label: "中",
    color: "#ef8844",
    backgroundColor: "#ffedd5",
  },
  low: {
    label: "低",
    color: "#228be6",
    backgroundColor: "#e7f5ff",
  },
};

const stackStyle = (color: string): React.CSSProperties => {
  return {
    backgroundColor: "white",
    border: "1px solid #E5E5E5",
    borderTop: `6px solid ${color}`,
    borderRadius: 8,
    position: "relative",
  };
};

export const Question = ({
  predicted_questions: { question_items },
}: {
  predicted_questions: PredictedQuestions;
}) => {
  return (
    <Flex align="start">
      <QuestionHeading />
      <Box>
        {question_items.map((question: QuestionItem, index: number) => (
          <Stack
            key={index}
            style={stackStyle(styles[question.priority].color)}
            px={24}
            pt={16}
            py={24}
            mb={16}
          >
            <QuestionPill pillStyles={styles} priority={question.priority} />
            <Flex align="start" mt={8}>
              <Box style={{ minWidth: 80 }} ta="center">
                <ThemeIcon radius="xl" color="red">
                  <User2 style={{ width: "70%", height: "70%" }} />
                </ThemeIcon>
              </Box>
              <Title order={4}>{question.question}</Title>
            </Flex>

            <Flex align="start" mt={8}>
              <Box style={{ minWidth: 80 }} ta="center">
                <ThemeIcon radius="xl" color="blue">
                  <Bot style={{ width: "70%", height: "70%" }} />
                </ThemeIcon>
              </Box>

              <Text>{question.background}</Text>
            </Flex>
          </Stack>
        ))}
      </Box>
    </Flex>
  );
};
