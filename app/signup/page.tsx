"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Music, Heart } from "lucide-react"

export default function SignupPage() {
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"DJ" | "FAN">("FAN")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/home`,
          data: {
            handle: username,
            display_name: displayName,
            role: role,
          },
        },
      })

      if (authError) throw authError

      if (data.user) {
        // Create profile after successful signup
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          handle: username,
          display_name: displayName,
          role: role,
          bio: role === "DJ" ? "New DJ on Dropsland" : "Music lover and supporter",
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          console.error("Profile creation error:", profileError)
          // Don't throw here as the user is already created
        } else {
          console.log("Profile created successfully for user:", data.user.id)
        }

        // Create some initial data based on role
        if (role === "DJ") {
          // Create a sample artist token for DJs
          const { error: tokenError } = await supabase.from("artist_tokens").insert({
            artist_id: data.user.id,
            display_name: `${displayName} Token`,
            symbol: username.toUpperCase().substring(0, 4),
            price: 1.0,
            total_supply: 1000000,
            created_at: new Date().toISOString(),
          })

          if (tokenError) {
            console.error("Token creation error:", tokenError)
          }
        } else {
          // Create some initial holdings for FANs
          const { error: holdingsError } = await supabase.from("holdings").insert({
            user_id: data.user.id,
            token_id: "default-token-id", // This would be a real token ID
            amount: 100,
            created_at: new Date().toISOString(),
          })

          if (holdingsError) {
            console.error("Holdings creation error:", holdingsError)
          }
        }
      }

      router.push("/login?message=Account created successfully")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Dropsland</h1>
          <p className="text-muted-foreground mt-2">Join the community</p>
        </div>

        <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Create account</CardTitle>
            <CardDescription>Choose your role and get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-3">
                <Label>Are you a DJ or a Fan?</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(value) => setRole(value as "DJ" | "FAN")}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="DJ" id="dj" className="peer sr-only" />
                    <Label
                      htmlFor="dj"
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Music className="mb-2 h-6 w-6" />
                      <span className="font-medium">DJ</span>
                      <span className="text-xs text-muted-foreground">Artist</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="FAN" id="fan" className="peer sr-only" />
                    <Label
                      htmlFor="fan"
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Heart className="mb-2 h-6 w-6" />
                      <span className="font-medium">FAN</span>
                      <span className="text-xs text-muted-foreground">Supporter</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  required
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full h-12 rounded-xl font-medium" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
