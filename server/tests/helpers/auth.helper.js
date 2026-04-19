import { signAccessToken } from '../../src/utils/jwt.util.js';

export const getTestToken = async (user) => {
  return await signAccessToken({
    id: user.id,
    orgId: user.orgId,
    role: user.role
  });
};

export const getAuthHeader = async (user) => {
  const token = await getTestToken(user);
  return { Authorization: `Bearer ${token}` };
};
