import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Edit, Trash2, Star, MapPin, Search,
  Heart, Eye, ZoomIn, X
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TouristSpotDialog } from '@/components/admin/TouristSpotDialog';
import { LocationActionsPopover } from '@/components/LocationActionsPopover';
import { TouristSpotLeaderboard } from '@/components/TouristSpotLeaderboard';

const categories = ['All', 'Beach', 'Mountain', 'Historical', 'Adventure', 'Cultural'];

export default function NewTouristSpots() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<any>(null);

  const { data: spots, refetch } = useQuery({
    queryKey: ['tourist-spots'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tourist_spots')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: ratingsData, refetch: refetchRatings } = useQuery({
    queryKey: ['spot-ratings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('spot_ratings')
        .select('spot_id, rating');
      return data || [];
    },
  });

  const { data: viewsData, refetch: refetchViews } = useQuery({
    queryKey: ['spot-views'],
    queryFn: async () => {
      const { data } = await supabase
        .from('spot_views')
        .select('spot_id');
      return data || [];
    },
  });

  useEffect(() => {
    const ratingsChannel = supabase
      .channel('ratings-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'spot_ratings' },
        () => refetchRatings()
      )
      .subscribe();

    const viewsChannel = supabase
      .channel('views-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'spot_views' },
        () => refetchViews()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ratingsChannel);
      supabase.removeChannel(viewsChannel);
    };
  }, [refetchRatings, refetchViews]);

  const getSpotStats = (spotId: string) => {
    const spotRatings = ratingsData?.filter(r => r.spot_id === spotId) || [];
    const totalReviews = spotRatings.length;

    const avgRating =
      totalReviews > 0
        ? spotRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews
        : 0;

    const viewCount =
      viewsData?.filter(v => v.spot_id === spotId)?.length || 0;

    return {
      avgRating: avgRating.toFixed(1),
      totalReviews,
      viewCount,
    };
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('tourist_spots').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete tourist spot.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Tourist spot deleted successfully.',
      });
      refetch();
    }
  };

  const filteredSpots = spots?.filter(spot => {
    const matchesSearch =
      spot.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spot.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      spot.category?.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Sort spots by average rating from higher to lower
  const sortedSpots = filteredSpots?.sort((a, b) => {
    const statsA = getSpotStats(a.id);
    const statsB = getSpotStats(b.id);
    return parseFloat(statsB.avgRating) - parseFloat(statsA.avgRating);
  });

  return (
    <>
      <div className="p-6 space-y-6">

        {/* HEADER */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-primary">
              Discover Tourist Spots
            </h1>
            <p className="text-muted-foreground mt-2">
              Explore amazing destinations and create unforgettable memories
            </p>
          </div>

          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tourist spots..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* ADMIN */}
        {isAdmin && (
          <div className="flex justify-end">
            <Button onClick={() => { setSelectedItem(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Spot
            </Button>
          </div>
        )}

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* MAIN CARDS */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">

            {sortedSpots?.map((spot) => {
              const stats = getSpotStats(spot.id);

              return (
                <Card key={spot.id} className="overflow-hidden hover:shadow-lg transition group flex flex-col">

                  <div 
                    className="aspect-video relative overflow-hidden bg-muted cursor-pointer"
                    onClick={() => spot.image_url && setExpandedImage(spot)}
                  >
                    {spot.image_url ? (
                      <>
                        <img
                          src={spot.image_url}
                          alt={spot.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="h-8 w-8 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <MapPin className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}

                    <Button size="icon" variant="ghost"
                      className="absolute top-2 right-2 bg-white/80 rounded-full">
                      <Heart className="h-4 w-4" />
                    </Button>

                    <Badge className="absolute top-2 left-2 bg-primary/90 text-white border-0 capitalize">
                      {spot.category || 'spot'}
                    </Badge>
                  </div>

                  <CardContent className="p-4 flex flex-col gap-3 flex-1">

                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{spot.name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1 text-primary" />
                        <span className="text-primary">{spot.location || 'No location'}</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {spot.description || ''}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {stats.viewCount} views
                    </p>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium">
                          {stats.avgRating} / {stats.totalReviews} reviews
                        </span>
                      </div>

                      <span className="text-sm font-semibold text-primary">
                        {typeof spot.price_range === 'string'
                          ? spot.price_range.replace(/\$/g, '₱')
                          : '₱10'}
                      </span>
                    </div>

                    <div className="mt-auto">
                      {!isAdmin ? (
                        <LocationActionsPopover
                          name={spot.name}
                          location={spot.location}
                          spotId={spot.id}
                          onViewTracked={() => refetchViews()}
                          trigger={
                            <Button className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          }
                        />
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1"
                            onClick={() => { setSelectedItem(spot); setDialogOpen(true); }}>
                            <Edit className="h-3 w-3 mr-1" /> Edit
                          </Button>

                          <Button size="sm" variant="outline"
                            className="text-destructive"
                            onClick={() => handleDelete(spot.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* SIDEBAR (FIXED + FILLED) */}
          <aside className="space-y-6 sticky top-6 h-fit">

            {/* TOP ACTIVE */}
            <TouristSpotLeaderboard />

          </aside>
        </div>

      </div>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
              onClick={() => setExpandedImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            
            <img 
              src={expandedImage.image_url} 
              alt={expandedImage.name}
              className="w-full h-full object-contain rounded-lg"
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
              <h3 className="text-white text-xl font-semibold mb-2">
                {expandedImage.name}
              </h3>
              {expandedImage.category && (
                <Badge className="mb-2 bg-primary/90 text-white border-0">
                  {expandedImage.category}
                </Badge>
              )}
              {expandedImage.location && (
                <p className="text-white/80 text-sm mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {expandedImage.location}
                </p>
              )}
              {expandedImage.description && (
                <p className="text-white/90 text-sm">
                  {expandedImage.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}