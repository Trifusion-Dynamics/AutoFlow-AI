import { prisma } from '../config/db.js';
import { hashPassword, comparePassword, generateHash } from '../utils/crypto.util.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, decodeToken } from '../utils/jwt.util.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.util.js';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { blacklistToken } from '../middlewares/auth.middleware.js';

// In-memory reset tokens storage (resets on server restart)
const resetTokens = new Map();

// Create email transporter
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

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(
        'Email already registered',
        'EMAIL_EXISTS',
        409
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate org slug
    let slug = orgName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    // Check slug uniqueness and append random suffix if taken
    let finalSlug = slug;
    let suffix = 1;
    
    while (await prisma.organization.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${suffix}`;
      suffix++;
    }

    // Create organization and user in transaction
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
          role: 'owner',
        },
      });

      return { org, user };
    });

    // Generate tokens
    const accessToken = await generateAccessToken({ userId: result.user.id });
    const refreshToken = await generateRefreshToken({ userId: result.user.id });

    // Store refresh token hash
    const refreshTokenHash = generateHash(refreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress,
        userAgent,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        orgId: result.org.id,
        userId: result.user.id,
        action: 'user.registered',
        resourceType: 'user',
        resourceId: result.user.id,
        ipAddress,
        userAgent,
      },
    });

    logger.info('User registered successfully', { userId: result.user.id, email });

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        orgId: result.user.orgId,
      },
      organization: result.org,
      accessToken,
      refreshToken,
    };
  }

  async login(email, password, ipAddress, userAgent) {
    // Find user by email with organization
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        org: true,
      },
    });

    if (!user) {
      throw new AppError(
        'Invalid credentials',
        'INVALID_CREDENTIALS',
        401
      );
    }

    // Compare password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError(
        'Invalid credentials',
        'INVALID_CREDENTIALS',
        401
      );
    }

    if (!user.isActive) {
      throw new AppError(
        'Account disabled',
        'ACCOUNT_DISABLED',
        403
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate new token pair
    const accessToken = await generateAccessToken({ userId: user.id });
    const refreshToken = await generateRefreshToken({ userId: user.id });

    // Store refresh token hash
    const refreshTokenHash = generateHash(refreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress,
        userAgent,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: 'user.login',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress,
        userAgent,
      },
    });

    logger.info('User logged in successfully', { userId: user.id, email });

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
    };
  }

  async refreshTokens(refreshToken, ipAddress, userAgent) {
    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);

    // Find refresh token in database
    const tokenHash = generateHash(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new AppError(
        'Invalid or expired refresh token',
        'INVALID_REFRESH_TOKEN',
        401
      );
    }

    // Mark old refresh token as revoked
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Generate new token pair
    const accessToken = await generateAccessToken({ userId: storedToken.userId });
    const newRefreshToken = await generateRefreshToken({ userId: storedToken.userId });

    // Store new refresh token
    const newTokenHash = generateHash(newRefreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: storedToken.userId,
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress,
        userAgent,
      },
    });

    logger.info('Tokens refreshed successfully', { userId: storedToken.userId });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId, refreshToken, accessToken) {
    // Hash refresh token and mark as revoked
    const refreshTokenHash = generateHash(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { 
        userId, 
        tokenHash: refreshTokenHash,
        isRevoked: false,
      },
      data: { isRevoked: true },
    });

    // Extract JTI from access token and blacklist in memory
    const decodedToken = decodeToken(accessToken);
    const expiresAt = decodedToken.exp ? decodedToken.exp * 1000 : Date.now() + 15 * 60 * 1000; // Default 15 minutes
    
    if (expiresAt > Date.now()) {
      blacklistToken(decodedToken.jti, expiresAt);
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'user.logout',
        resourceType: 'user',
        resourceId: userId,
      },
    });

    logger.info('User logged out successfully', { userId });

    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return same response for security (don't reveal if email exists)
      return { message: 'If email exists, reset link sent' };
    }

    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const tokenHash = generateHash(resetToken);

    // Store in memory with 1 hour expiration
    const expiresAt = Date.now() + 3600 * 1000; // 1 hour
    resetTokens.set(user.id, { tokenHash, expiresAt });

    // Send reset email
    const resetUrl = `${env.APP_URL}/reset-password?token=${resetToken}`;
    
    try {
      await emailTransporter.sendMail({
        from: env.EMAIL_FROM,
        to: email,
        subject: 'Reset your AutoFlow AI password',
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

      logger.info('Password reset email sent', { userId: user.id, email });
    } catch (error) {
      logger.error('Failed to send password reset email', { error: error.message, userId: user.id });
      // Continue with success response to user
    }

    return { message: 'If email exists, reset link sent' };
  }

  async resetPassword(token, newPassword) {
    // Find user by checking in-memory reset tokens
    let user = null;
    let tokenHash = generateHash(token);
    const now = Date.now();

    // Clean up expired tokens first
    for (const [userId, tokenData] of resetTokens.entries()) {
      if (tokenData.expiresAt < now) {
        resetTokens.delete(userId);
      }
    }

    // Find matching token
    for (const [userId, tokenData] of resetTokens.entries()) {
      if (tokenData.tokenHash === tokenHash && tokenData.expiresAt > now) {
        user = await prisma.user.findUnique({ where: { id: userId } });
        resetTokens.delete(userId); // Delete the token
        break;
      }
    }

    if (!user) {
      throw new AppError(
        'Invalid or expired reset token',
        'INVALID_RESET_TOKEN',
        400
      );
    }

    // Update password
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Revoke ALL refresh tokens for this user (security)
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user.password_reset',
        resourceType: 'user',
        resourceId: user.id,
      },
    });

    logger.info('Password reset successfully', { userId: user.id, email: user.email });

    return { message: 'Password updated successfully' };
  }

  async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        org: true,
      },
      select: {
        id: true,
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
      throw new AppError(
        'User not found',
        'USER_NOT_FOUND',
        404
      );
    }

    return user;
  }
}

export const authService = new AuthService();
