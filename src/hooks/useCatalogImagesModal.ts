import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ExternalUrlCatalog } from '@/types/externalCatalogTypes';
import { favoriteSyncService, SyncedCatalogImage } from '@/services/favoriteSyncService';
import { uploadCatalogImage } from '@/services/imageService';
import { externalCatalogService } from '@/services/externalCatalogService';

export const useCatalogImagesModal = (catalog: ExternalUrlCatalog) => {
  const [images, setImages] = useState<SyncedCatalogImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const loadCatalogImages = useCallback(async () => {
    setLoading(true);
    try {
      const updatedCatalogs = await externalCatalogService.getAllCatalogs();
      const currentCatalog = updatedCatalogs.find(c => c.id === catalog.id);

      if (currentCatalog) {
        const syncedImages = await favoriteSyncService.syncCatalogImagesWithFavorites(currentCatalog);
        setImages(syncedImages);
      }
    } catch (error) {
      console.error('CatalogImagesModal: Error loading catalog images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [catalog.id]);

  useEffect(() => {
    loadCatalogImages();
  }, [loadCatalogImages]);

  const addImageUrlToCatalog = async (imageUrl: string) => {
    const allCatalogs = await externalCatalogService.getAllCatalogs();
    const currentCatalogVersion = allCatalogs.find(c => c.id === catalog.id);
    
    if (!currentCatalogVersion) {
        throw new Error("Catálogo não encontrado. Tente novamente.");
    }

    const updatedUrls = [...(currentCatalogVersion.external_content_image_urls || []), imageUrl];
    
    await externalCatalogService.updateCatalog(catalog.id, {
        external_content_image_urls: updatedUrls,
    });
  };

  const handleFileSubmit = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    const uploadPromises = files.map(file => uploadCatalogImage(file, 'catalog-images'));

    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      
      // Adiciona todas as novas URLs de uma vez
      const allCatalogs = await externalCatalogService.getAllCatalogs();
      const currentCatalogVersion = allCatalogs.find(c => c.id === catalog.id);
      if (!currentCatalogVersion) {
        throw new Error("Catálogo não encontrado. Tente novamente.");
      }
      const updatedUrls = [...(currentCatalogVersion.external_content_image_urls || []), ...uploadedUrls];
      await externalCatalogService.updateCatalog(catalog.id, {
        external_content_image_urls: updatedUrls,
      });

      toast({
        title: "Sucesso",
        description: `${files.length} imagem(ns) adicionada(s) ao catálogo.`
      });

    } catch (error: any) {
      console.error("Error uploading multiple files:", error);
      toast({
        title: "Erro de Upload",
        description: error.message || "Não foi possível fazer o upload de um ou mais arquivos.",
        variant: "destructive"
      });
    } finally {
      await loadCatalogImages();
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = async (url: string) => {
    if (!url) return;
    setIsUploading(true);
    try {
      await addImageUrlToCatalog(url);
      toast({ title: "Sucesso", description: "Imagem adicionada ao catálogo." });
    } catch (error: any) {
      console.error("Error adding image to catalog:", error);
      toast({ title: "Erro ao adicionar imagem", description: error.message || "Não foi possível adicionar a imagem.", variant: "destructive" });
    } finally {
      await loadCatalogImages();
      setIsUploading(false);
    }
  };

  const toggleFavorite = async (imageId: string) => {
    try {
      const imageIndex = images.findIndex(img => img.id === imageId);
      if (imageIndex === -1) throw new Error('Imagem não encontrada');
      
      const image = images[imageIndex];
      const newFavoriteStatus = !image.isFavorite;
      
      const success = await favoriteSyncService.updateImageFavoriteStatus(image.image, newFavoriteStatus);
      
      if (success) {
        const updatedImages = [...images];
        updatedImages[imageIndex] = { ...image, isFavorite: newFavoriteStatus };
        setImages(updatedImages);
        
        window.dispatchEvent(new CustomEvent('localStorageUpdated'));
        
        toast({
          title: newFavoriteStatus ? "Produto destacado" : "Produto removido dos destaques",
          description: newFavoriteStatus 
            ? "Item adicionado à seção 'Produtos em Destaque'."
            : "Item removido da seção 'Produtos em Destaque'.",
        });
      } else {
        throw new Error('Falha ao atualizar status de favorito');
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status de destaque do item.",
        variant: "destructive"
      });
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!window.confirm("Tem certeza que deseja remover esta imagem do catálogo?")) return;

    try {
        const imageToDelete = images.find(img => img.id === imageId);
        if (!imageToDelete) throw new Error("Imagem não encontrada para exclusão.");

        const allCatalogs = await externalCatalogService.getAllCatalogs();
        const currentCatalogVersion = allCatalogs.find(c => c.id === catalog.id);
        if (!currentCatalogVersion) throw new Error("Catálogo não encontrado.");

        const updatedUrls = (currentCatalogVersion.external_content_image_urls || []).filter(
            url => url !== imageToDelete.image
        );

        await externalCatalogService.updateCatalog(catalog.id, {
            external_content_image_urls: updatedUrls
        });

        toast({
            title: "Imagem removida",
            description: "A imagem foi removida do catálogo com sucesso.",
        });

        await loadCatalogImages();

    } catch (error: any) {
        console.error("Error deleting image:", error);
        toast({
            title: "Erro ao remover imagem",
            description: error.message || "Não foi possível remover a imagem.",
            variant: "destructive"
        });
    }
  };

  return {
    images,
    loading,
    isUploading, 
    handleFileSubmit,
    handleUrlSubmit,
    toggleFavorite,
    deleteImage
  };
};