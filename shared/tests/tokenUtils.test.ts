import { JsonWebTokenError } from 'jsonwebtoken';
import { generateToken, validateToken } from '../src/jwt/tokenUtils';

describe('TokenUtils', () => {
  it('should reject empty token', async () => {
    const token = '';
    expect(() => validateToken(token)).toThrow(JsonWebTokenError);
  });
  it('should reject invalid token', async () => {
    const token = '1234567890';
    expect(() => validateToken(token)).toThrow(JsonWebTokenError);
  });
  it('should accept its own token', async () => {
    const token = generateToken(365) as string;
    const payload = validateToken(token);
    expect(payload).toBeDefined();
  });
  it('should accept valid token', async () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2OTE0MDc0NzksImV4cCI6NDEwMjQ0MTE5OSwiYXVkIjoidXJuOm9jZmY6Y3RjLWFwcCIsImlzcyI6InVybjpvY2ZmOmNvcmUiLCJzdWIiOiJ1cm46b2NmZjpjb21tZXJjZXRvb2xzIiwianRpIjoiMTIxOWFlYjgtZWJmNC00NjRmLTliYTgtNDhlNGE1MTk3Zjc0In0.QyqmzhM8MW0e9rWN1Y67YZA5MdVo2EbBusIS8XggZ1s';
    const payload = validateToken(token);
    expect(payload).toBeDefined();
  });
  it('should reject expired token', async () => {
    // "exp": 1577833199
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2OTE0MDc0NzksImV4cCI6MTU3NzgzMzE5OSwiYXVkIjoidXJuOm9jZmY6Y3RjLWFwcCIsImlzcyI6InVybjpvY2ZmOmNvcmUiLCJzdWIiOiJ1cm46b2NmZjpjb21tZXJjZXRvb2xzIiwianRpIjoiMTIxOWFlYjgtZWJmNC00NjRmLTliYTgtNDhlNGE1MTk3Zjc0In0.MC65M0EZ5Ka7KFfy4aa6biIXnphteuAeOmxfasTMn3o';
    expect(() => validateToken(token)).toThrow(JsonWebTokenError);
  });
  it('should reject token with wrong issuer', async () => {
    // "iss": "invalid"
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2OTE0MDc0NzksImV4cCI6NDEwMjQ0MTE5OSwiYXVkIjoidXJuOm9jZmY6Y3RjLWFwcCIsImlzcyI6ImludmFsaWQiLCJzdWIiOiJ1cm46b2NmZjpjb21tZXJjZXRvb2xzIiwianRpIjoiMTIxOWFlYjgtZWJmNC00NjRmLTliYTgtNDhlNGE1MTk3Zjc0In0.dq-MQr7iEvVgqruG3gRJAAvv1Jxpq2JoHsZwCCpWRxg';
    expect(() => validateToken(token)).toThrow(JsonWebTokenError);
  });
  it('should reject token with wrong audience', async () => {
    // "aud": "invalid"
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2OTE0MDc0NzksImV4cCI6NDEwMjQ0MTE5OSwiYXVkIjoiaW52YWxpZCIsImlzcyI6InVybjpvY2ZmOmNvcmUiLCJzdWIiOiJ1cm46b2NmZjpjb21tZXJjZXRvb2xzIiwianRpIjoiMTIxOWFlYjgtZWJmNC00NjRmLTliYTgtNDhlNGE1MTk3Zjc0In0.5EBLLiWpHTavZ47EifHx7rIL9vqBJBdC_BHiI76L-7Q';
    expect(() => validateToken(token)).toThrow(JsonWebTokenError);
  });
  it('should reject token with wrong subject', async () => {
    // "sub": "invalid"
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2OTE0MDc0NzksImV4cCI6NDEwMjQ0MTE5OSwiYXVkIjoidXJuOm9jZmY6Y3RjLWFwcCIsImlzcyI6InVybjpvY2ZmOmNvcmUiLCJzdWIiOiJpbnZhbGlkIiwianRpIjoiMTIxOWFlYjgtZWJmNC00NjRmLTliYTgtNDhlNGE1MTk3Zjc0In0.oQGgpfwGTndpr_IKC3Ah9My27rab-WWmwOTln58jGuA';
    expect(() => validateToken(token)).toThrow(JsonWebTokenError);
  });
  it('should reject token with wrong secret', async () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2OTE0MDc0NzksImV4cCI6NDEwMjQ0MTE5OSwiYXVkIjoidXJuOm9jZmY6Y3RjLWFwcCIsImlzcyI6InVybjpvY2ZmOmNvcmUiLCJzdWIiOiJ1cm46b2NmZjpjb21tZXJjZXRvb2xzIiwianRpIjoiMTIxOWFlYjgtZWJmNC00NjRmLTliYTgtNDhlNGE1MTk3Zjc0In0.3BgIVAGdAUyZ1iEW5J-rU5v8Hy5MZswulHUL0wwBHyE';
    expect(() => validateToken(token)).toThrow(JsonWebTokenError);
  });
});
