import { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Title,
  Text,
  Group,
  Skeleton,
  Alert,
  Box,
  Badge,
  Card,
  ActionIcon,
  Menu,
  rem,
  Tabs,
} from '@mantine/core';
import { IconAlertCircle, IconDots, IconTrash, IconCalendar } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Layout } from '../components/Layout';
import { eventsApi, ApiError } from '../api';
import type { BookingWithEvent } from '../api/types';
import { formatDate, formatTime, formatDayOfWeek } from '../utils/date';

export function BookingsList() {
  const [bookings, setBookings] = useState<BookingWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventsApi.getBookings();
      // Sort by startTime ascending
      const sorted = data.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      setBookings(sorted);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Не удалось загрузить бронирования';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (id: string) => {
    const confirmed = window.confirm('Вы уверены, что хотите отменить это бронирование?');
    if (!confirmed) return;

    setCancellingId(id);
    try {
      await eventsApi.cancelBooking(id);
      setBookings(prev => prev.filter(b => b.id !== id));
      notifications.show({
        title: 'Отменено',
        message: 'Бронирование успешно отменено',
        color: 'green',
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Ошибка отмены бронирования';
      notifications.show({
        title: 'Ошибка',
        message,
        color: 'red',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const now = new Date();
  
  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.startTime);
    if (activeTab === 'upcoming') {
      return bookingDate >= now && booking.status === 'active';
    } else if (activeTab === 'past') {
      return bookingDate < now && booking.status === 'active';
    } else if (activeTab === 'canceled') {
      return booking.status === 'cancelled';
    }
    return true;
  });

  // Group bookings by date
  const groupedBookings = filteredBookings.reduce((acc, booking) => {
    const dateKey = formatDate(booking.startTime);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(booking);
    return acc;
  }, {} as Record<string, BookingWithEvent[]>);

  const renderContent = () => {
    if (loading) {
      return (
        <Stack gap="md">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} height={100} radius="md" />
          ))}
        </Stack>
      );
    }

    if (error) {
      return (
        <Alert icon={<IconAlertCircle size={18} />} title="Ошибка загрузки" color="red">
          {error}
        </Alert>
      );
    }

    if (filteredBookings.length === 0) {
      return (
        <Box py="xl" ta="center">
          <IconCalendar size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <Text c="dimmed" size="lg">
            {activeTab === 'upcoming' && 'Нет предстоящих бронирований'}
            {activeTab === 'past' && 'Нет прошедших бронирований'}
            {activeTab === 'canceled' && 'Нет отмененных бронирований'}
            {activeTab === 'all' && 'Нет бронирований'}
          </Text>
        </Box>
      );
    }

    return (
      <Stack gap="lg">
        {Object.entries(groupedBookings).map(([date, dateBookings]) => (
          <Box key={date}>
            <Text fw={700} size="sm" c="dimmed" mb="xs">
              {formatDayOfWeek(dateBookings[0].startTime).charAt(0).toUpperCase() + 
               formatDayOfWeek(dateBookings[0].startTime).slice(1)}, {date}
            </Text>
            <Stack gap="xs">
              {dateBookings.map(booking => (
                <Card key={booking.id} withBorder p="md">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap="md" wrap="nowrap">
                      <Box>
                        <Text fw={600} size="lg">
                          {formatTime(booking.startTime)}
                        </Text>
                        <Text c="dimmed" size="sm">
                          {booking.event.duration} мин
                        </Text>
                      </Box>
                      <Box>
                        <Text fw={500}>{booking.event.title}</Text>
                        <Text c="dimmed" size="sm">
                          {booking.guest.name} · {booking.guest.email}
                        </Text>
                      </Box>
                    </Group>
                    <Group gap="xs">
                      <Badge 
                        color={booking.status === 'active' ? 'green' : 'red'} 
                        variant="light"
                      >
                        {booking.status === 'active' ? 'Активно' : 'Отменено'}
                      </Badge>
                      {booking.status === 'active' && (
                        <Menu position="bottom-end" withArrow>
                          <Menu.Target>
                            <ActionIcon variant="light" color="gray">
                              <IconDots size={18} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size={rem(14)} />}
                              onClick={() => handleCancel(booking.id)}
                              disabled={cancellingId === booking.id}
                            >
                              Отменить
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      )}
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    );
  };

  return (
    <Layout>
      <Group justify="space-between" align="center" mb="lg">
        <div>
          <Title order={2}>Бронирования</Title>
          <Text c="dimmed" size="sm">
            Управляйте записями гостей
          </Text>
        </div>
      </Group>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'upcoming')} mb="lg">
        <Tabs.List>
          <Tabs.Tab value="upcoming">Предстоящие</Tabs.Tab>
          <Tabs.Tab value="past">Прошедшие</Tabs.Tab>
          <Tabs.Tab value="canceled">Отмененные</Tabs.Tab>
          <Tabs.Tab value="all">Все</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {renderContent()}
    </Layout>
  );
}
