import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventKeys, updateEvent, type Event } from '@/entities/event';

export function useToggleActive() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, active }: { slug: string; active: boolean }) =>
      updateEvent(slug, { active }),
    onMutate: async ({ slug, active }) => {
      await qc.cancelQueries({ queryKey: eventKeys.adminList() });
      const prev = qc.getQueryData<Event[]>(eventKeys.adminList());
      qc.setQueryData<Event[]>(eventKeys.adminList(), (old) =>
        old?.map((e) => (e.slug === slug ? { ...e, active } : e)),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(eventKeys.adminList(), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}
