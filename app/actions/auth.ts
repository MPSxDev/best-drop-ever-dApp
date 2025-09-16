"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signInUser(email: string, password: string) {
  const supabase = await createClient()

  console.log("[v0] Server: Attempting login with email:", email)

  try {
    // First, try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.log("[v0] Server: Sign in error:", (signInError as any).message)
      return { error: (signInError as any).message || "Failed to sign in" }
    } else {
      console.log("[v0] Server: Successfully signed in user")
    }
  } catch (error) {
    console.error("[v0] Server: Unexpected error in signInWithDemo:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }

  redirect("/home")
}
