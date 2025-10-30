import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Plus, RotateCcw } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/AccessDenied';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

export const Datacrazy = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUrl, setCurrentUrl] = useState('https://crm.datacrazy.io/login');
  const permissions = usePermissions();
  const navigate = useNavigate();
  const { selectedCompanyId } = useCompany();
  const { userRole } = useCrmAuth();
  const isCollaborator = userRole === 'user';
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [iframeCode, setIframeCode] = useState<string>('');
  const [isFormConfigured, setIsFormConfigured] = useState(false);
  const [showFormSelector, setShowFormSelector] = useState(false);

  // URLs alternativas para tentar
  const alternativeUrls = [
    'https://crm.datacrazy.io/login',
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

  const handleGoBack = () => {
    navigate('/gestao/leads');
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

  // Buscar formulários ativos da empresa
  const { data: companyForms = [] } = useQuery<any[]>({
    queryKey: ['company-forms', selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('lead_forms')
        .select('id, name, status, is_base_form')
        .eq('company_id', selectedCompanyId)
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar configuração de formulário padrão da empresa
  const { data: companyFormSettings } = useQuery<any>({
    queryKey: ['company-form-settings', selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('company_form_settings')
        .select('default_lead_form_id')
        .eq('company_id', selectedCompanyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  // Gerar iframe ao selecionar formulário
  const handleFormSelect = (formId: string) => {
    setSelectedFormId(formId);
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const baseUrl = window.location.origin;
    const iframeUrl = `${baseUrl}/form/${formId}?v=${timestamp}&r=${randomId}`;
    const code = `<iframe 
  src="${iframeUrl}" 
  width="100%" 
  height="auto" 
  frameborder="0" 
  style="border: none; border-radius: 8px; box-shadow: none; background-color: transparent; padding: 20px; min-height: 400px;"
  title="Formulário de Contato"
  id="form-iframe">
</iframe>

<script>
function resizeIframe(height) {
  const iframe = document.getElementById('form-iframe');
  if (iframe) {
    const minHeight = 400;
    const finalHeight = Math.max(minHeight, height);
    iframe.style.height = finalHeight + 'px';
    iframe.style.minHeight = finalHeight + 'px';
    iframe.style.maxHeight = finalHeight + 'px';
  }
}

window.addEventListener('message', function(event) {
  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if (data && data.type === 'FORM_HEIGHT') {
      resizeIframe(data.height);
    }
  } catch (e) {}
});

function observeIframeContent() {
  try {
    const iframe = document.getElementById('form-iframe');
    if (!iframe || !iframe.contentWindow) return;
    const target = iframe.contentWindow.document.body;
    if (!target) return;
    const observer = new MutationObserver(() => {
      const height = target.scrollHeight || target.offsetHeight || 0;
      resizeIframe(height);
    });
    observer.observe(target, { childList: true, subtree: true, attributes: true, characterData: true });
  } catch (e) {
    console.log('Observador de mudanças não disponível devido a CORS');
  }
}

setTimeout(observeIframeContent, 500);
</script>`;
    setIframeCode(code);
  };

  const handleSaveIframe = async () => {
    if (!selectedFormId || !selectedCompanyId) return;
    const { error } = await (supabase as any)
      .from('company_form_settings')
      .upsert({
        company_id: selectedCompanyId,
        default_lead_form_id: selectedFormId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'company_id' });
    if (error) return;
    queryClient.invalidateQueries({ queryKey: ['company-form-settings', selectedCompanyId] });
    setIsFormConfigured(true);
    setShowFormSelector(false);
  };

  const handleChangeForm = () => {
    setShowFormSelector(true);
    setIsFormConfigured(false);
    setIframeCode('');
    setSelectedFormId('');
  };

  // Carregar formulário salvo ao abrir
  useEffect(() => {
    if (companyFormSettings?.default_lead_form_id && companyForms.length > 0) {
      const savedFormId = companyFormSettings.default_lead_form_id;
      const exists = companyForms.find((f: any) => f.id === savedFormId);
      if (exists) {
        setSelectedFormId(savedFormId);
        handleFormSelect(savedFormId);
        setIsFormConfigured(true);
        setShowFormSelector(false);
      }
    }
  }, [companyFormSettings, companyForms]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col h-full">
      <Card className="flex-1 flex flex-col rounded-none border-0">
        <CardHeader className="flex-shrink-0 py-2 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                title="Voltar para Leads"
                className="p-1.5 h-7 w-7"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
                Datacrazy CRM
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                title="Atualizar"
                className="h-7 px-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Dialog open={openModal} onOpenChange={setOpenModal}>
                <DialogTrigger asChild>
                  <Button size="sm" className="brand-radius h-7 px-2" onClick={() => setOpenModal(true)} title="Adicionar Lead">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Lead</span>
                  </Button>
                </DialogTrigger>
              </Dialog>
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
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
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

      {/* Modal de Adição de Leads - cópia do LeadsNew */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Lead</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-0">
            {!isFormConfigured ? (
              <div className="space-y-4">
                {!isCollaborator && (
                <div>
                  <Label htmlFor="form-select">Selecionar Formulário</Label>
                  <Select value={selectedFormId} onValueChange={handleFormSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um formulário" />
                    </SelectTrigger>
                    <SelectContent>
                      {companyForms.filter((form: any) => form.is_base_form === true).map((form: any) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.name}
                        </SelectItem>
                      ))}
                      {companyForms.filter((form: any) => form.is_base_form === true).length === 0 && (
                        <div className="p-2 text-center">
                          <p className="text-sm text-muted-foreground mb-2">Nenhum formulário base encontrado</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setOpenModal(false);
                              navigate('/configuracoes/formularios?tab=leads');
                            }}
                            className="w-full"
                          >
                            Criar Formulário Base
                          </Button>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                )}

                {isCollaborator && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Formulário de cadastro de leads
                    </p>
                  </div>
                )}

                {selectedFormId && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="iframe-code">Código do Iframe</Label>
                      <Textarea
                        id="iframe-code"
                        value={iframeCode}
                        onChange={(e) => setIframeCode(e.target.value)}
                        placeholder="O código do iframe será gerado automaticamente..."
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </div>
                    <Button onClick={handleSaveIframe} className="w-full">Salvar</Button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div dangerouslySetInnerHTML={{ __html: iframeCode }} />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {isFormConfigured && (
              <Button variant="outline" onClick={handleChangeForm}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Trocar formulário
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpenModal(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
