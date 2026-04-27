"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const serve_static_1 = require("@nestjs/serve-static");
const node_path_1 = require("node:path");
const events_repo_1 = require("./dal/events.repo");
const bookings_repo_1 = require("./dal/bookings.repo");
const schedule_repo_1 = require("./dal/schedule.repo");
const events_service_1 = require("./core/application/events.service");
const schedule_service_1 = require("./core/application/schedule.service");
const slots_service_1 = require("./core/application/slots.service");
const bookings_service_1 = require("./core/application/bookings.service");
const clock_1 = require("./core/application/clock");
const events_controller_1 = require("./controllers/admin/events.controller");
const schedule_controller_1 = require("./controllers/admin/schedule.controller");
const bookings_controller_1 = require("./controllers/admin/bookings.controller");
const events_controller_2 = require("./controllers/public/events.controller");
const bookings_controller_2 = require("./controllers/public/bookings.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: process.env.STATIC_ROOT ?? (0, node_path_1.join)(process.cwd(), 'public'),
                exclude: ['/api/(.*)'],
                serveStaticOptions: { fallthrough: true },
            }),
        ],
        controllers: [
            events_controller_1.AdminEventsController,
            schedule_controller_1.AdminScheduleController,
            bookings_controller_1.AdminBookingsController,
            events_controller_2.PublicEventsController,
            bookings_controller_2.PublicBookingsController,
        ],
        providers: [
            events_repo_1.EventsRepository,
            bookings_repo_1.BookingsRepository,
            schedule_repo_1.ScheduleRepository,
            events_service_1.EventsService,
            schedule_service_1.ScheduleService,
            slots_service_1.SlotsService,
            bookings_service_1.BookingsService,
            clock_1.Clock,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map