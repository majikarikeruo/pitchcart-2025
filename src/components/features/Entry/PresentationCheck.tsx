"use client";

import { useState, useEffect } from "react";
import { Box, Stack, Input, FileInput, Button, Group } from "@mantine/core";
import { AnalysisInsights } from "./AnalysisInsights";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";

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
  const [useEnhancedAnalysis, setUseEnhancedAnalysis] = useState(false);
  const [loading, setLoading] = useState(false);

  // プレゼンテーションIDを生成
  useEffect(() => {
    if (user && presentationData.goal) {
      const id = `${user.uid}_${presentationData.goal.slice(0, 20)}_${Date.now()}`;
      setPresentationId(id);
    }
  }, [user, presentationData.goal]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // バリデーション
      //   if (!presentationData.audience || !presentationData.goal) {
      //     alert("オーディエンスと目的を入力してください");
      //     return;
      //   }

      const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "user",
          `user_${Math.random().toString(36).substring(7)}`
        );

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/files/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`,
            },
            body: formData,
          }
        );

        if (!response.ok) throw new Error("File upload failed");
        return response.json();
      };

      const [presentationFileData, speechTextFileData] = await Promise.all([
        presentationData.file ? uploadFile(presentationData.file) : null,
        presentationData.speech_text
          ? uploadFile(presentationData.speech_text)
          : null,
      ]);

      const requestBody = {
        response_mode: "blocking",
        user: `user_${Math.random().toString(36).substring(7)}`,

        inputs: {
          target_person: presentationData.target_person,
          goal: presentationData.goal,
          industry: presentationData.industry,
          file: {
            type: "document", // PPTXはdocumentタイプ
            transfer_method: "local_file",
            upload_file_id: presentationFileData.id,
          },
          speech_text: {
            type: "document",
            transfer_method: "local_file",
            upload_file_id: speechTextFileData.id,
          },
        },
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/workflows/run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      // 以下のエラーハンドリングは同じ
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        });
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Success:", result);

      // 結果をlocalStorageに保存してResult画面へ遷移
      if (result && result.data && result.data.outputs) {
        localStorage.setItem("analysisResult", JSON.stringify(result.data.outputs));
        notifications.show({
          title: "分析完了",
          message: "分析が完了しました。結果画面へ移動します。",
          color: "teal"
        });
        navigate("/result");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Request failed:", error);
      notifications.show({
        title: "エラー",
        message: "分析リクエストに失敗しました。もう一度お試しください。",
        color: "red"
      });
    } finally {
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

        {/* AI分析インサイト */}
        {user && presentationId && (
          <AnalysisInsights
            presentationId={presentationId}
            onStartEnhancedAnalysis={() => setUseEnhancedAnalysis(true)}
          />
        )}

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
      <Group justify="center">
        <Button 
          onClick={handleSubmit}
          loading={loading}
          disabled={!presentationData.file || loading}
        >
          {useEnhancedAnalysis ? '🚀 高精度分析を開始' : '分析を開始する'}
        </Button>
      </Group>
    </Box>
  );
};
