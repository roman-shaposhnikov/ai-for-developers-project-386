import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingKeys, cancelAdminBooking } from '@/entities/booking';

export function useCancelAdminBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelAdminBooking(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}
