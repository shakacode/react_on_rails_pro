import React from 'react';
import { renderToPipeableStream } from 'react-server-dom-webpack/server.node';

import ComponentRegistry from 'react-on-rails/ComponentRegistry';
import buildConsoleReplay from 'react-on-rails/buildConsoleReplay';
import handleError from 'react-on-rails/handleError';

import type { ReactElement } from 'react';
import type { ReactComponent, RenderResult, RenderingError } from 'react-on-rails/types/index';
import type { RSCRenderParams } from './types';

// TODO: Cache across all workers.
let clientModuleMap: null | Object = null;

function renderReactServerComponentInternal(options: RSCRenderParams): null | string | Promise<RenderResult> {
  const { name, props, throwJsErrors, expressRes } = options;

  let renderResult: null | string | Promise<string> = null;
  let hasErrors = false;
  let renderingError: null | RenderingError = null;

  try {
    const componentObj = ComponentRegistry.get(name);
    const { component } = componentObj;
    const reactRenderingResult = React.createElement(component as ReactComponent, props);

    const processReactElement = () => {
      try {
        if (!clientModuleMap) {
          const path = require('path');
          const { readFileSync } = require('fs');
          const reactClientManifest = readFileSync(path.resolve(__dirname, 'react-client-manifest.json'), 'utf8');
          clientModuleMap = JSON.parse(reactClientManifest);
        }

        const { pipe } = renderToPipeableStream(reactRenderingResult as ReactElement, clientModuleMap);
        pipe(expressRes);

        return new Promise<string>((resolve, reject) => {
          expressRes.on('finish', resolve);
          expressRes.on('error', reject);
        });
      } catch (error) {
        console.error(error);
        throw error;
      }
    };

    renderResult = processReactElement();
  } catch (e: any) {
    if (throwJsErrors) {
      throw e;
    }

    hasErrors = true;
    renderResult = handleError({
      e,
      name,
      serverSide: true,
    });
    renderingError = e;
  }

  const consoleReplayScript = buildConsoleReplay();
  const addRenderingErrors = (resultObject: RenderResult, renderError: RenderingError) => {
    resultObject.renderingError = { // eslint-disable-line no-param-reassign
      message: renderError.message,
      stack: renderError.stack,
    };
  }

  const resolveRenderResult = async () => {
    let promiseResult;

    try {
      promiseResult = {
        html: await renderResult,
        consoleReplayScript,
        hasErrors,
      };
    } catch (e: any) {
      if (throwJsErrors) {
        throw e;
      }
      promiseResult = {
        html: handleError({
          e,
          name,
          serverSide: true,
        }),
        consoleReplayScript,
        hasErrors: true,
      }
      renderingError = e;
    }

    if (renderingError !== null) {
      addRenderingErrors(promiseResult, renderingError);
    }

    return promiseResult;
  };

  return resolveRenderResult();
}

const renderReactServerComponent: typeof renderReactServerComponentInternal = (options) => {
  try {
    return renderReactServerComponentInternal(options);
  } finally {
    // Reset console history after each render.
    // See `RubyEmbeddedJavaScript.console_polyfill` for initialization.
    console.history = [];
  }
};
export default renderReactServerComponent;
