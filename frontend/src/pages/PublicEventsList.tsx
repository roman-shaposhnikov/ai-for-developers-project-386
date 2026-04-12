import { useState, useCallback, useEffect } from 'react';
import {
  Grid,
  Skeleton,
  Alert,
  Title,
  Text,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '../components/PublicLayout';
import { PublicEventCard } from '../components/PublicEventCard';
import { publicApi, ApiError } from '../api';
import type { Event } from '../api/types';

export function PublicEventsList() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await publicApi.listEvents();
      setEvents(data);
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : 'Не удалось загрузить события';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSelectEvent = (slug: string) => {
    navigate(`/e/${slug}`);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Grid>
          {[1, 2, 3].map(i => (
            <Grid.Col key={i} span={{ base: 12, md: 6, lg: 4 }}>
              <Skeleton height={200} radius="md" />
            </Grid.Col>
          ))}
        </Grid>
      );
    }

    if (error) {
      return (
        <Alert icon={<IconAlertCircle size={18} />} title="Ошибка" color="red">
          {error}
        </Alert>
      );
    }

    if (events.length === 0) {
      return (
        <Alert icon={<IconAlertCircle size={18} />} title="Нет доступных событий" color="blue">
          В настоящее время нет доступных событий для бронирования. Пожалуйста, проверьте позже.
        </Alert>
      );
    }

    return (
      <Grid>
        {events.map(event => (
          <Grid.Col key={event.id} span={{ base: 12, md: 6, lg: 4 }}>
            <PublicEventCard
              event={event}
              onSelect={handleSelectEvent}
            />
          </Grid.Col>
        ))}
      </Grid>
    );
  };

  return (
    <PublicLayout>
      <Title order={2} mb="xs" ta="center">Забронировать встречу</Title>
      <Text c="dimmed" size="sm" mb="xl" ta="center">
        Выберите тип встречи, чтобы посмотреть доступное время
      </Text>

      {renderContent()}
    </PublicLayout>
  );
}
