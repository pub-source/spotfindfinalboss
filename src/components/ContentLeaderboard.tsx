import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Eye, MessageSquare, Trophy, Medal, Users, Flame, MessageCircle, Heart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type Kind = 'accommodation' | 'cafe';

interface ContentLeaderboardProps {
  kind: Kind;
}

interface ItemWithStats {
  id: string;
  name: string;
  image_url: string | null;
  category: string | null;
  avgRating: number;
  totalReviews: number;
  viewCount: number;
  rank: number;
}

interface TopAccount {
  userId: string;
  displayName: string;
  totalViews: number;
  totalRatings: number;
  totalFeedback: number;
  totalLikesReceived: number;
  activityScore: number;
  engaged: boolean;
  rank: number;
}

const CFG = {
  accommodation: {
    table: 'accommodations' as const,
    ratingsTable: 'accommodation_ratings' as const,
    viewsTable: 'accommodation_views' as const,
    idCol: 'accommodation_id',
    categoryCol: 'type',
    titleLabel: 'Top Rated Accommodations',
    titleSub: 'Highest star ratings always stay on top.',
    queryKey: 'accommodation-community-leaderboard',
    channel: 'accommodation-community-leaderboard-rt',
  },
  cafe: {
    table: 'cafes' as const,
    ratingsTable: 'cafe_ratings' as const,
    viewsTable: 'cafe_views' as const,
    idCol: 'cafe_id',
    categoryCol: 'cuisine_type',
    titleLabel: 'Top Rated Cafes',
    titleSub: 'Highest star ratings always stay on top.',
    queryKey: 'cafe-community-leaderboard',
    channel: 'cafe-community-leaderboard-rt',
  },
};

const getRankBadgeClasses = (index: number) => {
  if (index === 0) return 'border-primary/30 bg-primary/10 text-primary';
  if (index === 1) return 'border-secondary/30 bg-secondary/10 text-secondary';
  if (index === 2) return 'border-accent/30 bg-accent/10 text-accent';
  return 'border-border bg-muted text-muted-foreground';
};

const getRankIcon = (index: number) => {
  if (index === 0) return <Trophy className="h-3.5 w-3.5" />;
  if (index === 1) return <Medal className="h-3.5 w-3.5" />;
  if (index === 2) return <Medal className="h-3.5 w-3.5" />;
  return null;
};

export function ContentLeaderboard({ kind }: ContentLeaderboardProps) {
  const { user } = useAuth();
  const cfg = CFG[kind];

  const { data, refetch, isLoading, isError } = useQuery({
    queryKey: [cfg.queryKey],
    queryFn: async () => {
      const [itemsResult, ratingsResult, viewsResult, feedbackResult, likesResult] = await Promise.all([
        (supabase as any).from(cfg.table).select(`id, name, image_url, ${cfg.categoryCol}`),
        (supabase as any).from(cfg.ratingsTable).select(`${cfg.idCol}, rating, user_id`),
        (supabase as any).from(cfg.viewsTable).select(`${cfg.idCol}, user_id`),
        supabase.from('feedback').select('id, user_id, user_name'),
        supabase.from('feedback_likes').select('feedback_id, user_id'),
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (ratingsResult.error) throw ratingsResult.error;
      if (viewsResult.error) throw viewsResult.error;
      if (feedbackResult.error) throw feedbackResult.error;
      if (likesResult.error) throw likesResult.error;

      const items = itemsResult.data || [];
      const ratings = ratingsResult.data || [];
      const views = viewsResult.data || [];
      const feedback = feedbackResult.data || [];
      const likes = likesResult.data || [];

      const ratingStats = new Map<string, { sum: number; count: number }>();
      ratings.forEach((r: any) => {
        const id = r[cfg.idCol];
        const cur = ratingStats.get(id) || { sum: 0, count: 0 };
        cur.sum += r.rating; cur.count += 1;
        ratingStats.set(id, cur);
      });

      const viewStats = new Map<string, number>();
      views.forEach((v: any) => {
        const id = v[cfg.idCol];
        viewStats.set(id, (viewStats.get(id) || 0) + 1);
      });

      const rankedItems: ItemWithStats[] = items
        .map((item: any) => {
          const re = ratingStats.get(item.id);
          const totalReviews = re?.count || 0;
          const avgRating = totalReviews > 0 ? re!.sum / totalReviews : 0;
          return {
            id: item.id,
            name: item.name,
            image_url: item.image_url,
            category: item[cfg.categoryCol],
            avgRating,
            totalReviews,
            viewCount: viewStats.get(item.id) || 0,
            rank: 0,
          };
        })
        .sort((a: ItemWithStats, b: ItemWithStats) => {
          const aHas = Number(a.totalReviews > 0);
          const bHas = Number(b.totalReviews > 0);
          if (bHas !== aHas) return bHas - aHas;
          const rd = b.avgRating - a.avgRating;
          if (Math.abs(rd) > 0.001) return rd;
          const revD = b.totalReviews - a.totalReviews;
          if (revD !== 0) return revD;
          const vd = b.viewCount - a.viewCount;
          if (vd !== 0) return vd;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 5)
        .map((s, i) => ({ ...s, rank: i + 1 }));

      // Top active accounts
      const nameByUser = new Map<string, string>();
      feedback.forEach((f) => {
        if (f.user_id && f.user_name) nameByUser.set(f.user_id, f.user_name);
      });
      const feedbackIdToAuthor = new Map<string, string>();
      feedback.forEach((f) => feedbackIdToAuthor.set(f.id, f.user_id));

      const activityByUser = new Map<string, { totalViews: number; totalRatings: number; totalFeedback: number; totalLikesReceived: number; }>();
      const ensure = (uid: string) => {
        const cur = activityByUser.get(uid) || { totalViews: 0, totalRatings: 0, totalFeedback: 0, totalLikesReceived: 0 };
        activityByUser.set(uid, cur);
        return cur;
      };

      views.forEach((v: any) => { if (v.user_id) ensure(v.user_id).totalViews += 1; });
      ratings.forEach((r: any) => { if (r.user_id) ensure(r.user_id).totalRatings += 1; });
      feedback.forEach((f) => { if (f.user_id) ensure(f.user_id).totalFeedback += 1; });
      likes.forEach((l) => {
        const author = feedbackIdToAuthor.get(l.feedback_id);
        if (author) ensure(author).totalLikesReceived += 1;
      });

      const topAccounts: TopAccount[] = Array.from(activityByUser.entries())
        .map(([userId, s]) => ({
          userId,
          displayName: nameByUser.get(userId) || `Account ${userId.slice(0, 6)}`,
          totalViews: s.totalViews,
          totalRatings: s.totalRatings,
          totalFeedback: s.totalFeedback,
          totalLikesReceived: s.totalLikesReceived,
          activityScore: s.totalViews * 2 + s.totalRatings * 3 + s.totalFeedback * 5 + s.totalLikesReceived * 1,
          engaged: (s.totalViews > 0 && s.totalRatings > 0) || s.totalFeedback > 0,
          rank: 0,
        }))
        .sort((a, b) => {
          const sd = b.activityScore - a.activityScore;
          if (sd !== 0) return sd;
          const fd = b.totalFeedback - a.totalFeedback;
          if (fd !== 0) return fd;
          const rd = b.totalRatings - a.totalRatings;
          if (rd !== 0) return rd;
          const vd = b.totalViews - a.totalViews;
          if (vd !== 0) return vd;
          return a.userId.localeCompare(b.userId);
        })
        .slice(0, 5)
        .map((a, i) => ({ ...a, rank: i + 1 }));

      return { rankedItems, topAccounts };
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(cfg.channel)
      .on('postgres_changes', { event: '*', schema: 'public', table: cfg.ratingsTable }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: cfg.viewsTable }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback_likes' }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch, cfg.channel, cfg.ratingsTable, cfg.viewsTable]);

  const rankedItems = data?.rankedItems || [];
  const topAccounts = data?.topAccounts || [];

  if (isError) {
    return (
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            {cfg.titleLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load the leaderboard right now.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            {cfg.titleLabel}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{cfg.titleSub}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                <Skeleton className="h-7 w-14 rounded-full" />
                <Skeleton className="h-11 w-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))
          ) : rankedItems.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No items rated yet. Be the first to rate.
            </p>
          ) : (
            rankedItems.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border border-border/60 p-3 transition-colors hover:bg-muted/40',
                  index === 0 && 'border-primary/30 bg-primary/5'
                )}
              >
                <Badge
                  variant="outline"
                  className={cn('shrink-0 gap-1 rounded-full px-2 py-1 font-bold', getRankBadgeClasses(index))}
                >
                  {getRankIcon(index)}
                  <span>#{item.rank}</span>
                </Badge>

                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-11 w-11 rounded-xl object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-sm">{item.name}</p>
                    {item.category && (
                      <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current text-secondary" />
                      {item.avgRating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {item.totalReviews}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {item.viewCount}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-accent/20 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-accent" />
            Top Active Accounts
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Visitors who keep viewing and rating across the community.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/60 p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-7 w-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </div>
            ))
          ) : topAccounts.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No active accounts yet.</p>
          ) : (
            topAccounts.map((account, index) => (
              <div
                key={account.userId}
                className={cn(
                  'rounded-xl border border-border/60 p-3',
                  index === 0 && 'border-accent/30 bg-accent/5'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <Badge
                      variant="outline"
                      className={cn('shrink-0 gap-1 rounded-full px-2 py-1 font-bold', getRankBadgeClasses(index))}
                    >
                      {getRankIcon(index)}
                      <span>#{account.rank}</span>
                    </Badge>

                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">
                        {user?.id === account.userId ? 'You' : account.displayName}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary">
                          <Eye className="h-3 w-3" />
                          {account.totalViews}
                        </Badge>
                        <Badge variant="outline" className="gap-1 border-secondary/30 bg-secondary/10 text-secondary">
                          <Star className="h-3 w-3 fill-current" />
                          {account.totalRatings}
                        </Badge>
                        {account.totalFeedback > 0 && (
                          <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary">
                            <MessageCircle className="h-3 w-3" />
                            {account.totalFeedback}
                          </Badge>
                        )}
                        {account.totalLikesReceived > 0 && (
                          <Badge variant="outline" className="gap-1 border-secondary/30 bg-secondary/10 text-secondary">
                            <Heart className="h-3 w-3 fill-current" />
                            {account.totalLikesReceived}
                          </Badge>
                        )}
                        {account.engaged && (
                          <Badge variant="outline" className="gap-1 border-accent/30 bg-accent/10 text-accent">
                            <Flame className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge variant="outline" className="shrink-0 border-border bg-muted text-foreground">
                    {account.activityScore} pts
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
