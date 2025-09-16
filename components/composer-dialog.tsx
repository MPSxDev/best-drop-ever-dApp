"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImagePlus, X, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"

interface ComposerDialogProps {
  profile: Profile
  onPostCreated?: () => void
  trigger?: React.ReactNode
}

export function ComposerDialog({ profile, onPostCreated, trigger }: ComposerDialogProps) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMediaFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setMediaPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      let mediaUrl = null

      // Upload media if present (simplified - in real app would use Supabase Storage)
      if (mediaFile) {
        // For demo purposes, we'll use a placeholder URL
        mediaUrl = `/placeholder.svg?height=300&width=400&query=${encodeURIComponent("user uploaded media")}`
      }

      const { error } = await supabase.from("posts").insert({
        author_id: profile.id,
        content: content.trim(),
        media_url: mediaUrl,
      })

      if (error) throw error

      setContent("")
      setMediaFile(null)
      setMediaPreview(null)
      setOpen(false)
      onPostCreated?.()
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button className="rounded-full h-12 px-6 font-medium">Create Post</Button>}
      </DialogTrigger>
      <DialogContent className="top-[10%] max-w-[380px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.display_name} />
              <AvatarFallback>{profile.display_name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="What's happening?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none border-none p-0 text-base placeholder:text-muted-foreground focus-visible:ring-0"
                maxLength={280}
              />
            </div>
          </div>

          {mediaPreview && (
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={mediaPreview || "/placeholder.svg"}
                alt="Media preview"
                className="w-full h-auto max-h-64 object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaSelect}
                className="hidden"
                id="media-upload"
              />
              <label htmlFor="media-upload">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                  <span>
                    <ImagePlus className="h-4 w-4" />
                  </span>
                </Button>
              </label>
              <span className="text-xs text-muted-foreground">{content.length}/280</span>
            </div>
            <Button type="submit" disabled={!content.trim() || isLoading} className="rounded-full px-6">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
