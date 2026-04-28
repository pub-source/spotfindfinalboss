import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ImageUpload } from "./ImageUpload";

const cafeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  description: z.string().trim().max(2000, "Description must be less than 2000 characters").optional(),
  cuisine_type: z.string().trim().max(100, "Cuisine type must be less than 100 characters").optional(),
  location: z.string().trim().max(200, "Location must be less than 200 characters").optional(),
  image_url: z.string().max(1000).optional().or(z.literal("")),
  rating: z.coerce.number().min(0, "Rating must be at least 0").max(5, "Rating must be at most 5").optional(),
  price_range: z.string().trim().max(50, "Price range must be less than 50 characters").optional(),
  opening_hours: z.string().trim().max(200, "Opening hours must be less than 200 characters").optional(),
});

interface CafeDialogProps {
  item: any;
  onClose: () => void;
  onSave: () => void;
}

export function CafeDialog({ item, onClose, onSave }: CafeDialogProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof cafeSchema>>({
    resolver: zodResolver(cafeSchema),
    defaultValues: {
      name: "",
      description: "",
      cuisine_type: "",
      location: "",
      image_url: "",
      rating: 0,
      price_range: "",
      opening_hours: "",
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name || "",
        description: item.description || "",
        cuisine_type: item.cuisine_type || "",
        location: item.location || "",
        image_url: item.image_url || "",
        rating: item.rating || 0,
        price_range: item.price_range || "",
        opening_hours: item.opening_hours || "",
      });
    }
  }, [item, form]);

  const onSubmit = async (data: z.infer<typeof cafeSchema>) => {
    try {
      const dataToSave = {
        name: data.name,
        description: data.description,
        cuisine_type: data.cuisine_type,
        location: data.location,
        image_url: data.image_url,
        rating: data.rating,
        price_range: data.price_range,
        opening_hours: data.opening_hours,
      };

      if (item) {
        const { error } = await supabase
          .from("cafes")
          .update(dataToSave)
          .eq("id", item.id);

        if (error) throw error;
        toast({ title: "Success", description: "Cafe updated successfully." });
      } else {
        const { error } = await supabase.from("cafes").insert([dataToSave]);
        if (error) throw error;
        toast({ title: "Success", description: "Cafe created successfully." });
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
          <DialogTitle>{item ? 'Edit' : 'Add'} Cafe</DialogTitle>
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
              name="cuisine_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuisine Type</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Italian, Asian, Cafe" />
                  </FormControl>
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
                    <ImageUpload value={field.value || ""} onChange={field.onChange} folder="cafes" />
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
                    <Input {...field} placeholder="e.g., ₱, ₱₱, ₱₱₱" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="opening_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening Hours</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Mon-Fri: 9AM-9PM" />
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