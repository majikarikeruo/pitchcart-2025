import { useState, useEffect } from "react";
import { ResultData } from "@/types/Result";
import { analysisService, AnalysisHistory } from "@/services/analysis.service";

// Todo:エラーメッセージの型定義をいずれ厳密に
interface UseResultReturn {
  result: ResultData | null;
  isLoading: boolean;
  error: Error | null;
}

export const useResult = (analysisId?: string | null): UseResultReturn => {
  const [result, setResult] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        if (analysisId) {
          // analysisIdがある場合、Firestoreから取得
          const analysisHistory: AnalysisHistory | null = await analysisService.getAnalysis(analysisId);
          if (analysisHistory) {
            setResult(analysisHistory.analysisData);
          } else {
            throw new Error(`Analysis with ID ${analysisId} not found.`);
          }
        } else {
          // analysisIdがない場合、まずlocalStorageをチェック
          const localData = localStorage.getItem("analysisResult");
          if (localData) {
            const resultData: ResultData = JSON.parse(localData);
            setResult(resultData);
            // 使用後は削除
            localStorage.removeItem("analysisResult");
          } else {
            // localStorageにもない場合は、従来のtestdata.jsonから取得
            const response = await fetch("/testdata.json");
            if (!response.ok) {
              throw new Error("Failed to fetch data");
            }
            const resultData: ResultData = await response.json();
            setResult(resultData);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("不明なエラーが発生しました"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [analysisId]);

  return {
    result,
    isLoading,
    error,
  };
};
