import { Box, Title, Text, ThemeIcon, Flex } from "@mantine/core";
import { IconPointer } from "@tabler/icons-react";

import { SlideIssue } from "@/components/Result/Flow/Detail/SlideIssue";
import { SlideData, IssueData } from "@/types/Result";

export const SlideInfo = ({ slide, i }: { slide: SlideData; i: number }) => {
  return (
    <Box p={24}>
      <Flex
        ta={"center"}
        direction={"column-reverse"}
        justify={"center"}
        align={"center"}
      >
        <Title order={3} mb={16} p={8} px={12} ta={"center"}>
          {i + 1}枚目のスライドの改善点
        </Title>
        <Text c="#5da9ec" tt={"uppercase"} fw={"bold"}>
          Improvement
        </Text>{" "}
        <ThemeIcon mr={12} variant="white" color="#5da9ec">
          <IconPointer />
        </ThemeIcon>
      </Flex>
      {slide.issues.length > 0 ? (
        slide.issues.map((issue: IssueData, issueIndex: number) => (
          <SlideIssue issue={issue} key={issueIndex} />
        ))
      ) : (
        <Box mih={"100%"} style={{ alignContent: "center" }} px={16}>
          {i + 1}枚目のスライドの改善点はありません
        </Box>
      )}
    </Box>
  );
};
