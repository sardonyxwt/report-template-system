import { parse } from 'cookie';
import { signedCookie } from 'cookie-parser';
import { Request } from 'express';

export type SigningRequest = Request & {
  auth?: unknown;
  cookies?: Record<string, string>;
  signedCookies?: Record<string, string>;
  user?: unknown;
};

/**
 * Creates a Passport JWT extractor that accepts signed cookies and bearer
 * tokens.
 *
 * Cookie parsing is repeated from raw headers as a fallback because Passport
 * strategies can run before Express cookie middleware has normalized every
 * request shape used in tests and adapters.
 */
export const createAuthExtractor =
  (cookieKey: string, cookieSecret: string) =>
  (req: SigningRequest): string | null => {
    if ('cookies' in req && req.cookies && cookieKey in req.cookies) {
      return req.cookies[cookieKey];
    }

    if (
      'signedCookies' in req &&
      req.signedCookies &&
      cookieKey in req.signedCookies
    ) {
      return req.signedCookies[cookieKey];
    }

    if (req.headers.cookie) {
      const cookies = parse(req.headers.cookie);

      if (cookieKey in cookies) {
        return signedCookie(cookies[cookieKey]!, cookieSecret) || null;
      }
    }

    const authorization = req.headers.authorization;

    return typeof authorization === 'string'
      ? (authorization.split(' ')[1] ?? null)
      : null;
  };
