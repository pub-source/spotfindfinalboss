DELETE FROM public.tourist_spots
WHERE image_url IS NULL OR image_url = '' OR image_url NOT LIKE '%/storage/v1/object/public/places/%';

DELETE FROM public.accommodations
WHERE image_url IS NULL OR image_url = '' OR image_url NOT LIKE '%/storage/v1/object/public/places/%';

DELETE FROM public.cafes
WHERE image_url IS NULL OR image_url = '' OR image_url NOT LIKE '%/storage/v1/object/public/places/%';

DELETE FROM public.gallery
WHERE image_url IS NULL OR image_url = '' OR image_url NOT LIKE '%/storage/v1/object/public/places/%';