import { ForbiddenError } from './errors.js';
import { prisma } from '../config/db.js';

/**
 * Asserts that the requested resource belongs to the given orgId.
 * @param {Object} resource - The resource to check (must have orgId field)
 * @param {string} orgId - The organization ID of the current tenant
 * @throws {ForbiddenError} if mismatch
 */
export function assertOrgAccess(resource, orgId) {
  if (!resource || resource.orgId !== orgId) {
    throw new ForbiddenError('Resource access denied: organization mismatch');
  }
}

/**
 * Ensures a prisma where query is scoped to the organization.
 * @param {Object} where - The existing where clause
 * @param {string} orgId - The organization ID to scope to
 * @returns {Object} Combined where clause
 */
export function scopeToOrg(where = {}, orgId) {
  return { ...where, orgId };
}

/**
 * Validates if a user has access to a specific organization.
 * @param {string} userId - User ID to check
 * @param {string} targetOrgId - Org ID to check access for
 * @returns {Promise<boolean>}
 */
export async function validateCrossOrgAccess(userId, targetOrgId) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      orgId: targetOrgId,
      isActive: true
    }
  });
  return !!user;
}
