type IssueKey = "content" | "message" | "visual" | "structure";

interface IssueValue {
  backgroundColor: string;
  text: string;
}

export interface IssueData {
  impact: string;
  description: string;
  suggestion: string;
  type: IssueKey;
}

export const ISSUE_LABELS: Record<IssueKey, IssueValue> = {
  content: {
    backgroundColor: "blue",
    text: "スライド内容",
  },
  structure: {
    backgroundColor: "indigo",
    text: "構造",
  },
  message: {
    backgroundColor: "orange",
    text: "メッセージ性",
  },
  visual: {
    backgroundColor: "cyan",
    text: "デザイン",
  },
} as const;

export interface SlideData {
  number: number;
  title: string;
  content_score: number;
  visual_score: number;
  improvement_count: number;
  priority: string;
  issues: IssueData[];
  section_type: string;
}

export interface HeatmapData {
  slide_heatmap: {
    slides: SlideData[];
  };
}

export interface issueProps {
  issue: string;
  current_content: string;
  suggestion: string;
  context: string;
}

export interface edgeItemProps {
  from_slide: number;
  to_slide: number;
  transition_issues: issueProps[];
}

export interface narrativeSectionsProps {
  type: string;
  narrative_strength: number;
  slide_range: {
    start: number;
    end: number;
  };
  key_messages: string[];
}

interface storyStructureProps {
  main_theme: string;
  narrative_sections: narrativeSectionsProps[];
}

interface structureProps {
  edges: edgeItemProps[];
  story_structure: storyStructureProps;
}

export interface structureData {
  structure_flow: structureProps;
}

interface CurrentStateProps {
  description: string;
  missing_elements: string[];
}

export interface PrerequisiteCheckProps {
  missing_prerequisites: PrerequisiteCheckItemProps[];
}

export interface PrerequisiteCheckItemProps {
  topic: string;
  slide_number: number;
  current_state: CurrentStateProps;
}

export interface prerequisiteData {
  prerequisite_check: PrerequisiteCheckProps;
}

export type DisplayType = "slide" | "transition";
export const SECTION_CONFIG = {
  setup: {
    color: "#228BE6",
    label: "導入",
  },
  problem: {
    color: "#FA5252",
    label: "課題",
  },
  solution: {
    color: "#40C057",
    label: "解決策",
  },
  evidence: {
    color: "#845EF7",
    label: "実証",
  },
  call_to_action: {
    color: "#FF922B",
    label: "まとめ",
  },
} as const;

export type SectionType = keyof typeof SECTION_CONFIG;
