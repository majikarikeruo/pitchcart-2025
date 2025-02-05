export type StyleLevel = "high" | "medium" | "low";

export interface StyleConfig {
  label: string;
  color: string;
  backgroundColor: string;
}

export interface QuestionItem {
  question: string;
  background: string;
  source: string;
  priority: StyleLevel;
}

export interface QuestionItems {
  question_items: QuestionItem[];
}
