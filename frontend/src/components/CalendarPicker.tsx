import { useState, useMemo } from 'react';
import { Group, Button, Box, Text, UnstyledButton } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { getCalendarDays, toISODate, addDays, isSameDay, isBefore, getToday, isAfter } from '../utils/date';

interface CalendarPickerProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  availableDates?: string[]; // ISO dates that have slots
  minDate?: Date;
  maxDate?: Date;
}

export function CalendarPicker({
  selectedDate,
  onSelect,
  availableDates = [],
  minDate = getToday(),
  maxDate = addDays(getToday(), 13),
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(getToday());

  const days = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);
  
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const isDateDisabled = (date: Date): boolean => {
    if (isBefore(date, minDate) || isAfter(date, maxDate)) return true;
    return false;
  };

  const isDateAvailable = (date: Date): boolean => {
    if (isDateDisabled(date)) return false;
    const isoDate = toISODate(date);
    return availableDates.includes(isoDate);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => dayjs(prev).subtract(1, 'month').toDate());
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => dayjs(prev).add(1, 'month').toDate());
  };

  const monthYear = dayjs(currentMonth).locale('ru').format('MMMM YYYY');

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Text fw={600}>{monthYear}</Text>
        <Group gap="xs">
          <Button variant="subtle" size="compact-sm" onClick={handlePrevMonth}>
            <IconChevronLeft size={18} />
          </Button>
          <Button variant="subtle" size="compact-sm" onClick={handleNextMonth}>
            <IconChevronRight size={18} />
          </Button>
        </Group>
      </Group>

      <Box mb="xs">
        <Group gap={4} justify="space-between">
          {weekDays.map(day => (
            <Text key={day} size="xs" c="dimmed" ta="center" w={36}>
              {day}
            </Text>
          ))}
        </Group>
      </Box>

      <Box>
        {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => (
          <Group key={weekIndex} gap={4} justify="space-between" mb={4}>
            {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => {
              const disabled = isDateDisabled(date);
              const available = isDateAvailable(date);
              const selected = selectedDate && isSameDay(date, selectedDate);
              const isToday = isSameDay(date, getToday());
              const isCurrentMonth = dayjs(date).month() === dayjs(currentMonth).month();

              return (
                <UnstyledButton
                  key={dayIndex}
                  onClick={() => !disabled && onSelect(date)}
                  disabled={disabled}
                  style={{
                    width: 36,
                    height: 40,
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? '#228be6' : 'transparent',
                    color: disabled ? '#adb5bd' : selected ? 'white' : isCurrentMonth ? '#212529' : '#adb5bd',
                    border: isToday && !selected ? '2px solid #228be6' : '2px solid transparent',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  <Text size="sm" fw={selected ? 600 : 400}>
                    {dayjs(date).date()}
                  </Text>
                  {available && !disabled && !selected && (
                    <Box
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: '#40c057',
                      }}
                    />
                  )}
                </UnstyledButton>
              );
            })}
          </Group>
        ))}
      </Box>
    </Box>
  );
}
