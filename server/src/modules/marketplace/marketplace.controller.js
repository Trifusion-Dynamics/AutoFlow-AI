import { marketplaceService } from './marketplace.service.js';
import { successResponse } from '../../utils/response.util.js';

export class MarketplaceController {
  async getTemplates(req, res) {
    const templates = await marketplaceService.getMarketplaceTemplates(req.query);
    return successResponse(res, templates, 'Marketplace templates retrieved');
  }

  async submit(req, res) {
    const { workflowId, metadata } = req.body;
    const result = await marketplaceService.submitTemplate(
      req.user.orgId,
      req.user.id,
      workflowId,
      metadata
    );
    return successResponse(res, result, 'Template submitted successfully');
  }

  async rate(req, res) {
    const { rating } = req.body;
    const result = await marketplaceService.rateTemplate(
      req.params.id,
      req.user.orgId,
      rating
    );
    return successResponse(res, result, 'Rating submitted successfully');
  }

  async useTemplate(req, res) {
    // This would trigger the existing templatesService.createFromTemplate
    // But we record the marketplace usage here
    await marketplaceService.recordUse(req.params.id);
    // Delegate to existing logic (simplified redirect/info)
    return successResponse(res, { templateId: req.params.id }, 'Recored template usage');
  }
}

export const marketplaceController = new MarketplaceController();
