
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Crop } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange: (avatarUrl: string) => void;
}

export const AvatarUpload = ({ currentAvatar, onAvatarChange }: AvatarUploadProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Arquivo muito grande. Máximo 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setIsModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropAndSave = () => {
    if (selectedImage) {
      // Aqui seria implementada a lógica de crop real
      // Por agora, vamos simular o salvamento
      onAvatarChange(selectedImage);
      setIsModalOpen(false);
      setSelectedImage(null);
      toast.success('Avatar atualizado com sucesso!');
    }
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
            {currentAvatar ? (
              <img 
                src={currentAvatar} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-4xl text-gray-400">👤</div>
            )}
          </div>
          <Button
            size="sm"
            className="absolute bottom-0 right-0 rounded-full p-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
          </Button>
        </div>
        
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Alterar Avatar
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cortar Imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedImage && (
              <div className="flex justify-center">
                <div className="relative">
                  <img 
                    src={selectedImage} 
                    alt="Preview" 
                    className="max-w-full max-h-64 object-contain border rounded"
                  />
                  {/* Aqui seria o componente de crop real */}
                  <div className="absolute inset-0 border-2 border-dashed border-blue-500 rounded-full opacity-50 pointer-events-none"></div>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              Ajuste a imagem dentro da área circular e clique em salvar.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCropAndSave}>
                <Crop className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
