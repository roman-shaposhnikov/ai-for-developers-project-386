"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsRepository = void 0;
const common_1 = require("@nestjs/common");
let EventsRepository = class EventsRepository {
    byId = new Map();
    slugIndex = new Map();
    list() {
        return Array.from(this.byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    findById(id) {
        return this.byId.get(id);
    }
    findBySlug(slug) {
        const id = this.slugIndex.get(slug);
        return id ? this.byId.get(id) : undefined;
    }
    save(event) {
        const existing = this.byId.get(event.id);
        if (existing && existing.slug !== event.slug) {
            this.slugIndex.delete(existing.slug);
        }
        this.byId.set(event.id, event);
        this.slugIndex.set(event.slug, event.id);
    }
    delete(id) {
        const existing = this.byId.get(id);
        if (!existing)
            return;
        this.byId.delete(id);
        this.slugIndex.delete(existing.slug);
    }
};
exports.EventsRepository = EventsRepository;
exports.EventsRepository = EventsRepository = __decorate([
    (0, common_1.Injectable)()
], EventsRepository);
//# sourceMappingURL=events.repo.js.map