import { randomUUID, randomBytes } from 'crypto';

export const genId = (): string => randomUUID();

export const genCancelToken = (): string =>
  randomBytes(24).toString('base64url');
