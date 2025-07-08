
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseAvatarUploadReturn {
  uploadAvatar: (file: File, userId: string) => Promise<string | null>;
  isUploading: boolean;
}

export const useAvatarUpload = (): UseAvatarUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
    setIsUploading(true);
    
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida');
        return null;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return null;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Erro ao fazer upload da imagem');
        return null;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      toast.success('Avatar atualizado com sucesso!');
      return data.publicUrl;

    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Erro ao atualizar avatar');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadAvatar, isUploading };
};
