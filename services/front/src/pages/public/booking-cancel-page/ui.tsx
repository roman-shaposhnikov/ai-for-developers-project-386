import { Alert, Container, Paper, Stack, Title } from '@mantine/core';
import { useParams, useSearchParams } from 'react-router-dom';
import { CancelBookingPublic } from '@/features/bookings/cancel-booking-public';

export function BookingCancelPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [search] = useSearchParams();
  const token = search.get('token') ?? '';

  if (!id || !token) {
    return (
      <Container size="sm" py="xl">
        <Alert color="red" title="Invalid cancellation link">
          The cancellation link is missing required parameters.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Paper withBorder p="xl">
        <Stack>
          <Title order={3}>Cancel this booking?</Title>
          <CancelBookingPublic id={id} cancelToken={token} />
        </Stack>
      </Paper>
    </Container>
  );
}
