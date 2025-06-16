
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles Table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  role text DEFAULT 'user',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- External URL Catalogs Table
CREATE TABLE public.external_url_catalogs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  external_cover_image_url text NOT NULL,
  external_content_image_urls jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Featured Products Table
CREATE TABLE public.featured_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text UNIQUE NOT NULL,
  catalog_id uuid REFERENCES public.external_url_catalogs(id) ON DELETE SET NULL,
  title text,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- Content Table (for backward compatibility)
CREATE TABLE public.content (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  description text,
  image_url text,
  section text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS Policies (Public Read, Admin Write)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE public.external_url_catalogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view catalogs" ON public.external_url_catalogs FOR SELECT USING (true);
CREATE POLICY "Admin users can manage catalogs" ON public.external_url_catalogs FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

ALTER TABLE public.featured_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view featured products" ON public.featured_products FOR SELECT USING (true);
CREATE POLICY "Admin users can manage featured products" ON public.featured_products FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view content" ON public.content FOR SELECT USING (true);
CREATE POLICY "Admin users can manage content" ON public.content FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('catalog-images', 'catalog-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('catalog-covers', 'catalog-covers', true);

-- Storage policies
CREATE POLICY "Anyone can view catalog images" ON storage.objects FOR SELECT USING (bucket_id = 'catalog-images');
CREATE POLICY "Admin users can upload catalog images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'catalog-images' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin users can delete catalog images" ON storage.objects FOR DELETE USING (bucket_id = 'catalog-images' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Anyone can view catalog covers" ON storage.objects FOR SELECT USING (bucket_id = 'catalog-covers');
CREATE POLICY "Admin users can upload catalog covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'catalog-covers' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin users can delete catalog covers" ON storage.objects FOR DELETE USING (bucket_id = 'catalog-covers' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
