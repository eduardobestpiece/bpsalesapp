import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AppointmentIframeGeneratorProps {
  formId?: string;
}

export default function AppointmentIframeGenerator({ formId }: AppointmentIframeGeneratorProps) {
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
        .from('appointment_forms')
        .select('*')
        .eq('id', formId)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Erro ao carregar formulário de agendamento:', error);
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
    const formUrl = `${baseUrl}/appointment/${form.id}`;
    
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Formulário de agendamento não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gerador de Iframe - {formData.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="iframe-code">Código do Iframe</Label>
            <Textarea
              id="iframe-code"
              value={iframeCode}
              readOnly
              className="mt-1 font-mono text-sm"
              rows={20}
            />
          </div>
          
          <Button onClick={copyToClipboard} className="w-full">
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Código
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview do Formulário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-gray-50">
            <iframe
              src={`${window.location.origin}/appointment/${formData.id}`}
              width="100%"
              height="600"
              frameBorder="0"
              style={{ border: 'none', borderRadius: '8px' }}
              title="Preview do Formulário de Agendamento"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Formulário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Nome:</span>
              <p className="text-gray-600">{formData.name}</p>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <p className="text-gray-600 capitalize">{formData.status}</p>
            </div>
            <div>
              <span className="font-medium">Webhook:</span>
              <p className="text-gray-600">{formData.webhook_enabled ? 'Ativado' : 'Desativado'}</p>
            </div>
            <div>
              <span className="font-medium">URL do Formulário:</span>
              <p className="text-gray-600 break-all">{`${window.location.origin}/appointment/${formData.id}`}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
