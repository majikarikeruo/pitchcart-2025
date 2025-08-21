import React, { useState } from 'react';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Title,
  Text,
  Divider,
  Anchor,
  Group,
  LoadingOverlay,
  Box
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconBrandGoogle, IconUser } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, signInAnonymously, sendPasswordReset } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: ''
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'メールアドレスが無効です'),
      password: (value) => (value.length >= 6 ? null : 'パスワードは6文字以上必要です')
    }
  });

  const resetForm = useForm({
    initialValues: {
      resetEmail: ''
    },
    validate: {
      resetEmail: (value) => (/^\S+@\S+$/.test(value) ? null : 'メールアドレスが無効です')
    }
  });

  const handleEmailLogin = async (values: typeof form.values) => {
    try {
      setLoading(true);
      await signInWithEmail(values.email, values.password);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      setLoading(true);
      await signInAnonymously();
      navigate('/');
    } catch (error) {
      console.error('Anonymous login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (values: typeof resetForm.values) => {
    try {
      setLoading(true);
      await sendPasswordReset(values.resetEmail);
      setShowResetPassword(false);
      resetForm.reset();
    } catch (error) {
      console.error('Password reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} size="h3" ta="center" mb="md">
          パスワードリセット
        </Title>

        <form onSubmit={resetForm.onSubmit(handlePasswordReset)}>
          <Stack>
            <TextInput
              label="メールアドレス"
              placeholder="your@email.com"
              required
              {...resetForm.getInputProps('resetEmail')}
            />

            <Group justify="space-between" mt="lg">
              <Anchor
                component="button"
                type="button"
                c="dimmed"
                onClick={() => setShowResetPassword(false)}
                size="sm"
              >
                ログインに戻る
              </Anchor>
              <Button type="submit" loading={loading}>
                リセットメールを送信
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    );
  }

  return (
    <Paper radius="md" p="xl" withBorder pos="relative">
      <LoadingOverlay visible={loading} />
      
      <Title order={2} size="h3" ta="center" mb="md">
        PitchCartへようこそ
      </Title>

      <Text c="dimmed" size="sm" ta="center" mb="lg">
        プレゼンテーションを次のレベルへ
      </Text>

      <form onSubmit={form.onSubmit(handleEmailLogin)}>
        <Stack>
          <TextInput
            label="メールアドレス"
            placeholder="your@email.com"
            required
            {...form.getInputProps('email')}
          />

          <PasswordInput
            label="パスワード"
            placeholder="パスワード"
            required
            {...form.getInputProps('password')}
          />

          <Group justify="space-between" mt="sm">
            <Anchor
              component="button"
              type="button"
              c="dimmed"
              onClick={() => setShowResetPassword(true)}
              size="sm"
            >
              パスワードを忘れた方
            </Anchor>
          </Group>

          <Button type="submit" fullWidth mt="md">
            ログイン
          </Button>
        </Stack>
      </form>

      <Divider label="または" labelPosition="center" my="lg" />

      <Stack>
        <Button
          variant="default"
          fullWidth
          leftSection={<IconBrandGoogle size={20} />}
          onClick={handleGoogleLogin}
        >
          Googleでログイン
        </Button>

        <Button
          variant="light"
          fullWidth
          leftSection={<IconUser size={20} />}
          onClick={handleAnonymousLogin}
        >
          お試しで始める（7日間無料）
        </Button>
      </Stack>

      <Text ta="center" mt="md">
        アカウントをお持ちでない方は{' '}
        <Anchor component="button" type="button" onClick={onToggleMode}>
          新規登録
        </Anchor>
      </Text>
    </Paper>
  );
};