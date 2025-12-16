import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "firebase/auth";
import { authService, UserProfile } from "../services/auth.service";
import { notifications } from "@mantine/notifications";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ユーザープロファイルの取得
  const fetchUserProfile = async (user: User) => {
    try {
      const profile = await authService.getUserProfile(user.uid);

      // プロファイルが取得できない場合（匿名ユーザーなど）はダミーデータを使用
      if (!profile && user.isAnonymous) {
        const dummyProfile: UserProfile = {
          uid: user.uid,
          email: user.email || "anonymous@example.com",
          displayName: user.displayName || "ゲストユーザー",
          photoURL: user.photoURL,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          subscription: {
            plan: "free",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          usage: {
            analysisCount: 3,
            lastAnalysisAt: new Date(),
          },
        };
        setUserProfile(dummyProfile);
      } else if (profile) {
        // Timestampオブジェクトを適切なDateオブジェクトに変換
        const convertedProfile: UserProfile = {
          ...profile,
          createdAt: profile.createdAt && "toDate" in profile.createdAt ? (profile.createdAt as any).toDate() : new Date(profile.createdAt as any),
          lastLoginAt: profile.lastLoginAt && "toDate" in profile.lastLoginAt ? (profile.lastLoginAt as any).toDate() : new Date(profile.lastLoginAt as any),
          subscription: profile.subscription
            ? {
                ...profile.subscription,
                expiresAt:
                  profile.subscription.expiresAt && "toDate" in profile.subscription.expiresAt
                    ? (profile.subscription.expiresAt as any).toDate()
                    : profile.subscription.expiresAt
                      ? new Date(profile.subscription.expiresAt)
                      : undefined,
              }
            : { plan: "free" },
          usage: profile.usage
            ? {
                ...profile.usage,
                lastAnalysisAt:
                  profile.usage.lastAnalysisAt && "toDate" in profile.usage.lastAnalysisAt
                    ? (profile.usage.lastAnalysisAt as any).toDate()
                    : profile.usage.lastAnalysisAt
                      ? new Date(profile.usage.lastAnalysisAt)
                      : undefined,
              }
            : { analysisCount: 0 },
        };
        setUserProfile(convertedProfile);
      } else {
        // Firestoreにプロフィールが無くても最低限の表示用データを合成
        const fallback: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email || 'ユーザー',
          photoURL: user.photoURL,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          subscription: { plan: 'free' },
          usage: { analysisCount: 0 },
        };
        setUserProfile(fallback);
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      // Firestore取得に失敗しても、最低限のプロフィールをセットしてUIを継続
      const fallback: UserProfile = {
        uid: user.uid,
        email: user.email || (user.isAnonymous ? 'anonymous@example.com' : null),
        displayName: user.displayName || (user.isAnonymous ? 'ゲストユーザー' : user.email || 'ユーザー'),
        photoURL: user.photoURL,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        subscription: user.isAnonymous
          ? { plan: 'free', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
          : { plan: 'free' },
        usage: { analysisCount: 0 },
      };
      setUserProfile(fallback);
    }
  };

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      setUser(user);
      setLoading(true);

      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Google認証
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const user = await authService.signInWithGoogle();
      await fetchUserProfile(user);
      notifications.show({
        title: "ログイン成功",
        message: "Googleアカウントでログインしました",
        color: "teal",
      });
    } catch (err) {
      setError(err as Error);
      notifications.show({
        title: "ログインエラー",
        message: "Googleログインに失敗しました",
        color: "red",
      });
      throw err;
    }
  };

  // メールアドレスでのサインイン
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      const user = await authService.signInWithEmail(email, password);
      await fetchUserProfile(user);
      notifications.show({
        title: "ログイン成功",
        message: "メールアドレスでログインしました",
        color: "teal",
      });
    } catch (err) {
      setError(err as Error);
      notifications.show({
        title: "ログインエラー",
        message: "メールアドレスまたはパスワードが正しくありません",
        color: "red",
      });
      throw err;
    }
  };

  // メールアドレスでの新規登録
  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      const user = await authService.signUpWithEmail(email, password, displayName);
      await fetchUserProfile(user);
      notifications.show({ title: "登録成功", message: "アカウントを作成しました", color: "teal" });
    } catch (err: any) {
      setError(err as Error);
      const code = err?.code || err?.message || "unknown";
      notifications.show({ title: "登録エラー", message: String(code), color: "red" });
      throw err;
    }
  };

  // 匿名認証
  const signInAnonymouslyHandler = async () => {
    try {
      setError(null);
      const user = await authService.signInAnonymously();
      await fetchUserProfile(user);
      notifications.show({
        title: "お試し利用開始",
        message: "7日間の無料お試し期間が開始されました",
        color: "teal",
      });
    } catch (err) {
      setError(err as Error);
      notifications.show({
        title: "エラー",
        message: "お試し利用の開始に失敗しました",
        color: "red",
      });
      throw err;
    }
  };

  // サインアウト
  const signOutHandler = async () => {
    try {
      setError(null);
      await authService.signOut();
      setUser(null);
      setUserProfile(null);
      notifications.show({
        title: "ログアウト",
        message: "ログアウトしました",
        color: "gray",
      });
    } catch (err) {
      setError(err as Error);
      notifications.show({
        title: "エラー",
        message: "ログアウトに失敗しました",
        color: "red",
      });
      throw err;
    }
  };

  // パスワードリセット
  const sendPasswordResetHandler = async (email: string) => {
    try {
      setError(null);
      await authService.sendPasswordReset(email);
      notifications.show({
        title: "送信完了",
        message: "パスワードリセットメールを送信しました",
        color: "teal",
      });
    } catch (err) {
      setError(err as Error);
      notifications.show({
        title: "エラー",
        message: "パスワードリセットメールの送信に失敗しました",
        color: "red",
      });
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAnonymously: signInAnonymouslyHandler,
    signOut: signOutHandler,
    sendPasswordReset: sendPasswordResetHandler,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
