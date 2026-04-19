import { prisma } from '../../config/db.js';
import { logger } from '../../utils/logger.util.js';

class NotificationsService {
  /**
   * Create a generic notification
   */
  async createNotification(data) {
    try {
      const notification = await prisma.notification.create({
        data: {
          orgId: data.orgId,
          userId: data.userId || null,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || {},
          channel: data.channel || 'both'
        }
      });

      if (data.channel === 'email' || data.channel === 'both') {
        // TODO: Queue email notification
        logger.info(`Email notification queued for type ${data.type}`);
      }

      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Notify a specific user
   */
  async notifyUser(userId, orgId, type, title, message, data = {}) {
    return this.createNotification({
      userId,
      orgId,
      type,
      title,
      message,
      data,
      channel: 'in_app'
    });
  }

  /**
   * Notify all members of an organization (or filtered by roles)
   */
  async notifyOrg(orgId, type, title, message, data = {}, roles = []) {
    const where = { orgId, isActive: true };
    if (roles.length > 0) {
      where.role = { in: roles };
    }

    const members = await prisma.user.findMany({ where, select: { id: true } });

    const notifications = await Promise.all(
      members.map(member => 
        this.createNotification({
          userId: member.id,
          orgId,
          type,
          title,
          message,
          data,
          channel: 'in_app'
        })
      )
    );

    return notifications;
  }

  /**
   * Notify only organization owners
   */
  async notifyOwners(orgId, type, title, message, data = {}) {
    return this.notifyOrg(orgId, type, title, message, data, ['owner']);
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId, orgId, query = {}) {
    const { page = 1, limit = 20, unreadOnly = false } = query;
    const skip = (page - 1) * limit;

    const where = {
      orgId,
      OR: [
        { userId },
        { userId: null }
      ]
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where })
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUnreadCount(userId, orgId) {
    return await prisma.notification.count({
      where: {
        orgId,
        isRead: false,
        OR: [
          { userId },
          { userId: null }
        ]
      }
    });
  }

  async markAsRead(id, userId, orgId) {
    return await prisma.notification.updateMany({
      where: {
        id,
        orgId,
        OR: [{ userId }, { userId: null }]
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  async markAllAsRead(userId, orgId) {
    return await prisma.notification.updateMany({
      where: {
        orgId,
        isRead: false,
        OR: [{ userId }, { userId: null }]
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  async deleteNotification(id, userId, orgId) {
    return await prisma.notification.deleteMany({
      where: {
        id,
        orgId,
        OR: [{ userId }, { userId: null }]
      }
    });
  }
}

export const notificationsService = new NotificationsService();
