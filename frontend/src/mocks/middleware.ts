import type { Connect } from 'vite';
import { server } from './server';

let serverStarted = false;

export function createMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    if (!serverStarted) {
      server.listen({ onUnhandledRequest: 'bypass' });
      serverStarted = true;
      console.log('[MSW Server] Mock server started');
    }

    // Only intercept API requests that would go to localhost:8080
    if (req.url?.startsWith('/api/')) {
      try {
        // Create a fetch request from the incoming request
        const url = new URL(req.url, `http://localhost:8080`);
        
        const body = await new Promise<Buffer | undefined>((resolve) => {
          if (req.method === 'GET' || req.method === 'HEAD') {
            resolve(undefined);
            return;
          }
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => chunks.push(chunk));
          req.on('end', () => resolve(Buffer.concat(chunks)));
        });

        const headers: Record<string, string> = {};
        const reqHeaders = req.headers;
        for (const [key, value] of Object.entries(reqHeaders)) {
          if (value !== undefined) {
            headers[key] = Array.isArray(value) ? value.join(', ') : value;
          }
        }

        const fetchRequest = new Request(url.toString(), {
          method: req.method,
          headers,
          body: body || null,
        });

        // Try to get mocked response from MSW
        const response = await server.boundary(() => fetch(fetchRequest));

        if (response) {
          // Send mocked response
          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });
          const responseBody = await response.text();
          res.end(responseBody);
          return;
        }
      } catch (error) {
        // If MSW doesn't handle this request, continue to next middleware
        console.log('[MSW] Request not mocked:', req.url);
      }
    }

    next();
  };
}
