import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import { authMiddleware } from './middlewares/authMiddleware.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { colaboradorRoutes, empresaRoutes } from './routes/cadastroRoutes.js';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS empresas (
    id TEXT PRIMARY KEY,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT NOT NULL,
    cnpj TEXT NOT NULL,
    setor_principal TEXT NOT NULL,
    ativa BOOLEAN NOT NULL DEFAULT TRUE
  );
  CREATE TABLE IF NOT EXISTS colaboradores (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    setor TEXT NOT NULL,
    cargo TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
  );`;

await initDatabase(SCHEMA, async (client) => {
  await client.query(
    `INSERT INTO empresas (id, razao_social, nome_fantasia, cnpj, setor_principal, ativa)
     VALUES ('emp-1', 'SafeMind Indústria Modelo S.A.', 'SafeMind Modelo', '12.345.678/0001-99', 'Tecnologia', TRUE)
     ON CONFLICT DO NOTHING`
  );
});

const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => {
  res.json({ status: 'UP' });
});
app.use('/api/empresas', authMiddleware, empresaRoutes);
app.use('/api/colaboradores', authMiddleware, colaboradorRoutes);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3002);
app.listen(PORT, () => console.log(`[Resource Server - Cadastros] Rodando na porta ${PORT}`));
