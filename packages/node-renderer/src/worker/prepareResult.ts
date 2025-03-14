import {
  formatExceptionMessage,
  errorResponseResult,
  isReadableStream,
  isErrorRenderResult,
  handleStreamError,
  ResponseResult,
  RenderResult,
} from '../shared/utils';
import * as errorReporter from '../shared/errorReporter';

/**
 * Prepares the rendering result from the VM execution
 * @param renderingRequest The rendering request string
 * @param bundleFilePathPerTimestamp Path to the bundle file
 * @returns Promise with the response result
 */
export async function prepareResult(result: RenderResult, renderingRequest: string): Promise<ResponseResult> {
  try {
    let exceptionMessage = null;
    if (!result) {
      const error = new Error('INVALID NIL or NULL result for rendering');
      exceptionMessage = formatExceptionMessage(renderingRequest, error, 'INVALID result for prepareResult');
    } else if (isErrorRenderResult(result)) {
      ({ exceptionMessage } = result);
    }

    if (exceptionMessage) {
      return Promise.resolve(errorResponseResult(exceptionMessage));
    }

    if (isReadableStream(result)) {
      const newStreamAfterHandlingError = handleStreamError(result, (error) => {
        const msg = formatExceptionMessage(renderingRequest, error, 'Error in a rendering stream');
        errorReporter.message(msg);
      });
      return Promise.resolve({
        headers: { 'Cache-Control': 'public, max-age=31536000' },
        status: 200,
        stream: newStreamAfterHandlingError,
      });
    }

    return Promise.resolve({
      headers: { 'Cache-Control': 'public, max-age=31536000' },
      status: 200,
      data: result,
    });
  } catch (err) {
    const exceptionMessage = formatExceptionMessage(renderingRequest, err, 'Unknown error calling runInVM');
    return Promise.resolve(errorResponseResult(exceptionMessage));
  }
}
