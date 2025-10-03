import React, { useState } from 'react';
import {
  Paper,
  Title,
  Stack,
  Text,
  Badge,
  Group,
  ActionIcon,
  Card,
  Button
} from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconCalendar, IconPlus } from '@tabler/icons-react';

// サンプルデータ
const sampleEvents = [
  {
    date: new Date('2024-08-25'),
    title: '四半期レビュー',
    type: 'internal' as const,
    audience: 15,
    completed: false
  },
  {
    date: new Date('2024-08-28'),
    title: 'クライアント提案',
    type: 'client' as const,
    audience: 8,
    completed: false
  },
  {
    date: new Date('2024-08-15'),
    title: '新機能発表',
    type: 'conference' as const,
    audience: 50,
    completed: true
  }
];

export const PresentationCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events] = useState(sampleEvents);

  const getMonthData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return { days, firstDay, lastDay };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getEventForDate = (date: Date) => {
    return events.find(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const getTypeColor = (type: string) => {
    const colors = {
      internal: 'blue',
      client: 'teal',
      investor: 'orange',
      conference: 'purple',
      academic: 'cyan'
    };
    return colors[type as keyof typeof colors] || 'gray';
  };

  const { days, firstDay, lastDay } = getMonthData();
  const monthName = currentDate.toLocaleDateString('ja-JP', { 
    year: 'numeric', 
    month: 'long' 
  });

  const upcomingEvents = events
    .filter(event => event.date >= new Date() && !event.completed)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  return (
    <Paper p="lg" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={4}>📅 プレゼンカレンダー</Title>
          <Button size="xs" variant="light" leftSection={<IconPlus size={14} />}>
            追加
          </Button>
        </Group>

        {/* カレンダーヘッダー */}
        <Group justify="space-between">
          <ActionIcon 
            variant="light" 
            onClick={() => navigateMonth('prev')}
          >
            <IconChevronLeft size={16} />
          </ActionIcon>
          
          <Text fw={600}>{monthName}</Text>
          
          <ActionIcon 
            variant="light" 
            onClick={() => navigateMonth('next')}
          >
            <IconChevronRight size={16} />
          </ActionIcon>
        </Group>

        {/* 曜日ヘッダー */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '4px',
          textAlign: 'center'
        }}>
          {['日', '月', '火', '水', '木', '金', '土'].map(day => (
            <Text key={day} size="xs" c="dimmed" fw={600}>
              {day}
            </Text>
          ))}
        </div>

        {/* カレンダーグリッド */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '4px'
        }}>
          {days.map((date, index) => {
            const isCurrentMonth = date >= firstDay && date <= lastDay;
            const isToday = date.toDateString() === new Date().toDateString();
            const event = getEventForDate(date);

            return (
              <div
                key={index}
                style={{
                  minHeight: '32px',
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: isToday ? '#e7f5ff' : 'transparent',
                  border: isToday ? '1px solid #339af0' : '1px solid transparent',
                  position: 'relative',
                  cursor: event ? 'pointer' : 'default'
                }}
              >
                <Text
                  size="xs"
                  c={isCurrentMonth ? undefined : 'dimmed'}
                  fw={isToday ? 700 : undefined}
                >
                  {date.getDate()}
                </Text>
                
                {event && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      left: '2px',
                      right: '2px'
                    }}
                  >
                    <div
                      style={{
                        height: '4px',
                        backgroundColor: event.completed ? '#51cf66' : '#339af0',
                        borderRadius: '2px',
                        opacity: event.completed ? 0.6 : 1
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 予定リスト */}
        <div>
          <Text fw={600} size="sm" mb="xs">📋 今後の予定</Text>
          <Stack gap="xs">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, index) => (
                <Card key={index} p="xs" withBorder>
                  <Group justify="space-between" align="center">
                    <div>
                      <Text size="sm" fw={500}>{event.title}</Text>
                      <Group gap="xs">
                        <Text size="xs" c="dimmed">
                          {event.date.toLocaleDateString('ja-JP')}
                        </Text>
                        <Badge size="xs" color={getTypeColor(event.type)} variant="light">
                          {event.audience}名
                        </Badge>
                      </Group>
                    </div>
                    <ActionIcon size="sm" variant="light">
                      <IconCalendar size={14} />
                    </ActionIcon>
                  </Group>
                </Card>
              ))
            ) : (
              <Text size="sm" c="dimmed" ta="center">
                予定されているプレゼンはありません
              </Text>
            )}
          </Stack>
        </div>

        {/* 統計サマリー */}
        <Group justify="space-around">
          <div style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed">今月の予定</Text>
            <Text fw={700} size="lg">
              {events.filter(e => 
                e.date.getMonth() === currentDate.getMonth() &&
                e.date.getFullYear() === currentDate.getFullYear()
              ).length}
            </Text>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed">完了済み</Text>
            <Text fw={700} size="lg" c="teal">
              {events.filter(e => 
                e.completed &&
                e.date.getMonth() === currentDate.getMonth() &&
                e.date.getFullYear() === currentDate.getFullYear()
              ).length}
            </Text>
          </div>
        </Group>
      </Stack>
    </Paper>
  );
};