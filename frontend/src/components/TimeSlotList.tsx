import { Stack, Button, Text, Box } from '@mantine/core';
import { formatTime, formatDayOfWeek, formatDate } from '../utils/date';
import type { Slot } from '../api/types';

interface TimeSlotListProps {
  slots: Slot[];
  selectedSlot: Slot | null;
  onSelect: (slot: Slot) => void;
  loading?: boolean;
  date: Date;
}

export function TimeSlotList({
  slots,
  selectedSlot,
  onSelect,
  loading,
  date,
}: TimeSlotListProps) {
  if (loading) {
    return (
      <Box>
        <Text fw={600} mb="md">
          {formatDayOfWeek(date)}, {formatDate(date)}
        </Text>
        <Text c="dimmed" size="sm">
          Загрузка доступного времени...
        </Text>
      </Box>
    );
  }

  if (slots.length === 0) {
    return (
      <Box>
        <Text fw={600} mb="md">
          {formatDayOfWeek(date)}, {formatDate(date)}
        </Text>
        <Text c="dimmed" size="sm">
          На этот день нет свободного времени. Выберите другую дату.
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text fw={600} mb="md">
        {formatDayOfWeek(date)}, {formatDate(date)}
      </Text>

      <Stack gap="xs">
        {slots.map((slot, index) => {
          const isSelected = selectedSlot?.startTime === slot.startTime;
          const startTime = formatTime(slot.startTime);

          return (
            <Button
              key={index}
              variant={isSelected ? 'filled' : 'light'}
              color="green"
              onClick={() => onSelect(slot)}
              fullWidth
              justify="flex-start"
              leftSection={
                <Box
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: isSelected ? 'white' : '#40c057',
                  }}
                />
              }
              styles={{
                root: {
                  height: 44,
                  border: isSelected ? '2px solid #228be6' : undefined,
                },
              }}
            >
              {startTime}
            </Button>
          );
        })}
      </Stack>
    </Box>
  );
}
