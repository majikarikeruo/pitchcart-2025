import { Flex, Text, Box, ThemeIcon } from "@mantine/core";
import { IconChevronRight, IconCheck } from "@tabler/icons-react";
import { edgeItemProps } from "@/types/Result";

export const TransitionTarget = ({
  targetEdge,
}: {
  targetEdge: edgeItemProps;
}) => {
  return (
    <Box ta={"center"} p={16}>
      <ThemeIcon variant="white" mr={16}>
        <IconCheck />
      </ThemeIcon>
      <Text c="#5da9ec" tt={"uppercase"} fw={"bold"}>
        Improvement
      </Text>
      <Flex justify={"center"} align={"center"}>
        <Text fz={27} fw={"bold"}>
          {targetEdge.from_slide}枚目
        </Text>

        <IconChevronRight
          size={32}
          stroke={1.5}
          color="var(--mantine-color-gray-5)"
        />

        <Text fz={27} fw={"bold"}>
          {targetEdge.to_slide}枚目への遷移
        </Text>
      </Flex>{" "}
    </Box>
  );
};
