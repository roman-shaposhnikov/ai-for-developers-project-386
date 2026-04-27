"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainError = void 0;
class DomainError extends Error {
    kind;
    code;
    constructor(kind, code, message) {
        super(message);
        this.kind = kind;
        this.code = code;
        this.name = 'DomainError';
    }
    static notFound(code, message) {
        return new DomainError('NOT_FOUND', code, message);
    }
    static conflict(code, message) {
        return new DomainError('CONFLICT', code, message);
    }
    static forbidden(code, message) {
        return new DomainError('FORBIDDEN', code, message);
    }
    static validation(code, message) {
        return new DomainError('VALIDATION', code, message);
    }
}
exports.DomainError = DomainError;
//# sourceMappingURL=errors.js.map