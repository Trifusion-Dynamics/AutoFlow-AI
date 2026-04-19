import { prisma } from '../../config/db.js';
import { logger } from '../../utils/logger.util.js';
import { env } from '../../config/env.js';
import fs from 'fs/promises';
import path from 'path';

export class FilesService {
  constructor() {
    this.isProd = env.NODE_ENV === 'production';
    this.useS3 = !!(env.AWS_S3_BUCKET && env.AWS_ACCESS_KEY_ID);
    
    if (this.isProd && !this.useS3) {
      logger.error('CRITICAL: S3 storage must be configured in production!');
      // In a real scenario, we might want to shut down or throw hard
      // throw new Error('S3 not configured for production');
    }
  }

  async createFileRecord(fileData) {
    return await prisma.uploadedFile.create({
      data: {
        orgId: fileData.orgId,
        uploadedBy: fileData.userId,
        name: fileData.originalname,
        url: fileData.filename, // For S3 this would be the Key
        size: fileData.size,
        mimeType: fileData.mimetype,
        isPublic: false
      }
    });
  }

  async getFile(fileId, orgId) {
    const file = await prisma.uploadedFile.findUnique({
      where: { id: fileId }
    });

    if (!file || file.orgId !== orgId) {
      throw new Error('File not found or access denied');
    }

    if (this.useS3) {
      // Logic for S3 GetObject would go here
      logger.info(`Fetching file from S3: ${file.url}`);
      // return { s3Url: `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${file.url}` };
    }

    const filePath = path.join(process.cwd(), 'uploads', orgId, file.url);
    const content = await fs.readFile(filePath);
    
    return {
      file,
      content,
      filePath
    };
  }

  async deleteFile(fileId, orgId) {
    const file = await prisma.uploadedFile.findUnique({
      where: { id: fileId }
    });

    if (!file || file.orgId !== orgId) {
      throw new Error('File not found');
    }

    if (this.useS3) {
      // Logic for S3 DeleteObject would go here
      logger.info(`Deleting file from S3: ${file.url}`);
    } else {
      const filePath = path.join(process.cwd(), 'uploads', orgId, file.url);
      await fs.unlink(filePath).catch(() => logger.warn(`File already deleted from disk: ${filePath}`));
    }
    
    return await prisma.uploadedFile.delete({
      where: { id: fileId }
    });
  }

  async listFiles(orgId) {
    return await prisma.uploadedFile.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const filesService = new FilesService();

