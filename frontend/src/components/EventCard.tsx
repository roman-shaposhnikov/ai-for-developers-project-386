import { Card, Group, Text, Switch, ActionIcon, Badge, Menu, rem } from '@mantine/core';
import { IconEdit, IconLink, IconDots, IconTrash } from '@tabler/icons-react';
import type { Event } from '../api/types';

interface EventCardProps {
  event: Event;
  onToggleActive: (slug: string, active: boolean) => void;
  onEdit: (slug: string) => void;
  onCopyLink: (slug: string) => void;
  onDelete: (slug: string) => void;
  isUpdating?: boolean;
}

export function EventCard({
  event,
  onToggleActive,
  onEdit,
  onCopyLink,
  onDelete,
  isUpdating,
}: EventCardProps) {
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}м`;
    const hours = minutes / 60;
    return hours === 1 ? '1ч' : `${hours}ч`;
  };

  const publicLink = `${window.location.origin}/e/${event.slug}`;

  return (
    <Card withBorder shadow="sm" radius="md" p="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} size="lg" truncate>
            {event.title}
          </Text>
          <Group gap="xs" mt={4}>
            <Text c="dimmed" size="sm" truncate>
              /{event.slug}
            </Text>
          </Group>
        </div>
        <Badge variant="light" color="gray">
          {formatDuration(event.duration)}
        </Badge>
      </Group>

      <Group gap="xs" mt="md">
        <Switch
          checked={event.active}
          onChange={(e) => onToggleActive(event.slug, e.currentTarget.checked)}
          label={event.active ? 'Активно' : 'Неактивно'}
          disabled={isUpdating}
          color="green"
        />

        <ActionIcon
          variant="light"
          color="blue"
          onClick={() => onEdit(event.slug)}
          title="Редактировать"
        >
          <IconEdit size={18} />
        </ActionIcon>

        <ActionIcon
          variant="light"
          color="gray"
          onClick={() => onCopyLink(publicLink)}
          title="Копировать ссылку"
        >
          <IconLink size={18} />
        </ActionIcon>

        <Menu position="bottom-end" withArrow>
          <Menu.Target>
            <ActionIcon variant="light" color="gray">
              <IconDots size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={rem(14)} />}
              onClick={() => onDelete(event.slug)}
            >
              Удалить
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  );
}
