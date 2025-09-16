import { Keypair, Networks } from '@stellar/stellar-sdk';
import Server from '@stellar/stellar-sdk';
import crypto from 'crypto';

// Stellar network configuration
export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';
export const STELLAR_HORIZON_URL = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 
  (STELLAR_NETWORK === 'mainnet' 
    ? 'https://horizon.stellar.org' 
    : 'https://horizon-testnet.stellar.org');

// Encryption key for secret keys (in production, use a proper key management system)
const ENCRYPTION_KEY = process.env.STELLAR_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

export interface StellarWallet {
  publicKey: string;
  secretKey: string;
  accountId: string;
  network: string;
}

export interface EncryptedStellarWallet {
  publicKey: string;
  secretKeyEncrypted: string;
  accountId: string;
  network: string;
}

/**
 * Generate a new Stellar keypair
 */
export function generateStellarKeypair(): StellarWallet {
  const keypair = Keypair.random();
  
  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
    accountId: keypair.publicKey(), // In Stellar, account ID is the same as public key
    network: STELLAR_NETWORK
  };
}

/**
 * Encrypt a secret key for secure storage
 */
export function encryptSecretKey(secretKey: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(secretKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt a secret key
 */
export function decryptSecretKey(encryptedSecretKey: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const [ivHex, encrypted] = encryptedSecretKey.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Create an encrypted Stellar wallet
 */
export function createEncryptedStellarWallet(): EncryptedStellarWallet {
  const wallet = generateStellarKeypair();
  
  return {
    publicKey: wallet.publicKey,
    secretKeyEncrypted: encryptSecretKey(wallet.secretKey),
    accountId: wallet.accountId,
    network: wallet.network
  };
}

/**
 * Check if a Stellar account exists and is funded
 */
export async function checkAccountExists(publicKey: string): Promise<boolean> {
  try {
    const server = new Server(STELLAR_HORIZON_URL);
    const account = await server.loadAccount(publicKey);
    return account.balances.length > 0;
  } catch (error) {
    // Account doesn't exist or is not funded
    return false;
  }
}

/**
 * Get account balance for a Stellar account
 */
export async function getAccountBalance(publicKey: string): Promise<number> {
  try {
    const server = new Server(STELLAR_HORIZON_URL);
    const account = await server.loadAccount(publicKey);
    
    // Find XLM balance
    const xlmBalance = account.balances.find((balance: any) => balance.asset_type === 'native');
    return xlmBalance ? parseFloat(xlmBalance.balance) : 0;
  } catch (error) {
    console.error('Error getting account balance:', error);
    return 0;
  }
}

/**
 * Fund a test account (only works on testnet)
 */
export async function fundTestAccount(publicKey: string): Promise<boolean> {
  if (STELLAR_NETWORK !== 'testnet') {
    throw new Error('Account funding is only available on testnet');
  }

  try {
    const response = await fetch(`https://horizon-testnet.stellar.org/friendbot?addr=${publicKey}`);
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error funding test account:', error);
    return false;
  }
}

/**
 * Create a Stellar server instance
 */
export function createStellarServer() {
  return new Server(STELLAR_HORIZON_URL);
}

/**
 * Get the appropriate Stellar network passphrase
 */
export function getNetworkPassphrase(): string {
  return STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
}
