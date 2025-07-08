
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { RotateCw, Move, ZoomIn } from 'lucide-react';

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedImage: File) => void;
}

export const ImageCropper = ({ isOpen, onClose, imageUrl, onCropComplete }: ImageCropperProps) => {
  const [zoom, setZoom] = useState([1]);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleCropAndSave = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to square
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Save context
    ctx.save();

    // Move to center
    ctx.translate(size / 2, size / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply zoom and draw image
    const scale = zoom[0];
    const drawSize = size * scale;
    ctx.drawImage(image, -drawSize / 2, -drawSize / 2, drawSize, drawSize);

    // Restore context
    ctx.restore();

    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'cropped-avatar.jpg', { type: 'image/jpeg' });
        onCropComplete(file);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  }, [zoom, rotation, onCropComplete, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '300px' }}>
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              style={{
                transform: `scale(${zoom[0]}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease'
              }}
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <ZoomIn className="w-4 h-4" />
              <span className="text-sm font-medium w-12">Zoom:</span>
              <Slider
                value={zoom}
                onValueChange={setZoom}
                max={3}
                min={0.5}
                step={0.1}
                className="flex-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Rotação:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
              >
                <RotateCw className="w-4 h-4 mr-1" />
                Girar
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <Move className="w-3 h-3 inline mr-1" />
            Ajuste o zoom e rotação para obter o melhor enquadramento
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleCropAndSave}>
            Salvar Foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
