import { AnalysisHistory, PracticeFeedback } from './analysis.service';

// ダミーの分析履歴データを生成
export const generateDummyAnalysisHistory = (userId: string): AnalysisHistory[] => {
  const now = new Date();
  const histories: AnalysisHistory[] = [];

  // 過去5回分のダミーデータを生成
  for (let i = 0; i < 5; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 7)); // 1週間ごと
    
    const baseScore = 70 + (5 - i) * 4; // 徐々にスコアが上がる
    
    histories.push({
      id: `dummy_analysis_${i}`,
      userId,
      presentationId: 'dummy_presentation',
      presentationTitle: 'プロダクト紹介プレゼンテーション',
      version: 5 - i,
      analysisData: {} as any, // 簡略化
      createdAt: date as any,
      updatedAt: date as any,
      metadata: {
        slideCount: 15,
        totalScore: baseScore + Math.random() * 5,
        categoryScores: {
          content: baseScore + Math.random() * 10 - 5,
          design: baseScore + Math.random() * 10 - 5,
          persuasiveness: baseScore + Math.random() * 10 - 5,
          technicalQuality: baseScore + Math.random() * 10 - 5
        },
        tags: ['プロダクト', 'セールス'],
        notes: `Version ${5 - i}の分析結果`
      },
      comparison: i > 0 ? {
        previousVersionId: `dummy_analysis_${i + 1}`,
        scoreImprovement: 3 + Math.random() * 2,
        improvedAreas: ['ストーリー構成', 'ビジュアルデザイン'],
        newIssues: ['時間配分']
      } : undefined
    });
  }

  return histories;
};

// ダミーのフィードバックデータを生成
export const generateDummyFeedback = (analysisId: string, userId: string): PracticeFeedback[] => {
  const feedbacks: PracticeFeedback[] = [];
  const now = new Date();

  // 2つのダミーフィードバックを生成
  for (let i = 0; i < 2; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 10));
    
    feedbacks.push({
      id: `dummy_feedback_${i}`,
      analysisId,
      userId,
      presentationDate: date,
      audience: {
        size: 15 + Math.floor(Math.random() * 30),
        type: i === 0 ? 'client' : 'internal'
      },
      outcomes: {
        overallSuccess: (3 + Math.floor(Math.random() * 3)) as 3 | 4 | 5,
        audienceEngagement: (3 + Math.floor(Math.random() * 3)) as 3 | 4 | 5,
        clarityOfMessage: (3 + Math.floor(Math.random() * 3)) as 3 | 4 | 5,
        achievement: i === 0 ? '予算承認を獲得' : '次のフェーズへの移行が決定'
      },
      questionsReceived: [
        {
          question: '市場規模の根拠は？',
          category: 'data',
          wasAnticipated: true
        },
        {
          question: '競合との差別化ポイントは？',
          category: 'business',
          wasAnticipated: false
        }
      ],
      reflections: {
        whatWentWell: 'ストーリーの流れが分かりやすく、聴衆の関心を引けた',
        whatToImprove: '技術的な詳細説明が不足していた',
        keyLearnings: 'デモの実演が効果的だった'
      },
      createdAt: date as any
    });
  }

  return feedbacks;
};

// ダミーの成長データを生成
export const generateDummyGrowthData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 30; i >= 0; i -= 5) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
      totalScore: 70 + (30 - i) * 0.8 + Math.random() * 5,
      contentScore: 68 + (30 - i) * 0.7 + Math.random() * 5,
      designScore: 72 + (30 - i) * 0.9 + Math.random() * 5,
      persuasivenessScore: 69 + (30 - i) * 0.6 + Math.random() * 5,
      technicalScore: 71 + (30 - i) * 0.7 + Math.random() * 5,
      version: Math.floor(i / 7) + 1
    });
  }
  
  return data;
};