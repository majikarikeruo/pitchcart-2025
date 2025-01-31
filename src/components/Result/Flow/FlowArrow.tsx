import { Flex } from "@mantine/core";

import { ChevronRight } from "lucide-react";

export const FlowArrow = ({
  hasIssue,
  onClick,
}: {
  hasIssue: boolean;
  onClick?: () => void;
}) => (
  <Flex
    align="center"
    mx="xs"
    style={{ cursor: hasIssue ? "pointer" : "default" }}
  >
    <ChevronRight
      size={24}
      color={
        hasIssue ? "var(--mantine-color-red-6)" : "var(--mantine-color-gray-6)"
      }
      style={{ opacity: hasIssue ? 1 : 0.5 }}
      onClick={onClick}
    />
  </Flex>
);
