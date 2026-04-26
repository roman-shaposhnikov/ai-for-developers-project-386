import { Navigate, Route, Routes } from 'react-router-dom';
import { OwnerPage } from '@/pages/public/owner-page';
import { EventPage } from '@/pages/public/event-page';
import { BookingPage } from '@/pages/public/booking-page';
import { BookingSuccessPage } from '@/pages/public/booking-success-page';
import { BookingCancelPage } from '@/pages/public/booking-cancel-page';
import { EventTypesPage } from '@/pages/admin/event-types-page';
import { EventEditPage } from '@/pages/admin/event-edit-page';
import { BookingsPage } from '@/pages/admin/bookings-page';
import { AvailabilityPage } from '@/pages/admin/availability-page';
import { AdminShell } from '@/widgets/admin-shell';
import { routes } from '@/shared/config/routes';

export function AppRouter() {
  return (
    <Routes>
      <Route path={routes.ownerHome} element={<OwnerPage />} />
      <Route path="/booking/:id/success" element={<BookingSuccessPage />} />
      <Route path="/booking/:id/cancel" element={<BookingCancelPage />} />

      <Route path="/admin" element={<AdminShell />}>
        <Route index element={<Navigate to={routes.adminEventTypes} replace />} />
        <Route path="event-types" element={<EventTypesPage />} />
        <Route path="event-types/:slug" element={<EventEditPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="availability" element={<AvailabilityPage />} />
      </Route>

      <Route path="/:slug" element={<EventPage />} />
      <Route path="/:slug/book" element={<BookingPage />} />

      <Route path="*" element={<Navigate to={routes.ownerHome} replace />} />
    </Routes>
  );
}
