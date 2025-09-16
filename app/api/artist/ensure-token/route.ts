import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createArtistToken } from "@/app/actions/artistToken"

export async function POST() {
  const supabase = await createClient()

  try {
    console.log("[ensure-token] Starting request")
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log("[ensure-token] Auth error:", userError)
      return NextResponse.json({ error: "Unauthorized", details: userError }, { status: 401 })
    }

    console.log("[ensure-token] User authenticated:", user.id)

    // Load profile to get role and display_name
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, user_id, display_name, role")
      .eq("user_id", user.id)
      .single()

    if (profileError || !profile) {
      console.log("[ensure-token] Profile error:", profileError)
      return NextResponse.json({ error: "Profile not found", details: profileError }, { status: 404 })
    }

    console.log("[ensure-token] Profile loaded:", profile.role, profile.display_name)

    if (profile.role !== "DJ") {
      console.log("[ensure-token] Skipping - not a DJ")
      return NextResponse.json({ ok: true, skipped: true, reason: "Not a DJ" }, { status: 200 })
    }

    console.log("[ensure-token] Creating artist token...")
    
    // Ensure token exists
    const result = await createArtistToken(profile.id, profile.display_name)

    if (result.error) {
      console.log("[ensure-token] Artist token creation failed:", result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    console.log("[ensure-token] Success:", result.data)
    return NextResponse.json({ data: result.data }, { status: 201 })
  } catch (e: any) {
    console.error("[ensure-token] Unexpected error:", e)
    return NextResponse.json({ 
      error: e?.message || "Internal Server Error", 
      stack: e?.stack,
      details: e
    }, { status: 500 })
  }
}
