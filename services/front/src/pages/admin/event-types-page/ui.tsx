import { useState } from 'react';
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconClock, IconCopy, IconExternalLink, IconPlus, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { eventKeys, listAdminEvents } from '@/entities/event';
import { CreateEventModal } from '@/features/event-types/create-event';
import { DeleteEventButton } from '@/features/event-types/delete-event';
import { ToggleActive } from '@/features/event-types/toggle-active';
import { routes } from '@/shared/config/routes';
import { copyText } from '@/shared/lib/clipboard';

export function EventTypesPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: eventKeys.adminList(),
    queryFn: listAdminEvents,
  });

  const filtered =
    query.data?.filter(
      (e) =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.slug.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const handleCopyLink = async (slug: string) => {
    const url = `${window.location.origin}${routes.publicEvent(slug)}`;
    const ok = await copyText(url);
    notifications.show({
      color: ok ? 'green' : 'red',
      message: ok ? 'Link copied' : 'Failed to copy',
    });
  };

  return (
    <Stack>
      <Group justify="space-between" align="flex-start">
        <Stack gap={0}>
          <Title order={2}>Event types</Title>
          <Text c="dimmed">Configure different events for people to book on your calendar.</Text>
        </Stack>
        <Group>
          <TextInput
            leftSection={<IconSearch size={14} />}
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={240}
          />
          <Button leftSection={<IconPlus size={16} />} onClick={() => setModalOpen(true)}>
            New
          </Button>
        </Group>
      </Group>

      {query.isLoading && <Loader />}
      {query.isError && (
        <Alert color="red" title="Failed to load events">
          {(query.error as Error).message}
        </Alert>
      )}

      <Card withBorder p={0}>
        {filtered.length === 0 && !query.isLoading && (
          <Text c="dimmed" p="md">
            No event types yet.
          </Text>
        )}
        {filtered.map((event, idx) => (
          <Group
            key={event.slug}
            justify="space-between"
            wrap="nowrap"
            p="md"
            style={{ borderTop: idx === 0 ? undefined : '1px solid var(--mantine-color-gray-3)' }}
          >
            <Stack gap={4} style={{ minWidth: 0 }}>
              <Group gap="xs" wrap="nowrap">
                <Anchor
                  component={Link}
                  to={routes.adminEventEdit(event.slug)}
                  fw={600}
                  c="dark"
                >
                  {event.title}
                </Anchor>
                <Text c="dimmed" size="sm">
                  /{event.slug}
                </Text>
                {!event.active && <Badge color="gray">Hidden</Badge>}
              </Group>
              <Group gap={4} c="dimmed">
                <IconClock size={14} />
                <Text size="sm">{event.duration}m</Text>
              </Group>
            </Stack>
            <Group gap="xs">
              <ToggleActive slug={event.slug} active={event.active} />
              <Tooltip label="Open public page">
                <ActionIcon
                  variant="subtle"
                  component="a"
                  href={routes.publicEvent(event.slug)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open public page"
                >
                  <IconExternalLink size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Copy link">
                <ActionIcon
                  variant="subtle"
                  onClick={() => handleCopyLink(event.slug)}
                  aria-label="Copy link"
                >
                  <IconCopy size={18} />
                </ActionIcon>
              </Tooltip>
              <DeleteEventButton slug={event.slug} title={event.title} />
            </Group>
          </Group>
        ))}
      </Card>

      <CreateEventModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(slug) => navigate(routes.adminEventEdit(slug))}
      />
    </Stack>
  );
}
