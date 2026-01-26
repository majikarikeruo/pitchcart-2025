import { Container, Alert, Loader, Button, Title, Stack, Tabs, Group } from "@mantine/core";
import { IconAlertCircle, IconMessageQuestion } from "@tabler/icons-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useResults } from "@/hooks/useResults";
import { ConsensusMvp } from "@/components/features/Result/ConsensusMvp";
import { HistorySelector } from "@/components/features/Result/HistorySelector";
import { VersionComparison } from "@/components/features/Result/VersionComparison";
import { FeedbackForm } from "@/components/features/Result/FeedbackForm";
import { analysisService } from "@/services/analysis.service";
import type { ResultData } from "@/types/Result";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import { notifications } from "@mantine/notifications";

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { result, loading, error } = useResults(location.state?.result as ResultData | null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [isSaving, setIsSaving] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(undefined);
  const [feedbackFormOpened, setFeedbackFormOpened] = useState(false);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>("current");

  // location.stateからpresentationIdとpresentationTitleを取得
  const fallbackIdRef = useRef(`presentation_${Date.now()}`);
  const fallbackTitleRef = useRef("無題のプレゼンテーション");
  const presentationIdFromState = location.state?.presentationId as string | undefined;
  const presentationTitleFromState = location.state?.presentationTitle as string | undefined;
  const presentationId = presentationIdFromState ?? result?.presentationId ?? fallbackIdRef.current;
  const presentationTitle = presentationTitleFromState ?? result?.presentationTitle ?? fallbackTitleRef.current;
  const hasKnownPresentationId = Boolean(presentationIdFromState || result?.presentationId);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "history" || tab === "comparison" || tab === "current") {
      setActiveTab(tab);
      return;
    }
    setActiveTab("current");
  }, [searchParams]);

  const handleTabChange = (value: string | null) => {
    if (!value) return;
    setActiveTab(value);
    const next = new URLSearchParams(searchParams);
    if (value === "current") {
      next.delete("tab");
    } else {
      next.set("tab", value);
    }
    setSearchParams(next, { replace: true });
  };

  const handleVersionChange = async (versionId: string) => {
    try {
      const analysis = await analysisService.getAnalysis(versionId);
      if (analysis) {
        setSelectedVersionId(versionId);
        // ここで分析結果を更新することも可能（useResultsの拡張が必要）
        notifications.show({
          title: "バージョン切替",
          message: `Version ${analysis.version} に切り替えました`,
          color: "blue",
        });
      }
    } catch (err) {
      console.error("Failed to load version:", err);
      notifications.show({
        title: "エラー",
        message: "バージョンの読み込みに失敗しました",
        color: "red",
      });
    }
  };

  useEffect(() => {
    if (result?.slideImages && result.slideImages.length > 0) {
      // slideImages are URLs, pass them directly
      // analyzeAllSlides(result.slideImages); // This line was removed as per the new_code
    } else if (!loading) {
      // setIsDesignLoading(false); // This line was removed as per the new_code
    }
  }, [result, loading]);

  const handleSave = async () => {
    if (result?.consensusMvp && user) {
      setIsSaving(true);
      try {
        const analysisId = await analysisService.saveAnalysis(user.uid, presentationId, presentationTitle, result.consensusMvp);
        setSavedAnalysisId(analysisId);

        notifications.show({
          title: "保存完了",
          message: "分析結果がFirebaseに保存されました。",
          color: "teal",
        });
      } catch (err) {
        console.error("Failed to save analysis:", err);
        notifications.show({
          title: "保存エラー",
          message: "分析結果の保存に失敗しました。",
          color: "red",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <Container>
        <Title order={1} my="lg" ta="center">
          分析結果
        </Title>
        <Loader />
      </Container>
    );
  }

  if (error || !result?.consensusMvp) {
    return (
      <Container>
        <Title order={1} my="lg" ta="center">
          分析結果
        </Title>
        <Alert icon={<IconAlertCircle />} title="エラーが発生しました" color="red">
          {error || "有効な分析結果データが見つかりませんでした。エントリーページから再度分析をお試しください。"}
        </Alert>
        <Button onClick={() => navigate("/entry")} mt="md">
          エントリーページへ
        </Button>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Title order={1} my="lg" ta="center">
        分析結果
      </Title>

      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tabs.List mb="md">
          <Tabs.Tab value="current">📊 今回の分析</Tabs.Tab>
          <Tabs.Tab value="history">📜 履歴</Tabs.Tab>
          <Tabs.Tab value="comparison">🔄 バージョン比較</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="current">
          <Stack gap="lg">
            {user && (
              <HistorySelector
                currentAnalysisId={selectedVersionId}
                presentationId={hasKnownPresentationId ? presentationId : undefined}
                onVersionChange={handleVersionChange}
              />
            )}

            <ConsensusMvp data={result.consensusMvp} />

            {user && (
              <Group grow>
                <Button onClick={handleSave} loading={isSaving} disabled={!!savedAnalysisId}>
                  {savedAnalysisId ? "保存済み" : "今回の分析結果を保存"}
                </Button>
                <Button
                  variant="light"
                  leftSection={<IconMessageQuestion size={18} />}
                  onClick={() => setFeedbackFormOpened(true)}
                  disabled={!savedAnalysisId}
                >
                  実践フィードバックを記録
                </Button>
              </Group>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="history">
          {user ? (
            <HistorySelector
              currentAnalysisId={selectedVersionId}
              presentationId={hasKnownPresentationId ? presentationId : undefined}
              onVersionChange={handleVersionChange}
            />
          ) : (
            <Alert color="blue" title="ログインが必要です">
              履歴機能を使用するにはログインしてください
            </Alert>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="comparison">
          {!user ? (
            <Alert color="blue" title="ログインが必要です">
              バージョン比較機能を使用するにはログインしてください
            </Alert>
          ) : !hasKnownPresentationId ? (
            <Alert color="blue" title="比較に必要な情報がありません">
              比較には同じプレゼンの履歴が必要です。結果画面を開いた状態で履歴を確認してください。
            </Alert>
          ) : (
            <VersionComparison presentationId={presentationId} currentVersionId={selectedVersionId} />
          )}
        </Tabs.Panel>
      </Tabs>

      {/* フィードバックフォームモーダル */}
      {savedAnalysisId && (
        <FeedbackForm
          opened={feedbackFormOpened}
          onClose={() => setFeedbackFormOpened(false)}
          analysisId={savedAnalysisId}
          onSubmit={() => {
            notifications.show({
              title: "フィードバック保存完了",
              message: "実践フィードバックが保存されました",
              color: "teal",
            });
          }}
        />
      )}
    </Container>
  );
}

export default Result;
