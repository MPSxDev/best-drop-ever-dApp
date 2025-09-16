import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

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

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Check if artist token exists
    const { data: artistToken, error: tokenError } = await supabase
      .from("artist_tokens")
      .select("id, symbol, display_name, price, created_at")
      .eq("artist_id", profile.id)
      .single()

    if (tokenError && tokenError.code !== "PGRST116") {
      return NextResponse.json({ error: tokenError.message }, { status: 500 })
    }

    // Check if Stellar asset exists
    let stellarAsset = null
    if (artistToken) {
      const { data: asset, error: assetError } = await supabase
        .from("artist_stellar_assets")
        .select("asset_code, issuer_public_key, distributor_public_key, network, created_at")
        .eq("token_id", artistToken.id)
        .single()

      if (assetError && assetError.code !== "PGRST116") {
        return NextResponse.json({ error: assetError.message }, { status: 500 })
      }
      
      stellarAsset = asset
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        displayName: profile.display_name,
        role: profile.role
      },
      hasToken: !!artistToken,
      artistToken: artistToken || null,
      hasStellarAsset: !!stellarAsset,
      stellarAsset: stellarAsset || null
    })
  } catch (e: any) {
    console.error("[token-status] Error:", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
