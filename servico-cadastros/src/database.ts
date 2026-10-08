import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.CADASTROS_DB_PATH
  ? path.resolve(process.cwd(), process.env.CADASTROS_DB_PATH)
  : path.resolve(__dirname, '../data/cadastros.db');

// Garante que o diretório onde o arquivo SQLite ficará exista
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);

// Ativa WAL mode para performance e integridade de concorrência e chave estrangeira
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initCadastrosDatabase(): void {
  // Criação da tabela de Empresas
  db.exec(`
    CREATE TABLE IF NOT EXISTS empresas (
      id TEXT PRIMARY KEY,
      razaoSocial TEXT NOT NULL,
      nomeFantasia TEXT,
      cnpj TEXT NOT NULL UNIQUE,
      setorPrincipal TEXT NOT NULL,
      ativa INTEGER NOT NULL DEFAULT 1,
      criadaEm TEXT NOT NULL,
      atualizadaEm TEXT NOT NULL
    );
  `);

  // Criação da tabela de Colaboradores
  db.exec(`
    CREATE TABLE IF NOT EXISTS colaboradores (
      id TEXT PRIMARY KEY,
      empresaId TEXT NOT NULL,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      setor TEXT NOT NULL,
      cargo TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      criadoEm TEXT NOT NULL,
      atualizadoEm TEXT NOT NULL,
      FOREIGN KEY (empresaId) REFERENCES empresas(id) ON DELETE CASCADE
    );
  `);

  // Seed inicial de Empresa para testes imediatos
  const existeEmpresa = db.prepare('SELECT id FROM empresas WHERE id = ?').get('emp-1');
  if (!existeEmpresa) {
    const agora = new Date().toISOString();
    db.prepare(`
      INSERT INTO empresas (id, razaoSocial, nomeFantasia, cnpj, setorPrincipal, ativa, criadaEm, atualizadaEm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'emp-1',
      'SafeMind Indústria & Tecnologia S.A.',
      'SafeMind Tech',
      '12.345.678/0001-90',
      'Operações e Manufatura',
      1,
      agora,
      agora
    );
  }

  // Seed inicial de Colaborador para testes imediatos
  const existeColab = db.prepare('SELECT id FROM colaboradores WHERE id = ?').get('colab-1');
  if (!existeColab) {
    const agora = new Date().toISOString();
    db.prepare(`
      INSERT INTO colaboradores (id, empresaId, nome, email, setor, cargo, ativo, criadoEm, atualizadoEm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'colab-1',
      'emp-1',
      'Carlos Silva',
      'carlos.silva@safemind.com.br',
      'Operações',
      'Técnico de Produção',
      1,
      agora,
      agora
    );
  }
}
