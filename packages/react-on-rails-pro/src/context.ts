export default function context(this: void): Window | NodeJS.Global| typeof globalThis | void {
  return ((typeof window !== 'undefined') && (window as Window)) || ((typeof global !== 'undefined') && global) || this;
}
