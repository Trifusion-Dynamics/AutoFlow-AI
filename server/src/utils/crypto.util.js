import bcrypt from 'bcryptjs';
import { createHash, randomBytes, createCipheriv, createDecipheriv, generateKeyPairSync } from 'crypto';
import { env } from '../config/env.js';
import fs from 'fs';
import path from 'path';

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateHash(data) {
  return createHash('sha256').update(data).digest('hex');
}

export function generateApiKey() {
  const bytes = randomBytes(32);
  return `ak_live_${bytes.toString('hex')}`;
}

/**
 * AES-256-GCM Encryption (Authenticated Encryption)
 */
export function encryptData(data, key = env.ENCRYPTION_KEY) {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key), iv);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return {
    iv: iv.toString('hex'),
    data: encrypted,
    tag: authTag
  };
}

export function decryptData(encrypted, key = env.ENCRYPTION_KEY) {
  const decipher = createDecipheriv(
    'aes-256-gcm', 
    Buffer.from(key), 
    Buffer.from(encrypted.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));
  
  let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}

/**
 * RSA Key Pair Generation for RS256 JWT
 */
export function getOrCreateRsaKeys() {
  const keyDir = path.join(process.cwd(), 'storage', 'keys');
  const privateKeyPath = path.join(keyDir, 'private.pem');
  const publicKeyPath = path.join(keyDir, 'public.pem');

  if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
    return {
      privateKey: fs.readFileSync(privateKeyPath, 'utf8'),
      publicKey: fs.readFileSync(publicKeyPath, 'utf8')
    };
  }

  if (!fs.existsSync(keyDir)) {
    fs.mkdirSync(keyDir, { recursive: true });
  }

  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);

  return { privateKey, publicKey };
}

