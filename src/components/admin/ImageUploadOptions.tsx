import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Link, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { validateImageUrl } from '@/services/urlImageService';

interface ImageUploadOptionsProps {
  onFileSubmit: (file: File) => void;
  onUrlSubmit: (url: string) => void;
  isUploading: boolean;
}

const ImageUploadOptions: React.FC<ImageUploadOptionsProps> = ({ onFileSubmit, onUrlSubmit, isUploading }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Erro", description: "Por favor, selecione apenas arquivos de imagem.", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Erro", description: "O arquivo deve ter no máximo 5MB.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      setImageUrl(''); // Clear URL input if a file is selected
    }
  };

  const handleFileButtonClick = () => {
    if (selectedFile) {
      onFileSubmit(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
        toast({ title: "Nenhum arquivo", description: "Por favor, selecione um arquivo para enviar.", variant: "destructive" });
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

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 space-y-3">
        <h5 className="font-medium flex items-center gap-2"><Upload className="h-4 w-4" />Opção A: Fazer Upload do Dispositivo</h5>
        <div className="flex gap-2 items-center">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                {selectedFile ? 'Trocar Arquivo' : 'Escolher Arquivo'}
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload-revised" />
            <Button onClick={handleFileButtonClick} disabled={!selectedFile || isUploading} className="flex-shrink-0">
                <Send className="h-4 w-4 mr-2" />
                Enviar Arquivo
            </Button>
        </div>
        {selectedFile && (
            <div className="p-2 border rounded-md bg-gray-50">
                <p className="text-sm text-gray-700">Pré-visualização:</p>
                <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="mt-2 rounded-md max-h-40 mx-auto" />
            </div>
        )}
      </div>
      
      <div className="border rounded-lg p-4 space-y-3">
        <h5 className="font-medium flex items-center gap-2"><Link className="h-4 w-4" />Opção B: Inserir a partir de URL</h5>
        <div className="flex gap-2">
          <Input type="url" placeholder="https://exemplo.com/imagem.jpg" value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setSelectedFile(null); }} disabled={isUploading} className="flex-1" />
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