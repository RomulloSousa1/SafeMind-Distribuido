import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.js';

export const authRoutes = Router();

authRoutes.post('/registrar', asyncHandler(authController.registrar));
authRoutes.post('/login', asyncHandler(authController.login));
authRoutes.get('/validar', asyncHandler(authController.validar));
// Rota restrita: token USER recebe 403; token com role adulterado recebe 401.
authRoutes.get('/usuarios', authMiddleware, requireRole('ADMIN'), asyncHandler(authController.listarUsuarios));
