import { Router } from 'express';
import { GatewayController } from '../controllers/GatewayController.js';

const router = Router();
const controller = new GatewayController();

// Status e Topologia do Sistema Distribuído
router.get('/status-distribuido', controller.obterStatusCluster);

// Avaliações (Microsserviço A)
router.post('/avaliacoes', controller.criarAvaliacao);
router.get('/avaliacoes', controller.listarAvaliacoes);
router.get('/avaliacoes/:id', controller.buscarAvaliacaoPorId);
router.post('/avaliacoes/:id/respostas', controller.submeterResposta);
router.get('/avaliacoes/:id/relatorio', controller.obterRelatorioAvaliacao);

// Empresas (Microsserviço B)
router.post('/empresas', controller.criarEmpresa);
router.get('/empresas', controller.listarEmpresas);
router.get('/empresas/:id', controller.buscarEmpresaPorId);

// Colaboradores (Microsserviço B)
router.post('/colaboradores', controller.criarColaborador);
router.get('/colaboradores', controller.listarColaboradores);

export default router;
