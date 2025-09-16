// Script to create demo users in Supabase Auth
// This needs to run server-side with service role key

async function createDemoUsers() {
  console.log("[v0] Creating demo users...")

  try {
    // Dynamic import to avoid bundling Node.js dependencies in browser
    const { createClient } = await import("@supabase/supabase-js")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create DJ user
    const { data: djUser, error: djError } = await supabase.auth.admin.createUser({
      email: "iamjuampi@demo.app",
      password: "1234",
      email_confirm: true, // Skip email confirmation for demo
      user_metadata: {
        handle: "iamjuampi",
        display_name: "Juan Pablo",
        role: "DJ",
      },
    })

    if (djError) {
      console.log("[v0] DJ user might already exist:", djError.message)
    } else {
      console.log("[v0] Created DJ user:", djUser.user?.email)
    }

    // Create Fan user
    const { data: fanUser, error: fanError } = await supabase.auth.admin.createUser({
      email: "fan@demo.app",
      password: "1234",
      email_confirm: true, // Skip email confirmation for demo
      user_metadata: {
        handle: "fan",
        display_name: "Music Fan",
        role: "FAN",
      },
    })

    if (fanError) {
      console.log("[v0] Fan user might already exist:", fanError.message)
    } else {
      console.log("[v0] Created Fan user:", fanUser.user?.email)
    }

    console.log("[v0] Demo users setup complete!")
  } catch (error) {
    console.error("[v0] Error creating demo users:", error)
  }
}

createDemoUsers()
