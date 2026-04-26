import { useMutation } from '@tanstack/react-query';
import { cancelPublicBooking } from '@/entities/booking';

export function useCancelPublicBooking() {
  return useMutation({
    mutationFn: ({ id, cancelToken }: { id: string; cancelToken: string }) =>
      cancelPublicBooking(id, cancelToken),
  });
}
