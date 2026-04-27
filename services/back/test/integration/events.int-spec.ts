import request from 'supertest';
import { BackTestApp, createTestApp } from './setup-app';

describe('Events HTTP', () => {
  let ctx: BackTestApp;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.close();
  });

  const http = () => request(ctx.app.getHttpServer());

  it('creates, reads, updates, deletes an event', async () => {
    const create = await http()
      .post('/api/v1/events')
      .send({
        title: 'Intro',
        description: 'Quick chat',
        duration: 30,
        slug: 'intro',
      })
      .expect(201);
    expect(create.body.slug).toBe('intro');
    expect(create.body.active).toBe(true);

    await http().get('/api/v1/events').expect(200);

    const read = await http().get('/api/v1/events/intro').expect(200);
    expect(read.body.id).toBe(create.body.id);

    const upd = await http()
      .patch('/api/v1/events/intro')
      .send({ active: false })
      .expect(200);
    expect(upd.body.active).toBe(false);

    await http().delete('/api/v1/events/intro').expect(204);
    await http().get('/api/v1/events/intro').expect(404);
  });

  it('rejects duplicate slug with 409', async () => {
    await http()
      .post('/api/v1/events')
      .send({ title: 'A', description: 'd', duration: 30, slug: 'dupe' })
      .expect(201);
    const res = await http()
      .post('/api/v1/events')
      .send({ title: 'B', description: 'd', duration: 30, slug: 'dupe' })
      .expect(409);
    expect(res.body.error.code).toBe('SLUG_TAKEN');
  });

  it('rejects invalid slug pattern with 400', async () => {
    const res = await http()
      .post('/api/v1/events')
      .send({ title: 'X', description: 'd', duration: 30, slug: '1bad' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('public listing only includes active events', async () => {
    await http()
      .post('/api/v1/events')
      .send({ title: 'P1', description: 'd', duration: 30, slug: 'p1' })
      .expect(201);
    await http()
      .post('/api/v1/events')
      .send({ title: 'P2', description: 'd', duration: 30, slug: 'p2' })
      .expect(201);
    await http().patch('/api/v1/events/p2').send({ active: false }).expect(200);

    const list = await http().get('/api/v1/public/events').expect(200);
    const slugs = list.body.map((e: { slug: string }) => e.slug);
    expect(slugs).toContain('p1');
    expect(slugs).not.toContain('p2');
    await http().get('/api/v1/public/events/p2').expect(404);
  });
});
