import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', 
  notificationsController.getNotifications
);

router.get('/unread/count', 
  notificationsController.getUnreadCount
);

router.put('/:id/read', 
  notificationsController.markAsRead
);

router.put('/read-all', 
  notificationsController.markAllAsRead
);

router.delete('/:id', 
  notificationsController.deleteNotification
);

export { router as notificationRoutes };
