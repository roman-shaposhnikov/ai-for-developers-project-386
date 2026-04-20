import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Stack,
  Title,
  Text,
  Group,
  Skeleton,
  Alert,
  Box,
} from '@mantine/core';
import { IconPlus, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { EventCard } from '../components/EventCard';
import { Layout } from '../components/Layout';
import { eventsApi, ApiError } from '../api';
import type { Event } from '../api/types';

export function EventsList() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventsApi.list();
      // Sort by createdAt desc
      const sorted = data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setEvents(sorted);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Не удалось загрузить события';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleToggleActive = async (slug: string, active: boolean) => {
    const event = events.find(e => e.slug === slug);
    if (!event) return;

    // Optimistic update
    setEvents(prev => prev.map(e => 
      e.slug === slug ? { ...e, active } : e
    ));
    setUpdatingSlug(slug);

    try {
      await eventsApi.update(slug, { active });
      notifications.show({
        title: 'Успешно',
        message: active ? 'Событие активировано' : 'Событие деактивировано',
        color: 'green',
      });
    } catch (err) {
      // Revert on error
      setEvents(prev => prev.map(e => 
        e.slug === slug ? { ...e, active: !active } : e
      ));
      const message = err instanceof ApiError ? err.message : 'Ошибка обновления';
      notifications.show({
        title: 'Ошибка',
        message,
        color: 'red',
      });
    } finally {
      setUpdatingSlug(null);
    }
  };

  const handleEdit = (slug: string) => {
    navigate(`/admin/events/${slug}/edit`);
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      notifications.show({
        title: 'Скопировано',
        message: 'Ссылка скопирована в буфер обмена',
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

  const handleDelete = async (slug: string) => {
    const confirmed = window.confirm('Вы уверены? Это действие нельзя отменить.');
    if (!confirmed) return;

    try {
      await eventsApi.delete(slug);
      setEvents(prev => prev.filter(e => e.slug !== slug));
      notifications.show({
        title: 'Удалено',
        message: 'Событие успешно удалено',
        color: 'green',
      });
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.code === 'HAS_ACTIVE_BOOKINGS' 
          ? 'Нельзя удалить: у события есть активные бронирования'
          : err.message
        : 'Ошибка удаления';
      notifications.show({
        title: 'Ошибка',
        message,
        color: 'red',
      });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Stack gap="md">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} height={120} radius="md" />
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

    if (events.length === 0) {
      return (
        <Box py="xl" data-testid="empty-state">
          <Text c="dimmed" ta="center" mb="lg">
            Пока нет ни одного типа события. Создайте первое событие, чтобы начать.
          </Text>
          <Group justify="center">
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => navigate('/admin/events/new')}
              size="lg"
            >
              Создать событие
            </Button>
          </Group>
        </Box>
      );
    }

    return (
      <Stack gap="md">
        {events.map(event => (
          <EventCard
            key={event.id}
            event={event}
            onToggleActive={handleToggleActive}
            onEdit={handleEdit}
            onCopyLink={handleCopyLink}
            onDelete={handleDelete}
            isUpdating={updatingSlug === event.slug}
          />
        ))}
      </Stack>
    );
  };

  return (
    <Layout>
      <Group justify="space-between" align="center" mb="lg">
        <div>
          <Title order={2}>Типы событий</Title>
          <Text c="dimmed" size="sm">
            Управляйте событиями, которые видят гости
          </Text>
        </div>
        {!loading && events.length > 0 && (
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => navigate('/admin/events/new')}
          >
            Создать
          </Button>
        )}
      </Group>

      {renderContent()}
    </Layout>
  );
}
