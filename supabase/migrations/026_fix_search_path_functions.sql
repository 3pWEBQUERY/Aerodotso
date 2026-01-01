-- Fix mutable search_path for functions
-- This addresses the Supabase lint warning about functions with role mutable search_path

-- Fix search_workspace function
ALTER FUNCTION public.search_workspace(UUID, TEXT, vector(768), TEXT[], INTEGER)
SET search_path = pg_catalog, public;

-- Fix search_documents_semantic function
ALTER FUNCTION public.search_documents_semantic(UUID, vector(768), INTEGER, FLOAT)
SET search_path = pg_catalog, public;

-- Fix search_images_visual function
ALTER FUNCTION public.search_images_visual(UUID, vector(768), INTEGER, FLOAT)
SET search_path = pg_catalog, public;
