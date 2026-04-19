import { SignJWT, jwtVerify, decodeJwt, importPKCS8, importSPKI } from 'jose';
import { env } from '../config/env.js';
import { getOrCreateRsaKeys } from './crypto.util.js';

const encoder = new TextEncoder();

// RS256 Keys for Production
let privateKeyPromise = null;
let publicKeyPromise = null;

if (env.NODE_ENV === 'production' || env.JWT_ALGO === 'RS256') {
  const { privateKey, publicKey } = getOrCreateRsaKeys();
  privateKeyPromise = importPKCS8(privateKey, 'RS256');
  publicKeyPromise = importSPKI(publicKey, 'RS256');
}

// Create secrets for HS256 (Fallback/Development)
const accessSecret = encoder.encode(env.JWT_ACCESS_SECRET);
const refreshSecret = encoder.encode(env.JWT_REFRESH_SECRET);

export async function generateAccessToken(payload) {
  const builder = new SignJWT({ ...payload, type: 'access' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRES);

  if (privateKeyPromise) {
    return builder
      .setProtectedHeader({ alg: 'RS256' })
      .sign(await privateKeyPromise);
  }

  return builder
    .setProtectedHeader({ alg: 'HS256' })
    .sign(accessSecret);
}

export async function generateRefreshToken(payload) {
  // We keep HS256 for refresh tokens as standard practice sometimes, 
  // or use RS256 if preferred. Here we align with access token.
  const builder = new SignJWT({ ...payload, type: 'refresh' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES);

  if (privateKeyPromise) {
    return builder
      .setProtectedHeader({ alg: 'RS256' })
      .sign(await privateKeyPromise);
  }

  return builder
    .setProtectedHeader({ alg: 'HS256' })
    .sign(refreshSecret);
}

export async function verifyAccessToken(token) {
  const key = publicKeyPromise ? await publicKeyPromise : accessSecret;
  const { payload } = await jwtVerify(token, key);
  
  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return payload;
}

export async function verifyRefreshToken(token) {
  const key = publicKeyPromise ? await publicKeyPromise : refreshSecret;
  const { payload } = await jwtVerify(token, key);

  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return payload;
}

export function decodeToken(token) {
  return decodeJwt(token);
}

export function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

