import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function POST() {
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

    // Only DJs can create listings
    if (profile.role !== 'DJ') {
      return NextResponse.json({ error: "Only artists can create token listings" }, { status: 403 })
    }

    console.log("[create-listing] Artist profile:", profile.handle)

    // Get artist's token and stellar asset info
    const { data: artistToken, error: tokenError } = await serviceSupabase
      .from("artist_tokens")
      .select(`
        *,
        stellar_asset:artist_stellar_assets!token_id(*)
      `)
      .eq("artist_id", profile.id)
      .single()

    if (tokenError || !artistToken) {
      console.log("[create-listing] No artist token found:", tokenError)
      return NextResponse.json({ 
        error: "Artist token not found. Please create your token first." 
      }, { status: 404 })
    }

    if (!artistToken.stellar_asset) {
      console.log("[create-listing] No stellar asset found")
      return NextResponse.json({ 
        error: "Stellar asset not found. Please issue your token on Stellar first." 
      }, { status: 404 })
    }

    console.log("[create-listing] Found token:", artistToken.symbol, "and stellar asset:", artistToken.stellar_asset.asset_code)

    // Check if there's already an active listing
    const { data: existingListing, error: listingCheckError } = await serviceSupabase
      .from("token_listings")
      .select("*")
      .eq("artist_id", profile.id)
      .eq("token_id", artistToken.id)
      .eq("is_active", true)
      .single()

    if (existingListing) {
      console.log("[create-listing] Listing already exists:", existingListing.id)
      return NextResponse.json({ 
        success: true,
        listing: existingListing,
        message: "Token listing already exists"
      })
    }

    // Create the token listing with default values
    const defaultPriceXlm = 0.1 // 0.1 XLM per token
    const defaultTotalSupply = 10000 // 10,000 tokens available

    const { data: listing, error: listingError } = await serviceSupabase
      .from("token_listings")
      .insert({
        artist_id: profile.id,
        token_id: artistToken.id,
        stellar_asset_id: artistToken.stellar_asset.id,
        price_xlm: defaultPriceXlm,
        total_supply: defaultTotalSupply,
        available_supply: defaultTotalSupply,
        is_active: true
      })
      .select(`
        *,
        artist:profiles!artist_id(id, handle, display_name),
        token:artist_tokens!token_id(id, display_name, symbol, price),
        stellar_asset:artist_stellar_assets!stellar_asset_id(asset_code, issuer_public_key)
      `)
      .single()

    if (listingError) {
      console.error("[create-listing] Error creating token listing:", listingError)
      return NextResponse.json({ error: "Failed to create token listing: " + listingError.message }, { status: 500 })
    }

    console.log("[create-listing] Successfully created listing:", listing.id)

    return NextResponse.json({
      success: true,
      listing: {
        id: listing.id,
        priceXlm: listing.price_xlm,
        totalSupply: listing.total_supply,
        availableSupply: listing.available_supply,
        token: {
          name: listing.token.display_name,
          symbol: listing.token.symbol,
          price: listing.token.price
        },
        stellarAsset: {
          code: listing.stellar_asset.asset_code,
          issuer: listing.stellar_asset.issuer_public_key
        },
        createdAt: listing.created_at
      }
    })

  } catch (error) {
    console.error("[create-listing] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
