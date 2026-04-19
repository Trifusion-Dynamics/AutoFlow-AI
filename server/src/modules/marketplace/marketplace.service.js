import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.util.js';

export class MarketplaceService {
  async submitTemplate(orgId, userId, workflowId, metadata) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId, orgId }
    });

    if (!workflow) {
      throw new AppError('Workflow not found', 'WORKFLOW_NOT_FOUND', 404);
    }

    // Security Scan: Check for secrets in steps
    const stepsStr = JSON.stringify(workflow.steps);
    const secretPatterns = [
      /sk-[a-zA-Z0-9]{32,}/g,           // OpenAI etc
      /Bearer\s+[a-zA-Z0-9\._\-]+/gi,  // JWT/Bearer
      /password\s*=\s*[^\s]+/gi,       // Passwords
      /api[_-]?key\s*=\s*[^\s]+/gi     // API Keys
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(stepsStr)) {
        throw new AppError(
          'Security scan failed: Hardcoded secrets detected in workflow steps. Please use variables instead.',
          'SECURITY_SCAN_FAILED',
          400
        );
      }
    }

    const template = await prisma.workflowTemplate.create({
      data: {
        name: workflow.name,
        description: metadata.description || workflow.description || '',
        category: metadata.category || 'other',
        tags: metadata.tags || [],
        triggerType: workflow.triggerType,
        steps: workflow.steps,
        agentInstruction: workflow.agentInstruction,
        variables: workflow.variables,
        isPublic: false, // Initially false until approved
        publishedBy: orgId,
        reviewStatus: 'pending'
      }
    });

    logger.info(`Workflow ${workflowId} submitted to marketplace as template ${template.id}`);

    return { 
      submitted: true, 
      templateId: template.id,
      message: 'Workflow submitted for review. It will be public once approved by our team.'
    };
  }

  async getMarketplaceTemplates(filters = {}) {
    const { category, search, tag } = filters;
    
    const where = {
      isPublic: true,
      reviewStatus: 'approved'
    };

    if (category) where.category = category;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    return prisma.workflowTemplate.findMany({
      where,
      orderBy: [
        { downloadCount: 'desc' },
        { rating: 'desc' }
      ]
    });
  }

  async recordUse(templateId) {
    return prisma.workflowTemplate.update({
      where: { id: templateId },
      data: { downloadCount: { increment: 1 } }
    });
  }

  async rateTemplate(templateId, orgId, rating) {
    if (rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 'INVALID_RATING', 400);
    }

    // Logic for updating ratings: recaculate average
    const template = await prisma.workflowTemplate.findUnique({
      where: { id: templateId }
    });

    const newCount = template.ratingCount + 1;
    const newRating = ((template.rating || 0) * template.ratingCount + rating) / newCount;

    return prisma.workflowTemplate.update({
      where: { id: templateId },
      data: {
        rating: newRating,
        ratingCount: newCount
      }
    });
  }
}

export const marketplaceService = new MarketplaceService();
