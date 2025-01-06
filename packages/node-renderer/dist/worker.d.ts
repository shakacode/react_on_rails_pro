/**
 * Entry point for worker process that handles requests.
 * @module worker
 */
import { Config } from './shared/configBuilder';
import { Asset } from './shared/utils';
declare module '@fastify/multipart' {
    interface MultipartFile {
        value: Asset;
    }
}
export declare const disableHttp2: () => void;
export default function run(config: Partial<Config>): import("fastify").FastifyInstance<import("http2").Http2Server, import("http2").Http2ServerRequest, import("http2").Http2ServerResponse, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault> & PromiseLike<import("fastify").FastifyInstance<import("http2").Http2Server, import("http2").Http2ServerRequest, import("http2").Http2ServerResponse, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault>>;
//# sourceMappingURL=worker.d.ts.map