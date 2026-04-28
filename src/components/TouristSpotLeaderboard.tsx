import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Eye, MessageSquare, Trophy, Medal, Users, Flame, MessageCircle, Heart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SpotWithStats {
  id: string;
  name: string;
  image_url: string | null;
  category: string;
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

interface LeaderboardData {
  rankedSpots: SpotWithStats[];
  topAccounts: TopAccount[];
}

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

const getAccountLabel = (userId: string, currentUserId?: string) => {
  if (currentUserId === userId) return 'You';
  return `Account ${userId.slice(0, 6)}`;
};

export function TouristSpotLeaderboard() {
  const { user } = useAuth();

  const { data, refetch, isLoading, isError } = useQuery<LeaderboardData>({
    queryKey: ['tourist-community-leaderboard'],
    queryFn: async () => {
      const [spotsResult, ratingsResult, viewsResult, feedbackResult, likesResult] = await Promise.all([
        supabase.from('tourist_spots').select('id, name, image_url, category'),
        supabase.from('spot_ratings').select('spot_id, rating, user_id'),
        supabase.from('spot_views').select('spot_id, user_id'),
        supabase.from('feedback').select('id, user_id, user_name'),
        supabase.from('feedback_likes').select('feedback_id, user_id'),
      ]);

      if (spotsResult.error) throw spotsResult.error;
      if (ratingsResult.error) throw ratingsResult.error;
      if (viewsResult.error) throw viewsResult.error;
      if (feedbackResult.error) throw feedbackResult.error;
      if (likesResult.error) throw likesResult.error;

      const spots = spotsResult.data || [];
      const ratings = ratingsResult.data || [];
      const views = viewsResult.data || [];
      const feedback = feedbackResult.data || [];
      const likes = likesResult.data || [];

      const ratingStats = new Map<string, { sum: number; count: number }>();
      ratings.forEach(({ spot_id, rating }) => {
        const current = ratingStats.get(spot_id) || { sum: 0, count: 0 };
        current.sum += rating;
        current.count += 1;
        ratingStats.set(spot_id, current);
      });

      const viewStats = new Map<string, number>();
      views.forEach(({ spot_id }) => {
        viewStats.set(spot_id, (viewStats.get(spot_id) || 0) + 1);
      });

      const rankedSpots = spots
        .map((spot) => {
          const ratingEntry = ratingStats.get(spot.id);
          const totalReviews = ratingEntry?.count || 0;
          const avgRating = totalReviews > 0 ? ratingEntry!.sum / totalReviews : 0;

          return {
            ...spot,
            avgRating,
            totalReviews,
            viewCount: viewStats.get(spot.id) || 0,
            rank: 0,
          };
        })
        .sort((a, b) => {
          const aHasRatings = Number(a.totalReviews > 0);
          const bHasRatings = Number(b.totalReviews > 0);
          if (bHasRatings !== aHasRatings) return bHasRatings - aHasRatings;

          const ratingDiff = b.avgRating - a.avgRating;
          if (Math.abs(ratingDiff) > 0.001) return ratingDiff;

          const reviewDiff = b.totalReviews - a.totalReviews;
          if (reviewDiff !== 0) return reviewDiff;

          const viewDiff = b.viewCount - a.viewCount;
          if (viewDiff !== 0) return viewDiff;

          return a.name.localeCompare(b.name);
        })
        .slice(0, 5)
        .map((spot, index) => ({ ...spot, rank: index + 1 }));

      // Build per-user activity. Track display names from feedback posts.
      const nameByUser = new Map<string, string>();
      feedback.forEach((f) => {
        if (f.user_id && f.user_name) nameByUser.set(f.user_id, f.user_name);
      });

      const feedbackIdToAuthor = new Map<string, string>();
      feedback.forEach((f) => feedbackIdToAuthor.set(f.id, f.user_id));

      const activityByUser = new Map<string, {
        totalViews: number;
        totalRatings: number;
        totalFeedback: number;
        totalLikesReceived: number;
      }>();

      const ensure = (uid: string) => {
        const cur = activityByUser.get(uid) || {
          totalViews: 0, totalRatings: 0, totalFeedback: 0, totalLikesReceived: 0,
        };
        activityByUser.set(uid, cur);
        return cur;
      };

      views.forEach(({ user_id }) => {
        if (!user_id) return;
        ensure(user_id).totalViews += 1;
      });

      ratings.forEach(({ user_id }) => {
        if (!user_id) return;
        ensure(user_id).totalRatings += 1;
      });

      feedback.forEach(({ user_id }) => {
        if (!user_id) return;
        ensure(user_id).totalFeedback += 1;
      });

      likes.forEach(({ feedback_id }) => {
        const authorId = feedbackIdToAuthor.get(feedback_id);
        if (!authorId) return;
        ensure(authorId).totalLikesReceived += 1;
      });

      const topAccounts = Array.from(activityByUser.entries())
        .map(([userId, stats]) => ({
          userId,
          displayName: nameByUser.get(userId) || `Account ${userId.slice(0, 6)}`,
          totalViews: stats.totalViews,
          totalRatings: stats.totalRatings,
          totalFeedback: stats.totalFeedback,
          totalLikesReceived: stats.totalLikesReceived,
          // Views×2 + Ratings×3 + Feedback×5 + LikesReceived×1
          activityScore:
            stats.totalViews * 2 +
            stats.totalRatings * 3 +
            stats.totalFeedback * 5 +
            stats.totalLikesReceived * 1,
          engaged:
            (stats.totalViews > 0 && stats.totalRatings > 0) ||
            stats.totalFeedback > 0,
          rank: 0,
        }))
        .sort((a, b) => {
          const scoreDiff = b.activityScore - a.activityScore;
          if (scoreDiff !== 0) return scoreDiff;
          const fbDiff = b.totalFeedback - a.totalFeedback;
          if (fbDiff !== 0) return fbDiff;
          const ratingDiff = b.totalRatings - a.totalRatings;
          if (ratingDiff !== 0) return ratingDiff;
          const viewDiff = b.totalViews - a.totalViews;
          if (viewDiff !== 0) return viewDiff;
          return a.userId.localeCompare(b.userId);
        })
        .slice(0, 5)
        .map((account, index) => ({ ...account, rank: index + 1 }));

      return { rankedSpots, topAccounts };
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('tourist-community-leaderboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spot_ratings' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spot_views' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback_likes' }, () => refetch())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const rankedSpots = data?.rankedSpots || [];
  const topAccounts = data?.topAccounts || [];

  if (isError) {
    return (
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Top Rated Spots
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
            Top Rated Spots
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Highest star ratings always stay on top.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                <Skeleton className="h-7 w-14 rounded-full" />
                <Skeleton className="h-11 w-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))
          ) : rankedSpots.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No spots rated yet. Be the first to rate.
            </p>
          ) : (
            rankedSpots.map((spot, index) => (
              <div
                key={spot.id}
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
                  <span>#{spot.rank}</span>
                </Badge>

                {spot.image_url ? (
                  <img
                    src={spot.image_url}
                    alt={spot.name}
                    className="h-11 w-11 rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-sm">{spot.name}</p>
                    <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">
                      {spot.category}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current text-secondary" />
                      {spot.avgRating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {spot.totalReviews}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {spot.viewCount}
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
            Visitors who keep viewing spots and leaving ratings.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-border/60 p-3">
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
            <p className="py-4 text-center text-sm text-muted-foreground">
              No active accounts yet.
            </p>
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
