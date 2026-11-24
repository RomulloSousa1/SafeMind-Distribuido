import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'safemind_super_secret_key_2026';

export interface JwtPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function verifyJwtHS256(token: string, secret: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Formato de token JWT inválido.');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  const sigBuffer = Buffer.from(signatureB64);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    throw new Error('Assinatura JWT inválida: token adulterado ou chave incorreta.');
  }

  const payload = JSON.parse(base64UrlDecode(payloadB64)) as JwtPayload;
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) {
    throw new Error('Token JWT expirado.');
  }

  return payload;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      erro: 'Unauthorized',
      mensagem: 'Cabeçalho Authorization: Bearer <token> ausente ou inválido.'
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  try {
    const decoded = verifyJwtHS256(token, JWT_SECRET);
    req.user = decoded;

    const host = process.env.HOSTNAME || 'local';
    console.log(
      `[Instância: ${host}] ${req.method} ${req.originalUrl} | sub=${decoded.sub} | role=${decoded.role}`
    );

    next();
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : 'Token inválido.';
    res.status(401).json({
      erro: 'Unauthorized',
      mensagem
    });
  }
}
