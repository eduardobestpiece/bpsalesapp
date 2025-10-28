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
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUrl, setCurrentUrl] = useState('https://datacrazy.io/');
  const permissions = usePermissions();

  // URLs alternativas para tentar
  const alternativeUrls = [
    'https://datacrazy.io/',
    'https://crm.datacrazy.io/',
    'https://app.datacrazy.io/',
    'https://datacrazy.io/pipelines',
    'https://crm.datacrazy.io/pipelines',
    'https://app.datacrazy.io/pipelines'
  ];

  // Verificar se o usuário tem acesso à gestão
  if (!permissions.canAccessGestao) {
    return <AccessDenied />;
  }

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
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
    setErrorMessage('');
  };

  const handleIframeError = () => {
    const currentIndex = alternativeUrls.indexOf(currentUrl);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < alternativeUrls.length) {
      // Tentar próxima URL
      setCurrentUrl(alternativeUrls[nextIndex]);
      setIsLoading(true);
      setHasError(false);
      setErrorMessage('');
    } else {
      // Todas as URLs falharam
      setIsLoading(false);
      setHasError(true);
      setErrorMessage('Não foi possível carregar o Datacrazy. Todas as URLs alternativas foram testadas sem sucesso.');
    }
  };

  // Timeout para detectar se o iframe não carrega
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        if (isLoading) {
          handleIframeError();
        }
      }, 10000); // 10 segundos de timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading, currentUrl]);

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
                <span className="text-xs text-muted-foreground">Testando: {currentUrl}</span>
              </div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="flex flex-col items-center gap-4 text-center max-w-md mx-auto p-6">
                <div className="text-destructive">
                  <ExternalLink className="h-12 w-12" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Erro ao carregar Datacrazy</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {errorMessage || 'Não foi possível carregar o Datacrazy. Verifique sua conexão ou tente novamente.'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    URL testada: {currentUrl}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar novamente
                  </Button>
                  <Button onClick={handleOpenExternal} variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir externamente
                  </Button>
                </div>
              </div>
            </div>
          )}

          <iframe
            id="datacrazy-iframe"
            src={currentUrl}
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
