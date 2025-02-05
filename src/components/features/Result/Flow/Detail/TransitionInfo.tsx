import { Box } from "@mantine/core";

import { TransitionIssue } from "@/components/features/Result/Flow/Detail/TransitionIssue";
import { issueProps } from "@/types/Result";

export const TransitionInfo = ({ issues }: { issues: issueProps[] }) => {
  return (
    <Box p={24}>
      {issues.length > 0 ? (
        issues.map((issue: issueProps, issueIndex: number) => <TransitionIssue issue={issue} key={issueIndex} />)
      ) : (
        <Box mih={"100%"} style={{ alignContent: "center" }}>
          課題点は特にありません
        </Box>
      )}
    </Box>
  );
};
