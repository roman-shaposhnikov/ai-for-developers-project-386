import { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Paper,
  Grid,
  Skeleton,
  Alert,
  Anchor,
} from '@mantine/core';
import { IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { PublicLayout } from '../components/PublicLayout';
import { BookingForm } from '../components/BookingForm';
import { publicApi, ApiError } from '../api';
import type { Event, Slot } from '../api/types';

export function BookingFormPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const slotParam = searchParams.get('slot');

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slot: Slot | null = useMemo(() => {
    if (!slotParam || !event) return null;
    
    const startTime = slotParam;
    const endTime = new Date(new Date(startTime).getTime() + event.duration * 60000).toISOString();
    
    return {
      startTime,
      endTime,
    };
  }, [slotParam, event]);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);
        const data = await publicApi.getEvent(slug);
        setEvent(data);
      } catch (err) {
        const message = err instanceof ApiError
          ? err.status === 404
            ? 'Событие не найдено'
            : err.message
          : 'Не удалось загрузить событие';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug]);

  // Validate slot parameter
  useEffect(() => {
    if (!loading && !error && !slotParam) {
      setError('Не указано время бронирования');
    }
  }, [slotParam, loading, error]);

  const handleSuccess = (bookingId: string, cancelToken: string) => {
    // Redirect to success page
    navigate(`/bookings/${bookingId}/success?token=${encodeURIComponent(cancelToken)}`);
  };

  const handleError = (err: ApiError) => {
    // Handle specific error cases
    if (err.code === 'SLOT_UNAVAILABLE' || err.code === 'INVALID_SLOT_TIME') {
      // Redirect back to calendar
      setTimeout(() => {
        navigate(`/e/${slug}`);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <Skeleton height={400} radius="md" />
      </PublicLayout>
    );
  }

  if (error || !event || !slot) {
    return (
      <PublicLayout>
        <Alert icon={<IconAlertCircle size={18} />} title="Ошибка" color="red" mb="md" data-testid="error-message">
          {error || 'Некорректные данные для бронирования'}
        </Alert>
        <Button component={Link} to={slug ? `/e/${slug}` : '/'} variant="light">
          Вернуться к выбору времени
        </Button>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <Anchor component={Link} to={`/e/${slug}`} underline="never">
        <Button variant="subtle" leftSection={<IconArrowLeft size={18} />} mb="md">
          Назад к выбору времени
        </Button>
      </Anchor>

      <Grid gap="lg" justify="center">
        <Grid.Col span={{ base: 12, md: 8, lg: 6 }}>
          <Paper p="xl" withBorder radius="md">
            <BookingForm
              eventSlug={event.slug}
              eventTitle={event.title}
              eventDuration={event.duration}
              slot={slot}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </Paper>
        </Grid.Col>
      </Grid>
    </PublicLayout>
  );
}
