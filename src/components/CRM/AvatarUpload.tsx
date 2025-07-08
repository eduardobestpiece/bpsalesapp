
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange: (avatarUrl: string) => void;
}

export const AvatarUpload = ({ currentAvatar, onAvatarChange }: AvatarUploadProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    try {
      // Simular upload - em um cenário real, seria feito upload para Supabase Storage
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Por enquanto, usar a preview como URL do avatar
      onAvatarChange(selectedImage);
      toast.success('Avatar atualizado com sucesso!');
      setSelectedImage(null);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao atualizar avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedImage(null);
    onAvatarChange('');
    toast.success('Avatar removido com sucesso!');
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="w-32 h-32 border-4 border-gray-200">
          <AvatarImage 
            src={selectedImage || currentAvatar} 
            alt="Avatar" 
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-primary text-white text-2xl font-semibold">
            <Camera className="w-12 h-12" />
          </AvatarFallback>
        </Avatar>
        
        {selectedImage && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <p className="text-white text-xs">Preview</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center space-y-2">
        <div className="flex gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-upload"
          />
          <label htmlFor="avatar-upload">
            <Button variant="outline" size="sm" className="cursor-pointer" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Foto
              </span>
            </Button>
          </label>

          {selectedImage && (
            <Button 
              onClick={handleUpload} 
              size="sm"
              disabled={isUploading}
            >
              {isUploading ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </div>

        {(selectedImage || currentAvatar) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRemove}
            className="text-destructive hover:text-destructive"
          >
            Remover Foto
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Formatos aceitos: JPG, PNG, GIF<br />
          Tamanho máximo: 5MB
        </p>
      </div>
    </div>
  );
};
