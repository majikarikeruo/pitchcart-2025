import { Button, Group, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <Stack p="lg" gap="md">
      <Title order={2}>Pitch Cart</Title>
      <Text c="dimmed">デモ: 合議分析API（MVP）に接続しました。</Text>
      <Group>
        <Button component={Link} to="/entry">プレゼンチェックへ</Button>
        <Button component={Link} to="/dashboard" variant="light">ダッシュボード</Button>
      </Group>
    </Stack>
  );
}
