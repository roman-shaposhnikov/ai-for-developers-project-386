import { api, unwrap } from '@/shared/api';
import type { WeeklySchedule } from './model';

export const scheduleKeys = {
  current: ['schedule'] as const,
};

export async function getSchedule(): Promise<WeeklySchedule> {
  return unwrap(await api.GET('/api/v1/schedule'));
}

export async function replaceSchedule(body: WeeklySchedule): Promise<WeeklySchedule> {
  return unwrap(await api.PUT('/api/v1/schedule', { body }));
}
