import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} from '../schemas/auth.schema.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// Apply rate limiter to all auth routes
router.use(authLimiter);

// POST /api/auth/register - Register new user and organization
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login - Login user
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', validate(refreshTokenSchema), authController.refreshTokens);

// POST /api/auth/logout - Logout user (requires authentication)
router.post('/logout', authenticate, authController.logout);

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// GET /api/auth/me - Get current user (requires authentication)
router.get('/me', authenticate, authController.getCurrentUser);

export { router as authRoutes };
