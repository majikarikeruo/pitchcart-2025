import { Divider, SimpleGrid, Paper } from "@mantine/core";

import { SummarySection } from "@/components/features/Result/Score/ReportAboutEachScore/SummarySection";
import { SubCategory } from "@/components/features/Result/Score/ReportAboutEachScore/SubCategory";
import { CATEGORY_DETAILS, AnalysisCategoryProps, ScoreExplanationProps, AnalysisCategoryData } from "@/types/Result";

interface ReportProps {
  analysisCategories: AnalysisCategoryData[];
  explanationByScore: ScoreExplanationProps;
  selectedCategory: AnalysisCategoryProps;
}

export const ReportAboutEachScore = ({ analysisCategories, explanationByScore, selectedCategory }: ReportProps) => {
  const categoryDetails = CATEGORY_DETAILS[selectedCategory];

  return (
    <Paper shadow="md">
      <SummarySection analysisCategories={analysisCategories} selectedCategory={selectedCategory} explanationByScore={explanationByScore} />

      <Divider />

      {/* サブカテゴリーのグリッド表示 */}
      <SimpleGrid cols={3} style={{ padding: "16px" }} bg="white">
        {Object.entries(categoryDetails).map(([subcategory, label]) => (
          <SubCategory key={subcategory} subcategory={subcategory} label={label} explanationByScore={explanationByScore} />
        ))}
      </SimpleGrid>
    </Paper>
  );
};
