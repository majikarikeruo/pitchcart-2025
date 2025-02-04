import { Box, Title, Text, Grid, ThemeIcon, Paper } from "@mantine/core";
import { IconHelpHexagon, IconCheck } from "@tabler/icons-react";

interface IssueData {
  impact: string;
  description: string;
  suggestion: string;
  type: IssueKey;
}

interface IssueValue {
  backgroundColor: string;
  text: string;
}
type IssueKey = "content" | "message" | "visual" | "structure";

const budgeObj: Record<IssueKey, IssueValue> = {
  content: {
    backgroundColor: "blue",
    text: "スライド内容",
  },
  structure: {
    backgroundColor: "indigo",
    text: "構造",
  },
  message: { backgroundColor: "orange", text: "メッセージ性" },
  visual: { backgroundColor: "cyan", text: "デザイン" },
};

export const SlideIssue = ({ issue }: { issue: IssueData }) => {
  return (
    <Box mb={24} p={16} pt={24}>
      <Box bg={"#fff"} py={8}>
        <Title
          order={4}
          display={"flex"}
          style={{
            alignItems: "center",
          }}
        >
          <ThemeIcon variant="white" mr={16}>
            <IconCheck />
          </ThemeIcon>
          {budgeObj[issue.type].text}
        </Title>
      </Box>
      <Grid gutter="lg">
        <Grid.Col span={4}>
          <Paper shadow="md" p={16}>
            <Box ta={"center"}>
              <ThemeIcon variant="white">
                <IconHelpHexagon size={32} />
              </ThemeIcon>
            </Box>
            <Title order={5} mb={12} ta={"center"}>
              問題点
            </Title>
            <Text fz={13} c={"#666"}>
              {issue.description}
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={4}>
          <Paper shadow="md" p={16}>
            <Box ta={"center"}>
              <ThemeIcon variant="white">
                <IconHelpHexagon size={32} />
              </ThemeIcon>
            </Box>
            <Title order={5} mb={12} ta={"center"}>
              改善提案
            </Title>
            <Text fz={13} c={"#666"}>
              {issue.suggestion}
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={4}>
          <Paper shadow="md" p={16}>
            <Box ta={"center"}>
              <ThemeIcon variant="white">
                <IconHelpHexagon size={32} />
              </ThemeIcon>
            </Box>
            <Title order={5} mb={12} ta={"center"}>
              改善後の影響
            </Title>
            <Text fz={13} c={"#666"}>
              {issue.impact}
            </Text>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
};
