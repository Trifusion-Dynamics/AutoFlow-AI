import { errorResponse } from '../utils/response.util.js';
import { logger } from '../utils/logger.util.js';
import path from 'path';

/**
 * Mass Assignment Protection: Strips req.body of fields not in whitelist
 * @param {string[]} whitelist Array of allowed field names
 */
export const protectMassAssignment = (whitelist) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      const originalBody = { ...req.body };
      const filteredBody = {};
      
      whitelist.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          filteredBody[field] = req.body[field];
        }
      });
      
      req.body = filteredBody;
      
      // Log if fields were stripped (potential malicious intent or dev error)
      const strippedFields = Object.keys(originalBody).filter(key => !whitelist.includes(key));
      if (strippedFields.length > 0) {
        logger.warn(`Mass assignment attempt detected and blocked`, {
          orgId: req.orgId,
          userId: req.user?.id,
          strippedFields,
          path: req.path
        });
      }
    }
    next();
  };
};

/**
 * Directory Traversal Prevention
 */
export const preventPathTraversal = (req, res, next) => {
  const params = { ...req.params, ...req.query };
  const sensitiveChars = ['..', '../', '..\\', '\0', '%00'];
  
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      const hasSensitive = sensitiveChars.some(char => value.includes(char));
      const isNormalized = path.normalize(value).includes('..');
      
      if (hasSensitive || isNormalized) {
        logger.warn(`Potential directory traversal attempt blocked`, {
          ip: req.ip,
          param: key,
          value
        });
        return errorResponse(res, 'SECURITY_VIOLATION', 'Invalid path characters detected', 400);
      }
    }
  }
  next();
};

/**
 * Ownership Middleware Factory
 * Generic check to ensure req.user.orgId matches the resource's orgId
 */
export const verifyOwnership = (modelName, idParam = 'id') => {
  return async (req, res, next) => {
    const resourceId = req.params[idParam];
    if (!resourceId) return next();

    try {
      const { prisma } = await import('../config/db.js');
      const resource = await prisma[modelName].findUnique({
        where: { id: resourceId },
        select: { orgId: true }
      });

      if (!resource) {
        return errorResponse(res, 'NOT_FOUND', `${modelName} not found`, 404);
      }

      if (resource.orgId !== req.orgId) {
        logger.error('Cross-organization access attempt blocked', {
          userId: req.user.id,
          orgId: req.orgId,
          resourceOrgId: resource.orgId,
          modelName,
          resourceId
        });
        return errorResponse(res, 'FORBIDDEN', 'Access denied for this organization', 403);
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};
