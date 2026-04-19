import { templatesService } from './templates.service.js';
import { successResponse, errorResponse } from '../../utils/response.util.js';

/**
 * Templates Controller
 */
export class TemplatesController {
  /**
   * GET /api/v1/templates
   */
  async getTemplates(req, res) {
    try {
      const filters = {
        category: req.query.category,
        triggerType: req.query.triggerType,
        search: req.query.search,
        tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags]) : undefined
      };
      const templates = await templatesService.getTemplates(filters);
      return successResponse(res, templates);
    } catch (error) {
      return errorResponse(res, 'TEMPLATE_FETCH_ERROR', error.message, 500);
    }
  }

  /**
   * GET /api/v1/templates/categories
   */
  async getCategories(req, res) {
    try {
      const categories = await templatesService.getCategories();
      return successResponse(res, categories);
    } catch (error) {
      return errorResponse(res, 'CATEGORY_FETCH_ERROR', error.message, 500);
    }
  }

  /**
   * GET /api/v1/templates/:id
   */
  async getTemplateById(req, res) {
    try {
      const template = await templatesService.getTemplateById(req.params.id);
      if (!template) return errorResponse(res, 'TEMPLATE_NOT_FOUND', 'Template not found', 404);
      return successResponse(res, template);
    } catch (error) {
      return errorResponse(res, 'TEMPLATE_FETCH_ERROR', error.message, 500);
    }
  }

  /**
   * POST /api/v1/templates/:id/use
   */
  async useTemplate(req, res) {
    try {
      const { customizations } = req.body;
      const workflow = await templatesService.createWorkflowFromTemplate(
        req.params.id,
        req.user.orgId,
        req.user.id,
        customizations
      );
      return successResponse(res, workflow, 'Workflow created from template', 201);
    } catch (error) {
      return errorResponse(res, 'TEMPLATE_USE_ERROR', error.message, 400);
    }
  }

  /**
   * POST /api/v1/templates
   */
  async createTemplate(req, res) {
    try {
      const templateData = {
        ...req.body,
        createdBy: req.user.orgId, // Link to org if created by user
      };
      const template = await templatesService.createTemplate(templateData);
      return successResponse(res, template, 'Template created', 201);
    } catch (error) {
      return errorResponse(res, 'TEMPLATE_CREATE_ERROR', error.message, 400);
    }
  }

  /**
   * GET /api/v1/templates/my
   */
  async getOrgTemplates(req, res) {
    try {
      const templates = await templatesService.getOrgTemplates(req.user.orgId);
      return successResponse(res, templates);
    } catch (error) {
      return errorResponse(res, 'TEMPLATE_FETCH_ERROR', error.message, 500);
    }
  }
}

export const templatesController = new TemplatesController();
