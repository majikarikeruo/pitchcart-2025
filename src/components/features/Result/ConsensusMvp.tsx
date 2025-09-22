import { Card, Group, Text, Badge, Divider, List, Grid, Button, Modal, LoadingOverlay, Stepper, Stack, Title, Avatar, Tabs, ThemeIcon, rem, Paper } from '@mantine/core';
import type { AnalysisResponse, StructureSimulation, EmotionalArc } from '@/types/analysis';
import { useState, useEffect } from 'react';
import { IconPoint, IconBulb, IconTargetArrow } from '@tabler/icons-react';
import { API_BASE } from '@/services/analyze';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const personaDetails: { [key: string]: { name: string; color: string } } = {
  vc_seed: { name: 'シードVC', color: 'blue' },
  accelerator_judge: { name: 'アクセラレーター審査員', color: 'grape' },
  early_user: { name: 'アーリーユーザー', color: 'orange' },
};

export function ConsensusMvp({ data }: { data: AnalysisResponse }) {
  const c = data.consensus;
  const [simulation, setSimulation] = useState<StructureSimulation | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emotionalArc, setEmotionalArc] = useState<EmotionalArc | null>(null);
  const [loadingArc, setLoadingArc] = useState(true);
  const [arcError, setArcError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmotionalArc = async () => {
      try {
        setLoadingArc(true);
        setArcError(null);
        const res = await fetch(`${API_BASE}/analyze/emotional_arc`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slides_struct: data.slides_struct }),
        });
        if (!res.ok) {
          throw new Error('感情アーク分析に失敗しました。');
        }
        const arcData = await res.json();
        setEmotionalArc(arcData);
      } catch (e: any) {
        setArcError(e.message);
      } finally {
        setLoadingArc(false);
      }
    };
    if (data.slides_struct) {
      fetchEmotionalArc();
    } else {
      setLoadingArc(false);
      setArcError('分析のためのスライド構造データがありません。');
    }
  }, [data.slides_struct]);


  const handleSimulate = async () => {
    setSimulating(true);
    setError(null);
    try {
      const slidesStruct = data.slides_struct;
      if (!slidesStruct) {
        throw new Error('スライド構造データが見つかりません。');
      }

      const res = await fetch(`${API_BASE}/simulate/structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides_struct: slidesStruct }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'シミュレーションに失敗しました。');
      }
      const result = await res.json();
      setSimulation(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <>
      <Modal opened={!!simulation || !!error} onClose={() => { setSimulation(null); setError(null); }} title="構成シミュレーション結果 (PREP法)" size="xl" centered>
        {simulation && (
          <Stepper active={simulation.steps.length} orientation="vertical">
            {simulation.steps.map((step, i) => (
              <Stepper.Step
                key={i}
                label={<Text fw={600}>{step.title}</Text>}
                description={
                  <Card withBorder p="sm" mt="xs">
                    <Text size="sm">{step.description}</Text>
                    <Text size="xs" c="dimmed" mt={4}>対象スライド: {step.slide_indices.join(', ')}</Text>
                  </Card>
                }
              />
            ))}
          </Stepper>
        )}
        {error && <Text c="red">{error}</Text>}
        <Group justify="flex-end" mt="xl">
          <Button onClick={() => { setSimulation(null); setError(null); }} >閉じる</Button>
        </Group>
      </Modal>

      <Stack>
        <Card withBorder radius="md" shadow="sm" p="lg">
          <LoadingOverlay visible={simulating} />
          <Group justify="space-between" mb="xs">
            <Title order={2}>合議サマリー</Title>
            <Badge color="dark" size="lg">総合スコア: {c.overall_score}</Badge>
          </Group>
          <Text c="dimmed" mb="lg">各ペルソナの意見を集約した、プレゼンテーションの全体評価です。</Text>

          <Grid grow gutter="lg">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={4} mb="sm">👍 一致した評価点</Title>
              <List
                spacing="xs"
                size="sm"
                center
                icon={
                  <ThemeIcon color="teal" size={24} radius="xl">
                    <IconPoint style={{ width: rem(16), height: rem(16) }} />
                  </ThemeIcon>
                }
              >
                {c.agreements.map((t, i) => <List.Item key={i}>{t}</List.Item>)}
              </List>
            </Grid.Col>
            {c.disagreements?.length ? (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Title order={4} mb="sm">🤔 意見が割れた点</Title>
                <List
                  spacing="xs"
                  size="sm"
                  center
                  icon={
                    <ThemeIcon color="yellow" size={24} radius="xl">
                      <IconBulb style={{ width: rem(16), height: rem(16) }} />
                    </ThemeIcon>
                  }
                >
                  {c.disagreements.map((t, i) => <List.Item key={i}>{t}</List.Item>)}
                </List>
              </Grid.Col>
            ) : null}
            <Grid.Col span={12}>
              <Title order={4} mb="sm">🚀 最優先TODO</Title>
              <List
                spacing="xs"
                size="sm"
                center
                icon={
                  <ThemeIcon color="blue" size={24} radius="xl">
                    <IconTargetArrow style={{ width: rem(16), height: rem(16) }} />
                  </ThemeIcon>
                }
              >
                {c.top_todos.map((t, i) => <List.Item key={i}>{t}</List.Item>)}
              </List>
            </Grid.Col>
          </Grid>
          <Group justify="center" mt="lg">
            <Button onClick={handleSimulate} my="sm" size="sm" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
              構成案をシミュレーションする (PREP法)
            </Button>
          </Group>
        </Card>

        <Card withBorder radius="md" shadow="sm" p="lg">
          <Title order={3} mb="md">感情アーク分析</Title>
          <LoadingOverlay visible={loadingArc} />
          {arcError && <Text c="red">{arcError}</Text>}
          {emotionalArc && (
            <>
              <Text size="sm" c="dimmed">{emotionalArc.summary}</Text>
              <Paper withBorder radius="md" p="md" mt="md" style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={emotionalArc.points}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="slide" label={{ value: 'スライド番号', position: 'insideBottom', offset: -5 }} />
                    <YAxis domain={[0, 1]} label={{ value: '感情の強度', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <Paper shadow="md" p="sm" withBorder radius="md">
                              <Text fw={600}>スライド {label}</Text>
                              <Text size="sm">感情: {data.emotion} ({data.intensity})</Text>
                              <Text size="xs" mt={4}>{data.reason ?? data.comment}</Text>
                            </Paper>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="intensity" name="感情の強度" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </>
          )}
        </Card>

        <Title order={3} mt="lg">ペルソナ別評価</Title>
        {data.personas.map((p) => {
          const details = personaDetails[p.persona_id] || { name: p.persona_id, color: 'gray' };
          return (
            <Card key={p.persona_id} withBorder radius="md" shadow="sm" p="lg">
              <Group>
                <Avatar color={details.color} radius="xl">{details.name.substring(0, 2)}</Avatar>
                <div>
                  <Title order={4}>{details.name}</Title>
                  <Text size="sm" c="dimmed">からのフィードバック</Text>
                </div>
              </Group>
              <Group gap="xs" mt="md" mb="xs">
                <Badge size="lg" color="blue">明瞭性: {p.scores.clarity}</Badge>
                <Badge size="lg" color="grape">独自性: {p.scores.uniqueness}</Badge>
                <Badge size="lg" color="green">説得力: {p.scores.persuasiveness}</Badge>
              </Group>
              <Tabs defaultValue="summary" mt="md">
                <Tabs.List>
                  <Tabs.Tab value="summary">総評</Tabs.Tab>
                  <Tabs.Tab value="slides">スライド別評価</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="summary" pt="xs">
                  <Title order={5} mt="sm">サマリー</Title>
                  <Text size="sm" mt="xs">{p.summary}</Text>
                  <Divider my="md" />
                  <Title order={5}>コメント</Title>
                  <Text size="sm" mt="xs">{p.comment}</Text>
                  {p.evidence?.length ? (
                    <>
                      <Title order={6} mt="md" mb="xs">注目したスライド</Title>
                      <List size="sm" withPadding>
                        {p.evidence.map((e, i) => (
                          <List.Item key={i}>
                            <Text span>slide {e.slide ?? '-'}:</Text> <Text span c="dimmed">"{e.quote ?? ''}"</Text>
                          </List.Item>
                        ))}
                      </List>
                    </>
                  ) : null}
                </Tabs.Panel>

                <Tabs.Panel value="slides" pt="xs">
                  {p.slide_evaluations && p.slide_evaluations.length > 0 ? (
                    <Stack gap="md" mt="sm">
                      {p.slide_evaluations.map((e, i) => (
                        <Card key={i} withBorder p="sm" radius="md">
                          <Text fw={600} size="sm">Slide {e.slide}:</Text>
                          <Text size="sm" mt={4}>{e.comment}</Text>
                        </Card>
                      ))}
                    </Stack>
                  ) : (
                    <Text size="sm" c="dimmed" mt="md">このペルソナからのスライド個別評価はありません。</Text>
                  )}
                </Tabs.Panel>
              </Tabs>
            </Card>
          );
        })}
      </Stack>
    </>
  );
}
