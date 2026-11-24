import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import { authMiddleware } from './middlewares/authMiddleware.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { avaliacaoRoutes } from './routes/avaliacaoRoutes.js';
import { iniciarBroker } from './messaging/broker.js';
import { iniciarConsumidor } from './messaging/consumer.js';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS avaliacoes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    setor TEXT NOT NULL,
    criado_em TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS respostas (
    id TEXT PRIMARY KEY,
    avaliacao_id TEXT NOT NULL REFERENCES avaliacoes(id),
    sobrecarga_trabalho INTEGER NOT NULL,
    suporte_lideranca INTEGER NOT NULL,
    clareza_papel INTEGER NOT NULL,
    ambiente_fisico INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    pontuacao DOUBLE PRECISION,
    nivel_risco TEXT,
    criado_em TEXT NOT NULL,
    processado_em TEXT
  );`;

await initDatabase(SCHEMA);
void iniciarBroker(iniciarConsumidor);

const app = express();
app.use(cors());
app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader('X-Served-By', process.env.HOSTNAME || 'local');
  next();
});
app.get('/health', (_req, res) => {
  res.json({ status: 'UP' });
});
app.use('/api/avaliacoes', authMiddleware, avaliacaoRoutes);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`[Resource Server - Avaliações | Instância: ${process.env.HOSTNAME || 'local'}] Porta ${PORT}`);
});
