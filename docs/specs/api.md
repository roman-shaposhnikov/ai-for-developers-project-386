# Book a Call — REST API Contract Design

## Overview

A simplified appointment scheduling service inspired by cal.com. One calendar owner publishes available time for meetings; guests pick a free slot and book a call. No registration or authentication.

**Format:** TypeSpec (.tsp), compiles to OpenAPI 3.x.
**Base path:** `/api/v1/`
**Timezone:** All datetimes in UTC (ISO 8601).

---

## Resources & Data Models

### Event (persisted)

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Server-generated |
| title | string (1-100 chars) | Required |
| description | string (1-1000 chars) | Required |
| duration | integer (5-480) | Minutes |
| slug | string (1-60 chars) | URL-friendly, unique, lowercase alphanumeric + hyphens, starts with a letter. Immutable after creation. |
| active | boolean | Default `true`. When `false`, hidden from guest-facing list |
| createdAt | datetime (UTC) | Server-generated |
| updatedAt | datetime (UTC) | Server-generated |

### Schedule (persisted, singleton)

The owner's weekly availability. One record for the whole system.

```json
{
  "weekdays": {
    "monday": {
      "enabled": true,
      "blocks": [
        { "start": "09:00", "end": "12:00" },
        { "start": "14:00", "end": "17:00" }
      ]
    },
    "saturday": { "enabled": false, "blocks": [] }
  }
}
```

- Each weekday has an `enabled` flag and an array of time blocks.
- Each block: `start` and `end` in HH:MM format (UTC), at 5-minute granularity.
- Blocks must not overlap within the same day. `start` must be before `end`.

### Booking (persisted)

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Server-generated |
| eventId | UUID | References Event |
| startTime | datetime (UTC) | Must align with a valid slot |
| status | enum | `"active"` or `"cancelled"` |
| cancelToken | UUID | Returned only once on creation |
| createdAt | datetime (UTC) | Server-generated |
| guest | object | Nested guest info |
| guest.name | string (1-100 chars) | Required |
| guest.email | string | Required, valid email |
| guest.notes | string (max 500 chars) | Optional |

`endTime` is not stored. Computed as `startTime + Event.duration`.

### Slot (computed, not persisted)

| Field | Type | Notes |
|-------|------|-------|
| startTime | datetime (UTC) | |
| endTime | datetime (UTC) | `startTime + Event.duration` |

Generated on-the-fly from the schedule minus existing active bookings.

---

## API Endpoints

### Events — Owner (Admin)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/events` | Create event type |
| `GET` | `/api/v1/events` | List all event types (includes inactive) |
| `GET` | `/api/v1/events/{slug}` | Get event type by slug |
| `PATCH` | `/api/v1/events/{slug}` | Update event type (title, description, duration, active — slug is immutable) |
| `DELETE` | `/api/v1/events/{slug}` | Delete event type (fails if active bookings exist) |

### Events — Guest (Public)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/public/events` | List active event types only |
| `GET` | `/api/v1/public/events/{slug}` | Get a single active event type |

### Schedule — Owner (Admin)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/schedule` | Get current weekly schedule |
| `PUT` | `/api/v1/schedule` | Replace entire weekly schedule |

### Slots — Guest (Public)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/public/events/{slug}/slots?date=YYYY-MM-DD` | Get available slots for an event on a date |

### Bookings — Guest (Public)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/public/events/{slug}/bookings` | Create a booking |
| `DELETE` | `/api/v1/public/bookings/{id}?cancelToken={token}` | Cancel a booking (guest, requires token) |

### Bookings — Owner (Admin)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/bookings` | List upcoming active bookings across all events |
| `GET` | `/api/v1/bookings/{id}` | Get a single booking |
| `DELETE` | `/api/v1/bookings/{id}` | Cancel a booking (owner, no token needed) |

---

## Request/Response Shapes

### POST /api/v1/events

**Request:**
```json
{
  "title": "Intro Call",
  "description": "A 30-minute introductory meeting",
  "duration": 30,
  "slug": "intro-call"
}
```

**Response 201:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Intro Call",
  "description": "A 30-minute introductory meeting",
  "duration": 30,
  "slug": "intro-call",
  "active": true,
  "createdAt": "2026-04-11T10:00:00Z",
  "updatedAt": "2026-04-11T10:00:00Z"
}
```

### GET /api/v1/events

**Response 200:** Array of event objects (same shape as above). Includes inactive events.

### GET /api/v1/public/events

**Response 200:** Array of event objects. Only events where `active: true`.

### PATCH /api/v1/events/{slug}

**Request** (all fields optional, slug not accepted):
```json
{
  "title": "Discovery Call",
  "active": false
}
```

**Response 200:** Full updated event object.

### DELETE /api/v1/events/{slug}

**Response 204:** No content (success).
**Response 409:** Event has active bookings.

### GET /api/v1/schedule

**Response 200:**
```json
{
  "weekdays": {
    "monday": {
      "enabled": true,
      "blocks": [
        { "start": "09:00", "end": "12:00" },
        { "start": "14:00", "end": "17:00" }
      ]
    },
    "tuesday": { "enabled": true, "blocks": [{ "start": "09:00", "end": "17:00" }] },
    "wednesday": { "enabled": false, "blocks": [] },
    "thursday": { "enabled": true, "blocks": [{ "start": "10:00", "end": "16:00" }] },
    "friday": { "enabled": true, "blocks": [{ "start": "09:00", "end": "15:00" }] },
    "saturday": { "enabled": false, "blocks": [] },
    "sunday": { "enabled": false, "blocks": [] }
  }
}
```

### PUT /api/v1/schedule

**Request:** Same shape as GET response.
**Response 200:** The updated schedule.

### GET /api/v1/public/events/{slug}/slots?date=2026-04-15

**Response 200:**
```json
{
  "date": "2026-04-15",
  "eventSlug": "intro-call",
  "duration": 30,
  "slots": [
    { "startTime": "2026-04-15T09:00:00Z", "endTime": "2026-04-15T09:30:00Z" },
    { "startTime": "2026-04-15T09:30:00Z", "endTime": "2026-04-15T10:00:00Z" },
    { "startTime": "2026-04-15T10:00:00Z", "endTime": "2026-04-15T10:30:00Z" }
  ]
}
```

### POST /api/v1/public/events/{slug}/bookings

**Request:**
```json
{
  "startTime": "2026-04-15T09:00:00Z",
  "guest": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "notes": "Looking forward to it"
  }
}
```

**Response 201:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "startTime": "2026-04-15T09:00:00Z",
  "status": "active",
  "cancelToken": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "guest": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "notes": "Looking forward to it"
  },
  "createdAt": "2026-04-11T12:00:00Z"
}
```

The `cancelToken` is returned **only in this response**. Never included in GET responses.

### GET /api/v1/bookings

**Response 200:**
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "eventId": "550e8400-e29b-41d4-a716-446655440000",
    "startTime": "2026-04-15T09:00:00Z",
    "status": "active",
    "guest": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "notes": "Looking forward to it"
    },
    "createdAt": "2026-04-11T12:00:00Z",
    "event": {
      "title": "Intro Call",
      "slug": "intro-call",
      "duration": 30
    }
  }
]
```

Returns only bookings where `status = "active"` AND `startTime >= current UTC time`. Sorted by `startTime` ascending (nearest first). Includes a nested `event` summary. No `cancelToken` exposed.

### GET /api/v1/bookings/{id}

**Response 200:** Single booking object (same shape as list item above).

### DELETE /api/v1/bookings/{id} (Owner)

**Response 204:** No content.

### DELETE /api/v1/public/bookings/{id}?cancelToken={token} (Guest)

**Response 204:** No content.
**Response 403:** Invalid cancel token.

---

## Error Handling

All errors follow a consistent shape:

```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "The requested time slot is no longer available"
  }
}
```

### Error codes

| Endpoint | Status | Code | When |
|----------|--------|------|------|
| All | `400` | `VALIDATION_ERROR` | Missing/invalid fields |
| All | `404` | `NOT_FOUND` | Resource doesn't exist |
| POST /events | `409` | `SLUG_TAKEN` | Slug already in use |
| DELETE /events/{slug} | `409` | `HAS_ACTIVE_BOOKINGS` | Event has active bookings |
| PUT /schedule | `400` | `INVALID_SCHEDULE` | Overlapping blocks, end before start |
| GET .../slots | `400` | `DATE_OUT_OF_RANGE` | Date outside 14-day window |
| POST .../bookings | `409` | `SLOT_UNAVAILABLE` | Conflicts with existing booking or outside schedule |
| POST .../bookings | `400` | `INVALID_SLOT_TIME` | startTime doesn't align with valid slot boundary |
| DELETE /public/bookings/{id} | `403` | `INVALID_CANCEL_TOKEN` | Token doesn't match |
| DELETE /bookings/{id} | `409` | `ALREADY_CANCELLED` | Booking already cancelled |

### Validation rules

- **Event.title:** required, 1-100 characters
- **Event.slug:** required, 1-60 characters, lowercase alphanumeric + hyphens, starts with a letter
- **Event.duration:** required, integer, 5-480 minutes
- **Event.description:** required, 1-1000 characters
- **Guest.name:** required, 1-100 characters
- **Guest.email:** required, valid email format
- **Guest.notes:** optional, max 500 characters
- **Schedule blocks:** start < end, no overlapping blocks within the same day, HH:MM format at 5-minute granularity
- **Booking.startTime:** valid ISO 8601 datetime in UTC, within 14-day window, aligns to computed slot boundary

---

## Slot Computation Logic

How `GET /api/v1/public/events/{slug}/slots?date=YYYY-MM-DD` works:

1. Look up the event by slug. Get its `duration` in minutes.
2. Determine the day of week for the requested date.
3. Look up that day in the schedule. If `enabled: false`, return empty slots array.
4. For each time block on that day:
   - Generate contiguous slots of `duration` length starting from block start.
   - A slot must fit entirely within the block (e.g., 30-min event + block `09:00-10:15` yields slots at 09:00, 09:30, 10:00 only).
   - Slots advance by `duration` minutes with no gaps.
5. Remove any slot whose `[startTime, endTime)` overlaps with any **active** booking's `[startTime, startTime + that booking's event duration)` — regardless of event type.
6. If the date is today, exclude slots whose `startTime` is in the past.

### Conflict example

- Event A: 30 min. Event B: 60 min.
- Active booking exists: Event B at 10:00-11:00.
- Guest checks slots for Event A: the 10:00 and 10:30 slots are blocked (they overlap 10:00-11:00).

### Booking window

- 14-day window: `[today, today + 13 days]` inclusive.
- Requests outside this window return `400 DATE_OUT_OF_RANGE`.

---

## Design Decisions

1. **Slots are computed, not stored.** Avoids pre-generating and maintaining thousands of slot records. The 14-day window is small enough that real-time computation is fast.

2. **`/public/` prefix** separates guest-facing from admin endpoints. No auth now, but the separation makes it easy to add later.

3. **Cancel token** returned once on booking creation. Guest needs it to cancel. Owner can cancel any booking without a token.

4. **Event deletion blocked** when active bookings exist. Prevents orphaned bookings.

5. **Schedule is a singleton** replaced via PUT (not PATCH). Owner submits the full weekly config each time — simpler than partial updates for a 7-day structure.

6. **Global conflict checking.** A slot booked under any event type blocks that time for all event types. One owner, one calendar.

7. **Slug is immutable** after event creation. Prevents breaking existing booking links.

8. **TypeSpec format.** Compiles to OpenAPI 3.x for client/server code generation and documentation.

