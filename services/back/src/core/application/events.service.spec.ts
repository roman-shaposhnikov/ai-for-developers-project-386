import { EventsService } from './events.service';
import { EventsRepository } from '../../dal/events.repo';
import { BookingsRepository } from '../../dal/bookings.repo';
import { DomainError } from '../domain/errors';
import { Booking } from '../domain/booking';

const makeService = () => {
  const events = new EventsRepository();
  const bookings = new BookingsRepository();
  return { events, bookings, service: new EventsService(events, bookings) };
};

describe('EventsService', () => {
  it('creates an event with active=true and generates ids/timestamps', () => {
    const { service } = makeService();
    const created = service.create({
      title: 'Intro',
      description: 'desc',
      duration: 30,
      slug: 'intro',
    });
    expect(created.id).toBeTruthy();
    expect(created.active).toBe(true);
    expect(created.createdAt).toBe(created.updatedAt);
  });

  it('rejects duplicate slugs with 409', () => {
    const { service } = makeService();
    service.create({ title: 'A', description: 'd', duration: 30, slug: 'intro' });
    expect(() =>
      service.create({ title: 'B', description: 'd', duration: 30, slug: 'intro' }),
    ).toThrow(DomainError);
  });

  it('updates fields without touching slug', () => {
    const { service } = makeService();
    const created = service.create({
      title: 'A',
      description: 'd',
      duration: 30,
      slug: 'intro',
    });
    const updated = service.update('intro', { title: 'B', active: false });
    expect(updated.title).toBe('B');
    expect(updated.active).toBe(false);
    expect(updated.slug).toBe('intro');
    expect(updated.id).toBe(created.id);
  });

  it('refuses delete when active bookings exist', () => {
    const { service, bookings, events } = makeService();
    const created = service.create({
      title: 'A',
      description: 'd',
      duration: 30,
      slug: 'intro',
    });
    const b: Booking = {
      id: 'b1',
      eventId: created.id,
      startTime: '2026-05-01T10:00:00.000Z',
      endTime: '2026-05-01T10:30:00.000Z',
      status: 'active',
      guest: { name: 'G', email: 'g@e.x' },
      createdAt: '2026-04-27T00:00:00.000Z',
      cancelToken: 't',
    };
    bookings.save(b);
    expect(() => service.delete('intro')).toThrow(/active bookings/);
    bookings.save({ ...b, status: 'cancelled' });
    expect(() => service.delete('intro')).not.toThrow();
    expect(events.findBySlug('intro')).toBeUndefined();
  });

  it('getActiveBySlug returns 404 for inactive', () => {
    const { service } = makeService();
    service.create({ title: 'A', description: 'd', duration: 30, slug: 'intro' });
    service.update('intro', { active: false });
    expect(() => service.getActiveBySlug('intro')).toThrow(DomainError);
  });
});
