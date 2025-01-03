/**
 * Isolates logic for request authentication. We don't want this module to know about
 * Fastify server and its Request and Reply objects. This allows to test module in isolation
 * and without async calls.
 * @module worker/authHandler
 */
import type { FastifyRequest } from './types';
declare const _default: (req: FastifyRequest) => {
    headers: {
        'Cache-Control': string;
    };
    status: number;
    data: string;
} | undefined;
export = _default;
//# sourceMappingURL=authHandler.d.ts.map