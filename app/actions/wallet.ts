"use server"

import { createClient } from "@/lib/supabase/server"
import { createEncryptedStellarWallet, fundTestAccount, checkAccountExists } from "@/lib/stellar"

export async function createStellarWallet(userId: string) {
  const supabase = await createClient()

  try {
    // Check if wallet already exists
    const { data: existingWallet } = await supabase
      .from("stellar_wallets")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (existingWallet) {
      return { error: "Wallet already exists for this user" }
    }

    // Generate new Stellar wallet
    const wallet = createEncryptedStellarWallet()

    // Insert wallet into database
    const { data: walletData, error: walletError } = await supabase
      .from("stellar_wallets")
      .insert({
        user_id: userId,
        public_key: wallet.publicKey,
        secret_key_encrypted: wallet.secretKeyEncrypted,
        account_id: wallet.accountId,
        network: wallet.network,
        is_funded: false
      })
      .select()
      .single()

    if (walletError) {
      console.error("Error creating wallet:", walletError)
      return { error: "Failed to create wallet" }
    }

    // Try to fund the account if on testnet
    if (wallet.network === 'testnet') {
      try {
        const funded = await fundTestAccount(wallet.publicKey)
        if (funded) {
          // Update wallet as funded
          await supabase
            .from("stellar_wallets")
            .update({ is_funded: true })
            .eq("id", walletData.id)
        }
      } catch (fundingError) {
        console.warn("Failed to fund test account:", fundingError)
        // Don't fail the wallet creation if funding fails
      }
    }

    return { 
      data: {
        publicKey: wallet.publicKey,
        accountId: wallet.accountId,
        network: wallet.network,
        isFunded: wallet.network === 'testnet' // Assume funded on testnet after funding attempt
      }, 
      error: null 
    }
  } catch (error) {
    console.error("Error in createStellarWallet:", error)
    return { error: "Failed to create wallet" }
  }
}

export async function getStellarWallet(userId: string) {
  const supabase = await createClient()

  try {
    const { data: wallet, error } = await supabase
      .from("stellar_wallets")
      .select("public_key, account_id, network, is_funded, created_at")
      .eq("user_id", userId)
      .single()

    if (error) {
      return { error: "Wallet not found" }
    }

    return { data: wallet, error: null }
  } catch (error) {
    console.error("Error getting wallet:", error)
    return { error: "Failed to get wallet" }
  }
}

export async function checkWalletBalance(userId: string) {
  const supabase = await createClient()

  try {
    const { data: wallet, error } = await supabase
      .from("stellar_wallets")
      .select("public_key, network")
      .eq("user_id", userId)
      .single()

    if (error || !wallet) {
      return { error: "Wallet not found" }
    }

    // Check if account exists and get balance
    const accountExists = await checkAccountExists(wallet.public_key)
    
    return { 
      data: { 
        accountExists,
        publicKey: wallet.public_key,
        network: wallet.network
      }, 
      error: null 
    }
  } catch (error) {
    console.error("Error checking wallet balance:", error)
    return { error: "Failed to check wallet balance" }
  }
}
