import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AnalysisResponse } from '@/types/analysis';

// 分析結果の履歴データ型
export interface AnalysisHistory {
  id: string;
  userId: string;
  presentationId: string;
  presentationTitle: string;
  version: number;
  analysisData: AnalysisResponse;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata: {
    slideCount: number;
    totalScore: number;
    categoryScores: {
      content: number;
      design: number;
      persuasiveness: number;
      technicalQuality: number;
    };
    tags?: string[];
    notes?: string;
  };
  comparison?: {
    previousVersionId: string;
    scoreImprovement: number;
    improvedAreas: string[];
    newIssues: string[];
  };
}

// 実践フィードバックデータ型
export interface PracticeFeedback {
  id: string;
  analysisId: string;
  userId: string;
  presentationDate: Date;
  audience: {
    size: number;
    type: string; // 'internal', 'client', 'investor', 'conference', etc.
  };
  outcomes: {
    overallSuccess: 1 | 2 | 3 | 4 | 5; // 5段階評価
    audienceEngagement: 1 | 2 | 3 | 4 | 5;
    clarityOfMessage: 1 | 2 | 3 | 4 | 5;
    achievement: string; // 達成した成果
  };
  questionsReceived: {
    question: string;
    category: string;
    wasAnticipated: boolean;
  }[];
  reflections: {
    whatWentWell: string;
    whatToImprove: string;
    keyLearnings: string;
  };
  createdAt: Timestamp;
}

export class AnalysisService {
  // 新規分析結果の保存
  async saveAnalysis(
    userId: string,
    presentationId: string,
    presentationTitle: string,
    analysisData: AnalysisResponse
  ): Promise<string> {
    try {
      // 既存のバージョンを取得して次のバージョン番号を決定
      const previousVersions = await this.getAnalysisHistory(userId, presentationId);
      const nextVersion = previousVersions.length > 0 
        ? Math.max(...previousVersions.map(v => v.version)) + 1 
        : 1;

      // 分析IDの生成
      const analysisId = `${presentationId}_v${nextVersion}_${Date.now()}`;
      
      // スコアの計算 (新しいデータ構造に合わせて修正が必要)
      const scores = this.calculateScores(analysisData);
      
      // 比較データの生成（前バージョンがある場合）
      let comparisonData;
      if (previousVersions.length > 0) {
        const previousVersion = previousVersions[previousVersions.length - 1];
        comparisonData = this.generateComparison(analysisData, previousVersion);
      }

      const analysisHistory: AnalysisHistory = {
        id: analysisId,
        userId,
        presentationId,
        presentationTitle,
        version: nextVersion,
        analysisData,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        metadata: {
          slideCount: analysisData.slides_struct?.length || 0,
          totalScore: scores.total,
          categoryScores: scores.categories
        },
        ...(comparisonData && { comparison: comparisonData })
      };

      // Firestoreに保存
      await setDoc(doc(db, 'analysisHistory', analysisId), analysisHistory);
      
      // ユーザーの使用回数を更新
      await this.updateUserUsage(userId);
      
      return analysisId;
    } catch (error) {
      console.error('Save analysis error:', error);
      throw error;
    }
  }

  // 分析履歴の取得（プレゼンテーション別）
  async getAnalysisHistory(
    userId: string,
    presentationId?: string
  ): Promise<AnalysisHistory[]> {
    try {
      let q;
      if (presentationId) {
        // インデックスエラーを回避するため、一旦orderByを削除
        q = query(
          collection(db, 'analysisHistory'),
          where('userId', '==', userId),
          where('presentationId', '==', presentationId)
        );
      } else {
        // インデックスエラーを回避するため、一旦orderByを削除
        q = query(
          collection(db, 'analysisHistory'),
          where('userId', '==', userId),
          limit(50)
        );
      }

      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as AnalysisHistory));
      
      // クライアント側でソート
      return results.sort((a, b) => {
        if (presentationId) {
          return b.version - a.version;
        } else {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        }
      });
    } catch (error) {
      console.error('Get analysis history error:', error);
      // エラーをスローしない（空配列を返す）
      return [];
    }
  }

  // 特定の分析結果を取得
  async getAnalysis(analysisId: string): Promise<AnalysisHistory | null> {
    try {
      const docRef = doc(db, 'analysisHistory', analysisId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          ...docSnap.data(),
          id: docSnap.id
        } as AnalysisHistory;
      }
      
      return null;
    } catch (error) {
      console.error('Get analysis error:', error);
      throw error;
    }
  }

  // 実践フィードバックの保存
  async saveFeedback(feedback: Omit<PracticeFeedback, 'id' | 'createdAt'>): Promise<string> {
    try {
      const feedbackId = `feedback_${Date.now()}`;
      const feedbackData: PracticeFeedback = {
        ...feedback,
        id: feedbackId,
        createdAt: serverTimestamp() as Timestamp
      };

      await setDoc(doc(db, 'practiceFeedback', feedbackId), feedbackData);
      return feedbackId;
    } catch (error) {
      console.error('Save feedback error:', error);
      throw error;
    }
  }

  // 実践フィードバックの取得
  async getFeedback(analysisId: string): Promise<PracticeFeedback[]> {
    try {
      // インデックスエラーを回避
      const q = query(
        collection(db, 'practiceFeedback'),
        where('analysisId', '==', analysisId)
      );

      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as PracticeFeedback));
      
      // クライアント側でソート
      return results.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Get feedback error:', error);
      // エラーでも空配列を返す
      return [];
    }
  }

  // スコア計算ヘルパー
  private calculateScores(analysisData: AnalysisResponse) {
    // 新しいAnalysisResponseの構造からスコアを計算するロジック
    // consensus.overall_score を利用する
    const total = analysisData.consensus.overall_score;

    // カテゴリ別スコアは、各ペルソナの平均値とする
    const categoryScores = {
      clarity: 0,
      uniqueness: 0,
      persuasiveness: 0,
    };

    if (analysisData.personas.length > 0) {
      const numPersonas = analysisData.personas.length;
      analysisData.personas.forEach(p => {
        categoryScores.clarity += p.scores.clarity;
        categoryScores.uniqueness += p.scores.uniqueness;
        categoryScores.persuasiveness += p.scores.persuasiveness;
      });
      categoryScores.clarity /= numPersonas;
      categoryScores.uniqueness /= numPersonas;
      categoryScores.persuasiveness /= numPersonas;
    }
    
    // 従来のカテゴリにマッピングする（仮）
    return {
      total,
      categories: {
        content: categoryScores.clarity,
        design: categoryScores.uniqueness, // 仮のマッピング
        persuasiveness: categoryScores.persuasiveness,
        technicalQuality: 50 // 仮の値
      }
    };
  }

  // バージョン比較データの生成
  private generateComparison(
    currentData: AnalysisResponse,
    previousVersion: AnalysisHistory
  ) {
    const currentScores = this.calculateScores(currentData);
    const previousScores = previousVersion.metadata.categoryScores;
    
    const scoreImprovement = currentScores.total - previousVersion.metadata.totalScore;
    
    // 改善された領域と新しい問題を特定
    const improvedAreas: string[] = [];
    const newIssues: string[] = [];
    
    // カテゴリごとのスコア比較
    Object.entries(currentScores.categories).forEach(([category, score]) => {
      const prevScore = previousScores[category as keyof typeof previousScores];
      if (score > prevScore) {
        improvedAreas.push(`${category}のスコアが${score - prevScore}点向上`);
      } else if (score < prevScore) {
        newIssues.push(`${category}のスコアが${prevScore - score}点低下`);
      }
    });

    return {
      previousVersionId: previousVersion.id,
      scoreImprovement,
      improvedAreas,
      newIssues
    };
  }

  // ユーザーの使用回数を更新
  private async updateUserUsage(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'usage.analysisCount': serverTimestamp(),
      'usage.lastAnalysisAt': serverTimestamp()
    });
  }
}

// シングルトンインスタンスをエクスポート
export const analysisService = new AnalysisService();