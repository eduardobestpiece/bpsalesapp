import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './button';

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  hasChanges?: boolean; // Para controlar se pode fechar ao clicar fora
}

export const FullScreenModal: React.FC<FullScreenModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  hasChanges = false
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Bloquear scroll do body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsAnimating(true);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleClose = () => {
    if (hasChanges) {
      // Se há mudanças, não fecha automaticamente
      return;
    }
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Tempo da animação
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      {/* Modal container com animação slide-in/slide-out */}
      <div 
        className={`fixed right-0 top-0 h-full w-full md:w-[70%] lg:w-[70%] xl:w-[70%] 2xl:w-[70%] max-w-[95%] bg-[#131313] shadow-2xl transform transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ zIndex: 100000 }}
      >
        {/* Header fixo */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#131313] border-b border-gray-700 px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>

        {/* Conteúdo scrollável do modal */}
        <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-[#131313]">
          <div className="p-0 flex justify-center">
            <div className="bg-[#131313] rounded-lg p-0 my-6 w-full md:w-[70%] lg:w-[70%] xl:w-[70%] 2xl:w-[70%] max-w-[95%] min-w-[70%] sm:w-[95%]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Hook para controlar o modal
export const useFullScreenModal = (initialState = false) => {
  const [isOpen, setIsOpen] = React.useState(initialState);
  
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const toggleModal = () => setIsOpen(!isOpen);
  
  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  };
};