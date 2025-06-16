
import { ExternalUrlCatalog } from '@/types/externalCatalogTypes';
import { supabase } from '@/integrations/supabase/client';

export interface SyncedCatalogImage {
  id: string;
  image: string;
  title?: string;
  description?: string;
  isFavorite: boolean;
  catalog_id: string;
}

export const favoriteSyncService = {
  /**
   * Gets the list of featured product URLs from Supabase
   */
  async getFeaturedProductUrls(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('featured_products')
        .select('image_url');
      
      if (error) {
        console.error('Error fetching featured products:', error);
        return [];
      }
      
      const featuredUrls = data?.map(item => item.image_url) || [];
      console.log('FavoriteSyncService: All featured URLs:', featuredUrls);
      return featuredUrls;
    } catch (error) {
      console.error('Error getting featured product URLs:', error);
      return [];
    }
  },

  /**
   * Synchronizes catalog images with featured products state
   */
  async syncCatalogImagesWithFavorites(catalog: ExternalUrlCatalog): Promise<SyncedCatalogImage[]> {
    const featuredUrls = await this.getFeaturedProductUrls();
    const featuredUrlsSet = new Set(featuredUrls);
    
    console.log('FavoriteSyncService: Featured URLs found:', featuredUrls);
    console.log('FavoriteSyncService: Syncing catalog:', catalog.title);
    
    if (!catalog.external_content_image_urls || catalog.external_content_image_urls.length === 0) {
      return [];
    }
    
    const syncedImages: SyncedCatalogImage[] = catalog.external_content_image_urls.map((url, index) => {
      const isFavorite = featuredUrlsSet.has(url);
      
      console.log(`FavoriteSyncService: Image ${url} - isFavorite: ${isFavorite}`);
      
      return {
        id: `${catalog.id}-${index}`,
        image: url,
        title: `Imagem ${index + 1} - ${catalog.title}`,
        description: `Imagem do catálogo ${catalog.title}`,
        isFavorite,
        catalog_id: catalog.id
      };
    });
    
    console.log('FavoriteSyncService: Synced images:', syncedImages);
    return syncedImages;
  },

  /**
   * Updates the favorite status of a specific image
   */
  async updateImageFavoriteStatus(imageUrl: string, isFavorite: boolean): Promise<boolean> {
    try {
      if (isFavorite) {
        // Add to favorites
        const { error } = await supabase
          .from('featured_products')
          .insert({
            image_url: imageUrl,
            title: 'Produto em Destaque',
            description: 'Adicionado via painel administrativo'
          });
        
        if (error) {
          console.error('Error adding to favorites:', error);
          return false;
        }
      } else {
        // Remove from favorites
        const { error } = await supabase
          .from('featured_products')
          .delete()
          .eq('image_url', imageUrl);
        
        if (error) {
          console.error('Error removing from favorites:', error);
          return false;
        }
      }
      
      console.log('FavoriteSyncService: Updated favorite status for:', imageUrl, 'to:', isFavorite);
      
      // Dispatch event to notify other parts of the application
      window.dispatchEvent(new CustomEvent('localStorageUpdated'));

      return true;
    } catch (error) {
      console.error('Error updating favorite status:', error);
      return false;
    }
  }
};
