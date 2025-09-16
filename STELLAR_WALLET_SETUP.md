# Stellar Wallet Setup for BestDropsever dApp

This document explains how to set up invisible Stellar wallets for users during signup.

## Features

- **Invisible Wallet Creation**: Every user gets a Stellar wallet automatically created during signup
- **Encrypted Secret Keys**: Secret keys are encrypted and stored securely in the database
- **Testnet Support**: Automatic funding on Stellar testnet for development
- **Network Configuration**: Support for both testnet and mainnet environments

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Stellar Configuration
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_ENCRYPTION_KEY=your_stellar_encryption_key_change_in_production
```

### Environment Variable Descriptions

- `NEXT_PUBLIC_STELLAR_NETWORK`: Set to `testnet` for development or `mainnet` for production
- `NEXT_PUBLIC_STELLAR_HORIZON_URL`: Stellar Horizon server URL (automatically set based on network)
- `STELLAR_ENCRYPTION_KEY`: Secret key for encrypting Stellar secret keys in the database

## Database Setup

1. Run the Stellar wallets migration:
```sql
-- Run this in your Supabase SQL editor
\i scripts/005_create_stellar_wallets.sql
```

2. The migration creates:
   - `stellar_wallets` table with encrypted secret key storage
   - Row Level Security (RLS) policies
   - Automatic wallet creation trigger on user signup

## How It Works

### 1. User Signup Flow
1. User fills out signup form
2. Supabase Auth creates the user account
3. Profile is created in the `profiles` table
4. **Stellar wallet is automatically created** with:
   - Generated keypair (public/private keys)
   - Encrypted secret key storage
   - Testnet account funding (if on testnet)

### 2. Wallet Creation Process
1. Generate new Stellar keypair using `@stellar/stellar-sdk`
2. Encrypt the secret key using AES-256-CBC encryption
3. Store encrypted data in `stellar_wallets` table
4. Attempt to fund the account on testnet using Stellar Friendbot

### 3. Security Features
- Secret keys are encrypted before database storage
- Only the user can access their own wallet data (RLS)
- Public keys are stored in plain text for easy access
- Network separation (testnet/mainnet)

## API Functions

### Server Actions (`app/actions/wallet.ts`)

- `createStellarWallet(userId)`: Creates a new Stellar wallet for a user
- `getStellarWallet(userId)`: Retrieves wallet information (public key only)
- `checkWalletBalance(userId)`: Checks if the account exists and is funded

### Utility Functions (`lib/stellar.ts`)

- `generateStellarKeypair()`: Generates new Stellar keypair
- `encryptSecretKey(secretKey)`: Encrypts secret key for storage
- `decryptSecretKey(encryptedKey)`: Decrypts secret key when needed
- `fundTestAccount(publicKey)`: Funds testnet account using Friendbot
- `checkAccountExists(publicKey)`: Checks if Stellar account exists

## Usage Examples

### Creating a Wallet (Automatic)
Wallets are created automatically during user signup. No additional code needed.

### Checking Wallet Status
```typescript
import { getStellarWallet } from '@/app/actions/wallet'

const { data: wallet, error } = await getStellarWallet(userId)
if (wallet) {
  console.log('Public Key:', wallet.public_key)
  console.log('Network:', wallet.network)
  console.log('Funded:', wallet.is_funded)
}
```

### Checking Account Balance
```typescript
import { checkWalletBalance } from '@/app/actions/wallet'

const { data: balance, error } = await checkWalletBalance(userId)
if (balance) {
  console.log('Account exists:', balance.accountExists)
  console.log('Public Key:', balance.publicKey)
}
```

## Database Schema

### `stellar_wallets` Table
```sql
CREATE TABLE public.stellar_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL UNIQUE,
  secret_key_encrypted TEXT NOT NULL,
  account_id TEXT NOT NULL UNIQUE,
  network TEXT NOT NULL DEFAULT 'testnet',
  is_funded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Considerations

1. **Encryption Key**: Use a strong, unique encryption key in production
2. **Network Separation**: Always use testnet for development
3. **Key Management**: Consider using a proper key management system for production
4. **Access Control**: RLS policies ensure users can only access their own wallets

## Testing

1. Set up environment variables
2. Run database migration
3. Create a new user account
4. Check the `stellar_wallets` table to verify wallet creation
5. On testnet, verify the account is funded using Stellar Explorer

## Production Deployment

1. Change `NEXT_PUBLIC_STELLAR_NETWORK` to `mainnet`
2. Update `NEXT_PUBLIC_STELLAR_HORIZON_URL` to mainnet URL
3. Use a strong, unique `STELLAR_ENCRYPTION_KEY`
4. Fund accounts manually or through your application logic
5. Test thoroughly before going live

## Troubleshooting

### Wallet Creation Fails
- Check database migration was applied
- Verify environment variables are set
- Check Supabase logs for errors

### Testnet Funding Fails
- Verify you're on testnet network
- Check Stellar Friendbot is accessible
- Account funding is optional and won't fail signup

### Secret Key Decryption Issues
- Verify `STELLAR_ENCRYPTION_KEY` is consistent
- Check encryption/decryption functions
- Ensure proper error handling
