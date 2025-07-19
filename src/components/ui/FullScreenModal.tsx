import React from 'react';
import { createPortal } from 'react-dom';
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

  // Usar Portal para renderizar diretamente no body
  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        transition: 'opacity 300ms ease-out',
        opacity: isVisible ? 1 : 0
      }}
    >
      {/* Overlay - Escurecimento da tela */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          cursor: 'pointer'
        }}
      />
      
      {/* Modal Container - Slide from right */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'flex-end',
          transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-out'
        }}
      >
        <div 
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column'
          }}
          className="dark:bg-[#1E1E1E]"
        >
          {/* Header - Fixo no topo */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: 'white',
              minHeight: '60px',
              flexShrink: 0
            }}
            className="dark:bg-[#1F1F1F] dark:border-[#A86F57]/20"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                style={{
                  padding: '4px',
                  height: '32px',
                  width: '32px',
                  borderRadius: '6px'
                }}
                className="hover:bg-gray-100 dark:hover:bg-[#161616]"
              >
                <X size={16} className="text-gray-500 dark:text-gray-300" />
              </Button>
              <h2 
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}
                className="dark:text-white"
              >
                {title}
              </h2>
            </div>
            
            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {actions}
            </div>
          </div>
          
          {/* Content - Área scrollável */}
          <div 
            style={{
              flex: 1,
              backgroundColor: '#f9fafb',
              padding: '24px',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
            className="dark:bg-[#131313]"
          >
            <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
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