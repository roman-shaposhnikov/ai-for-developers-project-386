"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const bookings_repo_1 = require("../../dal/bookings.repo");
const schedule_repo_1 = require("../../dal/schedule.repo");
const event_1 = require("../domain/event");
const errors_1 = require("../domain/errors");
const ids_1 = require("../domain/ids");
const slots_service_1 = require("./slots.service");
const events_service_1 = require("./events.service");
const events_repo_1 = require("../../dal/events.repo");
const clock_1 = require("./clock");
let BookingsService = class BookingsService {
    bookings;
    schedule;
    events;
    eventsRepo;
    clock;
    constructor(bookings, schedule, events, eventsRepo, clock) {
        this.bookings = bookings;
        this.schedule = schedule;
        this.events = events;
        this.eventsRepo = eventsRepo;
        this.clock = clock;
    }
    create(slug, input) {
        const event = this.events.getActiveBySlug(slug);
        const startTime = input.startTime;
        if (Number.isNaN(Date.parse(startTime))) {
            throw errors_1.DomainError.validation('INVALID_START_TIME', 'startTime must be ISO 8601');
        }
        const date = startTime.slice(0, 10);
        const slots = (0, slots_service_1.computeSlots)(event, this.schedule.get(), this.bookings.listActive(), date, this.clock.now());
        const matched = slots.find((s) => Date.parse(s.startTime) === Date.parse(startTime));
        if (!matched) {
            throw errors_1.DomainError.conflict('SLOT_UNAVAILABLE', `Requested slot is not available`);
        }
        const booking = {
            id: (0, ids_1.genId)(),
            eventId: event.id,
            startTime: matched.startTime,
            endTime: matched.endTime,
            status: 'active',
            guest: input.guest,
            createdAt: new Date().toISOString(),
            cancelToken: (0, ids_1.genCancelToken)(),
        };
        this.bookings.save(booking);
        return booking;
    }
    listUpcoming() {
        const nowIso = this.clock.now().toISOString();
        const items = this.bookings.listActiveUpcoming(nowIso);
        return items
            .map((b) => this.toWithEvent(b))
            .filter((x) => x !== null);
    }
    getByIdWithEvent(id) {
        const booking = this.bookings.findById(id);
        if (!booking) {
            throw errors_1.DomainError.notFound('BOOKING_NOT_FOUND', `Booking '${id}' not found`);
        }
        const dto = this.toWithEvent(booking);
        if (!dto) {
            throw errors_1.DomainError.notFound('BOOKING_NOT_FOUND', `Booking '${id}' not found`);
        }
        return dto;
    }
    cancelByOwner(id) {
        const booking = this.bookings.findById(id);
        if (!booking) {
            throw errors_1.DomainError.notFound('BOOKING_NOT_FOUND', `Booking '${id}' not found`);
        }
        if (booking.status !== 'active') {
            throw errors_1.DomainError.conflict('BOOKING_NOT_ACTIVE', `Booking is not active`);
        }
        this.bookings.save({ ...booking, status: 'cancelled' });
    }
    cancelByGuest(id, token) {
        const booking = this.bookings.findById(id);
        if (!booking || booking.status !== 'active') {
            throw errors_1.DomainError.notFound('BOOKING_NOT_FOUND', `Booking '${id}' not found`);
        }
        if (booking.cancelToken !== token) {
            throw errors_1.DomainError.forbidden('INVALID_CANCEL_TOKEN', `Invalid cancel token`);
        }
        this.bookings.save({ ...booking, status: 'cancelled' });
    }
    toWithEvent(booking) {
        const event = this.eventsRepo.findById(booking.eventId);
        if (!event)
            return null;
        return {
            id: booking.id,
            eventId: booking.eventId,
            startTime: booking.startTime,
            status: booking.status,
            guest: booking.guest,
            createdAt: booking.createdAt,
            event: (0, event_1.toEventSummary)(event),
        };
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bookings_repo_1.BookingsRepository,
        schedule_repo_1.ScheduleRepository,
        events_service_1.EventsService,
        events_repo_1.EventsRepository,
        clock_1.Clock])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map