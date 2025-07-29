import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { RotateCw, Move, ZoomIn, Download } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarCropperProps {
  isOpen: boolean;
  onClose: () => void;
  file: File;
  onCropComplete: (croppedImageDataUrl: string) => void;
}

export const AvatarCropper = ({ isOpen, onClose, file, onCropComplete }: AvatarCropperProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState([1]);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load image when file changes
  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setImageUrl(result);
          setImageLoaded(false);
          setImageError(false);
          setPosition({ x: 0, y: 0 });
          setZoom([1]);
          setRotation(0);
        }
      };
      reader.onerror = () => {
        setImageError(true);
        setImageLoaded(false);
      };
      reader.readAsDataURL(file);
    }
  }, [file]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoaded(false);
    setImageError(true);
  };

  // Mouse handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Calculate max offset based on zoom and image size
    const containerSize = 300;
    const imageSize = containerSize * zoom[0];
    const maxOffset = Math.max(0, (imageSize - containerSize) / 2);
    
    setPosition({
      x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
      y: Math.max(-maxOffset, Math.min(maxOffset, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    
    const containerSize = 300;
    const imageSize = containerSize * zoom[0];
    const maxOffset = Math.max(0, (imageSize - containerSize) / 2);
    
    setPosition({
      x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
      y: Math.max(-maxOffset, Math.min(maxOffset, newY))
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Reset position when zoom changes
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, [zoom]);

  const handleCropAndSave = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to optimal avatar size
    const size = 256;
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

    // Calculate crop area
    const containerSize = 300;
    const cropSize = containerSize / zoom[0];
    const offsetX = (position.x / containerSize) * cropSize;
    const offsetY = (position.y / containerSize) * cropSize;
    
    // Draw image with zoom and position
    const drawSize = size * zoom[0];
    ctx.drawImage(
      image, 
      -drawSize / 2 + offsetX, 
      -drawSize / 2 + offsetY, 
      drawSize, 
      drawSize
    );

    // Restore context
    ctx.restore();

    // Convert to optimized JPEG
    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            onCropComplete(result);
          } else {
            toast.error('Erro ao processar a imagem. Tente novamente.');
          }
        };
        reader.readAsDataURL(blob);
      } else {
        toast.error('Erro ao processar a imagem. Tente novamente.');
      }
    }, 'image/jpeg', 0.85);
  }, [zoom, rotation, position, imageLoaded, onCropComplete]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
          <DialogDescription>
            Ajuste a imagem para selecionar a área que será sua foto de perfil. 
            Use o zoom e a rotação para fazer as modificações necessárias.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          {/* Image Container */}
          <div 
            ref={containerRef}
            className="relative w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Carregando imagem...</p>
                </div>
              </div>
            )}

            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-red-500 mb-2">Erro ao carregar a imagem</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            )}

            {imageLoaded && (
              <>
                {/* Image with transforms */}
                <div
                  className="relative"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                  }}
                >
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Preview"
                    className="max-w-none select-none"
                    style={{
                      transform: `scale(${zoom[0]}) rotate(${rotation}deg)`,
                      transformOrigin: 'center center',
                      userSelect: 'none',
                      pointerEvents: 'none'
                    }}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                </div>

                {/* Crop area overlay */}
                <div
                  className="absolute inset-0 border-2 border-white shadow-lg pointer-events-none z-10"
                  style={{
                    width: '200px',
                    height: '200px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '8px'
                  }}
                />
              </>
            )}
          </div>

          {/* Controls */}
          {imageLoaded && (
            <div className="space-y-4">
              {/* Zoom Control */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ZoomIn className="w-4 h-4" />
                  <span className="text-sm font-medium">Zoom</span>
                </div>
                <Slider
                  value={zoom}
                  onValueChange={setZoom}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  {Math.round(zoom[0] * 100)}%
                </div>
              </div>

              {/* Rotation Control */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4" />
                  <span className="text-sm font-medium">Rotação</span>
                </div>
                <Slider
                  value={[rotation]}
                  onValueChange={(value) => setRotation(value[0])}
                  min={-180}
                  max={180}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  {rotation}°
                </div>
              </div>

              {/* Instructions */}
              <div className="text-xs text-muted-foreground text-center">
                Arraste a imagem para posicioná-la. Use o zoom e rotação para ajustar.
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCropAndSave}
            disabled={!imageLoaded}
            className="bg-primary hover:bg-primary/90"
          >
            <Download className="w-4 h-4 mr-2" />
            Salvar Foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 