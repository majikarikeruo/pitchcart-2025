import { Box } from "@mantine/core";

import { TransitionIssue } from "@/components/Result/Flow/Detail/TransitionIssue";

export const TransitionInfo = ({ issues }) => {
  return (
    <Box p={24}>
      {issues.length > 0 ? (
        issues.map((issue: IssueData, issueIndex: number) => (
          <TransitionIssue issue={issue} key={issueIndex} />
        ))
      ) : (
        <Box mih={"100%"} style={{ alignContent: "center" }}>
          課題点は特にありません
        </Box>
      )}
    </Box>
  );
};
