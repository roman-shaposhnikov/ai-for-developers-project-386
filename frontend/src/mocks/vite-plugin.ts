import type { Plugin } from 'vite';
import { createMiddleware } from './middleware';

export function mswPlugin(): Plugin {
  return {
    name: 'vite-plugin-msw',
    configureServer(server) {
      // Add MSW middleware before other middlewares
      server.middlewares.use(createMiddleware());
    },
  };
}
