import { ROLES } from '../config/constants.js';

export const ROLE_HIERARCHY = {
  [ROLES.OWNER]: 4,
  [ROLES.ADMIN]: 3,
  [ROLES.MEMBER]: 2,
  [ROLES.VIEWER]: 1,
};

export const PERMISSIONS = {
  'workflow:create': [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER],
  'workflow:edit': [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER],
  'workflow:delete': [ROLES.OWNER, ROLES.ADMIN],
  'workflow:run': [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER],
  'workflow:view': [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
  'execution:view': [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
  'member:manage': [ROLES.OWNER, ROLES.ADMIN],
  'apikey:manage': [ROLES.OWNER, ROLES.ADMIN],
  'billing:view': [ROLES.OWNER, ROLES.ADMIN],
  'org:settings': [ROLES.OWNER],
  'audit:view': [ROLES.OWNER, ROLES.ADMIN],
};

export function hasPermission(role, action) {
  const allowedRoles = PERMISSIONS[action];
  if (!allowedRoles) {
    return false;
  }
  return allowedRoles.includes(role);
}

export function canAccessResource(user, resource) {
  // Check if user is in the same organization
  if (resource.orgId && user.orgId !== resource.orgId) {
    return false;
  }

  // Check ownership for resources that have createdBy field
  if (resource.createdBy && resource.createdBy !== user.id) {
    // Only owners and admins can access resources they didn't create
    const userRoleLevel = ROLE_HIERARCHY[user.role] || 0;
    return userRoleLevel >= ROLE_HIERARCHY[ROLES.ADMIN];
  }

  return true;
}

export function getRoleLevel(role) {
  return ROLE_HIERARCHY[role] || 0;
}

export function hasMinimumRole(userRole, minimumRole) {
  const userRoleLevel = getRoleLevel(userRole);
  const requiredRoleLevel = getRoleLevel(minimumRole);
  return userRoleLevel >= requiredRoleLevel;
}

export function canManageResource(user, resource) {
  // Owner can manage everything in their org
  if (user.role === ROLES.OWNER) {
    return user.orgId === resource.orgId;
  }

  // Admin can manage most resources but not org settings
  if (user.role === ROLES.ADMIN) {
    return user.orgId === resource.orgId;
  }

  // Member can only manage their own resources
  if (user.role === ROLES.MEMBER) {
    return resource.createdBy === user.id;
  }

  // Viewer cannot manage anything
  return false;
}

export function canViewResource(user, resource) {
  // All roles can view resources in their org
  return user.orgId === resource.orgId;
}

export function getPermissionsForRole(role) {
  const permissions = [];
  
  for (const [permission, allowedRoles] of Object.entries(PERMISSIONS)) {
    if (allowedRoles.includes(role)) {
      permissions.push(permission);
    }
  }
  
  return permissions;
}

export function validateRoleTransition(currentRole, newRole, userRole) {
  const currentLevel = getRoleLevel(currentRole);
  const newLevel = getRoleLevel(newRole);
  const userLevel = getRoleLevel(userRole);

  // Only owners and admins can change roles
  if (userLevel < getRoleLevel(ROLES.ADMIN)) {
    return false;
  }

  // Cannot promote someone to higher or equal level than yourself
  if (newLevel >= userLevel) {
    return false;
  }

  // Cannot demote someone with higher or equal level than yourself
  if (currentLevel >= userLevel) {
    return false;
  }

  return true;
}

export function getAccessibleRoles(userRole) {
  const userLevel = getRoleLevel(userRole);
  const accessibleRoles = [];

  for (const [role, level] of Object.entries(ROLE_HIERARCHY)) {
    // Users can assign roles lower than their own level
    if (level < userLevel) {
      accessibleRoles.push(role);
    }
  }

  return accessibleRoles;
}
