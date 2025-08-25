import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft } from 'lucide-react';

interface AccessDeniedProps {
  moduleName?: string;
  action?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ 
  moduleName = 'este módulo', 
  action = 'acessar' 
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-6">
          <ShieldX className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Acesso Negado
          </h1>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para {action} {moduleName}.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Entre em contato com o administrador do sistema se acredita que isso é um erro.
          </p>
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/simulador')}
            className="w-full"
            variant="default"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Simulador
          </Button>
          
          <Button 
            onClick={() => navigate('/configuracoes/gestao')}
            className="w-full"
            variant="outline"
          >
            Ir para Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}; 