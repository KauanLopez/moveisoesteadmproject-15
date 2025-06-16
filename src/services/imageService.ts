
import { supabase } from '@/integrations/supabase/client';

// Helper function to generate a UUID using the crypto API
const generateUUID = () => {
  return crypto.randomUUID();
};

// Upload function using Supabase Storage
export const uploadCatalogImage = async (file: File, folder: string = 'catalog-images'): Promise<string> => {
  try {
    console.log(`Uploading file to Supabase Storage: ${file.name}`);
    
    // Validate the file before upload
    validateImageFile(file);

    // Generate a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${generateUUID()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(folder)
      .upload(filePath, file);

    if (error) {
      console.error('Supabase storage upload error:', error);
      throw new Error(`Erro no upload: ${error.message}`);
    }

    if (!data) {
      throw new Error('Upload falhou - nenhum dado retornado');
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(folder)
      .getPublicUrl(filePath);

    console.log('File uploaded successfully. Public URL:', publicUrl);
    return publicUrl;

  } catch (error: any) {
    console.error('Exception while uploading image:', error);
    throw error;
  }
};

/**
 * Validate file before upload
 */
const validateImageFile = (file: File): void => {
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error(`Arquivo muito grande. Tamanho máximo: ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  
  // Check file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Formato não suportado. Use PNG, JPG, JPEG ou WebP.');
  }
  
  // Additional validation for file name
  if (!file.name || file.name.trim() === '') {
    throw new Error('Nome do arquivo inválido.');
  }
};

// Upload para produtos em destaque e outras seções (NÃO catálogos)
export const uploadProductImage = async (file: File): Promise<string> => {
  return uploadCatalogImage(file, 'catalog-images');
};

// Upload para gerente e outras seções (NÃO catálogos)
export const uploadManagerImage = async (file: File): Promise<string> => {
  return uploadCatalogImage(file, 'catalog-images');
};
