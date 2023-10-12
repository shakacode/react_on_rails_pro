import 'react-on-rails';

import context from './context';
import useRSC from './useRSC';
import RSCRoute from './RSCRoute';
import type { RSCRouteProps } from './types';
import type { RenderResult } from 'react-on-rails/types/index';
import type { RSCRenderParams } from './types';

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

  renderReactServerComponent(_options: RSCRenderParams): null | string | Promise<RenderResult> {
    throw new Error('renderReactServerComponent() can only be called on the server side.');
  },

  useRSC(componentName: string, props?: Record<string, unknown>): string | null {
    return useRSC(componentName, props);
  },

  RSCRoute(props: RSCRouteProps): JSX.Element {
    return RSCRoute(props);
  },
};

export default ctx.ReactOnRailsPro;
