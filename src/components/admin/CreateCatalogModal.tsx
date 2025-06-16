
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import ImageUploadOptions from './ImageUploadOptions';
import { uploadCatalogImage } from '@/services/imageService';

interface CreateCatalogModalProps {
  onClose: () => void;
  onCreate: (catalog: { name: string; description: string; coverImage: string }) => void;
}

const CreateCatalogModal: React.FC<CreateCatalogModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSubmit = async (files: File[]) => {
    if (files.length === 0) return;
    
    try {
      setIsSubmitting(true);
      // Take the first file from the array
      const file = files[0];
      const uploadedUrl = await uploadCatalogImage(file, 'catalog-covers');
      setCoverImage(uploadedUrl);
    } catch (error) {
      console.error('Error uploading cover image:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUrlSubmit = async (url: string) => {
    setCoverImage(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !coverImage) return;

    setIsSubmitting(true);
    try {
      onCreate({
        name: name.trim(),
        description: description.trim(),
        coverImage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Criar Novo Catálogo</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Catálogo *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Móveis de Sala"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frase Breve
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Sofás, mesas e decoração moderna"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capa do Catálogo *
              </label>
              <ImageUploadOptions
                onFileSubmit={handleFileSubmit}
                onUrlSubmit={handleUrlSubmit}
                isUploading={isSubmitting}
              />
              {coverImage && (
                <div className="mt-4 p-2 border rounded-md bg-gray-50">
                  <p className="text-sm text-gray-700 mb-2">Imagem selecionada:</p>
                  <img src={coverImage} alt="Cover preview" className="rounded-md max-h-40 mx-auto" />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={!name.trim() || !coverImage || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Criando...' : 'Criar Catálogo'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCatalogModal;
