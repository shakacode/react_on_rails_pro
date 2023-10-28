import type { NormalizedCacheObject } from "@apollo/client";

declare global {
  interface Window {
    __APOLLO_STATE__: NormalizedCacheObject;
  }
}
