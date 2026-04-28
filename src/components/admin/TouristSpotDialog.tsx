import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ImageUpload } from "./ImageUpload";

const touristSpotSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  description: z.string().trim().max(2000, "Description must be less than 2000 characters").optional(),
  category: z.string().min(1, "Category is required"),
  image_url: z.string().max(1000).optional().or(z.literal("")),
  location: z.string().trim().max(200, "Location must be less than 200 characters").optional(),
  rating: z.coerce.number().min(0, "Rating must be at least 0").max(5, "Rating must be at most 5").optional(),
  price_range: z.string().trim().max(50, "Price range must be less than 50 characters").optional(),
});

interface TouristSpotDialogProps {
  item: any;
  onClose: () => void;
  onSave: () => void;
}

export function TouristSpotDialog({ item, onClose, onSave }: TouristSpotDialogProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof touristSpotSchema>>({
    resolver: zodResolver(touristSpotSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "beach",
      image_url: "",
      location: "",
      rating: 0,
      price_range: "",
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name || "",
        description: item.description || "",
        category: item.category || "beach",
        image_url: item.image_url || "",
        location: item.location || "",
        rating: item.rating || 0,
        price_range: item.price_range || "",
      });
    }
  }, [item, form]);

  const onSubmit = async (data: z.infer<typeof touristSpotSchema>) => {
    try {
      const dataToSave = {
        name: data.name,
        description: data.description,
        category: data.category,
        image_url: data.image_url,
        location: data.location,
        rating: data.rating,
        price_range: data.price_range,
      };

      if (item) {
        const { error } = await supabase
          .from("tourist_spots")
          .update(dataToSave)
          .eq("id", item.id);

        if (error) throw error;
        toast({ title: "Success", description: "Tourist spot updated successfully." });
      } else {
        const { error } = await supabase.from("tourist_spots").insert([dataToSave]);
        if (error) throw error;
        toast({ title: "Success", description: "Tourist spot created successfully." });
      }
      onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit' : 'Add'} Tourist Spot</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beach">Beach</SelectItem>
                      <SelectItem value="mountain">Mountain</SelectItem>
                      <SelectItem value="historical">Historical</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="nature">Nature</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <ImageUpload value={field.value || ""} onChange={field.onChange} folder="tourist_spots" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating (0-5)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" min="0" max="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price_range"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Range</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Free, ₱, ₱₱, ₱₱₱" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}