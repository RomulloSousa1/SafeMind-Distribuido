import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AvaliacaoRepository } from './repositories/AvaliacaoRepository.js';
import { RespostaQuestionarioRepository } from './repositories/RespostaQuestionarioRepository.js';
import { AvaliacaoService } from './services/AvaliacaoService.js';
import { AvaliacaoController } from './controllers/AvaliacaoController.js';
import { RabbitMQProducer } from './messaging/RabbitMQProducer.js';
import { ProcessamentoRiscoConsumer } from './messaging/ProcessamentoRiscoConsumer.js';
import { initAvaliacoesDatabase } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.AVALIACOES_PORT || 3001;

app.use(cors());
app.use(express.json());

// Inicializa banco de dados SQLite e migrações
initAvaliacoesDatabase();

// Middleware de log de requisições de rede
app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    const duracao = Date.now() - inicio;
    console.log(`[SERVIÇO-A: AVALIAÇÕES :${PORT}] ${req.method} ${req.url} -> ${res.statusCode} (${duracao}ms)`);
  });
  next();
});

// Injeção de dependências das 5 camadas
const avaliacaoRepo = new AvaliacaoRepository();
const respostaRepo = new RespostaQuestionarioRepository();
const avaliacaoService = new AvaliacaoService(avaliacaoRepo, respostaRepo);
const avaliacaoController = new AvaliacaoController(avaliacaoService);

// Configuração do Message Broker (RabbitMQ Producer & Consumer)
const producer = new RabbitMQProducer();
const consumer = new ProcessamentoRiscoConsumer(avaliacaoService);

avaliacaoService.setPublicarEvento(async (evento) => {
  await producer.publicarRespostaSubmetida(evento);
  await consumer.processarEventoLocal(evento);
});

// Inicialização não-bloqueante das conexões com o Broker
producer.conectar().catch(() => {});
consumer.iniciar().catch(() => {});

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
  console.log(` [Microsserviço A: Avaliações] rodando na porta ${PORT}`);
  console.log(`   Endereço: http://localhost:${PORT}`);
  console.log(`   Healthcheck: http://localhost:${PORT}/health`);
  console.log(`=======================================================`);
});
