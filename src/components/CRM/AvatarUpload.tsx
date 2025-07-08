
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { ImageCropper } from './ImageCropper';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange: (avatarUrl: string) => void;
  userId: string;
  userInitials: string;
}

export const AvatarUpload = ({ currentAvatar, onAvatarChange, userId, userInitials }: AvatarUploadProps) => {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const { uploadAvatar, isUploading } = useAvatarUpload();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validate file size (10MB max for initial selection)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 10MB');
      return;
    }

    // Create preview URL
    const imageUrl = URL.createObjectURL(file);
    setSelectedImageUrl(imageUrl);
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedFile: File) => {
    const avatarUrl = await uploadAvatar(croppedFile, userId);
    if (avatarUrl) {
      onAvatarChange(avatarUrl);
    }
    
    // Clean up the temporary URL
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
      setSelectedImageUrl(null);
    }
  };

  const handleRemove = () => {
    onAvatarChange('');
    toast.success('Avatar removido com sucesso!');
  };

  const handleCloseCropper = () => {
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
      setSelectedImageUrl(null);
    }
    setShowCropper(false);
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="w-32 h-32 border-4 border-gray-200">
            <AvatarImage 
              src={currentAvatar} 
              alt="Avatar" 
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-primary text-white text-2xl font-semibold">
              {currentAvatar ? <Camera className="w-12 h-12" /> : userInitials}
            </AvatarFallback>
          </Avatar>
          
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
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
              disabled={isUploading}
            />
            <label htmlFor="avatar-upload">
              <Button 
                variant="outline" 
                size="sm" 
                className="cursor-pointer" 
                asChild
                disabled={isUploading}
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Enviando...' : 'Selecionar Foto'}
                </span>
              </Button>
            </label>
          </div>

          {currentAvatar && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRemove}
              className="text-destructive hover:text-destructive"
              disabled={isUploading}
            >
              Remover Foto
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Formatos aceitos: JPG, PNG, GIF<br />
            Tamanho máximo: 10MB
          </p>
        </div>
      </div>

      {selectedImageUrl && (
        <ImageCropper
          isOpen={showCropper}
          onClose={handleCloseCropper}
          imageUrl={selectedImageUrl}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
};
