/**
 * Wallet ID Utilities
 * 
 * Generates deterministic wallet IDs from user IDs using HMAC-SHA256.
 * Wallet IDs are immutable, shareable, and privacy-preserving.
 */

import crypto from 'crypto'

// Secret key for wallet ID generation (should be in env)
const WALLET_ID_SECRET = process.env.WALLET_ID_SECRET || 'default-secret-key-change-in-production'

/**
 * Generate wallet ID from user ID
 * 
 * Uses HMAC-SHA256 to create a deterministic, one-way hash.
 * Same user_id always generates same wallet_id.
 * 
 * @param userId - User UUID
 * @returns Wallet ID (format: wallet_xxxxxxxxxxxx)
 */
export function generateWalletId(userId: string): string {
  if (!userId) {
    throw new Error('User ID is required')
  }

  const hmac = crypto.createHmac('sha256', WALLET_ID_SECRET)
  hmac.update(userId)
  const hash = hmac.digest('hex')
  
  // Return first 12 characters of hash with wallet_ prefix
  return `wallet_${hash.substring(0, 12)}`
}

/**
 * Verify wallet ID matches user ID
 * 
 * @param walletId - Wallet ID to verify
 * @param userId - User ID to check against
 * @returns True if wallet ID matches user ID
 */
export function verifyWalletId(walletId: string, userId: string): boolean {
  if (!walletId || !userId) {
    return false
  }

  const expectedWalletId = generateWalletId(userId)
  return walletId === expectedWalletId
}

/**
 * Extract user ID from wallet ID (not possible - one-way hash)
 * 
 * This function exists to document that wallet IDs cannot be reversed.
 * 
 * @param walletId - Wallet ID
 * @returns null (wallet IDs are one-way hashes)
 */
export function extractUserIdFromWalletId(walletId: string): null {
  // Wallet IDs are one-way hashes - cannot extract user ID
  return null
}

