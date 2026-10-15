import crypto from 'node:crypto';

/**
 * Utilitários criptográficos seguros utilizando API nativa node:crypto
 */
export function hashPassword(senha: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verificarSenha(senha: string, hashArmazenado: string): boolean {
  try {
    const [salt, key] = hashArmazenado.split(':');
    if (!salt || !key) return false;
    const hashTentativa = crypto.scryptSync(senha, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    return crypto.timingSafeEqual(hashTentativa, keyBuffer);
  } catch {
    return false;
  }
}

export function formatarCpf(cpfLimpo: string): string {
  if (cpfLimpo.length !== 11) return cpfLimpo;
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function normalizarCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export function gerarToken(payload: { id: string; cpf: string; nome?: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64url');
  const segredo = process.env.JWT_SECRET || 'safemind-jwt-secret-key-2026';
  const assinatura = crypto.createHmac('sha256', segredo).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${assinatura}`;
}

export function validarToken(token: string): { id: string; cpf: string; nome?: string } | null {
  try {
    const [header, body, assinatura] = token.split('.');
    if (!header || !body || !assinatura) return null;
    const segredo = process.env.JWT_SECRET || 'safemind-jwt-secret-key-2026';
    const esperada = crypto.createHmac('sha256', segredo).update(`${header}.${body}`).digest('base64url');
    if (assinatura !== esperada) return null;
    const dados = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (dados.exp && Date.now() > dados.exp) return null;
    return { id: dados.id, cpf: dados.cpf, nome: dados.nome };
  } catch {
    return null;
  }
}
