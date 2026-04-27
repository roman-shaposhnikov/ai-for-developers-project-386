"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsRepository = void 0;
const common_1 = require("@nestjs/common");
let BookingsRepository = class BookingsRepository {
    byId = new Map();
    list() {
        return Array.from(this.byId.values());
    }
    findById(id) {
        return this.byId.get(id);
    }
    listActiveUpcoming(nowIso) {
        return this.list()
            .filter((b) => b.status === 'active' && b.startTime >= nowIso)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    listActiveByEventId(eventId) {
        return this.list().filter((b) => b.eventId === eventId && b.status === 'active');
    }
    listActive() {
        return this.list().filter((b) => b.status === 'active');
    }
    save(booking) {
        this.byId.set(booking.id, booking);
    }
};
exports.BookingsRepository = BookingsRepository;
exports.BookingsRepository = BookingsRepository = __decorate([
    (0, common_1.Injectable)()
], BookingsRepository);
//# sourceMappingURL=bookings.repo.js.map