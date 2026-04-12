import { useState } from 'react';
import {
  Button,
  Group,
  Title,
  Text,
  Box,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate, Link } from 'react-router-dom';
import { EventForm } from '../components/EventForm';
import { Layout } from '../components/Layout';
import { eventsApi, ApiError } from '../api';
import type { EventFormData } from '../api/types';

export function EventCreate() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const handleSubmit = async (values: EventFormData) => {
    setIsSubmitting(true);
    setSlugError(null);

    try {
      await eventsApi.create({
        title: values.title,
        slug: values.slug,
        duration: values.duration,
        description: values.description,
      });
      
      notifications.show({
        title: 'Создано',
        message: 'Событие успешно создано',
        color: 'green',
      });
      
      navigate('/admin/events');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'SLUG_TAKEN') {
          setSlugError('Этот slug уже используется. Выберите другой.');
        } else {
          notifications.show({
            title: 'Ошибка',
            message: err.message,
            color: 'red',
          });
        }
      } else {
        notifications.show({
          title: 'Ошибка',
          message: 'Не удалось создать событие',
          color: 'red',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <Title order={2} mb="xs">Новое событие</Title>
      <Text c="dimmed" size="sm" mb="xl">
        Создайте новый тип события, который гости смогут забронировать
      </Text>

      <Box maw={600}>
        <EventForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          slugError={slugError}
        />

        <Group justify="flex-end" mt="xl">
          <Button
            component={Link}
            to="/admin/events"
            variant="default"
            disabled={isSubmitting}
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
          >
            Создать событие
          </Button>
        </Group>
      </Box>
    </Layout>
  );
}
