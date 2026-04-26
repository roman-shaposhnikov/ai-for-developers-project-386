import {
  Alert,
  Avatar,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { IconCalendar, IconClock, IconWorld } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createPublicBooking } from '@/entities/booking';
import { eventKeys, getPublicEvent } from '@/entities/event';
import { ownerProfile, routes } from '@/shared/config/routes';
import { browserTimezone, formatLongDate, formatSlotRange } from '@/shared/lib/time';

export function BookingPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const startIso = search.get('start');
  const tz = browserTimezone();

  const eventQuery = useQuery({
    queryKey: eventKeys.publicDetail(slug),
    queryFn: () => getPublicEvent(slug),
    enabled: !!slug,
  });

  const form = useForm({
    initialValues: { name: '', email: '', notes: '' },
    validate: {
      name: (v) => (v.trim().length === 0 ? 'Name is required' : null),
      email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Enter a valid email'),
    },
  });

  const mutation = useMutation({
    mutationFn: (values: { name: string; email: string; notes: string }) =>
      createPublicBooking(slug, {
        startTime: startIso!,
        guest: {
          name: values.name,
          email: values.email,
          notes: values.notes ? values.notes : undefined,
        },
      }),
    onSuccess: (data) => {
      navigate(routes.bookingSuccess(data.id), {
        state: { cancelToken: data.cancelToken, booking: data, eventSlug: slug },
      });
    },
  });

  if (!startIso) {
    return (
      <Container size="sm" py="xl">
        <Alert color="red" title="Missing slot">
          No slot selected. Go back and pick a time.
        </Alert>
      </Container>
    );
  }

  if (eventQuery.isLoading) {
    return (
      <Group justify="center" mt="xl">
        <Loader />
      </Group>
    );
  }

  if (eventQuery.isError || !eventQuery.data) {
    return (
      <Container size="sm" py="xl">
        <Alert color="red" title="Event not found">
          {(eventQuery.error as Error)?.message ?? 'No event with this URL.'}
        </Alert>
      </Container>
    );
  }

  const event = eventQuery.data;

  return (
    <Container size="lg" py="xl">
      <Paper withBorder p="lg">
        <Group align="flex-start" wrap="wrap" gap="xl">
          <Stack gap="sm" w={280}>
            <Avatar color="indigo" radius="xl">
              {ownerProfile.name.charAt(0)}
            </Avatar>
            <Text fw={600}>{ownerProfile.name}</Text>
            <Title order={3}>{event.title}</Title>
            <Group gap={6} c="dimmed">
              <IconCalendar size={16} />
              <Stack gap={0}>
                <Text size="sm">{formatLongDate(startIso, tz)}</Text>
                <Text size="sm">{formatSlotRange(startIso, event.duration, tz)}</Text>
              </Stack>
            </Group>
            <Group gap={6} c="dimmed">
              <IconClock size={16} /> <Text size="sm">{event.duration}m</Text>
            </Group>
            <Group gap={6} c="dimmed">
              <IconWorld size={16} /> <Text size="sm">{tz}</Text>
            </Group>
          </Stack>
          <Stack flex={1}>
            <form onSubmit={form.onSubmit((v) => mutation.mutate(v))}>
              <Stack>
                <TextInput
                  label="Your name"
                  required
                  placeholder="Jane Doe"
                  {...form.getInputProps('name')}
                />
                <TextInput
                  label="Email address"
                  required
                  placeholder="jane@example.com"
                  {...form.getInputProps('email')}
                />
                <Textarea
                  label="Additional notes"
                  placeholder="Please share anything that will help prepare for our meeting."
                  autosize
                  minRows={3}
                  {...form.getInputProps('notes')}
                />
                {mutation.isError && (
                  <Alert color="red">{(mutation.error as Error).message}</Alert>
                )}
                <Group justify="flex-end">
                  <Button variant="subtle" onClick={() => navigate(-1)}>
                    Back
                  </Button>
                  <Button type="submit" loading={mutation.isPending}>
                    Confirm
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        </Group>
      </Paper>
    </Container>
  );
}
