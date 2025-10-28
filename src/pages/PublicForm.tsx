import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Cache para dados estáticos (5 minutos)
const CACHE_DURATION = 5 * 60 * 1000;
const staticCache = new Map();

// Função para cache com verificação de expiração
const getCachedData = (key: string) => {
  const cached = staticCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  staticCache.set(key, {
    data,
    timestamp: Date.now()
  });
};
import { LandingPhoneInput } from '@/components/ui/LandingPhoneInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { integrationService } from '@/services/integrationService';
import { distributeLead } from '@/utils/leadDistribution';

// Funções de validação
const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;
  
  return true;
};

const validateCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/\D/g, '');
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  
  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cnpj.charAt(12))) return false;
  
  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cnpj.charAt(13))) return false;
  
  return true;
};

interface FormField {
  id: string;
  name: string;
  type: string;
  is_required: boolean;
  placeholder_text?: string;
  placeholder_enabled: boolean;
  field_order: number;
  is_division: boolean;
  division_step?: number;
  division_button_text?: string;
  options?: string;
  disqualify_enabled: boolean;
  disqualify_min?: number;
  disqualify_max?: number;
  disqualify_selected_option?: string;
}

interface FormData {
  id: string;
  name: string;
  button_text: string;
  style_config: any;
  company_id: string;
}

interface PublicFormProps {
  overrideFormId?: string;
  embedded?: boolean;
  onSubmitted?: (leadId: string) => void;
}

export default function PublicForm(props?: PublicFormProps) {
  const route = useParams<{ formId: string }>();
  const formId = props?.overrideFormId || route.formId;
  const [formData, setFormData] = useState<FormData | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [companyCurrency, setCompanyCurrency] = useState<string>('BRL');
  const [companyTimezone, setCompanyTimezone] = useState<string>('America/Sao_Paulo');
  const [selectSpacerHeight, setSelectSpacerHeight] = useState<number>(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastResizeTime, setLastResizeTime] = useState<number>(0);
  
  // Função para formatar data com fuso horário da empresa
  const formatDateTimeWithTimezone = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const parts = new Intl.DateTimeFormat('pt-BR', {
        timeZone: companyTimezone,
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit'
      }).formatToParts(date);
      
      const get = (type: string) => parts.find(p => p.type === type)?.value || '';
      return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')}`;
    } catch (error) {
      return isoString; // Fallback para a string original em caso de erro
    }
  };
  
  // Função para redimensionar o iframe automaticamente
  const resizeIframe = useCallback(() => {
    try {
      if (window.parent && window.parent !== window) {
        // Evitar redimensionamentos muito frequentes
        const now = Date.now();
        const minInterval = selectSpacerHeight > 0 ? 2000 : 1000; // Mais tempo quando dropdown está aberto
        if (now - lastResizeTime < minInterval) {
          return;
        }
        
        setLastResizeTime(now);
        
        // Aguardar um frame para garantir que o DOM foi atualizado
        requestAnimationFrame(() => {
          // Encontrar o container principal do formulário
          const formContainer = document.querySelector('.bp-form-root, form, [class*="form"]');
          // Encontrar a mensagem de segurança no final
          const securityMessage = document.querySelector('.text-gray-500, [class*="text-gray"], [class*="seguro"], [class*="protegido"]');
          // Encontrar o botão "Próxima" ou último botão
          const lastButton = document.querySelector('button[type="submit"], button:last-of-type, [class*="button"]:last-of-type');
          
          let calculatedHeight = 300; // Altura mínima
          
          // Prioridade 1: Usar o container do formulário
          if (formContainer) {
            const containerRect = formContainer.getBoundingClientRect();
            // Se o dropdown está aberto, usar altura fixa mais estável
            if (selectSpacerHeight > 0) {
              calculatedHeight = Math.max(300, Math.ceil(containerRect.height + 200));
            } else {
              calculatedHeight = Math.max(300, Math.ceil(containerRect.height + 50));
            }
          }
          // Prioridade 2: Usar a mensagem de segurança
          else if (securityMessage) {
            const securityRect = securityMessage.getBoundingClientRect();
            calculatedHeight = Math.max(300, Math.ceil(securityRect.bottom + 30));
          }
          // Prioridade 3: Usar o último botão
          else if (lastButton) {
            const buttonRect = lastButton.getBoundingClientRect();
            calculatedHeight = Math.max(300, Math.ceil(buttonRect.bottom + 40));
          }
          // Fallback: usar altura do body com margem maior
          else {
            calculatedHeight = Math.max(300, document.body.scrollHeight + 80);
          }
          
          // Usar altura calculada diretamente (já inclui espaçador quando necessário)
          const finalHeight = calculatedHeight;
          
          // Evitar redimensionamentos desnecessários
          const lastHeight = (window as any).lastIframeHeight || 0;
          const heightDifference = Math.abs(finalHeight - lastHeight);
          
          if (heightDifference < 10 && lastHeight > 0) {
            return;
          }
          
          (window as any).lastIframeHeight = finalHeight;
          
          window.parent.postMessage({ type: 'resize', height: finalHeight }, '*');
        });
      }
    } catch (e) {
      console.error('Erro ao redimensionar iframe:', e);
    }
  }, [selectSpacerHeight, lastResizeTime]);
  
  // Monitorar mudanças no conteúdo e redimensionar automaticamente
  useEffect(() => {
    // Redimensionar imediatamente quando o componente carrega
    const timer1 = setTimeout(() => {
      resizeIframe();
    }, 100);
    
    const timer2 = setTimeout(() => {
      resizeIframe();
    }, 500);
    
    // Redimensionar quando a janela muda de tamanho
    const handleResize = () => {
      setTimeout(() => resizeIframe(), 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Redimensionar quando imagens carregam
    const handleImageLoad = () => {
      setTimeout(() => resizeIframe(), 100);
    };
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('load', handleImageLoad);
    };
  }, []); // Removido resizeIframe da dependência para evitar loop infinito
  
  // Redimensionar quando o formulário é renderizado completamente
  useEffect(() => {
    if (!loading && formData && formFields.length > 0) {
      setTimeout(() => resizeIframe(), 300);
    }
  }, [loading, formData, formFields]); // Removido resizeIframe da dependência
  
  // Estados para controle de etapas
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(1);
  
  // Estados para dados de tracking da página pai
  const [parentTrackingData, setParentTrackingData] = useState<{
    url?: string;
    cookies?: Record<string, string>;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    gclid?: string;
    fbclid?: string;
    fbc?: string;
    fbp?: string;
    fbid?: string;
    referrer?: string;
    userAgent?: string;
    timestamp?: string;
  }>({});
  
  // Controle para evitar execuções repetidas
  const [trackingInitialized, setTrackingInitialized] = useState(false);
  
  // Sistema avançado de captura de dados da página pai
  useEffect(() => {
    
    const handleParentMessage = (event: MessageEvent) => {
      
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'PARENT_TRACKING_DATA') {
          setParentTrackingData(event.data.data);
          setTrackingInitialized(true);
        }
      }
    };
    
    // Escutar mensagens da página pai
    window.addEventListener('message', handleParentMessage);
    
    // Estratégia 1: Solicitar dados via postMessage
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'REQUEST_TRACKING_DATA' }, '*');
    }
    
    // Estratégia 2: Tentar capturar via document.referrer (mais confiável)
    const captureFromReferrer = () => {
      if (document.referrer && document.referrer !== window.location.href) {
        try {
          const referrerUrl = new URL(document.referrer);
          const referrerParams = new URLSearchParams(referrerUrl.search);
          
          
          const referrerData = {
            parentUrl: document.referrer,
            utmSource: referrerParams.get('utm_source') || '',
            utmMedium: referrerParams.get('utm_medium') || '',
            utmCampaign: referrerParams.get('utm_campaign') || '',
            utmContent: referrerParams.get('utm_content') || '',
            utmTerm: referrerParams.get('utm_term') || '',
            gclid: referrerParams.get('gclid') || '',
            fbclid: referrerParams.get('fbclid') || '',
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          };
          
          console.log('📊 ===== DADOS CAPTURADOS DO REFERRER =====');
          console.log('📊 URL:', referrerData.parentUrl);
          console.log('📊 utm_source:', referrerData.utmSource || 'N/A');
          console.log('📊 utm_medium:', referrerData.utmMedium || 'N/A');
          console.log('📊 utm_campaign:', referrerData.utmCampaign || 'N/A');
          console.log('📊 utm_content:', referrerData.utmContent || 'N/A');
          console.log('📊 utm_term:', referrerData.utmTerm || 'N/A');
          console.log('📊 gclid:', referrerData.gclid || 'N/A');
          console.log('📊 fbclid:', referrerData.fbclid || 'N/A');
          
          setParentTrackingData(referrerData);
          setTrackingInitialized(true);
          
        } catch (e) {
          console.log('⚠️ Erro ao processar document.referrer:', e.message);
        }
      }
    };
    
    // Executar captura do referrer após um pequeno delay
    setTimeout(captureFromReferrer, 100);
    
    // Estratégia 3: Tentar acessar window.parent.location (pode funcionar em alguns casos)
    const tryParentLocation = () => {
      try {
        if (window.parent && window.parent !== window && window.parent.location) {
          console.log('📡 Estratégia 3: Tentando acessar window.parent.location...');
          const parentUrl = window.parent.location.href;
          const parentParams = new URLSearchParams(window.parent.location.search);
          
          const parentData = {
            parentUrl: parentUrl,
            utmSource: parentParams.get('utm_source') || '',
            utmMedium: parentParams.get('utm_medium') || '',
            utmCampaign: parentParams.get('utm_campaign') || '',
            utmContent: parentParams.get('utm_content') || '',
            utmTerm: parentParams.get('utm_term') || '',
            gclid: parentParams.get('gclid') || '',
            fbclid: parentParams.get('fbclid') || '',
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          };
          
          console.log('📊 ===== DADOS CAPTURADOS DO WINDOW.PARENT =====');
          console.log('📊 URL:', parentData.parentUrl);
          console.log('📊 utm_source:', parentData.utmSource || 'N/A');
          console.log('📊 utm_medium:', parentData.utmMedium || 'N/A');
          console.log('📊 utm_campaign:', parentData.utmCampaign || 'N/A');
          console.log('📊 utm_content:', parentData.utmContent || 'N/A');
          console.log('📊 utm_term:', parentData.utmTerm || 'N/A');
          console.log('📊 gclid:', parentData.gclid || 'N/A');
          console.log('📊 fbclid:', parentData.fbclid || 'N/A');
          
          setParentTrackingData(parentData);
          setTrackingInitialized(true);
          
        }
      } catch (e) {
        console.log('⚠️ Estratégia 3 falhou (CORS):', e.message);
      }
    };
    
    // Executar tentativa de acesso ao parent após delay
    setTimeout(tryParentLocation, 200);
    
    return () => {
      window.removeEventListener('message', handleParentMessage);
    };
  }, []);

  // Sistema completo de diagnóstico e captura de UTMs com logs detalhados
  useEffect(() => {
    // Evitar execução repetida se já foi inicializado
    if (trackingInitialized) {
      console.log('⚠️ Sistema de tracking já inicializado, pulando execução');
      return;
    }
    
    console.log('🚀 ===== SISTEMA DE DIAGNÓSTICO DE UTMs INICIADO =====');
    console.log('🚀 Timestamp:', new Date().toISOString());
    
    // Função para obter cookies
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
      return '';
    };

    // Função para capturar todos os dados de tracking com logs detalhados
    const captureAllTrackingData = () => {
      console.log('🔍 ===== CAPTURANDO DADOS DE TRACKING =====');
      
      // 1. LOGS DA URL ATUAL DO IFRAME
      console.log('📍 URL ATUAL DO IFRAME:', window.location.href);
      console.log('📍 URL SEM PARÂMETROS:', window.location.origin + window.location.pathname);
      
      // 2. LOGS DO DOCUMENT.REFERRER
      console.log('📍 DOCUMENT.REFERRER:', document.referrer);
      console.log('📍 REFERRER DIFERENTE DA URL ATUAL:', document.referrer !== window.location.href);
      
      // 3. LOGS DE WINDOW.PARENT
      console.log('📍 WINDOW.PARENT EXISTE:', !!window.parent);
      console.log('📍 WINDOW.PARENT É DIFERENTE DE WINDOW:', window.parent !== window);
      
      try {
        if (window.parent && window.parent !== window) {
          console.log('📍 WINDOW.PARENT.LOCATION EXISTE:', !!window.parent.location);
          if (window.parent.location) {
            console.log('📍 URL DA PÁGINA PAI:', window.parent.location.href);
            console.log('📍 SEARCH DA PÁGINA PAI:', window.parent.location.search);
          }
        }
      } catch (e) {
        console.log('⚠️ ERRO AO ACESSAR WINDOW.PARENT.LOCATION (CORS):', e.message);
      }

      // 4. CAPTURAR PARÂMETROS DA URL ATUAL DO IFRAME
      const currentParams = new URLSearchParams(window.location.search);
      console.log('📊 ===== PARÂMETROS DA URL ATUAL DO IFRAME =====');
      console.log('📊 utm_source:', currentParams.get('utm_source') || 'NÃO ENCONTRADO');
      console.log('📊 utm_medium:', currentParams.get('utm_medium') || 'NÃO ENCONTRADO');
      console.log('📊 utm_campaign:', currentParams.get('utm_campaign') || 'NÃO ENCONTRADO');
      console.log('📊 utm_content:', currentParams.get('utm_content') || 'NÃO ENCONTRADO');
      console.log('📊 utm_term:', currentParams.get('utm_term') || 'NÃO ENCONTRADO');
      console.log('📊 gclid:', currentParams.get('gclid') || 'NÃO ENCONTRADO');
      console.log('📊 fbclid:', currentParams.get('fbclid') || 'NÃO ENCONTRADO');

      // 5. CAPTURAR PARÂMETROS DO DOCUMENT.REFERRER
      if (document.referrer && document.referrer !== window.location.href) {
        try {
          const referrerUrl = new URL(document.referrer);
          const referrerParams = new URLSearchParams(referrerUrl.search);
          console.log('📊 ===== PARÂMETROS DO DOCUMENT.REFERRER =====');
          console.log('📊 utm_source:', referrerParams.get('utm_source') || 'NÃO ENCONTRADO');
          console.log('📊 utm_medium:', referrerParams.get('utm_medium') || 'NÃO ENCONTRADO');
          console.log('📊 utm_campaign:', referrerParams.get('utm_campaign') || 'NÃO ENCONTRADO');
          console.log('📊 utm_content:', referrerParams.get('utm_content') || 'NÃO ENCONTRADO');
          console.log('📊 utm_term:', referrerParams.get('utm_term') || 'NÃO ENCONTRADO');
          console.log('📊 gclid:', referrerParams.get('gclid') || 'NÃO ENCONTRADO');
          console.log('📊 fbclid:', referrerParams.get('fbclid') || 'NÃO ENCONTRADO');
        } catch (e) {
          console.log('⚠️ ERRO AO PARSEAR DOCUMENT.REFERRER:', e.message);
        }
      }

      // 6. CAPTURAR PARÂMETROS DA PÁGINA PAI (se possível)
      try {
        if (window.parent && window.parent !== window && window.parent.location) {
          const parentParams = new URLSearchParams(window.parent.location.search);
          console.log('📊 ===== PARÂMETROS DA PÁGINA PAI =====');
          console.log('📊 utm_source:', parentParams.get('utm_source') || 'NÃO ENCONTRADO');
          console.log('📊 utm_medium:', parentParams.get('utm_medium') || 'NÃO ENCONTRADO');
          console.log('📊 utm_campaign:', parentParams.get('utm_campaign') || 'NÃO ENCONTRADO');
          console.log('📊 utm_content:', parentParams.get('utm_content') || 'NÃO ENCONTRADO');
          console.log('📊 utm_term:', parentParams.get('utm_term') || 'NÃO ENCONTRADO');
          console.log('📊 gclid:', parentParams.get('gclid') || 'NÃO ENCONTRADO');
          console.log('📊 fbclid:', parentParams.get('fbclid') || 'NÃO ENCONTRADO');
        }
      } catch (e) {
        console.log('⚠️ ERRO AO ACESSAR PARÂMETROS DA PÁGINA PAI (CORS):', e.message);
      }

      // 7. LOGS DE COOKIES
      console.log('🍪 ===== COOKIES CAPTURADOS =====');
      console.log('🍪 Todos os cookies:', document.cookie);
      console.log('🍪 _fbc:', getCookie('_fbc') || 'NÃO ENCONTRADO');
      console.log('🍪 _fbp:', getCookie('_fbp') || 'NÃO ENCONTRADO');
      console.log('🍪 _fbid:', getCookie('_fbid') || 'NÃO ENCONTRADO');
      console.log('🍪 _ga:', getCookie('_ga') || 'NÃO ENCONTRADO');
      console.log('🍪 _gid:', getCookie('_gid') || 'NÃO ENCONTRADO');

      // 8. RESUMO DOS DADOS CAPTURADOS
      let finalData = {
        url: window.location.href,
        utmSource: '',
        utmMedium: '',
        utmCampaign: '',
        utmContent: '',
        utmTerm: '',
        gclid: '',
        fbclid: '',
        fbc: '',
        fbp: '',
        fbid: ''
      };

      // Prioridade 1: Usar dados capturados pelas estratégias avançadas
      if (parentTrackingData.utmSource || parentTrackingData.parentUrl) {
        finalData.url = parentTrackingData.parentUrl || '';
        finalData.utmSource = parentTrackingData.utmSource || '';
        finalData.utmMedium = parentTrackingData.utmMedium || '';
        finalData.utmCampaign = parentTrackingData.utmCampaign || '';
        finalData.utmContent = parentTrackingData.utmContent || '';
        finalData.utmTerm = parentTrackingData.utmTerm || '';
        finalData.gclid = parentTrackingData.gclid || '';
        finalData.fbclid = parentTrackingData.fbclid || '';
        finalData.fbc = parentTrackingData.fbc || '';
        finalData.fbp = parentTrackingData.fbp || '';
        finalData.fbid = parentTrackingData.fbid || '';
        console.log('✅ USANDO DADOS CAPTURADOS PELAS ESTRATÉGIAS AVANÇADAS');
      }
      // Prioridade 2: Tentar usar dados da página pai via window.parent.location (fallback)
      else {
        try {
          if (window.parent && window.parent !== window && window.parent.location) {
            const parentParams = new URLSearchParams(window.parent.location.search);
            finalData.url = window.parent.location.href;
            finalData.utmSource = parentParams.get('utm_source') || '';
            finalData.utmMedium = parentParams.get('utm_medium') || '';
            finalData.utmCampaign = parentParams.get('utm_campaign') || '';
            finalData.utmContent = parentParams.get('utm_content') || '';
            finalData.utmTerm = parentParams.get('utm_term') || '';
            finalData.gclid = parentParams.get('gclid') || '';
            finalData.fbclid = parentParams.get('fbclid') || '';
            console.log('✅ USANDO DADOS DA PÁGINA PAI VIA WINDOW.PARENT.LOCATION (FALLBACK)');
          }
        } catch (e) {
          console.log('⚠️ Não foi possível acessar dados da página pai via window.parent.location');
        }
      }

      // Prioridade 3: Usar document.referrer se não conseguiu da página pai
      if (!finalData.utmSource && document.referrer && document.referrer !== window.location.href) {
        try {
          const referrerUrl = new URL(document.referrer);
          const referrerParams = new URLSearchParams(referrerUrl.search);
          finalData.url = document.referrer;
          finalData.utmSource = referrerParams.get('utm_source') || '';
          finalData.utmMedium = referrerParams.get('utm_medium') || '';
          finalData.utmCampaign = referrerParams.get('utm_campaign') || '';
          finalData.utmContent = referrerParams.get('utm_content') || '';
          finalData.utmTerm = referrerParams.get('utm_term') || '';
          finalData.gclid = referrerParams.get('gclid') || '';
          finalData.fbclid = referrerParams.get('fbclid') || '';
          console.log('✅ USANDO DADOS DO DOCUMENT.REFERRER');
        } catch (e) {
          console.log('⚠️ Não foi possível usar document.referrer');
        }
      }

      // Prioridade 4: Usar URL atual do iframe como fallback
      if (!finalData.utmSource) {
        finalData.url = window.location.href;
        finalData.utmSource = currentParams.get('utm_source') || '';
        finalData.utmMedium = currentParams.get('utm_medium') || '';
        finalData.utmCampaign = currentParams.get('utm_campaign') || '';
        finalData.utmContent = currentParams.get('utm_content') || '';
        finalData.utmTerm = currentParams.get('utm_term') || '';
        finalData.gclid = currentParams.get('gclid') || '';
        finalData.fbclid = currentParams.get('fbclid') || '';
        console.log('⚠️ USANDO URL ATUAL DO IFRAME COMO FALLBACK');
      }

      // Capturar cookies
      finalData.fbc = getCookie('_fbc');
      finalData.fbp = getCookie('_fbp');
      finalData.fbid = getCookie('_fbid');

      console.log('🎯 ===== DADOS FINAIS CAPTURADOS =====');
      console.log('🎯 URL FINAL:', finalData.url);
      console.log('🎯 utm_source:', finalData.utmSource || 'VAZIO');
      console.log('🎯 utm_medium:', finalData.utmMedium || 'VAZIO');
      console.log('🎯 utm_campaign:', finalData.utmCampaign || 'VAZIO');
      console.log('🎯 utm_content:', finalData.utmContent || 'VAZIO');
      console.log('🎯 utm_term:', finalData.utmTerm || 'VAZIO');
      console.log('🎯 gclid:', finalData.gclid || 'VAZIO');
      console.log('🎯 fbclid:', finalData.fbclid || 'VAZIO');
      console.log('🎯 _fbc:', finalData.fbc || 'VAZIO');
      console.log('🎯 _fbp:', finalData.fbp || 'VAZIO');
      console.log('🎯 _fbid:', finalData.fbid || 'VAZIO');

      return finalData;
    };

    // Executar captura imediatamente
    const capturedData = captureAllTrackingData();
    
    // Atualizar estado com os dados capturados
    setParentTrackingData({
      url: capturedData.url,
      cookies: {
        _fbc: capturedData.fbc,
        _fbp: capturedData.fbp,
        _fbid: capturedData.fbid
      }
    });

    // Listener para mensagens da página pai
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 ===== MENSAGEM RECEBIDA DA PÁGINA PAI =====');
      console.log('📨 Dados recebidos:', event.data);
      
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'PARENT_TRACKING_DATA') {
          console.log('📨 DADOS COMPLETOS DE TRACKING RECEBIDOS:', event.data.data);
          setParentTrackingData({
            url: event.data.data.url,
            cookies: {
              _fbc: event.data.data.fbc,
              _fbp: event.data.data.fbp,
              _fbid: event.data.data.fbid
            }
          });
        } else if (event.data.type === 'PARENT_URL_RESPONSE') {
          console.log('📨 RESPOSTA DE URL DA PÁGINA PAI:', event.data.url);
          setParentTrackingData(prev => ({
            ...prev,
            url: event.data.url
          }));
        } else if (event.data.type === 'PARENT_COOKIE_RESPONSE') {
          console.log('📨 RESPOSTA DE COOKIE DA PÁGINA PAI:', event.data.cookieName, event.data.cookieValue);
          setParentTrackingData(prev => ({
            ...prev,
            cookies: {
              ...prev.cookies,
              [event.data.cookieName]: event.data.cookieValue
            }
          }));
        }
      }
    };
    
    window.addEventListener('message', handleMessage);

    // Removido: Função de injeção de script que causava loop infinito

    // Solicitar dados da página pai via postMessage
    try {
      window.parent.postMessage({ type: 'REQUEST_PARENT_URL' }, '*');
      console.log('📤 Solicitação de URL enviada para página pai');
    } catch (error) {
      console.log('⚠️ ERRO AO SOLICITAR URL DA PÁGINA PAI:', error.message);
    }

    // Removido: Chamada da função de injeção que causava loop infinito
    
    // Removido: Re-execução da captura que causava loops desnecessários
    
    return () => window.removeEventListener('message', handleMessage);
  }, [trackingInitialized]);
  
  // Animação de seleção (efeito piscar) antes de avançar
  const [animatingSelection, setAnimatingSelection] = useState<{ fieldId: string; option: string } | null>(null);
  
  // Estados para valores dos campos
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const debugLog = (event: string, payload?: any) => {
    try {
      const debugEnabled = typeof window !== 'undefined' && (window as any)?.localStorage?.getItem('BP_DEBUG_FORM') === '1';
      if (process.env.NODE_ENV === 'development' || debugEnabled) {
        // eslint-disable-next-line no-console
        console.log('[PublicForm]', event, payload || null);
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'BP_FORM_DEBUG', event, payload }, '*');
        }
      }
    } catch {}
  };
  
  // Expor variáveis CSS globais usadas pelo portal do Radix (sempre executa, mesmo em loading)
  useEffect(() => {
    try {
      const sc: any = (formData as any)?.style_config || {};
      const root = document.documentElement;
      root.style.setProperty('--selBg', String(sc.selectBgColor || '#FFFFFF'));
      root.style.setProperty('--selFg', String(sc.selectTextColor || '#000000'));
      root.style.setProperty('--active-bc', String(sc.borderColorActive || '#E50F5E'));
      root.style.setProperty('--baseBg', String(sc.fieldBgColor || '#FFFFFF'));
      root.style.setProperty('--baseFg', String(sc.fieldTextColor || '#000000'));
    } catch {}
  }, [formData]);

  // Debug do fundo #131313 - SEMPRE executa
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect executado - props?.embedded:', props?.embedded);
    console.log('🔍 [DEBUG] Iniciando análise de fundo #131313...');
      
    // 1. Verificar fundo do body e document
    console.log('📋 [DEBUG] Body background:', document.body.style.backgroundColor, 'computed:', window.getComputedStyle(document.body).backgroundColor);
    console.log('📋 [DEBUG] Document background:', document.documentElement.style.backgroundColor, 'computed:', window.getComputedStyle(document.documentElement).backgroundColor);
    
    // 2. Verificar todos os elementos com fundo #131313
    const allElements = document.querySelectorAll('*');
    const elementsWithDarkBg = [];
    
    allElements.forEach((el, index) => {
      const computedStyle = window.getComputedStyle(el);
      const inlineBg = el.style.backgroundColor;
      const inlineBgShort = el.style.background;
      
      // Verificar se tem fundo escuro
      if (computedStyle.backgroundColor === 'rgb(19, 19, 19)' || 
          computedStyle.backgroundColor === '#131313' ||
          inlineBg === '#131313' ||
          inlineBgShort === '#131313' ||
          computedStyle.backgroundColor.includes('19, 19, 19') ||
          el.className.includes('dark') ||
          el.className.includes('bg-background')) {
        
        elementsWithDarkBg.push({
          element: el,
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          computedBg: computedStyle.backgroundColor,
          inlineBg: inlineBg,
          inlineBgShort: inlineBgShort,
          index: index
        });
      }
    });
    
    console.log('🎯 [DEBUG] Elementos com fundo escuro encontrados:', elementsWithDarkBg.length);
    elementsWithDarkBg.forEach((item, i) => {
      console.log('🔍 [DEBUG] Elemento ' + (i + 1) + ':', {
        tag: item.tagName,
        class: item.className,
        id: item.id,
        computed: item.computedBg,
        inline: item.inlineBg,
        inlineShort: item.inlineBgShort
      });
    });
    
    // 3. Forçar transparência no iframe
    console.log('🔧 [DEBUG] Aplicando transparência forçada...');
    document.body.style.backgroundColor = 'transparent';
    document.body.style.background = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';
    document.documentElement.style.background = 'transparent';
    
    // 4. Aplicar transparência em todos os elementos
    allElements.forEach((el, index) => {
      if (!el.matches('input, textarea, select, button')) {
        const beforeBg = window.getComputedStyle(el).backgroundColor;
        el.style.backgroundColor = 'transparent';
        el.style.background = 'transparent';
        const afterBg = window.getComputedStyle(el).backgroundColor;
        
        if (beforeBg !== afterBg) {
          console.log('🔧 [DEBUG] Elemento ' + index + ' alterado: ' + beforeBg + ' -> ' + afterBg, el);
        }
      }
    });
    
    // 5. Forçar transparência em elementos com classes dark
    const darkElements = document.querySelectorAll('.dark, [class*="dark:"], .bg-background');
    console.log('🌙 [DEBUG] Elementos dark encontrados:', darkElements.length);
    darkElements.forEach((el, index) => {
      console.log('🌙 [DEBUG] Elemento dark ' + (index + 1) + ':', el.tagName, el.className);
      el.style.backgroundColor = 'transparent';
      el.style.background = 'transparent';
    });
    
    // 6. Verificar resultado final
    setTimeout(() => {
      console.log('✅ [DEBUG] Verificação final:');
      console.log('📋 [DEBUG] Body final:', window.getComputedStyle(document.body).backgroundColor);
      console.log('📋 [DEBUG] Document final:', window.getComputedStyle(document.documentElement).backgroundColor);
      
      const finalCheck = document.querySelectorAll('*');
      const stillDark = [];
      finalCheck.forEach(el => {
        const bg = window.getComputedStyle(el).backgroundColor;
        if (bg === 'rgb(19, 19, 19)' || bg === '#131313') {
          stillDark.push({element: el, bg: bg});
        }
      });
      
      if (stillDark.length > 0) {
        console.log('❌ [DEBUG] Ainda há elementos com fundo escuro:', stillDark);
      } else {
        console.log('✅ [DEBUG] Todos os fundos escuros foram removidos!');
      }
    }, 1000);
  }, []);
  
  // Carregar dados do formulário
  useEffect(() => {
    const loadForm = async () => {
      if (!formId) return;
      
      try {
        // Carregar dados do formulário
        const { data: form, error: formError } = await supabase
          .from('lead_forms' as any)
          .select('*')
          .eq('id', formId)
          .eq('status', 'active')
          .single();

        if (formError) {
          console.error('Erro ao carregar formulário:', formError);
          throw formError;
        }


        // Buscar moeda e timezone da empresa
        const { data: company, error: companyError } = await supabase
          .from('companies' as any)
          .select('currency')
          .eq('id', (form as any).company_id)
          .single();

        if (!companyError && (company as any)?.currency) {
          setCompanyCurrency((company as any).currency);
        }

        // Buscar timezone da empresa
        const { data: companyProfile, error: profileError } = await supabase
          .from('company_profiles' as any)
          .select('timezone')
          .eq('company_id', (form as any).company_id)
          .maybeSingle();

        if (!profileError && (companyProfile as any)?.timezone) {
          setCompanyTimezone((companyProfile as any).timezone);
        }

        // Carregar configuração de estilo
        const { data: styleData, error: styleError } = await supabase
          .from('lead_form_styles' as any)
          .select('style_config')
          .eq('lead_form_id', formId)
          .eq('status', 'active')
          .single();

        if (styleError) {
          console.warn('Erro ao carregar estilo:', styleError);
        }

        // Carregar configurações de redirecionamento específicas do formulário
        const { data: redirectData, error: redirectError } = await (supabase as any)
          .from('form_redirects')
          .select('redirect_enabled, redirect_url')
          .eq('company_id', (form as any).company_id)
          .eq('lead_form_id', formId)
          .maybeSingle();

        if (redirectError) {
          console.warn('Erro ao carregar configurações de redirecionamento:', redirectError);
        }

        // Combinar dados do formulário com estilo e redirecionamento
        const formWithStyle = {
          ...(form as any),
          style_config: {
            ...((styleData as any)?.style_config || {}),
            redirectEnabled: (redirectData as any)?.redirect_enabled || false,
            redirectUrl: (redirectData as any)?.redirect_url || ''
          }
        };

        console.log('Dados de redirecionamento carregados:', {
          redirectData,
          redirectEnabled: (redirectData as any)?.redirect_enabled,
          redirectUrl: (redirectData as any)?.redirect_url
        });

        setFormData(formWithStyle as unknown as FormData);
        try {
          if ((form as any)?.company_id) {
            debugLog('loadForm:loaded', { company_id: (form as any)?.company_id, name: (form as any)?.name });
          }
        } catch {}

        // Carregar campos do formulário
        const { data: fields, error: fieldsError } = await supabase
          .from('lead_form_fields' as any)
          .select('*')
          .eq('lead_form_id', formId)
          .order('field_order');

        if (fieldsError) {
          console.error('Erro ao carregar campos:', fieldsError);
          throw fieldsError;
        }

        // Para campos monetários e select, buscar configurações adicionais da tabela lead_fields
        const fieldsWithConfig = await Promise.all((fields || []).map(async (field: any) => {
          let updatedField = { ...field };
          
          // Para campos monetários, buscar configurações da página "Definições" (com cache)
          if (field.field_type === 'money' || field.field_type === 'monetario') {
            try {
              const cacheKey = `lead_field_money_${field.field_id}`;
              let leadFieldConfig = getCachedData(cacheKey);
              
              if (!leadFieldConfig) {
                const { data, error: configError } = await supabase
                  .from('lead_fields' as any)
                  .select('money_currency, money_limits, money_min, money_max, placeholder_text')
                  .eq('id', field.field_id)
                  .single();

                if (!configError && data) {
                  leadFieldConfig = data;
                  setCachedData(cacheKey, data);
                }
              }

              if (leadFieldConfig) {
                updatedField = {
                  ...updatedField,
                  // Configurações da página "Definições"
                  money_currency: leadFieldConfig.money_currency,
                  money_limits: leadFieldConfig.money_limits,
                  money_min: leadFieldConfig.money_min,
                  money_max: leadFieldConfig.money_max,
                  // Manter placeholder_text do formulário separado do lead_fields
                  lead_field_placeholder_text: leadFieldConfig.placeholder_text // placeholder_text da tabela lead_fields
                };
              }
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('Erro ao carregar configuração do campo monetário:', error);
              }
            }
          }
          
        // Para campos select, buscar configurações da página "Definições" (com cache)
        if (field.field_type === 'select' || field.field_type === 'selecao' || field.field_type === 'seleção') {
          try {
            const cacheKey = `lead_field_${field.field_id}`;
            let leadFieldConfig = getCachedData(cacheKey);
            
            if (!leadFieldConfig) {
              const { data, error: configError } = await supabase
                .from('lead_fields' as any)
                .select('options, searchable, multiselect, name, placeholder_text, sender')
                .eq('id', field.field_id)
                .single();

              if (!configError && data) {
                leadFieldConfig = data;
                setCachedData(cacheKey, data);
              }
            }

            if (leadFieldConfig) {
              updatedField = {
                ...updatedField,
                // Configurações da página "Definições" - priorizar sobre configurações do formulário
                options: leadFieldConfig.options || field.options,
                searchable: leadFieldConfig.searchable !== undefined ? leadFieldConfig.searchable : field.searchable,
                multiselect: leadFieldConfig.multiselect !== undefined ? leadFieldConfig.multiselect : field.multiselect,
                field_name: leadFieldConfig.name || field.field_name,
                // Manter placeholder_text do formulário separado do lead_fields
                lead_field_placeholder_text: leadFieldConfig.placeholder_text, // placeholder_text da tabela lead_fields
                sender: leadFieldConfig.sender || field.sender
              };
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Erro ao carregar configuração do campo select:', error);
            }
          }
        }
          
                  // Para campos de conexão, buscar configurações da página "Definições"
                  if (field.field_type === 'connection' || field.field_type === 'conexao' || field.field_type === 'conexão') {
                    try {
                      const { data: leadFieldConfig, error: configError } = await supabase
                        .from('lead_fields' as any)
                        .select('selection_list, name, placeholder_text, sender')
                        .eq('id', field.field_id)
                        .single();

                      if (!configError && leadFieldConfig) {
                        updatedField = {
                          ...updatedField,
                          // Configurações da página "Definições" - priorizar sobre configurações do formulário
                          options: leadFieldConfig.selection_list || field.options,
                          field_name: leadFieldConfig.name || field.field_name,
                          // Para placeholder_text, priorizar o valor da tabela lead_form_fields (formulário)
                          placeholder_text: field.placeholder_text || leadFieldConfig.placeholder_text,
                          sender: leadFieldConfig.sender || field.sender
                        };
                      }
                    } catch (error) {
                      console.warn('Erro ao carregar configuração do campo de conexão:', error);
                    }
                  }
          
          // Para campos de checkbox, buscar configurações da página "Definições"
          if (field.field_type === 'checkbox') {
            try {
              const { data: leadFieldConfig, error: configError } = await supabase
                .from('lead_fields' as any)
                .select('checkbox_options, checkbox_button_mode, multiselect, checkbox_limit, checkbox_columns, name')
                .eq('id', field.field_id)
                .single();

              if (!configError && leadFieldConfig) {
                updatedField = {
                  ...updatedField,
                  // Configurações da página "Definições" - priorizar sobre configurações do formulário
                  options: leadFieldConfig.checkbox_options || field.options,
                  checkbox_style: leadFieldConfig.checkbox_button_mode ? 'button' : 'checkbox',
                  multiselect: leadFieldConfig.multiselect || field.multiselect,
                  checkbox_limit: leadFieldConfig.checkbox_limit || field.checkbox_limit,
                  field_name: leadFieldConfig.name || field.field_name,
                  checkbox_columns: (leadFieldConfig as any).checkbox_columns || (field as any).checkbox_columns || 2
                };
              }
            } catch (error) {
              console.warn('Erro ao carregar configuração do campo de checkbox:', error);
                    }
                  }
          
          return updatedField;
        }));

        setFormFields(fieldsWithConfig as unknown as FormField[]);

        // Carregar dados de conexão após formData estar disponível
        const connectionFields = fieldsWithConfig.filter((field: any) => 
          field.field_type === 'connection' || field.field_type === 'conexao' || field.field_type === 'conexão'
        );

        if (connectionFields.length > 0) {
          debugLog('connection:detected', { count: connectionFields.length, fields: connectionFields.map((f: any) => ({ id: f.field_id, options: f.options, name: f.field_name })) });
          const updatedConnectionFields = await Promise.all(connectionFields.map(async (field: any) => {
            try {
              // Mapear alias de listas para nomes reais de tabelas (mesmo quando options vier vazio)
              const listAliasRaw = (field as any).options ?? '';
              const listAlias = String(listAliasRaw || '').toLowerCase().trim();
              const fname = String((field as any).field_name || '').toLowerCase();
              let listTable = listAlias;
              if (!listTable || listTable === 'undefined' || listTable === 'null' || listTable === '') {
                if (fname.includes('origem')) listTable = 'lead_origins';
                else if (fname.includes('motivo') && fname.includes('perda')) listTable = 'loss_reasons';
              }
              if (listTable === 'origens') listTable = 'lead_origins';
              if (listTable === 'motivos-perda') listTable = 'loss_reasons';

              debugLog('connection:infer', { field_id: field.field_id, listAlias, fname, listTable });
              if (!listTable) return field;

              const companyId = (form as any)?.company_id;
              let listData: any[] | null = null;
              let listError: any = null;

              try {
                if (listTable === 'lead_origins' || listTable === 'loss_reasons') {
                  // Essas tabelas possuem (id, name[, company_id]) — buscar e filtrar por company_id no cliente
                  const resp = await supabase
                    .from(listTable as any)
                    .select('id, name, company_id')
                    .limit(200);
                  listData = resp.data as any[] | null;
                  listError = resp.error;
                  debugLog('connection:query:no-company-filter', { field_id: field.field_id, listTable, rows: listData?.length || 0, error: listError || null });
                  // Filtrar apenas as origens da empresa do formulário
                  if (!listError && listData) {
                    const filtered = (listData as any[]).filter((it: any) => String(it.company_id || '').toLowerCase() === String(companyId || '').toLowerCase());
                    debugLog('connection:filter-company', { listTable, before: listData.length, after: filtered.length, companyId });
                    listData = filtered;
                  }
                } else {
                  // Tentar com filtro por company_id, se falhar, fazer fallback sem filtro
                  let resp = await supabase
                    .from(listTable as any)
                    .select('id, name, title, nome, titulo')
                    .eq('company_id', companyId)
                    .limit(200);
                  listData = resp.data as any[] | null;
                  listError = resp.error;
                  if (listError) {
                    debugLog('connection:query:company-filter-error', { field_id: field.field_id, listTable, error: listError });
                    resp = await supabase
                      .from(listTable as any)
                      .select('id, name, title, nome, titulo')
                      .limit(200);
                    listData = resp.data as any[] | null;
                    listError = resp.error;
                    debugLog('connection:query:fallback-no-filter', { field_id: field.field_id, listTable, rows: listData?.length || 0, error: listError || null });
                  } else {
                    debugLog('connection:query:company-filter', { field_id: field.field_id, listTable, rows: listData?.length || 0 });
                  }
                }
              } catch (err) {
                listError = err;
              }

              if (!listError && listData && listData.length > 0) {
                const items = listData.map((item: any) => ({ id: item.id, label: item.name || item.title || item.nome || item.titulo || String(item.id) }));
                return { ...field, connection_items: items };
              }
            } catch (err) {
              debugLog('connection:error', { field_id: field.field_id, error: String(err) });
            }
            return field;
          }));

          // Atualizar apenas os campos de conexão
          setFormFields(prevFields => 
            prevFields.map((field: any) => {
              const updatedField = updatedConnectionFields.find((cf: any) => cf.field_id === field.field_id);
              return updatedField || field;
            })
          );
        }

        // Calcular etapas baseadas nas divisões
        const divisionIndices = (fields as unknown as FormField[])
          ?.map((field, index) => field.is_division ? index : -1)
          .filter(index => index !== -1) || [];
        
        setTotalSteps(divisionIndices.length + 1);

      } catch (error) {
        console.error('Erro ao carregar formulário:', error);
        toast({
          title: 'Erro',
          description: 'Formulário não encontrado ou inativo',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
        // Redimensionar após carregar o formulário
        setTimeout(() => resizeIframe(), 500);
      }
    };

    loadForm();
  }, [formId]);

  // Função para obter campos da etapa atual
  const getFieldsForCurrentStep = () => {
    if (!formFields || formFields.length === 0) return [];
    
    const divisionIndices = formFields
      .map((field, index) => field.is_division ? index : -1)
      .filter(index => index !== -1);
    
    if (currentStep === 1) {
      // Primeira etapa: campos até a primeira divisão
      const firstDivisionIndex = divisionIndices[0];
      return firstDivisionIndex !== undefined 
        ? formFields.slice(0, firstDivisionIndex)
        : formFields.filter(field => !field.is_division);
    } else if (currentStep === totalSteps) {
      // Última etapa: campos após a última divisão
      const lastDivisionIndex = divisionIndices[divisionIndices.length - 1];
      return lastDivisionIndex !== undefined 
        ? formFields.slice(lastDivisionIndex + 1)
        : [];
    } else {
      // Etapas intermediárias: campos entre divisões
      const startIndex = divisionIndices[currentStep - 2] + 1;
      const endIndex = divisionIndices[currentStep - 1];
      return formFields.slice(startIndex, endIndex);
    }
  };

  // Função para validar campos obrigatórios da etapa atual
  const validateCurrentStep = () => {
    const currentStepFields = getFieldsForCurrentStep();
    const missingFields: string[] = [];
    const newFieldErrors: Record<string, string> = {};
    
    currentStepFields.forEach(field => {
      if (field.is_required) {
        const value = fieldValues[field.field_id];
        const isEmpty = !value || 
          (typeof value === 'string' && value.trim() === '') ||
          (Array.isArray(value) && value.length === 0);
        
        if (isEmpty) {
          missingFields.push(field.field_name || field.field_id);
          
          // Definir mensagem de erro específica baseada no tipo do campo
          const fieldType = (field as any).field_type;
          if (fieldType === 'select') {
            newFieldErrors[field.field_id] = 'Selecione uma opção';
          } else {
            newFieldErrors[field.field_id] = 'Preencha o campo';
          }
        }
      }
    });
    
    // Atualizar erros dos campos
    setFieldErrors(prev => {
      const updated = { ...prev };
      // Limpar erros dos campos da etapa atual
      currentStepFields.forEach(field => {
        delete updated[field.field_id];
      });
      // Adicionar novos erros
      return { ...updated, ...newFieldErrors };
    });
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  };

  // Função para ir para próxima etapa
  const goToNextStep = (options?: { skipValidation?: boolean }) => {
    if (currentStep < totalSteps) {
      if (!options?.skipValidation) {
      const validation = validateCurrentStep();
      if (!validation.isValid) {
        toast({
          title: 'Campos obrigatórios',
          description: `Por favor, preencha os seguintes campos: ${validation.missingFields.join(', ')}`,
          variant: 'destructive'
        });
        return;
      }
      }
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      // Redimensionar após mudança de etapa
      setTimeout(() => resizeIframe(), 300);
    }
  };

  // Função para atualizar valor de um campo
  const updateFieldValue = (fieldId: string, value: any) => {
    // Evitar [object Object] em campos vazios
    let cleanValue: any = '';
    
    if (value === null || value === undefined) {
      cleanValue = '';
    } else if (typeof value === 'object' && value !== null) {
      // Se for um array, manter como array
      if (Array.isArray(value)) {
        cleanValue = value;
      } else {
        // Se for um objeto, converter para string vazia
        cleanValue = '';
      }
    } else if (typeof value === 'boolean') {
      // Manter booleanos como estão
      cleanValue = value;
    } else if (typeof value === 'string') {
      // Para strings, manter como estão (incluindo string vazia)
      cleanValue = value;
    } else if (typeof value === 'number') {
      // Para números, manter como estão
      cleanValue = value;
    } else {
      // Para outros tipos, converter para string
      cleanValue = String(value);
    }
    
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: cleanValue
    }));

    // Limpar erro do campo quando for preenchido
    if (cleanValue && cleanValue !== '' && cleanValue !== false) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[fieldId];
        return updated;
      });
    }
    
    // Redimensionar após mudança no campo
    setTimeout(() => resizeIframe(), 200);
  };

  // Função para renderizar campo baseado no tipo
  const renderField = (field: FormField) => {
    const currentValue = fieldValues[(field as any).field_id] || '';
    const fieldError = fieldErrors[(field as any).field_id];
    // Lógica correta do label baseada no toggle Placeholder
    const label = (field as any).placeholder_enabled 
      ? null // Toggle ON: sem título
      : (field as any).placeholder_text || (field as any).field_name; // Toggle OFF: usar placeholder_text como título (ou field_name se não definido)
    
    

    const commonProps = {
      value: currentValue,
      onChange: (e: any) => {
        const value = e.target?.value || '';
        updateFieldValue((field as any).field_id, value);
      },
      placeholder: (field as any).placeholder_enabled ? ((field as any).placeholder_text || label) : label,
      required: (field as any).is_required,
      style: {
        ...fieldStyle,
        ...(fontStyle || {}),
        ['--active-bc' as any]: cfg.borderColorActive,
        ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px`,
        padding: '12px',
        width: '100%'
      }
    };

    switch ((field as any).field_type?.toLowerCase()) {
      case 'text':
        return (
          <div>
          <Input
            {...commonProps}
            type="text"
              className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
            onFocus={(e) => {
              e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
              e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
              e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
            }}
            onChange={(e) => {
              let value = e.target.value;
              // Aplicar formatação de nome se for campo de nome
              if ((field as any).field_name?.toLowerCase().includes('nome') || 
                  (field as any).field_name?.toLowerCase().includes('name')) {
                // Capitalizar primeira letra de cada palavra
                value = value.replace(/\b\w/g, (l: string) => l.toUpperCase());
                // Garantir que o restante seja minúsculo
                value = value.replace(/\B\w/g, (l: string) => l.toLowerCase());
              }
              updateFieldValue((field as any).field_id, value);
            }}
          />
            {fieldError && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case 'email':
        const emailIsRequired = (field as any).is_required || false;
        
        // Lógica correta do label baseada no toggle Placeholder
        const emailLabel = (field as any).placeholder_enabled 
          ? null // Toggle ON: sem título
          : (field as any).placeholder_text || (field as any).field_name; // Toggle OFF: usar placeholder_text como título
        
        const emailPlaceholder = (field as any).placeholder_enabled 
          ? (field as any).placeholder_text || (field as any).field_name // Toggle ON: usar placeholder_text no input
          : "Exemplo: jonhgon@mail.com.br"; // Toggle OFF: placeholder padrão
        
        return (
          <div>
            {/* Mostrar o label apenas quando toggle estiver desligado */}
            {emailLabel && (
              <Label className="text-sm font-medium" style={{ color: cfg.fieldTextColor || '#FFFFFF' }}>
                {emailLabel} {emailIsRequired && <span className="text-red-500">*</span>}
              </Label>
            )}
          <Input
            {...commonProps}
            type="email"
              placeholder={emailPlaceholder}
              className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
            onFocus={(e) => {
              e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
              e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
              e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
              
              // Validação de e-mail
              const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
              if (e.target.value && !emailRegex.test(e.target.value)) {
                e.target.setCustomValidity('Por favor, insira um e-mail válido');
              } else {
                e.target.setCustomValidity('');
              }
            }}
            onChange={(e) => {
              let value = e.target.value;
              // Converter para minúsculas
              value = value.toLowerCase();
              // Permitir apenas caracteres válidos para e-mail (sem espaços)
              value = value.replace(/[^a-z0-9._%+-@]/g, '');
              updateFieldValue((field as any).field_id, value);
            }}
          />
            {fieldError && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case 'name':
        const nameIsRequired = (field as any).is_required || false;
        
        // Lógica correta do label baseada no toggle Placeholder
        const nameLabel = (field as any).placeholder_enabled 
          ? null // Toggle ON: sem título
          : (field as any).placeholder_text || (field as any).field_name; // Toggle OFF: usar placeholder_text como título
        
        const namePlaceholder = (field as any).placeholder_enabled 
          ? (field as any).placeholder_text || (field as any).field_name // Toggle ON: usar placeholder_text no input
          : "Exemplo: John Gon"; // Toggle OFF: placeholder padrão
        
        return (
          <div>
            {/* Mostrar o label apenas quando toggle estiver desligado */}
            {nameLabel && (
              <Label className="text-sm font-medium" style={{ color: cfg.fieldTextColor || '#FFFFFF' }}>
                {nameLabel} {nameIsRequired && <span className="text-red-500">*</span>}
              </Label>
            )}
          <Input
            {...commonProps}
            type="text"
              placeholder={namePlaceholder}
              className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
            onFocus={(e) => {
              e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
              e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
              e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
              // Validar se tem sobrenome
              const value = e.target.value.trim();
              if (value && value.split(' ').length < 2) {
                e.target.setCustomValidity('Por favor, informe nome e sobrenome');
              } else {
                e.target.setCustomValidity('');
              }
            }}
            onChange={(e) => {
              let value = e.target.value;
              // Capitalizar primeira letra de cada palavra
              value = value.replace(/\b\w/g, (l: string) => l.toUpperCase());
              // Garantir que o restante seja minúsculo
              value = value.replace(/\B\w/g, (l: string) => l.toLowerCase());
              updateFieldValue((field as any).field_id, value);
            }}
          />
            {fieldError && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case 'telefone':
      case 'phone':
        const phoneIsRequired = (field as any).is_required || false;
        
        // Lógica correta do label baseada no toggle Placeholder
        const phoneLabel = (field as any).placeholder_enabled 
          ? null // Toggle ON: sem título
          : (field as any).placeholder_text || (field as any).field_name; // Toggle OFF: usar placeholder_text como título
        
        const phonePlaceholder = (field as any).placeholder_enabled 
          ? (field as any).placeholder_text || (field as any).field_name // Toggle ON: usar placeholder_text no input
          : "Digite aqui"; // Toggle OFF: placeholder padrão
        
        return (
          <div>
            {/* Mostrar o label apenas quando toggle estiver desligado */}
            {phoneLabel && (
              <Label className="text-sm font-medium" style={{ color: cfg.fieldTextColor || '#FFFFFF' }}>
                {phoneLabel} {phoneIsRequired && <span className="text-red-500">*</span>}
              </Label>
            )}
          <LandingPhoneInput
            value={currentValue}
            onChange={(value) => updateFieldValue((field as any).field_id, value)}
              placeholder={phonePlaceholder}
            globalDefaultColor={undefined}
            accentFocus
            selectBgColor={cfg.selectBgColor}
            selectTextColor={cfg.selectTextColor}
            fieldBgColor={cfg.fieldBgColor}
            fieldTextColor={cfg.fieldTextColor}
            borderColorNormal={cfg.borderColorNormal}
            borderColorActive={cfg.borderColorActive}
            borderRadiusPx={cfg.borderRadiusPx}
            borderWidthNormalPx={cfg.borderWidthNormalPx}
            borderWidthFocusPx={cfg.borderWidthFocusPx}
            fontSizeInputPx={cfg.fontSizeInputPx}
          />
            {fieldError && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={4}
            className="min-h-24 placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
            onFocus={(e) => {
              e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
              e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
              e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
            }}
          />
        );

      case 'select':
      case 'selecao':
      case 'seleção':
        // Configurações do campo select - busca de dois locais
        const selectOptions = (field as any).options?.split(',').map((opt: string) => opt.trim()).filter((opt: string) => opt.length > 0) || [];
        const isSearchable = (field as any).searchable || false;
        const isMultiselect = (field as any).multiselect || false;
        const isRequired = (field as any).is_required || false;
        const disqualifyEnabled = (field as any).disqualify_enabled || false;
        const disqualifySelectedOption = (field as any).disqualify_selected_option || null;
        // Logs de debug removidos para evitar spam no console
        
        // NOVA LÓGICA CORRETA baseada nas regras definidas:
        // 1. Toggle LIGADO: Título = oculto, Placeholder = lead_form_fields.placeholder_text
        // 2. Toggle DESLIGADO: Título = lead_form_fields.placeholder_text, Placeholder = lead_fields.placeholder_text
        
        // Buscar placeholder_text da tabela lead_fields (configuração do campo)
        const selectLeadFieldPlaceholder = (field as any).lead_field_placeholder_text || "Selecione uma opção";
        
        // Lógica do placeholder baseada no toggle
        const selectPlaceholderText = (field as any).placeholder_enabled 
          ? ((field as any).placeholder_text || "Selecione uma opção") // Toggle ON: usar lead_form_fields.placeholder_text
          : "Selecione"; // Toggle OFF: sempre "Selecione"
        
        // Lógica do título (label) - baseada nas regras definidas
        const selectFinalLabel = (field as any).placeholder_enabled 
          ? null // Toggle ON: sem título
          : ((field as any).placeholder_text || (field as any).field_name); // Toggle OFF: usar lead_form_fields.placeholder_text como título
        
        // Logs de debug removidos para evitar spam no console
        
        
        
        
        
        
        
        // Se não há opções, mostrar input simples
        if (selectOptions.length === 0) {
          return (
            <Input
              value={currentValue}
              placeholder={selectPlaceholderText}
              required={isRequired}
              type="text"
              className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
              style={{
                ...fieldStyle,
                ...(fontStyle || {}),
                ['--active-bc' as any]: cfg.borderColorActive,
                ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px`,
                padding: '12px',
                width: '100%'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
                e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
                e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
                
                // Validação obrigatória
                if (isRequired && !e.target.value.trim()) {
                  e.target.setCustomValidity('Este campo é obrigatório');
                } else {
                  e.target.setCustomValidity('');
                }
              }}
              onChange={(e) => {
                const value = e.target.value;
                updateFieldValue((field as any).field_id, value);
              }}
            />
          );
        }

        // Para multi-select, usar checkbox com estilo adequado
        if (isMultiselect) {
          return (
            <div className="space-y-2">
              {/* Só mostrar o label se placeholder não estiver habilitado */}
              {!(field as any).placeholder_enabled && (
                <Label className="text-sm font-medium" style={{ color: cfg.fieldTextColor || '#FFFFFF' }}>
                  {label} {isRequired && <span className="text-red-500">*</span>}
                </Label>
              )}
              <div className="space-y-2">
                {selectOptions.map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${(field as any).field_id}-${index}`}
                      checked={Array.isArray(currentValue) ? currentValue.includes(option) : false}
                      onCheckedChange={(checked) => {
                        const current = Array.isArray(currentValue) ? currentValue : [];
                        let newValue;
                        if (checked) {
                          newValue = [...current, option];
                        } else {
                          newValue = current.filter((item: string) => item !== option);
                        }
                        updateFieldValue((field as any).field_id, newValue);
                      }}
                      style={{
                        borderColor: cfg.borderColorActive || '#E50F5E',
                        backgroundColor: Array.isArray(currentValue) && currentValue.includes(option) ? (cfg.borderColorActive || '#E50F5E') : 'transparent'
                      }}
                    />
                    <Label 
                      htmlFor={`${(field as any).field_id}-${index}`} 
                      className="text-sm cursor-pointer"
                      style={{ color: cfg.fieldTextColor || '#FFFFFF' }}
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Select simples com todas as funcionalidades
        const connectionIsRequired = (field as any).is_required || false;
        
        return (
          <div className="space-y-2">
            {/* Mostrar o label apenas quando toggle estiver desligado */}
            {selectFinalLabel && (
              <Label className="text-sm font-medium" style={{ color: cfg.fieldTextColor || '#FFFFFF' }}>
                {selectFinalLabel} {isRequired && <span className="text-red-500">*</span>}
              </Label>
            )}
            <Select 
              value={currentValue} 
              onValueChange={(value) => {
                updateFieldValue((field as any).field_id, value);
                
                // Verificar desqualificação
                if (disqualifyEnabled && disqualifySelectedOption && value === disqualifySelectedOption) {
                  // Aqui você pode implementar lógica de desqualificação
                }
              }}
              modal={false}
            >
              <SelectTrigger 
                className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger" 
                style={{ 
                  ...fieldStyle, 
                  ...(fontStyle||{}), 
                  ['--active-bc' as any]: cfg.borderColorActive, 
                  ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px`,
                  backgroundColor: cfg.fieldBgColor || '#FFFFFF',
                  padding: '12px',
                  width: '100%'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = cfg.borderColorActive || '#E50F5E';
                  e.currentTarget.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
                  e.currentTarget.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
                  
                  // Validação obrigatória
                  if (connectionIsRequired && !currentValue) {
                    e.currentTarget.setCustomValidity('Este campo é obrigatório');
                  } else {
                    e.currentTarget.setCustomValidity('');
                  }
                }}
              >
                       <SelectValue 
                         placeholder={selectPlaceholderText}
                         ref={(el) => {
                           // Ref removido para evitar logs de debug
                         }}
                       />
              </SelectTrigger>
              <SelectContent 
                className="border-white/20 text-white select-content" 
                style={{ 
                  ...(fontStyle||{}), 
                  backgroundColor: cfg.fieldBgColor || '#FFFFFF',
                  ['--selBg' as any]: cfg.selectBgColor, 
                  ['--selFg' as any]: cfg.selectTextColor, 
                  fontSize: `${cfg.fontSizeInputPx || 16}px`,
                  zIndex: 2147483647,
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                {/* Área de pesquisa se habilitada */}
                {isSearchable && (
                  <div className="p-2 border-b border-white/10" style={{ backgroundColor: cfg.fieldBgColor || '#FFFFFF' }}>
                    <Input
                      placeholder="Pesquisar opções..."
                      value={fieldValues[`${(field as any).field_id}_search`] || ''}
                      onChange={(e) => updateFieldValue(`${(field as any).field_id}_search`, e.target.value)}
                      className="h-9 border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
                      style={{
                        backgroundColor: cfg.fieldBgColor || '#FFFFFF',
                        fontSize: `${cfg.fontSizeInputPx || 16}px`,
                        color: cfg.fieldTextColor || '#FFFFFF',
                        borderColor: cfg.borderColorActive || '#E50F5E'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
                        e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.borderWidth = '1px';
                      }}
                    />
                  </div>
                )}
                
                {/* Opções filtradas */}
                {selectOptions
                  .filter((option: string) => 
                    !isSearchable || 
                    !fieldValues[`${(field as any).field_id}_search`] || 
                    option.toLowerCase().includes(fieldValues[`${(field as any).field_id}_search`]?.toLowerCase() || '')
                  )
                  .map((option: string, index: number) => (
                    <SelectItem 
                      key={index} 
                      value={option} 
                      className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)] select-item" 
                      style={{ 
                        ...(fontStyle||{}), 
                        fontSize: `${cfg.fontSizeInputPx || 16}px`,
                        '--selBg': cfg.selectBgColor || '#FFFFFF',
                        '--selFg': cfg.selectTextColor || '#000000'
                      } as React.CSSProperties}
                    >
                      {option}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {fieldError && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case 'checkbox':
        const checkboxOptions = (field as any).options?.split(',').map((opt: string) => opt.trim()).filter((opt: string) => opt.length > 0) || [];
        const isCheckboxMultiselect = (field as any).multiselect;
        const checkboxStyle = (field as any).checkbox_style || 'checkbox';
        
        
        // Se não há opções, mostrar checkbox simples
        if (checkboxOptions.length === 0) {
          return (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={(field as any).field_id}
                checked={currentValue}
                onCheckedChange={(checked) => updateFieldValue((field as any).field_id, checked)}
                className="data-[state=checked]:bg-[var(--active-bc)] data-[state=checked]:border-[var(--active-bc)]"
                style={{ ['--active-bc' as any]: cfg.borderColorActive || '#E50F5E' }}
              />
              <Label htmlFor={(field as any).field_id} className="text-sm" style={{ color: cfg.fieldTextColor || '#FFFFFF' }}>
                {label}
              </Label>
            </div>
          );
        }
        
        // Se há opções, mostrar baseado no estilo
        if (checkboxStyle === 'button') {
          return (
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: cfg.fieldTextColor || '#FFFFFF' }}>
                {label}
              </Label>
              {/* CSS do efeito "piscar" */}
              <style>{`
                @keyframes pulse-select {
                  0% { transform: scale(1); filter: brightness(1); }
                  40% { transform: scale(1.03); filter: brightness(1.35); }
                  70% { transform: scale(1.02); filter: brightness(1.15); }
                  100% { transform: scale(1); filter: brightness(1); }
                }
                .pulse-selected {
                  animation: pulse-select 0.7s ease-in-out;
                }
              `}</style>
              {(() => {
                const stepFields = getFieldsForCurrentStep();
                const isIsolatedButtonCheckbox = stepFields.length === 1 && (stepFields[0] as any).field_id === (field as any).field_id;
                return (
              <div
                className="w-full gap-2"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.max(1, Math.min(10, Number((field as any).checkbox_columns) || 2))}, 1fr)`
                }}
              >
                {checkboxOptions.map((option: string, index: number) => {
                  const isSelected = isCheckboxMultiselect ? 
                    (Array.isArray(currentValue) && currentValue.includes(option)) : 
                    (currentValue === option);
                  
                  
                  // Verificar se pode ser selecionado (respeitando limite)
                  const current = Array.isArray(currentValue) ? currentValue : [];
                  const checkboxLimit = (field as any).checkbox_limit || 0;
                  const canSelect = !isCheckboxMultiselect || 
                    isSelected || 
                    checkboxLimit === 0 || 
                    current.length < checkboxLimit;
                  
                  
                  return (
                  <Button
                    key={index}
                    type="button"
                      variant="outline"
                    onClick={() => {
                        if (!canSelect) {
                          // Se não pode selecionar, não faz nada
                          return;
                        }
                        
                      // Ativar animação de seleção
                      if (isIsolatedButtonCheckbox) {
                        setAnimatingSelection({ fieldId: (field as any).field_id, option });
                        }
                        
                      if (isCheckboxMultiselect) {
                        const current = Array.isArray(currentValue) ? currentValue : [];
                          
                        if (current.includes(option)) {
                            // Remover opção se já estiver selecionada
                          updateFieldValue((field as any).field_id, current.filter((item: string) => item !== option));
                        } else {
                            // Adicionar opção se não estiver selecionada
                          const nextArray = [...current, option];
                          updateFieldValue((field as any).field_id, nextArray);
                          // Avançar automaticamente se for campo isolado em modo botão e não for multiseleção
                          if (isIsolatedButtonCheckbox && !isCheckboxMultiselect && currentStep < totalSteps) {
                            // Espera ~700ms da animação e avança até 1s total
                            setTimeout(() => {
                              goToNextStep({ skipValidation: true });
                              setAnimatingSelection(null);
                            }, 700);
                          }
                        }
                      } else {
                          // Modo single select - apenas uma opção pode ser selecionada
                        const nextValue = currentValue === option ? '' : option;
                        updateFieldValue((field as any).field_id, nextValue);
                        // Avançar automaticamente apenas quando houver seleção (não ao desselecionar)
                        if (nextValue && isIsolatedButtonCheckbox && currentStep < totalSteps) {
                          // Espera ~700ms da animação e avança até 1s total
                          setTimeout(() => {
                            goToNextStep({ skipValidation: true });
                            setAnimatingSelection(null);
                          }, 700);
                        }
                      }
                    }}
                      className={`h-12 px-4 text-base transition-all duration-200 ${!canSelect ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${animatingSelection && animatingSelection.fieldId === (field as any).field_id && animatingSelection.option === option ? 'pulse-selected' : ''}`}
                    style={{
                        // Estágio 1 - Estado normal / Estágio 3 - Campo selecionado
                        backgroundColor: isSelected ? 
                          (cfg.selectBgColor || '#E50F5E') : // Estágio 3: Cor de fundo dos seletores
                          (cfg.fieldBgColor || 'transparent'), // Estágio 1: Cor do fundo do campo
                        color: isSelected ? 
                          (cfg.selectTextColor || '#FFFFFF') : // Estágio 3: Cor da fonte dos seletores
                          (cfg.fieldTextColor || '#FFFFFF'), // Estágio 1: Cor da fonte do campo
                        borderColor: isSelected ? 
                          (cfg.borderColorActive || '#E50F5E') : // Estágio 3: Cor da borda pressionado
                          (cfg.borderColorNormal || '#D1D5DB'), // Estágio 1: Cor da borda normal
                        borderWidth: isSelected ? 
                          `${cfg.borderWidthFocusPx || 2}px` : // Estágio 3: Espessura da borda selecionada
                          `${cfg.borderWidthNormalPx || 1}px`, // Estágio 1: Espessura da borda normal
                      borderRadius: `${cfg.borderRadiusPx || 10}px`
                    }}
                      onMouseEnter={(e) => {
                        // Estágio 2 - Hover (apenas se não estiver selecionado e pode ser selecionado)
                        if (!isSelected && canSelect) {
                          e.currentTarget.style.backgroundColor = cfg.selectBgColor || '#E50F5E';
                          e.currentTarget.style.color = cfg.selectTextColor || '#FFFFFF';
                          e.currentTarget.style.borderColor = cfg.borderColorActive || '#E50F5E';
                          e.currentTarget.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        // Volta ao Estágio 1 - Estado normal (apenas se não estiver selecionado e pode ser selecionado)
                        if (!isSelected && canSelect) {
                          e.currentTarget.style.backgroundColor = cfg.fieldBgColor || 'transparent';
                          e.currentTarget.style.color = cfg.fieldTextColor || '#FFFFFF';
                          e.currentTarget.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
                          e.currentTarget.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
                        }
                    }}
                  >
                    {option}
                  </Button>
                  );
                })}
              </div>
                );
              })()}
              {/* Mensagem informativa sobre limite */}
              {isCheckboxMultiselect && (field as any).checkbox_limit > 0 && (
                <div className="text-xs text-gray-400 mt-2">
                  {Array.isArray(currentValue) ? currentValue.length : 0} de {(field as any).checkbox_limit} selecionados
                </div>
              )}
            </div>
          );
        }
        
        // Estilo radio (seleção única)
        if (checkboxStyle === 'radio') {
          return (
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: cfg.fieldTextColor || '#FFFFFF' }}>
                {label}
              </Label>
              <div className="space-y-2">
                {checkboxOptions.map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`${(field as any).field_id}-${index}`}
                      name={(field as any).field_id}
                      value={option}
                      checked={currentValue === option}
                      onChange={(e) => updateFieldValue((field as any).field_id, e.target.value)}
                      className="w-4 h-4"
                      style={{ accentColor: cfg.borderColorActive || '#E50F5E' }}
                    />
                    <Label htmlFor={`${(field as any).field_id}-${index}`} className="text-sm" style={{ color: cfg.fieldTextColor || '#FFFFFF' }}>
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        
        // Estilo checkbox padrão (múltipla seleção)
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium" style={{ color: cfg.fieldTextColor || '#FFFFFF' }}>
              {label}
            </Label>
            <div className="space-y-2">
              {checkboxOptions.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${(field as any).field_id}-${index}`}
                    checked={Array.isArray(currentValue) ? currentValue.includes(option) : false}
                    onCheckedChange={(checked) => {
                      const current = new Set(Array.isArray(currentValue) ? currentValue : []);
                      if (checked) current.add(option);
                      else current.delete(option);
                      updateFieldValue((field as any).field_id, Array.from(current));
                    }}
                    className="data-[state=checked]:bg-[var(--active-bc)] data-[state=checked]:border-[var(--active-bc)]"
                    style={{ ['--active-bc' as any]: cfg.borderColorActive || '#E50F5E' }}
                  />
                  <Label htmlFor={`${(field as any).field_id}-${index}`} className="text-sm" style={{ color: cfg.fieldTextColor || '#FFFFFF' }}>
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'number':
      case 'numero':
        return (
          <Input
            {...commonProps}
            type="number"
            className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
            onFocus={(e) => {
              e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
              e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
              e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
            }}
          />
        );

      case 'money':
      case 'monetario':
      case 'monetário':
        // Configurações do campo monetário - busca de dois locais
        // 1. Página "Definições" (lead_fields): money_currency, money_limits, money_min, money_max
        // 2. Página "Formulários" (lead_form_fields): disqualify_enabled, disqualify_min, disqualify_max, placeholder_enabled, placeholder_text, is_required
        
        const fieldCurrency = (field as any).money_currency || companyCurrency;
        const hasLimits = (field as any).money_limits || false;
        const hasDisqualify = (field as any).disqualify_enabled || false;
        
        // Priorizar configurações da página "Definições" se habilitadas, senão usar configurações do formulário
        const minValue = hasLimits ? parseFloat((field as any).money_min) || 0 : parseFloat((field as any).disqualify_min) || 0;
        const maxValue = hasLimits ? parseFloat((field as any).money_max) || Infinity : parseFloat((field as any).disqualify_max) || Infinity;
        
        const currencySymbol = fieldCurrency === 'BRL' ? 'R$' : fieldCurrency === 'USD' ? '$' : fieldCurrency === 'EUR' ? '€' : fieldCurrency;
        
        // NOVA LÓGICA CORRETA baseada nas regras definidas:
        // 1. Toggle LIGADO: Título = oculto, Placeholder = lead_form_fields.placeholder_text
        // 2. Toggle DESLIGADO: Título = oculto, Placeholder = lead_fields.placeholder_text
        
        // Buscar placeholder_text da tabela lead_fields (configuração do campo)
        const moneyLeadFieldPlaceholder = (field as any).lead_field_placeholder_text || `${currencySymbol} ${label}`;
        
        // Lógica do placeholder baseada no toggle
        const placeholderText = (field as any).placeholder_enabled 
          ? ((field as any).placeholder_text || `${currencySymbol} ${label}`) // Toggle ON: usar lead_form_fields.placeholder_text
          : moneyLeadFieldPlaceholder; // Toggle OFF: usar lead_fields.placeholder_text
        
        // Lógica do título (label) - sempre oculto
        const moneyFinalLabel = null; // Sempre oculto conforme regras
        
        return (
          <Input
            value={currentValue}
            placeholder={placeholderText}
            required={(field as any).is_required}
            type="text"
            className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
            style={{
              ...fieldStyle,
              ...(fontStyle || {}),
              ['--active-bc' as any]: cfg.borderColorActive,
              ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px`,
              padding: '12px',
              width: '100%'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
              e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
              e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
              
              // Validar limites na perda de foco (só se houver limites configurados)
              if (hasLimits || hasDisqualify) {
                const numericValue = parseFloat(e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'));
                if (!isNaN(numericValue)) {
                  if (numericValue < minValue) {
                    e.target.setCustomValidity(`Valor mínimo: ${currencySymbol} ${minValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
                  } else if (numericValue > maxValue) {
                    e.target.setCustomValidity(`Valor máximo: ${currencySymbol} ${maxValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
                  } else {
                    e.target.setCustomValidity('');
                  }
                }
              }
            }}
            onChange={(e) => {
              // Formatação de moeda baseada na configuração específica do campo
              let value = e.target.value.replace(/\D/g, '');
              
              if (value) {
                // Converter para número e aplicar limites (só se houver limites configurados)
                const numericValue = parseInt(value) / 100;
                let clampedValue = numericValue;
                
                if (hasLimits || hasDisqualify) {
                  clampedValue = Math.min(Math.max(numericValue, minValue), maxValue);
                }
                
                // Formatar com a moeda específica - sempre símbolo antes do número
                const locale = fieldCurrency === 'BRL' ? 'pt-BR' : fieldCurrency === 'USD' ? 'en-US' : fieldCurrency === 'EUR' ? 'de-DE' : 'pt-BR';
                const formattedValue = clampedValue.toLocaleString(locale, {
                  style: 'currency',
                  currency: fieldCurrency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
                
                // Garantir que o símbolo da moeda apareça sempre antes do número
                // Para moedas que não sejam BRL ou USD, forçar símbolo antes
                if (fieldCurrency !== 'BRL' && fieldCurrency !== 'USD') {
                  const symbol = fieldCurrency === 'EUR' ? '€' : fieldCurrency;
                  const numberPart = clampedValue.toLocaleString(locale, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  });
                  const finalFormattedValue = `${symbol} ${numberPart}`;
                  updateFieldValue((field as any).field_id, finalFormattedValue);
                  return;
                }
                
                updateFieldValue((field as any).field_id, formattedValue);
              } else {
                updateFieldValue((field as any).field_id, '');
              }
            }}
          />
        );

      case 'cpf':
        return (
          <Input
            value={currentValue}
            placeholder={label}
            required={(field as any).is_required}
            type="text"
            className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
            maxLength={14}
            style={{
              ...fieldStyle,
              ...(fontStyle || {}),
              ['--active-bc' as any]: cfg.borderColorActive,
              ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px`,
              padding: '12px',
              width: '100%'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
              e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
              e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
              // Validar CPF
              const value = e.target.value.replace(/\D/g, '');
              if (value.length === 11) {
                const isValid = validateCPF(value);
                if (!isValid) {
                  e.target.setCustomValidity('CPF inválido');
                } else {
                  e.target.setCustomValidity('');
                }
              }
            }}
            onChange={(e) => {
              // Máscara de CPF
              let value = e.target.value.replace(/\D/g, '');
              value = value.replace(/(\d{3})(\d)/, '$1.$2');
              value = value.replace(/(\d{3})(\d)/, '$1.$2');
              value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
              updateFieldValue((field as any).field_id, value);
            }}
          />
        );

      case 'cnpj':
        return (
          <Input
            value={currentValue}
            placeholder={label}
            required={(field as any).is_required}
            type="text"
            className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
            maxLength={18}
            style={{
              ...fieldStyle,
              ...(fontStyle || {}),
              ['--active-bc' as any]: cfg.borderColorActive,
              ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px`,
              padding: '12px',
              width: '100%'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
              e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
              e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
              // Validar CNPJ
              const value = e.target.value.replace(/\D/g, '');
              if (value.length === 14) {
                const isValid = validateCNPJ(value);
                if (!isValid) {
                  e.target.setCustomValidity('CNPJ inválido');
                } else {
                  e.target.setCustomValidity('');
                }
              }
            }}
            onChange={(e) => {
              // Máscara de CNPJ
              let value = e.target.value.replace(/\D/g, '');
              value = value.replace(/(\d{2})(\d)/, '$1.$2');
              value = value.replace(/(\d{3})(\d)/, '$1.$2');
              value = value.replace(/(\d{3})(\d)/, '$1/$2');
              value = value.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
              updateFieldValue((field as any).field_id, value);
            }}
          />
        );

      case 'address':
      case 'endereco':
      case 'endereço':
        // Função para buscar CEP
        const fetchCEP = async (cep: string) => {
          try {
            const cleanCEP = cep.replace(/\D/g, '');
            if (cleanCEP.length === 8) {
              const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
              const data = await response.json();
              if (!data.erro) {
                // Atualizar campos com dados do CEP
                updateFieldValue(`${(field as any).field_id}_logradouro`, data.logradouro || '');
                updateFieldValue(`${(field as any).field_id}_bairro`, data.bairro || '');
                updateFieldValue(`${(field as any).field_id}_cidade`, data.localidade || '');
                updateFieldValue(`${(field as any).field_id}_estado`, data.uf || '');
              }
            }
          } catch (error) {
            console.error('Erro ao buscar CEP:', error);
          }
        };

        return (
          <div className="space-y-2">
            {/* CEP */}
            <Input
              {...commonProps}
              type="text"
              placeholder="CEP"
              className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
              maxLength={9}
              onFocus={(e) => {
                e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
                e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
                e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
                // Buscar CEP quando sair do campo
                if (e.target.value.length >= 8) {
                  fetchCEP(e.target.value);
                }
              }}
              onChange={(e) => {
                // Máscara de CEP
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{5})(\d)/, '$1-$2');
                updateFieldValue((field as any).field_id, value);
              }}
            />
            
            {/* Estado */}
            <Input
              {...commonProps}
              type="text"
              placeholder="Estado"
              value={fieldValues[`${(field as any).field_id}_estado`] || ''}
              onChange={(e) => updateFieldValue(`${(field as any).field_id}_estado`, e.target.value)}
              className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
              onFocus={(e) => {
                e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
                e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
                e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
              }}
            />
            
            {/* Cidade */}
            <Input
              {...commonProps}
              type="text"
              placeholder="Cidade"
              value={fieldValues[`${(field as any).field_id}_cidade`] || ''}
              onChange={(e) => updateFieldValue(`${(field as any).field_id}_cidade`, e.target.value)}
              className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
              onFocus={(e) => {
                e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
                e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
                e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
              }}
            />
            
            {/* Bairro */}
            <Input
              {...commonProps}
              type="text"
              placeholder="Bairro"
              value={fieldValues[`${(field as any).field_id}_bairro`] || ''}
              onChange={(e) => updateFieldValue(`${(field as any).field_id}_bairro`, e.target.value)}
              className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
              onFocus={(e) => {
                e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
                e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
                e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
              }}
            />
            
            {/* Endereço */}
            <Input
              {...commonProps}
              type="text"
              placeholder="Endereço"
              value={fieldValues[`${(field as any).field_id}_logradouro`] || ''}
              onChange={(e) => updateFieldValue(`${(field as any).field_id}_logradouro`, e.target.value)}
              className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
              onFocus={(e) => {
                e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
                e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
                e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
              }}
            />
            
            {/* Número e Complemento */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                {...commonProps}
                type="text"
                placeholder="Número"
                value={fieldValues[`${(field as any).field_id}_numero`] || ''}
                onChange={(e) => updateFieldValue(`${(field as any).field_id}_numero`, e.target.value)}
                className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
                onFocus={(e) => {
                  e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
                  e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
                  e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
                }}
              />
              <Input
                {...commonProps}
                type="text"
                placeholder="Complemento"
                value={fieldValues[`${(field as any).field_id}_complemento`] || ''}
                onChange={(e) => updateFieldValue(`${(field as any).field_id}_complemento`, e.target.value)}
                className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
                onFocus={(e) => {
                  e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
                  e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
                  e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
                }}
              />
            </div>
          </div>
        );

      case 'connection':
      case 'conexao':
      case 'conexão':
        // Detectar se o texto é realmente personalizado (não padrão)
        const hasCustomConnectionPlaceholder = (field as any).placeholder_text && 
          (field as any).placeholder_text !== "Selecione uma opção" && 
          (field as any).placeholder_text.trim() !== "";
        
        // Lógica correta do label baseada no toggle Placeholder
        const connectionLabel = (field as any).placeholder_enabled 
          ? null // Toggle ON: sem título
          : hasCustomConnectionPlaceholder ? (field as any).placeholder_text : (field as any).field_name; // Toggle OFF: usar placeholder_text se personalizado, senão field_name
        
        const connectionPlaceholder = (field as any).placeholder_enabled 
          ? (field as any).placeholder_text || (field as any).field_name // Toggle ON: usar placeholder_text no input
          : "Selecione uma opção"; // Toggle OFF: placeholder padrão
        
        // Configurações do campo de conexão - busca de dois locais
        // 1. Página "Definições" (lead_fields): selection_list, name, placeholder_text, sender
        // 2. Página "Formulários" (lead_form_fields): is_required, placeholder_enabled, placeholder_text
        
        const connectionOptions = (field as any).options?.split(',').map((opt: string) => opt.trim()).filter((opt: string) => opt.length > 0) || [];
        
        // Preferir itens carregados do banco (connection_items)
        const connectionItems = (field as any).connection_items as { id: string; label: string }[] | undefined;
        const hasItems = Array.isArray(connectionItems) && connectionItems.length > 0;

        // Se não há opções/itens configurados, mostrar dropdown vazio
        if (!hasItems && connectionOptions.length === 0) {
          debugLog('connection:render-empty', { field_id: (field as any).field_id, options: connectionOptions.length });
          return (
            <div className="space-y-2">
              {/* Mostrar o label apenas quando toggle estiver desligado */}
              {connectionLabel && (
                <Label className="text-sm font-medium" style={{ color: cfg.fieldTextColor || '#FFFFFF' }}>
                  {connectionLabel} {connectionIsRequired && <span className="text-red-500">*</span>}
                </Label>
              )}
              <Select 
                value={currentValue} 
                onValueChange={(value) => updateFieldValue((field as any).field_id, value)}
                modal={false}
              >
                <SelectTrigger 
                className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger" 
                  style={{ 
                    ...fieldStyle, 
                    ...(fontStyle||{}), 
                    ['--active-bc' as any]: cfg.borderColorActive, 
                    ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px`,
                    backgroundColor: cfg.fieldBgColor || '#FFFFFF',
                    color: cfg.fieldTextColor || '#000000',
                    padding: '12px',
                    width: '100%'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = cfg.borderColorActive || '#E50F5E';
                    e.currentTarget.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
                    e.currentTarget.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
                    
                    // Validação obrigatória
                    if (connectionIsRequired && !currentValue) {
                      e.currentTarget.setCustomValidity('Este campo é obrigatório');
                    } else {
                      e.currentTarget.setCustomValidity('');
                    }
                  }}
                >
                  <SelectValue placeholder={connectionPlaceholder} />
                </SelectTrigger>
                <SelectContent 
                  className="border-white/20 text-white select-content" 
                  style={{ 
                    ...(fontStyle||{}), 
                    ['--selBg' as any]: cfg.selectBgColor, 
                    ['--selFg' as any]: cfg.selectTextColor, 
                    fontSize: `${cfg.fontSizeInputPx || 16}px` 
                  }}
                >
                  <div className="p-2 text-sm text-center text-muted-foreground">Nenhuma opção disponível</div>
                </SelectContent>
              </Select>
            </div>
          );
        }
        
        debugLog('connection:render', { field_id: (field as any).field_id, hasItems, items: hasItems ? connectionItems!.length : connectionOptions.length });
        return (
          <div className="space-y-2">
            {/* Mostrar o label apenas quando toggle estiver desligado */}
            {connectionLabel && (
              <Label className="text-sm font-medium" style={{ color: cfg.fieldTextColor || '#FFFFFF' }}>
                {connectionLabel} {connectionIsRequired && <span className="text-red-500">*</span>}
              </Label>
            )}
            <Select 
              value={currentValue} 
              onValueChange={(value) => updateFieldValue((field as any).field_id, value)}
              modal={false}
            >
              <SelectTrigger 
                className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger" 
                style={{ 
                  ...fieldStyle, 
                  ...(fontStyle||{}), 
                  ['--active-bc' as any]: cfg.borderColorActive, 
                  ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px`,
                  backgroundColor: cfg.fieldBgColor || '#FFFFFF',
                  color: cfg.fieldTextColor || '#000000',
                  padding: '12px',
                  width: '100%'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = cfg.borderColorActive || '#E50F5E';
                  e.currentTarget.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
                  e.currentTarget.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
                  
                  // Validação obrigatória
                  if (connectionIsRequired && !currentValue) {
                    e.currentTarget.setCustomValidity('Este campo é obrigatório');
                  } else {
                    e.currentTarget.setCustomValidity('');
                  }
                }}
              >
                <SelectValue placeholder={connectionPlaceholder} />
              </SelectTrigger>
              <SelectContent 
                className="border-white/20 text-white select-content" 
                style={{ 
                  ...(fontStyle||{}), 
                  backgroundColor: cfg.fieldBgColor || '#FFFFFF',
                  ['--selBg' as any]: cfg.selectBgColor, 
                  ['--selFg' as any]: cfg.selectTextColor, 
                  fontSize: `${cfg.fontSizeInputPx || 16}px`,
                  zIndex: 2147483647,
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                {/* Área de pesquisa para campos de conexão */}
                <div className="p-2 border-b border-white/10 flex" style={{ backgroundColor: cfg.fieldBgColor || '#FFFFFF' }}>
                  <input
                    type="text"
                    placeholder="Pesquisar opções..."
                    value={fieldValues[`${(field as any).field_id}_search`] || ''}
                    onChange={(e) => updateFieldValue(`${(field as any).field_id}_search`, e.target.value)}
                    className="flex-1 h-9 px-3 rounded-md border focus:outline-none"
                    style={{
                      backgroundColor: cfg.fieldBgColor || '#FFFFFF',
                      fontSize: `${cfg.fontSizeInputPx || 16}px`,
                      color: cfg.fieldTextColor || '#000000',
                      borderColor: cfg.borderColorActive || '#E50F5E'
                    }}
                  />
                </div>
                {(hasItems ? connectionItems! : connectionOptions.map((label: string, i: number) => ({ id: String(i), label })))
                  .filter((item) => 
                  !fieldValues[`${(field as any).field_id}_search`] || 
                    item.label.toLowerCase().includes(fieldValues[`${(field as any).field_id}_search`]?.toLowerCase() || '')
                  )
                  .map((item) => (
                  <SelectItem 
                      key={item.id} 
                      value={item.id} 
                    className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)] select-item" 
                    style={{ 
                      ...(fontStyle||{}), 
                      fontSize: `${cfg.fontSizeInputPx || 16}px`,
                      '--selBg': cfg.selectBgColor || '#FFFFFF',
                      '--selFg': cfg.selectTextColor || '#000000'
                    } as React.CSSProperties}
                  >
                      {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'date':
        return (
          <Input
            {...commonProps}
            type="date"
            className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
            onFocus={(e) => {
              e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
              e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
              e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
            }}
          />
        );

      case 'time':
        return (
          <Input
            {...commonProps}
            type="time"
            className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
            onFocus={(e) => {
              e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
              e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
              e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
            }}
          />
        );

      case 'datetime':
        return (
          <Input
            {...commonProps}
            type="datetime-local"
            className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
            onFocus={(e) => {
              e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
              e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
              e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
            }}
          />
        );

      case 'slider':
        // Usar limites configurados no campo ou fallback para valores padrão
        const sliderConfig = (field as any).options?.split(',').map((opt: string) => parseInt(opt.trim())) || [0, 100, 1];
        const [min, max, step] = sliderConfig;
        const currentSliderValue = parseInt(currentValue) || min;
        const percentage = ((currentSliderValue - min) / (max - min)) * 100;
        
        return (
          <div className="space-y-2">
            {/* Slider e input com altura igual aos outros campos */}
            <div className="flex items-center space-x-3 h-12">
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={currentSliderValue}
                onChange={(e) => updateFieldValue((field as any).field_id, e.target.value)}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, ${cfg.borderColorActive || '#E50F5E'} 0%, ${cfg.borderColorActive || '#E50F5E'} ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
                  borderRadius: `${cfg.borderRadiusPx || 10}px`
                }}
              />
              <Input
                type="number"
                min={min}
                max={max}
                step={step}
                value={currentSliderValue}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || min;
                  const clampedValue = Math.min(Math.max(value, min), max);
                  updateFieldValue((field as any).field_id, clampedValue.toString());
                }}
                className="w-32 h-12 text-center text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                style={{
                  ...fieldStyle,
                  ...(fontStyle || {}),
                  ['--active-bc' as any]: cfg.borderColorActive,
                  ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px`
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
                  e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
                  e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
                }}
              />
            </div>
            
            <style>{`
              .slider::-webkit-slider-thumb {
                appearance: none;
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: ${cfg.borderColorActive || '#E50F5E'};
                cursor: pointer;
                border: 2px solid #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              .slider::-moz-range-thumb {
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: ${cfg.borderColorActive || '#E50F5E'};
                cursor: pointer;
                border: 2px solid #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
            `}</style>
          </div>
        );

      case 'url':
        return (
          <Input
            {...commonProps}
            type="url"
            className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
            onFocus={(e) => {
              e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
              e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
              e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
            }}
            onChange={(e) => {
              let value = e.target.value;
              // Converter para minúsculas e remover caracteres inválidos
              value = value.toLowerCase();
              // Permitir apenas caracteres válidos para URL
              value = value.replace(/[^a-z0-9\-._~:/?#[\]@!$&'()*+,;=%]/g, '');
              updateFieldValue((field as any).field_id, value);
            }}
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            type="text"
            className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border select-trigger"
            onFocus={(e) => {
              e.target.style.borderColor = cfg.borderColorActive || '#E50F5E';
              e.target.style.borderWidth = `${cfg.borderWidthFocusPx || 2}px`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cfg.borderColorNormal || '#D1D5DB';
              e.target.style.borderWidth = `${cfg.borderWidthNormalPx || 1}px`;
            }}
          />
        );
    }
  };

  // Função para submeter o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep < totalSteps) {
      goToNextStep();
      return;
    }

    // Validar todos os campos obrigatórios antes do envio final
    const allRequiredFields = formFields.filter(field => field.is_required);
    const missingFields: string[] = [];
    
    allRequiredFields.forEach(field => {
      const value = fieldValues[field.field_id];
      const isEmpty = !value || 
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0);
      
      if (isEmpty) {
        missingFields.push(field.field_name || field.field_id);
      }
    });
    
    if (missingFields.length > 0) {
      toast({
        title: 'Campos obrigatórios',
        description: `Por favor, preencha os seguintes campos: ${missingFields.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    
    try {
      // Salvar lead diretamente no Supabase
      const formId = (formData as any)?.id || (formData as any)?.form_id || (fieldValues as any)?.formId || '';
      
      // Buscar informações do formulário para determinar a origem
      let origemFinal = 'formulario'; // fallback padrão
      
      if (formId) {
        const { data: formInfo } = await supabase
          .from('lead_forms')
          .select('is_base_form, default_origin_id, lead_origins!lead_forms_default_origin_id_fkey(name)')
          .eq('id', formId)
          .single();
        
        if (formInfo) {
          if (formInfo.is_base_form) {
            // Regra 2: Formulário base - usar origem do campo "Conexão" tipo "origens"
            const connectionField = formFields.find(f => 
              f.field_type === 'connection' && 
              f.connection_list === 'origens'
            );
            
            if (connectionField && fieldValues[connectionField.field_id]) {
              // Buscar nome da origem pelo ID
              const { data: originData } = await supabase
                .from('lead_origins')
                .select('name')
                .eq('id', fieldValues[connectionField.field_id])
                .eq('company_id', (formData as any).company_id)
                .single();
              
              if (originData?.name) {
                origemFinal = originData.name;
              }
            }
          } else {
            // Regra 1: Formulário normal - usar origem definida em "Definir origem"
            if (formInfo.lead_origins?.name) {
              origemFinal = formInfo.lead_origins.name;
            } else if (formInfo.default_origin_id) {
              // Fallback para default_origin_id se não tiver nome
              const { data: originData } = await supabase
                .from('lead_origins')
                .select('name')
                .eq('id', formInfo.default_origin_id)
                .single();
              
              if (originData?.name) {
                origemFinal = originData.name;
              }
            }
          }
        }
      }
      
      // Sistema auto-contido de captura de dados de tracking
      const captureTrackingData = () => {
        console.log('🔍 Debug - parentTrackingData:', parentTrackingData);
        
        // Prioridade 1: Usar dados já capturados pelo sistema auto-contido
        if (parentTrackingData.parentUrl || parentTrackingData.url) {
          try {
            const parentUrl = parentTrackingData.parentUrl || parentTrackingData.url;
            const parentUrlObj = new URL(parentUrl);
            const parentParams = new URLSearchParams(parentUrlObj.search);
            
            const trackingData = {
              url: parentUrl,
              urlParams: parentParams.toString(),
              utmSource: parentTrackingData.utmSource || parentParams.get('utm_source') || '',
              utmMedium: parentTrackingData.utmMedium || parentParams.get('utm_medium') || '',
              utmCampaign: parentTrackingData.utmCampaign || parentParams.get('utm_campaign') || '',
              utmContent: parentTrackingData.utmContent || parentParams.get('utm_content') || '',
              utmTerm: parentTrackingData.utmTerm || parentParams.get('utm_term') || '',
              gclid: parentTrackingData.gclid || parentParams.get('gclid') || '',
              fbclid: parentTrackingData.fbclid || parentParams.get('fbclid') || '',
              fbc: parentTrackingData.fbc || '',
              fbp: parentTrackingData.fbp || '',
              fbid: parentTrackingData.fbid || ''
            };
            
            console.log('📊 Using auto-captured parent data:', trackingData);
            return trackingData;
          } catch (e) {
            console.log('⚠️ Error parsing parent tracking data:', e);
          }
        }

        // Prioridade 2: Tentar acessar window.parent.location diretamente
        try {
          if (window.parent && window.parent !== window && window.parent.location) {
            const parentUrl = window.parent.location.href;
            const parentParams = new URLSearchParams(window.parent.location.search);
            
            const trackingData = {
              url: parentUrl,
              urlParams: parentParams.toString(),
              utmSource: parentParams.get('utm_source') || '',
              utmMedium: parentParams.get('utm_medium') || '',
              utmCampaign: parentParams.get('utm_campaign') || '',
              utmContent: parentParams.get('utm_content') || '',
              utmTerm: parentParams.get('utm_term') || '',
              gclid: parentParams.get('gclid') || '',
              fbclid: parentParams.get('fbclid') || '',
              fbc: '',
              fbp: '',
              fbid: ''
            };
            
            console.log('📊 Using direct parent.location access:', trackingData);
            return trackingData;
          }
        } catch (e) {
          console.log('⚠️ Cannot access parent.location (CORS):', e.message);
        }

        // Prioridade 3: Usar document.referrer como fallback
        try {
          if (document.referrer && document.referrer !== window.location.href) {
            const referrerUrl = new URL(document.referrer);
            const referrerParams = new URLSearchParams(referrerUrl.search);
            
            const trackingData = {
              url: document.referrer,
              urlParams: referrerParams.toString(),
              utmSource: referrerParams.get('utm_source') || '',
              utmMedium: referrerParams.get('utm_medium') || '',
              utmCampaign: referrerParams.get('utm_campaign') || '',
              utmContent: referrerParams.get('utm_content') || '',
              utmTerm: referrerParams.get('utm_term') || '',
              gclid: referrerParams.get('gclid') || '',
              fbclid: referrerParams.get('fbclid') || '',
              fbc: '',
              fbp: '',
              fbid: ''
            };
            
            console.log('📊 Using document.referrer fallback:', trackingData);
            return trackingData;
          }
        } catch (e) {
          console.log('⚠️ Cannot parse document.referrer:', e.message);
        }

        // Fallback final: usar URL atual do iframe
        const currentParams = new URLSearchParams(window.location.search);
        const trackingData = {
          url: window.location.href,
          urlParams: currentParams.toString(),
          utmSource: currentParams.get('utm_source') || '',
          utmMedium: currentParams.get('utm_medium') || '',
          utmCampaign: currentParams.get('utm_campaign') || '',
          utmContent: currentParams.get('utm_content') || '',
          utmTerm: currentParams.get('utm_term') || '',
          gclid: currentParams.get('gclid') || '',
          fbclid: currentParams.get('fbclid') || '',
          fbc: '',
          fbp: '',
          fbid: ''
        };
        
        console.log('📊 Using iframe URL as final fallback:', trackingData);
        return trackingData;
      };

      const trackingData = captureTrackingData();

      // Função para limpar telefone (remover formatação e manter apenas números com DDI)
      const cleanPhoneNumber = (phone: string) => {
        if (!phone) return '';
        
        // Remover todos os caracteres não numéricos
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Se o telefone já tem DDI (começa com 55 e tem pelo menos 12 dígitos)
        if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
          return cleanPhone;
        } else if (cleanPhone.length === 11) {
          // Telefone brasileiro sem DDI - adicionar +55
          return '55' + cleanPhone;
        } else if (cleanPhone.length === 10) {
          // Telefone brasileiro sem DDI - adicionar +55
          return '55' + cleanPhone;
        } else {
          // Para outros casos, retornar como está
          return cleanPhone;
        }
      };

      const leadData = {
        company_id: (formData as any).company_id,
        nome: fieldValues.nome || fieldValues.name || '',
        email: fieldValues.email || '',
        telefone: cleanPhoneNumber(fieldValues.telefone || fieldValues.phone || ''),
        origem: origemFinal,
        fonte: 'internal_form',
        ip: '',
        browser: navigator.userAgent || '',
        device: 'Desktop',
        pais: 'Brasil',
        url: trackingData.url,
        utm_campaign: trackingData.utmCampaign,
        utm_medium: trackingData.utmMedium,
        utm_content: trackingData.utmContent,
        utm_source: trackingData.utmSource,
        utm_term: trackingData.utmTerm,
        gclid: trackingData.gclid,
        fbclid: trackingData.fbclid,
        fbc: trackingData.fbc,
        fbp: trackingData.fbp,
        fbid: trackingData.fbid,
        formulario_cadastro: (formData as any).name || 'Formulário',
        form_id: formId
        // parametros removido: dados customizados agora vão para lead_field_values
      };

      console.log('💾 ===== SALVANDO DADOS NO BANCO DE DADOS =====');
      console.log('💾 ID do formulário:', leadData.form_id || 'N/A');
      console.log('💾 Nome do formulário:', leadData.formulario_cadastro || 'N/A');
      console.log('💾 Telefone original:', fieldValues.telefone || fieldValues.phone || 'N/A');
      console.log('💾 Telefone limpo:', leadData.telefone || 'N/A');
      console.log('💾 URL:', leadData.url || 'N/A');
      console.log('💾 utm_source:', leadData.utm_source || 'N/A');
      console.log('💾 utm_medium:', leadData.utm_medium || 'N/A');
      console.log('💾 utm_campaign:', leadData.utm_campaign || 'N/A');
      console.log('💾 utm_content:', leadData.utm_content || 'N/A');
      console.log('💾 utm_term:', leadData.utm_term || 'N/A');
      console.log('💾 gclid:', leadData.gclid || 'N/A');
      console.log('💾 fbclid:', leadData.fbclid || 'N/A');
      console.log('💾 fbc:', leadData.fbc || 'N/A');
      console.log('💾 fbp:', leadData.fbp || 'N/A');
      console.log('💾 fbid:', leadData.fbid || 'N/A');

      // Distribuição automática de leads
      let distributionResult = null;
      if (formData.company_id) {
        try {
          console.log('🎯 Iniciando distribuição automática...');
          console.log('🎯 Form ID:', formId);
          console.log('🎯 Company ID:', formData.company_id);
          
          // Extrair email e telefone dos dados do formulário
          const leadEmail = formData.email || '';
          const leadTelefone = formData.telefone || '';
          
          distributionResult = await distributeLead(formId, formData.company_id, leadEmail, leadTelefone);
          
          if (distributionResult) {
            leadData.responsible_id = distributionResult.responsible_id;
            leadData.responsavel = distributionResult.responsible_name;
            console.log('🎯 Lead distribuído para:', distributionResult.responsible_name);
            console.log('🎯 ID do responsável:', distributionResult.responsible_id);
            console.log('🎯 Dados do lead atualizados:', leadData);
          } else {
            console.log('ℹ️ Nenhuma distribuição configurada para este formulário');
          }
        } catch (error) {
          console.error('❌ Erro na distribuição automática:', error);
          // Continua sem distribuição em caso de erro
        }
      } else {
        console.log('⚠️ Company ID não encontrado, pulando distribuição');
      }

      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (leadError) {
        console.error('Erro ao criar lead:', leadError);
        throw new Error('Erro ao salvar lead');
      }

      console.log('✅ Lead salvo no banco de dados com sucesso!');
      console.log('✅ Lead ID:', lead.id);
      console.log('✅ ID do formulário:', leadData.form_id);
      console.log('✅ Nome do formulário:', leadData.formulario_cadastro);
      console.log('✅ Dados de tracking salvos:', {
        url: leadData.url,
        utm_source: leadData.utm_source,
        utm_medium: leadData.utm_medium,
        utm_campaign: leadData.utm_campaign,
        utm_content: leadData.utm_content,
        utm_term: leadData.utm_term,
        gclid: leadData.gclid,
        fbclid: leadData.fbclid,
        fbc: leadData.fbc,
        fbp: leadData.fbp,
        fbid: leadData.fbid
      });

      // Salvar campos customizados se existirem
      if (Object.keys(fieldValues).length > 0) {
        const customFields = Object.entries(fieldValues).map(([fieldId, value]) => {
          // Limpar telefone se for um campo de telefone
          let cleanValue = value;
          if (fieldId === 'telefone' || fieldId === 'phone' || 
              (typeof value === 'string' && /^[\d\s\(\)\-\+]+$/.test(value) && value.length >= 10)) {
            cleanValue = cleanPhoneNumber(String(value));
            console.log('📞 Campo de telefone customizado limpo:', { fieldId, original: value, cleaned: cleanValue });
          }
          
          return {
            lead_id: lead.id,
            field_id: fieldId,
            value_text: typeof cleanValue === 'string' ? cleanValue : JSON.stringify(cleanValue),
            created_at: new Date().toISOString()
          };
        });

        if (customFields.length > 0) {
          const { error: customError } = await supabase
            .from('lead_field_values')
            .insert(customFields);

          if (customError) {
            console.error('Erro ao salvar campos customizados:', customError);
            // Não falha o processo principal se os campos customizados falharem
          }
        }
      }

      // Disparar integrações (webhooks, pixels, analytics)
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Debug - Iniciando processamento de integrações:', {
            formId,
            fieldValues,
            companyName: (formData as any).company_name || 'Empresa',
            formName: (formData as any).name || 'Formulário'
          });
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Debug - Dados do formulário:', formData);
          console.log('🔍 Debug - Valores dos campos:', fieldValues);
          console.log('🔍 Debug - document.referrer:', document.referrer);
          console.log('🔍 Debug - window.location.href:', window.location.href);
          console.log('🔍 Debug - document.cookie:', document.cookie);
          console.log('🔍 Debug - window.parent:', window.parent);
          console.log('🔍 Debug - window.parent.location:', window.parent?.location);
        }
        
        console.log('🚀 Debug - Iniciando processamento de integrações');
        console.log('🚀 Debug - formId:', formId);
        console.log('🚀 Debug - fieldValues:', fieldValues);
        console.log('🚀 Debug - company_name:', (formData as any).company_name || 'Empresa');
        console.log('🚀 Debug - form_name:', (formData as any).name || 'Formulário');
        
        // Capturar dados de tracking para integrações usando dados da página pai
        const trackingData = captureTrackingData();
        
        console.log('📊 ===== DADOS DE TRACKING PARA INTEGRAÇÕES =====');
        console.log('📊 URL:', trackingData.url);
        console.log('📊 utm_source:', trackingData.utmSource || 'N/A');
        console.log('📊 utm_medium:', trackingData.utmMedium || 'N/A');
        console.log('📊 utm_campaign:', trackingData.utmCampaign || 'N/A');
        console.log('📊 utm_content:', trackingData.utmContent || 'N/A');
        console.log('📊 utm_term:', trackingData.utmTerm || 'N/A');
        console.log('📊 gclid:', trackingData.gclid || 'N/A');
        console.log('📊 fbclid:', trackingData.fbclid || 'N/A');
        console.log('📊 fbc:', trackingData.fbc || 'N/A');
        console.log('📊 fbp:', trackingData.fbp || 'N/A');
        console.log('📊 fbid:', trackingData.fbid || 'N/A');
        
        // Adicionar origem aos dados de tracking
        const trackingDataWithOrigin = {
          ...trackingData,
          origem: origemFinal,
          responsible_id: distributionResult?.responsible_id || '',
          responsible_name: distributionResult?.responsible_name || ''
        };

        await integrationService.processFormIntegrations(
          formId,
          fieldValues,
          (formData as any).company_name || 'Empresa',
          (formData as any).name || 'Formulário',
          trackingDataWithOrigin,
          companyTimezone,
          lead.id // NOVO: Passar ID do lead
        );
        
        console.log('✅ Debug - Processamento de integrações concluído');
        
        console.log('✅ Debug - Integrações processadas com sucesso');
      } catch (integrationError) {
        console.error('❌ Debug - Erro ao processar integrações:', integrationError);
        // Não falhar o processo principal se as integrações falharem
      }
      
      console.log('🔍 Debug - Continuando após processamento de integrações');

      // Verificar se redirecionamento está habilitado
      console.log('🔍 Debug - Verificando configurações de redirecionamento');
      console.log('Configurações de redirecionamento:', {
        redirectEnabled: cfg.redirectEnabled,
        redirectUrl: cfg.redirectUrl,
        cfg: cfg
      });
      
      if (cfg.redirectEnabled && cfg.redirectUrl) {
        // Redirecionar para a URL configurada na página pai
        console.log('🔍 Debug - Redirecionamento habilitado, iniciando redirecionamento');
        console.log('Redirecionando para:', cfg.redirectUrl);
        try {
          // Tentar redirecionar a página pai (onde o iframe está embedado)
          window.top.location.href = cfg.redirectUrl;
        } catch (error) {
          // Se não conseguir acessar window.top (devido a CORS), usar window.parent
          try {
            window.parent.location.href = cfg.redirectUrl;
          } catch (parentError) {
            // Como último recurso, usar postMessage para comunicar com a página pai
            console.warn('Não foi possível redirecionar diretamente, usando postMessage');
            try {
              window.parent.postMessage({
                type: 'REDIRECT',
                url: cfg.redirectUrl
              }, '*');
              console.log('🔍 Debug - Mensagem de redirecionamento enviada via postMessage');
            } catch (postMessageError) {
              // Como último recurso, redirecionar o próprio iframe
              console.warn('PostMessage falhou, redirecionando o iframe');
              window.location.href = cfg.redirectUrl;
            }
          }
        }
      } else {
        // Mostrar modal de sucesso se redirecionamento não estiver habilitado
        console.log('🔍 Debug - Redirecionamento desabilitado, mostrando modal de sucesso');
        console.log('Redirecionamento desabilitado, mostrando modal de sucesso');
        console.log('🔍 Debug - setShowSuccessModal(true) chamado');
        setShowSuccessModal(true);
        console.log('🔍 Debug - Modal deve estar visível agora');
        
        // Verificar se o modal foi renderizado após um pequeno delay
        setTimeout(() => {
          const modalElement = document.querySelector('[data-modal="success"]');
          if (modalElement) {
            console.log('🔍 Debug - Modal encontrado no DOM:', modalElement);
            console.log('🔍 Debug - Modal background-color:', modalElement.style.backgroundColor);
            console.log('🔍 Debug - Modal computed background-color:', window.getComputedStyle(modalElement).backgroundColor);
          } else {
            console.log('🔍 Debug - Modal NÃO encontrado no DOM');
          }
        }, 100);
      }

      // Limpar formulário
      setFieldValues({});
      setCurrentStep(1);
      
      // Finalizar submissão
      setSubmitting(false);

    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setSubmitting(false);
      toast({
        title: 'Erro',
        description: 'Erro ao enviar formulário. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={props?.embedded ? "p-2" : "min-h-screen flex items-center justify-center bg-gray-50"}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className={props?.embedded ? "p-2" : "min-h-screen flex items-center justify-center bg-gray-50"}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Formulário não encontrado</h1>
          <p className="text-gray-600">O formulário solicitado não existe ou está inativo.</p>
        </div>
      </div>
    );
  }

  const currentStepFields = getFieldsForCurrentStep();
  const buttonText = currentStep === totalSteps 
    ? (formData.button_text || 'Enviar')
    : (formFields.find(f => f.is_division && f.division_step === currentStep)?.division_button_text || 'Próxima');

  const cfg = formData.style_config || {};
  const fontStyle = cfg.previewFont ? { fontFamily: `${cfg.previewFont}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'` } : undefined;
  const labelStyle = { ...(fontStyle || {}), fontSize: `${cfg.fontSizeLabelPx || 14}px`, marginBottom: `${cfg.spacingLabelPx || 8}px` } as React.CSSProperties;
  const inputStyle = { ...(fontStyle || {}), fontSize: `${cfg.fontSizeInputPx || 16}px` } as React.CSSProperties;
  const fieldStyle = {
    ...inputStyle,
    backgroundColor: cfg.fieldBgColor || '#FFFFFF',
    color: cfg.fieldTextColor || '#000000',
    borderColor: cfg.borderColorNormal || '#D1D5DB',
    borderWidth: cfg.borderWidthNormalPx || 1,
    borderStyle: 'solid',
    borderRadius: cfg.borderRadiusPx || 8,
  } as React.CSSProperties;
  const normalButtonBg = `linear-gradient(${cfg.btnAngle || 180}deg, ${cfg.btnBg1 || '#E50F5E'}, ${cfg.btnBg2 || '#7c032e'})`;
  const activeButtonBg = `linear-gradient(${cfg.btnAngleActive || 90}deg, ${cfg.btnBgActive1 || '#E50F5E'}, ${cfg.btnBgActive2 || '#7c032e'})`;
  const selectorVars = ({ 
    ['--selBg']: cfg.selectBgColor || '#FFFFFF', 
    ['--selFg']: cfg.selectTextColor || '#000000', 
    ['--active-bc']: cfg.borderColorActive || '#E50F5E', 
    ['--baseBg']: cfg.fieldBgColor || '#FFFFFF', 
    ['--baseFg']: cfg.fieldTextColor || '#000000', 
    ['--progress-bg']: cfg.fieldBgColor || '#E5E7EB', 
    ['--progress-fill']: cfg.borderColorActive || '#E50F5E',
    ['--select-placeholder-text']: 'Selecione uma opção',
    ['--button-bg']: normalButtonBg,
    ['--button-text']: cfg.btnText || '#FFFFFF',
    ['--button-radius']: `${cfg.btnRadius || 8}px`,
    ['--button-border-width']: `${cfg.btnBorderWidth || 0}px`,
    ['--button-border-color']: cfg.btnBorderColor || 'transparent',
    ['--button-bg-hover']: normalButtonBg,
    ['--button-text-hover']: cfg.btnText || '#FFFFFF',
    ['--button-border-width-hover']: `${cfg.btnBorderWidth || 0}px`,
    ['--button-border-color-hover']: cfg.btnBorderColor || 'transparent',
    ['--button-bg-active']: activeButtonBg,
    ['--button-text-active']: cfg.btnTextActive || cfg.btnText || '#FFFFFF',
    ['--button-border-width-active']: `${cfg.btnBorderWidthActive || cfg.btnBorderWidth || 0}px`,
    ['--button-border-color-active']: cfg.btnBorderColorActive || cfg.btnBorderColor || 'transparent'
  } as unknown) as React.CSSProperties;

  // (removido) efeito duplicado — agora feito apenas no topo para manter ordem estável
  const buttonStyle = {
    ...(fontStyle || {}),
    fontSize: `${cfg.fontSizeButtonPx || 16}px`,
    marginTop: `${cfg.buttonSpacingPx || 16}px`,
    backgroundImage: normalButtonBg,
    color: cfg.btnText || '#FFFFFF',
    borderRadius: cfg.btnRadius || 8,
    borderWidth: cfg.btnBorderWidth || 0,
    borderColor: cfg.btnBorderColor || 'transparent',
    borderStyle: 'solid',
  } as React.CSSProperties;

  return (
    <div 
      className={props?.embedded ? "embedded-form-root w-full" : "w-full"}
      style={{
        backgroundColor: 'transparent',
        background: 'transparent',
        fontFamily: cfg.fontFamily || 'inherit',
        padding: '0px',
        boxShadow: 'none',
        minHeight: 'auto'
      }}
    >
      <div className="w-full bp-form-root" style={{ backgroundColor: 'transparent', background: 'transparent', backgroundImage: 'none' }}>
        <div style={{ ...fontStyle, ...selectorVars, backgroundColor: 'transparent', background: 'transparent', backgroundImage: 'none', color: 'inherit', padding: '0px' }}>
          {/* CSS auxiliar para borda de foco com variável controlada */}
          <style>{`
            .focus-border:focus { border-color: var(--active-bc) !important; border-width: var(--focus-bw, 2px) !important; }
            
            /* Escopo embed: neutralizar fundos apenas no wrapper local */
            .embedded-form-root, .embedded-form-root * {
              background-color: transparent !important;
              background: transparent !important;
              background-image: none !important;
              overflow: visible !important; /* evitar recorte do dropdown por containers */
            }
            
            /* Forçar transparência e padding zero no container principal */
            .embedded-form-root {
              background-color: transparent !important;
              background: transparent !important;
              background-image: none !important;
              padding: 0px !important;
            }
            
            /* Sobrescrever qualquer cor de fundo específica */
            .embedded-form-root[style*="background-color"],
            .embedded-form-root[style*="background"],
            .embedded-form-root *[style*="background-color"],
            .embedded-form-root *[style*="background"] {
              background-color: transparent !important;
              background: transparent !important;
              background-image: none !important;
            }
            
            /* Forçar transparência em todos os containers */
            .embedded-form-root .bp-form-root,
            .embedded-form-root .p-6,
            .embedded-form-root .space-y-2,
            .embedded-form-root .space-y-4,
            .embedded-form-root .space-y-6,
            .embedded-form-root div,
            .embedded-form-root form,
            .embedded-form-root section,
            .embedded-form-root article {
              background-color: transparent !important;
              background: transparent !important;
              padding: 0px !important;
            }
            
            /* Forçar transparência em elementos específicos */
            .embedded-form-root .w-full,
            .embedded-form-root .bp-form-root,
            .embedded-form-root [class*="space-y"],
            .embedded-form-root [class*="p-"] {
              background-color: transparent !important;
              background: transparent !important;
              background-image: none !important;
              padding: 0px !important;
            }
            
            /* Sobrescrever especificamente a cor #131313 */
            .embedded-form-root *[style*="#131313"],
            .embedded-form-root *[style*="rgb(19, 19, 19)"],
            .embedded-form-root *[style*="background-color: #131313"],
            .embedded-form-root *[style*="background: #131313"] {
              background-color: transparent !important;
              background: transparent !important;
              background-image: none !important;
            }
            
            /* Forçar transparência em elementos com classes dark */
            .embedded-form-root .dark,
            .embedded-form-root [class*="dark:"],
            .embedded-form-root .bg-background,
            .embedded-form-root .dark\\:bg-\\[\\#131313\\] {
              background-color: transparent !important;
              background: transparent !important;
              background-image: none !important;
            }
            
            /* Forçar transparência em elementos com CSS variables */
            .embedded-form-root * {
              background-color: transparent !important;
              background: transparent !important;
              background-image: none !important;
            }
            
            /* Preservar APENAS o fundo dos campos de entrada (somente dentro do embed) */
            .embedded-form-root input[type="text"],
            .embedded-form-root input[type="email"], 
            .embedded-form-root input[type="tel"],
            .embedded-form-root input[type="number"],
            .embedded-form-root textarea,
            .embedded-form-root select,
            .embedded-form-root input[class*="focus-border"],
            .embedded-form-root [class*="SelectTrigger"],
            .embedded-form-root [class*="select"],
            .embedded-form-root button[type="submit"] {
              background-color: var(--baseBg, #FFFFFF) !important;
            }
            
            /* Preservar fundo dos botões com gradiente */
            .embedded-form-root button[type="submit"] {
              background: var(--button-bg, linear-gradient(180deg, #E50F5E, #7c032e)) !important;
              background-image: var(--button-bg, linear-gradient(180deg, #E50F5E, #7c032e)) !important;
              color: var(--button-text, #FFFFFF) !important;
              border-radius: var(--button-radius, 8px) !important;
              border-width: var(--button-border-width, 0px) !important;
              border-color: var(--button-border-color, transparent) !important;
              border-style: solid !important;
            }
            
            /* Estados do botão */
            .embedded-form-root button[type="submit"]:hover {
              background: var(--button-bg-hover, var(--button-bg, linear-gradient(180deg, #E50F5E, #7c032e))) !important;
              background-image: var(--button-bg-hover, var(--button-bg, linear-gradient(180deg, #E50F5E, #7c032e))) !important;
              color: var(--button-text-hover, var(--button-text, #FFFFFF)) !important;
              border-width: var(--button-border-width-hover, var(--button-border-width, 0px)) !important;
              border-color: var(--button-border-color-hover, var(--button-border-color, transparent)) !important;
            }
            
            .embedded-form-root button[type="submit"]:active {
              background: var(--button-bg-active, var(--button-bg, linear-gradient(180deg, #E50F5E, #7c032e))) !important;
              background-image: var(--button-bg-active, var(--button-bg, linear-gradient(180deg, #E50F5E, #7c032e))) !important;
              color: var(--button-text-active, var(--button-text, #FFFFFF)) !important;
              border-width: var(--button-border-width-active, var(--button-border-width, 0px)) !important;
              border-color: var(--button-border-color-active, var(--button-border-color, transparent)) !important;
            }
            
            /* Estilo específico para barra de progresso */
            .embedded-form-root .progress-bar-container {
              background-color: var(--progress-bg, #E5E7EB) !important;
            }
            
            .embedded-form-root .progress-bar-fill {
              background-color: var(--progress-fill, #E50F5E) !important;
            }
            
            /* Estilo específico para campos de seleção */
            .embedded-form-root [data-radix-select-trigger] {
              background-color: var(--baseBg, #FFFFFF) !important;
            }
            
            .embedded-form-root .select-trigger {
              background-color: var(--baseBg, #FFFFFF) !important;
            }
            
            /* Estilo específico para menu dropdown */
            .embedded-form-root [data-radix-select-content] {
              background-color: var(--baseBg, #FFFFFF) !important;
              z-index: 9999 !important; /* z-index menor para ficar dentro do iframe */
              overflow: visible !important;
              /* Manter dropdown dentro do iframe */
              position: fixed !important;
              left: auto !important;
              right: auto !important;
              width: auto !important;
              min-width: auto !important;
              transform: none !important;
            }
            
            .embedded-form-root .select-content {
              background-color: var(--baseBg, #FFFFFF) !important;
              overflow: visible !important;
            }
            
            /* Estilo específico para área de pesquisa */
            .embedded-form-root .select-content .p-2 {
              background-color: var(--baseBg, #FFFFFF) !important;
            }
            
            .embedded-form-root .select-content input {
              background-color: var(--baseBg, #FFFFFF) !important;
              color: var(--baseFg, #000000) !important;
            }
            
            /* Estilo específico para container de opções */
            .embedded-form-root .select-content > div:not(.p-2) {
              background-color: var(--baseBg, #FFFFFF) !important;
            }
            
            /* Estilo específico para opções do dropdown */
            .embedded-form-root [data-radix-select-item] {
              background-color: var(--baseBg, #FFFFFF) !important;
              color: var(--baseFg, #000000) !important;
            }
            
            .embedded-form-root [data-radix-select-item]:hover,
            .embedded-form-root [data-radix-select-item][data-highlighted] {
              background-color: var(--selBg, #E50F5E) !important;
              color: var(--selFg, #FFFFFF) !important;
            }
            
            .embedded-form-root .select-item {
              background-color: var(--baseBg, #2A2A2A) !important;
            }
            
            .embedded-form-root .select-item:hover,
            .embedded-form-root .select-item[data-highlighted] {
              background-color: var(--selBg, #E50F5E) !important;
              color: var(--selFg, #FFFFFF) !important;
            }

            /* Regras GLOBAIS para o portal do Radix (fora do escopo do embed) */
            [data-radix-select-content] { 
              background-color: var(--baseBg, #FFFFFF) !important; 
              color: var(--baseFg, #000000) !important;
              z-index: 9999 !important; /* z-index menor para ficar dentro do iframe */
              overflow: visible !important;
              /* Manter dropdown dentro do iframe */
              position: fixed !important;
              left: auto !important;
              right: auto !important;
              width: auto !important;
              min-width: auto !important;
            }
            
            /* Regras GLOBAIS para forçar transparência em iframes */
            iframe[src*="/form/"] {
              background-color: transparent !important;
              background: transparent !important;
              background-image: none !important;
            }
            
            /* Sobrescrever qualquer fundo escuro global */
            body.dark iframe[src*="/form/"],
            html.dark iframe[src*="/form/"],
            .dark iframe[src*="/form/"] {
              background-color: transparent !important;
              background: transparent !important;
              background-image: none !important;
            }
            
            /* DEBUG: Log CSS aplicado */
            .embedded-form-root::before {
              content: "DEBUG: CSS carregado";
              position: fixed;
              top: 0;
              left: 0;
              background: red;
              color: white;
              padding: 2px;
              font-size: 10px;
              z-index: 999999;
            }
            [data-radix-select-content] .p-2 { 
              background-color: var(--baseBg, #FFFFFF) !important; 
            }
            [data-radix-select-content] input { 
              background-color: var(--baseBg, #FFFFFF) !important; 
              color: var(--baseFg, #000000) !important; 
              border-color: var(--active-bc, #E50F5E) !important;
            }
            [data-radix-select-content] [data-radix-select-item] { 
              background-color: var(--baseBg, #FFFFFF) !important; 
              color: var(--baseFg, #000000) !important; 
            }
            [data-radix-select-content] [data-radix-select-item][data-highlighted] { 
              background-color: var(--selBg, #E50F5E) !important;
              color: var(--selFg, #FFFFFF) !important;
            }
            
            /* Estilo específico para dropdown de telefone */
            .phone-dropdown-content {
              background-color: var(--baseBg, #2A2A2A) !important;
            }
            
            .phone-dropdown-item {
              background-color: var(--baseBg, #2A2A2A) !important;
            }
            
            .phone-dropdown-item:hover {
              background-color: var(--selBg, #E50F5E) !important;
              color: var(--selFg, #FFFFFF) !important;
            }
            
            /* Estilo específico para DropdownMenuContent do telefone */
            [data-radix-dropdown-menu-content] {
              background-color: var(--baseBg, #2A2A2A) !important;
            }
            
            [data-radix-dropdown-menu-item] {
              background-color: var(--baseBg, #2A2A2A) !important;
            }
            
            [data-radix-dropdown-menu-item]:hover {
              background-color: var(--selBg, #E50F5E) !important;
              color: var(--selFg, #FFFFFF) !important;
            }
            
            /* Estilo específico para botão DDI do telefone */
            .landing-phone-container button {
              background-color: var(--baseBg, #2A2A2A) !important;
            }
            
            .landing-phone-container button:hover,
            .landing-phone-container button:focus {
              background-color: var(--selBg, #E50F5E) !important;
              color: var(--selFg, #FFFFFF) !important;
            }
            
            /* Estilo específico para input do telefone */
            .landing-phone-input {
              background-color: var(--baseBg, #2A2A2A) !important;
            }
            
            /* Estilo específico para opção selecionada no dropdown de telefone */
            .phone-dropdown-item[data-selected="true"] {
              background-color: var(--selBg, #E50F5E) !important;
              color: var(--selFg, #FFFFFF) !important;
            }
            
            /* Estilo específico para opção selecionada via Radix */
            [data-radix-dropdown-menu-item][data-selected="true"] {
              background-color: var(--selBg, #E50F5E) !important;
              color: var(--selFg, #FFFFFF) !important;
            }
            
            /* Estilo específico para hover no dropdown de telefone */
            .phone-dropdown-item:hover {
              background-color: var(--selBg, #E50F5E) !important;
              color: var(--selFg, #FFFFFF) !important;
            }
            
            /* Estilo específico para hover via Radix */
            [data-radix-dropdown-menu-item]:hover {
              background-color: var(--selBg, #E50F5E) !important;
              color: var(--selFg, #FFFFFF) !important;
            }
            
            /* Estilo da barra de pesquisa no dropdown de telefone */
            .phone-dropdown-content input {
              background-color: var(--baseBg, #2A2A2A) !important;
              color: var(--baseFg, #FFFFFF) !important;
              border-color: var(--active-bc, #E50F5E) !important;
            }
            
            .phone-dropdown-content input:focus {
              border-color: var(--active-bc, #E50F5E) !important;
            }
            
            /* Forçar placeholder correto no SelectValue */
            [data-radix-select-trigger] [data-radix-select-value] {
              color: var(--baseFg, #FFFFFF) !important;
            }
            
            [data-radix-select-trigger] [data-radix-select-placeholder] {
              color: var(--baseFg, #FFFFFF) !important;
            }
            
            /* Forçar placeholder específico */
            .select-trigger [data-radix-select-placeholder] {
              color: var(--baseFg, #FFFFFF) !important;
            }
            
            /* Sobrescrever texto padrão do Radix */
            [data-radix-select-trigger] [data-radix-select-placeholder]:before {
              content: attr(data-placeholder) !important;
            }
            
            /* Forçar placeholder específico baseado no toggle */
            [data-radix-select-trigger] [data-radix-select-placeholder] {
              content: var(--select-placeholder-text, "Selecione uma opção") !important;
            }
          `}</style>
          
          <script>{`
            // Notificar o iframe pai sobre mudanças de tamanho
            function notifyParentResize() {
              if (window.parent && window.parent !== window) {
                try {
                  // Encontrar todos os elementos visíveis
                  const allElements = document.querySelectorAll('*');
                  let maxBottom = 0;
                  
                  // Calcular a posição do último pixel visível
                  allElements.forEach(function(element) {
                    const rect = element.getBoundingClientRect();
                    const elementBottom = rect.bottom;
                    if (elementBottom > maxBottom) {
                      maxBottom = elementBottom;
                    }
                  });
                  
                  // Calcular altura do body e document
                  const bodyHeight = document.body.scrollHeight;
                  const documentHeight = document.documentElement.scrollHeight;
                  
                  // Encontrar o elemento com fundo colorido
                  const rootElement = document.getElementById('root') || document.body;
                  const rootRect = rootElement.getBoundingClientRect();
                  const rootBottom = rootRect.bottom;
                  
                  // Usar a maior altura encontrada
                  const calculatedHeight = Math.max(
                    bodyHeight, 
                    documentHeight, 
                    maxBottom,
                    rootBottom
                  );
                  
                  // Usar altura exata sem margem extra
                  const finalHeight = Math.max(150, Math.ceil(calculatedHeight));
                  
                  window.parent.postMessage({
                    type: 'resize',
                    height: finalHeight
                  }, '*');
                } catch (e) {
                }
              }
            }
            
            // Notificar quando o conteúdo carregar
            window.addEventListener('load', function() {
              setTimeout(notifyParentResize, 100);
            });
            
            // Múltiplas notificações para garantir que funcione
            const notifyAttempts = [200, 500, 1000, 1500, 2000];
            notifyAttempts.forEach(delay => {
              setTimeout(notifyParentResize, delay);
            });
            
            // Notificar quando o DOM mudar
            const observer = new MutationObserver(function() {
              setTimeout(notifyParentResize, 50);
            });
            observer.observe(document.body, {
              childList: true,
              subtree: true,
              attributes: true
            });
            
            // Detectar mudanças específicas em formulários multi-etapa
            const stepObserver = new MutationObserver(function(mutations) {
              let shouldResize = false;
              
              mutations.forEach(function(mutation) {
                // Detectar mudanças em elementos de formulário
                if (mutation.type === 'childList') {
                  mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                      // Ignorar elementos de dropdown
                      if (node.hasAttribute('data-radix-select-content') || 
                          node.hasAttribute('data-radix-dropdown-menu-content') ||
                          node.classList?.contains('select-content') ||
                          node.classList?.contains('phone-dropdown-content')) {
                        return; // Não redimensionar para dropdowns
                      }
                      
                      // Verificar se é um novo campo, botão ou etapa
                      if (node.tagName === 'INPUT' || node.tagName === 'SELECT' || 
                          node.tagName === 'BUTTON' || node.tagName === 'DIV' ||
                          node.classList?.contains('step') || node.classList?.contains('form-step')) {
                        shouldResize = true;
                      }
                    }
                  });
                  
                  mutation.removedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                      // Ignorar elementos de dropdown
                      if (node.hasAttribute('data-radix-select-content') || 
                          node.hasAttribute('data-radix-dropdown-menu-content') ||
                          node.classList?.contains('select-content') ||
                          node.classList?.contains('phone-dropdown-content')) {
                        return; // Não redimensionar para dropdowns
                      }
                      
                      // Verificar se um campo, botão ou etapa foi removido
                      if (node.tagName === 'INPUT' || node.tagName === 'SELECT' || 
                          node.tagName === 'BUTTON' || node.tagName === 'DIV' ||
                          node.classList?.contains('step') || node.classList?.contains('form-step')) {
                        shouldResize = true;
                      }
                    }
                  });
                }
                
                // Detectar mudanças de estilo que podem indicar mudança de etapa
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                  // Ignorar mudanças em elementos de dropdown
                  const target = mutation.target;
                  if (target && (
                      target.hasAttribute('data-radix-select-content') || 
                      target.hasAttribute('data-radix-dropdown-menu-content') ||
                      target.classList?.contains('select-content') ||
                      target.classList?.contains('phone-dropdown-content'))) {
                    return; // Não redimensionar para dropdowns
                  }
                  shouldResize = true;
                }
              });
              
              if (shouldResize) {
                setTimeout(notifyParentResize, 100);
              }
            });
            
            // Observar mudanças mais específicas para formulários multi-etapa
            stepObserver.observe(document.body, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ['style', 'class', 'data-step']
            });
            
            // Notificar quando a janela for redimensionada
            window.addEventListener('resize', function() {
              setTimeout(notifyParentResize, 100);
            });
            
            // Detectar cliques em botões que podem mudar etapas
            document.addEventListener('click', function(event) {
              const target = event.target;
              if (target && (target.tagName === 'BUTTON' || target.tagName === 'INPUT')) {
                // Verificar se é um botão de navegação entre etapas
                const buttonText = target.textContent?.toLowerCase() || '';
                const buttonValue = target.value?.toLowerCase() || '';
                
                if (buttonText.includes('próxima') || buttonText.includes('anterior') || 
                    buttonText.includes('next') || buttonText.includes('previous') ||
                    buttonText.includes('continuar') || buttonText.includes('voltar') ||
                    buttonValue.includes('próxima') || buttonValue.includes('anterior') ||
                    buttonValue.includes('next') || buttonValue.includes('previous') ||
                    buttonValue.includes('continuar') || buttonValue.includes('voltar')) {
                  
                  // Aguardar um pouco para a mudança de etapa acontecer
                  setTimeout(function() {
                    notifyParentResize();
                  }, 200);
                  
                  // Também verificar após mais tempo para garantir
                  setTimeout(function() {
                    notifyParentResize();
                  }, 500);
                }
              }
            });
            
            // Notificar periodicamente para garantir que a altura esteja correta
            setInterval(notifyParentResize, 1000);
          `}</script>
           <div className="flex flex-col" style={{ backgroundColor: 'transparent', background: 'transparent' }}>
             <form onSubmit={handleSubmit} className="space-y-6" style={{ backgroundColor: 'transparent', background: 'transparent' }}>

            {/* Espaçador dinâmico para abrir espaço ao dropdown quando necessário */}
            {selectSpacerHeight > 0 && (
              <div style={{ height: `${selectSpacerHeight}px` }}></div>
            )}

          {/* Indicador de progresso */}
          {totalSteps > 1 && (
            <div className="mb-6" style={{ backgroundColor: 'transparent', background: 'transparent' }}>
              <div 
                className="w-full rounded-full h-2 progress-bar-container"
                style={{ 
                  backgroundColor: cfg.fieldBgColor || '#2A2A2A',
                  borderRadius: `${cfg.borderRadiusPx || 8}px`
                }}
              >
                <div 
                  className="h-2 rounded-full transition-all duration-300 progress-bar-fill"
                  style={{ 
                    width: `${(currentStep / totalSteps) * 100}%`,
                    backgroundColor: cfg.borderColorActive || '#E50F5E',
                    borderRadius: `${cfg.borderRadiusPx || 8}px`
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Campos da etapa atual */}
          <div className="space-y-4">
            {currentStepFields.map((field, index) => {
              if (field.is_division) return null;
              
              // Usar a mesma lógica corrigida do renderField
              const hasCustomPlaceholder = (field as any).placeholder_text && 
                (field as any).placeholder_text !== "Selecione uma opção" && 
                (field as any).placeholder_text.trim() !== "";
              
              const label = (field as any).placeholder_enabled 
                ? null // Toggle ON: sem título
                : hasCustomPlaceholder ? (field as any).placeholder_text : (field as any).field_name; // Toggle OFF: usar placeholder_text se personalizado, senão field_name

              const isLastField = index === currentStepFields.length - 1;

              // Verificar se deve mostrar o label (não mostrar se placeholder está ativo)
              const shouldShowLabel = (field as any).field_type?.toLowerCase() !== 'checkbox' && 
                                    !((field as any).placeholder_enabled && (field as any).placeholder_text);

              return (
                <div key={(field as any).field_id} style={{ marginBottom: isLastField ? '0px' : `${cfg.spacingFieldsPx || 16}px` }}>
                  {/* Para campos de seleção, nome, email, telefone e conexão, não renderizar label aqui pois renderField já renderiza */}
                  {shouldShowLabel && (field as any).field_type !== 'select' && (field as any).field_type !== 'name' && (field as any).field_type !== 'email' && (field as any).field_type !== 'telefone' && (field as any).field_type !== 'phone' && (field as any).field_type !== 'connection' && (field as any).field_type !== 'conexao' && (field as any).field_type !== 'conexão' && (
                    <Label 
                      className="block mb-2"
                      style={{ ...labelStyle, ...(fontStyle || {}) }}
                    >
                      {label}
                      {(field as any).is_required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                  )}
                  {renderField(field)}
                </div>
              );
            })}
          </div>

          {/* Botão de envio */}
          <div style={{ paddingTop: `${cfg.buttonSpacingPx || 16}px`, marginTop: '0px' }}>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 font-semibold transition-all duration-300 shadow-lg"
              style={buttonStyle}
              onMouseDown={(e) => {
                (e.currentTarget.style as any).backgroundImage = activeButtonBg;
                (e.currentTarget.style as any).color = cfg.btnTextActive || cfg.btnText || '#FFFFFF';
                (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidthActive || cfg.btnBorderWidth || 0}px`;
                (e.currentTarget.style as any).borderColor = cfg.btnBorderColorActive || cfg.btnBorderColor || 'transparent';
              }}
              onMouseUp={(e) => {
                (e.currentTarget.style as any).backgroundImage = normalButtonBg;
                (e.currentTarget.style as any).color = cfg.btnText || '#FFFFFF';
                (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidth || 0}px`;
                (e.currentTarget.style as any).borderColor = cfg.btnBorderColor || 'transparent';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget.style as any).backgroundImage = normalButtonBg;
                (e.currentTarget.style as any).color = cfg.btnText || '#FFFFFF';
                (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidth || 0}px`;
                (e.currentTarget.style as any).borderColor = cfg.btnBorderColor || 'transparent';
              }}
            >
              {submitting ? 'Enviando...' : buttonText}
            </Button>
          </div>

          {/* Mensagem de segurança */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-4" style={{ backgroundColor: 'transparent', background: 'transparent' }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Seus dados estão seguros e protegidos</span>
          </div>
            </form>
          </div>
        </div>
      </div>

        {/* Modal de Sucesso */}
        {showSuccessModal && (
          console.log('🔍 Debug - Renderizando modal de sucesso'),
          <div 
            className="fixed inset-0 z-[9999]" 
            style={{ 
              backgroundColor: '#1F1F1F',
              background: '#1F1F1F',
              opacity: '1'
            }}
            data-modal="success"
            ref={(el) => {
              if (el) {
                console.log('🔍 Debug - Modal container criado:', el);
                console.log('🔍 Debug - Modal background-color:', el.style.backgroundColor);
                console.log('🔍 Debug - Modal computed style:', window.getComputedStyle(el).backgroundColor);
                
                // Forçar o fundo via JavaScript se CSS não funcionar
                el.style.setProperty('background-color', '#1F1F1F', 'important');
                el.style.setProperty('background', '#1F1F1F', 'important');
                el.style.setProperty('opacity', '1', 'important');
                
                console.log('🔍 Debug - Modal background-color após forçar:', el.style.backgroundColor);
                console.log('🔍 Debug - Modal computed style após forçar:', window.getComputedStyle(el).backgroundColor);
              }
            }}
          >
            <div className="flex items-center justify-center h-full">
              <div 
                className="rounded-lg p-8 max-w-md mx-4 text-center"
                style={{
                  backgroundColor: '#1F1F1F',
                  color: '#FFFFFF',
                  opacity: '1',
                  background: '#1F1F1F'
                }}
                ref={(el) => {
                  if (el) {
                    console.log('🔍 Debug - Modal content criado:', el);
                    console.log('🔍 Debug - Modal content background-color:', el.style.backgroundColor);
                    console.log('🔍 Debug - Modal content computed style:', window.getComputedStyle(el).backgroundColor);
                    
                    // Forçar o fundo via JavaScript se CSS não funcionar
                    el.style.setProperty('background-color', '#1F1F1F', 'important');
                    el.style.setProperty('background', '#1F1F1F', 'important');
                    el.style.setProperty('opacity', '1', 'important');
                    
                    console.log('🔍 Debug - Modal content background-color após forçar:', el.style.backgroundColor);
                    console.log('🔍 Debug - Modal content computed style após forçar:', window.getComputedStyle(el).backgroundColor);
                    
                    // Verificar se há CSS que está sobrescrevendo
                    const computedStyle = window.getComputedStyle(el);
                    console.log('🔍 Debug - Modal content opacity:', computedStyle.opacity);
                    console.log('🔍 Debug - Modal content visibility:', computedStyle.visibility);
                    console.log('🔍 Debug - Modal content display:', computedStyle.display);
                    console.log('🔍 Debug - Modal content position:', computedStyle.position);
                    console.log('🔍 Debug - Modal content z-index:', computedStyle.zIndex);
                    
                    // Verificar classes CSS aplicadas
                    console.log('🔍 Debug - Modal content classes:', el.className);
                    
                    // Verificar se há background-image
                    console.log('🔍 Debug - Modal content background-image:', computedStyle.backgroundImage);
                  }
                }}
              >
              <div className="mb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{
                    backgroundColor: cfg.selectBgColor || '#10B981',
                    color: '#FFFFFF'
                  }}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ color: '#FFFFFF' }}
                >
                  Concluído
                </h3>
                <p style={{ color: '#FFFFFF' }}>
                  Cadastro enviado
                </p>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2 px-4 rounded-lg transition-colors"
                style={{
                  backgroundColor: cfg.buttonBgColor || cfg.borderColorActive || '#E50F5E',
                  color: cfg.buttonTextColor || '#FFFFFF',
                  borderColor: cfg.buttonBorderColor || cfg.borderColorActive || '#E50F5E',
                  borderWidth: `${cfg.buttonBorderWidthPx || 1}px`,
                  borderRadius: `${cfg.buttonBorderRadiusPx || 8}px`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = cfg.buttonBgColorActive || cfg.borderColorActive || '#c80d52';
                  e.currentTarget.style.color = cfg.buttonTextColorActive || '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = cfg.buttonBgColor || cfg.borderColorActive || '#E50F5E';
                  e.currentTarget.style.color = cfg.buttonTextColor || '#FFFFFF';
                }}
              >
                Fechar
              </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Script para debug e forçar transparência */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              console.log('🔍 [DEBUG] Iniciando análise de fundo #131313...');
              
              // 1. Verificar fundo do body e document
              console.log('📋 [DEBUG] Body background:', document.body.style.backgroundColor, 'computed:', window.getComputedStyle(document.body).backgroundColor);
              console.log('📋 [DEBUG] Document background:', document.documentElement.style.backgroundColor, 'computed:', window.getComputedStyle(document.documentElement).backgroundColor);
              
              // 2. Verificar todos os elementos com fundo #131313
              const allElements = document.querySelectorAll('*');
              const elementsWithDarkBg = [];
              
              allElements.forEach((el, index) => {
                const computedStyle = window.getComputedStyle(el);
                const inlineBg = el.style.backgroundColor;
                const inlineBgShort = el.style.background;
                
                // Verificar se tem fundo escuro
                if (computedStyle.backgroundColor === 'rgb(19, 19, 19)' || 
                    computedStyle.backgroundColor === '#131313' ||
                    inlineBg === '#131313' ||
                    inlineBgShort === '#131313' ||
                    computedStyle.backgroundColor.includes('19, 19, 19') ||
                    el.className.includes('dark') ||
                    el.className.includes('bg-background')) {
                  
                  elementsWithDarkBg.push({
                    element: el,
                    tagName: el.tagName,
                    className: el.className,
                    id: el.id,
                    computedBg: computedStyle.backgroundColor,
                    inlineBg: inlineBg,
                    inlineBgShort: inlineBgShort,
                    index: index
                  });
                }
              });
              
              console.log('🎯 [DEBUG] Elementos com fundo escuro encontrados:', elementsWithDarkBg.length);
              elementsWithDarkBg.forEach((item, i) => {
                console.log('🔍 [DEBUG] Elemento ' + (i + 1) + ':', {
                  tag: item.tagName,
                  class: item.className,
                  id: item.id,
                  computed: item.computedBg,
                  inline: item.inlineBg,
                  inlineShort: item.inlineBgShort
                });
              });
              
              // 3. Verificar CSS aplicado
              console.log('🎨 [DEBUG] Verificando CSS aplicado...');
              const styleSheets = document.styleSheets;
              for (let i = 0; i < styleSheets.length; i++) {
                try {
                  const sheet = styleSheets[i];
                  if (sheet.cssRules) {
                    for (let j = 0; j < sheet.cssRules.length; j++) {
                      const rule = sheet.cssRules[j];
                      if (rule.style && (rule.style.backgroundColor === '#131313' || rule.style.backgroundColor === 'rgb(19, 19, 19)' || rule.selectorText?.includes('dark'))) {
                        console.log('🎨 [DEBUG] CSS Rule encontrada:', rule.selectorText, 'background:', rule.style.backgroundColor);
                      }
                    }
                  }
                } catch (e) {
                  console.log('🎨 [DEBUG] Erro ao acessar stylesheet:', e);
                }
              }
              
              // 4. Forçar transparência no iframe
              console.log('🔧 [DEBUG] Aplicando transparência forçada...');
              document.body.style.backgroundColor = 'transparent';
              document.body.style.background = 'transparent';
              document.documentElement.style.backgroundColor = 'transparent';
              document.documentElement.style.background = 'transparent';
              
              // 5. Aplicar transparência em todos os elementos
              allElements.forEach((el, index) => {
                if (!el.matches('input, textarea, select, button')) {
                  const beforeBg = window.getComputedStyle(el).backgroundColor;
                  el.style.backgroundColor = 'transparent';
                  el.style.background = 'transparent';
                  const afterBg = window.getComputedStyle(el).backgroundColor;
                  
                  if (beforeBg !== afterBg) {
                    console.log('🔧 [DEBUG] Elemento ' + index + ' alterado: ' + beforeBg + ' -> ' + afterBg, el);
                  }
                }
              });
              
              // 6. Forçar transparência em elementos com classes dark
              const darkElements = document.querySelectorAll('.dark, [class*="dark:"], .bg-background');
              console.log('🌙 [DEBUG] Elementos dark encontrados:', darkElements.length);
              darkElements.forEach((el, index) => {
                console.log('🌙 [DEBUG] Elemento dark ' + (index + 1) + ':', el.tagName, el.className);
                el.style.backgroundColor = 'transparent';
                el.style.background = 'transparent';
              });
              
              // 7. Verificar resultado final
              setTimeout(() => {
                console.log('✅ [DEBUG] Verificação final:');
                console.log('📋 [DEBUG] Body final:', window.getComputedStyle(document.body).backgroundColor);
                console.log('📋 [DEBUG] Document final:', window.getComputedStyle(document.documentElement).backgroundColor);
                
                const finalCheck = document.querySelectorAll('*');
                const stillDark = [];
                finalCheck.forEach(el => {
                  const bg = window.getComputedStyle(el).backgroundColor;
                  if (bg === 'rgb(19, 19, 19)' || bg === '#131313') {
                    stillDark.push({element: el, bg: bg});
                  }
                });
                
                if (stillDark.length > 0) {
                  console.log('❌ [DEBUG] Ainda há elementos com fundo escuro:', stillDark);
                } else {
                  console.log('✅ [DEBUG] Todos os fundos escuros foram removidos!');
                }
              }, 1000);
              
            })();
          `
        }} />
    </div>
  );
}
