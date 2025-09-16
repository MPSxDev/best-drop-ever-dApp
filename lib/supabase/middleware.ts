import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[v0] Supabase environment variables not found, using mock middleware')
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  console.log("[v0] Middleware - user authenticated:", !!user)
  if (userError) {
    console.log("[v0] Middleware - user error:", userError.message)
  }
  if (user) {
    console.log("[v0] Middleware - user email:", user.email)
  }

  // Protect routes that require authentication
  const protectedRoutes = ['/home', '/profile', '/wallet', '/activity', '/explore']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    console.log("[v0] Middleware - redirecting to login for protected route:", request.nextUrl.pathname)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}
