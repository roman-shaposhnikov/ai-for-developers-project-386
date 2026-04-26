import {
  Alert,
  Anchor,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { bookingKeys, listAdminBookings } from '@/entities/booking';
import { CancelBookingMenu } from '@/features/bookings/cancel-booking-admin';
import { browserTimezone, dayjs, formatSlotRange } from '@/shared/lib/time';

export function BookingsPage() {
  const tz = browserTimezone();

  const query = useQuery({
    queryKey: bookingKeys.list(),
    queryFn: listAdminBookings,
  });

  return (
    <Stack>
      <Group>
        <Title order={2}>Bookings</Title>
        <Anchor c="dimmed" component="span" underline="never">
          Upcoming
        </Anchor>
      </Group>

      {query.isLoading && <Loader />}
      {query.isError && (
        <Alert color="red" title="Failed to load bookings">
          {(query.error as Error).message}
        </Alert>
      )}

      <Card withBorder p={0}>
        {query.data && query.data.length === 0 && (
          <Text c="dimmed" p="md">
            No upcoming bookings.
          </Text>
        )}
        {query.data?.map((b, idx) => (
          <Group
            key={b.id}
            justify="space-between"
            wrap="nowrap"
            p="md"
            style={{ borderTop: idx === 0 ? undefined : '1px solid var(--mantine-color-gray-3)' }}
          >
            <Group align="flex-start" gap="xl" wrap="nowrap" style={{ flex: 1 }}>
              <Stack gap={0} miw={140}>
                <Text fw={600}>{dayjs.utc(b.startTime).tz(tz).format('ddd, D MMM')}</Text>
                <Text c="dimmed" size="sm">
                  {formatSlotRange(b.startTime, b.event.duration, tz)}
                </Text>
              </Stack>
              <Stack gap={0}>
                <Text fw={500}>
                  {b.event.title} · {b.guest.name}
                </Text>
                <Text size="sm" c="dimmed">
                  {b.guest.email}
                </Text>
                {b.guest.notes && (
                  <Text size="sm" c="dimmed" mt={4} lineClamp={2}>
                    {b.guest.notes}
                  </Text>
                )}
              </Stack>
            </Group>
            <CancelBookingMenu id={b.id} guestName={b.guest.name} />
          </Group>
        ))}
      </Card>
    </Stack>
  );
}
