import crypto from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'safemind_super_secret_key_2026';
const JWT_EXPIRES_IN = Number(process.env.JWT_EXPIRES_IN || 3600);

export interface JwtClaims {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

export function signJwtHS256(sub: string, role: string = 'USER'): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const payload: JwtClaims = {
    sub,
    role,
    iat: now,
    exp: now + JWT_EXPIRES_IN
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifyJwtHS256(token: string): JwtClaims {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Token malformado.');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const expected = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  const sigBuf = Buffer.from(signatureB64);
  const expBuf = Buffer.from(expected);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new Error('Assinatura JWT inválida.');
  }

  const payload = JSON.parse(
    Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
  ) as JwtClaims;

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expirado.');
  }

  return payload;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  return derived.length === keyBuf.length && crypto.timingSafeEqual(derived, keyBuf);
}
