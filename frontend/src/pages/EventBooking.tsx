import { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Skeleton,
  Alert,
  Stack,
  Divider,
  Box,
} from '@mantine/core';
import { IconArrowLeft, IconAlertCircle, IconClock, IconCalendar } from '@tabler/icons-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { PublicLayout } from '../components/PublicLayout';
import { CalendarPicker } from '../components/CalendarPicker';
import { TimeSlotList } from '../components/TimeSlotList';
import { publicApi, ApiError } from '../api';
import type { Event, Slot } from '../api/types';
import { formatDuration, toISODate, getToday, addDays } from '../utils/date';

export function EventBooking() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(getToday());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch event details
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

  // Fetch available slots when date changes
  const fetchSlots = useCallback(async () => {
    if (!slug) return;
    
    setSlotsLoading(true);
    try {
      const dateStr = toISODate(selectedDate);
      const response = await publicApi.getSlots(slug, dateStr);
      setSlots(response.slots);
      
      // Also update available dates for calendar
      if (!availableDates.includes(dateStr) && response.slots.length > 0) {
        setAvailableDates(prev => [...prev, dateStr]);
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [slug, selectedDate, availableDates]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
    
    // Navigate to booking form with slot in query params
    const params = new URLSearchParams();
    params.set('slot', slot.startTime);
    navigate(`/e/${slug}/book?${params.toString()}`);
  };

  if (loading) {
    return (
      <PublicLayout>
        <Skeleton height={400} radius="md" />
      </PublicLayout>
    );
  }

  if (error || !event) {
    return (
      <PublicLayout>
        <Alert icon={<IconAlertCircle size={18} />} title="Ошибка" color="red" mb="md">
          {error || 'Событие не найдено'}
        </Alert>
        <Button component={Link} to="/" variant="light">
          Вернуться на главную
        </Button>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <Button
        component={Link}
        to="/"
        variant="subtle"
        leftSection={<IconArrowLeft size={18} />}
        mb="md"
      >
        Назад к событиям
      </Button>

      <Grid gap="lg">
        {/* Event Info Panel */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper p="md" withBorder radius="md">
            <Stack gap="md">
              <Box>
                <Text c="dimmed" size="xs" tt="uppercase" fw={600}>
                  Владелец
                </Text>
                <Text size="sm">Администратор</Text>
              </Box>

              <Box>
                <Title order={3}>{event.title}</Title>
              </Box>

              <Group gap="xs">
                <IconClock size={18} color="gray" />
                <Text>{formatDuration(event.duration)}</Text>
              </Group>

              <Divider />

              <Text size="sm" c="dimmed">
                {event.description}
              </Text>

              <Divider />

              <Group gap="xs">
                <IconCalendar size={18} color="gray" />
                <Text size="sm" c="dimmed">Europe/Moscow</Text>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Calendar Panel */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper p="md" withBorder radius="md">
            <CalendarPicker
              selectedDate={selectedDate}
              onSelect={handleDateSelect}
              availableDates={availableDates}
              minDate={getToday()}
              maxDate={addDays(getToday(), 13)}
            />
          </Paper>
        </Grid.Col>

        {/* Time Slots Panel */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder radius="md" h="100%">
            <TimeSlotList
              slots={slots}
              selectedSlot={selectedSlot}
              onSelect={handleSlotSelect}
              loading={slotsLoading}
              date={selectedDate}
            />
          </Paper>
        </Grid.Col>
      </Grid>
    </PublicLayout>
  );
}
