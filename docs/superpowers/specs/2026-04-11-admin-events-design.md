# Admin Panel — Event Management Design

## Overview

Admin panel frontend for managing event types in the "Book a Call" scheduling service. This module provides the calendar owner with CRUD operations for event types (meeting types that guests can book).

**Tech Stack:** React 18 + TypeScript + Mantine UI + Vite + React Router v6  
**Target Browser:** Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)

---

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/admin` | Redirect | → `/admin/events` |
| `/admin/events` | EventsList | List all event types with actions |
| `/admin/events/new` | EventCreate | Form to create new event |
| `/admin/events/:slug/edit` | EventEdit | Form to edit existing event |

---

## Component Structure

```
src/
├── components/
│   ├── Layout.tsx              # Sidebar + main content area
│   ├── EventCard.tsx           # Single event item in list
│   ├── EventForm.tsx           # Reusable form (create/edit)
│   └── EmptyState.tsx          # When no events exist
├── pages/
│   ├── EventsList.tsx          # Events listing page
│   ├── EventCreate.tsx         # Create event page
│   └── EventEdit.tsx           # Edit event page
├── api/
│   ├── client.ts               # HTTP client with auth
│   ├── events.ts               # Events API methods
│   └── types.ts                # TypeScript types from OpenAPI
├── utils/
│   └── slug.ts                 # ISO 9 transliteration
└── hooks/
    └── useAuth.ts              # Basic auth management
```

---

## Authentication

### Basic HTTP Auth

All `/admin/*` routes require Basic HTTP authentication.

**Flow:**
1. User navigates to `/admin/*`
2. Browser native prompt for username/password
3. Credentials encoded to Base64, sent in `Authorization: Basic <token>` header
4. Credentials stored in memory (not localStorage) - lost on page refresh
5. 401 response triggers re-authentication prompt

**Implementation:**
```typescript
// Credentials stored in API client closure
const apiClient = {
  credentials: null as { username: string; password: string } | null,
  
  async request(url: string, options?: RequestInit) {
    if (!this.credentials) {
      this.credentials = await promptForCredentials();
    }
    
    const auth = btoa(`${this.credentials.username}:${this.credentials.password}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (response.status === 401) {
      this.credentials = null;
      throw new Error('Authentication required');
    }
    
    return response;
  }
};
```

---

## Data Models

### Event (from API)

```typescript
interface Event {
  id: string;                    // UUID
  title: string;                 // 1-100 chars
  description: string;             // 1-1000 chars
  duration: number;              // 5-480 minutes
  slug: string;                  // Unique URL-friendly identifier
  active: boolean;               // Visible to guests
  createdAt: string;             // ISO 8601 datetime
  updatedAt: string;             // ISO 8601 datetime
}
```

### Form Data

```typescript
interface EventFormData {
  title: string;
  slug: string;
  duration: number;
  description: string;
  active: boolean;
}
```

---

## API Integration

### Base Configuration

**Base URL:** `http://localhost:3000/api/v1` (via VITE_API_URL env variable)

### Endpoints

| Method | Endpoint | Purpose | Response |
|--------|----------|---------|----------|
| GET | `/events` | List all events | `Event[]` |
| POST | `/events` | Create event | `Event` (201) |
| PATCH | `/events/{slug}` | Update event | `Event` (200) |
| DELETE | `/events/{slug}` | Delete event | 204 |

### Client Methods

```typescript
// api/events.ts
export const eventsApi = {
  list: () => api.get<Event[]>('/events'),
  create: (data: CreateEventRequest) => api.post<Event>('/events', data),
  update: (slug: string, data: UpdateEventRequest) => 
    api.patch<Event>(`/events/${slug}`, data),
  delete: (slug: string) => api.delete(`/events/${slug}`),
};
```

---

## Page: Events List (`/admin/events`)

### Layout

**Sidebar:**
- Logo/brand at top
- Navigation items:
  - "Event types" (active, primary color) - only functional item
  - "Bookings" (disabled/placeholder)
  - "Schedule" (disabled/placeholder)
- "View public page" link at bottom

**Main Content:**
- Header with title "Event types" and subtitle
- "+ New" button (top-right)
- List of event cards

### Event Card Component

Each card displays:

```
┌─────────────────────────────────────────────────────────────┐
│ Title                                                     │
│ /slug (gray text)                            [15m]        │
│                                                             │
│ [Active toggle]  [✏️ Edit]  [🔗 Copy link]  [⋯ Menu]     │
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
1. **Title** - Event title (bold)
2. **Slug** - URL path shown below title (muted color)
3. **Duration badge** - Gray badge (e.g., "15m", "30m", "1h")
4. **Active toggle** - Mantine Switch component
   - ON: "Active" label, green
   - OFF: "Inactive" label, gray
   - PATCH request on change with loading state
5. **Edit button** - Icon button → `/admin/events/:slug/edit`
6. **Copy link button** - Icon button → copies `${origin}/e/${slug}` to clipboard, shows toast
7. **Menu button** - Dropdown with "Delete" option

### Empty State

When no events exist:
- Centered "+ New" button
- Text: "No event types yet. Create your first event to get started."

### Sorting

Events sorted by `createdAt` descending (newest first).

### Actions

| Action | Behavior | Error Handling |
|--------|----------|----------------|
| Toggle active | PATCH request, optimistic UI with rollback on error | Toast on error, revert toggle |
| Edit | Navigate to edit page | - |
| Copy link | Copy to clipboard, Mantine notification | - |
| Delete | Browser confirm(), then DELETE request | 409 error → alert "Cannot delete: event has active bookings" |

---

## Page: Create Event (`/admin/events/new`)

### Form Fields

All fields required.

| Field | Component | Validation | Default |
|-------|-----------|------------|---------|
| **Title** | TextInput | 1-100 chars | - |
| **Slug** | TextInput | lowercase, alphanumeric + hyphens, starts with letter, 1-60 chars | Auto-generated from title |
| **Duration** | NumberInput | 5-480, step 5 | 30 |
| **Description** | Textarea | 1-1000 chars | - |
| **Active** | Switch | boolean | true |

### Slug Auto-generation

On title blur or typing (debounced 300ms):
1. Transliterate title to Latin using ISO 9
2. Lowercase
3. Replace non-alphanumeric with hyphens
4. Collapse multiple hyphens
5. Trim hyphens from ends

**Example:**
```
"Встреча на 30 минут" → "vstrecha-na-30-minut"
"Intro Call" → "intro-call"
"Test 123!" → "test-123"
```

**Manual override:** User can edit slug manually. If they edit title again, slug only updates if it matches the auto-generated pattern (not manually customized).

### Form Submission

- Button: "Create event"
- Disabled until all fields valid
- Loading state during submission
- On success: redirect to `/admin/events` with success notification
- On 409 SLUG_TAKEN: show error under slug field
- On other errors: error notification

### Cancel Behavior

"Cancel" link/button returns to `/admin/events` without saving.

---

## Page: Edit Event (`/admin/events/:slug/edit`)

### Data Loading

- Fetch event on mount: `GET /api/v1/events/{slug}`
- Show Mantine Loader while loading
- 404 → redirect to NotFound page

### Form

Same fields as Create, with differences:

| Field | State |
|-------|-------|
| Title | Editable |
| Slug | **Disabled** (immutable per API) |
| Duration | Editable |
| Description | Editable |
| Active | Editable |

### Actions

**Save:**
- Button: "Save changes"
- PATCH request with changed fields only
- Success: toast + stay on page
- Error handling same as Create

**Delete:**
- Red "Delete event" button at bottom
- Browser `confirm("Are you sure? This action cannot be undone.")`
- DELETE request
- 409 HAS_ACTIVE_BOOKINGS → alert "Cannot delete: event has active bookings. Cancel active bookings first."
- Success: redirect to list with notification

**Cancel:**
- Returns to `/admin/events`

---

## Error Handling

### Error Types

| Source | Error | UI Treatment |
|--------|-------|--------------|
| Form validation | Field errors | Mantine form error messages |
| API 400 | VALIDATION_ERROR | Map to form fields or toast |
| API 404 | NOT_FOUND | Redirect to 404 page |
| API 409 | SLUG_TAKEN | Error under slug field |
| API 409 | HAS_ACTIVE_BOOKINGS | Alert/toast with explanation |
| Network | Fetch error | Toast "Network error. Please try again." |
| Auth | 401 | Re-prompt for credentials |

### Notifications

Use Mantine notifications for:
- Success messages (create, update, delete, copy link)
- Error messages (non-field errors)

---

## Styling Guidelines

### Mantine Theme

```typescript
// theme.ts
export const theme = {
  primaryColor: 'blue',
  defaultRadius: 'md',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};
```

### Layout

- Max-width: 1200px
- Sidebar width: 240px fixed
- Content padding: 24px
- Card spacing: 16px gap

### Responsive

- Desktop (>768px): Sidebar visible, full layout
- Mobile (<768px): Sidebar becomes drawer/hamburger menu (if time permits, otherwise min-width 768px)

---

## Utilities

### Transliteration (ISO 9)

```typescript
// utils/slug.ts
const transliterationMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e',
  'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k',
  'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
  'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
  'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
  'э': 'e', 'ю': 'yu', 'я': 'ya',
};

export function transliterate(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map(char => transliterationMap[char] || char)
    .join('');
}

export function generateSlug(title: string): string {
  return transliterate(title)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

---

## Testing Considerations

### Manual Testing Checklist

- [ ] Create event with all valid data
- [ ] Create event with invalid data (validation errors display)
- [ ] Create event with duplicate slug (409 error)
- [ ] Edit event, save changes
- [ ] Edit event, verify slug is disabled
- [ ] Delete event with no bookings
- [ ] Attempt delete event with active bookings (409)
- [ ] Toggle active status on list page
- [ ] Copy link to clipboard
- [ ] Navigate between pages
- [ ] Empty state displays correctly
- [ ] Auth required on all admin routes

---

## Implementation Notes

### Out of Scope (Future Enhancements)

These are intentionally excluded from this design:

- Server-side rendering
- Real-time updates (WebSockets)
- Drag-and-drop reordering of events
- Bulk operations (delete multiple)
- Search/filter in event list
- Pagination (assumed <100 events)
- Rich text editor for description
- File uploads (images, etc.)

### API Assumptions

- Backend running on separate port (3000)
- CORS configured to allow frontend origin
- All datetimes in UTC (ISO 8601)
- No rate limiting for admin operations

---

## Design Decisions

1. **Basic HTTP Auth** - Simplest authentication for single-user admin panel. No JWT, sessions, or database tables needed.

2. **Slug auto-generation** - Reduces user friction while allowing manual override for power users.

3. **Optimistic toggle updates** - Immediate visual feedback for better UX, with silent rollback on error.

4. **Browser confirm for delete** - Sufficient for destructive action without modal overhead.

5. **No pagination** - For typical usage (<100 event types), simple list is more user-friendly.

6. **Disabled slug on edit** - API constraint (immutable slug) enforced at UI level to prevent confusion.

---

## References

- API Spec: `/workspace/docs/superpowers/specs/2026-04-11-booking-api-design.md`
- OpenAPI: `/workspace/api/generated/openapi.yaml`
- Mantine Docs: https://mantine.dev
- React Router v6: https://reactrouter.com
