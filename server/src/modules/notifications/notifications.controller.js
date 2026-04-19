import { notificationsService } from './notifications.service.js';
import { successResponse } from '../../utils/response.util.js';

class NotificationsController {
  async getNotifications(req, res, next) {
    try {
      const { page, limit, unreadOnly } = req.query;
      const data = await notificationsService.getNotifications(req.user.id, req.orgId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        unreadOnly: unreadOnly === 'true'
      });
      return successResponse(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const count = await notificationsService.getUnreadCount(req.user.id, req.orgId);
      return successResponse(res, { count });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      await notificationsService.markAsRead(id, req.user.id, req.orgId);
      return successResponse(res, null, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await notificationsService.markAllAsRead(req.user.id, req.orgId);
      return successResponse(res, null, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      await notificationsService.deleteNotification(id, req.user.id, req.orgId);
      return successResponse(res, null, 'Notification deleted');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
