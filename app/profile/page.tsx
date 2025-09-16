import { requireProfile } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const profile = await requireProfile()

  // Redirect to the user's profile page
  redirect(`/profile/${profile.handle}`)
}
