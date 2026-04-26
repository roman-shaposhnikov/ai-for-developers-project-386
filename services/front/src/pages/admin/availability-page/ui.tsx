import { useMemo } from 'react';
import { Alert, Loader, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { getSchedule, scheduleKeys } from '@/entities/schedule';
import { useSaveSchedule } from '@/features/schedule/edit-week';
import { browserTimezone, utcBlocksToLocal } from '@/shared/lib/time';
import { WeekScheduleEditor } from '@/widgets/week-schedule-editor';

export function AvailabilityPage() {
  const tz = browserTimezone();
  const query = useQuery({
    queryKey: scheduleKeys.current,
    queryFn: getSchedule,
  });
  const save = useSaveSchedule();

  const localWeek = useMemo(
    () => (query.data ? utcBlocksToLocal(query.data.weekdays, tz) : null),
    [query.data, tz],
  );

  if (query.isLoading) return <Loader />;
  if (query.isError) {
    return <Alert color="red">{(query.error as Error).message}</Alert>;
  }
  if (!localWeek) return null;

  return (
    <Stack>
      <WeekScheduleEditor
        initialLocalWeek={localWeek}
        initialTz={tz}
        saving={save.isPending}
        onSave={(week, selectedTz) => {
          save.mutate(
            { localWeek: week, tz: selectedTz },
            {
              onSuccess: () => notifications.show({ color: 'green', message: 'Schedule saved' }),
              onError: (err) =>
                notifications.show({ color: 'red', message: (err as Error).message }),
            },
          );
        }}
      />
    </Stack>
  );
}
