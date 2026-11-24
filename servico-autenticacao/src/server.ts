import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import { hashPassword } from './utils/jwtUtils.js';
import { authRoutes } from './routes/authRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    cpf TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    senha_hash TEXT NOT NULL,
    criado_em TEXT NOT NULL
  )`;

// ADMIN só existe via seed; o endpoint público de registro cria apenas USER.
const SEEDS = [
  { id: 'usr-default-1', cpf: '111.222.333-44', nome: 'Operador Padrão SafeMind', role: 'USER', senha: 'Senha@2026' },
  { id: 'usr-admin-1', cpf: '999.888.777-66', nome: 'Administrador SafeMind', role: 'ADMIN', senha: 'Admin@2026' }
];

await initDatabase(SCHEMA, async (client) => {
  for (const s of SEEDS) {
    await client.query(
      'INSERT INTO usuarios (id, cpf, nome, role, senha_hash, criado_em) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
      [s.id, s.cpf, s.nome, s.role, hashPassword(s.senha), new Date().toISOString()]
    );
  }
});

const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => {
  res.json({ status: 'UP' });
});
app.use('/api/auth', authRoutes);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3003);
app.listen(PORT, () => console.log(`[Authorization Server] Rodando na porta ${PORT}`));
