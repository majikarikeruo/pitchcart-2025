"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import { Box, Stack, Input, FileInput, Button, Group, Switch } from "@mantine/core";
const AnalysisInsights = lazy(() => import('./AnalysisInsights').then(m => ({ default: m.AnalysisInsights })));
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { postAnalyzeForm, streamAnalyzeForm, checkApiHealth } from "@/services/analyze";
import type { PersonaOutput, AnalysisResponse } from "@/types/analysis";
import type { ResultData } from "@/types/Result";

interface PresentationData {
  target_person: string;
  goal: string;
  industry: string;
  file: File | null;
  speech_text: File | null;
}

export const PresentationCheck = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [presentationData, setPresentationData] = useState<PresentationData>({
    target_person: "",
    goal: "",
    industry: "",
    file: null,
    speech_text: null,
  });
  const [presentationId, setPresentationId] = useState<string>("");
  const [useEnhancedAnalysis, setUseEnhancedAnalysis] = useState(true);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [receivedPersonas, setReceivedPersonas] = useState<PersonaOutput[]>([]);
  const [canViewResult, setCanViewResult] = useState(false);
  const [latestResult, setLatestResult] = useState<ResultData | null>(null);

  useEffect(() => {
    if (user && presentationData.goal) {
      const id = `${user.uid}_${presentationData.goal.slice(0, 20)}_${Date.now()}`;
      setPresentationId(id);
    }
  }, [user, presentationData.goal]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const healthy = await checkApiHealth();
      if (!healthy) {
        notifications.show({ title: "サーバ未起動", message: "バックエンドが起動していません。npm run server を実行してください。", color: "red" });
        return;
      }
      const form = new FormData();
      if (presentationData.file) form.append('file', presentationData.file);
      if (presentationData.speech_text) form.append('speech_text', presentationData.speech_text);
      form.append('target_person', presentationData.target_person);
      form.append('goal', presentationData.goal);
      form.append('industry', presentationData.industry);
      form.append('use_llm', useEnhancedAnalysis ? 'true' : 'false');
      if (useEnhancedAnalysis) {
        form.append('detail', 'high');
        form.append('evidence_max', '5');
      }

      setStreaming(true);
      setReceivedPersonas([]);
      let finalResult: AnalysisResponse | null = null;

      await streamAnalyzeForm(form, (evt) => {
        if (evt.type === 'persona') {
          setReceivedPersonas((prev) => {
            const i = prev.findIndex((p) => p.persona_id === evt.data.persona_id);
            if (i >= 0) { const next = prev.slice(); next[i] = evt.data; return next; }
            return [...prev, evt.data];
          });
        }
      }, (fullResponse) => {
        finalResult = fullResponse;
      });

      const resultToStore = { consensusMvp: finalResult };
      if (finalResult) {
        localStorage.setItem("analysisResult", JSON.stringify(resultToStore));
        setLatestResult(resultToStore);
        setCanViewResult(true);
        notifications.show({ title: "分析完了", message: "結果を見るボタンから確認できます", color: "teal" });
      } else {
        // Fallback for when streaming fails to return a complete result
        const fallback = await postAnalyzeForm(form);
        const fallbackResultToStore = { consensusMvp: fallback };
        localStorage.setItem("analysisResult", JSON.stringify(fallbackResultToStore));
        setLatestResult(fallbackResultToStore);
        setCanViewResult(true);
        notifications.show({ title: "分析完了", message: "結果を見るボタンから確認できます", color: "teal" });
      }
    } catch (error: any) {
      console.error("Request failed:", error);
      const message = error?.message || "分析に失敗しました。";
      notifications.show({ title: "エラー", message, color: "red" });
    } finally {
      setStreaming(false);
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack my={16}>
        <Input.Wrapper label="オーディエンス相手は誰ですか？">
          <Input
            placeholder="例）Tech系VC"
            value={presentationData.target_person}
            onChange={(e) =>
              setPresentationData({
                ...presentationData,
                target_person: e.target.value,
              })
            }
          />
        </Input.Wrapper>
        <Input.Wrapper label="プレゼンの目的は何ですか？">
          <Input
            placeholder="例）シリーズA資金調達"
            value={presentationData.goal}
            onChange={(e) =>
              setPresentationData({ ...presentationData, goal: e.target.value })
            }
          />
        </Input.Wrapper>

        <Input.Wrapper label="業界">
          <Input
            placeholder="例）Saas業界のみ対応"
            value={presentationData.industry}
            onChange={(e) =>
              setPresentationData({
                ...presentationData,
                industry: e.target.value,
              })
            }
          />
        </Input.Wrapper>

        {user && presentationId && (
          <Suspense fallback={null}>
            <AnalysisInsights
              presentationId={presentationId}
              onStartEnhancedAnalysis={() => setUseEnhancedAnalysis(true)}
            />
          </Suspense>
        )}

        <Switch
          label="高精度分析（LLM使用）"
          checked={useEnhancedAnalysis}
          onChange={(e) => setUseEnhancedAnalysis(e.currentTarget.checked)}
        />

        <FileInput
          label="プレゼン資料をアップロードしてください"
          placeholder="ここにスライドの資料をドラッグするか、クリックしてファイルを選択してください(pptx。容量●MB。)"
          value={presentationData.file}
          onChange={(file) =>
            setPresentationData({ ...presentationData, file: file })
          }
        />
        <FileInput
          label="プレゼン原稿をアップロードしてください"
          placeholder="ここにスライドの資料をドラッグするか、クリックしてファイルを選択してください(pptx。容量●MB。)"
          value={presentationData.speech_text}
          onChange={(file) =>
            setPresentationData({ ...presentationData, speech_text: file })
          }
        />
      </Stack>
      <Group justify="center" gap="md">
        <Button 
          onClick={handleSubmit}
          loading={loading || streaming}
          disabled={!presentationData.file || loading || streaming}
        >
          {streaming ? '分析中…' : (useEnhancedAnalysis ? '🚀 高精度分析を開始' : '分析を開始する')}
        </Button>
        <Button
          variant="light"
          onClick={() => navigate('/result', { state: { result: latestResult } })}
          disabled={!canViewResult}
        >
          結果を見る
        </Button>
      </Group>
      {streaming && (
        <Group justify="center" mt={8}>
          <span style={{ fontSize: 12, color: 'var(--mantine-color-dimmed)' }}>
            評価進行中: 受信 {receivedPersonas.length} 件
          </span>
        </Group>
      )}
    </Box>
  );
};
