import { PracticeFeedback } from "./analysis.service";

export class PromptService {
  // フィードバックを基にした追加プロンプトを生成
  generateFeedbackBasedPrompt(feedbacks: PracticeFeedback[]): string {
    if (feedbacks.length === 0) {
      return "";
    }

    const prompts: string[] = [];

    // 最新のフィードバックから学習
    const latestFeedback = feedbacks[0];

    // 全体的な成功度が低い場合の改善点
    if (latestFeedback.outcomes.overallSuccess <= 3) {
      prompts.push(`前回のプレゼンテーションの全体評価が低かったため、特に以下の点を重点的に分析してください：`);

      if (latestFeedback.outcomes.audienceEngagement <= 3) {
        prompts.push(`- 聴衆の関心を引く要素（ストーリーテリング、ビジュアル、インパクトのあるデータ）`);
      }

      if (latestFeedback.outcomes.clarityOfMessage <= 3) {
        prompts.push(`- メッセージの明確性（構造の論理性、専門用語の説明、要点の強調）`);
      }
    }

    // 受けた質問から弱点を分析
    const questionCategories = this.analyzeQuestionPatterns(feedbacks);
    if (questionCategories.length > 0) {
      prompts.push(`\n過去のプレゼンで以下のカテゴリの質問を多く受けています：`);
      questionCategories.forEach(({ category, count, examples }) => {
        prompts.push(`- ${this.getCategoryLabel(category)}（${count}回）`);
        if (examples.length > 0) {
          prompts.push(`  例: "${examples[0]}"`);
        }
      });
      prompts.push(`これらの領域について、より詳細な説明や根拠を含めることを推奨してください。`);
    }

    // 想定外の質問への対策
    const unanticipatedQuestions = this.getUnanticipatedQuestions(feedbacks);
    if (unanticipatedQuestions.length > 0) {
      prompts.push(`\n以下の想定外の質問を受けた経験があります：`);
      unanticipatedQuestions.slice(0, 3).forEach((q) => {
        prompts.push(`- ${q.question}`);
      });
      prompts.push(`これらの観点も考慮した分析を行ってください。`);
    }

    // 改善点の傾向分析
    const improvementPatterns = this.analyzeImprovementPatterns(feedbacks);
    if (improvementPatterns.length > 0) {
      prompts.push(`\n繰り返し指摘されている改善点：`);
      improvementPatterns.forEach((pattern) => {
        prompts.push(`- ${pattern}`);
      });
    }

    // 成功パターンの強化
    const successPatterns = this.analyzeSuccessPatterns(feedbacks);
    if (successPatterns.length > 0) {
      prompts.push(`\n過去に評価が高かった要素：`);
      successPatterns.forEach((pattern) => {
        prompts.push(`- ${pattern}`);
      });
      prompts.push(`これらの強みを維持・強化することを推奨してください。`);
    }

    // 聴衆タイプ別の最適化
    const audienceInsights = this.analyzeAudiencePatterns(feedbacks);
    if (audienceInsights) {
      prompts.push(`\n${audienceInsights}`);
    }

    return prompts.join("\n");
  }

  // 質問パターンの分析
  private analyzeQuestionPatterns(feedbacks: PracticeFeedback[]) {
    const categoryCount = new Map<string, { count: number; questions: string[] }>();

    feedbacks.forEach((feedback) => {
      feedback.questionsReceived.forEach((q) => {
        if (!categoryCount.has(q.category)) {
          categoryCount.set(q.category, { count: 0, questions: [] });
        }
        const data = categoryCount.get(q.category)!;
        data.count++;
        data.questions.push(q.question);
      });
    });

    return Array.from(categoryCount.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        examples: data.questions.slice(0, 2),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  // 想定外の質問を抽出
  private getUnanticipatedQuestions(feedbacks: PracticeFeedback[]) {
    const questions: { question: string; category: string }[] = [];

    feedbacks.forEach((feedback) => {
      feedback.questionsReceived.filter((q) => !q.wasAnticipated).forEach((q) => questions.push(q));
    });

    return questions;
  }

  // 改善点のパターンを分析
  private analyzeImprovementPatterns(feedbacks: PracticeFeedback[]): string[] {
    const patterns = new Map<string, number>();
    const keywords = [
      { pattern: /時間配分|時間管理|時間オーバー/i, label: "時間配分の最適化" },
      { pattern: /専門用語|難しい|わかりにくい/i, label: "専門用語の説明不足" },
      { pattern: /データ|根拠|エビデンス/i, label: "データや根拠の補強" },
      { pattern: /ストーリー|流れ|構成/i, label: "ストーリー構成の改善" },
      { pattern: /ビジュアル|スライド|見やすさ/i, label: "ビジュアルデザインの改善" },
      { pattern: /質問対応|回答/i, label: "質問への対応力" },
    ];

    feedbacks.forEach((feedback) => {
      const text = feedback.reflections.whatToImprove;
      keywords.forEach(({ pattern, label }) => {
        if (pattern.test(text)) {
          patterns.set(label, (patterns.get(label) || 0) + 1);
        }
      });
    });

    return Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label]) => label);
  }

  // 成功パターンの分析
  private analyzeSuccessPatterns(feedbacks: PracticeFeedback[]): string[] {
    const patterns = new Map<string, number>();
    const keywords = [
      { pattern: /ストーリー|物語|流れ/i, label: "ストーリーテリングの効果" },
      { pattern: /ビジュアル|グラフ|図/i, label: "ビジュアル表現の効果" },
      { pattern: /データ|数字|根拠/i, label: "データの説得力" },
      { pattern: /わかりやすい|明確|クリア/i, label: "メッセージの明確性" },
      { pattern: /情熱|熱意|想い/i, label: "プレゼンターの情熱" },
      { pattern: /具体例|事例|ケース/i, label: "具体例の効果" },
    ];

    feedbacks.forEach((feedback) => {
      const text = feedback.reflections.whatWentWell;
      keywords.forEach(({ pattern, label }) => {
        if (pattern.test(text)) {
          patterns.set(label, (patterns.get(label) || 0) + 1);
        }
      });
    });

    return Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label]) => label);
  }

  // 聴衆タイプ別の分析
  private analyzeAudiencePatterns(feedbacks: PracticeFeedback[]): string | null {
    const audienceTypes = new Map<string, number>();

    feedbacks.forEach((feedback) => {
      const type = feedback.audience.type;
      audienceTypes.set(type, (audienceTypes.get(type) || 0) + 1);
    });

    const mostFrequent = Array.from(audienceTypes.entries()).sort((a, b) => b[1] - a[1])[0];

    if (!mostFrequent) return null;

    const audienceSpecificTips: Record<string, string> = {
      internal: "社内向けプレゼンでは、実現可能性と実装計画の具体性を重視してください。",
      client: "クライアント向けプレゼンでは、価値提案とROIを明確に示すことが重要です。",
      investor: "投資家向けプレゼンでは、市場規模、成長性、競合優位性を強調してください。",
      conference: "カンファレンスでは、新規性とインパクト、実践的な知見を重視してください。",
      academic: "学術発表では、理論的裏付けと研究手法の妥当性を詳細に説明してください。",
    };

    return audienceSpecificTips[mostFrequent[0]] || null;
  }

  // カテゴリラベルの取得
  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      content: "コンテンツ内容",
      data: "データ・根拠",
      feasibility: "実現可能性",
      impact: "インパクト・効果",
      technical: "技術的詳細",
      business: "ビジネス面",
      other: "その他",
    };
    return labels[category] || category;
  }

  // 分析時の動的プロンプトを生成
  async generateAnalysisPrompt(basePrompt: string, userId: string, presentationId: string, analysisService: any): Promise<string> {
    try {
      // 過去の分析履歴を取得
      const history = await analysisService.getAnalysisHistory(userId, presentationId);

      if (history.length === 0) {
        return basePrompt;
      }

      // 最新の分析IDからフィードバックを取得
      const latestAnalysis = history[0];
      const feedbacks = await analysisService.getFeedback(latestAnalysis.id);

      if (feedbacks.length === 0) {
        return basePrompt;
      }

      // フィードバックベースの追加プロンプトを生成
      const additionalPrompt = this.generateFeedbackBasedPrompt(feedbacks);

      return `${basePrompt}\n\n【過去のプレゼン実績に基づく追加分析ポイント】\n${additionalPrompt}`;
    } catch (error) {
      console.error("Failed to generate dynamic prompt:", error);
      return basePrompt;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const promptService = new PromptService();
