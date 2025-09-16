import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not found, using mock client')
    return createMockServerClient()
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      },
    },
  })
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
let mockServerClient: any = null

async function createMockServerClient() {
  if (mockServerClient) {
    return mockServerClient
  }

  console.log("[v0] Mock server get user")

  const createQueryBuilder = (table: string) => {
    const filters: any[] = []
    let isSingle = false
    let columns = "*"

    const builder = {
      select: (cols?: string) => {
        console.log("[v0] Mock select from", table, cols)
        columns = cols || "*"
        return builder
      },
      eq: (column: string, value: any) => {
        console.log("[v0] Mock eq filter:", column, value)
        filters.push({ column, value, type: "eq" })
        return builder
      },
      single: () => {
        console.log("[v0] Mock single result")
        isSingle = true
        return builder
      },
      gt: (column: string, value: any) => {
        console.log("[v0] Mock gt filter:", column, value)
        filters.push({ column, value, type: "gt" })
        return builder
      },
      lte: (column: string, value: any) => {
        console.log("[v0] Mock lte filter:", column, value)
        filters.push({ column, value, type: "lte" })
        return builder
      },
      order: (column: string, options?: { ascending?: boolean }) => {
        console.log("[v0] Mock order by:", column, options)
        return builder
      },
      limit: (count: number) => {
        console.log("[v0] Mock limit:", count)
        return builder
      },
      insert: (data: any) => {
        console.log("[v0] Mock insert into", table, data)
        return Promise.resolve({ data, error: null })
      },
      update: (data: any) => {
        console.log("[v0] Mock update in", table, data)
        return {
          eq: (column: string, value: any) => {
            console.log("[v0] Mock update eq:", column, value)
            return Promise.resolve({ data, error: null })
          },
        }
      },
      delete: () => {
        console.log("[v0] Mock delete from", table)
        return {
          eq: (column: string, value: any) => {
            console.log("[v0] Mock delete eq:", column, value)
            return Promise.resolve({ data: null, error: null })
          },
        }
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

  mockServerClient = {
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: mockUser },
          error: null,
        }),
      signInWithPassword: ({ email, password }: { email: string; password: string }) => {
        console.log("[v0] Mock sign in:", email)
        return Promise.resolve({
          data: { user: mockUser, session: { access_token: "mock-token" } },
          error: null,
        })
      },
      signUp: ({ email, password }: { email: string; password: string }) => {
        console.log("[v0] Mock sign up:", email)
        return Promise.resolve({
          data: { user: mockUser, session: { access_token: "mock-token" } },
          error: null,
        })
      },
      signOut: () => {
        console.log("[v0] Mock sign out")
        return Promise.resolve({ error: null })
      },
    },
    from: (table: string) => {
      const builder = createQueryBuilder(table)


      return builder
    },
  }

  return mockServerClient
}

export async function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase service role key not found, using mock service client')
    return createMockServiceClient()
  }

  return createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {
        // Service client doesn't need to set cookies
      },
    },
  })
}

function createMockServiceClient() {
  console.log("[v0] Creating mock service client")

  return {
    auth: {
      admin: {
        createUser: (params: { 
          email: string; 
          password: string; 
          email_confirmed?: boolean;
          user_metadata?: any;
        }) => {
          console.log("[v0] Mock admin create user:", params.email, params)
          return Promise.resolve({
            data: { user: mockUser },
            error: null,
          })
        },
      },
    },
    from: (table: string) => ({
      insert: (data: any) => {
        console.log("[v0] Mock service insert into", table, data)
        return Promise.resolve({ data, error: null })
      },
    }),
  }
}
