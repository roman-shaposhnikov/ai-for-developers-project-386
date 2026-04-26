import '@testing-library/jest-dom/vitest';

// Stable timezone for tests independent of host machine.
process.env.TZ ??= 'UTC';
