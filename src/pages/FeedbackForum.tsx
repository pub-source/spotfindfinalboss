import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Heart, Send, Trash2, Sparkles, Trophy } from "lucide-react";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { FeedbackReplies } from "@/components/feedback/FeedbackReplies";

const feedbackSchema = z.object({
  message: z
    .string()
    .trim()
    .min(3, "Feedback must be at least 3 characters")
    .max(2000, "Feedback must be under 2000 characters"),
});

interface FeedbackRow {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  message: string;
  created_at: string;
}

interface LikeRow {
  feedback_id: string;
  user_id: string;
}

export default function FeedbackForum() {
  const { user, isAuthenticated, isGuest } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");

  // Fetch profile name once
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.full_name || user.email?.split("@")[0] || "User");
      });
  }, [user]);

  const { data: feedback = [], isLoading: loadingFeedback, refetch: refetchFeedback } =
    useQuery<FeedbackRow[]>({
      queryKey: ["feedback-forum"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("feedback")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        return data as FeedbackRow[];
      },
    });

  const { data: likes = [], refetch: refetchLikes } = useQuery<LikeRow[]>({
    queryKey: ["feedback-likes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_likes")
        .select("feedback_id, user_id");
      if (error) throw error;
      return data as LikeRow[];
    },
  });

  // Realtime subscriptions
  useEffect(() => {
    const ch = supabase
      .channel("feedback-forum-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedback" },
        () => {
          refetchFeedback();
          queryClient.invalidateQueries({ queryKey: ["tourist-community-leaderboard"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedback_likes" },
        () => {
          refetchLikes();
          queryClient.invalidateQueries({ queryKey: ["tourist-community-leaderboard"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refetchFeedback, refetchLikes, queryClient]);

  const likesByFeedback = useMemo(() => {
    const map = new Map<string, { count: number; likedByMe: boolean }>();
    likes.forEach((l) => {
      const cur = map.get(l.feedback_id) || { count: 0, likedByMe: false };
      cur.count += 1;
      if (user && l.user_id === user.id) cur.likedByMe = true;
      map.set(l.feedback_id, cur);
    });
    return map;
  }, [likes, user]);

  // Current user points: 5 per submitted feedback + 1 per like received
  const myPoints = useMemo(() => {
    if (!user) return 0;
    const myFeedbackIds = feedback.filter((f) => f.user_id === user.id).map((f) => f.id);
    const likesReceived = likes.filter((l) => myFeedbackIds.includes(l.feedback_id)).length;
    return myFeedbackIds.length * 5 + likesReceived;
  }, [feedback, likes, user]);

  const handleSubmit = async () => {
    if (!isAuthenticated || isGuest || !user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to share feedback.",
        variant: "destructive",
      });
      return;
    }
    const parsed = feedbackSchema.safeParse({ message });
    if (!parsed.success) {
      toast({
        title: "Invalid feedback",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      user_name: displayName || user.email?.split("@")[0] || "User",
      user_email: user.email || "",
      message: parsed.data.message,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not submit", description: error.message, variant: "destructive" });
      return;
    }
    setMessage("");
    toast({ title: "Feedback shared", description: "+5 points added to your activity score." });
  };

  const handleToggleLike = async (feedbackId: string) => {
    if (!isAuthenticated || isGuest || !user) {
      toast({
        title: "Sign in required",
        description: "Sign in to like and earn points for authors.",
        variant: "destructive",
      });
      return;
    }
    const liked = likesByFeedback.get(feedbackId)?.likedByMe;
    if (liked) {
      const { error } = await supabase
        .from("feedback_likes")
        .delete()
        .eq("feedback_id", feedbackId)
        .eq("user_id", user.id);
      if (error) {
        toast({ title: "Failed to unlike", description: error.message, variant: "destructive" });
      }
    } else {
      const { error } = await supabase
        .from("feedback_likes")
        .insert({ feedback_id: feedbackId, user_id: user.id });
      if (error) {
        toast({ title: "Failed to like", description: error.message, variant: "destructive" });
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("feedback").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Feedback deleted" });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-7 w-7 text-primary" />
            Feedback Forum
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Share your thoughts. Earn <span className="font-semibold text-primary">+5 pts</span> per
            post and <span className="font-semibold text-secondary">+1 pt</span> for every like
            you receive.
          </p>
        </div>
        {isAuthenticated && !isGuest && (
          <Badge variant="outline" className="gap-1 border-accent/30 bg-accent/10 text-accent text-sm py-1.5 px-3">
            <Trophy className="h-4 w-4" />
            Your forum points: {myPoints}
          </Badge>
        )}
      </div>

      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Share your feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isAuthenticated && !isGuest ? (
            <>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="outline">Posting as <strong className="ml-1">{displayName || "..."}</strong></Badge>
                <Badge variant="outline" className="text-muted-foreground">{user?.email}</Badge>
              </div>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind? Tips, suggestions, experiences..."
                rows={4}
                maxLength={2000}
                disabled={submitting}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{message.length}/2000</span>
                <Button onClick={handleSubmit} disabled={submitting || message.trim().length < 3} className="gap-2">
                  <Send className="h-4 w-4" />
                  {submitting ? "Posting..." : "Post feedback (+5 pts)"}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Please <Link to="/login" className="text-primary underline">sign in</Link> to share feedback and earn points.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loadingFeedback ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-16 w-full" />
            </Card>
          ))
        ) : feedback.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No feedback yet — be the first!
          </Card>
        ) : (
          feedback.map((f) => {
            const stats = likesByFeedback.get(f.id) || { count: 0, likedByMe: false };
            const isMine = user?.id === f.user_id;
            return (
              <Card key={f.id} className="border-border/60 hover:border-primary/30 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-sm truncate">{f.user_name}</p>
                        <span className="text-xs text-muted-foreground truncate">{f.user_email}</span>
                        {isMine && <Badge variant="outline" className="text-[10px]">You</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {isMine && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(f.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{f.message}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant={stats.likedByMe ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleLike(f.id)}
                      className="gap-2"
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4 transition-transform",
                          stats.likedByMe && "fill-current scale-110"
                        )}
                      />
                      {stats.count}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Each like gives the author +1 pt
                    </span>
                  </div>
                  <FeedbackReplies feedbackId={f.id} displayName={displayName} />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
