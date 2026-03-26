// ═══════════════════════════════════════════════════════════════
// StatusVault — Client-Side AES-256 Encryption
// Data is encrypted BEFORE leaving the device.
// Supabase stores only ciphertext — even a DB breach is useless.
// ═══════════════════════════════════════════════════════════════

import CryptoJS from 'crypto-js';

// App-level salt — combined with user's unique ID to derive key
const APP_SALT = 'StatusVault_SecureSync_2025_v1';

/**
 * Derives a deterministic AES key from userId + email.
 * Key never leaves the device — only the encrypted blob is uploaded.
 */
export function deriveKey(userId: string, email: string): string {
  return CryptoJS.PBKDF2(
    `${userId}:${email}`,
    APP_SALT,
    { keySize: 256 / 32, iterations: 10000 }
  ).toString();
}

/**
 * Encrypts a plain JS object to an AES-256 ciphertext string.
 */
export function encryptData(data: object, key: string): string {
  const json = JSON.stringify(data);
  return CryptoJS.AES.encrypt(json, key).toString();
}

/**
 * Decrypts an AES-256 ciphertext string back to a JS object.
 * Returns null on failure (wrong key or corrupted data).
 */
export function decryptData(ciphertext: string, key: string): object | null {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const json  = bytes.toString(CryptoJS.enc.Utf8);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}
