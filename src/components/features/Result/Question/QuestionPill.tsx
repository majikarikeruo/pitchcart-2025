import { Pill } from "@mantine/core";

type StyleLevel = "high" | "medium" | "low";

interface StyleConfig {
  label: string;
  color: string;
  backgroundColor: string;
}

interface QuestionPillProps {
  pillStyles: Record<StyleLevel, StyleConfig>;
  priority: StyleLevel;
}

export const QuestionPill = ({ pillStyles, priority }: QuestionPillProps) => {
  const pillStyle: Record<string, React.CSSProperties> = {
    root: {
      backgroundColor: `${pillStyles[priority].backgroundColor}`,
      borderRadius: 8,
      color: `${pillStyles[priority].color}`,
      position: "absolute",
      left: -40,
      top: 16,
      fontSize: 12,
    },
  };

  return <Pill styles={pillStyle}>優先度・{pillStyles[priority].label}</Pill>;
};
