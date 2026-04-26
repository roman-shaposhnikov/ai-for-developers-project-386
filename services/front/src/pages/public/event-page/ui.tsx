import { Alert, Avatar, Container, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { IconClock, IconWorld } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { eventKeys, getPublicEvent } from '@/entities/event';
import { ownerProfile, routes } from '@/shared/config/routes';
import { browserTimezone } from '@/shared/lib/time';
import { SlotPicker } from '@/widgets/slot-picker';

export function EventPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const tz = browserTimezone();

  const query = useQuery({
    queryKey: eventKeys.publicDetail(slug),
    queryFn: () => getPublicEvent(slug),
    enabled: !!slug,
  });

  if (query.isLoading) {
    return (
      <Group justify="center" mt="xl">
        <Loader />
      </Group>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Container size="sm" py="xl">
        <Alert color="red" title="Event not found">
          {(query.error as Error)?.message ?? 'No event with this URL.'}
        </Alert>
      </Container>
    );
  }

  const event = query.data;

  return (
    <Container size="lg" py="xl">
      <Group align="flex-start" wrap="wrap" gap="xl">
        <Paper withBorder p="lg" w={300}>
          <Stack gap="sm">
            <Avatar color="indigo" radius="xl">
              {ownerProfile.name.charAt(0)}
            </Avatar>
            <Text fw={600}>{ownerProfile.name}</Text>
            <Title order={3}>{event.title}</Title>
            <Text c="dimmed">{event.description}</Text>
            <Group gap={6} c="dimmed">
              <IconClock size={16} /> <Text size="sm">{event.duration}m</Text>
            </Group>
            <Group gap={6} c="dimmed">
              <IconWorld size={16} /> <Text size="sm">{tz}</Text>
            </Group>
          </Stack>
        </Paper>
        <Stack flex={1}>
          <SlotPicker
            slug={event.slug}
            onPick={(startIso) =>
              navigate(`${routes.publicEventBook(event.slug)}?start=${encodeURIComponent(startIso)}`)
            }
          />
        </Stack>
      </Group>
    </Container>
  );
}
