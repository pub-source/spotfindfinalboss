import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { MapPin, Map, History, Navigation, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type ItemKind = 'spot' | 'accommodation' | 'cafe';

interface LocationActionsPopoverProps {
  name: string;
  location?: string;
  spotId?: string;
  accommodationId?: string;
  cafeId?: string;
  trigger: React.ReactNode;
  onViewTracked?: () => void;
}

const TABLE_MAP: Record<ItemKind, { ratings: 'spot_ratings' | 'accommodation_ratings' | 'cafe_ratings'; views: 'spot_views' | 'accommodation_views' | 'cafe_views'; idCol: string; leaderboardKey: string; label: string }> = {
  spot: { ratings: 'spot_ratings', views: 'spot_views', idCol: 'spot_id', leaderboardKey: 'tourist-community-leaderboard', label: 'spot' },
  accommodation: { ratings: 'accommodation_ratings', views: 'accommodation_views', idCol: 'accommodation_id', leaderboardKey: 'accommodation-community-leaderboard', label: 'accommodation' },
  cafe: { ratings: 'cafe_ratings', views: 'cafe_views', idCol: 'cafe_id', leaderboardKey: 'cafe-community-leaderboard', label: 'cafe' },
};

export function LocationActionsPopover({ name, location, spotId, accommodationId, cafeId, trigger, onViewTracked }: LocationActionsPopoverProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userRating, setUserRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);

  const kind: ItemKind | null = spotId ? 'spot' : accommodationId ? 'accommodation' : cafeId ? 'cafe' : null;
  const itemId = spotId || accommodationId || cafeId;
  const cfg = kind ? TABLE_MAP[kind] : null;

  useEffect(() => {
    if (isOpen && user && itemId && cfg) {
      const fetchUserRating = async () => {
        const { data } = await (supabase as any)
          .from(cfg.ratings)
          .select('rating')
          .eq(cfg.idCol, itemId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) setUserRating(data.rating);
        else setUserRating(0);
      };
      fetchUserRating();
    }
  }, [isOpen, user, itemId, cfg]);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && itemId && cfg) {
      const sessionId = localStorage.getItem('session_id') || crypto.randomUUID();
      localStorage.setItem('session_id', sessionId);

      const { error } = await (supabase as any).from(cfg.views).insert({
        [cfg.idCol]: itemId,
        user_id: user?.id || null,
        session_id: sessionId,
      });

      if (!error) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [`${cfg.label}-views`] }),
          queryClient.invalidateQueries({ queryKey: [cfg.leaderboardKey] }),
        ]);
        onViewTracked?.();
      }
    }
  };

  const handleRating = async (rating: number) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: `Please login to rate this ${cfg?.label || 'item'}.`,
        variant: 'destructive',
      });
      return;
    }
    if (!itemId || !cfg) return;

    const { error } = await (supabase as any)
      .from(cfg.ratings)
      .upsert({
        [cfg.idCol]: itemId,
        user_id: user.id,
        rating: rating,
      }, { onConflict: `${cfg.idCol},user_id` });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit rating.',
        variant: 'destructive',
      });
    } else {
      setUserRating(rating);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`${cfg.label}-ratings`] }),
        queryClient.invalidateQueries({ queryKey: [cfg.leaderboardKey] }),
      ]);
      toast({
        title: 'Success',
        description: 'Your rating has been submitted!',
      });
    }
  };

  const handleGetRoute = () => {
    if (location) {
      const query = encodeURIComponent(location);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
    }
  };

  const handleViewOnMap = () => {
    if (location) {
      const query = encodeURIComponent(location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-background border shadow-lg z-[100]" align="center">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary border-b pb-3">
            <MapPin className="h-5 w-5" />
            <h3 className="font-semibold">Actions</h3>
          </div>
          
          <div className="space-y-2">
            <p className="font-semibold text-foreground text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">{location || 'Location not specified'}</p>
          </div>

          {/* User Rating Section */}
          {itemId && (
            <div className="border-t border-b py-3 space-y-2">
              <p className="text-sm font-medium text-foreground">Rate this {cfg?.label || 'item'}</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        star <= (hoveredRating || userRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {userRating > 0 && (
                <p className="text-xs text-muted-foreground">You rated: {userRating}/5</p>
              )}
              {!user && (
                <p className="text-xs text-muted-foreground">Login to rate this {cfg?.label || 'item'}</p>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={handleGetRoute}
              className="w-full justify-start gap-3 h-10 bg-primary hover:bg-primary/90"
              disabled={!location}
            >
              <Navigation className="h-4 w-4" />
              Get Route from Current Location
            </Button>
            
            <Button 
              onClick={handleViewOnMap}
              variant="secondary"
              className="w-full justify-start gap-3 h-10"
              disabled={!location}
            >
              <Map className="h-4 w-4" />
              View on Map
            </Button>
            
            <Button 
              variant="outline"
              className="w-full justify-start gap-3 h-10"
            >
              <History className="h-4 w-4" />
              View History
            </Button>
          </div>

          {!location && (
            <p className="text-xs text-muted-foreground text-center">
              Route requires location permission for accurate directions
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}