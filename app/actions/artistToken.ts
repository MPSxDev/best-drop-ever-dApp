"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { 
  createStellarServer,
  getNetworkPassphrase,
  STELLAR_NETWORK,
  generateStellarKeypair,
  encryptSecretKey,
  fundTestAccount
} from "@/lib/stellar"
import * as Stellar from "@stellar/stellar-sdk"

type CreateArtistTokenResult = {
  artistId: string
  assetCode: string
  issuerPublicKey: string
  distributorPublicKey: string
  network: string
}

/**
 * Generate a <= 6 character Stellar asset code from the artist name.
 * Ensures uppercase and alphanumeric only. Falls back to random if needed.
 */
function generateAssetCodeBase(artistName: string): string {
  const cleaned = (artistName || "ARTIST")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
  if (cleaned.length >= 3) return cleaned.slice(0, 6)
  const pad = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "")
  return (cleaned + pad).slice(0, 6)
}

async function ensureUniqueAssetCode(supabase: any, base: string): Promise<string> {
  let code = base
  let attempt = 0
  // Not strictly unique in DB, but we avoid collisions in our assets table per network
  while (attempt < 10) {
    const { data, error } = await supabase
      .from("artist_stellar_assets")
      .select("id")
      .eq("asset_code", code)
      .eq("network", STELLAR_NETWORK)
      .limit(1)

    if (error) {
      // If query fails for any reason, break to avoid infinite loop
      break
    }
    const exists = Array.isArray(data) ? data.length > 0 : !!data
    if (!exists) return code

    // Try with short suffix; keep within 6 chars
    const suffix = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 2)
    code = (base + suffix).slice(0, 6)
    attempt++
  }
  return code
}

/**
 * Create issuer and distributor accounts, set up trustline for the asset,
 * and persist metadata in Supabase.
 */
export async function createArtistToken(artistId: string, artistName: string): Promise<{ data?: CreateArtistTokenResult, error?: string }> {
  if (!artistId) return { error: "artistId is required" }

  const supabase = await createServiceClient()
  const sb: any = supabase

  // Check if artist already has a token
  const { data: existingToken, error: existingErr } = await sb
    .from("artist_tokens")
    .select("id, symbol")
    .eq("artist_id", artistId)
    .single()

  if (existingErr && existingErr.code && existingErr.code !== "PGRST116") {
    // Ignore not found; otherwise bubble
    // PGRST116: Results contain 0 rows (PostgREST)
  } else if (existingToken) {
    // Token exists; ensure Stellar asset row exists too
    const { data: assetRow } = await sb
      .from("artist_stellar_assets")
      .select("asset_code, issuer_public_key, distributor_public_key, network")
      .eq("token_id", existingToken.id)
      .single()

    if (assetRow) {
      return { data: {
        artistId,
        assetCode: assetRow.asset_code,
        issuerPublicKey: assetRow.issuer_public_key,
        distributorPublicKey: assetRow.distributor_public_key,
        network: assetRow.network,
      }}
    }
    // If no asset metadata, continue to create it using the existing symbol
  }

  // Prepare asset code
  const base = generateAssetCodeBase(artistName)
  const assetCode = await ensureUniqueAssetCode(supabase, base)

  // Create Stellar accounts
  const issuer = generateStellarKeypair()
  const distributor = generateStellarKeypair()

  // Fund on testnet using Friendbot (best-effort, non-blocking)
  let fundingSuccessful = false
  if (STELLAR_NETWORK === "testnet") {
    try {
      const [fundIssuerOk, fundDistributorOk] = await Promise.all([
        fundTestAccount(issuer.publicKey).catch(() => false),
        fundTestAccount(distributor.publicKey).catch(() => false)
      ])
      fundingSuccessful = fundIssuerOk && fundDistributorOk
      if (!fundingSuccessful) {
        console.warn("Testnet funding failed, but continuing with token creation")
      }
    } catch (e) {
      console.warn("Testnet funding error:", e)
      // Continue anyway
    }
  }

  // Establish trustline from distributor to the issuer asset (only if funded)
  if (STELLAR_NETWORK === "testnet" && fundingSuccessful) {
    try {
      const server = createStellarServer()
      const passphrase = getNetworkPassphrase()

      const asset = new Stellar.Asset(assetCode, issuer.publicKey)

      const distributorAccount = await server.loadAccount(distributor.publicKey)

      const trustTx = new Stellar.TransactionBuilder(distributorAccount, {
        fee: Stellar.BASE_FEE,
        networkPassphrase: passphrase
      })
        .addOperation(Stellar.Operation.changeTrust({ asset }))
        .setTimeout(180)
        .build()

      trustTx.sign(Stellar.Keypair.fromSecret(distributor.secretKey))
      await server.submitTransaction(trustTx)
    } catch (e) {
      console.warn("Error creating trustline (non-fatal):", e)
      // Don't fail the entire process for trustline issues
    }
  } else if (STELLAR_NETWORK === "testnet") {
    console.warn("Skipping trustline creation due to funding failure")
  }

  // Upsert app-level token and link to Stellar asset
  let tokenId: string
  {
    // Create or reuse artist_tokens entry
    const symbol = assetCode
    if (!existingToken) {
      const { error: tokenErr } = await supabase
        .from("artist_tokens")
        .insert({
          artist_id: artistId,
          symbol,
          display_name: artistName
        })

      if (tokenErr) {
        return { error: "Failed to create artist token record" }
      }
      // Fetch inserted row id
      const { data: fetchedToken, error: fetchErr } = await sb
        .from("artist_tokens")
        .select("id")
        .eq("artist_id", artistId)
        .single()

      if (fetchErr || !fetchedToken) {
        return { error: "Failed to fetch created artist token" }
      }
      tokenId = fetchedToken.id
    } else {
      tokenId = existingToken.id
    }
  }

  // Persist Stellar asset/account metadata
  console.log("[createArtistToken] Saving Stellar asset metadata...")
  const assetData = {
    artist_id: artistId,
    token_id: tokenId,
    asset_code: assetCode,
    issuer_public_key: issuer.publicKey,
    distributor_public_key: distributor.publicKey,
    issuer_secret_encrypted: encryptSecretKey(issuer.secretKey),
    distributor_secret_encrypted: encryptSecretKey(distributor.secretKey),
    network: STELLAR_NETWORK
  }
  
  console.log("[createArtistToken] Asset data to insert:", assetData)
  
  const assetInsertResult = await supabase
    .from("artist_stellar_assets")
    .insert(assetData)

  if (assetInsertResult.error) {
    console.error("Error saving asset metadata:", assetInsertResult.error)
    return { error: "Failed to save asset metadata. Check if table exists: " + assetInsertResult.error.message }
  }

  const insertedAsset = assetInsertResult.data
  
  console.log("[createArtistToken] Successfully saved asset metadata:", insertedAsset)

  return {
    data: {
      artistId,
      assetCode,
      issuerPublicKey: issuer.publicKey,
      distributorPublicKey: distributor.publicKey,
      network: STELLAR_NETWORK,
    }
  }
}


