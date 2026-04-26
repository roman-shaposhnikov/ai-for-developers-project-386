import { useMutation, useQueryClient } from '@tanstack/react-query';
import { replaceSchedule, scheduleKeys, type WeeklySchedule } from '@/entities/schedule';
import { localBlocksToUtc } from '@/shared/lib/time';

export function useSaveSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ localWeek, tz }: { localWeek: WeeklySchedule['weekdays']; tz: string }) => {
      const utcWeekdays = localBlocksToUtc(localWeek, tz);
      return replaceSchedule({ weekdays: utcWeekdays });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.current });
    },
  });
}
