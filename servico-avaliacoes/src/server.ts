import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AvaliacaoRepository } from './repositories/AvaliacaoRepository.js';
import { RespostaQuestionarioRepository } from './repositories/RespostaQuestionarioRepository.js';
import { AvaliacaoService } from './services/AvaliacaoService.js';
import { AvaliacaoController } from './controllers/AvaliacaoController.js';

dotenv.config();

const app = express();
const PORT = process.env.AVALIACOES_PORT || 3001;

app.use(cors());
app.use(express.json());

// Middleware de log de requisições de rede
app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    const duracao = Date.now() - inicio;
    console.log(`[SERVIÇO-A: AVALIAÇÕES :${PORT}] ${req.method} ${req.url} -> ${res.statusCode} (${duracao}ms)`);
  });
  next();
});

// Injeção de dependências
const avaliacaoRepo = new AvaliacaoRepository();
const respostaRepo = new RespostaQuestionarioRepository();
const avaliacaoService = new AvaliacaoService(avaliacaoRepo, respostaRepo);
const avaliacaoController = new AvaliacaoController(avaliacaoService);

// Rotas do Microsserviço A
app.get('/health', (_req, res) => {
  res.json({ servico: 'Microsserviço A (Avaliações)', porta: PORT, status: 'ONLINE', timestamp: new Date() });
});

// Rotas de Avaliações
app.get('/avaliacoes', avaliacaoController.listar);
app.get('/avaliacoes/:id', avaliacaoController.buscarPorId);
app.post('/avaliacoes', avaliacaoController.criar);

// Rotas de Questionários / Respostas
app.post('/avaliacoes/:id/respostas', avaliacaoController.submeterResposta);
app.get('/avaliacoes/:id/relatorio', avaliacaoController.obterRelatorio);

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 [Microsserviço A: Avaliações] rodando na porta ${PORT}`);
  console.log(`   Endereço: http://localhost:${PORT}`);
  console.log(`   Healthcheck: http://localhost:${PORT}/health`);
  console.log(`=======================================================`);
});
