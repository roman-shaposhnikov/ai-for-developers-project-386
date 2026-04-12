import { Card, Group, Text, Button, Box } from '@mantine/core';
import { IconCalendar, IconClock } from '@tabler/icons-react';
import type { Event } from '../api/types';

interface PublicEventCardProps {
  event: Event;
  onSelect: (slug: string) => void;
}

export function PublicEventCard({ event, onSelect }: PublicEventCardProps) {
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} минут`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`;
    }
    return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} ${remainingMinutes} минут`;
  };

  const truncateText = (text: string, maxLength: number = 120): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <Card withBorder shadow="sm" radius="md" p="lg">
      <Group gap="sm" mb="xs">
        <IconCalendar size={24} color="blue" />
        <Text fw={700} size="lg">{event.title}</Text>
      </Group>

      <Text c="dimmed" size="sm" mb="md" lineClamp={3}>
        {truncateText(event.description)}
      </Text>

      <Group gap="xs" mb="md">
        <IconClock size={16} color="gray" />
        <Text size="sm" c="dimmed">{formatDuration(event.duration)}</Text>
      </Group>

      <Box mt="auto">
        <Button 
          onClick={() => onSelect(event.slug)} 
          fullWidth 
          variant="light"
          color="blue"
        >
          Выбрать время
        </Button>
      </Box>
    </Card>
  );
}
