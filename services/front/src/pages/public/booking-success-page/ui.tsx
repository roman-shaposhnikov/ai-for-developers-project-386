import {
  Alert,
  Anchor,
  Badge,
  Button,
  Code,
  Container,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Link, useLocation, useParams } from 'react-router-dom';
import type { BookingCreatedResponse } from '@/entities/booking';
import { ownerProfile, routes } from '@/shared/config/routes';
import { copyText } from '@/shared/lib/clipboard';
import { browserTimezone, formatLongDate, formatSlotRange, tzAbbreviation } from '@/shared/lib/time';

interface SuccessState {
  cancelToken?: string;
  booking?: BookingCreatedResponse;
  eventSlug?: string;
}

export function BookingSuccessPage() {
  const { id = '' } = useParams<{ id: string }>();
  const location = useLocation();
  const state = (location.state ?? {}) as SuccessState;
  const tz = browserTimezone();

  const cancelToken = state.cancelToken ?? new URLSearchParams(location.search).get('token') ?? '';
  const cancelUrl = `${window.location.origin}${routes.bookingCancel(id)}?token=${encodeURIComponent(cancelToken)}`;

  const handleCopy = async () => {
    const ok = await copyText(cancelUrl);
    notifications.show({
      color: ok ? 'green' : 'red',
      message: ok ? 'Cancellation link copied' : 'Failed to copy link',
    });
  };

  if (!state.booking) {
    return (
      <Container size="sm" py="xl">
        <Alert color="yellow" title="Booking confirmation unavailable">
          The page lost its session state on refresh. Please check your email for the confirmation
          and cancellation link.
        </Alert>
        <Group mt="md">
          <Anchor component={Link} to={routes.ownerHome}>
            ← Back to events
          </Anchor>
        </Group>
      </Container>
    );
  }

  const { booking } = state;
  // duration is not returned in BookingCreatedResponse, so we approximate from event slug context.
  // The contract gives no duration here; show only date/time and let host's email cover details.

  return (
    <Container size="sm" py="xl">
      <Group mb="md">
        <Anchor component={Link} to={routes.ownerHome}>
          ← Back
        </Anchor>
      </Group>
      <Paper withBorder p="xl">
        <Stack align="center" gap="xs" mb="md">
          <ThemeIcon color="green" size={64} radius="xl" variant="light">
            <IconCheck size={32} />
          </ThemeIcon>
          <Title order={2} ta="center">
            This meeting is scheduled
          </Title>
          <Text c="dimmed" ta="center">
            We sent an email with a calendar invitation with the details to everyone.
          </Text>
        </Stack>

        <Divider my="md" />

        <Stack gap="md">
          <Group align="flex-start" gap="xl">
            <Text fw={600} w={80}>
              When
            </Text>
            <Stack gap={0}>
              <Text>{formatLongDate(booking.startTime, tz)}</Text>
              <Text c="dimmed">
                {formatSlotRange(booking.startTime, 30, tz)} ({tzAbbreviation(tz)})
              </Text>
            </Stack>
          </Group>

          <Group align="flex-start" gap="xl">
            <Text fw={600} w={80}>
              Who
            </Text>
            <Stack gap={4}>
              <Group gap="xs">
                <Text>{ownerProfile.name}</Text>
                <Badge variant="light">Host</Badge>
              </Group>
              <Text>{booking.guest.name}</Text>
              <Text c="dimmed">{booking.guest.email}</Text>
            </Stack>
          </Group>
        </Stack>

        <Divider my="md" />

        <Stack gap="xs">
          <Text fw={600}>Need to cancel?</Text>
          <Text size="sm" c="dimmed">
            Save this link — it's the only way to cancel without contacting the host.
          </Text>
          <Group wrap="nowrap" align="center">
            <Code style={{ flex: 1, overflowX: 'auto' }}>{cancelUrl}</Code>
            <Button variant="default" leftSection={<IconCopy size={16} />} onClick={handleCopy}>
              Copy
            </Button>
          </Group>
          <Text size="sm">
            <Anchor component={Link} to={`${routes.bookingCancel(id)}?token=${cancelToken}`}>
              Open cancellation page
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
}
