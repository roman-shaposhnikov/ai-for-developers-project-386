import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.OpenAPI;

@service(#{
  title: "Book a Call API",
})
@server("http://localhost:3000", "Development server")
@route("/api/v1")
namespace BookACall;

// ─── Shared Models ───

/** Standard error response. */
model ErrorBody {
  code: string;
  message: string;
}

model ErrorResponse {
  error: ErrorBody;
}

/** Guest contact information provided when creating a booking. */
model Guest {
  /** Guest full name (1-100 characters). */
  @minLength(1)
  @maxLength(100)
  name: string;

  /** Guest email address. */
  @format("email")
  email: string;

  /** Optional notes from the guest (max 500 characters). */
  @maxLength(500)
  notes?: string;
}

/** A computed available time slot. */
model Slot {
  /** Slot start time in UTC. */
  startTime: utcDateTime;

  /** Slot end time in UTC (startTime + event duration). */
  endTime: utcDateTime;
}

/** A time block within a day (e.g. 09:00-12:00). */
@example(#{ start: "09:00", end: "17:00" })
model TimeBlock {
  /** Block start time in HH:MM format (UTC). */
  @pattern("^([01]\\d|2[0-3]):[0-5][05]$")
  start: string;

  /** Block end time in HH:MM format (UTC). Must be after start. */
  @pattern("^([01]\\d|2[0-3]):[0-5][05]$")
  end: string;
}

/** Schedule configuration for a single day of the week. */
model DaySchedule {
  /** Whether this day is available for bookings. */
  enabled: boolean;

  /** Time blocks available on this day. Must not overlap. */
  blocks: TimeBlock[];
}

// ─── Event Models ───

/** An event type that guests can book. */
model Event {
  /** Server-generated unique identifier. */
  @visibility(Lifecycle.Read)
  id: string;

  /** Event title (1-100 characters). */
  @minLength(1)
  @maxLength(100)
  title: string;

  /** Event description (1-1000 characters). */
  @minLength(1)
  @maxLength(1000)
  description: string;

  /** Event duration in minutes (5-480). */
  @minValue(5)
  @maxValue(480)
  duration: int32;

  /**
   * URL-friendly identifier. Lowercase alphanumeric and hyphens,
   * must start with a letter. Immutable after creation.
   */
  @minLength(1)
  @maxLength(60)
  @pattern("^[a-z][a-z0-9-]*$")
  slug: string;

  /** Whether the event is visible to guests. Default: true. */
  active: boolean;

  /** Server-generated creation timestamp. */
  @visibility(Lifecycle.Read)
  createdAt: utcDateTime;

  /** Server-generated last update timestamp. */
  @visibility(Lifecycle.Read)
  updatedAt: utcDateTime;
}

/** Request body for creating an event. */
model CreateEventRequest {
  @minLength(1)
  @maxLength(100)
  title: string;

  @minLength(1)
  @maxLength(1000)
  description: string;

  @minValue(5)
  @maxValue(480)
  duration: int32;

  @minLength(1)
  @maxLength(60)
  @pattern("^[a-z][a-z0-9-]*$")
  slug: string;
}

/** Request body for updating an event. Slug is immutable. */
model UpdateEventRequest {
  @minLength(1)
  @maxLength(100)
  title?: string;

  @minLength(1)
  @maxLength(1000)
  description?: string;

  @minValue(5)
  @maxValue(480)
  duration?: int32;

  active?: boolean;
}

// ─── Schedule Models ───

/** Owner's weekly availability schedule (singleton). */
model WeeklySchedule {
  weekdays: Weekdays;
}

model Weekdays {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

// ─── Booking Models ───

/** Booking status. */
enum BookingStatus {
  active,
  cancelled,
}

/** A booking created by a guest. */
model Booking {
  /** Server-generated unique identifier. */
  @visibility(Lifecycle.Read)
  id: string;

  /** ID of the booked event type. */
  @visibility(Lifecycle.Read)
  eventId: string;

  /** Booking start time in UTC. */
  startTime: utcDateTime;

  /** Booking status. */
  @visibility(Lifecycle.Read)
  status: BookingStatus;

  /** Guest contact information. */
  guest: Guest;

  /** Server-generated creation timestamp. */
  @visibility(Lifecycle.Read)
  createdAt: utcDateTime;
}

/** Response returned when a booking is created. Includes the one-time cancelToken. */
model BookingCreatedResponse {
  id: string;
  eventId: string;
  startTime: utcDateTime;
  status: BookingStatus;

  /** One-time cancel token. Only returned on creation. */
  cancelToken: string;

  guest: Guest;
  createdAt: utcDateTime;
}

/** Request body for creating a booking. */
model CreateBookingRequest {
  /** Desired slot start time in UTC. Must align with a valid slot. */
  startTime: utcDateTime;

  /** Guest contact information. */
  guest: Guest;
}

/** Booking with nested event summary, returned in admin list/detail views. */
model BookingWithEvent {
  id: string;
  eventId: string;
  startTime: utcDateTime;
  status: BookingStatus;
  guest: Guest;
  createdAt: utcDateTime;

  /** Summary of the associated event type. */
  event: EventSummary;
}

/** Abbreviated event info embedded in booking responses. */
model EventSummary {
  title: string;
  slug: string;
  duration: int32;
}

/** Response for the available slots query. */
model SlotsResponse {
  /** The queried date (YYYY-MM-DD). */
  date: string;

  /** Slug of the event type. */
  eventSlug: string;

  /** Duration of the event in minutes. */
  duration: int32;

  /** Available time slots. */
  slots: Slot[];
}

// ─── Admin: Events ───

@route("/events")
@tag("Admin: Events")
namespace AdminEvents {
  /** Create a new event type. */
  @post
  op create(@body body: CreateEventRequest): {
    @statusCode statusCode: 201;
    @body body: Event;
  } | {
    @statusCode statusCode: 409;
    @body body: ErrorResponse;
  };

  /** List all event types (includes inactive). */
  @get
  op list(): {
    @statusCode statusCode: 200;
    @body body: Event[];
  };

  /** Get a single event type by slug. */
  @route("/{slug}")
  @get
  op read(@path slug: string): {
    @statusCode statusCode: 200;
    @body body: Event;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };

  /** Update an event type. Slug is immutable. */
  @route("/{slug}")
  @patch
  op update(@path slug: string, @body body: UpdateEventRequest): {
    @statusCode statusCode: 200;
    @body body: Event;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };

  /** Delete an event type. Fails if active bookings exist. */
  @route("/{slug}")
  @delete
  op delete(@path slug: string): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 409;
    @body body: ErrorResponse;
  };
}

// ─── Admin: Schedule ───

@route("/schedule")
@tag("Admin: Schedule")
namespace AdminSchedule {
  /** Get the current weekly schedule. */
  @get
  op get(): {
    @statusCode statusCode: 200;
    @body body: WeeklySchedule;
  };

  /** Replace the entire weekly schedule. */
  @put
  op replace(@body body: WeeklySchedule): {
    @statusCode statusCode: 200;
    @body body: WeeklySchedule;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  };
}

// ─── Admin: Bookings ───

@route("/bookings")
@tag("Admin: Bookings")
namespace AdminBookings {
  /**
   * List upcoming active bookings across all event types.
   * Returns bookings where status=active and startTime >= now,
   * sorted by startTime ascending.
   */
  @get
  op list(): {
    @statusCode statusCode: 200;
    @body body: BookingWithEvent[];
  };

  /** Get a single booking by ID. */
  @route("/{id}")
  @get
  op read(@path id: string): {
    @statusCode statusCode: 200;
    @body body: BookingWithEvent;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };

  /** Cancel a booking (owner, no token needed). */
  @route("/{id}")
  @delete
  op cancel(@path id: string): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 409;
    @body body: ErrorResponse;
  };
}

// ─── Public: Events ───

@route("/public/events")
@tag("Public: Events")
namespace PublicEvents {
  /** List active event types visible to guests. */
  @get
  op list(): {
    @statusCode statusCode: 200;
    @body body: Event[];
  };

  /** Get a single active event type by slug. */
  @route("/{slug}")
  @get
  op read(@path slug: string): {
    @statusCode statusCode: 200;
    @body body: Event;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };

  /** Get available slots for an event on a specific date. */
  @route("/{slug}/slots")
  @get
  op getSlots(
    @path slug: string,

    /** Date to query slots for (YYYY-MM-DD). Must be within the 14-day booking window. */
    @query date: string,
  ): {
    @statusCode statusCode: 200;
    @body body: SlotsResponse;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };

  /** Create a booking for an event. */
  @route("/{slug}/bookings")
  @post
  op createBooking(
    @path slug: string,
    @body body: CreateBookingRequest,
  ): {
    @statusCode statusCode: 201;
    @body body: BookingCreatedResponse;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 409;
    @body body: ErrorResponse;
  };
}

// ─── Public: Bookings ───

@route("/public/bookings")
@tag("Public: Bookings")
namespace PublicBookings {
  /** Cancel a booking (guest). Requires the cancel token from booking creation. */
  @route("/{id}")
  @delete
  op cancel(
    @path id: string,

    /** The cancel token received when the booking was created. */
    @query cancelToken: string,
  ): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 403;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };
}
