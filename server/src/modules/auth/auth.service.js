import { prisma } from "../../config/db.js";
import { API_VERSION } from "../../config/constants.js";
import {
  hashPassword,
  comparePassword,
  generateHash,
} from "../../utils/crypto.util.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  decodeToken,
} from "../../utils/jwt.util.js";
import { AppError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.util.js";
import {
  blacklistToken,
  isTokenBlacklisted,
} from "../../middlewares/auth.middleware.js";
import { redisHelpers } from "../../config/redis.js";
import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

const emailTransporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export class AuthService {
  async register(data, ipAddress, userAgent) {
    const { name, email, password, orgName } = data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError("Email already registered", "EMAIL_EXISTS", 409);
    }

    const passwordHash = await hashPassword(password);

    let slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    let finalSlug = slug;
    let suffix = 1;

    while (
      await prisma.organization.findUnique({ where: { slug: finalSlug } })
    ) {
      finalSlug = `${slug}-${suffix}`;
      suffix++;
    }

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug: finalSlug,
        },
      });

      const user = await tx.user.create({
        data: {
          orgId: org.id,
          name,
          email,
          passwordHash,
          role: "owner",
        },
      });

      return { org, user };
    });

    const accessToken = await generateAccessToken({ userId: result.user.id });
    const refreshToken = await generateRefreshToken({ userId: result.user.id });

    const refreshTokenHash = generateHash(refreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress,
        userAgent,
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: result.org.id,
        userId: result.user.id,
        action: "user.registered",
        resourceType: "user",
        resourceId: result.user.id,
        ipAddress,
        userAgent,
      },
    });

    logger.info("User registered successfully", {
      userId: result.user.id,
      email,
    });

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        orgId: result.user.orgId,
      },
      organization: result.org,
      tokens: {
        accessToken,
        refreshToken,
      },
      quickstart: {
        step1: 'Create your first workflow: POST /api/v1/workflows',
        step2: 'Activate it: POST /api/v1/workflows/:id/activate',
        step3: 'Trigger it: POST /api/v1/workflows/:id/run',
        step4: 'View results: GET /api/v1/executions',
        docs: 'GET /api/v1/docs',
        apiKey: 'POST /api/v1/api-keys',
      },
    };
  }

  async login(email, password, ipAddress, userAgent) {
    const lockoutKey = `auth:lockout:${email}`;
    const attemptsKey = `auth:attempts:${email}`;

    // 1. Check for Account Lockout
    const isLocked = await redisHelpers.get(lockoutKey);
    if (isLocked) {
      const remainingTime = await redisHelpers.ttl(lockoutKey);
      throw new AppError(
        `Account locked due to multiple failed attempts. Try again in ${Math.ceil(remainingTime / 60)} minutes.`,
        "ACCOUNT_LOCKED",
        403
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { org: true },
    });

    if (!user) {
      throw new AppError("Invalid credentials", "INVALID_CREDENTIALS", 401);
    }

    if (!user.isActive) {
      throw new AppError("Account disabled", "ACCOUNT_DISABLED", 403);
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      // 2. Track Failed Attempts
      const attempts = await redisHelpers.incr(attemptsKey);
      if (attempts === 1) await redisHelpers.expire(attemptsKey, 900); // 15 min window

      if (attempts >= 5) {
        await redisHelpers.set(lockoutKey, "1", 900); // 15 min lockout
        await redisHelpers.del(attemptsKey);
        
        await import('../../utils/securityLogger.util.js').then(({ securityLogger }) => {
          securityLogger.log('ACCOUNT_LOCKED', {
            email,
            ip: ipAddress,
            severity: 'HIGH',
            reason: '5 failed login attempts'
          });
        });

        // Notify user via email (async)
        this.notifyAccountLockout(user).catch(e => logger.error('Failed to send lockout email', e));

        throw new AppError(
          "Account locked due to multiple failed attempts. Please try again in 15 minutes.",
          "ACCOUNT_LOCKED",
          403
        );
      }

      throw new AppError("Invalid credentials", "INVALID_CREDENTIALS", 401);
    }

    // 3. Clear Attempts on Success
    await redisHelpers.del(attemptsKey);

    // 4. Handle Concurrent Sessions (Max 5)
    const activeSessions = await prisma.refreshToken.findMany({
      where: { userId: user.id, isRevoked: false },
      orderBy: { createdAt: 'asc' }
    });

    if (activeSessions.length >= 5) {
      const oldestSession = activeSessions[0];
      await prisma.refreshToken.update({
        where: { id: oldestSession.id },
        data: { isRevoked: true }
      });
      logger.info('Revoked oldest session due to concurrent session limit', { 
        userId: user.id, 
        revokedTokenId: oldestSession.id 
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = await generateAccessToken({ userId: user.id });
    const refreshToken = await generateRefreshToken({ userId: user.id });

    const refreshTokenHash = generateHash(refreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress,
        userAgent,
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: "user.login",
        resourceType: "user",
        resourceId: user.id,
        ipAddress,
        userAgent,
      },
    });

    logger.info("User logged in successfully", { userId: user.id, email });


    // Get active workflows count for context
    const activeWorkflows = await prisma.workflow.count({
      where: { orgId: user.orgId, status: 'active' },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
      },
      organization: user.org,
      accessToken,
      refreshToken,
      context: {
        plan: user.org.plan,
        tokenQuota: user.org.tokenQuota,
        tokenUsed: user.org.tokenUsed,
        activeWorkflows,
        apiVersion: API_VERSION,
      },
    };
  }

  async refreshTokens(refreshToken, ipAddress, userAgent) {
    const payload = await verifyRefreshToken(refreshToken);

    const tokenHash = generateHash(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.isRevoked ||
      storedToken.expiresAt < new Date()
    ) {
      throw new AppError(
        "Invalid or expired refresh token",
        "INVALID_REFRESH_TOKEN",
        401,
      );
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const accessToken = await generateAccessToken({
      userId: storedToken.userId,
    });
    const newRefreshToken = await generateRefreshToken({
      userId: storedToken.userId,
    });

    const newTokenHash = generateHash(newRefreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: storedToken.userId,
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress,
        userAgent,
      },
    });

    logger.info("Tokens refreshed successfully", {
      userId: storedToken.userId,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId, refreshToken, accessToken) {
    const refreshTokenHash = generateHash(refreshToken);
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        tokenHash: refreshTokenHash,
        isRevoked: false,
      },
      data: { isRevoked: true },
    });

    const decodedToken = decodeToken(accessToken);
    const expiresAt = decodedToken.exp
      ? decodedToken.exp * 1000
      : Date.now() + 15 * 60 * 1000;
    blacklistToken(decodedToken.jti, expiresAt);

    await prisma.auditLog.create({
      data: {
        userId,
        action: "user.logout",
        resourceType: "user",
        resourceId: userId,
      },
    });

    logger.info("User logged out successfully", { userId });

    return { message: "Logged out successfully" };
  }

  async forgotPassword(email) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { message: "If email exists, reset link sent" };
    }

    const resetToken = require("crypto").randomBytes(32).toString("hex");
    const tokenHash = generateHash(resetToken);

    try {
      const key = `pwd_reset:${tokenHash}`;
      await redisHelpers.set(key, user.id.toString(), 3600); // 1 hour TTL
    } catch (error) {
      logger.error("Failed to store password reset token in Redis", {
        error: error.message,
        userId: user.id,
      });
    }

    const resetUrl = `${env.APP_URL}/reset-password?token=${resetToken}`;

    try {
      await emailTransporter.sendMail({
        from: env.EMAIL_FROM,
        to: email,
        subject: "Reset your AutoFlow AI password",
        html: `
          <h2>Password Reset Request</h2>
          <p>Hi ${user.name},</p>
          <p>You requested a password reset for your AutoFlow AI account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>Or copy this link: ${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });

      logger.info("Password reset email sent", { userId: user.id, email });
    } catch (error) {
      logger.error("Failed to send password reset email", {
        error: error.message,
        userId: user.id,
      });
    }

    return { message: "If email exists, reset link sent" };
  }

  async resetPassword(token, newPassword) {
    const tokenHash = generateHash(token);
    const key = `pwd_reset:${tokenHash}`;

    let userId;
    try {
      userId = await redisHelpers.get(key);
    } catch (error) {
      logger.error("Failed to retrieve password reset token from Redis", {
        error: error.message,
        tokenHash,
      });
    }

    if (!userId) {
      throw new AppError(
        "Invalid or expired reset token",
        "INVALID_RESET_TOKEN",
        400,
      );
    }

    // Delete the token from Redis
    try {
      await redisHelpers.del(key);
    } catch (error) {
      logger.error("Failed to delete password reset token from Redis", {
        error: error.message,
        tokenHash,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", "USER_NOT_FOUND", 404);
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "user.password_reset",
        resourceType: "user",
        resourceId: user.id,
      },
    });

    logger.info("Password reset successfully", {
      userId: user.id,
      email: user.email,
    });

    return { message: "Password updated successfully" };
  }

  async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        orgId: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            tokenQuota: true,
            tokenUsed: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError("User not found", "USER_NOT_FOUND", 404);
    }

    return user;
  }

  async notifyAccountLockout(user) {
    try {
      await emailTransporter.sendMail({
        from: env.EMAIL_FROM,
        to: user.email,
        subject: "Security Alert: AutoFlow AI Account Locked",
        html: `
          <h2>Account Security Alert</h2>
          <p>Hi ${user.name},</p>
          <p>Your AutoFlow AI account has been temporarily locked due to 5 consecutive failed login attempts.</p>
          <p>This is a security measure to protect your account. The lock will automatically expire in 15 minutes.</p>
          <p>If this wasn't you, we recommend resetting your password once the account is unlocked.</p>
          <p>Best,<br>AutoFlow AI Security Team</p>
        `,
      });
      logger.info("Lockout notification email sent", { userId: user.id });
    } catch (error) {
      logger.error("Failed to send lockout notification email", { error: error.message, userId: user.id });
    }
  }
}

export const authService = new AuthService();

