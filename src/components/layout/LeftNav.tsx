import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Box, Stack, NavLink, Button, Group, Avatar, Text, Divider } from "@mantine/core";
import { useAuth } from "@/contexts/AuthContext";
import { NAV_ITEMS } from "@/config/navigation";

export function LeftNav() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter((i) => {
    if (!i.visibility || i.visibility === 'any') return true;
    if (i.visibility === 'auth') return !!user;
    if (i.visibility === 'guest') return !user;
    return true;
  });

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Stack gap={4}>
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            component={Link}
            to={item.to}
            label={item.label}
            active={location.pathname === item.to}
            variant="filled"
          />
        ))}
      </Stack>

      <Box style={{ flex: 1 }} />

      <Divider my="xs" />
      {user ? (
        <Group justify="space-between">
          <Group gap="xs">
            <Avatar radius="xl" size={24} src={user.photoURL || undefined}>
              {(user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
            </Avatar>
            <Text size="sm" c="dimmed" lineClamp={1}>
              {user.displayName || user.email || 'アカウント'}
            </Text>
          </Group>
          <Button size="compact-sm" variant="light" color="red" onClick={async () => { await signOut(); navigate('/login'); }}>
            ログアウト
          </Button>
        </Group>
      ) : (
        <Button component={Link} to="/login" fullWidth>
          ログイン
        </Button>
      )}
    </Box>
  );
}

