export const routes = {
  ownerHome: '/',
  publicEvent: (slug: string) => `/${slug}`,
  publicEventBook: (slug: string) => `/${slug}/book`,
  bookingSuccess: (id: string) => `/booking/${id}/success`,
  bookingCancel: (id: string) => `/booking/${id}/cancel`,

  admin: '/admin',
  adminEventTypes: '/admin/event-types',
  adminEventEdit: (slug: string) => `/admin/event-types/${slug}`,
  adminBookings: '/admin/bookings',
  adminAvailability: '/admin/availability',
} as const;

export const ownerProfile = {
  name: 'Roman',
} as const;
