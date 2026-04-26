import { Avatar, Card, Container, Group, Loader, Stack, Text, Title, Alert } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { eventKeys, listPublicEvents } from '@/entities/event';
import { ownerProfile, routes } from '@/shared/config/routes';

export function OwnerPage() {
  const query = useQuery({
    queryKey: eventKeys.publicList(),
    queryFn: listPublicEvents,
  });

  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="xs" mb="xl">
        <Avatar color="indigo" size="lg" radius="xl">
          {ownerProfile.name.charAt(0)}
        </Avatar>
        <Title order={2}>{ownerProfile.name}</Title>
        <Text c="dimmed">Pick an event type to schedule a meeting.</Text>
      </Stack>

      {query.isLoading && (
        <Group justify="center">
          <Loader />
        </Group>
      )}
      {query.isError && (
        <Alert color="red" title="Failed to load events">
          {(query.error as Error).message}
        </Alert>
      )}
      <Stack>
        {query.data?.map((event) => (
          <Card
            key={event.slug}
            component={Link}
            to={routes.publicEvent(event.slug)}
            withBorder
            shadow="xs"
            padding="md"
            style={{ textDecoration: 'none' }}
          >
            <Stack gap="xs">
              <Title order={4}>{event.title}</Title>
              <Text c="dimmed" size="sm" lineClamp={2}>
                {event.description}
              </Text>
              <Group gap={4} c="dimmed">
                <IconClock size={14} />
                <Text size="sm">{event.duration}m</Text>
              </Group>
            </Stack>
          </Card>
        ))}
        {query.data && query.data.length === 0 && (
          <Text c="dimmed" ta="center">
            No event types available right now.
          </Text>
        )}
      </Stack>
    </Container>
  );
}
