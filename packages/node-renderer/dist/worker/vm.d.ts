/**
 * Manages the virtual machine for rendering code in isolated context.
 * @module worker/vm
 */
import cluster from 'cluster';
import type { Readable } from 'stream';
import type { ReactOnRails as ROR } from 'react-on-rails';
/**
 * Value is set after VM created from the bundleFilePath. This value is undefined if the context is
 * not ready.
 */
export declare function getVmBundleFilePath(): string | undefined;
/**
 * The type of the result returned by executing the code payload sent in the rendering request.
 */
export type RenderCodeResult = string | Promise<string> | Readable;
/**
 * The type of the result returned by the `runInVM` function.
 *
 * Similar to {@link RenderCodeResult} returned by executing the code payload sent in the rendering request,
 * but after awaiting the promise if present and handling exceptions if any.
 */
export type RenderResult = string | Readable | {
    exceptionMessage: string;
};
declare global {
    var ReactOnRails: ROR | undefined;
}
export declare function buildVM(filePath: string): Promise<boolean>;
/**
 *
 * @param renderingRequest JS Code to execute for SSR
 * @param vmCluster
 */
export declare function runInVM(renderingRequest: string, vmCluster?: typeof cluster): Promise<RenderResult>;
export declare function resetVM(): void;
//# sourceMappingURL=vm.d.ts.map