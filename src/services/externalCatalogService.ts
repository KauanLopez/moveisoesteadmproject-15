
import { ExternalUrlCatalog, ExternalUrlCatalogFormData } from '@/types/externalCatalogTypes';
import { supabase } from '@/integrations/supabase/client';

export const externalCatalogService = {
  async getAllCatalogs(): Promise<ExternalUrlCatalog[]> {
    try {
      const { data, error } = await supabase
        .from('external_url_catalogs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching external catalogs:', error);
        throw new Error('Erro ao buscar catálogos externos');
      }
      
      // Transform the data to match our ExternalUrlCatalog type
      const catalogs: ExternalUrlCatalog[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        external_cover_image_url: item.external_cover_image_url,
        external_content_image_urls: Array.isArray(item.external_content_image_urls) 
          ? item.external_content_image_urls as string[]
          : [],
        created_at: item.created_at || new Date().toISOString()
      }));
      
      return catalogs;
    } catch (error) {
      console.error('Error fetching external catalogs:', error);
      throw new Error('Erro ao buscar catálogos externos');
    }
  },

  async createCatalog(catalogData: ExternalUrlCatalogFormData): Promise<ExternalUrlCatalog> {
    try {
      const { data, error } = await supabase
        .from('external_url_catalogs')
        .insert([{
          title: catalogData.title,
          description: catalogData.description || '',
          external_cover_image_url: catalogData.external_cover_image_url,
          external_content_image_urls: catalogData.external_content_image_urls || []
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating external catalog:', error);
        throw new Error('Erro ao criar catálogo externo');
      }
      
      // Transform the response to match our ExternalUrlCatalog type
      const catalog: ExternalUrlCatalog = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        external_cover_image_url: data.external_cover_image_url,
        external_content_image_urls: Array.isArray(data.external_content_image_urls) 
          ? data.external_content_image_urls as string[]
          : [],
        created_at: data.created_at || new Date().toISOString()
      };
      
      return catalog;
    } catch (error) {
      console.error('Error creating external catalog:', error);
      throw new Error('Erro ao criar catálogo externo');
    }
  },

  async updateCatalog(id: string, catalogData: Partial<ExternalUrlCatalogFormData>): Promise<ExternalUrlCatalog> {
    try {
      const { data, error } = await supabase
        .from('external_url_catalogs')
        .update({
          title: catalogData.title,
          description: catalogData.description,
          external_cover_image_url: catalogData.external_cover_image_url,
          external_content_image_urls: catalogData.external_content_image_urls,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating external catalog:', error);
        throw new Error('Erro ao atualizar catálogo externo');
      }
      
      // Transform the response to match our ExternalUrlCatalog type
      const catalog: ExternalUrlCatalog = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        external_cover_image_url: data.external_cover_image_url,
        external_content_image_urls: Array.isArray(data.external_content_image_urls) 
          ? data.external_content_image_urls as string[]
          : [],
        created_at: data.created_at || new Date().toISOString()
      };
      
      return catalog;
    } catch (error) {
      console.error('Error updating external catalog:', error);
      throw new Error('Erro ao atualizar catálogo externo');
    }
  },

  async deleteCatalog(id: string): Promise<void> {
    try {
      // First, get the catalog to find all its image URLs
      const { data: catalog, error: fetchError } = await supabase
        .from('external_url_catalogs')
        .select('external_cover_image_url, external_content_image_urls')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching catalog for deletion:', fetchError);
        throw new Error('Erro ao buscar catálogo para exclusão');
      }
      
      if (catalog) {
        // Collect all URLs from the catalog
        const urlsToDelete = new Set<string>();
        
        if (catalog.external_cover_image_url) {
          urlsToDelete.add(catalog.external_cover_image_url);
        }
        
        if (catalog.external_content_image_urls && Array.isArray(catalog.external_content_image_urls)) {
          (catalog.external_content_image_urls as string[]).forEach((url: string) => {
            if (url) urlsToDelete.add(url);
          });
        }
        
        // Delete featured products that use these URLs
        if (urlsToDelete.size > 0) {
          const { error: featuredDeleteError } = await supabase
            .from('featured_products')
            .delete()
            .in('image_url', Array.from(urlsToDelete));
          
          if (featuredDeleteError) {
            console.error('Error deleting featured products:', featuredDeleteError);
            // Continue with catalog deletion even if featured products deletion fails
          }
        }
      }
      
      // Delete the catalog itself
      const { error: deleteError } = await supabase
        .from('external_url_catalogs')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error('Error deleting catalog:', deleteError);
        throw new Error('Erro ao deletar catálogo');
      }
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('localStorageUpdated'));
    } catch (error) {
      console.error('Error deleting external catalog and its content:', error);
      throw new Error('Erro ao deletar catálogo e limpar favoritos.');
    }
  }
};

// Export individual functions for easier importing
export const fetchExternalCatalogs = externalCatalogService.getAllCatalogs;
export const deleteExternalCatalog = externalCatalogService.deleteCatalog;

export const saveExternalCatalog = async (catalogData: ExternalUrlCatalogFormData & { id?: string }) => {
  if (catalogData.id) {
    const { id, ...updateData } = catalogData;
    return await externalCatalogService.updateCatalog(id, updateData);
  } else {
    return await externalCatalogService.createCatalog(catalogData);
  }
};
