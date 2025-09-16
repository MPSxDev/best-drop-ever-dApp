"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Search, Wallet, Activity, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/explore", icon: Search, label: "Explore" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/activity", icon: Activity, label: "Activity" },
  { href: "/profile", icon: User, label: "Profile" },
]

export function NavBarBottom() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-background/80 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center min-h-[44px] px-3 py-1 rounded-xl transition-colors",
                isActive ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium mt-1">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
