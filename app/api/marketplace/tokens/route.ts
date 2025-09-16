import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get all active token listings with artist and asset info
    const { data: listings, error: listingsError } = await supabase
      .from("token_listings")
      .select(`
        *,
        artist:profiles!artist_id(id, handle, display_name, avatar_url),
        token:artist_tokens!token_id(id, display_name, symbol, price),
        stellar_asset:artist_stellar_assets!stellar_asset_id(
          asset_code, 
          issuer_public_key, 
          distributor_public_key,
          network
        )
      `)
      .eq("is_active", true)
      .gt("available_supply", 0)
      .order("created_at", { ascending: false })

    if (listingsError) {
      console.error("Error fetching token listings:", listingsError)
      return NextResponse.json({ error: "Failed to fetch token listings" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      listings: listings || [] 
    })

  } catch (error) {
    console.error("Marketplace tokens error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
