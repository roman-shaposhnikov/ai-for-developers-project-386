import { api, unwrap } from '@/shared/api';
import type { SlotsResponse } from './model';

export const slotKeys = {
  all: ['slots'] as const,
  forDate: (slug: string, date: string) => ['slots', slug, date] as const,
};

export async function getSlots(slug: string, date: string): Promise<SlotsResponse> {
  return unwrap(
    await api.GET('/api/v1/public/events/{slug}/slots', {
      params: { path: { slug }, query: { date } },
    }),
  );
}
