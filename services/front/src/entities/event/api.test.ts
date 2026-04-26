import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEvent, deleteEvent, listAdminEvents, updateEvent } from './api';

describe('event entity API', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function reqOf(call: unknown[]): Request {
    return call[0] as Request;
  }

  it('GET /api/v1/events returns parsed list', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: '1', slug: 'foo' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const data = await listAdminEvents();
    expect(data).toEqual([{ id: '1', slug: 'foo' }]);
    expect(reqOf(fetchMock.mock.calls[0]).url).toContain('/api/v1/events');
  });

  it('POST /api/v1/events sends body', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: '1', slug: 'demo' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await createEvent({ title: 'Demo', slug: 'demo', description: 'd', duration: 15 });
    const req = reqOf(fetchMock.mock.calls[0]);
    expect(req.method).toBe('POST');
    expect(await req.clone().json()).toMatchObject({ slug: 'demo' });
  });

  it('PATCH /api/v1/events/{slug}', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: '1', slug: 'demo', active: false }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await updateEvent('demo', { active: false });
    const req = reqOf(fetchMock.mock.calls[0]);
    expect(req.url).toContain('/api/v1/events/demo');
    expect(req.method).toBe('PATCH');
  });

  it('DELETE /api/v1/events/{slug} returns void on 204', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(deleteEvent('demo')).resolves.toBeUndefined();
  });

  it('throws ApiError on 409', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: 'CONFLICT', message: 'Has bookings' } }), {
        status: 409,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await expect(deleteEvent('demo')).rejects.toMatchObject({ status: 409, code: 'CONFLICT' });
  });
});
