import { prisma } from '../../config/db.js';

export class OutboundWebhookRepository {
  async create(data) {
    return prisma.outboundWebhook.create({ data });
  }

  async findById(id, orgId) {
    return prisma.outboundWebhook.findFirst({
      where: { id, orgId },
    });
  }

  async findByOrgId(orgId, options = {}) {
    const { limit = 20, cursor } = options;

    const query = {
      where: { orgId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    };

    if (cursor) {
      query.skip = 1;
      query.cursor = { id: cursor };
    }

    const [webhooks, total] = await Promise.all([
      prisma.outboundWebhook.findMany(query),
      prisma.outboundWebhook.count({ where: { orgId } }),
    ]);

    return { webhooks, total };
  }

  async findActiveByOrgAndEvent(orgId, event) {
    return prisma.outboundWebhook.findMany({
      where: {
        orgId,
        isActive: true,
        events: { path: [], array_contains: event },
      },
    });
  }

  async findActiveByOrgAndEventFallback(orgId, event) {
    // Fallback for databases that don't support array_contains on Json fields
    const webhooks = await prisma.outboundWebhook.findMany({
      where: { orgId, isActive: true },
    });

    return webhooks.filter(wh => {
      const events = Array.isArray(wh.events) ? wh.events : [];
      return events.includes(event);
    });
  }

  async update(id, orgId, data) {
    return prisma.outboundWebhook.update({
      where: { id },
      data,
    });
  }

  async delete(id, orgId) {
    return prisma.outboundWebhook.delete({
      where: { id },
    });
  }

  async incrementFailure(id) {
    return prisma.outboundWebhook.update({
      where: { id },
      data: {
        failureCount: { increment: 1 },
      },
    });
  }

  async resetFailure(id) {
    return prisma.outboundWebhook.update({
      where: { id },
      data: { failureCount: 0 },
    });
  }

  async disable(id) {
    return prisma.outboundWebhook.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── Delivery records ──

  async createDelivery(data) {
    return prisma.outboundWebhookDelivery.create({ data });
  }

  async findDeliveriesByWebhookId(webhookId, options = {}) {
    const { limit = 20, cursor, event, success } = options;

    const where = { webhookId };
    if (event) where.event = event;
    if (success !== undefined) where.success = success;

    const query = {
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    };

    if (cursor) {
      query.skip = 1;
      query.cursor = { id: cursor };
    }

    const [deliveries, total] = await Promise.all([
      prisma.outboundWebhookDelivery.findMany(query),
      prisma.outboundWebhookDelivery.count({ where }),
    ]);

    return { deliveries, total };
  }

  async updateDelivery(id, data) {
    return prisma.outboundWebhookDelivery.update({
      where: { id },
      data,
    });
  }
}

export const outboundWebhookRepository = new OutboundWebhookRepository();
