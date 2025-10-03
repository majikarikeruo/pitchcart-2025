import { useState, useEffect } from "react";
import type { ResultData } from "@/types/Result";
import { useAuth } from "@/contexts/AuthContext";
import { analysisService } from "@/services/analysis.service";

export interface UseResultReturn {
  result: ResultData | null;
  loading: boolean;
  error: string | null;
}

export const useResults = (initialResult?: ResultData | null): UseResultReturn => {
  const { user } = useAuth();
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      try {
        if (initialResult) {
          console.log("Initial result from location state:", initialResult);
          setResult(initialResult);
          return;
        }

        const storedResult = localStorage.getItem('analysisResult');
        if (storedResult) {
          console.log("Found result in local storage.");
          const parsed = JSON.parse(storedResult) as ResultData;
          setResult(parsed);
          return;
        }
        // ストレージにも無い場合、サインイン済みなら履歴から取得（最新）
        if (user?.uid) {
          console.log("Fetching latest analysis history for user", user.uid);
          const history = await analysisService.getAnalysisHistory(user.uid);
          if (history && history.length > 0 && history[0]?.analysisData) {
            setResult({ consensusMvp: history[0].analysisData, slideImages: [] });
            return;
          }
        }

        console.log("No initial, stored, or history result found.");
        setError('分析結果が見つかりませんでした。');
      } catch (err) {
        console.error("Error fetching result:", err);
        setError('結果の取得中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [initialResult, user?.uid]);

  return { result, loading, error };
};
