import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { 
  createTrustline, 
  hasTrustline, 
  transferTokens,
  decryptSecretKey,
  checkAccountExists,
  STELLAR_NETWORK 
} from "@/lib/stellar"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Parse request body
    const { listingId, quantity } = await request.json()

    if (!listingId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Invalid listing ID or quantity" }, { status: 400 })
    }

    // Get the token listing
    const { data: listing, error: listingError } = await serviceSupabase
      .from("token_listings")
      .select(`
        *,
        artist:profiles!artist_id(id, handle, display_name),
        token:artist_tokens!token_id(id, display_name, symbol, price),
        stellar_asset:artist_stellar_assets!stellar_asset_id(*)
      `)
      .eq("id", listingId)
      .eq("is_active", true)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: "Token listing not found or inactive" }, { status: 404 })
    }

    // Check if enough tokens are available
    if (listing.available_supply < quantity) {
      return NextResponse.json({ 
        error: "Insufficient tokens available",
        available: listing.available_supply 
      }, { status: 400 })
    }

    // Calculate total price
    const totalPrice = parseFloat(listing.price_xlm) * quantity

    // Get fan's Stellar wallet
    const { data: fanWallet, error: walletError } = await serviceSupabase
      .from("stellar_wallets")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (walletError || !fanWallet) {
      return NextResponse.json({ error: "Stellar wallet not found. Please create a wallet first." }, { status: 404 })
    }

    // Check if fan's wallet is funded
    const isFunded = await checkAccountExists(fanWallet.public_key)
    if (!isFunded) {
      return NextResponse.json({ 
        error: "Your Stellar wallet needs to be funded first",
        fundingUrl: STELLAR_NETWORK === 'testnet' 
          ? `https://friendbot.stellar.org?addr=${fanWallet.public_key}`
          : null
      }, { status: 400 })
    }

    const steps = []

    // Step 1: Check/Create trustline for the token
    const assetCode = listing.stellar_asset.asset_code
    const issuerPublicKey = listing.stellar_asset.issuer_public_key
    
    const trustlineExists = await hasTrustline(
      fanWallet.public_key,
      assetCode,
      issuerPublicKey
    )

    if (!trustlineExists) {
      console.log("[marketplace-buy] Creating trustline for fan...")
      const fanSecretKey = decryptSecretKey(fanWallet.secret_key_encrypted)
      
      const trustlineResult = await createTrustline(
        fanSecretKey,
        assetCode,
        issuerPublicKey
      )

      if (!trustlineResult.success) {
        steps.push({ step: "create_trustline", status: "failed", error: trustlineResult.error })
        return NextResponse.json({ 
          error: "Failed to create trustline", 
          steps,
          details: trustlineResult.error 
        }, { status: 500 })
      }

      steps.push({ 
        step: "create_trustline", 
        status: "success", 
        transactionHash: trustlineResult.transactionHash 
      })
    } else {
      steps.push({ step: "create_trustline", status: "already_exists" })
    }

    // Step 2: Transfer tokens from distributor to fan
    console.log("[marketplace-buy] Transferring tokens to fan...")
    const distributorSecretKey = decryptSecretKey(listing.stellar_asset.distributor_secret_encrypted)
    
    const transferResult = await transferTokens(
      distributorSecretKey,
      fanWallet.public_key,
      assetCode,
      issuerPublicKey,
      quantity.toString()
    )

    if (!transferResult.success) {
      steps.push({ step: "transfer_tokens", status: "failed", error: transferResult.error })
      return NextResponse.json({ 
        error: "Failed to transfer tokens", 
        steps,
        details: transferResult.error 
      }, { status: 500 })
    }

    steps.push({ 
      step: "transfer_tokens", 
      status: "success", 
      transactionHash: transferResult.transactionHash 
    })

    // Step 3: Update database records
    console.log("[marketplace-buy] Updating database records...")

    // Create purchase record
    const { data: purchase, error: purchaseError } = await serviceSupabase
      .from("token_purchases")
      .insert({
        listing_id: listingId,
        buyer_id: profile.id,
        quantity: quantity,
        price_per_token_xlm: listing.price_xlm,
        total_price_xlm: totalPrice,
        stellar_transaction_hash: transferResult.transactionHash,
        status: 'completed'
      })
      .select()
      .single()

    if (purchaseError) {
      console.error("Error creating purchase record:", purchaseError)
      // Token transfer succeeded but database update failed
      // In production, you'd want to implement compensation logic
    }

    // Update listing available supply
    const { error: updateError } = await serviceSupabase
      .from("token_listings")
      .update({ 
        available_supply: listing.available_supply - quantity,
        updated_at: new Date().toISOString()
      })
      .eq("id", listingId)

    if (updateError) {
      console.error("Error updating listing supply:", updateError)
    }

    // Update/create fan token balance
    const { data: existingBalance, error: balanceCheckError } = await serviceSupabase
      .from("fan_token_balances")
      .select("*")
      .eq("fan_id", profile.id)
      .eq("token_id", listing.token_id)
      .single()

    if (existingBalance) {
      // Update existing balance
      const newBalance = existingBalance.balance + quantity
      const newTotalPurchased = existingBalance.total_purchased + quantity
      const newAveragePrice = (
        (existingBalance.average_purchase_price_xlm * existingBalance.total_purchased) + 
        (parseFloat(listing.price_xlm) * quantity)
      ) / newTotalPurchased

      await serviceSupabase
        .from("fan_token_balances")
        .update({
          balance: newBalance,
          total_purchased: newTotalPurchased,
          average_purchase_price_xlm: newAveragePrice,
          has_trustline: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingBalance.id)
    } else {
      // Create new balance record
      await serviceSupabase
        .from("fan_token_balances")
        .insert({
          fan_id: profile.id,
          token_id: listing.token_id,
          stellar_asset_id: listing.stellar_asset_id,
          balance: quantity,
          total_purchased: quantity,
          average_purchase_price_xlm: listing.price_xlm,
          has_trustline: true,
          trustline_created_at: new Date().toISOString()
        })
    }

    return NextResponse.json({
      success: true,
      purchase: {
        id: purchase?.id,
        quantity: quantity,
        totalPrice: totalPrice,
        transactionHash: transferResult.transactionHash,
        token: {
          name: listing.token.display_name,
          symbol: listing.token.symbol,
          artist: listing.artist.display_name
        }
      },
      steps
    })

  } catch (error) {
    console.error("Marketplace buy error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
