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
exports.AdminScheduleController = void 0;
const common_1 = require("@nestjs/common");
const schedule_service_1 = require("../../core/application/schedule.service");
const weekly_schedule_dto_1 = require("../dto/weekly-schedule.dto");
let AdminScheduleController = class AdminScheduleController {
    schedule;
    constructor(schedule) {
        this.schedule = schedule;
    }
    get() {
        return this.schedule.get();
    }
    replace(body) {
        return this.schedule.replace(body);
    }
};
exports.AdminScheduleController = AdminScheduleController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AdminScheduleController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [weekly_schedule_dto_1.WeeklyScheduleDto]),
    __metadata("design:returntype", Object)
], AdminScheduleController.prototype, "replace", null);
exports.AdminScheduleController = AdminScheduleController = __decorate([
    (0, common_1.Controller)('schedule'),
    __metadata("design:paramtypes", [schedule_service_1.ScheduleService])
], AdminScheduleController);
//# sourceMappingURL=schedule.controller.js.map