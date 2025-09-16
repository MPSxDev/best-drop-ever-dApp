import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

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

    // Only DJs can list tokens
    if (profile.role !== 'DJ') {
      return NextResponse.json({ error: "Only artists can list tokens for sale" }, { status: 403 })
    }

    // Parse request body
    const { priceXlm, totalSupply } = await request.json()

    if (!priceXlm || !totalSupply || priceXlm <= 0 || totalSupply <= 0) {
      return NextResponse.json({ error: "Invalid price or supply amount" }, { status: 400 })
    }

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
      return NextResponse.json({ 
        error: "Artist token not found. Please create your token first." 
      }, { status: 404 })
    }

    if (!artistToken.stellar_asset) {
      return NextResponse.json({ 
        error: "Stellar asset not found. Please issue your token on Stellar first." 
      }, { status: 404 })
    }

    // Check if there's already an active listing
    const { data: existingListing, error: listingCheckError } = await serviceSupabase
      .from("token_listings")
      .select("*")
      .eq("artist_id", profile.id)
      .eq("token_id", artistToken.id)
      .eq("is_active", true)
      .single()

    if (existingListing) {
      return NextResponse.json({ 
        error: "You already have an active token listing. Please deactivate it first." 
      }, { status: 400 })
    }

    // Create the token listing
    const { data: listing, error: listingError } = await serviceSupabase
      .from("token_listings")
      .insert({
        artist_id: profile.id,
        token_id: artistToken.id,
        stellar_asset_id: artistToken.stellar_asset.id,
        price_xlm: priceXlm,
        total_supply: totalSupply,
        available_supply: totalSupply,
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
      console.error("Error creating token listing:", listingError)
      return NextResponse.json({ error: "Failed to create token listing" }, { status: 500 })
    }

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
    console.error("List token error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    // Get artist's token listings
    const { data: listings, error: listingsError } = await supabase
      .from("token_listings")
      .select(`
        *,
        token:artist_tokens!token_id(id, display_name, symbol, price),
        stellar_asset:artist_stellar_assets!stellar_asset_id(asset_code, issuer_public_key)
      `)
      .eq("artist_id", profile.id)
      .order("created_at", { ascending: false })

    if (listingsError) {
      console.error("Error fetching artist listings:", listingsError)
      return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      listings: listings || [] 
    })

  } catch (error) {
    console.error("Get artist listings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
