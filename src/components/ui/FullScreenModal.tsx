import React from 'react';
import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const FullScreenModal: React.FC<FullScreenModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  className
}) => {
  // Controlar animação de entrada/saída
  const [isVisible, setIsVisible] = React.useState(false);
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Pequeno delay para garantir que o DOM seja renderizado antes da animação
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      // Aguardar animação terminar antes de remover do DOM
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-50 transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      
      {/* Modal Container - Slide from right */}
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className={cn(
          "w-full h-full bg-background dark:bg-[#1E1E1E] shadow-2xl",
          "flex flex-col overflow-hidden",
          "transition-transform duration-300 ease-out",
          isVisible ? "translate-x-0" : "translate-x-full",
          className
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border dark:border-[#A86F57]/20 bg-card dark:bg-[#1F1F1F] shadow-sm min-h-[60px]">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1 h-8 w-8 hover:bg-muted dark:hover:bg-[#161616] rounded-md"
              >
                <X size={16} className="text-muted-foreground dark:text-gray-300" />
              </Button>
              <h2 className="text-lg font-semibold text-foreground dark:text-white">
                {title}
              </h2>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              {actions}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-background dark:bg-[#131313] p-6">
            <div className="max-w-4xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
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