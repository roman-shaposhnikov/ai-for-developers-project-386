import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteEvent, eventKeys } from '@/entities/event';

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => deleteEvent(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}
