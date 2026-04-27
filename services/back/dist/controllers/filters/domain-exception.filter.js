"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const errors_1 = require("../../core/domain/errors");
const KIND_TO_STATUS = {
    NOT_FOUND: common_1.HttpStatus.NOT_FOUND,
    CONFLICT: common_1.HttpStatus.CONFLICT,
    FORBIDDEN: common_1.HttpStatus.FORBIDDEN,
    VALIDATION: common_1.HttpStatus.BAD_REQUEST,
};
let DomainExceptionFilter = class DomainExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        if (exception instanceof errors_1.DomainError) {
            const status = KIND_TO_STATUS[exception.kind] ?? common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            res.status(status).json({
                error: { code: exception.code, message: exception.message },
            });
            return;
        }
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const body = exception.getResponse();
            if (body &&
                typeof body === 'object' &&
                'error' in body &&
                body.error &&
                typeof body.error === 'object') {
                res.status(status).json(body);
                return;
            }
            const message = typeof body === 'string'
                ? body
                : body?.message
                    ? Array.isArray(body.message)
                        ? body.message.join('; ')
                        : body.message
                    : exception.message;
            res.status(status).json({
                error: { code: defaultCode(status), message },
            });
            return;
        }
        res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
        });
    }
};
exports.DomainExceptionFilter = DomainExceptionFilter;
exports.DomainExceptionFilter = DomainExceptionFilter = __decorate([
    (0, common_1.Catch)()
], DomainExceptionFilter);
const defaultCode = (status) => {
    switch (status) {
        case 400:
            return 'BAD_REQUEST';
        case 403:
            return 'FORBIDDEN';
        case 404:
            return 'NOT_FOUND';
        case 409:
            return 'CONFLICT';
        default:
            return 'ERROR';
    }
};
//# sourceMappingURL=domain-exception.filter.js.map