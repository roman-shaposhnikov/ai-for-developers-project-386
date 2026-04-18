import { Box, Button, Stack, Text } from '@mantine/core';
import type { Slot } from '../api/types';
import { formatDate, formatDayOfWeek, formatTime } from '../utils/date';

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
                    backgroundColor: isSelected ? 'white' : '#40c057',
                    borderRadius: '50%',
                    height: 8,
                    width: 8,
                  }}
                />
              }
              styles={{
                root: {
                  border: isSelected ? '2px solid #228be6' : undefined,
                  height: 44,
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
