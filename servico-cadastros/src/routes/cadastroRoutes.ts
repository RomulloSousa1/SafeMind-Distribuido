import { Router } from 'express';
import { cadastroController as c } from '../controllers/cadastroController.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const empresaRoutes = Router();
empresaRoutes.post('/', asyncHandler(c.criarEmpresa));
empresaRoutes.get('/', asyncHandler(c.listarEmpresas));
empresaRoutes.get('/:id', asyncHandler(c.buscarEmpresa));

export const colaboradorRoutes = Router();
colaboradorRoutes.post('/', asyncHandler(c.criarColaborador));
colaboradorRoutes.get('/', asyncHandler(c.listarColaboradores));
