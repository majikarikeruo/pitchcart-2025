"use client";

import { useState } from "react";
import {
  Box,
  Stack,
  Container,
  Input,
  Loader,
  Text,
  FileInput,
  Button,
  Group,
  Alert,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { IconAlertCircle } from "@tabler/icons-react";

interface PresentationData {
  target_person: string;
  goal: string;
  industry: string;
  file: File | null;
  speech_text: File | null;
}

export const PresentationCheck = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [presentationData, setPresentationData] = useState<PresentationData>({
    target_person: "",
    goal: "",
    industry: "",
    file: null,
    speech_text: null,
  });

  const handleSubmit = async () => {
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

      setIsLoading(true);
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
      const { outputs } = result.data;
      console.log("Success:", outputs);

      try {
        // 非同期でJSONをパースする関数
        const parseJsonAsync = async (jsonString: string) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              try {
                // inputの場合、値も適切にクォートで囲む
                if (jsonString === outputs.input) {
                  const validJson = jsonString
                    .replace(/'/g, '"') // シングルクォートをダブルクォート
                    .replace(/:\s*([^",\{\[\]\}]+)(,|\})/g, ':"$1"$2') // クォートされていない値を囲む
                    .replace(/,(\s*})/g, "$1"); // 末尾のカンマを削除
                  console.log("Transformed JSON:", validJson); // デバッグ用
                  const parsed = JSON.parse(validJson);
                  resolve(parsed);
                } else {
                  const parsed = JSON.parse(jsonString);
                  resolve(parsed);
                }
              } catch (error) {
                console.error("Parse error:", error, "in string:", jsonString);
                resolve(null);
              }
            }, 0);
          });
        };

        // 順次パースを実行
        const parseAllData = async () => {
          const predictedQuestions = await parseJsonAsync(
            outputs.predictedQuestions
          );
          console.log("Parsed predictedQuestions");

          const input = await parseJsonAsync(outputs.input);
          console.log("Parsed input");

          const improvement = await parseJsonAsync(outputs.improvement);
          console.log("Parsed improvement");

          const analysisWithScore = await parseJsonAsync(
            outputs.analysisWithScore
          );
          console.log("Parsed analysisWithScore");

          const prerequisite_check = await parseJsonAsync(
            outputs.prerequisite_check
          );
          console.log("Parsed scoreData");

          const heatmapFlow = await parseJsonAsync(outputs.heatmapFlow);
          console.log("Parsed heatmapFlow");

          const structureFlow = await parseJsonAsync(outputs.structureFlow);
          console.log("Parsed structureFlow");

          return {
            predictedQuestions,
            input,
            improvement,
            analysisWithScore,
            prerequisite_check,
            heatmapFlow,
            structureFlow,
          };
        };

        // パース実行
        parseAllData()
          .then((parsedData) => {
            console.log("All data parsed:", parsedData);
            const {
              predictedQuestions,
              improvement,
              input,
              analysisWithScore,
              prerequisite_check,
              heatmapFlow,
              structureFlow,
            } = parsedData;

            // 次の処理へ
            navigate("/result", {
              state: {
                predictedQuestions,
                improvement,
                input,
                analysisWithScore,
                prerequisite_check,
                heatmapFlow,
                structureFlow,
              },
            });
          })
          .catch((error) => {
            console.error("Parse failed:", error);
          });
      } catch (error) {
        console.error("Parse error:", error);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("不明なエラーが発生しました")
      );
    } finally {
      setIsLoading(false);
    }
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

  return (
    <Box>
      {error && (
        <Container py={48} size="xl">
          <Alert
            icon={<IconAlertCircle />}
            title="エラーが発生しました"
            color="red"
          >
            {error.message}
          </Alert>
        </Container>
      )}
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
        <Button onClick={handleSubmit}>分析を開始する</Button>
      </Group>
    </Box>
  );
};
