import { prisma } from '../../config/db.js';
import { logger } from '../../utils/logger.util.js';

/**
 * Templates Service
 */
export class TemplatesService {
  /**
   * Get all public templates with filters
   */
  async getTemplates(filters = {}) {
    const { category, tags, search, triggerType } = filters;
    
    const where = {
      isPublic: true,
    };

    if (category) where.category = category;
    if (triggerType) where.triggerType = triggerType;
    if (tags && Array.isArray(tags)) {
      where.tags = {
        array_contains: tags
      };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    return await prisma.workflowTemplate.findMany({
      where,
      orderBy: { usageCount: 'desc' },
    });
  }

  /**
   * Get template categories
   */
  async getCategories() {
    const templates = await prisma.workflowTemplate.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    return templates.map(t => t.category);
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id) {
    return await prisma.workflowTemplate.findUnique({
      where: { id },
    });
  }

  /**
   * Create a workflow from a template
   */
  async createWorkflowFromTemplate(templateId, orgId, userId, customizations = {}) {
    const template = await this.getTemplateById(templateId);
    if (!template) throw new Error('Template not found');

    // Interpolate variables
    let finalSteps = JSON.parse(JSON.stringify(template.steps));
    const variables = customizations.variables || {};

    const interpolate = (obj) => {
      if (typeof obj === 'string') {
        return obj.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
          return variables[key] !== undefined ? variables[key] : match;
        });
      }
      if (Array.isArray(obj)) return obj.map(interpolate);
      if (typeof obj === 'object' && obj !== null) {
        const newObj = {};
        for (const [key, val] of Object.entries(obj)) {
          newObj[key] = interpolate(val);
        }
        return newObj;
      }
      return obj;
    };

    finalSteps = interpolate(finalSteps);

    // Create workflow
    const workflow = await prisma.workflow.create({
      data: {
        orgId,
        createdBy: userId,
        name: customizations.name || `${template.name} (from template)`,
        description: customizations.description || template.description,
        triggerType: template.triggerType,
        steps: finalSteps,
        agentInstruction: template.agentInstruction,
        status: 'draft',
      },
    });

    // Increment usage count
    await prisma.workflowTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    logger.info(`Workflow created from template ${templateId}`, { workflowId: workflow.id, orgId });
    return workflow;
  }

  /**
   * Create a custom template
   */
  async createTemplate(data) {
    return await prisma.workflowTemplate.create({
      data: {
        ...data,
        isPublic: data.isPublic || false,
      },
    });
  }

  /**
   * Get organization-specific templates
   */
  async getOrgTemplates(orgId) {
    return await prisma.workflowTemplate.findMany({
      where: {
        OR: [
          { isPublic: true },
          { createdBy: orgId }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const templatesService = new TemplatesService();
