import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Title,
  Text,
  Paper,
  Grid,
  Skeleton,
  Alert,
  Stack,
  Group,
  Box,
  Divider,
} from '@mantine/core';
import { IconCheck, IconArrowLeft, IconCopy, IconX, IconAlertCircle } from '@tabler/icons-react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { PublicLayout } from '../components/PublicLayout';
import { publicApi, ApiError } from '../api';
import type { Booking } from '../api/types';
import { formatDateTime } from '../utils/date';

export function BookingSuccess() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  const fetchBooking = useCallback(async () => {
    // For now, we'll construct the booking from URL params
    // In a real app, you'd have a GET /public/bookings/:id endpoint
    if (!id || !token) {
      setError('Некорректная ссылка подтверждения');
      setLoading(false);
      return;
    }

    // Try to load booking data from sessionStorage if available
    const storedBooking = sessionStorage.getItem(`booking_${id}`);
    if (storedBooking) {
      try {
        const parsed = JSON.parse(storedBooking);
        setBooking(parsed);
        setLoading(false);
        return;
      } catch {
        // Ignore parse error
      }
    }

    // Otherwise, create a minimal booking object with the URL info
    // The user will see partial info but can still cancel
    setLoading(false);
  }, [id, token]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleCopyLink = async () => {
    if (!id || !token || typeof window === 'undefined') return;
    
    const url = `${window.location.origin}/bookings/${id}/success?token=${encodeURIComponent(token)}`;
    
    try {
      await navigator.clipboard.writeText(url);
      notifications.show({
        title: 'Скопировано',
        message: 'Ссылка для управления бронированием скопирована',
        color: 'blue',
      });
    } catch {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось скопировать ссылку',
        color: 'red',
      });
    }
  };

  const handleCancel = async () => {
    if (!id || !token) return;

    const confirmed = window.confirm('Вы уверены? Это действие нельзя отменить.');
    if (!confirmed) return;

    setIsCancelling(true);

    try {
      await publicApi.cancelBooking(id, token);
      setIsCancelled(true);
      notifications.show({
        title: 'Отменено',
        message: 'Бронирование успешно отменено',
        color: 'green',
      });
    } catch (err) {
      const message = err instanceof ApiError
        ? err.code === 'INVALID_CANCEL_TOKEN'
          ? 'Не удалось отменить бронирование. Возможно, ссылка устарела.'
          : err.message
        : 'Не удалось отменить бронирование';
      
      notifications.show({
        title: 'Ошибка',
        message,
        color: 'red',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (!id || !token) {
    return (
      <PublicLayout>
        <Alert icon={<IconAlertCircle size={18} />} title="Ошибка" color="red" mb="md">
          Некорректная ссылка. Пожалуйста, проверьте URL.
        </Alert>
        <Button component={Link} to="/" variant="light">
          На главную
        </Button>
      </PublicLayout>
    );
  }

  if (loading) {
    return (
      <PublicLayout>
        <Skeleton height={300} radius="md" />
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout>
        <Alert icon={<IconAlertCircle size={18} />} title="Ошибка" color="red" mb="md">
          {error}
        </Alert>
        <Button component={Link} to="/" variant="light">
          На главную
        </Button>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <Grid justify="center">
        <Grid.Col span={{ base: 12, md: 8, lg: 6 }}>
          <Paper p="xl" withBorder radius="md">
            {isCancelled ? (
              <Stack align="center" gap="md" data-testid="cancelled-state">
                <Box
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: '#40c057',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconCheck size={32} color="white" />
                </Box>
                <Title order={3} ta="center" data-testid="cancelled-title">Бронирование отменено</Title>
                <Text c="dimmed" ta="center">
                  Ваше бронирование было успешно отменено.
                </Text>
                <Button component={Link} to="/" color="blue">
                  Забронировать другое время
                </Button>
              </Stack>
            ) : (
              <>
                <Stack align="center" gap="md" mb="xl" data-testid="success-message">
                  <Box
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: '#40c057',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconCheck size={32} color="white" />
                  </Box>
                  <Title order={3} ta="center">Бронирование подтверждено</Title>
                </Stack>

                <Paper withBorder p="md" radius="md" mb="xl" bg="gray.0" data-testid="booking-details">
                  {booking && (
                    <>
                      <Text mb="xs">
                        <strong>Дата и время:</strong>{' '}
                        {formatDateTime(booking.startTime)}
                      </Text>
                      {booking.guest && (
                        <>
                          <Text mb="xs" data-testid="guest-name">
                            <strong>Гость:</strong> {booking.guest.name}
                          </Text>
                          <Text mb="xs" data-testid="guest-email">
                            <strong>Email:</strong> {booking.guest.email}
                          </Text>
                          {booking.guest.notes && (
                            <Text mb="xs">
                              <strong>Примечания:</strong> {booking.guest.notes}
                            </Text>
                          )}
                        </>
                      )}
                    </>
                  )}
                  
                  <Divider my="md" />

                  <Group justify="center">
                    <Button
                      variant="light"
                      color="red"
                      onClick={handleCancel}
                      loading={isCancelling}
                      leftSection={<IconX size={18} />}
                      data-testid="cancel-booking-button"
                    >
                      Отменить бронирование
                    </Button>
                  </Group>
                </Paper>

                <Alert color="blue" variant="light" mb="md">
                  <Text size="sm">
                    <strong>Сохраните эту ссылку</strong> для управления бронированием:
                  </Text>
                  <Group mt="xs">
                    <Text size="sm" c="dimmed" style={{ wordBreak: 'break-all' }}>
                      {typeof window !== 'undefined' ? `${window.location.origin}/bookings/${id}/success?token=...` : '/bookings/${id}/success?token=...'}
                    </Text>
                    <Button
                      variant="subtle"
                      size="compact-sm"
                      leftSection={<IconCopy size={16} />}
                      onClick={handleCopyLink}
                    >
                      Копировать
                    </Button>
                  </Group>
                </Alert>

                <Button
                  component={Link}
                  to="/"
                  variant="subtle"
                  leftSection={<IconArrowLeft size={18} />}
                  fullWidth
                >
                  На главную
                </Button>
              </>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </PublicLayout>
  );
}
