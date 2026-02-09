import React, { useState, useEffect } from "react";
import { Paper, Title, Stack, Group, Button, Progress, Text, Badge, Modal, TextInput, Textarea, Select, ActionIcon, Card, ThemeIcon } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconTarget, IconPlus, IconEdit, IconTrash, IconCalendar, IconTrendingUp } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/contexts/AuthContext";

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

export const GoalTracker: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);

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

  // Firestoreから目標を読み込む
  useEffect(() => {
    if (!user) return;
    const loadGoals = async () => {
      try {
        const q = query(collection(db, "goals"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const loaded = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            dueDate: data.dueDate?.toDate?.() ?? new Date(data.dueDate),
            createdAt: data.createdAt?.toDate?.() ?? new Date(data.createdAt),
          } as Goal;
        });
        setGoals(loaded.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      } catch (e) {
        console.error("Failed to load goals:", e);
      }
    };
    loadGoals();
  }, [user]);

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

  const handleSubmit = async (values: typeof form.values) => {
    if (!user) return;
    setSaving(true);
    try {
      const goalId = editingGoal?.id || `goal_${Date.now()}`;
      const goalData: Goal = {
        id: goalId,
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

      await setDoc(doc(db, "goals", goalId), {
        ...goalData,
        userId: user.uid,
        updatedAt: serverTimestamp(),
      });

      if (editingGoal) {
        setGoals(goals.map((g) => (g.id === goalId ? goalData : g)));
        notifications.show({ title: "更新完了", message: "目標を更新しました", color: "teal" });
      } else {
        setGoals([goalData, ...goals]);
        notifications.show({ title: "追加完了", message: "新しい目標を追加しました", color: "teal" });
      }
      handleCloseModal();
    } catch (e) {
      console.error("Failed to save goal:", e);
      notifications.show({ title: "エラー", message: "目標の保存に失敗しました", color: "red" });
    } finally {
      setSaving(false);
    }
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

  const handleDelete = async (goalId: string) => {
    try {
      await deleteDoc(doc(db, "goals", goalId));
      setGoals(goals.filter((g) => g.id !== goalId));
      notifications.show({ title: "削除完了", message: "目標を削除しました", color: "red" });
    } catch (e) {
      console.error("Failed to delete goal:", e);
      notifications.show({ title: "エラー", message: "目標の削除に失敗しました", color: "red" });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGoal(null);
    form.reset();
  };

  const completedGoals = goals.filter((g) => g.completed).length;
  const totalGoals = goals.length;
  const progressPct = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

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
          <Button leftSection={<IconPlus size={16} />} onClick={() => setShowModal(true)} size="sm" disabled={!user}>
            目標を追加
          </Button>
        </Group>

        {/* 全体進捗 */}
        <Card p="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text fw={600} size="sm">
              全体進捗
            </Text>
            <Text size="sm" c="dimmed">{Math.round(progressPct)}%</Text>
          </Group>
          <Progress value={progressPct} color="teal" size="lg" />
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
                <Button type="submit" loading={saving}>{editingGoal ? "更新" : "追加"}</Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </Paper>
  );
};
