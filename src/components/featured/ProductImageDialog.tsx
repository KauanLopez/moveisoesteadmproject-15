import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X, Loader2 } from 'lucide-react';

interface ProductImageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedImage: string | null;
}

const ProductImageDialog = ({ 
  isOpen, 
  onOpenChange, 
  selectedImage
}: ProductImageDialogProps) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);

  React.useEffect(() => {
    if (selectedImage) {
      setIsLoading(true);
      setLoadError(false);
    }
  }, [selectedImage]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* O DialogContent já inclui um botão de fechar por padrão */}
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 border-none bg-transparent shadow-none">
        <DialogTitle>
          <VisuallyHidden>Visualização em tela cheia</VisuallyHidden>
        </DialogTitle>
        <div className="relative w-full h-full flex items-center justify-center">
          {isLoading && selectedImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
          )}
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Visualização em tela cheia" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setLoadError(true);
              }}
            />
          )}
          {loadError && (
            <div className="bg-white/80 p-4 rounded-lg text-center">
              <p className="text-red-500">Não foi possível carregar a imagem</p>
            </div>
          )}
          {/* O botão duplicado foi removido daqui */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImageDialog;