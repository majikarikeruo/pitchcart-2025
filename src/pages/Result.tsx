import { Container, Stack, Alert, Loader, Text, Button, Group } from "@mantine/core";
import { IconAlertCircle, IconPlus } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Score } from "@/components/features/Result/Score";
import { Question } from "@/components/features/Result/Question";
import { Improvement } from "@/components/features/Result/Improvement";
import { Flow } from "@/components/features/Result/Flow";
import { HistorySelector } from "@/components/features/Result/HistorySelector";
import { VersionComparison } from "@/components/features/Result/VersionComparison";
import { FeedbackList } from "@/components/features/Result/FeedbackList";

import { useResult } from "@/hooks/useResults";
import { useAuth } from "@/contexts/AuthContext";
import { analysisService } from "@/services/analysis.service";

export default function Result() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const analysisId = searchParams.get('analysisId');
  const { result, isLoading, error } = useResult(analysisId);
  const [currentPresentationId, setCurrentPresentationId] = useState<string>("");

  // URLパラメータから分析IDを取得
  useEffect(() => {
    // This effect is no longer needed as we get analysisId directly
  }, [searchParams]);

  // 結果をFirestoreに保存
  useEffect(() => {
    const saveToFirestore = async () => {
      console.log('SaveToFirestore - result:', result);
      console.log('SaveToFirestore - user:', user);
      console.log('SaveToFirestore - analysisId:', analysisId);
      
      if (result && user && !analysisId) {
        try {
          // DifyのレスポンスとtestdataのどちらでもpresentationIdを取得できるように
          const presentationId = result.input?.product || result.userInput?.product || `presentation_${Date.now()}`;
          const presentationTitle = result.input?.product || result.userInput?.product || "無題のプレゼンテーション";
          
          console.log('Saving with presentationId:', presentationId);
          
          const savedAnalysisId = await analysisService.saveAnalysis(
            user.uid,
            presentationId,
            presentationTitle,
            result as any
          );
          
          console.log('Saved analysisId:', savedAnalysisId);
          setCurrentPresentationId(presentationId);
          navigate(`/result?analysisId=${savedAnalysisId}`, { replace: true });
        } catch (err) {
          console.error('Failed to save analysis:', err);
        }
      }
    };

    saveToFirestore();
  }, [result, user, analysisId, navigate]);

  // 既存の分析を表示する場合、presentationIdを取得
  useEffect(() => {
    const loadAnalysisData = async () => {
      console.log('LoadAnalysisData - analysisId:', analysisId);
      console.log('LoadAnalysisData - user:', user);
      
      if (analysisId && user) {
        try {
          const analysis = await analysisService.getAnalysis(analysisId);
          console.log('Loaded analysis:', analysis);
          
          if (analysis) {
            setCurrentPresentationId(analysis.presentationId);
            console.log('Set currentPresentationId:', analysis.presentationId);
          }
        } catch (err) {
          console.error('Failed to load analysis data:', err);
        }
      }
    };

    loadAnalysisData();
  }, [analysisId, user]);

  const handleVersionChange = async (analysisId: string) => {
    navigate(`/result?analysisId=${analysisId}`);
  };

  if (isLoading) {
    return (
      <Container py={48} size="xl">
        <Stack align="center">
          <Loader size="xl" />
          <Text size="lg">分析結果を読み込んでいます...</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container py={48} size="xl">
        <Alert icon={<IconAlertCircle />} title="エラーが発生しました" color="red">
          {error.message}
        </Alert>
      </Container>
    );
  }

  if (!result) return null;

  console.log('Render - currentPresentationId:', currentPresentationId);
  console.log('Render - analysisId:', analysisId);

  return (
    <Stack>
      <Container py={48} size="xl">
        <Stack gap="xl">
          {/* 履歴セレクターと新規分析ボタン */}
          <Group justify="space-between" align="flex-start">
            {currentPresentationId ? (
              <HistorySelector
                currentAnalysisId={analysisId || undefined}
                presentationId={currentPresentationId}
                onVersionChange={handleVersionChange}
              />
            ) : (
              <div>currentPresentationId is empty</div>
            )}
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => navigate('/entry')}
              variant="light"
            >
              新しい分析を開始
            </Button>
          </Group>

          {/* 分析結果の表示 */}
          <Score analysisWithScore={result.analysisWithScore} input={result.input} />
          
          {/* バージョン比較 */}
          {currentPresentationId ? (
            <VersionComparison 
              presentationId={currentPresentationId}
              currentVersionId={analysisId || undefined}
            />
          ) : (
            <div>Version comparison: currentPresentationId is empty</div>
          )}
          
          <Flow heatmapFlow={result.heatmapFlow} structureFlow={result.structureFlow} prerequisiteCheck={result.prerequisiteCheck} />
          <Question predictedQuestions={result.predictedQuestions} />
          <Improvement improvement={result.improvement} />
          
          {/* 実践フィードバック */}
          {analysisId ? (
            <FeedbackList analysisId={analysisId} />
          ) : (
            <div>FeedbackList: analysisId is empty</div>
          )}
        </Stack>
      </Container>
    </Stack>
  );
}
