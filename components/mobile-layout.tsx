"use client"

import type React from "react"

import { NavBarBottom } from "@/components/nav-bar-bottom"
import { GradientBackground } from "@/components/gradient-background"
import { cn } from "@/lib/utils"

interface MobileLayoutProps {
  children: React.ReactNode
  showNavBar?: boolean
}

export function MobileLayout({ children, showNavBar = true }: MobileLayoutProps) {
  return (
    <>
      <GradientBackground />
      <div className="relative mx-auto min-h-screen max-w-[430px] pb-[env(safe-area-inset-bottom)]">
        <div className={cn("min-h-screen", showNavBar && "pb-20")}>{children}</div>
        {showNavBar && <NavBarBottom />}
      </div>
    </>
  )
}
