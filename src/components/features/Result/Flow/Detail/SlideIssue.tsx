import { Box, Title, Text, Grid, ThemeIcon, Paper } from "@mantine/core";
import { IconHelpHexagon, IconCheck } from "@tabler/icons-react";
import { ISSUE_LABELS, IssueData } from "@/types/Result";



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
          {ISSUE_LABELS[issue.type].text}
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
