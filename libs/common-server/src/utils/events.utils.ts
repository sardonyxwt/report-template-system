import { HttpException } from '@nestjs/common';

export const resolveEventStreamErrorMessage = (error: unknown): string => {
  if (!(error instanceof HttpException)) {
    return 'The template could not be edited with AI.';
  }

  const body = error.getResponse();

  if (typeof body === 'string') {
    return body;
  }

  if (
    body &&
    typeof body === 'object' &&
    'message' in body &&
    typeof body.message === 'string'
  ) {
    return body.message;
  }

  return 'The template could not be edited with AI.';
};
