import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not found, using mock client')
    return createMockClient()
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Mock user data for development
const mockUser = {
  id: "mock-user-id",
  email: "demo@example.com",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  role: "authenticated",
}

// Create a singleton mock client to prevent recreation
let mockBrowserClient: any = null

function createMockClient() {
  if (mockBrowserClient) {
    return mockBrowserClient
  }

  console.log("[v0] Mock browser client created")

  const createQueryBuilder = (table: string) => {
    const filters: any[] = []
    let isSingle = false
    let columns = "*"

    const builder = {
      select: (cols?: string) => {
        console.log("[v0] Mock browser select from", table, cols)
        columns = cols || "*"
        return builder
      },
      eq: (column: string, value: any) => {
        console.log("[v0] Mock browser eq filter:", column, value)
        filters.push({ column, value, type: "eq" })
        return builder
      },
      single: () => {
        console.log("[v0] Mock browser single result")
        isSingle = true
        return builder
      },
      gt: (column: string, value: any) => {
        console.log("[v0] Mock browser gt filter:", column, value)
        filters.push({ column, value, type: "gt" })
        return builder
      },
      lte: (column: string, value: any) => {
        console.log("[v0] Mock browser lte filter:", column, value)
        filters.push({ column, value, type: "lte" })
        return builder
      },
      order: (column: string, options?: { ascending?: boolean }) => {
        console.log("[v0] Mock browser order by:", column, options)
        return builder
      },
      limit: (count: number) => {
        console.log("[v0] Mock browser limit:", count)
        return builder
      },
      then: (resolve: any, reject?: any) => {
        // This makes the builder thenable (Promise-like)
        const promise = executeQuery()
        return promise.then(resolve, reject)
      },
    }

    const executeQuery = () => {
      return Promise.resolve({
        data: getMockData(table, filters, isSingle),
        error: null,
        count: null,
      })
    }

    return builder
  }

  const getMockData = (table: string, filters: any[], isSingle: boolean) => {
    let data: any[] = []

    switch (table) {
      case "profiles":
        data = [
          {
            id: "mock-profile-id",
            user_id: mockUser.id,
            handle: "demo_user",
            display_name: "Demo User",
            bio: "This is a demo profile for testing",
            avatar_url: "/demo-user-avatar.png",
            role: "FAN",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        break
      case "artist_tokens":
        data = [
          {
            id: "mock-token-id",
            artist_id: "mock-artist-id",
            display_name: "Demo Token",
            symbol: "DEMO",
            price: 10.5,
            created_at: new Date().toISOString(),
          },
        ]
        break
      case "notifications":
        data = []
        break
      case "holdings":
        data = []
        break
      case "transactions":
        data = []
        break
      case "follows":
        data = []
        break
      case "posts":
        data = []
        break
      case "comments":
        data = []
        break
      default:
        data = []
    }

    // Apply filters (simplified)
    filters.forEach((filter) => {
      if (filter.type === "eq") {
        data = data.filter((item) => item[filter.column] === filter.value)
      }
    })

    return isSingle ? data[0] || null : data
  }

  mockBrowserClient = {
    auth: {
      signInWithPassword: ({ email, password }: { email: string; password: string }) => {
        console.log("[v0] Mock browser sign in:", email)
        return Promise.resolve({
          data: { user: mockUser, session: { access_token: "mock-token" } },
          error: null,
        })
      },
      signUp: ({ email, password, options }: { email: string; password: string; options?: any }) => {
        console.log("[v0] Mock browser sign up:", email)
        return Promise.resolve({
          data: { user: mockUser, session: { access_token: "mock-token" } },
          error: null,
        })
      },
      signOut: () => {
        console.log("[v0] Mock browser sign out")
        return Promise.resolve({ error: null })
      },
      getUser: () => {
        console.log("[v0] Mock browser get user")
        return Promise.resolve({
          data: { user: mockUser },
          error: null,
        })
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        console.log("[v0] Mock auth state change listener")
        setTimeout(() => callback("SIGNED_IN", { user: mockUser }), 100)
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
    },
    from: (table: string) => {
      const builder = createQueryBuilder(table)

      // Add direct methods for non-chained operations
      builder.insert = (data: any) => {
        console.log("[v0] Mock browser insert into", table, data)
        return Promise.resolve({ data, error: null })
      }

      builder.update = (data: any) => {
        console.log("[v0] Mock browser update in", table, data)
        return {
          eq: (column: string, value: any) => {
            console.log("[v0] Mock browser update eq:", column, value)
            return Promise.resolve({ data, error: null })
          },
        }
      }

      builder.delete = () => {
        console.log("[v0] Mock browser delete from", table)
        return {
          eq: (column: string, value: any) => {
            console.log("[v0] Mock browser delete eq:", column, value)
            return Promise.resolve({ data: null, error: null })
          },
        }
      }

      return builder
    },
  }

  return mockBrowserClient
}
