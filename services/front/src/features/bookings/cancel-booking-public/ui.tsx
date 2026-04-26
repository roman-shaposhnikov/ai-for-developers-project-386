import { Button, Stack, Text, Alert } from '@mantine/core';
import { useCancelPublicBooking } from './model';
import { ApiError } from '@/shared/api';

interface Props {
  id: string;
  cancelToken: string;
}

export function CancelBookingPublic({ id, cancelToken }: Props) {
  const mutation = useCancelPublicBooking();

  if (mutation.isSuccess) {
    return (
      <Alert color="green" title="Booking cancelled">
        The booking has been cancelled. The host has been notified.
      </Alert>
    );
  }

  if (mutation.isError) {
    const err = mutation.error;
    const expired =
      err instanceof ApiError && (err.status === 403 || err.status === 404);
    return (
      <Alert color={expired ? 'yellow' : 'red'} title={expired ? 'Link is no longer valid' : 'Cancellation failed'}>
        {expired
          ? 'This cancellation link has already been used or the booking no longer exists.'
          : (err as Error).message}
      </Alert>
    );
  }

  return (
    <Stack>
      <Text>Are you sure you want to cancel this booking?</Text>
      <Button
        color="red"
        loading={mutation.isPending}
        onClick={() => mutation.mutate({ id, cancelToken })}
      >
        Cancel booking
      </Button>
    </Stack>
  );
}
