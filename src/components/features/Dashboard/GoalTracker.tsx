import React, { useState } from "react";
import { Paper, Title, Stack, Group, Button, Progress, Text, Badge, Modal, TextInput, Textarea, Select, ActionIcon, Card, ThemeIcon } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconTarget, IconPlus, IconEdit, IconTrash, IconCalendar, IconTrendingUp } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

interface Goal {
  id: string;
  title: string;
  description: string;
  category: "score" | "skill" | "presentation" | "other";
  targetValue: number;
  currentValue: number;
  unit: string;
  dueDate: Date;
  createdAt: Date;
  completed: boolean;
}

const sampleGoals: Goal[] = [
  {
    id: "1",
    title: "総合スコア90点達成",
    description: "プレゼンテーションの総合スコアで90点以上を獲得する",
    category: "score",
    targetValue: 90,
    currentValue: 82,
    unit: "点",
    dueDate: new Date("2024-12-31"),
    createdAt: new Date("2024-08-01"),
    completed: false,
  },
  {
    id: "2",
    title: "月3回のプレゼン実施",
    description: "継続的な実践を通じてスキル向上を図る",
    category: "presentation",
    targetValue: 3,
    currentValue: 2,
    unit: "回",
    dueDate: new Date("2024-09-30"),
    createdAt: new Date("2024-08-01"),
    completed: false,
  },
  {
    id: "3",
    title: "想定外質問率20%以下",
    description: "質問対応力の向上により、想定外質問を20%以下に抑える",
    category: "skill",
    targetValue: 20,
    currentValue: 35,
    unit: "%",
    dueDate: new Date("2024-11-30"),
    createdAt: new Date("2024-08-01"),
    completed: false,
  },
];

export const GoalTracker: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>(sampleGoals);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const form = useForm<{
    title: string;
    description: string;
    category: "score" | "skill" | "presentation" | "other";
    targetValue: number;
    unit: string;
    dueDate: Date;
  }>({
    initialValues: {
      title: "",
      description: "",
      category: "score",
      targetValue: 0,
      unit: "点",
      dueDate: new Date(),
    },
  });

  const categoryOptions = [
    { value: "score", label: "スコア向上" },
    { value: "skill", label: "スキル習得" },
    { value: "presentation", label: "プレゼン回数" },
    { value: "other", label: "その他" },
  ];

  const getCategoryColor = (category: Goal["category"]) => {
    const colors = {
      score: "blue",
      skill: "teal",
      presentation: "orange",
      other: "gray",
    };
    return colors[category];
  };

  const getCategoryIcon = (category: Goal["category"]) => {
    const icons = {
      score: <IconTrendingUp size={16} />,
      skill: <IconTarget size={16} />,
      presentation: <IconCalendar size={16} />,
      other: <IconTarget size={16} />,
    };
    return icons[category];
  };

  const handleSubmit = (values: typeof form.values) => {
    const newGoal: Goal = {
      id: editingGoal?.id || Date.now().toString(),
      title: values.title,
      description: values.description,
      category: values.category,
      targetValue: values.targetValue,
      currentValue: editingGoal?.currentValue || 0,
      unit: values.unit,
      dueDate: values.dueDate,
      createdAt: editingGoal?.createdAt || new Date(),
      completed: false,
    };

    if (editingGoal) {
      setGoals(goals.map((g) => (g.id === editingGoal.id ? newGoal : g)));
      notifications.show({
        title: "更新完了",
        message: "目標を更新しました",
        color: "teal",
      });
    } else {
      setGoals([...goals, newGoal]);
      notifications.show({
        title: "追加完了",
        message: "新しい目標を追加しました",
        color: "teal",
      });
    }

    handleCloseModal();
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    form.setValues({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      targetValue: goal.targetValue,
      unit: goal.unit,
      dueDate: goal.dueDate,
    });
    setShowModal(true);
  };

  const handleDelete = (goalId: string) => {
    setGoals(goals.filter((g) => g.id !== goalId));
    notifications.show({
      title: "削除完了",
      message: "目標を削除しました",
      color: "red",
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGoal(null);
    form.reset();
  };

  const completedGoals = goals.filter((g) => g.completed).length;
  const totalGoals = goals.length;

  return (
    <Paper p="xl" withBorder>
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={4}>🎯 目標管理</Title>
            <Text size="sm" c="dimmed">
              {completedGoals}/{totalGoals} 目標達成
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setShowModal(true)} size="sm">
            目標を追加
          </Button>
        </Group>

        {/* 全体進捗 */}
        <Card p="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text fw={600} size="sm">
              全体進捗
            </Text>
            <Text size="sm" c="dimmed">
              {Math.round((completedGoals / totalGoals) * 100)}%
            </Text>
          </Group>
          <Progress value={(completedGoals / totalGoals) * 100} color="teal" size="lg" />
        </Card>

        {/* 目標一覧 */}
        <Stack gap="md">
          {goals.map((goal) => {
            const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
            const isOverdue = new Date() > goal.dueDate && !goal.completed;
            const isNearDue = (goal.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 7;

            return (
              <Card key={goal.id} p="md" withBorder>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <ThemeIcon size="sm" color={getCategoryColor(goal.category)} variant="light">
                        {getCategoryIcon(goal.category)}
                      </ThemeIcon>
                      <Text fw={600} size="sm">
                        {goal.title}
                      </Text>
                      <Badge size="xs" color={getCategoryColor(goal.category)} variant="light">
                        {categoryOptions.find((opt) => opt.value === goal.category)?.label}
                      </Badge>
                    </Group>

                    <Group gap="xs">
                      <ActionIcon size="sm" variant="light" onClick={() => handleEdit(goal)}>
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon size="sm" variant="light" color="red" onClick={() => handleDelete(goal.id)}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>

                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {goal.description}
                  </Text>

                  <Group justify="space-between" align="center">
                    <div style={{ flex: 1, marginRight: "16px" }}>
                      <Group justify="space-between" mb="xs">
                        <Text size="xs" c="dimmed">
                          {goal.currentValue}
                          {goal.unit} / {goal.targetValue}
                          {goal.unit}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {Math.round(progress)}%
                        </Text>
                      </Group>
                      <Progress value={progress} color={goal.completed ? "teal" : isOverdue ? "red" : isNearDue ? "orange" : "blue"} size="sm" />
                    </div>

                    <div style={{ textAlign: "right", minWidth: "80px" }}>
                      <Text size="xs" c="dimmed">
                        期限
                      </Text>
                      <Text size="xs" fw={600} c={isOverdue ? "red" : isNearDue ? "orange" : "dimmed"}>
                        {goal.dueDate.toLocaleDateString("ja-JP")}
                      </Text>
                    </div>
                  </Group>

                  {goal.completed && (
                    <Badge color="teal" variant="light" size="sm">
                      ✓ 達成済み
                    </Badge>
                  )}
                </Stack>
              </Card>
            );
          })}
        </Stack>

        {goals.length === 0 && (
          <Card p="xl" withBorder>
            <Stack align="center" gap="md">
              <ThemeIcon size={48} variant="light" color="gray">
                <IconTarget size={24} />
              </ThemeIcon>
              <Text c="dimmed" ta="center">
                まだ目標が設定されていません。
                <br />
                最初の目標を設定して、成長を記録しましょう。
              </Text>
            </Stack>
          </Card>
        )}

        {/* 目標追加・編集モーダル */}
        <Modal opened={showModal} onClose={handleCloseModal} title={editingGoal ? "目標を編集" : "新しい目標を追加"} size="md">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput label="目標タイトル" placeholder="例: 総合スコア90点達成" required {...form.getInputProps("title")} />

              <Textarea label="詳細説明" placeholder="目標の詳細な説明を入力..." minRows={3} {...form.getInputProps("description")} />

              <Group grow>
                <Select label="カテゴリ" data={categoryOptions} required {...form.getInputProps("category")} />

                <TextInput label="単位" placeholder="点、回、%など" required {...form.getInputProps("unit")} />
              </Group>

              <Group grow>
                <TextInput type="number" label="目標値" placeholder="90" required {...form.getInputProps("targetValue")} />

                <TextInput
                  type="date"
                  label="期限"
                  required
                  value={form.values.dueDate.toISOString().split("T")[0]}
                  onChange={(e) => form.setFieldValue("dueDate", new Date(e.target.value))}
                />
              </Group>

              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={handleCloseModal}>
                  キャンセル
                </Button>
                <Button type="submit">{editingGoal ? "更新" : "追加"}</Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </Paper>
  );
};
