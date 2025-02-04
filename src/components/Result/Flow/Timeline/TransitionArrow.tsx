import { Flex, UnstyledButton } from "@mantine/core";

import { ChevronRight } from "lucide-react";

export const TransitionArrow = ({
  toggle,
  hasIssue,
  onClick,
}: {
  toggle: () => void;
  hasIssue: boolean;
  onClick?: () => void;
}) => (
  <UnstyledButton>
    <Flex
      align="center"
      mx="xs"
      style={{ cursor: hasIssue ? "pointer" : "default" }}
    >
      <ChevronRight
        size={24}
        color={
          hasIssue
            ? "var(--mantine-color-blue-6)"
            : "var(--mantine-color-gray-6)"
        }
        style={{ opacity: hasIssue ? 1 : 0.5, cursor: "pointer" }}
        onClick={onClick}
      />
    </Flex>
  </UnstyledButton>
);
