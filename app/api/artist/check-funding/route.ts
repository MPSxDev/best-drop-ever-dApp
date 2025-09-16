import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { checkAccountExists } from "@/lib/stellar"

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

    // Load profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, user_id, display_name, role")
      .eq("user_id", user.id)
      .single()

    if (profileError || !profile || profile.role !== "DJ") {
      return NextResponse.json({ error: "DJ profile not found" }, { status: 404 })
    }

    // Get Stellar asset info
    const { data: stellarAsset, error: assetError } = await serviceSupabase
      .from("artist_stellar_assets")
      .select("*")
      .eq("artist_id", profile.id)
      .single()

    if (assetError || !stellarAsset) {
      return NextResponse.json({ error: "Stellar asset not found" }, { status: 404 })
    }

    // Check funding status
    const [issuerFunded, distributorFunded] = await Promise.all([
      checkAccountExists(stellarAsset.issuer_public_key),
      checkAccountExists(stellarAsset.distributor_public_key)
    ])

    return NextResponse.json({
      asset: {
        code: stellarAsset.asset_code,
        issuer: stellarAsset.issuer_public_key,
        distributor: stellarAsset.distributor_public_key,
        network: stellarAsset.network
      },
      funding: {
        issuerFunded,
        distributorFunded,
        bothFunded: issuerFunded && distributorFunded
      },
      manualFundingUrls: {
        issuer: `https://friendbot.stellar.org?addr=${stellarAsset.issuer_public_key}`,
        distributor: `https://friendbot.stellar.org?addr=${stellarAsset.distributor_public_key}`
      },
      explorerUrls: {
        issuer: `https://testnet.stellar.expert/explorer/public/account/${stellarAsset.issuer_public_key}`,
        distributor: `https://testnet.stellar.expert/explorer/public/account/${stellarAsset.distributor_public_key}`
      }
    })

  } catch (e: any) {
    console.error("[check-funding] Error:", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
