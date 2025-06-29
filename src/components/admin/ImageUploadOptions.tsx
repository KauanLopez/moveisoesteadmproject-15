import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Link, Send, X, FileImage } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { validateImageUrl } from '@/services/urlImageService';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ImageUploadOptionsProps {
  onFileSubmit: (files: File[]) => void;
  onUrlSubmit: (url: string) => void;
  isUploading: boolean;
}

const ImageUploadOptions: React.FC<ImageUploadOptionsProps> = ({ onFileSubmit, onUrlSubmit, isUploading }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      
      for (const file of fileList) {
        if (!file.type.startsWith('image/')) {
          toast({ title: "Erro", description: `O arquivo "${file.name}" não é uma imagem. A seleção foi cancelada.`, variant: "destructive" });
          event.target.value = ''; 
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: "Erro", description: `O arquivo "${file.name}" excede o limite de 5MB. A seleção foi cancelada.`, variant: "destructive" });
          event.target.value = '';
          return;
        }
      }
      setSelectedFiles(fileList);
      setImageUrl('');
    }
  };

  const handleFileButtonClick = () => {
    if (selectedFiles && selectedFiles.length > 0) {
      onFileSubmit(selectedFiles);
      setSelectedFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
        toast({ title: "Nenhum arquivo", description: "Por favor, selecione um ou mais arquivos para enviar.", variant: "destructive" });
    }
  };

  const handleUrlButtonClick = () => {
    if (!validateImageUrl(imageUrl)) {
      toast({ title: "URL Inválida", description: "Por favor, insira uma URL de imagem válida que termine com .jpg, .png, etc.", variant: "destructive" });
      return;
    }
    onUrlSubmit(imageUrl.trim());
    setImageUrl('');
  };
  
  const handleClearSelection = () => {
    setSelectedFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 space-y-3">
        <h5 className="font-medium flex items-center gap-2"><Upload className="h-4 w-4" />Opção A: Fazer Upload do Dispositivo</h5>
        <div className="flex gap-2 items-center">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                {selectedFiles && selectedFiles.length > 0 ? `Trocar arquivos (${selectedFiles.length})` : 'Escolher arquivos'}
            </Button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="hidden" 
              id="file-upload-revised"
              multiple // Adicionado para permitir seleção múltipla
            />
            <Button onClick={handleFileButtonClick} disabled={!selectedFiles || selectedFiles.length === 0 || isUploading} className="flex-shrink-0">
                <Send className="h-4 w-4 mr-2" />
                Enviar Arquivos
            </Button>
        </div>
        {selectedFiles && selectedFiles.length > 0 && (
            <div className="p-2 border rounded-md bg-gray-50 space-y-2">
                <div className='flex justify-between items-center'>
                  <p className="text-sm text-gray-700 font-medium">Pré-visualização ({selectedFiles.length} {selectedFiles.length > 1 ? 'arquivos selecionados' : 'arquivo selecionado'}):</p>
                  <Button variant="ghost" size="sm" onClick={handleClearSelection} className="text-xs h-7">
                    <X className="h-3 w-3 mr-1"/> Limpar
                  </Button>
                </div>
                <ScrollArea className="h-40 w-full p-2 border rounded-md bg-white">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative aspect-square group bg-gray-100 rounded-md overflow-hidden">
                        <img src={URL.createObjectURL(file)} alt={`Preview ${file.name}`} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
            </div>
        )}
      </div>
      
      <div className="border rounded-lg p-4 space-y-3">
        <h5 className="font-medium flex items-center gap-2"><Link className="h-4 w-4" />Opção B: Inserir a partir de URL (uma por vez)</h5>
        <div className="flex gap-2">
          <Input type="url" placeholder="https://exemplo.com/imagem.jpg" value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setSelectedFiles(null); }} disabled={isUploading} className="flex-1" />
          <Button onClick={handleUrlButtonClick} disabled={!imageUrl || isUploading}>
            <Send className="h-4 w-4 mr-2" />
            Enviar URL
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadOptions;