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
exports.CreateEventDto = void 0;
const class_validator_1 = require("class-validator");
class CreateEventDto {
    title;
    description;
    duration;
    slug;
}
exports.CreateEventDto = CreateEventDto;
__decorate([
    (0, class_validator_1.Length)(1, 100),
    __metadata("design:type", String)
], CreateEventDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.Length)(1, 1000),
    __metadata("design:type", String)
], CreateEventDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(5),
    (0, class_validator_1.Max)(480),
    __metadata("design:type", Number)
], CreateEventDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.Length)(1, 60),
    (0, class_validator_1.Matches)(/^[a-z][a-z0-9-]*$/),
    __metadata("design:type", String)
], CreateEventDto.prototype, "slug", void 0);
//# sourceMappingURL=create-event.dto.js.map