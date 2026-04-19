import { billingService } from './billing.service.js';
import { successResponse } from '../../utils/response.util.js';

class BillingController {
  async getCurrentPlan(req, res, next) {
    try {
      const plan = await billingService.getCurrentPlan(req.orgId);
      return successResponse(res, plan);
    } catch (error) {
      next(error);
    }
  }

  async getUsageSummary(req, res, next) {
    try {
      const usage = await billingService.getUsageSummary(req.orgId);
      return successResponse(res, usage);
    } catch (error) {
      next(error);
    }
  }

  async getInvoices(req, res, next) {
    try {
      const { prisma } = await import('../../config/db.js');
      const invoices = await prisma.orgInvoice.findMany({
        where: { orgId: req.orgId },
        orderBy: { createdAt: 'desc' }
      });
      return successResponse(res, invoices);
    } catch (error) {
      next(error);
    }
  }

  async upgradePlan(req, res, next) {
    try {
      const { plan } = req.body;
      const result = await billingService.upgradePlan(req.orgId, plan);
      return successResponse(res, result, 'Plan upgraded successfully');
    } catch (error) {
      next(error);
    }
  }

  async startTrial(req, res, next) {
    try {
      const { plan } = req.body;
      const result = await billingService.startTrial(req.orgId, plan);
      return successResponse(res, result, 'Trial started successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const billingController = new BillingController();
