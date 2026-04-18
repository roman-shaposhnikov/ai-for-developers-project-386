/**
 * E2E тесты для админ панели управления расписанием
 * @see /workspace/docs/superpowers/specs/2026-04-11-admin-events-design.md
 */

import { test, expect } from '../fixtures/test-fixtures';
import { createApiClient } from '../helpers/api-client';
import { 
  adminCredentials,
  defaultWeeklySchedule,
  fullWeeklySchedule,
  disabledDaySchedule,
} from '../fixtures/test-data';
import type { WeeklySchedule, DaySchedule } from '../fixtures/types';

test.describe('Admin Schedule Management', () => {
  let apiClient: ReturnType<typeof createApiClient>;

  test.beforeEach(async ({ request }) => {
    apiClient = createApiClient(request, adminCredentials);
    // Восстанавливаем дефолтное расписание перед каждым тестом
    await apiClient.updateSchedule(defaultWeeklySchedule);
  });

  test.afterEach(async () => {
    // Восстанавливаем дефолтное расписание после тестов
    try {
      await apiClient.updateSchedule(defaultWeeklySchedule);
    } catch {
      // Игнорируем ошибки
    }
  });

  test('должна позволять получить текущее расписание', async () => {
    const schedule = await apiClient.getSchedule();

    expect(schedule).toBeDefined();
    expect(schedule.weekdays).toBeDefined();
    expect(schedule.weekdays.monday).toBeDefined();
    expect(schedule.weekdays.tuesday).toBeDefined();
    expect(schedule.weekdays.wednesday).toBeDefined();
    expect(schedule.weekdays.thursday).toBeDefined();
    expect(schedule.weekdays.friday).toBeDefined();
    expect(schedule.weekdays.saturday).toBeDefined();
    expect(schedule.weekdays.sunday).toBeDefined();
  });

  test('должна позволять обновить расписание', async () => {
    const newSchedule: WeeklySchedule = {
      weekdays: {
        ...defaultWeeklySchedule.weekdays,
        monday: {
          enabled: true,
          blocks: [
            { start: '10:00', end: '12:00' },
            { start: '14:00', end: '16:00' },
          ],
        },
      },
    };

    const updatedSchedule = await apiClient.updateSchedule(newSchedule);

    expect(updatedSchedule.weekdays.monday.enabled).toBe(true);
    expect(updatedSchedule.weekdays.monday.blocks).toHaveLength(2);
    expect(updatedSchedule.weekdays.monday.blocks[0]!.start).toBe('10:00');
    expect(updatedSchedule.weekdays.monday.blocks[0]!.end).toBe('12:00');
  });

  test('должна позволять отключить день недели', async () => {
    const scheduleWithDisabledDay: WeeklySchedule = {
      weekdays: {
        ...defaultWeeklySchedule.weekdays,
        saturday: disabledDaySchedule,
        sunday: disabledDaySchedule,
      },
    };

    const updatedSchedule = await apiClient.updateSchedule(scheduleWithDisabledDay);

    expect(updatedSchedule.weekdays.saturday.enabled).toBe(false);
    expect(updatedSchedule.weekdays.sunday.enabled).toBe(false);
  });

  test('должна позволять добавить несколько блоков времени', async () => {
    const multiBlockDay: DaySchedule = {
      enabled: true,
      blocks: [
        { start: '09:00', end: '11:00' },
        { start: '12:00', end: '14:00' },
        { start: '15:00', end: '17:00' },
      ],
    };

    const scheduleWithMultiBlocks: WeeklySchedule = {
      weekdays: {
        ...defaultWeeklySchedule.weekdays,
        monday: multiBlockDay,
      },
    };

    const updatedSchedule = await apiClient.updateSchedule(scheduleWithMultiBlocks);

    expect(updatedSchedule.weekdays.monday.blocks).toHaveLength(3);
  });

  test('должна отклонять расписание с пересекающимися блоками', async () => {
    const invalidSchedule: WeeklySchedule = {
      weekdays: {
        ...defaultWeeklySchedule.weekdays,
        monday: {
          enabled: true,
          blocks: [
            { start: '09:00', end: '12:00' },
            { start: '11:00', end: '14:00' }, // Пересекается с первым
          ],
        },
      },
    };

    await expect(apiClient.updateSchedule(invalidSchedule)).rejects.toThrow();
  });

  test('должна отклонять блок с end раньше start', async () => {
    const invalidSchedule: WeeklySchedule = {
      weekdays: {
        ...defaultWeeklySchedule.weekdays,
        monday: {
          enabled: true,
          blocks: [
            { start: '14:00', end: '09:00' }, // end < start
          ],
        },
      },
    };

    await expect(apiClient.updateSchedule(invalidSchedule)).rejects.toThrow();
  });

  test('должна отклонять невалидный формат времени', async () => {
    const scheduleWithInvalidTime = {
      weekdays: {
        ...defaultWeeklySchedule.weekdays,
        monday: {
          enabled: true,
          blocks: [
            { start: 'invalid', end: '12:00' },
          ],
        },
      },
    };

    await expect(
      apiClient.updateSchedule(scheduleWithInvalidTime as WeeklySchedule)
    ).rejects.toThrow();
  });

  test('должна сохранять расписание полностью при обновлении', async () => {
    const fullSchedule = fullWeeklySchedule;

    const updatedSchedule = await apiClient.updateSchedule(fullSchedule);

    // Проверяем все дни недели
    for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const) {
      expect(updatedSchedule.weekdays[day].enabled).toBe(true);
      expect(updatedSchedule.weekdays[day].blocks).toHaveLength(1);
      expect(updatedSchedule.weekdays[day].blocks[0]!.start).toBe('09:00');
      expect(updatedSchedule.weekdays[day].blocks[0]!.end).toBe('17:00');
    }

    expect(updatedSchedule.weekdays.saturday.enabled).toBe(false);
    expect(updatedSchedule.weekdays.sunday.enabled).toBe(false);
  });
});
