import { Box, Text, ThemeIcon, Title, Grid, Paper } from "@mantine/core";
import { IconHelpHexagon } from "@tabler/icons-react";
import { issueProps } from "@/types/Result";

export const TransitionIssue = ({ issue }: { issue: issueProps }) => {
  return (
    <Box mb={24} p={16} pt={24} pos={"relative"}>
      <Grid gutter="lg">
        <Grid.Col span={6}>
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
              {issue.issue}
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={6}>
          <Paper shadow="md" p={16}>
            <Box ta={"center"}>
              <ThemeIcon variant="white">
                <IconHelpHexagon size={32} />
              </ThemeIcon>
            </Box>
            <Title order={5} mb={12} ta={"center"}>
              現在の内容
            </Title>
            <Text fz={13} c={"#666"}>
              {issue.current_content}
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={6}>
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
        <Grid.Col span={6}>
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
              {issue.context}
            </Text>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
};
