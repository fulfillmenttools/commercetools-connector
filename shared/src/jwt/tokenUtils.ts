import { JwtPayload, sign, verify } from 'jsonwebtoken';
import { readConfiguration } from '../utils';
import { randomUUID } from 'crypto';

export function generateToken(validityDays: number): string | undefined {
  return sign({}, readConfiguration().jwtSecret, {
    audience: readConfiguration().jwtAudience,
    issuer: readConfiguration().jwtIssuer,
    subject: readConfiguration().jwtSubject,
    expiresIn: `${validityDays}d`,
    jwtid: randomUUID(),
  });
}

export function validateToken(token: string): JwtPayload {
  return verify(token, readConfiguration().jwtSecret, {
    complete: true,
    audience: readConfiguration().jwtAudience,
    issuer: readConfiguration().jwtIssuer,
    subject: readConfiguration().jwtSubject,
    algorithms: ['HS256'],
    ignoreExpiration: false,
    ignoreNotBefore: false,
  });
}
