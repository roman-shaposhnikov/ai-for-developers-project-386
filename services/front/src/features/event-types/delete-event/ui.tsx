import { ActionIcon, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { ApiError } from '@/shared/api';
import { useDeleteEvent } from './model';

interface Props {
  slug: string;
  title: string;
  onDeleted?: () => void;
}

export function DeleteEventButton({ slug, title, onDeleted }: Props) {
  const mutation = useDeleteEvent();

  const handleDelete = () => {
    modals.openConfirmModal({
      title: `Delete "${title}"?`,
      children: 'This event type will no longer be bookable. Active bookings will block deletion.',
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        mutation.mutate(slug, {
          onSuccess: () => {
            notifications.show({ color: 'green', message: `Deleted "${title}"` });
            onDeleted?.();
          },
          onError: (err) => {
            const msg =
              err instanceof ApiError && err.status === 409
                ? 'Cannot delete: there are active bookings for this event.'
                : (err as Error).message;
            notifications.show({ color: 'red', message: msg });
          },
        });
      },
    });
  };

  return (
    <Tooltip label="Delete">
      <ActionIcon
        variant="subtle"
        color="red"
        onClick={handleDelete}
        loading={mutation.isPending}
        aria-label="Delete event"
      >
        <IconTrash size={18} />
      </ActionIcon>
    </Tooltip>
  );
}
