import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { hashPassword } from './utils/cryptoUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.AUTENTICACAO_DB_PATH
  ? path.resolve(process.cwd(), process.env.AUTENTICACAO_DB_PATH)
  : path.resolve(__dirname, '../data/autenticacao.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);

// Ativa WAL mode para concorrência e integridade
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initAutenticacaoDatabase(): void {
  // Criação da tabela de Usuários
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      cpf TEXT NOT NULL UNIQUE,
      cpfFormatado TEXT,
      nome TEXT,
      senhaHash TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      criadoEm TEXT NOT NULL,
      atualizadoEm TEXT NOT NULL
    );
  `);

  // Índice para busca rápida de CPF
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios(cpf);
  `);

  // Seed de usuário inicial para testes
  const existeUsuario = db.prepare('SELECT id FROM usuarios WHERE cpf = ?').get('12345678900');
  if (!existeUsuario) {
    const agora = new Date().toISOString();
    const hash = hashPassword('SafeMind@2026');

    db.prepare(`
      INSERT INTO usuarios (id, cpf, cpfFormatado, nome, senhaHash, ativo, criadoEm, atualizadoEm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'usr-admin-1',
      '12345678900',
      '123.456.789-00',
      'Administrador SafeMind',
      hash,
      1,
      agora,
      agora
    );
  }
}
