import React, { useState } from 'react';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Title,
  Text,
  Anchor,
  LoadingOverlay
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SignUpFormProps {
  onToggleMode: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onToggleMode }) => {
  const navigate = useNavigate();
  const { signUpWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validate: {
      name: (value) => (value.length >= 2 ? null : '名前は2文字以上必要です'),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'メールアドレスが無効です'),
      password: (value) => (value.length >= 6 ? null : 'パスワードは6文字以上必要です'),
      confirmPassword: (value, values) =>
        value === values.password ? null : 'パスワードが一致しません'
    }
  });

  const handleSignUp = async (values: typeof form.values) => {
    try {
      setLoading(true);
      await signUpWithEmail(values.email, values.password, values.name);
      navigate('/');
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper radius="md" p="xl" withBorder pos="relative">
      <LoadingOverlay visible={loading} />
      
      <Title order={2} size="h3" ta="center" mb="md">
        アカウント作成
      </Title>

      <form onSubmit={form.onSubmit(handleSignUp)}>
        <Stack>
          <TextInput
            label="お名前"
            placeholder="山田太郎"
            required
            {...form.getInputProps('name')}
          />

          <TextInput
            label="メールアドレス"
            placeholder="your@email.com"
            required
            {...form.getInputProps('email')}
          />

          <PasswordInput
            label="パスワード"
            placeholder="6文字以上"
            required
            {...form.getInputProps('password')}
          />

          <PasswordInput
            label="パスワード（確認）"
            placeholder="パスワードを再入力"
            required
            {...form.getInputProps('confirmPassword')}
          />

          <Button type="submit" fullWidth mt="md">
            アカウント作成
          </Button>
        </Stack>
      </form>

      <Text ta="center" mt="md">
        すでにアカウントをお持ちの方は{' '}
        <Anchor component="button" type="button" onClick={onToggleMode}>
          ログイン
        </Anchor>
      </Text>
    </Paper>
  );
};