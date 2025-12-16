import React from "react";
import { Link } from "react-router-dom";
import { AppShell, Container, Group, Burger, Text } from "@mantine/core";
import { useAuth } from "@/contexts/AuthContext";
import { LeftNav } from "@/components/layout/LeftNav";

type Props = { children: React.ReactNode };

export function AppLayout({ children }: Props) {
  // ヘッダーはブランド＋メニューボタンのみ。ナビ/ログインは左メニューに集約。
  useAuth();
  const [opened, setOpened] = React.useState(false);

  // const handleSignOut = async () => {
  //   await signOut();
  //   navigate("/login");
  // };

  return (
    <AppShell
      header={{ height: 56 }}
      padding="md"
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened, desktop: !opened } }}
      styles={{
        main: {
          backgroundColor: "var(--mantine-color-gray-0)",
          minHeight: "100vh",
        },
      }}
    >
      <AppShell.Header>
        <Container size="lg" style={{ height: "100%" }}>
          <Group justify="space-between" align="center" h="100%">
            <Group gap="md" align="center">
              <Burger opened={opened} onClick={() => setOpened((o) => !o)} aria-label="メニューを開く" />
              <Text component={Link} to="/" fw={700} c="dark" style={{ textDecoration: "none" }}>
                PitchCart
              </Text>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      {/* 左メニュー（デスクトップ/モバイルともにトグル表示） */}
      <AppShell.Navbar p="md" withBorder>
        <LeftNav />
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="lg">{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
}
