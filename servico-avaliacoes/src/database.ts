import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.AVALIACOES_DB_PATH
  ? path.resolve(process.cwd(), process.env.AVALIACOES_DB_PATH)
  : path.resolve(__dirname, '../data/avaliacoes.db');

// Garante que o diretório onde o arquivo SQLite ficará exista
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);

// Ativa WAL mode para performance e chave estrangeira
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initAvaliacoesDatabase(): void {
  // Criação da tabela de Avaliações
  db.exec(`
    CREATE TABLE IF NOT EXISTS avaliacoes (
      id TEXT PRIMARY KEY,
      empresaId TEXT NOT NULL,
      empresaRazaoSocial TEXT,
      titulo TEXT NOT NULL,
      setor TEXT NOT NULL,
      status TEXT NOT NULL,
      nivelRiscoGeral TEXT,
      scoreMedio REAL,
      totalRespostas INTEGER NOT NULL DEFAULT 0,
      criadaEm TEXT NOT NULL,
      atualizadaEm TEXT NOT NULL
    );
  `);

  // Criação da tabela de Respostas de Questionário
  db.exec(`
    CREATE TABLE IF NOT EXISTS respostas_questionario (
      id TEXT PRIMARY KEY,
      avaliacaoId TEXT NOT NULL,
      colaboradorId TEXT,
      sobrecargaTrabalho INTEGER NOT NULL,
      suporteLideranca INTEGER NOT NULL,
      clarezaPapel INTEGER NOT NULL,
      ambienteFisico INTEGER NOT NULL,
      scoreIndividual REAL NOT NULL,
      nivelRisco TEXT NOT NULL,
      submetidoEm TEXT NOT NULL,
      FOREIGN KEY (avaliacaoId) REFERENCES avaliacoes(id) ON DELETE CASCADE
    );
  `);
}
