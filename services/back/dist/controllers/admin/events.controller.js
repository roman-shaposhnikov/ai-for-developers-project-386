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
exports.AdminEventsController = void 0;
const common_1 = require("@nestjs/common");
const events_service_1 = require("../../core/application/events.service");
const create_event_dto_1 = require("../dto/create-event.dto");
const update_event_dto_1 = require("../dto/update-event.dto");
let AdminEventsController = class AdminEventsController {
    events;
    constructor(events) {
        this.events = events;
    }
    list() {
        return this.events.list();
    }
    create(body) {
        return this.events.create(body);
    }
    read(slug) {
        return this.events.getBySlug(slug);
    }
    update(slug, body) {
        return this.events.update(slug, body);
    }
    delete(slug) {
        this.events.delete(slug);
    }
};
exports.AdminEventsController = AdminEventsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], AdminEventsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_event_dto_1.CreateEventDto]),
    __metadata("design:returntype", Object)
], AdminEventsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], AdminEventsController.prototype, "read", null);
__decorate([
    (0, common_1.Patch)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_event_dto_1.UpdateEventDto]),
    __metadata("design:returntype", Object)
], AdminEventsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':slug'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminEventsController.prototype, "delete", null);
exports.AdminEventsController = AdminEventsController = __decorate([
    (0, common_1.Controller)('events'),
    __metadata("design:paramtypes", [events_service_1.EventsService])
], AdminEventsController);
//# sourceMappingURL=events.controller.js.map