import { Menu, ActionIcon } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconDots, IconX } from '@tabler/icons-react';
import { useCancelAdminBooking } from './model';

interface Props {
  id: string;
  guestName: string;
}

export function CancelBookingMenu({ id, guestName }: Props) {
  const mutation = useCancelAdminBooking();

  const handleCancel = () => {
    modals.openConfirmModal({
      title: 'Cancel booking?',
      children: `This will cancel the booking with ${guestName}.`,
      labels: { confirm: 'Cancel booking', cancel: 'Keep' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        mutation.mutate(id, {
          onSuccess: () => {
            notifications.show({ color: 'green', message: 'Booking cancelled' });
          },
          onError: (err) => {
            notifications.show({ color: 'red', message: (err as Error).message });
          },
        });
      },
    });
  };

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon variant="subtle" aria-label="Booking actions">
          <IconDots size={18} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconX size={16} />} color="red" onClick={handleCancel}>
          Cancel booking
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
