import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Camera, Search, X, ZoomIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GalleryDialog } from '@/components/admin/GalleryDialog';

export default function NewGallery() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<any>(null);

  const { data: galleryItems, refetch } = useQuery({
    queryKey: ['gallery'],
    queryFn: async () => {
      const { data } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('gallery').delete().eq('id', id);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete image.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Image deleted successfully.',
      });
      refetch();
    }
  };

  const filteredItems = galleryItems?.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Gallery
            </h1>
            <p className="text-muted-foreground mt-2">
              Explore beautiful moments and memories
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => { setSelectedItem(null); setDialogOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Upload Image
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search gallery..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="outline" className="px-4 py-2">
            {filteredItems?.length || 0} images
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems?.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-travel transition-shadow group">
              <div 
                className="aspect-square relative overflow-hidden cursor-pointer"
                onClick={() => setExpandedImage(item)}
              >
                <img 
                  src={item.image_url} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                  {item.category && (
                    <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                  )}
                </div>
                
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}

                {isAdmin && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => { setSelectedItem(item); setDialogOpen(true); }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems?.length === 0 && (
          <div className="text-center py-12">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No images found</p>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search' : 'Be the first to upload one!'}
            </p>
          </div>
        )}

        {dialogOpen && (
          <GalleryDialog
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
              alt={expandedImage.title}
              className="w-full h-full object-contain rounded-lg"
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
              <h3 className="text-white text-xl font-semibold mb-2">
                {expandedImage.title}
              </h3>
              {expandedImage.category && (
                <Badge className="mb-2 bg-white/20 text-white border-0">
                  {expandedImage.category}
                </Badge>
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