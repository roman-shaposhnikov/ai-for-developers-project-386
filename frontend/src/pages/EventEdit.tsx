import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Group,
  Title,
  Text,
  Box,
  Loader,
  Alert,
} from '@mantine/core';
import { IconArrowLeft, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { EventForm } from '../components/EventForm';
import { Layout } from '../components/Layout';
import { eventsApi, ApiError } from '../api';
import type { Event, EventFormData } from '../api/types';

export function EventEdit() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvent = useCallback(async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await eventsApi.get(slug);
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
  }, [slug]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleSubmit = async (values: EventFormData) => {
    if (!slug) return;
    
    setIsSubmitting(true);

    try {
      const updateData: Partial<EventFormData> = {};
      
      // Only send changed fields
      if (event && values.title !== event.title) updateData.title = values.title;
      if (event && values.description !== event.description) updateData.description = values.description;
      if (event && values.duration !== event.duration) updateData.duration = values.duration;
      if (event && values.active !== event.active) updateData.active = values.active;

      // Only send request if there are changes
      if (Object.keys(updateData).length > 0) {
        await eventsApi.update(slug, updateData);
        
        // Refresh event data
        await fetchEvent();
        
        notifications.show({
          title: 'Сохранено',
          message: 'Изменения успешно сохранены',
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Информация',
          message: 'Нет изменений для сохранения',
          color: 'blue',
        });
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Не удалось сохранить изменения';
      notifications.show({
        title: 'Ошибка',
        message,
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!slug) return;
    
    const confirmed = window.confirm('Вы уверены? Это действие нельзя отменить.');
    if (!confirmed) return;

    setIsDeleting(true);

    try {
      await eventsApi.delete(slug);
      notifications.show({
        title: 'Удалено',
        message: 'Событие успешно удалено',
        color: 'green',
      });
      navigate('/admin/events');
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.code === 'HAS_ACTIVE_BOOKINGS' 
          ? 'Нельзя удалить: у события есть активные бронирования. Отмените бронирования сначала.'
          : err.message
        : 'Не удалось удалить событие';
      notifications.show({
        title: 'Ошибка',
        message,
        color: 'red',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box ta="center" py="xl">
          <Loader size="lg" />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert icon={<IconAlertCircle size={18} />} title="Ошибка" color="red" mb="md">
          {error}
        </Alert>
        <Button component={Link} to="/admin/events" variant="light">
          Вернуться к списку
        </Button>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <Alert icon={<IconAlertCircle size={18} />} title="Ошибка" color="red" mb="md">
          Событие не найдено
        </Alert>
        <Button component={Link} to="/admin/events" variant="light">
          Вернуться к списку
        </Button>
      </Layout>
    );
  }

  return (
    <Layout>
      <Button
        component={Link}
        to="/admin/events"
        variant="subtle"
        leftSection={<IconArrowLeft size={18} />}
        mb="md"
      >
        Назад к списку
      </Button>

      <Title order={2} mb="xs">Редактировать событие</Title>
      <Text c="dimmed" size="sm" mb="xl">
        Измените детали события «{event.title}»
      </Text>

      <Box maw={600}>
        <EventForm
          initialData={event}
          isEdit={true}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        <Group justify="space-between" mt="xl">
          <Button
            leftSection={<IconTrash size={18} />}
            variant="light"
            color="red"
            onClick={handleDelete}
            loading={isDeleting}
            disabled={isSubmitting}
          >
            Удалить событие
          </Button>

          <Group>
            <Button
              component={Link}
              to="/admin/events"
              variant="default"
              disabled={isSubmitting || isDeleting}
            >
              Отмена
            </Button>
            <Button
              onClick={() => {
                const form = document.querySelector('form');
                form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }}
              loading={isSubmitting}
              color="blue"
              disabled={isDeleting}
            >
              Сохранить изменения
            </Button>
          </Group>
        </Group>
      </Box>
    </Layout>
  );
}
