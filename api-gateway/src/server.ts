import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import gatewayRoutes from './routes/gatewayRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Log de requisições recebidas no Gateway
app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    const duracao = Date.now() - inicio;
    console.log(`[GATEWAY :${PORT}] ${req.method} ${req.url} -> ${res.statusCode} (${duracao}ms)`);
  });
  next();
});

// Health check do Gateway
app.get('/health', (_req, res) => {
  res.json({
    servico: 'SafeMind API Gateway',
    porta: PORT,
    status: 'ONLINE',
    timestamp: new Date()
  });
});

// Montagem das rotas da API sob /api
app.use('/api', gatewayRoutes);

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌐 [API Gateway Principal] rodando na porta ${PORT}`);
  console.log(`   Endereço: http://localhost:${PORT}`);
  console.log(`   Status do Cluster: http://localhost:${PORT}/api/status-distribuido`);
  console.log(`=======================================================`);
});
