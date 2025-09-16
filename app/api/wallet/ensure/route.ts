import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createEncryptedStellarWallet, fundTestAccount } from "@/lib/stellar"

export async function POST() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check existing wallet
    const { data: existing, error: selectError } = await supabase
      .from("stellar_wallets")
      .select("id, public_key, account_id, network, is_funded, created_at")
      .eq("user_id", user.id)
      .maybeSingle()

    if (selectError) {
      console.error("[ensure wallet] selectError:", selectError)
      return NextResponse.json({ error: selectError.message, code: selectError.code }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ wallet: existing }, { status: 200 })
    }

    // Create wallet data in app layer
    const wallet = createEncryptedStellarWallet()

    // Try insert, handle unique/race conditions
    const { data: inserted, error: insertError } = await supabase
      .from("stellar_wallets")
      .insert({
        user_id: user.id,
        public_key: wallet.publicKey,
        secret_key_encrypted: wallet.secretKeyEncrypted,
        account_id: wallet.accountId,
        network: wallet.network,
        is_funded: false,
      })
      .select("id, public_key, account_id, network, is_funded, created_at")
      .single()

    if (insertError) {
      // If conflict happened because another request created it, re-select
      if ((insertError as any).code === "23505") {
        const { data: nowExisting } = await supabase
          .from("stellar_wallets")
          .select("id, public_key, account_id, network, is_funded, created_at")
          .eq("user_id", user.id)
          .maybeSingle()
        if (nowExisting) {
          return NextResponse.json({ wallet: nowExisting }, { status: 200 })
        }
      }
      console.error("[ensure wallet] insertError:", insertError)
      return NextResponse.json({ error: insertError.message, code: insertError.code }, { status: 500 })
    }

    // Attempt testnet funding (best-effort)
    if (inserted.network === "testnet") {
      try {
        const funded = await fundTestAccount(inserted.public_key)
        if (funded) {
          await supabase.from("stellar_wallets").update({ is_funded: true }).eq("id", inserted.id)
          inserted.is_funded = true
        }
      } catch (fundErr) {
        console.warn("[ensure wallet] friendbot funding failed:", fundErr)
        // Non-fatal
      }
    }

    return NextResponse.json({ wallet: inserted }, { status: 201 })
  } catch (e: any) {
    console.error("[ensure wallet] unexpected error:", e)
    return NextResponse.json({ error: e?.message || "Internal Server Error" }, { status: 500 })
  }
}
