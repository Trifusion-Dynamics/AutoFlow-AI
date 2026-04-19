import { errorResponse } from '../utils/response.util.js';
import { PERMISSIONS, hasPermission, canAccessResource, hasMinimumRole } from '../utils/rbac.util.js';
import { ROLES } from '../config/constants.js';

export function requirePermission(action) {
  return (req, res, next) => {
    // 1. Handle API Key Authentication
    if (req.authType === 'apiKey' && req.apiKeyAuth) {
      const scopes = req.apiKeyAuth.apiKey.permissions || [];
      
      // Map actions to scopes if they differ, or check directly
      // In this system, we use the same strings for RBAC permissions and API scopes
      if (!scopes.includes(action)) {
        return errorResponse(
          res,
          'INSUFFICIENT_SCOPES',
          `API key lacks the required scope: ${action}`,
          403
        );
      }
      return next();
    }

    // 2. Handle JWT Authentication
    if (!req.user) {
      return errorResponse(
        res,
        'AUTHENTICATION_REQUIRED',
        'Authentication is required for this action',
        401
      );
    }

    const userRole = req.user.role;

    if (!hasPermission(userRole, action)) {
      return errorResponse(
        res,
        'INSUFFICIENT_PERMISSIONS',
        `You don't have permission to perform this action. Required: ${action}`,
        403
      );
    }

    next();
  };
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        'AUTHENTICATION_REQUIRED',
        'Authentication is required for this action',
        401
      );
    }

    if (req.user.role !== role) {
      return errorResponse(
        res,
        'INSUFFICIENT_ROLE',
        `This action requires ${role} role`,
        403
      );
    }

    next();
  };
}

export function requireMinimumRole(minimumRole) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        'AUTHENTICATION_REQUIRED',
        'Authentication is required for this action',
        401
      );
    }

    if (!hasMinimumRole(req.user.role, minimumRole)) {
      return errorResponse(
        res,
        'INSUFFICIENT_ROLE',
        `This action requires at least ${minimumRole} role`,
        403
      );
    }

    next();
  };
}

export function requireOwnership(resourceType) {
  return async (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        'AUTHENTICATION_REQUIRED',
        'Authentication is required for this action',
        401
      );
    }

    try {
      const resourceId = req.params.id || req.params.workflowId || req.params.executionId;
      if (!resourceId) {
        return errorResponse(
          res,
          'MISSING_RESOURCE_ID',
          'Resource ID is required for ownership check',
          400
        );
      }

      let resource;
      const { prisma } = await import('../config/db.js');

      switch (resourceType) {
        case 'workflow':
          resource = await prisma.workflow.findUnique({
            where: { id: resourceId },
            select: { id: true, createdBy: true, orgId: true }
          });
          break;
        case 'execution':
          resource = await prisma.execution.findUnique({
            where: { id: resourceId },
            include: {
              workflow: {
                select: { id: true, createdBy: true, orgId: true }
              }
            }
          });
          if (resource) {
            resource = {
              id: resource.id,
              createdBy: resource.workflow.createdBy,
              orgId: resource.workflow.orgId
            };
          }
          break;
        default:
          return errorResponse(
            res,
            'INVALID_RESOURCE_TYPE',
            'Invalid resource type for ownership check',
            400
          );
      }

      if (!resource) {
        return errorResponse(
          res,
          'RESOURCE_NOT_FOUND',
          'Resource not found',
          404
        );
      }

      // Check if user is owner or has sufficient role
      const isOwner = resource.createdBy === req.user.id;
      const isAdminOrOwner = req.user.role === ROLES.OWNER || req.user.role === ROLES.ADMIN;

      if (!isOwner && !isAdminOrOwner) {
        return errorResponse(
          res,
          'INSUFFICIENT_PERMISSIONS',
          'You must be the resource owner or have admin privileges',
          403
        );
      }

      // Check same org for admins
      if (isAdminOrOwner && resource.orgId !== req.user.orgId) {
        return errorResponse(
          res,
          'INSUFFICIENT_PERMISSIONS',
          'You can only access resources in your organization',
          403
        );
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireSameOrg() {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        'AUTHENTICATION_REQUIRED',
        'Authentication is required for this action',
        401
      );
    }

    const resourceOrgId = req.resource?.orgId || req.body?.orgId;
    
    if (resourceOrgId && resourceOrgId !== req.user.orgId) {
      // Log audit trail for cross-org access attempts
      import('../config/db.js').then(({ prisma }) => {
        prisma.auditLog.create({
          data: {
            orgId: req.user.orgId,
            userId: req.user.id,
            action: 'access.denied.cross_org',
            resourceType: 'organization',
            details: `Attempted to access resource in org ${resourceOrgId}`,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
          }
        }).catch(() => {}); // Ignore audit log errors
      });

      return errorResponse(
        res,
        'INSUFFICIENT_PERMISSIONS',
        'You can only access resources within your organization',
        403
      );
    }

    next();
  };
}
