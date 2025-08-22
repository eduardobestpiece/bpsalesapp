import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Download, Move } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarCropperProps {
  isOpen: boolean;
  onClose: () => void;
  file: File;
  onCropComplete: (croppedImageDataUrl: string) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const AvatarCropper = ({ isOpen, onClose, file, onCropComplete }: AvatarCropperProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 50, y: 50, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [imageRect, setImageRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

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
        }
      };
      reader.onerror = () => {
        setImageError(true);
        setImageLoaded(false);
      };
      reader.readAsDataURL(file);
    }
  }, [file]);

  const calculateImagePosition = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const img = imageRef.current;
    
    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    // Calculate position relative to container
    const x = imgRect.left - containerRect.left;
    const y = imgRect.top - containerRect.top;
    const width = imgRect.width;
    const height = imgRect.height;
    
    setImageRect({ x, y, width, height });
    
    // Initialize crop area in the center of the image
    const cropSize = Math.min(width, height) * 0.6;
    setCropArea({
      x: x + (width - cropSize) / 2,
      y: y + (height - cropSize) / 2,
      width: cropSize,
      height: cropSize
    });
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
    // Delay to ensure DOM is updated
    setTimeout(calculateImagePosition, 50);
  }, [calculateImagePosition]);

  const handleImageError = () => {
    setImageLoaded(false);
    setImageError(true);
  };

  // Constrain crop area to image bounds
  const constrainCropArea = (newCropArea: CropArea): CropArea => {
    const minX = imageRect.x;
    const minY = imageRect.y;
    const maxX = imageRect.x + imageRect.width;
    const maxY = imageRect.y + imageRect.height;

    let { x, y, width, height } = newCropArea;

    // Ensure crop area doesn't go outside image bounds
    x = Math.max(minX, Math.min(x, maxX - width));
    y = Math.max(minY, Math.min(y, maxY - height));
    
    // Ensure crop area doesn't exceed image bounds
    if (x + width > maxX) {
      width = maxX - x;
    }
    if (y + height > maxY) {
      height = maxY - y;
    }

    // Minimum size
    width = Math.max(50, width);
    height = Math.max(50, height);

    return { x, y, width, height };
  };

  // Mouse handlers for crop area
  const handleCropMouseDown = (e: React.MouseEvent, action: 'move' | 'resize', handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (action === 'move') {
    setIsDragging(true);
      setDragStart({ 
        x: e.clientX - cropArea.x, 
        y: e.clientY - cropArea.y 
      });
    } else if (action === 'resize') {
      setIsResizing(true);
      setResizeHandle(handle || '');
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
      const newCropArea = constrainCropArea({
        ...cropArea,
        x: newX,
        y: newY
      });
      
      setCropArea(newCropArea);
    } else if (isResizing) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      let newCropArea = { ...cropArea };
      
      if (resizeHandle.includes('right')) {
        newCropArea.width += deltaX;
      }
      if (resizeHandle.includes('left')) {
        newCropArea.x += deltaX;
        newCropArea.width -= deltaX;
      }
      if (resizeHandle.includes('bottom')) {
        newCropArea.height += deltaY;
      }
      if (resizeHandle.includes('top')) {
        newCropArea.y += deltaY;
        newCropArea.height -= deltaY;
      }
      
      // Keep square aspect ratio
      const size = Math.min(newCropArea.width, newCropArea.height);
      newCropArea.width = size;
      newCropArea.height = size;
      
      setCropArea(constrainCropArea(newCropArea));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  };

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

    // Calculate scale factor between displayed image and natural size
    const scaleX = image.naturalWidth / image.offsetWidth;
    const scaleY = image.naturalHeight / image.offsetHeight;

    // Calculate crop coordinates in natural image size
    const cropX = (cropArea.x - imageRect.x) * scaleX;
    const cropY = (cropArea.y - imageRect.y) * scaleY;
    const cropWidth = cropArea.width * scaleX;
    const cropHeight = cropArea.height * scaleY;
    
    // Draw cropped image
    ctx.drawImage(
      image, 
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      size,
      size
    );

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
  }, [cropArea, imageRect, imageLoaded, onCropComplete]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto brand-radius">
        <DialogHeader>
          <DialogTitle className="text-foreground">Ajustar Foto de Perfil</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Selecione a área da imagem que será sua foto de perfil. Arraste e redimensione o quadrado para ajustar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-6">
          {/* Image Container */}
          <div 
            ref={containerRef}
            className="relative w-full h-[500px] bg-background brand-radius overflow-hidden flex items-center justify-center border border-border"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
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
                  <p className="text-sm text-destructive mb-2">Erro ao carregar a imagem</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="field-secondary-focus no-ring-focus"
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            )}

            {imageUrl && (
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Preview"
                className="max-w-full max-h-full object-contain select-none"
                    style={{
                      userSelect: 'none',
                      pointerEvents: 'none'
                    }}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
            )}

                {/* Crop area overlay */}
            {imageLoaded && (
                <div
                className="absolute border-2 border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 cursor-move brand-radius"
                  style={{
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.width,
                  height: cropArea.height,
                  minWidth: 50,
                  minHeight: 50
                }}
                onMouseDown={(e) => handleCropMouseDown(e, 'move')}
              >
                {/* Resize handles */}
                <div
                  className="absolute w-3 h-3 bg-[var(--brand-primary)] border border-background -top-1 -left-1 cursor-nw-resize brand-radius"
                  onMouseDown={(e) => handleCropMouseDown(e, 'resize', 'top-left')}
                />
                <div
                  className="absolute w-3 h-3 bg-[var(--brand-primary)] border border-background -top-1 -right-1 cursor-ne-resize brand-radius"
                  onMouseDown={(e) => handleCropMouseDown(e, 'resize', 'top-right')}
                />
                <div
                  className="absolute w-3 h-3 bg-[var(--brand-primary)] border border-background -bottom-1 -left-1 cursor-sw-resize brand-radius"
                  onMouseDown={(e) => handleCropMouseDown(e, 'resize', 'bottom-left')}
                />
                <div
                  className="absolute w-3 h-3 bg-[var(--brand-primary)] border border-background -bottom-1 -right-1 cursor-se-resize brand-radius"
                  onMouseDown={(e) => handleCropMouseDown(e, 'resize', 'bottom-right')}
                />
                
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Move className="w-6 h-6 text-[var(--brand-primary)] drop-shadow-sm" />
                </div>
              </div>
            )}
              </div>

              {/* Instructions */}
          {imageLoaded && (
            <div className="text-sm text-muted-foreground text-center p-4 bg-muted/30 brand-radius">
              Arraste o quadrado para mover a área de seleção. Use os pontos nas bordas para redimensionar.
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="field-secondary-focus no-ring-focus hover:bg-[var(--brand-secondary)] hover:text-[var(--brand-secondary-foreground)]"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCropAndSave}
            disabled={!imageLoaded}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-[var(--brand-primary-foreground)]"
          >
            <Download className="w-4 h-4 mr-2" />
            Salvar Foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 
