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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicEventsController = void 0;
const common_1 = require("@nestjs/common");
const events_service_1 = require("../../core/application/events.service");
const slots_service_1 = require("../../core/application/slots.service");
const bookings_service_1 = require("../../core/application/bookings.service");
const create_booking_dto_1 = require("../dto/create-booking.dto");
let PublicEventsController = class PublicEventsController {
    events;
    slots;
    bookings;
    constructor(events, slots, bookings) {
        this.events = events;
        this.slots = slots;
        this.bookings = bookings;
    }
    list() {
        return this.events.listActive();
    }
    read(slug) {
        return this.events.getActiveBySlug(slug);
    }
    getSlots(slug, date) {
        const event = this.events.getActiveBySlug(slug);
        const slots = this.slots.getForEvent(event, date);
        return {
            date,
            eventSlug: event.slug,
            duration: event.duration,
            slots,
        };
    }
    createBooking(slug, body) {
        const booking = this.bookings.create(slug, body);
        return {
            id: booking.id,
            eventId: booking.eventId,
            startTime: booking.startTime,
            status: booking.status,
            cancelToken: booking.cancelToken,
            guest: booking.guest,
            createdAt: booking.createdAt,
        };
    }
};
exports.PublicEventsController = PublicEventsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], PublicEventsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], PublicEventsController.prototype, "read", null);
__decorate([
    (0, common_1.Get)(':slug/slots'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PublicEventsController.prototype, "getSlots", null);
__decorate([
    (0, common_1.Post)(':slug/bookings'),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_booking_dto_1.CreateBookingDto]),
    __metadata("design:returntype", void 0)
], PublicEventsController.prototype, "createBooking", null);
exports.PublicEventsController = PublicEventsController = __decorate([
    (0, common_1.Controller)('public/events'),
    __metadata("design:paramtypes", [events_service_1.EventsService,
        slots_service_1.SlotsService,
        bookings_service_1.BookingsService])
], PublicEventsController);
//# sourceMappingURL=events.controller.js.map