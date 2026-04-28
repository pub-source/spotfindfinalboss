import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CornerDownRight, Send, Trash2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { z } from "zod";

const replySchema = z.object({
  message: z.string().trim().min(1, "Reply cannot be empty").max(1000, "Reply must be under 1000 characters"),
});

interface ReplyRow {
  id: string;
  feedback_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  message: string;
  created_at: string;
}

interface Props {
  feedbackId: string;
  displayName: string;
}

export function FeedbackReplies({ feedbackId, displayName }: Props) {
  const { user, isAuthenticated, isGuest } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: replies = [], refetch } = useQuery<ReplyRow[]>({
    queryKey: ["feedback-replies", feedbackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_replies")
        .select("*")
        .eq("feedback_id", feedbackId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ReplyRow[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`feedback-replies-${feedbackId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedback_replies", filter: `feedback_id=eq.${feedbackId}` },
        () => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["feedback-replies", feedbackId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [feedbackId, refetch, queryClient]);

  const handleSubmit = async () => {
    if (!isAuthenticated || isGuest || !user) {
      toast({ title: "Sign in required", description: "Please sign in to reply.", variant: "destructive" });
      return;
    }
    const parsed = replySchema.safeParse({ message: reply });
    if (!parsed.success) {
      toast({ title: "Invalid reply", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("feedback_replies").insert({
      feedback_id: feedbackId,
      user_id: user.id,
      user_name: displayName || user.email?.split("@")[0] || "User",
      user_email: user.email || "",
      message: parsed.data.message,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not reply", description: error.message, variant: "destructive" });
      return;
    }
    setReply("");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("feedback_replies").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete reply", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="pt-2 border-t border-border/60 space-y-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
      >
        <MessageSquare className="h-4 w-4" />
        {replies.length} {replies.length === 1 ? "reply" : "replies"}
        <span className="text-xs">{open ? "(hide)" : "(show)"}</span>
      </Button>

      {open && (
        <div className="pl-4 border-l-2 border-primary/20 space-y-3">
          {replies.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No replies yet. Start the discussion!</p>
          )}
          {replies.map((r) => {
            const isMine = user?.id === r.user_id;
            return (
              <div key={r.id} className="bg-muted/30 rounded-md p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CornerDownRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <p className="font-semibold text-xs truncate">{r.user_name}</p>
                      {isMine && <Badge variant="outline" className="text-[9px] py-0 px-1.5">You</Badge>}
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {isMine && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(r.id)}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap break-words pl-5">{r.message}</p>
              </div>
            );
          })}

          {isAuthenticated && !isGuest ? (
            <div className="space-y-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                maxLength={1000}
                disabled={submitting}
                className="text-sm"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitting || reply.trim().length < 1}
                  className="gap-2"
                >
                  <Send className="h-3 w-3" />
                  {submitting ? "Replying..." : "Reply"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sign in to reply.</p>
          )}
        </div>
      )}
    </div>
  );
}
