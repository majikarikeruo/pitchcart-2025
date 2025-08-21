import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analysisService, AnalysisHistory } from '../services/analysis.service';
import { notifications } from '@mantine/notifications';

export const useAnalysisHistory = (presentationId?: string) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    fetchHistory();
  }, [user, presentationId]);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await analysisService.getAnalysisHistory(user.uid, presentationId);
      setHistory(data);
    } catch (err) {
      setError(err as Error);
      notifications.show({
        title: 'エラー',
        message: '履歴の取得に失敗しました',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchHistory();
  };

  return {
    history,
    loading,
    error,
    refetch
  };
};