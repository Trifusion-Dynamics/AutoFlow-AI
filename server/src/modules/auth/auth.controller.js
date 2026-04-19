import { authService } from './auth.service.js';
import { successResponse, errorResponse } from '../../utils/response.util.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.util.js';

export class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password, orgName } = req.validatedBody;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      const result = await authService.register(
        { name, email, password, orgName },
        ipAddress,
        userAgent
      );

      return successResponse(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.validatedBody;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      const result = await authService.login(email, password, ipAddress, userAgent);

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async refreshTokens(req, res, next) {
    try {
      const { refreshToken } = req.validatedBody;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      const result = await authService.refreshTokens(refreshToken, ipAddress, userAgent);

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const userId = req.user.id;
      const refreshToken = req.body.refreshToken || '';
      const accessToken = req.headers.authorization?.replace('Bearer ', '') || '';

      if (!refreshToken) {
        return errorResponse(
          res,
          'MISSING_REFRESH_TOKEN',
          'Refresh token is required',
          400
        );
      }

      const result = await authService.logout(userId, refreshToken, accessToken);

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.validatedBody;

      const result = await authService.forgotPassword(email);

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.validatedBody;

      const result = await authService.resetPassword(token, newPassword);

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await authService.getCurrentUser(userId);

      return successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
