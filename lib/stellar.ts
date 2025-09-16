import { Keypair, Networks, Asset, Operation, TransactionBuilder, BASE_FEE } from '@stellar/stellar-sdk';
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

// ============================================================================
// MARKETPLACE FUNCTIONS FOR TOKEN TRADING
// ============================================================================

/**
 * Create a trustline for a fan to hold an artist's token
 */
export async function createTrustline(
  fanSecretKey: string,
  assetCode: string,
  issuerPublicKey: string,
  limit?: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const server = createStellarServer();
    const fanKeypair = Keypair.fromSecret(fanSecretKey);
    const fanAccount = await server.loadAccount(fanKeypair.publicKey());
    
    // Create the asset
    const asset = new Asset(assetCode, issuerPublicKey);
    
    // Build transaction to create trustline
    const transaction = new TransactionBuilder(fanAccount, {
      fee: BASE_FEE,
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(Operation.changeTrust({
        asset: asset,
        limit: limit || undefined, // undefined = no limit
      }))
      .setTimeout(30)
      .build();
    
    // Sign and submit transaction
    transaction.sign(fanKeypair);
    const result = await server.submitTransaction(transaction);
    
    return {
      success: true,
      transactionHash: result.hash
    };
  } catch (error) {
    console.error('Error creating trustline:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if an account has a trustline for a specific asset
 */
export async function hasTrustline(
  accountPublicKey: string,
  assetCode: string,
  issuerPublicKey: string
): Promise<boolean> {
  try {
    const server = createStellarServer();
    const account = await server.loadAccount(accountPublicKey);
    
    // Check if account has trustline for this asset
    const trustline = account.balances.find((balance: any) => 
      balance.asset_type !== 'native' &&
      balance.asset_code === assetCode &&
      balance.asset_issuer === issuerPublicKey
    );
    
    return !!trustline;
  } catch (error) {
    console.error('Error checking trustline:', error);
    return false;
  }
}

/**
 * Get token balance for a specific asset
 */
export async function getTokenBalance(
  accountPublicKey: string,
  assetCode: string,
  issuerPublicKey: string
): Promise<number> {
  try {
    const server = createStellarServer();
    const account = await server.loadAccount(accountPublicKey);
    
    // Find balance for this specific asset
    const balance = account.balances.find((bal: any) => 
      bal.asset_type !== 'native' &&
      bal.asset_code === assetCode &&
      bal.asset_issuer === issuerPublicKey
    );
    
    return balance ? parseFloat(balance.balance) : 0;
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
}

/**
 * Transfer tokens from one account to another
 */
export async function transferTokens(
  fromSecretKey: string,
  toPublicKey: string,
  assetCode: string,
  issuerPublicKey: string,
  amount: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const server = createStellarServer();
    const fromKeypair = Keypair.fromSecret(fromSecretKey);
    const fromAccount = await server.loadAccount(fromKeypair.publicKey());
    
    // Create the asset
    const asset = new Asset(assetCode, issuerPublicKey);
    
    // Build transaction to transfer tokens
    const transaction = new TransactionBuilder(fromAccount, {
      fee: BASE_FEE,
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(Operation.payment({
        destination: toPublicKey,
        asset: asset,
        amount: amount,
      }))
      .setTimeout(30)
      .build();
    
    // Sign and submit transaction
    transaction.sign(fromKeypair);
    const result = await server.submitTransaction(transaction);
    
    return {
      success: true,
      transactionHash: result.hash
    };
  } catch (error) {
    console.error('Error transferring tokens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Buy tokens by sending XLM to the distributor and receiving tokens back
 * This is a simple implementation - in production you'd want atomic swaps or DEX integration
 */
export async function buyTokensSimple(
  fanSecretKey: string,
  distributorPublicKey: string,
  distributorSecretKey: string,
  assetCode: string,
  issuerPublicKey: string,
  xlmAmount: string,
  tokenAmount: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const server = createStellarServer();
    const fanKeypair = Keypair.fromSecret(fanSecretKey);
    const distributorKeypair = Keypair.fromSecret(distributorSecretKey);
    
    // Step 1: Fan sends XLM to distributor
    const fanAccount = await server.loadAccount(fanKeypair.publicKey());
    const xlmTransaction = new TransactionBuilder(fanAccount, {
      fee: BASE_FEE,
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(Operation.payment({
        destination: distributorPublicKey,
        asset: Asset.native(),
        amount: xlmAmount,
      }))
      .setTimeout(30)
      .build();
    
    xlmTransaction.sign(fanKeypair);
    const xlmResult = await server.submitTransaction(xlmTransaction);
    
    // Step 2: Distributor sends tokens to fan
    const distributorAccount = await server.loadAccount(distributorKeypair.publicKey());
    const asset = new Asset(assetCode, issuerPublicKey);
    
    const tokenTransaction = new TransactionBuilder(distributorAccount, {
      fee: BASE_FEE,
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(Operation.payment({
        destination: fanKeypair.publicKey(),
        asset: asset,
        amount: tokenAmount,
      }))
      .setTimeout(30)
      .build();
    
    tokenTransaction.sign(distributorKeypair);
    const tokenResult = await server.submitTransaction(tokenTransaction);
    
    return {
      success: true,
      transactionHash: tokenResult.hash
    };
  } catch (error) {
    console.error('Error buying tokens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create a sell offer on the Stellar DEX
 */
export async function createSellOffer(
  sellerSecretKey: string,
  sellingAssetCode: string,
  sellingIssuer: string,
  buyingAssetCode: string, // 'XLM' for native
  buyingIssuer: string | null, // null for XLM
  amount: string,
  price: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const server = createStellarServer();
    const sellerKeypair = Keypair.fromSecret(sellerSecretKey);
    const sellerAccount = await server.loadAccount(sellerKeypair.publicKey());
    
    // Create assets
    const sellingAsset = new Asset(sellingAssetCode, sellingIssuer);
    const buyingAsset = buyingIssuer ? new Asset(buyingAssetCode, buyingIssuer) : Asset.native();
    
    // Build transaction to create sell offer
    const transaction = new TransactionBuilder(sellerAccount, {
      fee: BASE_FEE,
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(Operation.manageSellOffer({
        selling: sellingAsset,
        buying: buyingAsset,
        amount: amount,
        price: price,
      }))
      .setTimeout(30)
      .build();
    
    // Sign and submit transaction
    transaction.sign(sellerKeypair);
    const result = await server.submitTransaction(transaction);
    
    return {
      success: true,
      transactionHash: result.hash
    };
  } catch (error) {
    console.error('Error creating sell offer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
