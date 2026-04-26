import { Switch, Text, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useToggleActive } from './model';

interface Props {
  slug: string;
  active: boolean;
}

export function ToggleActive({ slug, active }: Props) {
  const mutation = useToggleActive();

  const handleChange = (checked: boolean) => {
    mutation.mutate(
      { slug, active: checked },
      {
        onError: (err) => {
          notifications.show({ color: 'red', message: (err as Error).message });
        },
      },
    );
  };

  return (
    <Group gap="xs" wrap="nowrap">
      {!active && (
        <Text c="dimmed" size="sm">
          Hidden
        </Text>
      )}
      <Switch
        checked={active}
        onChange={(e) => handleChange(e.currentTarget.checked)}
        disabled={mutation.isPending}
        aria-label={active ? 'Hide event' : 'Show event'}
      />
    </Group>
  );
}
