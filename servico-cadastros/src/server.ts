import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { EmpresaRepository } from './repositories/EmpresaRepository.js';
import { ColaboradorRepository } from './repositories/ColaboradorRepository.js';
import { EmpresaService } from './services/EmpresaService.js';
import { ColaboradorService } from './services/ColaboradorService.js';
import { EmpresaController } from './controllers/EmpresaController.js';
import { ColaboradorController } from './controllers/ColaboradorController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Middleware de log de requisições de rede
app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    const duracao = Date.now() - inicio;
    console.log(`[SERVIÇO-B: CADASTROS :${PORT}] ${req.method} ${req.url} -> ${res.statusCode} (${duracao}ms)`);
  });
  next();
});

// Injeção de dependências
const empresaRepo = new EmpresaRepository();
const colaboradorRepo = new ColaboradorRepository();

const empresaService = new EmpresaService(empresaRepo);
const colaboradorService = new ColaboradorService(colaboradorRepo, empresaRepo);

const empresaController = new EmpresaController(empresaService);
const colaboradorController = new ColaboradorController(colaboradorService);

// Rotas do Microsserviço B
app.get('/health', (_req, res) => {
  res.json({ servico: 'Microsserviço B (Cadastros)', porta: PORT, status: 'ONLINE', timestamp: new Date() });
});

// Rotas de Empresas
app.get('/empresas', empresaController.listar);
app.get('/empresas/:id', empresaController.buscarPorId);
app.post('/empresas', empresaController.criar);

// Rotas de Colaboradores
app.get('/colaboradores', colaboradorController.listarPorEmpresa);
app.get('/colaboradores/:id', colaboradorController.buscarPorId);
app.post('/colaboradores', colaboradorController.criar);

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 [Microsserviço B: Cadastros] rodando na porta ${PORT}`);
  console.log(`   Endereço: http://localhost:${PORT}`);
  console.log(`   Healthcheck: http://localhost:${PORT}/health`);
  console.log(`=======================================================`);
});
