import { Container, Alert, Loader, Button, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useResults } from "@/hooks/useResults";
import { ConsensusMvp } from "@/components/features/Result/ConsensusMvp";
import { analysisService } from '@/services/analysis.service';
import type { ResultData } from "@/types/Result";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from 'react';
// no-op

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { result, loading, error } = useResults(location.state?.result as ResultData | null);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const analyzeAllSlides = async (imageUrls: string[]) => {
      // This function is no longer needed as design analysis is removed.
      // Keeping it here for now, but it will be removed in a subsequent edit.
    };

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
        const presentationId = `presentation_${Date.now()}`;
        const presentationTitle = "無題のプレゼンテーション";
        
        await analysisService.saveAnalysis(
          user.uid,
          presentationId,
          presentationTitle,
          result.consensusMvp
        );
        
        // Optionally, navigate or show a success message
        // For now, we just log success and handle the saving state
        console.log("Analysis saved successfully!");

      } catch (err) {
        console.error('Failed to save analysis:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <Container>
        <Title order={1} my="lg" ta="center">分析結果</Title>
        <Loader />
      </Container>
    );
  }

  if (error || !result?.consensusMvp) {
    return (
      <Container>
        <Title order={1} my="lg" ta="center">分析結果</Title>
        <Alert icon={<IconAlertCircle />} title="エラーが発生しました" color="red">
          {error || "有効な分析結果データが見つかりませんでした。エントリーページから再度分析をお試しください。"}
        </Alert>
         <Button onClick={() => navigate('/entry')} mt="md">エントリーページへ</Button>
      </Container>
    );
  }

  return (
    <Container>
      <Title order={1} my="lg" ta="center">分析結果</Title>
      <ConsensusMvp data={result.consensusMvp} />

      <Button onClick={handleSave} loading={isSaving} fullWidth mt="xl">
        今回の分析結果を保存
      </Button>
    </Container>
  );
}

export default Result;
