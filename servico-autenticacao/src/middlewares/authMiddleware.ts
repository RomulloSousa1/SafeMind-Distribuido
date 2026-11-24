import { Request, Response, NextFunction } from 'express';
import { verifyJwtHS256, JwtClaims } from '../utils/jwtUtils.js';

export interface AuthenticatedRequest extends Request {
  user?: JwtClaims;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ erro: 'Unauthorized', mensagem: 'Cabeçalho Authorization: Bearer <token> ausente.' });
    return;
  }
  try {
    req.user = verifyJwtHS256(header.substring(7).trim());
    next();
  } catch (err) {
    res.status(401).json({ erro: 'Unauthorized', mensagem: err instanceof Error ? err.message : 'Token inválido.' });
  }
}

export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== role) {
      res.status(403).json({ erro: 'Forbidden', mensagem: `Acesso restrito ao perfil ${role}.` });
      return;
    }
    next();
  };
}
