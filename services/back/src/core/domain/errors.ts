export type DomainErrorKind =
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'VALIDATION';

export class DomainError extends Error {
  readonly kind: DomainErrorKind;
  readonly code: string;

  constructor(kind: DomainErrorKind, code: string, message: string) {
    super(message);
    this.kind = kind;
    this.code = code;
    this.name = 'DomainError';
  }

  static notFound(code: string, message: string) {
    return new DomainError('NOT_FOUND', code, message);
  }

  static conflict(code: string, message: string) {
    return new DomainError('CONFLICT', code, message);
  }

  static forbidden(code: string, message: string) {
    return new DomainError('FORBIDDEN', code, message);
  }

  static validation(code: string, message: string) {
    return new DomainError('VALIDATION', code, message);
  }
}
