import React, { useState, useEffect } from 'react';
import CatalogModal from './catalog/CatalogModal';
import CatalogSectionHeader from './catalog/components/CatalogSectionHeader';
import CatalogCarouselContainer from './catalog/components/CatalogCarouselContainer';
import { fetchExternalCatalogs } from '@/services/externalCatalogService'; // Importa a função correta
import { ExternalUrlCatalog } from '@/types/externalCatalogTypes'; // Importa o tipo do Supabase
import { Loader2 } from 'lucide-react';

// A interface que o CatalogCarouselContainer espera
interface Catalog {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  images: Array<{ url: string; title: string }>;
}

const CatalogSection: React.FC = () => {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true); // Adicionado estado de loading

  // Efeito para carregar os catálogos do Supabase
  useEffect(() => {
    const loadCatalogsFromSupabase = async () => {
      setLoading(true);
      try {
        const externalCatalogs: ExternalUrlCatalog[] = await fetchExternalCatalogs();
        
        // Mapeia os dados do Supabase para o formato que o componente espera
        const formattedCatalogs: Catalog[] = externalCatalogs.map(sc => ({
          id: sc.id,
          name: sc.title,
          description: sc.description,
          coverImage: sc.external_cover_image_url,
          images: (sc.external_content_image_urls || []).map((url, index) => ({
            url: url,
            title: `Página ${index + 1}`
          }))
        }));

        setCatalogs(formattedCatalogs);
      } catch (error) {
        console.error("Erro ao carregar catálogos do Supabase:", error);
        // Em caso de erro, define como um array vazio para não quebrar a UI
        setCatalogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadCatalogsFromSupabase();

    // Opcional: listener para atualizar se houver um evento global
    const handleStorageUpdate = () => loadCatalogsFromSupabase();
    window.addEventListener('localStorageUpdated', handleStorageUpdate);

    return () => {
      window.removeEventListener('localStorageUpdated', handleStorageUpdate);
    };
  }, []);

  const handleCatalogClick = (catalog: Catalog) => {
    setSelectedCatalog(catalog);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCatalog(null);
  };

  return (
    <>
      <section id="catalogs" className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <CatalogSectionHeader title="Catálogos" />
          
          {loading ? (
            <div className="text-center text-gray-500 py-10">
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              <p className="mt-2">Carregando catálogos...</p>
            </div>
          ) : catalogs.length > 0 ? (
            <CatalogCarouselContainer
              catalogs={catalogs}
              onCatalogClick={handleCatalogClick}
            />
          ) : (
            <div className="text-center text-gray-500 py-10">
              <p>Nenhum catálogo disponível no momento.</p>
            </div>
          )}
        </div>
      </section>

      {selectedCatalog && (
        <CatalogModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          catalog={selectedCatalog}
        />
      )}
    </>
  );
};

export default CatalogSection;