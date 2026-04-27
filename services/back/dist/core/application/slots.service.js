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
exports.SlotsService = exports.computeSlots = void 0;
const common_1 = require("@nestjs/common");
const schedule_repo_1 = require("../../dal/schedule.repo");
const bookings_repo_1 = require("../../dal/bookings.repo");
const errors_1 = require("../domain/errors");
const schedule_1 = require("../domain/schedule");
const clock_1 = require("./clock");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const BOOKING_WINDOW_DAYS = 14;
const parseDateUtc = (s) => {
    if (!DATE_RE.test(s)) {
        throw errors_1.DomainError.validation('INVALID_DATE', `Date must be in YYYY-MM-DD format`);
    }
    const [y, m, d] = s.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    if (date.getUTCFullYear() !== y ||
        date.getUTCMonth() !== m - 1 ||
        date.getUTCDate() !== d) {
        throw errors_1.DomainError.validation('INVALID_DATE', `Invalid date '${s}'`);
    }
    return date;
};
const startOfUtcDay = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;
const computeSlots = (event, schedule, activeBookings, dateIso, now) => {
    const date = parseDateUtc(dateIso);
    const todayStart = startOfUtcDay(now);
    const windowEnd = new Date(todayStart.getTime() + BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    if (date.getTime() < todayStart.getTime() || date.getTime() >= windowEnd.getTime()) {
        throw errors_1.DomainError.validation('OUT_OF_WINDOW', `Date must be within the ${BOOKING_WINDOW_DAYS}-day booking window`);
    }
    const weekday = (0, schedule_1.weekdayOfUtcDate)(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    const day = schedule.weekdays[weekday];
    if (!day || !day.enabled || day.blocks.length === 0) {
        return [];
    }
    const dayStartMs = date.getTime();
    const nowMs = now.getTime();
    const duration = event.duration;
    const slots = [];
    for (const block of day.blocks) {
        const { start, end } = (0, schedule_1.blockToMinutes)(block);
        for (let m = start; m + duration <= end; m += duration) {
            const startMs = dayStartMs + m * 60_000;
            const endMs = startMs + duration * 60_000;
            if (startMs <= nowMs)
                continue;
            const collides = activeBookings.some((b) => {
                const bStart = Date.parse(b.startTime);
                const bEnd = Date.parse(b.endTime);
                return overlaps(startMs, endMs, bStart, bEnd);
            });
            if (collides)
                continue;
            slots.push({
                startTime: new Date(startMs).toISOString(),
                endTime: new Date(endMs).toISOString(),
            });
        }
    }
    return slots;
};
exports.computeSlots = computeSlots;
let SlotsService = class SlotsService {
    schedule;
    bookings;
    clock;
    constructor(schedule, bookings, clock) {
        this.schedule = schedule;
        this.bookings = bookings;
        this.clock = clock;
    }
    getForEvent(event, dateIso) {
        return (0, exports.computeSlots)(event, this.schedule.get(), this.bookings.listActive(), dateIso, this.clock.now());
    }
};
exports.SlotsService = SlotsService;
exports.SlotsService = SlotsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [schedule_repo_1.ScheduleRepository,
        bookings_repo_1.BookingsRepository,
        clock_1.Clock])
], SlotsService);
//# sourceMappingURL=slots.service.js.map