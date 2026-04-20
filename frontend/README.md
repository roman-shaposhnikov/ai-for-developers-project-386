# Book a Call - Frontend

React frontend for the "Book a Call" scheduling service. Built with React 18, TypeScript, Mantine UI, and Vite.

## Features

### Admin Panel
- Event type management (CRUD)
- Basic HTTP authentication
- Slug auto-generation with ISO 9 transliteration
- Optimistic UI updates

### Public Pages
- Event browsing
- Calendar-based slot selection
- Guest booking flow
- Booking cancellation with token

## Tech Stack

- React 18 + TypeScript
- Mantine UI (components, forms, notifications, dates)
- React Router v6
- Vite (build tool)
- Dayjs (date manipulation)

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
# Build for production
npm run build
```

Output will be in the `dist` directory.

### Environment Variables

Create `.env.development` for local development:

```
VITE_API_URL=http://localhost:3000/api/v1
```

## Project Structure

```
src/
├── api/           # API client and types
│   ├── client.ts  # HTTP client with auth
│   ├── events.ts  # Admin events API
│   ├── public.ts  # Public events API
│   └── types.ts   # TypeScript types from OpenAPI
├── components/    # React components
│   ├── Layout.tsx          # Admin layout with sidebar
│   ├── PublicLayout.tsx    # Public layout
│   ├── EventCard.tsx       # Admin event card
│   ├── PublicEventCard.tsx # Public event card
│   ├── EventForm.tsx       # Create/edit event form
│   ├── CalendarPicker.tsx  # Calendar component
│   ├── TimeSlotList.tsx    # Time slot list
│   ├── BookingForm.tsx     # Guest booking form
│   └── LoginPrompt.tsx     # Auth modal
├── pages/         # Page components
│   ├── EventsList.tsx      # Admin events list
│   ├── EventCreate.tsx     # Create event page
│   ├── EventEdit.tsx       # Edit event page
│   ├── PublicEventsList.tsx # Public landing page
│   ├── EventBooking.tsx    # Calendar + slots page
│   ├── BookingFormPage.tsx # Booking form page
│   └── BookingSuccess.tsx  # Confirmation page
├── hooks/         # Custom hooks
│   └── useAuth.ts # Authentication hook
├── utils/         # Utility functions
│   ├── slug.ts    # Transliteration and slug generation
│   └── date.ts    # Date formatting and manipulation
└── main.tsx       # Entry point
```

## Routes

### Admin Routes (require authentication)
- `/admin` → redirects to `/admin/events`
- `/admin/events` - List all events
- `/admin/events/new` - Create new event
- `/admin/events/:slug/edit` - Edit event

### Public Routes
- `/` - Public events list (landing page)
- `/e/:slug` - Event booking page with calendar
- `/e/:slug/book?slot=...` - Guest booking form
- `/bookings/:id/success?token=...` - Booking confirmation

## Authentication

The admin panel uses Basic HTTP Authentication:
- Credentials are prompted when accessing `/admin/*` routes
- Credentials are stored in memory (lost on page refresh)
- 401 responses trigger re-authentication

## API Integration

The frontend expects a backend API running on `http://localhost:3000` (configurable via `VITE_API_URL`):

- Admin endpoints: `/api/v1/events`, `/api/v1/bookings`
- Public endpoints: `/api/v1/public/events`, `/api/v1/public/bookings`

See `/workspace/api/generated/openapi.yaml` for full API specification.

## License

MIT
