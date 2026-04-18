import { apiClient } from './client';
import type { WeeklySchedule } from './types';

export const scheduleApi = {
  get: (): Promise<WeeklySchedule> => {
    return apiClient.get<WeeklySchedule>('/schedule');
  },

  update: (data: WeeklySchedule): Promise<WeeklySchedule> => {
    return apiClient.put<WeeklySchedule>('/schedule', data);
  },
};
