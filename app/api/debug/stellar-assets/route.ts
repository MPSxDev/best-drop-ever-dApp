import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function GET() {
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

    // Get current profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    // Get all artist tokens
    const { data: artistTokens, error: tokensError } = await supabase
      .from("artist_tokens")
      .select("*")
      .order("created_at", { ascending: false })

    // Get all stellar assets (using service client to bypass RLS)
    const { data: stellarAssets, error: assetsError } = await serviceSupabase
      .from("artist_stellar_assets")
      .select("*")
      .order("created_at", { ascending: false })
    
    console.log("[debug] Stellar assets query result:", { stellarAssets, assetsError })

    return NextResponse.json({
      currentUser: {
        id: user.id,
        email: user.email
      },
      currentProfile: profile,
      artistTokens: {
        count: artistTokens?.length || 0,
        data: artistTokens,
        error: tokensError
      },
      stellarAssets: {
        count: stellarAssets?.length || 0,
        data: stellarAssets,
        error: assetsError
      }
    })

  } catch (e: any) {
    console.error("[debug-stellar-assets] Error:", e)
    return NextResponse.json({ error: "Internal Server Error", details: e.message }, { status: 500 })
  }
}
