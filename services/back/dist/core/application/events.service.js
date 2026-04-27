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
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const events_repo_1 = require("../../dal/events.repo");
const bookings_repo_1 = require("../../dal/bookings.repo");
const errors_1 = require("../domain/errors");
const ids_1 = require("../domain/ids");
let EventsService = class EventsService {
    events;
    bookings;
    constructor(events, bookings) {
        this.events = events;
        this.bookings = bookings;
    }
    list() {
        return this.events.list();
    }
    listActive() {
        return this.events.list().filter((e) => e.active);
    }
    getBySlug(slug) {
        const event = this.events.findBySlug(slug);
        if (!event) {
            throw errors_1.DomainError.notFound('EVENT_NOT_FOUND', `Event '${slug}' not found`);
        }
        return event;
    }
    getActiveBySlug(slug) {
        const event = this.getBySlug(slug);
        if (!event.active) {
            throw errors_1.DomainError.notFound('EVENT_NOT_FOUND', `Event '${slug}' not found`);
        }
        return event;
    }
    create(input) {
        if (this.events.findBySlug(input.slug)) {
            throw errors_1.DomainError.conflict('SLUG_TAKEN', `Event with slug '${input.slug}' already exists`);
        }
        const now = new Date().toISOString();
        const event = {
            id: (0, ids_1.genId)(),
            title: input.title,
            description: input.description,
            duration: input.duration,
            slug: input.slug,
            active: true,
            createdAt: now,
            updatedAt: now,
        };
        this.events.save(event);
        return event;
    }
    update(slug, input) {
        const event = this.getBySlug(slug);
        const next = {
            ...event,
            title: input.title ?? event.title,
            description: input.description ?? event.description,
            duration: input.duration ?? event.duration,
            active: input.active ?? event.active,
            updatedAt: new Date().toISOString(),
        };
        this.events.save(next);
        return next;
    }
    delete(slug) {
        const event = this.getBySlug(slug);
        const active = this.bookings.listActiveByEventId(event.id);
        if (active.length > 0) {
            throw errors_1.DomainError.conflict('EVENT_HAS_BOOKINGS', `Cannot delete event with active bookings`);
        }
        this.events.delete(event.id);
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [events_repo_1.EventsRepository,
        bookings_repo_1.BookingsRepository])
], EventsService);
//# sourceMappingURL=events.service.js.map