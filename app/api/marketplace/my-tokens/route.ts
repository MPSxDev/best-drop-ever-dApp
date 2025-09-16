import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTokenBalance } from "@/lib/stellar"

export async function GET() {
  try {
    const supabase = await createClient()

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

    // Get fan's token balances
    const { data: balances, error: balancesError } = await supabase
      .from("fan_token_balances")
      .select(`
        *,
        token:artist_tokens!token_id(
          id, 
          display_name, 
          symbol, 
          price,
          artist:profiles!artist_id(id, handle, display_name, avatar_url)
        ),
        stellar_asset:artist_stellar_assets!stellar_asset_id(
          asset_code, 
          issuer_public_key, 
          distributor_public_key,
          network
        )
      `)
      .eq("fan_id", profile.id)
      .gt("balance", 0)
      .order("updated_at", { ascending: false })

    if (balancesError) {
      console.error("Error fetching fan token balances:", balancesError)
      return NextResponse.json({ error: "Failed to fetch token balances" }, { status: 500 })
    }

    // Get user's Stellar wallet to check live balances
    const { data: wallet, error: walletError } = await supabase
      .from("stellar_wallets")
      .select("*")
      .eq("user_id", user.id)
      .single()

    const enrichedBalances = []

    if (balances && wallet) {
      // Enrich with live Stellar balances
      for (const balance of balances) {
        try {
          const liveBalance = await getTokenBalance(
            wallet.public_key,
            balance.stellar_asset.asset_code,
            balance.stellar_asset.issuer_public_key
          )

          enrichedBalances.push({
            id: balance.id,
            balance: balance.balance,
            liveBalance: liveBalance,
            totalPurchased: balance.total_purchased,
            averagePurchasePrice: balance.average_purchase_price_xlm,
            hasTrustline: balance.has_trustline,
            token: balance.token,
            stellarAsset: balance.stellar_asset,
            updatedAt: balance.updated_at
          })
        } catch (error) {
          console.error(`Error getting live balance for ${balance.stellar_asset.asset_code}:`, error)
          enrichedBalances.push({
            id: balance.id,
            balance: balance.balance,
            liveBalance: 0,
            totalPurchased: balance.total_purchased,
            averagePurchasePrice: balance.average_purchase_price_xlm,
            hasTrustline: balance.has_trustline,
            token: balance.token,
            stellarAsset: balance.stellar_asset,
            updatedAt: balance.updated_at
          })
        }
      }
    }

    // Get purchase history
    const { data: purchases, error: purchasesError } = await supabase
      .from("token_purchases")
      .select(`
        *,
        listing:token_listings!listing_id(
          token:artist_tokens!token_id(
            display_name, 
            symbol,
            artist:profiles!artist_id(handle, display_name)
          )
        )
      `)
      .eq("buyer_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      balances: enrichedBalances,
      recentPurchases: purchases || [],
      wallet: wallet ? {
        publicKey: wallet.public_key,
        network: wallet.network,
        isFunded: wallet.is_funded
      } : null
    })

  } catch (error) {
    console.error("Get my tokens error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
