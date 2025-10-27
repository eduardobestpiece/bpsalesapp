import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface IframeGeneratorProps {
  formId?: string;
}

export default function IframeGenerator({ formId }: IframeGeneratorProps) {
  const [formData, setFormData] = useState<any>(null);
  const [iframeCode, setIframeCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (formId) {
      loadFormData();
    }
  }, [formId]);

  const loadFormData = async () => {
    try {
      const { data: form, error } = await supabase
        .from('lead_forms')
        .select('*')
        .eq('id', formId)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Erro ao carregar formulário:', error);
        return;
      }

      setFormData(form);
      generateIframeCode(form);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateIframeCode = (form: any) => {
    const baseUrl = window.location.origin;
    const formUrl = `${baseUrl}/form/${form.id}`;
    
    const iframeCode = `<iframe 
  src="${formUrl}" 
  width="100%" 
  height="600" 
  frameborder="0" 
  scrolling="no"
  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
  onload="
    // Script para capturar dados da página pai e enviar para o iframe
    (function() {
      try {
        // Capturar dados da página pai
        const parentData = {
          parentUrl: window.location.href,
          parentUrlParams: Object.fromEntries(new URLSearchParams(window.location.search)),
          utmSource: new URLSearchParams(window.location.search).get('utm_source') || '',
          utmMedium: new URLSearchParams(window.location.search).get('utm_medium') || '',
          utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign') || '',
          utmContent: new URLSearchParams(window.location.search).get('utm_content') || '',
          utmTerm: new URLSearchParams(window.location.search).get('utm_term') || '',
          gclid: new URLSearchParams(window.location.search).get('gclid') || '',
          fbclid: new URLSearchParams(window.location.search).get('fbclid') || '',
          fbc: document.cookie.split('; ').find(row => row.startsWith('_fbc='))?.split('=')[1] || '',
          fbp: document.cookie.split('; ').find(row => row.startsWith('_fbp='))?.split('=')[1] || '',
          fbid: document.cookie.split('; ').find(row => row.startsWith('_fbid='))?.split('=')[1] || ''
        };

        // Enviar dados para o iframe
        const iframe = this;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'PARENT_TRACKING_DATA',
            data: parentData
          }, '*');
        }
      } catch (error) {
        // Erro silencioso - não afeta a funcionalidade
      }
    })();
  "
  onresize="
    // Script para redimensionamento automático do iframe
    (function() {
      try {
        const iframe = this;
        if (iframe && iframe.contentWindow) {
          // Solicitar altura atual do iframe
          iframe.contentWindow.postMessage({ type: 'GET_HEIGHT' }, '*');
        }
      } catch (error) {
        // Erro silencioso
      }
    })();
  "
></iframe>

<script>
  // Script para comunicação com o iframe
  window.addEventListener('message', function(event) {
    try {
      if (event.data.type === 'RESIZE') {
        const iframe = document.querySelector('iframe[src*="${formUrl}"]');
        if (iframe) {
          iframe.style.height = event.data.height + 'px';
        }
      }
    } catch (error) {
      // Erro silencioso
    }
  });
</script>`;

    setIframeCode(iframeCode);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Formulário não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerador de Iframe</CardTitle>
          <p className="text-sm text-gray-600">
            Gere o código iframe para incorporar o formulário "{formData.name}" em seu site.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="iframe-code">Código do Iframe</Label>
            <div className="relative">
              <Textarea
                id="iframe-code"
                value={iframeCode}
                readOnly
                className="min-h-[400px] font-mono text-sm"
                placeholder="Código do iframe será gerado aqui..."
              />
              <Button
                onClick={copyToClipboard}
                size="sm"
                className="absolute top-2 right-2"
                variant="outline"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Como usar:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Copie o código iframe acima</li>
              <li>Cole o código no HTML da sua página</li>
              <li>O iframe capturará automaticamente os UTMs e dados de tracking da página pai</li>
              <li>O iframe se redimensionará automaticamente conforme o conteúdo</li>
            </ol>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Recursos incluídos:</h3>
            <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
              <li>Captura automática de UTMs da página pai</li>
              <li>Captura de cookies do Facebook (fbc, fbp, fbid)</li>
              <li>Captura de gclid do Google Ads</li>
              <li>Redimensionamento automático do iframe</li>
              <li>Design responsivo e moderno</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}