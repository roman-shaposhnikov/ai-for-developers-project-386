import request from 'supertest';
import { BackTestApp, createTestApp } from './setup-app';

const monSchedule = {
  weekdays: {
    monday: {
      enabled: true,
      blocks: [{ start: '09:00', end: '11:00' }],
    },
    tuesday: { enabled: false, blocks: [] },
    wednesday: { enabled: false, blocks: [] },
    thursday: { enabled: false, blocks: [] },
    friday: { enabled: false, blocks: [] },
    saturday: { enabled: false, blocks: [] },
    sunday: { enabled: false, blocks: [] },
  },
};

describe('Slots and bookings flow', () => {
  let ctx: BackTestApp;

  beforeAll(async () => {
    // Monday 2026-04-27, 08:00 UTC
    ctx = await createTestApp('2026-04-27T08:00:00.000Z');
  });
  afterAll(async () => {
    await ctx.close();
  });

  const http = () => request(ctx.app.getHttpServer());

  it('end-to-end booking lifecycle', async () => {
    await http().put('/api/v1/schedule').send(monSchedule).expect(200);
    await http()
      .post('/api/v1/events')
      .send({
        title: 'Intro',
        description: 'd',
        duration: 30,
        slug: 'intro',
      })
      .expect(201);

    const slotsRes = await http()
      .get('/api/v1/public/events/intro/slots?date=2026-04-27')
      .expect(200);
    expect(slotsRes.body.eventSlug).toBe('intro');
    expect(slotsRes.body.duration).toBe(30);
    expect(slotsRes.body.slots.map((s: { startTime: string }) => s.startTime)).toEqual([
      '2026-04-27T09:00:00.000Z',
      '2026-04-27T09:30:00.000Z',
      '2026-04-27T10:00:00.000Z',
      '2026-04-27T10:30:00.000Z',
    ]);

    const created = await http()
      .post('/api/v1/public/events/intro/bookings')
      .send({
        startTime: '2026-04-27T09:00:00.000Z',
        guest: { name: 'Alice', email: 'alice@example.com' },
      })
      .expect(201);
    expect(created.body.cancelToken).toBeTruthy();
    const bookingId = created.body.id;
    const cancelToken = created.body.cancelToken;

    const slots2 = await http()
      .get('/api/v1/public/events/intro/slots?date=2026-04-27')
      .expect(200);
    expect(
      slots2.body.slots.map((s: { startTime: string }) => s.startTime),
    ).not.toContain('2026-04-27T09:00:00.000Z');

    await http()
      .post('/api/v1/public/events/intro/bookings')
      .send({
        startTime: '2026-04-27T09:00:00.000Z',
        guest: { name: 'Bob', email: 'bob@example.com' },
      })
      .expect(409);

    await http()
      .post('/api/v1/public/events/intro/bookings')
      .send({
        startTime: '2026-04-27T08:30:00.000Z',
        guest: { name: 'Carol', email: 'carol@example.com' },
      })
      .expect(409);

    const adminList = await http().get('/api/v1/bookings').expect(200);
    expect(adminList.body).toHaveLength(1);
    expect(adminList.body[0].event.slug).toBe('intro');

    const wrongTok = await http()
      .delete(`/api/v1/public/bookings/${bookingId}?cancelToken=nope`)
      .expect(403);
    expect(wrongTok.body.error.code).toBe('INVALID_CANCEL_TOKEN');

    await http()
      .delete(`/api/v1/public/bookings/${bookingId}?cancelToken=${cancelToken}`)
      .expect(204);

    await http()
      .delete(`/api/v1/public/bookings/${bookingId}?cancelToken=${cancelToken}`)
      .expect(404);
  });

  it('rejects out-of-window dates with 400', async () => {
    const res = await http()
      .get('/api/v1/public/events/intro/slots?date=2026-04-26')
      .expect(400);
    expect(res.body.error.code).toBe('OUT_OF_WINDOW');
  });

  it('refuses event delete while active bookings exist (409)', async () => {
    await http()
      .post('/api/v1/events')
      .send({ title: 'Long', description: 'd', duration: 30, slug: 'long' })
      .expect(201);
    const created = await http()
      .post('/api/v1/public/events/long/bookings')
      .send({
        startTime: '2026-04-27T10:00:00.000Z',
        guest: { name: 'D', email: 'dan@example.com' },
      })
      .expect(201);

    const conflict = await http().delete('/api/v1/events/long').expect(409);
    expect(conflict.body.error.code).toBe('EVENT_HAS_BOOKINGS');

    await http()
      .delete(`/api/v1/public/bookings/${created.body.id}?cancelToken=${created.body.cancelToken}`)
      .expect(204);
    await http().delete('/api/v1/events/long').expect(204);
  });
});
