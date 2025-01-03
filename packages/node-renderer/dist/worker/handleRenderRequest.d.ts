/**
 * Isolates logic for handling render request. We don't want this module to
 * Fastify server and its Request and Reply objects. This allows to test
 * module in isolation and without async calls.
 * @module worker/handleRenderRequest
 */
import { Asset, ResponseResult } from '../shared/utils';
/**
 * Creates the result for the Fastify server to use.
 * @returns Promise where the result contains { status, data, headers } to
 * send back to the browser.
 */
declare const _default: ({ renderingRequest, bundleTimestamp, providedNewBundle, assetsToCopy, }: {
    renderingRequest: string;
    bundleTimestamp: string | number;
    providedNewBundle?: Asset | null;
    assetsToCopy?: Asset[] | null;
}) => Promise<ResponseResult>;
export = _default;
//# sourceMappingURL=handleRenderRequest.d.ts.map