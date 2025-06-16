
import { useState, useEffect } from 'react';
import { ImageContent } from '@/types/customTypes';
import { supabase } from '@/integrations/supabase/client';

export const useFeaturedProducts = (): { products: ImageContent[], loading: boolean } => {
  const [products, setProducts] = useState<ImageContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        console.log('useFeaturedProducts: Loading featured products from Supabase...');
        
        const { data, error } = await supabase
          .from('featured_products')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('useFeaturedProducts: Error loading from Supabase:', error);
          setProducts([]);
          return;
        }
        
        console.log('useFeaturedProducts: Raw Supabase data:', data);
        
        // Map Supabase data to ImageContent format
        const featuredProducts: ImageContent[] = (data || []).map((item: any) => ({
          id: item.id,
          image: item.image_url,
          title: item.title || 'Produto em Destaque',
          description: item.description || '',
          section: 'products',
          objectPosition: 'center',
          scale: 1
        }));
        
        console.log('useFeaturedProducts: Final featured products:', featuredProducts);
        setProducts(featuredProducts);
      } catch (error) {
        console.error('useFeaturedProducts: Error loading products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();

    // Listen for changes to featured products
    const channel = supabase
      .channel('featured-products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'featured_products'
        },
        () => {
          console.log('useFeaturedProducts: Detected change in featured_products table');
          loadProducts();
        }
      )
      .subscribe();

    // Also listen for custom events when localStorage is updated programmatically
    const handleLocalUpdate = () => {
      setTimeout(loadProducts, 100); // Small delay to ensure changes are processed
    };
    
    window.addEventListener('localStorageUpdated', handleLocalUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('localStorageUpdated', handleLocalUpdate);
    };
  }, []);

  return { products, loading };
};
