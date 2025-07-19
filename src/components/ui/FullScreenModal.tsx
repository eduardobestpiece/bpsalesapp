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

  React.useEffect(() => {
    if (isOpen) {
      // Bloquear scroll do body
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Evitar shift de layout
      // Pequeno delay para garantir que o DOM seja renderizado antes da animação
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
      // Restaurar scroll do body após animação
      setTimeout(() => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }, 300);
    }

    // Cleanup - restaurar scroll se componente for desmontado
    return () => {
      if (isOpen) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    };
  }, [isOpen]);

  // Fechar com ESC
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Portal-like behavior - render at root level */}
      <div 
        className={cn(
          "fixed inset-0 z-[99999] transition-all duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999
        }}
      >
        {/* Overlay - Escurecimento da tela */}
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
        />
        
        {/* Modal Container - Slide from right */}
        <div 
          className={cn(
            "absolute inset-0 flex justify-end transition-transform duration-300 ease-out",
            isVisible ? "translate-x-0" : "translate-x-full"
          )}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <div 
            className={cn(
              "w-full h-full bg-white dark:bg-[#1E1E1E] shadow-2xl flex flex-col",
              className
            )}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header - Fixo no topo */}
            <div 
              className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#A86F57]/20 bg-white dark:bg-[#1F1F1F] shadow-sm"
              style={{
                flexShrink: 0,
                minHeight: '60px',
                borderBottom: '1px solid',
                borderBottomColor: 'var(--border)'
              }}
            >
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-1 h-8 w-8 hover:bg-gray-100 dark:hover:bg-[#161616] rounded-md"
                >
                  <X size={16} className="text-gray-500 dark:text-gray-300" />
                </Button>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h2>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                {actions}
              </div>
            </div>
            
            {/* Content - Área scrollável */}
            <div 
              className="flex-1 bg-gray-50 dark:bg-[#131313] p-6"
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden'
              }}
            >
              <div className="max-w-4xl mx-auto">
                {children}
              </div>
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