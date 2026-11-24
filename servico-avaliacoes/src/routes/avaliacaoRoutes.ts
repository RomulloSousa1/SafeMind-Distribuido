import { Router } from 'express';
import { avaliacaoController as c } from '../controllers/avaliacaoController.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const avaliacaoRoutes = Router();

avaliacaoRoutes.post('/', asyncHandler(c.criar));
avaliacaoRoutes.get('/', asyncHandler(c.listar));
avaliacaoRoutes.get('/:id', asyncHandler(c.buscar));
avaliacaoRoutes.post('/:id/respostas', asyncHandler(c.submeterResposta));
avaliacaoRoutes.get('/:id/relatorio', asyncHandler(c.relatorio));
