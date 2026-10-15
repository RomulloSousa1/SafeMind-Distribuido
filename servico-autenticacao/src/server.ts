import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { UsuarioRepository } from './repositories/UsuarioRepository.js';
import { AuthService } from './services/AuthService.js';
import { AuthController } from './controllers/AuthController.js';
import { initAutenticacaoDatabase } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.AUTENTICACAO_PORT || 3003;

app.use(cors());
app.use(express.json());

// Inicializa banco de dados SQLite e migrações/seeds
initAutenticacaoDatabase();

// Middleware de log de requisições de rede
app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    const duracao = Date.now() - inicio;
    console.log(`[SERVIÇO-C: AUTENTICAÇÃO :${PORT}] ${req.method} ${req.url} -> ${res.statusCode} (${duracao}ms)`);
  });
  next();
});

// Injeção de dependências
const usuarioRepo = new UsuarioRepository();
const authService = new AuthService(usuarioRepo);
const authController = new AuthController(authService);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    servico: 'Microsserviço C (Autenticação)',
    porta: PORT,
    status: 'ONLINE',
    timestamp: new Date()
  });
});

// Rotas de Autenticação
app.post('/auth/registrar', authController.registrar);
app.post('/auth/login', authController.login);
app.get('/auth/validar', authController.validarToken);
app.post('/auth/validar', authController.validarToken);
app.get('/auth/usuarios/:id', authController.buscarPorId);

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` [Microsserviço C: Autenticação] rodando na porta ${PORT}`);
  console.log(`   Endereço: http://localhost:${PORT}`);
  console.log(`   Healthcheck: http://localhost:${PORT}/health`);
  console.log(`=======================================================`);
});
