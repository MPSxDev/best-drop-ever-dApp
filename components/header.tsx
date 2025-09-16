"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"
import Image from "next/image"

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-lg border-b border-border/50 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between py-3 px-4">
        <Image src="/best_drops_ever_logo.png" alt="BestDropsever" width={60} height={16} className="h-4 w-auto" priority />

        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="top-[20%] max-w-[380px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Search</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Search artists, genres, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 rounded-xl"
                autoFocus
              />
              {searchQuery && (
                <div className="text-sm text-muted-foreground">
                  Search functionality will be implemented in the next phase
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}
