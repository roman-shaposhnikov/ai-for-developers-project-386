import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEvent, eventKeys, type CreateEventRequest } from '@/entities/event';

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateEventRequest) => createEvent(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}
