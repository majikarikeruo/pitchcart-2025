import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User,
  sendPasswordResetEmail,
  updateProfile,
  signInAnonymously
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Googleプロバイダーの設定
const googleProvider = new GoogleAuthProvider();

// ユーザー情報の型定義
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt: Date;
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    expiresAt?: Date;
  };
  usage: {
    analysisCount: number;
    lastAnalysisAt?: Date;
  };
}

export class AuthService {
  // Google認証
  async signInWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await this.createOrUpdateUserProfile(result.user);
      return result.user;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  // メールアドレスでのサインイン
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await this.updateLastLogin(result.user.uid);
      return result.user;
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    }
  }

  // メールアドレスでの新規登録
  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // 表示名を更新
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      await this.createOrUpdateUserProfile(result.user);
      return result.user;
    } catch (error) {
      console.error('Email sign up error:', error);
      throw error;
    }
  }

  // 匿名認証
  async signInAnonymously(): Promise<User> {
    try {
      const result = await signInAnonymously(auth);
      await this.createOrUpdateUserProfile(result.user, true);
      return result.user;
    } catch (error) {
      console.error('Anonymous sign in error:', error);
      throw error;
    }
  }

  // サインアウト
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // パスワードリセット
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // 認証状態の監視
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  // 現在のユーザーを取得
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // ユーザープロファイルの作成または更新
  private async createOrUpdateUserProfile(user: User, isAnonymous = false): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // 新規ユーザーの場合
      const userProfile: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp() as any,
        lastLoginAt: serverTimestamp() as any,
        subscription: {
          plan: isAnonymous ? 'free' : 'free',
          // 匿名ユーザーは7日間の試用期間
          ...(isAnonymous && { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
        },
        usage: {
          analysisCount: 0
        }
      };

      await setDoc(userRef, userProfile);
    } else {
      // 既存ユーザーの場合、最終ログイン時刻を更新
      await this.updateLastLogin(user.uid);
    }
  }

  // 最終ログイン時刻の更新
  private async updateLastLogin(uid: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      lastLoginAt: serverTimestamp()
    }, { merge: true });
  }

  // ユーザープロファイルの取得
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const authService = new AuthService();