import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Star, Building2, Search, DollarSign, Heart, Eye, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AccommodationDialog } from '@/components/admin/AccommodationDialog';
import { LocationActionsPopover } from '@/components/LocationActionsPopover';
import { ContentLeaderboard } from '@/components/ContentLeaderboard';

const types = ['All', 'Hotel', 'Resort', 'Hostel', 'Apartment', 'Villa'];

export default function NewAccommodations() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: accommodations, refetch } = useQuery({
    queryKey: ['accommodations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('accommodations')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: ratingsData, refetch: refetchRatings } = useQuery({
    queryKey: ['accommodation-ratings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('accommodation_ratings')
        .select('accommodation_id, rating');
      return data || [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('accommodation-ratings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accommodation_ratings' }, () => refetchRatings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetchRatings]);

  const getStats = (id: string) => {
    const rs = ratingsData?.filter(r => r.accommodation_id === id) || [];
    const totalReviews = rs.length;
    const avgRating = totalReviews > 0
      ? rs.reduce((s, r) => s + r.rating, 0) / totalReviews
      : 0;
    return { avgRating, totalReviews };
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('accommodations').delete().eq('id', id);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete accommodation.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Accommodation deleted successfully.',
      });
      refetch();
    }
  };

  const filteredAccommodations = accommodations
    ?.filter(acc => {
      const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.location?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'All' ||
        acc.type?.toLowerCase() === selectedType.toLowerCase();
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const aS = getStats(a.id);
      const bS = getStats(b.id);
      const aHas = Number(aS.totalReviews > 0);
      const bHas = Number(bS.totalReviews > 0);
      if (bHas !== aHas) return bHas - aHas;
      return bS.avgRating - aS.avgRating;
    });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col items-center text-center space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-primary">
            Discover Accommodations
          </h1>
          <p className="text-muted-foreground mt-2">
            Find the perfect place to stay
          </p>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accommodations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {types.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type)}
              className="whitespace-nowrap"
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={() => { setSelectedItem(null); setDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Hotel
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAccommodations?.map((acc) => (
          <Card key={acc.id} className="overflow-hidden hover:shadow-lg transition-shadow group relative flex flex-col h-full">
            <div className="aspect-video relative overflow-hidden bg-muted shrink-0">
              {acc.image_url ? (
                <img 
                  src={acc.image_url} 
                  alt={acc.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-muted-foreground/40" />
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-background/80 hover:bg-background/90 rounded-full"
              >
                <Heart className="h-4 w-4" />
              </Button>
              <Badge className="absolute top-2 left-2 bg-background/90 text-foreground border-0 capitalize">
                {acc.type}
              </Badge>
            </div>
            <CardContent className="p-4 flex flex-col flex-1 gap-3">
              <div className="min-h-[3.5rem]">
                <h3 className="font-semibold text-lg line-clamp-1">{acc.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3 text-primary shrink-0" />
                  <span className="text-primary line-clamp-1">{acc.location || 'Location not specified'}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                {acc.description || ''}
              </p>

              <div className="flex flex-wrap gap-2 min-h-[1.5rem]">
                {acc.amenities?.slice(0, 3).map((amenity: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">
                    {(() => { const s = getStats(acc.id); return `${s.avgRating.toFixed(1)} / ${s.totalReviews} reviews`; })()}
                  </span>
                </div>
                {acc.price_per_night && (
                  <span className="text-sm font-medium text-primary">₱{acc.price_per_night}/night</span>
                )}
              </div>

              <div className="mt-auto">
              {!isAdmin ? (
                <LocationActionsPopover
                  name={acc.name}
                  location={acc.location}
                  accommodationId={acc.id}
                  trigger={
                    <Button className="w-full gap-2">
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  }
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setSelectedItem(acc); setDialogOpen(true); }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDelete(acc.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              </div>
            </CardContent>
          </Card>
        ))}
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-6">
            <ContentLeaderboard kind="accommodation" />
          </div>
        </aside>
      </div>

      {filteredAccommodations?.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No accommodations found</p>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search' : 'Be the first to add one!'}
          </p>
        </div>
      )}

      {dialogOpen && (
        <AccommodationDialog
          item={selectedItem}
          onClose={() => { setDialogOpen(false); setSelectedItem(null); }}
          onSave={() => {
            refetch();
            setDialogOpen(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}