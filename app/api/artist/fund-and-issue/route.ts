import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { 
  createStellarServer,
  getNetworkPassphrase,
  STELLAR_NETWORK,
  fundTestAccount,
  decryptSecretKey,
  checkAccountExists
} from "@/lib/stellar"
import * as Stellar from "@stellar/stellar-sdk"

export async function POST() {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Load profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, user_id, display_name, role")
      .eq("user_id", user.id)
      .single()

    if (profileError || !profile || profile.role !== "DJ") {
      return NextResponse.json({ error: "DJ profile not found" }, { status: 404 })
    }

    // Get Stellar asset info (using service client to bypass RLS)
    const { data: stellarAsset, error: assetError } = await serviceSupabase
      .from("artist_stellar_assets")
      .select("*")
      .eq("artist_id", profile.id)
      .single()

    if (assetError || !stellarAsset) {
      console.log("[fund-and-issue] Asset lookup failed:", { 
        profileId: profile.id, 
        error: assetError,
        stellarAsset 
      })
      
      // Debug: Check what's in the table
      const { data: allAssets } = await serviceSupabase
        .from("artist_stellar_assets")
        .select("*")
      
      console.log("[fund-and-issue] All assets in table:", allAssets)
      
      return NextResponse.json({ 
        error: "Stellar asset not found", 
        debug: { 
          profileId: profile.id, 
          assetError,
          allAssets: allAssets?.length || 0
        }
      }, { status: 404 })
    }

    console.log("[fund-and-issue] Found asset:", stellarAsset.asset_code)

    if (STELLAR_NETWORK !== "testnet") {
      return NextResponse.json({ error: "Only available on testnet" }, { status: 400 })
    }

    const steps = []

    // Step 1: Check if accounts are already funded
    console.log("[fund-and-issue] Checking account funding status...")
    const [issuerExists, distributorExists] = await Promise.all([
      checkAccountExists(stellarAsset.issuer_public_key),
      checkAccountExists(stellarAsset.distributor_public_key)
    ])

    console.log("[fund-and-issue] Account status:", { issuerExists, distributorExists })

    // Fund accounts if needed
    let fundIssuerOk = issuerExists
    let fundDistributorOk = distributorExists

    if (!issuerExists) {
      console.log("[fund-and-issue] Funding issuer account...")
      fundIssuerOk = await fundTestAccount(stellarAsset.issuer_public_key)
    }

    if (!distributorExists) {
      console.log("[fund-and-issue] Funding distributor account...")  
      fundDistributorOk = await fundTestAccount(stellarAsset.distributor_public_key)
    }

    if (!fundIssuerOk) {
      steps.push({ step: "fund_issuer", status: issuerExists ? "already_funded" : "failed", account: stellarAsset.issuer_public_key })
    } else {
      steps.push({ step: "fund_issuer", status: issuerExists ? "already_funded" : "success", account: stellarAsset.issuer_public_key })
    }

    if (!fundDistributorOk) {
      steps.push({ step: "fund_distributor", status: distributorExists ? "already_funded" : "failed", account: stellarAsset.distributor_public_key })
    } else {
      steps.push({ step: "fund_distributor", status: distributorExists ? "already_funded" : "success", account: stellarAsset.distributor_public_key })
    }

    if (!fundIssuerOk || !fundDistributorOk) {
      return NextResponse.json({ 
        error: "Failed to fund accounts", 
        steps,
        details: "Friendbot funding failed. You can fund manually.",
        manualFunding: {
          issuer: `https://friendbot.stellar.org?addr=${stellarAsset.issuer_public_key}`,
          distributor: `https://friendbot.stellar.org?addr=${stellarAsset.distributor_public_key}`,
          message: "Visit these URLs to fund the accounts manually, then try again."
        },
        asset: {
          code: stellarAsset.asset_code,
          issuer: stellarAsset.issuer_public_key,
          distributor: stellarAsset.distributor_public_key
        }
      }, { status: 200 }) // Return 200 instead of 500 since this is recoverable
    }

    // Step 2: Create trustline
    console.log("[fund-and-issue] Creating trustline...")
    try {
      const server = createStellarServer()
      const passphrase = getNetworkPassphrase()
      const asset = new Stellar.Asset(stellarAsset.asset_code, stellarAsset.issuer_public_key)

      // Decrypt distributor secret
      const distributorSecret = decryptSecretKey(stellarAsset.distributor_secret_encrypted)
      const distributorKeypair = Stellar.Keypair.fromSecret(distributorSecret)

      const distributorAccount = await server.loadAccount(stellarAsset.distributor_public_key)

      const trustTx = new Stellar.TransactionBuilder(distributorAccount, {
        fee: Stellar.BASE_FEE,
        networkPassphrase: passphrase
      })
        .addOperation(Stellar.Operation.changeTrust({ asset }))
        .setTimeout(180)
        .build()

      trustTx.sign(distributorKeypair)
      const trustResult = await server.submitTransaction(trustTx)
      
      steps.push({ 
        step: "create_trustline", 
        status: "success", 
        hash: trustResult.hash,
        explorer: `https://testnet.stellar.expert/explorer/public/tx/${trustResult.hash}`
      })

    } catch (e: any) {
      steps.push({ step: "create_trustline", status: "failed", error: e.message })
      return NextResponse.json({ error: "Failed to create trustline", steps, details: e.message }, { status: 500 })
    }

    // Step 3: Issue initial tokens
    console.log("[fund-and-issue] Issuing tokens...")
    try {
      const server = createStellarServer()
      const passphrase = getNetworkPassphrase()
      const asset = new Stellar.Asset(stellarAsset.asset_code, stellarAsset.issuer_public_key)

      // Decrypt issuer secret
      const issuerSecret = decryptSecretKey(stellarAsset.issuer_secret_encrypted)
      const issuerKeypair = Stellar.Keypair.fromSecret(issuerSecret)

      const issuerAccount = await server.loadAccount(stellarAsset.issuer_public_key)

      const issueTx = new Stellar.TransactionBuilder(issuerAccount, {
        fee: Stellar.BASE_FEE,
        networkPassphrase: passphrase
      })
        .addOperation(Stellar.Operation.payment({
          destination: stellarAsset.distributor_public_key,
          asset: asset,
          amount: "1000000" // Issue 1M tokens initially
        }))
        .setTimeout(180)
        .build()

      issueTx.sign(issuerKeypair)
      const issueResult = await server.submitTransaction(issueTx)
      
      steps.push({ 
        step: "issue_tokens", 
        status: "success", 
        amount: "1000000",
        hash: issueResult.hash,
        explorer: `https://testnet.stellar.expert/explorer/public/tx/${issueResult.hash}`
      })

    } catch (e: any) {
      steps.push({ step: "issue_tokens", status: "failed", error: e.message })
      return NextResponse.json({ error: "Failed to issue tokens", steps, details: e.message }, { status: 500 })
    }

    console.log("[fund-and-issue] Success! Asset is live on Stellar")

    return NextResponse.json({
      success: true,
      message: "Asset successfully created on Stellar blockchain",
      asset: {
        code: stellarAsset.asset_code,
        issuer: stellarAsset.issuer_public_key,
        distributor: stellarAsset.distributor_public_key,
        network: stellarAsset.network
      },
      steps,
      explorers: {
        issuer: `https://testnet.stellar.expert/explorer/public/account/${stellarAsset.issuer_public_key}`,
        distributor: `https://testnet.stellar.expert/explorer/public/account/${stellarAsset.distributor_public_key}`,
        asset: `https://testnet.stellar.expert/explorer/public/asset/${stellarAsset.asset_code}-${stellarAsset.issuer_public_key}`
      }
    })

  } catch (e: any) {
    console.error("[fund-and-issue] Error:", e)
    return NextResponse.json({ error: "Internal Server Error", details: e.message }, { status: 500 })
  }
}
