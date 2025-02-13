import { useState, useEffect } from "react";
import { ResultData } from "@/types/Result";

// Todo:エラーメッセージの型定義をいずれ厳密に
interface UseResultReturn {
  result: ResultData | null;
  isLoading: boolean;
  error: Error | null;
}

export const useResult = (): UseResultReturn => {
  const [result, setResult] = useState<ResultData | null>(null);
  const [isLoading, setIsloading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setIsloading(true);
        const response = await fetch("/testdata.json");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const resultData: ResultData = await response.json();
        setResult(resultData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("不明なエラーが発生しました"));
      } finally {
        setIsloading(false);
      }
    };
    fetchData();
  }, []);

  return {
    result,
    isLoading,
    error,
  };
};
