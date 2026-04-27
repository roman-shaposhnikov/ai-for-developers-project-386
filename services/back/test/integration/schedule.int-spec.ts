import request from 'supertest';
import { BackTestApp, createTestApp } from './setup-app';

describe('Schedule HTTP', () => {
  let ctx: BackTestApp;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.close();
  });

  const http = () => request(ctx.app.getHttpServer());

  it('returns the default empty schedule', async () => {
    const res = await http().get('/api/v1/schedule').expect(200);
    for (const day of [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ]) {
      expect(res.body.weekdays[day]).toEqual({ enabled: false, blocks: [] });
    }
  });

  it('replaces the schedule and rejects overlapping blocks', async () => {
    const ok = {
      weekdays: {
        monday: { enabled: true, blocks: [{ start: '09:00', end: '12:00' }] },
        tuesday: { enabled: false, blocks: [] },
        wednesday: { enabled: false, blocks: [] },
        thursday: { enabled: false, blocks: [] },
        friday: { enabled: false, blocks: [] },
        saturday: { enabled: false, blocks: [] },
        sunday: { enabled: false, blocks: [] },
      },
    };
    await http().put('/api/v1/schedule').send(ok).expect(200);

    const overlap = {
      ...ok,
      weekdays: {
        ...ok.weekdays,
        monday: {
          enabled: true,
          blocks: [
            { start: '09:00', end: '12:00' },
            { start: '11:00', end: '13:00' },
          ],
        },
      },
    };
    const res = await http().put('/api/v1/schedule').send(overlap).expect(400);
    expect(res.body.error.code).toBe('OVERLAPPING_BLOCKS');
  });

  it('rejects bad HH:MM format with 400', async () => {
    const bad = {
      weekdays: {
        monday: {
          enabled: true,
          blocks: [{ start: '09:03', end: '12:00' }],
        },
        tuesday: { enabled: false, blocks: [] },
        wednesday: { enabled: false, blocks: [] },
        thursday: { enabled: false, blocks: [] },
        friday: { enabled: false, blocks: [] },
        saturday: { enabled: false, blocks: [] },
        sunday: { enabled: false, blocks: [] },
      },
    };
    const res = await http().put('/api/v1/schedule').send(bad).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
