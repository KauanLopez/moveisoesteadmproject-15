import { useState, useEffect } from 'react';
import { ImageContent } from '@/types/customTypes';

export const useFeaturedProducts = (): { products: ImageContent[], loading: boolean } => {
  const [products, setProducts] = useState<ImageContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        console.log('useFeaturedProducts: Loading featured products...');
        
        // Load from localStorage where the main site stores content
        const storedContent = localStorage.getItem('moveis_oeste_content');
        console.log('useFeaturedProducts: Raw localStorage content:', storedContent);
        
        let featuredProducts: ImageContent[] = [];
        
        if (storedContent) {
          const allContent = JSON.parse(storedContent);
          console.log('useFeaturedProducts: Parsed content:', allContent);
          
          // Filter for products section and items marked as featured
          const storedFeaturedProducts = allContent.filter((item: any) => {
            const isProductSection = item.section === 'products';
            const isFeatured = item.eh_favorito === true || item.isFeatured === true;
            console.log(`useFeaturedProducts: Item ${item.id} - section: ${item.section}, eh_favorito: ${item.eh_favorito}, isFeatured: ${item.isFeatured}`);
            return isProductSection && isFeatured;
          });
          
          console.log('useFeaturedProducts: Filtered featured products from localStorage:', storedFeaturedProducts);
          
          // Map stored products to ImageContent format
          featuredProducts = storedFeaturedProducts.map((item: any) => ({
            id: item.id,
            image: item.image_url || item.image,
            title: item.title,
            description: item.description,
            section: item.section,
            objectPosition: item.object_position || 'center',
            scale: item.scale || 1
          }));
        }
        
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

    // Listen for localStorage changes to update the view
    const handleStorageChange = () => {
      loadProducts();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when localStorage is updated programmatically
    const handleLocalUpdate = () => {
      setTimeout(loadProducts, 100); // Small delay to ensure localStorage is updated
    };
    
    window.addEventListener('localStorageUpdated', handleLocalUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdated', handleLocalUpdate);
    };
  }, []);

  return { products, loading };
};