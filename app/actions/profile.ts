"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function createProfile(handle: string, displayName: string, bio?: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: "User not authenticated" }
  }

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (existingProfile) {
    return { error: "Profile already exists" }
  }

  // Check if handle is taken
  const { data: handleTaken } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .single()

  if (handleTaken) {
    return { error: "Handle is already taken" }
  }

  // Create profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      user_id: user.id,
      handle,
      display_name: displayName,
      bio: bio || "",
      role: "FAN", // Default role
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (profileError) {
    return { error: profileError.message }
  }

  return { data: profile, error: null }
}
