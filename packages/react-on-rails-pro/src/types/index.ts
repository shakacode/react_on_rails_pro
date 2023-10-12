import type { RouteProps, ExtractRouteParams } from 'react-router';
import type { ReactOnRails, RenderParams, RenderResult } from 'react-on-rails/types/index';

export interface RSCRenderParams extends RenderParams {
  expressRes: any | undefined;
}

export interface RSCRouteProps<
  Path extends string = string,
  Params extends { [K: string]: string | undefined } = ExtractRouteParams<Path, string>,
> extends RouteProps<Path, Params> {
  componentName: string;
  props: Record<string, unknown> | undefined;
}

export interface ReactOnRailsPro extends ReactOnRails {
  renderReactServerComponent(options: RSCRenderParams): null | string | Promise<RenderResult>;
  useRSC(componentName: string, props: Record<string, unknown> | undefined): string | null;
  RSCRoute(props: RSCRouteProps): JSX.Element;
}

declare global {
  interface Window {
    ReactOnRails: ReactOnRails;
    ReactOnRailsPro: ReactOnRailsPro;
  }

  namespace NodeJS {
    interface Global {
      ReactOnRails: ReactOnRails;
      ReactOnRailsPro: ReactOnRailsPro;
    }
  }

  var ReactOnRails: ReactOnRails;
  var ReactOnRailsPro: ReactOnRailsPro;
}
