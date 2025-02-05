export interface ImplementationStepsProps {
  step: number;
  description: string;
  estimated_time: string;
}

export interface ImprovementItemProps {
  action: string;
  expected_result: string;
  priority: string;
  implementation_steps: ImplementationStepsProps[];
}

export interface OverallItemProps {
  category: string;
  issue: string;
  improvement: ImprovementItemProps;
}

interface OverallProps {
  overall: OverallItemProps[];
}

export interface ImprovementProps {
  improvements: OverallProps;
}
