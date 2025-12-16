import { Link, useLocation } from "react-router-dom";
import { Stack, NavLink, ThemeIcon, Group, Divider, Button } from "@mantine/core";
import { IconHome, IconPresentation, IconHistory, IconBulb, IconLogout } from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";

export function LeftNav() {
  const location = useLocation();
  const { signOut } = useAuth();

  const links = [
    { icon: IconHome, label: "ホーム", to: "/" },
    { icon: IconPresentation, label: "分析", to: "/analysis" },
    { icon: IconHistory, label: "履歴", to: "/history" },
    { icon: IconBulb, label: "実践", to: "/practice" },
  ];

  return (
    <Stack gap="xs" h="100%">
      {links.map((link) => (
        <NavLink
          key={link.to}
          component={Link}
          to={link.to}
          label={link.label}
          leftSection={
            <ThemeIcon variant="light" size="sm" color={location.pathname === link.to ? "blue" : "gray"}>
              <link.icon size="1rem" />
            </ThemeIcon>
          }
          active={location.pathname === link.to}
          variant="light"
        />
      ))}

      <div style={{ flex: 1 }} />
      <Divider />

      <Group justify="center" p="xs">
        <Button 
          variant="subtle" 
          color="gray" 
          size="sm" 
          fullWidth 
          leftSection={<IconLogout size="1rem" />}
          onClick={() => signOut()}
        >
          ログアウト
        </Button>
      </Group>
    </Stack>
  );
}
