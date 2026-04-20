import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Stack,
  Title,
  Text,
  Group,
  Skeleton,
  Alert,
  Switch,
  Card,
  ActionIcon,
  TextInput,
  Menu,
} from '@mantine/core';
import { IconAlertCircle, IconPlus, IconTrash, IconCopy } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Layout } from '../components/Layout';
import { scheduleApi, ApiError } from '../api';
import type { WeeklySchedule, TimeBlock } from '../api/types';

const DAYS = [
  { key: 'monday', label: 'Понедельник' },
  { key: 'tuesday', label: 'Вторник' },
  { key: 'wednesday', label: 'Среда' },
  { key: 'thursday', label: 'Четверг' },
  { key: 'friday', label: 'Пятница' },
  { key: 'saturday', label: 'Суббота' },
  { key: 'sunday', label: 'Воскресенье' },
] as const;

type DayKey = typeof DAYS[number]['key'];

const defaultSchedule: WeeklySchedule = {
  weekdays: {
    monday: { enabled: false, blocks: [] },
    tuesday: { enabled: false, blocks: [] },
    wednesday: { enabled: false, blocks: [] },
    thursday: { enabled: false, blocks: [] },
    friday: { enabled: false, blocks: [] },
    saturday: { enabled: false, blocks: [] },
    sunday: { enabled: false, blocks: [] },
  },
};

function isValidTimeFormat(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5][05]$/.test(time);
}

function formatTimeDisplay(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const m = minutes;
  const ampm = h >= 12 ? 'pm' : 'am';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m}${ampm}`;
}

export function Schedule() {
  const [schedule, setSchedule] = useState<WeeklySchedule>(defaultSchedule);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await scheduleApi.get();
      setSchedule(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Schedule not found, use default
        setSchedule(defaultSchedule);
      } else {
        const message = err instanceof ApiError ? err.message : 'Не удалось загрузить расписание';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleToggleDay = (day: DayKey, enabled: boolean) => {
    setSchedule(prev => ({
      ...prev,
      weekdays: {
        ...prev.weekdays,
        [day]: {
          ...prev.weekdays[day],
          enabled,
          blocks: enabled && prev.weekdays[day].blocks.length === 0 
            ? [{ start: '09:00', end: '17:00' }] 
            : prev.weekdays[day].blocks,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleAddBlock = (day: DayKey) => {
    setSchedule(prev => {
      const currentBlocks = prev.weekdays[day].blocks;
      const lastBlock = currentBlocks[currentBlocks.length - 1];
      let newStart = '09:00';
      let newEnd = '17:00';
      
      if (lastBlock) {
        // Start new block 1 hour after last block ends
        const [lastEndHour] = lastBlock.end.split(':').map(Number);
        const newStartHour = (lastEndHour + 1) % 24;
        newStart = `${String(newStartHour).padStart(2, '0')}:00`;
        newEnd = `${String((newStartHour + 8) % 24).padStart(2, '0')}:00`;
      }
      
      return {
        ...prev,
        weekdays: {
          ...prev.weekdays,
          [day]: {
            ...prev.weekdays[day],
            blocks: [...currentBlocks, { start: newStart, end: newEnd }],
          },
        },
      };
    });
    setHasChanges(true);
  };

  const handleRemoveBlock = (day: DayKey, index: number) => {
    setSchedule(prev => ({
      ...prev,
      weekdays: {
        ...prev.weekdays,
        [day]: {
          ...prev.weekdays[day],
          blocks: prev.weekdays[day].blocks.filter((_, i) => i !== index),
        },
      },
    }));
    setHasChanges(true);
  };

  const handleUpdateBlock = (day: DayKey, index: number, field: keyof TimeBlock, value: string) => {
    setSchedule(prev => {
      const newBlocks = [...prev.weekdays[day].blocks];
      newBlocks[index] = { ...newBlocks[index], [field]: value };
      return {
        ...prev,
        weekdays: {
          ...prev.weekdays,
          [day]: {
            ...prev.weekdays[day],
            blocks: newBlocks,
          },
        },
      };
    });
    setHasChanges(true);
  };

  const handleCopyBlocks = (fromDay: DayKey, toDay: DayKey) => {
    setSchedule(prev => ({
      ...prev,
      weekdays: {
        ...prev.weekdays,
        [toDay]: {
          enabled: true,
          blocks: [...prev.weekdays[fromDay].blocks],
        },
      },
    }));
    setHasChanges(true);
    notifications.show({
      title: 'Скопировано',
      message: `Часы работы скопированы на ${DAYS.find(d => d.key === toDay)?.label}`,
      color: 'blue',
    });
  };

  const handleSave = async () => {
    // Validate all time blocks
    for (const day of DAYS) {
      const daySchedule = schedule.weekdays[day.key];
      if (daySchedule.enabled) {
        for (const block of daySchedule.blocks) {
          if (!isValidTimeFormat(block.start) || !isValidTimeFormat(block.end)) {
            notifications.show({
              title: 'Ошибка',
              message: `Неверный формат времени в ${day.label}. Используйте формат HH:MM (например, 09:00)`,
              color: 'red',
            });
            return;
          }
          if (block.start >= block.end) {
            notifications.show({
              title: 'Ошибка',
              message: `Время начала должно быть меньше времени окончания в ${day.label}`,
              color: 'red',
            });
            return;
          }
        }
      }
    }

    setSaving(true);
    try {
      await scheduleApi.update(schedule);
      setHasChanges(false);
      notifications.show({
        title: 'Сохранено',
        message: 'Расписание успешно обновлено',
        color: 'green',
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Ошибка сохранения расписания';
      notifications.show({
        title: 'Ошибка',
        message,
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const getUserTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Stack gap="md">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <Skeleton key={i} height={80} radius="md" />
          ))}
        </Stack>
      );
    }

    if (error) {
      return (
        <Alert icon={<IconAlertCircle size={18} />} title="Ошибка загрузки" color="red">
          {error}
          <Button variant="light" onClick={fetchSchedule} mt="sm">
            Повторить
          </Button>
        </Alert>
      );
    }

    return (
      <Stack gap="md">
        {DAYS.map((day) => {
          const daySchedule = schedule.weekdays[day.key];
          const hasEnabledDays = DAYS.some(d => schedule.weekdays[d.key].enabled && d.key !== day.key);
          
          return (
            <Card key={day.key} withBorder p="md">
              <Group justify="space-between" align="center" mb={daySchedule.enabled ? 'md' : undefined}>
                <Group gap="md">
                  <Switch
                    checked={daySchedule.enabled}
                    onChange={(e) => handleToggleDay(day.key, e.currentTarget.checked)}
                    label={day.label}
                    size="md"
                  />
                </Group>
                {daySchedule.enabled && (
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => handleAddBlock(day.key)}
                      title="Добавить время"
                    >
                      <IconPlus size={18} />
                    </ActionIcon>
                    {hasEnabledDays && (
                      <Menu position="bottom-end" withArrow>
                        <Menu.Target>
                          <ActionIcon variant="light" color="gray" title="Копировать с другого дня">
                            <IconCopy size={18} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          {DAYS.filter(d => d.key !== day.key && schedule.weekdays[d.key].enabled).map(sourceDay => (
                            <Menu.Item
                              key={sourceDay.key}
                              onClick={() => handleCopyBlocks(sourceDay.key, day.key)}
                            >
                              Копировать с {sourceDay.label}
                            </Menu.Item>
                          ))}
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </Group>
                )}
              </Group>
              
              {daySchedule.enabled && (
                <Stack gap="xs">
                  {daySchedule.blocks.map((block, index) => (
                    <Group key={index} gap="xs" align="center">
                      <TextInput
                        value={block.start}
                        onChange={(e) => handleUpdateBlock(day.key, index, 'start', e.currentTarget.value)}
                        placeholder="09:00"
                        style={{ width: 80 }}
                        size="sm"
                      />
                      <Text c="dimmed">—</Text>
                      <TextInput
                        value={block.end}
                        onChange={(e) => handleUpdateBlock(day.key, index, 'end', e.currentTarget.value)}
                        placeholder="17:00"
                        style={{ width: 80 }}
                        size="sm"
                      />
                      <Text c="dimmed" size="sm">
                        {formatTimeDisplay(block.start)} — {formatTimeDisplay(block.end)}
                      </Text>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleRemoveBlock(day.key, index)}
                        title="Удалить"
                        ml="auto"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  ))}
                  {daySchedule.blocks.length === 0 && (
                    <Text c="dimmed" size="sm">
                      Нет настроенного времени. Нажмите "+" чтобы добавить.
                    </Text>
                  )}
                </Stack>
              )}
            </Card>
          );
        })}
      </Stack>
    );
  };

  return (
    <Layout>
      <Group justify="space-between" align="center" mb="lg">
        <div>
          <Title order={2}>Расписание</Title>
          <Text c="dimmed" size="sm">
            Настройте часы доступности для бронирований
          </Text>
        </div>
        {!loading && (
          <Button 
            onClick={handleSave} 
            loading={saving}
            disabled={!hasChanges}
          >
            Сохранить
          </Button>
        )}
      </Group>

      <Card withBorder p="md" mb="lg">
        <Group gap="xs">
          <Text size="sm" c="dimmed">Таймзона:</Text>
          <Text size="sm" fw={500}>{getUserTimezone()}</Text>
        </Group>
      </Card>

      {renderContent()}
    </Layout>
  );
}
