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

const accommodationSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  description: z.string().trim().max(2000, "Description must be less than 2000 characters").optional(),
  type: z.string().min(1, "Type is required"),
  image_url: z.string().max(1000).optional().or(z.literal("")),
  location: z.string().trim().max(200, "Location must be less than 200 characters").optional(),
  rating: z.coerce.number().min(0, "Rating must be at least 0").max(5, "Rating must be at most 5").optional(),
  price_per_night: z.coerce.number().min(0, "Price must be at least 0").optional(),
  amenities: z.string().trim().max(500, "Amenities must be less than 500 characters").optional(),
});

interface AccommodationDialogProps {
  item: any;
  onClose: () => void;
  onSave: () => void;
}

export function AccommodationDialog({ item, onClose, onSave }: AccommodationDialogProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof accommodationSchema>>({
    resolver: zodResolver(accommodationSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "hotel",
      image_url: "",
      location: "",
      rating: 0,
      price_per_night: 0,
      amenities: "",
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name || "",
        description: item.description || "",
        type: item.type || "hotel",
        image_url: item.image_url || "",
        location: item.location || "",
        rating: item.rating || 0,
        price_per_night: item.price_per_night || 0,
        amenities: item.amenities ? item.amenities.join(", ") : "",
      });
    }
  }, [item, form]);

  const onSubmit = async (values: z.infer<typeof accommodationSchema>) => {
    try {
      const amenitiesArray = values.amenities
        ? values.amenities.split(",").map((a) => a.trim()).filter((a) => a.length > 0)
        : [];

      const dataToSave = {
        name: values.name,
        description: values.description,
        type: values.type,
        image_url: values.image_url,
        location: values.location,
        rating: values.rating,
        price_per_night: values.price_per_night,
        amenities: amenitiesArray.length > 0 ? amenitiesArray : null,
      };

      if (item) {
        const { error } = await supabase
          .from("accommodations")
          .update(dataToSave)
          .eq("id", item.id);

        if (error) throw error;
        toast({ title: "Success", description: "Accommodation updated successfully." });
      } else {
        const { error } = await supabase
          .from("accommodations")
          .insert([dataToSave]);
        if (error) throw error;
        toast({ title: "Success", description: "Accommodation created successfully." });
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
          <DialogTitle>{item ? 'Edit' : 'Add'} Accommodation</DialogTitle>
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="resort">Resort</SelectItem>
                      <SelectItem value="hostel">Hostel</SelectItem>
                      <SelectItem value="guesthouse">Guesthouse</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
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
                    <ImageUpload value={field.value || ""} onChange={field.onChange} folder="accommodations" />
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
              name="price_per_night"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Night (₱)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amenities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amenities (comma-separated)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="WiFi, Pool, Parking, Breakfast" />
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