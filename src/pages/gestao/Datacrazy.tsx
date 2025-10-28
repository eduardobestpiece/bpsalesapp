import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/AccessDenied';

export const Datacrazy = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const permissions = usePermissions();

  // Verificar se o usuário tem acesso à gestão
  if (!permissions.canAccessGestao) {
    return <AccessDenied />;
  }

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    // Forçar reload do iframe
    const iframe = document.getElementById('datacrazy-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const handleOpenExternal = () => {
    window.open('https://crm.datacrazy.io/pipelines', '_blank');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Detectar tecla ESC para sair do fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <Card className={`flex-1 flex flex-col ${isFullscreen ? 'rounded-none border-0' : ''}`}>
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Datacrazy CRM
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                title="Atualizar"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenExternal}
                title="Abrir em nova aba"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Sair do modo tela cheia' : 'Modo tela cheia'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="text-sm text-muted-foreground">Carregando Datacrazy...</span>
              </div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="text-destructive">
                  <ExternalLink className="h-12 w-12" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Erro ao carregar Datacrazy</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Não foi possível carregar o Datacrazy. Verifique sua conexão ou tente novamente.
                  </p>
                </div>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}

          <iframe
            id="datacrazy-iframe"
            src="https://crm.datacrazy.io/pipelines"
            className="w-full h-full border-0"
            title="Datacrazy CRM"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            allow="fullscreen"
          />
        </CardContent>
      </Card>
    </div>
  );
};
