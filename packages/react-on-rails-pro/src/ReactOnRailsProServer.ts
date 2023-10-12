import 'react-on-rails';

import renderReactServerComponent from './renderReactServerComponent';
import context from './context';
import type { RenderResult } from 'react-on-rails/types/index';
import type { RSCRenderParams, RSCRouteProps } from './types';

const ctx = context();

if (ctx === undefined) {
  throw new Error("The context (usually Window or NodeJS's Global) is undefined.");
}

if (ctx.ReactOnRails === undefined) {
  throw new Error(`
    The ReactOnRails value doesn't exist in the ${ctx} scope.

    Make sure to import ReactOnRails first to initialize the context.
  `);
}

ctx.ReactOnRailsPro = {
  ...ctx.ReactOnRails,

  renderReactServerComponent(options: RSCRenderParams): null | string | Promise<RenderResult> {
    return renderReactServerComponent(options);
  },

  useRSC(_componentName: string, _props?: Record<string, unknown>): string | null {
    throw new Error('useRSC() can only be called from a Client Component.');
  },

  RSCRoute(_props: RSCRouteProps): JSX.Element {
    throw new Error('RSCRoute() can only be called from a Client Component.');
  },
};

export default ctx.ReactOnRailsPro;
