import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analysisService } from '../services/analysis.service';
import { promptService } from '../services/prompt.service';
import { notifications } from '@mantine/notifications';

interface AnalysisOptions {
  presentationId: string;
  basePrompt: string;
  onAnalysisStart?: () => void;
  onAnalysisComplete?: (result: any) => void;
}

export const useEnhancedAnalysis = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string>('');

  const analyzeWithFeedback = async (options: AnalysisOptions) => {
    if (!user) {
      notifications.show({
        title: 'エラー',
        message: 'ログインが必要です',
        color: 'red'
      });
      return null;
    }

    try {
      setLoading(true);
      options.onAnalysisStart?.();

      // 過去のフィードバックを考慮したプロンプトを生成
      const dynamicPrompt = await promptService.generateAnalysisPrompt(
        options.basePrompt,
        user.uid,
        options.presentationId,
        analysisService
      );

      setEnhancedPrompt(dynamicPrompt);

      // ここで実際のAI分析を実行
      // 現在の実装では、プロンプトの生成のみを行い、
      // 実際の分析は既存のフローに任せる
      
      notifications.show({
        title: '分析開始',
        message: '過去のフィードバックを考慮した分析を開始しました',
        color: 'blue'
      });

      // 分析結果を返す（実際の実装では、ここでAI APIを呼び出す）
      const result = {
        prompt: dynamicPrompt,
        timestamp: new Date()
      };

      options.onAnalysisComplete?.(result);
      return result;

    } catch (error) {
      console.error('Enhanced analysis error:', error);
      notifications.show({
        title: 'エラー',
        message: '拡張分析の実行に失敗しました',
        color: 'red'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getAnalysisInsights = async (presentationId: string) => {
    if (!user) return null;

    try {
      // 過去の分析履歴を取得
      const history = await analysisService.getAnalysisHistory(user.uid, presentationId);
      
      if (history.length === 0) {
        return {
          hasHistory: false,
          message: '初回の分析です。基本的な評価基準で分析を行います。'
        };
      }

      // 最新の分析に対するフィードバックを取得
      const latestAnalysis = history[0];
      const feedbacks = await analysisService.getFeedback(latestAnalysis.id);

      if (feedbacks.length === 0) {
        return {
          hasHistory: true,
          hasFeedback: false,
          message: '過去の分析履歴はありますが、実践フィードバックがまだありません。',
          suggestion: 'プレゼン実施後にフィードバックを記録すると、より精度の高い分析が可能になります。'
        };
      }

      // フィードバックから洞察を生成
      const insights = generateInsights(feedbacks, history);

      return {
        hasHistory: true,
        hasFeedback: true,
        insights,
        message: `過去${feedbacks.length}回の実践データを基に、カスタマイズされた分析を行います。`
      };

    } catch (error) {
      console.error('Failed to get analysis insights:', error);
      return null;
    }
  };

  return {
    analyzeWithFeedback,
    getAnalysisInsights,
    enhancedPrompt,
    loading
  };
};

// フィードバックから洞察を生成
function generateInsights(feedbacks: any[], history: any[]) {
  const insights = {
    strengths: [] as string[],
    weaknesses: [] as string[],
    trends: [] as string[],
    recommendations: [] as string[]
  };

  // 平均スコアの計算
  const avgScores = feedbacks.reduce((acc, fb) => {
    acc.overall += fb.outcomes.overallSuccess;
    acc.engagement += fb.outcomes.audienceEngagement;
    acc.clarity += fb.outcomes.clarityOfMessage;
    acc.count++;
    return acc;
  }, { overall: 0, engagement: 0, clarity: 0, count: 0 });

  Object.keys(avgScores).forEach(key => {
    if (key !== 'count') {
      avgScores[key] = avgScores[key] / avgScores.count;
    }
  });

  // 強みの特定
  if (avgScores.overall >= 4) {
    insights.strengths.push('全体的に高い評価を獲得');
  }
  if (avgScores.engagement >= 4) {
    insights.strengths.push('聴衆の関心を引く力が優れている');
  }
  if (avgScores.clarity >= 4) {
    insights.strengths.push('メッセージの明確性が高い');
  }

  // 弱点の特定
  if (avgScores.overall < 3) {
    insights.weaknesses.push('全体的な改善が必要');
  }
  if (avgScores.engagement < 3) {
    insights.weaknesses.push('聴衆の関心を引く工夫が必要');
  }
  if (avgScores.clarity < 3) {
    insights.weaknesses.push('メッセージの明確化が必要');
  }

  // スコアの推移分析
  if (history.length >= 2) {
    const latestScore = history[0].metadata.totalScore;
    const previousScore = history[1].metadata.totalScore;
    const improvement = latestScore - previousScore;

    if (improvement > 5) {
      insights.trends.push(`前回から${improvement.toFixed(1)}点の大幅改善`);
    } else if (improvement < -5) {
      insights.trends.push(`前回から${Math.abs(improvement).toFixed(1)}点の低下`);
    }
  }

  // 推奨事項の生成
  if (insights.weaknesses.includes('聴衆の関心を引く工夫が必要')) {
    insights.recommendations.push('冒頭のフックを強化し、ストーリーテリングを活用する');
  }
  if (insights.weaknesses.includes('メッセージの明確化が必要')) {
    insights.recommendations.push('キーメッセージを3つに絞り、各スライドで繰り返し強調する');
  }

  // 質問対応の分析
  const unanticipatedRatio = feedbacks.reduce((acc, fb) => {
    const total = fb.questionsReceived.length;
    const unanticipated = fb.questionsReceived.filter((q: any) => !q.wasAnticipated).length;
    return total > 0 ? acc + (unanticipated / total) : acc;
  }, 0) / feedbacks.length;

  if (unanticipatedRatio > 0.5) {
    insights.recommendations.push('想定質問の準備を強化し、FAQ資料を充実させる');
  }

  return insights;
}