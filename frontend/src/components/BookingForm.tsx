import { useState } from 'react';
import {
  TextInput,
  Textarea,
  Button,
  Stack,
  Paper,
  Title,
  Text,
  Group,
  Box,
} from '@mantine/core';
import { IconCalendar, IconClock } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { publicApi, ApiError } from '../api';
import type { Slot, Guest } from '../api/types';
import { formatDate, formatTime, formatDuration } from '../utils/date';

interface BookingFormProps {
  eventSlug: string;
  eventTitle: string;
  eventDuration: number;
  slot: Slot;
  onSuccess: (bookingId: string, cancelToken: string) => void;
  onError?: (error: ApiError) => void;
}

export function BookingForm({
  eventSlug,
  eventTitle,
  eventDuration,
  slot,
  onSuccess,
  onError,
}: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validate = (): boolean => {
    const newErrors: { name?: string; email?: string } = {};
    
    if (!name || name.length < 1) {
      newErrors.name = 'Имя обязательно';
    } else if (name.length > 100) {
      newErrors.name = 'Максимум 100 символов';
    }

    if (!email) {
      newErrors.email = 'Email обязателен';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Некорректный email';
    } else if (email.length > 254) {
      newErrors.email = 'Email слишком длинный';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);

    const guest: Guest = {
      name,
      email,
      notes: notes || undefined,
    };

    try {
      const response = await publicApi.createBooking(eventSlug, {
        startTime: slot.startTime,
        guest,
      });

      notifications.show({
        title: 'Успешно',
        message: 'Бронирование подтверждено',
        color: 'green',
      });

      onSuccess(response.id, response.cancelToken);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'SLOT_UNAVAILABLE') {
          notifications.show({
            title: 'Время занято',
            message: 'Извините, это время только что забронировали. Пожалуйста, выберите другое.',
            color: 'orange',
          });
        } else {
          notifications.show({
            title: 'Ошибка',
            message: err.message,
            color: 'red',
          });
        }
        onError?.(err);
      } else {
        notifications.show({
          title: 'Ошибка',
          message: 'Не удалось создать бронирование',
          color: 'red',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        {/* Selected Time Card */}
        <Paper withBorder p="md" radius="md" bg="gray.0">
          <Title order={5} mb="sm">Выбранное время</Title>
          <Group gap="xs" mb="xs">
            <IconCalendar size={18} color="blue" />
            <Text>{formatDate(slot.startTime)}</Text>
          </Group>
          <Group gap="xs" mb="xs">
            <IconClock size={18} color="blue" />
            <Text>
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)} ({formatDuration(eventDuration)})
            </Text>
          </Group>
          <Text fw={600}>{eventTitle}</Text>
        </Paper>

        {/* Form Fields */}
        <Box>
          <Title order={5} mb="md">Данные для записи</Title>
          
          <Stack gap="md">
            <TextInput
              label="Ваше имя"
              placeholder="Иван Петров"
              required
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              error={errors.name}
              disabled={isSubmitting}
            />

            <TextInput
              label="Email"
              placeholder="ivan@example.com"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              error={errors.email}
              disabled={isSubmitting}
            />

            <Textarea
              label="Дополнительные сведения"
              placeholder="Укажите любую дополнительную информацию..."
              minRows={3}
              maxRows={5}
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
              disabled={isSubmitting}
            />
          </Stack>
        </Box>

        <Button
          type="submit"
          size="lg"
          color="blue"
          loading={isSubmitting}
          disabled={!name || !email}
        >
          Подтвердить бронирование
        </Button>
      </Stack>
    </form>
  );
}
