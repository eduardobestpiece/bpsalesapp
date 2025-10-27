import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Crop as CropIcon, X } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  imageFile: File | null;
  isUploading?: boolean;
}

// Função para redimensionar canvas
function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
  scale = 1,
  rotate = 0,
) {
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const rotateRads = rotate * (Math.PI / 180);
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();

  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotateRads);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
  );

  ctx.restore();
}

export function AvatarCropModal({ 
  isOpen, 
  onClose, 
  onCropComplete, 
  imageFile, 
  isUploading = false 
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imgSrc, setImgSrc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Configuração do crop inicial (quadrado)
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      1, // Aspect ratio 1:1 (quadrado)
      width,
      height,
    );
    setCrop(centerCrop(crop, width, height));
  }, []);

  // Processar o crop e criar arquivo
  const handleCropComplete = async () => {
    if (!imgRef.current || !previewCanvasRef.current || !completedCrop) {
      return;
    }

    setIsProcessing(true);

    try {
      const canvas = previewCanvasRef.current;
      const image = imgRef.current;

      canvasPreview(image, canvas, completedCrop);

      // Converter canvas para blob
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], imageFile?.name || 'avatar.png', {
            type: 'image/png',
          });
          onCropComplete(croppedFile);
        }
      }, 'image/png', 0.9);

    } catch (error) {
      console.error('Erro ao processar crop:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Carregar imagem quando o modal abrir
  React.useEffect(() => {
    if (imageFile && isOpen) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
      });
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile, isOpen]);

  // Limpar estado quando fechar
  React.useEffect(() => {
    if (!isOpen) {
      setImgSrc('');
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="h-5 w-5" />
            Ajustar Foto do Avatar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Arraste para selecionar a área da foto que deseja usar como avatar. 
            A área selecionada será cortada em formato quadrado.
          </div>

          <div className="flex justify-center">
            <div className="relative max-w-md w-full">
              {imgSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1} // Forçar formato quadrado
                  minWidth={100}
                  minHeight={100}
                  className="max-h-96"
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    style={{ maxHeight: '400px', width: 'auto' }}
                    onLoad={onImageLoad}
                    className="rounded-lg"
                  />
                </ReactCrop>
              )}
            </div>
          </div>

          {/* Canvas oculto para processamento */}
          <canvas
            ref={previewCanvasRef}
            style={{
              display: 'none',
            }}
          />
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing || isUploading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleCropComplete}
            disabled={!completedCrop || isProcessing || isUploading}
            className="bg-primary hover:bg-primary/90"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CropIcon className="h-4 w-4 mr-2" />
            )}
            {isProcessing ? 'Processando...' : 'Aplicar Crop'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
