
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Image, Star, Trash2 } from 'lucide-react';
import { fetchExternalCatalogs, deleteExternalCatalog, saveExternalCatalog } from '@/services/externalCatalogService';
import { ExternalUrlCatalog } from '@/types/externalCatalogTypes';
import CreateCatalogModal from './CreateCatalogModal';
import CatalogImagesModal from './CatalogImagesModal';

const CatalogManagement = () => {
  const [catalogs, setCatalogs] = useState<ExternalUrlCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<ExternalUrlCatalog | null>(null);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    setLoading(true);
    try {
      const catalogsData = await fetchExternalCatalogs();
      setCatalogs(catalogsData);
    } catch (error) {
      console.error('CatalogManagement: Error loading catalogs:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os catálogos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCatalog = async (catalogData: { name: string; description: string; coverImage: string }) => {
    try {
      await saveExternalCatalog({
        title: catalogData.name,
        description: catalogData.description,
        external_cover_image_url: catalogData.coverImage,
        external_content_image_urls: []
      });
      
      toast({
        title: "Sucesso!",
        description: `Catálogo "${catalogData.name}" criado com sucesso.`,
      });

      setShowCreateModal(false);
      loadCatalogs(); 
    } catch (error) {
      console.error('Error creating catalog:', error);
      toast({
        title: "Erro ao criar catálogo",
        description: "Ocorreu um erro ao tentar salvar o catálogo.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCatalog = async (catalogId: string, catalogTitle: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o catálogo "${catalogTitle}"?`)) {
        try {
            await deleteExternalCatalog(catalogId);
            toast({
                title: "Catálogo Excluído",
                description: `O catálogo "${catalogTitle}" foi excluído com sucesso.`
            });
            loadCatalogs();
        } catch (error) {
            toast({
                title: "Erro ao Excluir",
                description: "Não foi possível remover o catálogo.",
                variant: "destructive"
            });
        }
    }
  };

  const handleOpenImagesModal = (catalog: ExternalUrlCatalog) => {
    setSelectedCatalog(catalog);
    setShowImagesModal(true);
  };

  const handleCloseImagesModal = () => {
    setShowImagesModal(false);
    setSelectedCatalog(null);
    loadCatalogs();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Gerenciar Catálogos</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">Carregando catálogos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Catálogos</h2>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Criar Novo Catálogo
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800 text-sm">
          <strong>ℹ️ Informação:</strong> Esta seção exibe os catálogos que estão atualmente publicados no site principal. 
          Os dados são sincronizados automaticamente com o carrossel de catálogos da página inicial.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {catalogs.map((catalog) => (
          <Card key={catalog.id} className="overflow-hidden">
            <div className="aspect-video relative">
              <img
                src={catalog.external_cover_image_url}
                alt={catalog.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/400x300?text=Imagem+não+encontrada';
                }}
              />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">{catalog.title}</CardTitle>
              <p className="text-sm text-gray-600 truncate">{catalog.description}</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleOpenImagesModal(catalog)}
                  className="flex items-center gap-2"
                >
                  <Image className="h-4 w-4" />
                  Ver Imagens do Catálogo
                </Button>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Catálogo do site principal
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCatalog(catalog.id, catalog.title)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {catalogs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Nenhum catálogo encontrado.</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Catálogo
          </Button>
        </div>
      )}

      {showCreateModal && (
        <CreateCatalogModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCatalog}
        />
      )}

      {showImagesModal && selectedCatalog && (
        <CatalogImagesModal
          catalog={selectedCatalog}
          onClose={handleCloseImagesModal}
        />
      )}
    </div>
  );
};

export default CatalogManagement;
