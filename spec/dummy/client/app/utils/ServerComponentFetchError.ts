export class ServerComponentFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServerComponentFetchError';
  }
}

export function isServerComponentFetchError(error: unknown): error is ServerComponentFetchError {
  return error instanceof ServerComponentFetchError;
}