import React, { useState } from 'react';
import { Container, Center } from '@mantine/core';
import { LoginForm } from '../components/auth/LoginForm';
import { SignUpForm } from '../components/auth/SignUpForm';

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <Container size={420} my={40}>
      <Center h="100vh">
        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <SignUpForm onToggleMode={() => setIsLogin(true)} />
        )}
      </Center>
    </Container>
  );
};