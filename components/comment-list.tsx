"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Comment, Profile } from "@/lib/types"

interface CommentListProps {
  postId: string
  currentProfile: Profile
  onCommentAdded?: () => void
}

export function CommentList({ postId, currentProfile, onCommentAdded }: CommentListProps) {
  const [comments, setComments] = useState<(Comment & { author: Profile })[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [postId])

  const loadComments = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          author:profiles(*)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error("Error loading comments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        author_id: currentProfile.id,
        content: newComment.trim(),
      })

      if (error) throw error

      setNewComment("")
      loadComments()
      onCommentAdded?.()
    } catch (error) {
      console.error("Error creating comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comments List */}
      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={comment.author.avatar_url || "/placeholder.svg"} alt={comment.author.display_name} />
                <AvatarFallback className="text-xs">{comment.author.display_name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="bg-muted/50 rounded-2xl px-3 py-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-sm">{comment.author.display_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={currentProfile.avatar_url || "/placeholder.svg"} alt={currentProfile.display_name} />
          <AvatarFallback className="text-xs">{currentProfile.display_name[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex space-x-2">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[40px] resize-none rounded-2xl"
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newComment.trim() || isSubmitting}
            className="h-10 w-10 rounded-full flex-shrink-0"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  )
}
