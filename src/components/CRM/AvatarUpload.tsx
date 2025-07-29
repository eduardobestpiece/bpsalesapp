import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { AvatarCropper } from './AvatarCropper';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange: (avatarUrl: string) => void;
  userId: string;
  userInitials: string;
}

export const AvatarUpload = ({ currentAvatar, onAvatarChange, userId, userInitials }: AvatarUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Arquivo selecionado:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 10MB');
      return;
    }

    setSelectedFile(file);
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedImageDataUrl: string) => {
    setIsUploading(true);
    
    try {
      // Convert data URL to File
      const response = await fetch(croppedImageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

      // Optimize image for web
      const optimizedDataUrl = await optimizeImage(file);
      
      onAvatarChange(optimizedDataUrl);
      toast.success('Avatar atualizado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao processar avatar:', error);
      toast.error('Erro ao atualizar avatar');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setShowCropper(false);
    }
  };

  const optimizeImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set optimal size for avatar (256x256 for good quality and fast loading)
        const size = 256;
        canvas.width = size;
        canvas.height = size;

        // Clear canvas
        ctx?.clearRect(0, 0, size, size);

        // Draw image maintaining aspect ratio
        if (ctx) {
          ctx.drawImage(img, 0, 0, size, size);
        }

        // Convert to optimized JPEG
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              resolve(result);
            };
            reader.readAsDataURL(blob);
          }
        }, 'image/jpeg', 0.85); // Optimized quality for web
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleRemove = () => {
    onAvatarChange('');
    toast.success('Avatar removido com sucesso!');
  };

  const handleCloseCropper = () => {
    setSelectedFile(null);
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
              ref={fileInputRef}
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

      {selectedFile && (
        <AvatarCropper
          isOpen={showCropper}
          onClose={handleCloseCropper}
          file={selectedFile}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}; 