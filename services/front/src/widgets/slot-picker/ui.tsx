import { useState, useMemo } from 'react';
import { Calendar } from '@mantine/dates';
import { Box, Button, Group, SegmentedControl, Stack, Text, Loader, Alert } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getSlots, slotKeys } from '@/entities/slot';
import { browserTimezone, dayjs, formatSlot, toDateParam } from '@/shared/lib/time';

const BOOKING_WINDOW_DAYS = 14;

interface Props {
  slug: string;
  onPick: (startIso: string) => void;
}

export function SlotPicker({ slug, onPick }: Props) {
  const tz = browserTimezone();
  const [selected, setSelected] = useState<Date | null>(null);
  const [hour12, setHour12] = useState<'12h' | '24h'>('24h');

  const minDate = useMemo(() => dayjs().tz(tz).startOf('day').toDate(), [tz]);
  const maxDate = useMemo(
    () =>
      dayjs()
        .tz(tz)
        .add(BOOKING_WINDOW_DAYS - 1, 'day')
        .endOf('day')
        .toDate(),
    [tz],
  );

  const dateParam = selected ? toDateParam(selected, tz) : null;

  const slotsQuery = useQuery({
    queryKey: dateParam ? slotKeys.forDate(slug, dateParam) : ['slots', slug, 'none'],
    queryFn: () => getSlots(slug, dateParam!),
    enabled: !!dateParam,
  });

  return (
    <Group align="flex-start" gap="xl" wrap="wrap">
      <Box>
        <Calendar
          minDate={minDate}
          maxDate={maxDate}
          getDayProps={(date) => ({
            selected: !!selected && dayjs(date).isSame(selected, 'day'),
            onClick: () => setSelected(date),
          })}
        />
      </Box>
      <Stack gap="sm" style={{ minWidth: 220 }}>
        {!selected && <Text c="dimmed">Pick a date to see available times.</Text>}
        {selected && (
          <>
            <Group justify="space-between">
              <Text fw={600}>{dayjs(selected).format('ddd D')}</Text>
              <SegmentedControl
                size="xs"
                value={hour12}
                onChange={(v) => setHour12(v as '12h' | '24h')}
                data={[
                  { value: '12h', label: '12h' },
                  { value: '24h', label: '24h' },
                ]}
              />
            </Group>
            {slotsQuery.isLoading && <Loader size="sm" />}
            {slotsQuery.isError && (
              <Alert color="red">{(slotsQuery.error as Error).message}</Alert>
            )}
            {slotsQuery.data && slotsQuery.data.slots.length === 0 && (
              <Text c="dimmed">No available slots on this day.</Text>
            )}
            {slotsQuery.data?.slots.map((slot) => (
              <Button
                key={slot.startTime}
                variant="default"
                fullWidth
                justify="flex-start"
                onClick={() => onPick(slot.startTime)}
              >
                <Group gap="xs">
                  <Box w={6} h={6} bg="green.6" style={{ borderRadius: '50%' }} />
                  {hour12 === '24h'
                    ? formatSlot(slot.startTime, tz)
                    : dayjs.utc(slot.startTime).tz(tz).format('h:mm A')}
                </Group>
              </Button>
            ))}
          </>
        )}
      </Stack>
    </Group>
  );
}
