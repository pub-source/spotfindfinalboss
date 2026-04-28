import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MapPin, Map, History, Navigation } from 'lucide-react';

interface LocationActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  location?: string;
}

export function LocationActionsSheet({ open, onOpenChange, name, location }: LocationActionsSheetProps) {
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-left mb-6">
          <div className="flex items-center gap-2 text-primary">
            <MapPin className="h-5 w-5" />
            <SheetTitle>Actions</SheetTitle>
          </div>
          <div className="space-y-1 pt-2">
            <p className="font-semibold text-foreground">{name}</p>
            <p className="text-sm text-muted-foreground">{location || 'Location not specified'}</p>
          </div>
        </SheetHeader>
        
        <div className="space-y-3">
          <Button 
            onClick={handleGetRoute}
            className="w-full justify-start gap-3 h-12 bg-primary hover:bg-primary/90"
            disabled={!location}
          >
            <Navigation className="h-5 w-5" />
            Get Route from Current Location
          </Button>
          
          <Button 
            onClick={handleViewOnMap}
            variant="secondary"
            className="w-full justify-start gap-3 h-12"
            disabled={!location}
          >
            <Map className="h-5 w-5" />
            View on Map
          </Button>
          
          <Button 
            variant="outline"
            className="w-full justify-start gap-3 h-12"
          >
            <History className="h-5 w-5" />
            View History
          </Button>
        </div>

        {!location && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Route requires location permission for accurate directions
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
