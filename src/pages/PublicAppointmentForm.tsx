import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Calendar, Clock, User, Mail, Phone, MapPin, MessageSquare } from 'lucide-react';

interface AppointmentFormData {
  id: string;
  name: string;
  company_id: string;
  description?: string;
  status: string;
  form_config: any;
  webhook_url?: string;
  webhook_enabled: boolean;
}

interface PublicAppointmentFormProps {
  overrideFormId?: string;
  onSubmitted?: (appointmentId: string) => void;
}

export default function PublicAppointmentForm(props?: PublicAppointmentFormProps) {
  const route = useParams<{ formId: string }>();
  const formId = props?.overrideFormId || route.formId;
  const [formData, setFormData] = useState<AppointmentFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Estados para o formulário de agendamento (igual à prévia)
  const [agType, setAgType] = useState<'novo' | 'continuacao' | 'negociacao' | 'remarcacao'>('novo');
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedMeeting, setSelectedMeeting] = useState<string>('');
  const [sameHost, setSameHost] = useState<'sim' | 'nao'>('sim');
  const [meetingWhen, setMeetingWhen] = useState<string>('');
  const [info, setInfo] = useState<string>('');
  
  // Estados para busca
  const [leadQuery, setLeadQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [meetingQuery, setMeetingQuery] = useState('');
  
  // Dados para selects
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  
  const { selectedCompanyId } = useCompany();

  // Função para redimensionar o iframe automaticamente
  const resizeIframe = useCallback(() => {
    if (window.parent && window.parent !== window) {
      const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      );
      
      window.parent.postMessage({
        type: 'resize',
        height: height + 20
      }, '*');
    }
  }, []);

  // Carregar dados do formulário
  const loadFormData = async () => {
    if (!formId) {
      setLoading(false);
      return;
    }

    try {
      const { data: form, error: formError } = await supabase
        .from('appointment_forms')
        .select('*')
        .eq('id', formId)
        .eq('status', 'active')
        .single();

      if (formError) {
        console.error('Erro ao carregar formulário:', formError);
        toast.error('Formulário não encontrado');
        return;
      }

      setFormData(form);
      
      // Carregar dados para selects
      await loadSelectData(form.company_id);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar formulário');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados para selects
  const loadSelectData = async (companyId: string) => {
    try {
      const [{ data: leadsData }, { data: usersData }] = await Promise.all([
        supabase.from('leads').select('id, nome, email, telefone').eq('company_id', companyId).limit(200),
        supabase.from('crm_users').select('id, first_name, last_name, email, phone, company_id').eq('company_id', companyId).limit(200),
      ]);
      
      setLeads(leadsData || []);
      setUsers(usersData || []);
      // Reuniões - usando dados mockados por enquanto
      setMeetings([]);
    } catch (error) {
      console.error('Error loading connection data:', error);
    }
  };

  useEffect(() => {
    loadFormData();
  }, [formId]);

  // Redimensionar iframe quando o conteúdo mudar
  useEffect(() => {
    resizeIframe();
  }, [agType, selectedLead, selectedUser, selectedMeeting, sameHost, meetingWhen, info, resizeIframe]);

  // Capturar dados de tracking da página pai
  const captureTrackingData = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};
    for (const [key, value] of urlParams.entries()) {
      params[key] = value;
    }

    return {
      parentUrl: window.location.href,
      parentUrlParams: params,
      utmSource: params.utm_source || '',
      utmMedium: params.utm_medium || '',
      utmCampaign: params.utm_campaign || '',
      utmContent: params.utm_content || '',
      utmTerm: params.utm_term || '',
      gclid: params.gclid || '',
      fbclid: params.fbclid || '',
      referrer: document.referrer || '',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
  };

  // Enviar dados de tracking para a página pai
  const sendTrackingData = () => {
    if (window.parent && window.parent !== window) {
      const trackingData = captureTrackingData();
      window.parent.postMessage({
        type: 'APPOINTMENT_TRACKING_DATA',
        data: trackingData
      }, '*');
    }
  };

  // Enviar tracking quando o formulário for submetido
  useEffect(() => {
    sendTrackingData();
  }, []);

  // Validar formulário
  const validateForm = () => {
    if (agType === 'novo') {
      if (!selectedLead) {
        toast.error('Selecione um lead');
        return false;
      }
      if (!selectedUser) {
        toast.error('Selecione um anfitrião');
        return false;
      }
    } else {
      if (!selectedMeeting) {
        toast.error('Selecione uma reunião');
        return false;
      }
      if (sameHost === 'nao' && !selectedUser) {
        toast.error('Selecione um anfitrião');
        return false;
      }
    }
    
    if (!meetingWhen) {
      toast.error('Informe a data e hora da reunião');
      return false;
    }
    
    return true;
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      const trackingData = captureTrackingData();
      
      const appointmentData = {
        form_id: formId,
        company_id: formData?.company_id,
        appointment_type: agType,
        lead_id: agType === 'novo' ? selectedLead : null,
        user_id: selectedUser,
        meeting_id: agType !== 'novo' ? selectedMeeting : null,
        same_host: agType !== 'novo' ? sameHost === 'sim' : null,
        scheduled_at: meetingWhen,
        notes: info,
        status: 'scheduled',
        tracking_data: trackingData,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('appointment_bookings')
        .insert([appointmentData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar agendamento:', error);
        toast.error('Erro ao agendar reunião');
        return;
      }

      // Enviar webhook se configurado
      if (formData?.webhook_enabled && formData?.webhook_url) {
        try {
          await fetch(formData.webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'appointment_booking',
              data: appointmentData,
              appointment_id: data.id
            })
          });
        } catch (webhookError) {
          console.error('Erro ao enviar webhook:', webhookError);
        }
      }

      setShowSuccessModal(true);
      
      if (props?.onSubmitted) {
        props.onSubmitted(data.id);
      }
      
    } catch (error) {
      console.error('Erro ao processar agendamento:', error);
      toast.error('Erro ao agendar reunião');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Formulário não encontrado</h1>
          <p className="text-gray-600">O formulário solicitado não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  // Aplicar estilo baseado na configuração do formulário (igual aos formulários de leads)
  const cfg = formData.form_config || {};
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
      className="embedded-form-root w-full"
      style={{
        backgroundColor: 'transparent',
        background: 'transparent',
        fontFamily: cfg.fontFamily || 'inherit',
        padding: '0px',
        boxShadow: 'none',
        minHeight: 'auto',
        ...(selectorVars as any)
      }}
    >
      <div className="w-full bp-form-root" style={{ backgroundColor: 'transparent', background: 'transparent', backgroundImage: 'none' }}>
        <div style={{ ...fontStyle, ...selectorVars, backgroundColor: 'transparent', background: 'transparent', backgroundImage: 'none', color: 'inherit', padding: '0px' }}>
          {/* CSS auxiliar para borda de foco com variável controlada */}
          <style>{`
            .focus-border:focus { border-color: var(--active-bc) !important; border-width: var(--focus-bw, 2px) !important; }
            
            /* Garantir cor de autofill WebKit igual ao fundo configurado */
            input:-webkit-autofill,
            input:-webkit-autofill:hover,
            input:-webkit-autofill:focus,
            textarea:-webkit-autofill,
            select:-webkit-autofill {
              -webkit-box-shadow: 0 0 0px 1000px var(--baseBg, #FFFFFF) inset !important;
              -webkit-text-fill-color: var(--baseFg, #000000) !important;
              transition: background-color 5000s ease-in-out 0s !important;
            }
            
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
            
            /* Preservar APENAS o fundo dos campos de entrada (somente dentro do embed) - regra com maior especificidade */
            .embedded-form-root input[type="text"],
            .embedded-form-root input[type="email"], 
            .embedded-form-root input[type="tel"],
            .embedded-form-root input[type="number"],
            .embedded-form-root input[type="datetime-local"],
            .embedded-form-root textarea,
            .embedded-form-root select,
            .embedded-form-root input[class*="focus-border"],
            .embedded-form-root [class*="SelectTrigger"],
            .embedded-form-root [class*="select"],
            .embedded-form-root [data-radix-select-trigger],
            .embedded-form-root button[type="button"]:not([type="submit"]) {
              background-color: var(--baseBg, #FFFFFF) !important;
              background: var(--baseBg, #FFFFFF) !important;
            }
            
            /* Remover botão submit da regra acima para aplicar gradiente depois */
            .embedded-form-root button[type="submit"] {
              background-color: transparent !important;
            }
            
            /* Garantir que campos de entrada específicos preservem a cor */
            .embedded-form-root form input,
            .embedded-form-root form textarea,
            .embedded-form-root form select {
              background-color: var(--baseBg, #FFFFFF) !important;
              background: var(--baseBg, #FFFFFF) !important;
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
            
            /* Estilo específico para campos de seleção */
            .embedded-form-root [data-radix-select-trigger] {
              background-color: var(--baseBg, #FFFFFF) !important;
              color: var(--baseFg, #000000) !important;
            }
            
            .embedded-form-root .select-trigger {
              background-color: var(--baseBg, #FFFFFF) !important;
              color: var(--baseFg, #000000) !important;
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
            
            /* Garantir que inputs dentro de selects também preservem a cor */
            .embedded-form-root [data-radix-select-content] input {
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
            iframe[src*="/appointment/"] {
              background-color: transparent !important;
              background: transparent !important;
              background-image: none !important;
            }
            
            /* Sobrescrever qualquer fundo escuro global */
            body.dark iframe[src*="/appointment/"],
            html.dark iframe[src*="/appointment/"],
            .dark iframe[src*="/appointment/"] {
              background-color: transparent !important;
              background: transparent !important;
              background-image: none !important;
            }
          `}</style>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col">
              {/* Tipo de agendamento somente dropdown */}
              <div className="space-y-2" style={{ marginBottom: `${cfg.spacingFieldsPx || 16}px` }}>
                <Label style={labelStyle}>Selecione o tipo de Reunião</Label>
                <Select value={agType} onValueChange={(v: any) => setAgType(v)}>
                  <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px` }}>
                    <SelectValue placeholder="Selecione o tipo de Reunião" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-white/20" style={{ ...(fontStyle||{}), ['--selBg' as any]: cfg.selectBgColor, ['--selFg' as any]: cfg.selectTextColor, fontSize: `${cfg.fontSizeInputPx || 16}px` }}>
                    <SelectItem value="novo" className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx || 16}px` }}>Novo</SelectItem>
                    <SelectItem value="continuacao" className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx || 16}px` }}>Continuação</SelectItem>
                    <SelectItem value="negociacao" className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx || 16}px` }}>Negociação</SelectItem>
                    <SelectItem value="remarcacao" className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx || 16}px` }}>Remarcação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Novo */}
              {agType === 'novo' && (
                <>
                  {/* Lead com busca + botão + */}
                  <div className="space-y-2" style={{ marginBottom: `${cfg.spacingFieldsPx || 16}px` }}>
                    <div className="flex gap-2" style={{ ...(selectorVars as any) }}>
                      <Select value={selectedLead} onValueChange={setSelectedLead}>
                      <SelectTrigger className="flex-1 h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px` }}>
                          <SelectValue placeholder="Selecione ou Adicione um Lead" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2A2A2A] border-white/20 max-h-80" style={{ ...(fontStyle||{}), ['--selBg' as any]: cfg.selectBgColor, ['--selFg' as any]: cfg.selectTextColor }}>
                          <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: cfg.borderRadiusPx || 8 }}>
                            <Input
                              placeholder="Pesquisar nome, e-mail ou telefone"
                              value={leadQuery}
                              onChange={(e) => setLeadQuery(e.target.value)}
                              className="h-9 border-white/20 placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                              style={{ ...fieldStyle, borderRadius: cfg.borderRadiusPx || 8, ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px` }}
                            />
                          </div>
                          {(leads || [])
                            .filter((l) => {
                              const q = leadQuery.toLowerCase();
                              return (
                                !q ||
                                (l.nome || '').toLowerCase().includes(q) ||
                                (l.email || '').toLowerCase().includes(q) ||
                                (l.telefone || '').toLowerCase().includes(q)
                              );
                            })
                            .slice(0, 50)
                            .map((l) => (
                              <SelectItem key={l.id} value={l.id} className="text-base data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx || 16}px` }}>
                                {l.nome || l.email || l.telefone}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" className="h-12 px-3 border hover:bg-[var(--selBg)] hover:text-[var(--selFg)]" variant="ghost" title="Adicionar lead" style={{ backgroundColor: cfg.fieldBgColor || '#FFFFFF', color: cfg.fieldTextColor || '#000000', borderColor: cfg.borderColorNormal || '#D1D5DB', borderWidth: cfg.borderWidthNormalPx || 1, borderRadius: cfg.borderRadiusPx || 8 }}>
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Anfitrião com busca */}
                  <div className="space-y-2" style={{ marginBottom: `${cfg.spacingFieldsPx || 16}px` }}>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px` }}>
                        <SelectValue placeholder="Selecione o Anfitrião" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-white/20 max-h-80" style={{ ...(fontStyle||{}), ['--selBg' as any]: cfg.selectBgColor, ['--selFg' as any]: cfg.selectTextColor, fontSize: `${cfg.fontSizeInputPx || 16}px` }}>
                        <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: cfg.borderRadiusPx || 8 }}>
                          <Input
                            placeholder="Pesquisar usuário"
                            value={userQuery}
                            onChange={(e) => setUserQuery(e.target.value)}
                            className="h-9 border-white/20 placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                            style={{ ...fieldStyle, borderRadius: cfg.borderRadiusPx || 8, ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px` }}
                          />
                        </div>
                        {(users || [])
                          .filter((u) => {
                            const q = userQuery.toLowerCase();
                            const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                            return (
                              !q ||
                              name.toLowerCase().includes(q) ||
                              (u.email || '').toLowerCase().includes(q) ||
                              (u.phone || '').toLowerCase().includes(q)
                            );
                          })
                          .slice(0, 50)
                          .map((u) => (
                            <SelectItem key={u.id} value={u.id} className="text-base data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx || 16}px` }}>
                              {(u.first_name || '') + ' ' + (u.last_name || '') || u.email || u.phone}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data e hora */}
                  <div className="space-y-1" style={{ marginBottom: `${cfg.spacingFieldsPx || 16}px` }}>
                    <Label style={labelStyle}>Informe a data e hora da reunião</Label>
                    <Input
                      type="datetime-local"
                      value={meetingWhen}
                      onChange={(e) => setMeetingWhen(e.target.value)}
                      className="h-12 text-base focus-ring-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border" style={{ ...fieldStyle, ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px` }}
                    />
                  </div>

                  {/* Informações */}
                  <Textarea
                    placeholder="Informações da reunião"
                    value={info}
                    onChange={(e) => setInfo(e.target.value)}
                    className="min-h-24 placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border" style={{ ...fieldStyle, ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px` }}
                  />
                  <Button type="submit" className="w-full h-12 font-semibold transition-all duration-300 shadow-lg" style={buttonStyle}
                    onMouseDown={(e)=>{ (e.currentTarget.style as any).backgroundImage = activeButtonBg; (e.currentTarget.style as any).color = cfg.btnTextActive || cfg.btnText || '#FFFFFF'; (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidthActive || cfg.btnBorderWidth || 0}px`; (e.currentTarget.style as any).borderColor = cfg.btnBorderColorActive || cfg.btnBorderColor || 'transparent'; }}
                    onMouseUp={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = cfg.btnText || '#FFFFFF'; (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidth || 0}px`; (e.currentTarget.style as any).borderColor = cfg.btnBorderColor || 'transparent'; }}
                    onMouseLeave={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = cfg.btnText || '#FFFFFF'; (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidth || 0}px`; (e.currentTarget.style as any).borderColor = cfg.btnBorderColor || 'transparent'; }}
                    disabled={submitting}
                  >
                    {submitting ? 'Agendando...' : 'Agendar Reunião'}
                  </Button>
                </>
              )}

              {/* Negociação, Continuação e Remarcação compartilham estrutura */}
              {(agType === 'negociacao' || agType === 'continuacao' || agType === 'remarcacao') && (
                <>
                  {/* Reunião com busca */}
                  <div style={{ display: 'grid', rowGap: `${cfg.spacingLabelPx || 8}px`, marginBottom: `${cfg.spacingFieldsPx || 16}px` }}>
                    <Select value={selectedMeeting} onValueChange={setSelectedMeeting}>
                      <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px` }}>
                        <SelectValue placeholder="Selecione a Reunião" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-white/20 max-h-80" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx || 16}px` }}>
                        <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: cfg.borderRadiusPx || 8 }}>
                          <Input
                            placeholder="Pesquisar reunião (lead)"
                            value={meetingQuery}
                            onChange={(e) => setMeetingQuery(e.target.value)}
                            className="h-9 border-white/20 placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                            style={{ ...fieldStyle, borderRadius: cfg.borderRadiusPx || 8, ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px` }}
                          />
                        </div>
                        {(meetings || [])
                          .filter((m) => {
                            const q = meetingQuery.toLowerCase();
                            return (
                              !q ||
                              (m.title || '').toLowerCase().includes(q) ||
                              (m.lead_name || '').toLowerCase().includes(q) ||
                              (m.lead_email || '').toLowerCase().includes(q) ||
                              (m.lead_phone || '').toLowerCase().includes(q)
                            );
                          })
                          .slice(0, 50)
                          .map((m) => (
                            <SelectItem key={m.id} value={m.id} className="text-base" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx || 16}px` }}>
                              {m.title || m.lead_name || m.lead_email || m.lead_phone}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Manteve o mesmo anfitrião */}
                  <div className="space-y-2" style={{ ...(selectorVars as any), marginBottom: `${cfg.spacingFieldsPx || 16}px` }}>
                    <Label style={labelStyle}>Será feita pelo mesmo anfitrião?</Label>
                    <ToggleGroup type="single" value={sameHost} onValueChange={(v) => setSameHost((v as any) || sameHost)} className="grid grid-cols-2 gap-3" style={{ ...(selectorVars as any), ...(fontStyle||{}) }}>
                      <ToggleGroupItem
                        value="sim"
                        aria-label="Sim"
                        className="font-normal text-base bg-[var(--baseBg)] text-[var(--baseFg)] hover:bg-[var(--selBg)] hover:text-[var(--selFg)] data-[state=on]:bg-[var(--selBg)] data-[state=on]:text-[var(--selFg)] data-[state=on]:border-[var(--active-bc)]"
                        style={{ ...fieldStyle, ...(fontStyle||{}) }}
                      >
                        Sim
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="nao"
                        aria-label="Não"
                        className="font-normal text-base bg-[var(--baseBg)] text-[var(--baseFg)] hover:bg-[var(--selBg)] hover:text-[var(--selFg)] data-[state=on]:bg-[var(--selBg)] data-[state=on]:text-[var(--selFg)] data-[state=on]:border-[var(--active-bc)]"
                        style={{ ...fieldStyle, ...(fontStyle||{}) }}
                      >
                        Não
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {/* Anfitrião (apenas quando não manteve) */}
                  {sameHost === 'nao' && (
                    <div className="space-y-2" style={{ marginBottom: `${cfg.spacingFieldsPx || 16}px` }}>
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px` }}>
                          <SelectValue placeholder="Selecione o Anfitrião" />
                        </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-white/20 max-h-80" style={{ ...(selectorVars as any), ...(fontStyle||{}) }}>
                        <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: cfg.borderRadiusPx || 8 }}>
                            <Input
                              placeholder="Pesquisar usuário"
                              value={userQuery}
                              onChange={(e) => setUserQuery(e.target.value)}
                              className="h-9 border-white/20 placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                            style={{ ...fieldStyle, borderRadius: cfg.borderRadiusPx || 8, ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px` }}
                            />
                          </div>
                          {(users || [])
                            .filter((u) => {
                              const q = userQuery.toLowerCase();
                              const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                              return (
                                !q ||
                                name.toLowerCase().includes(q) ||
                                (u.email || '').toLowerCase().includes(q) ||
                                (u.phone || '').toLowerCase().includes(q)
                              );
                            })
                            .slice(0, 50)
                            .map((u) => (
                            <SelectItem key={u.id} value={u.id} className="text-base data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}) }}>
                                {(u.first_name || '') + ' ' + (u.last_name || '') || u.email || u.phone}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Data e hora */}
                  <div className="space-y-1" style={{ marginBottom: `${cfg.spacingFieldsPx || 16}px` }}>
                    <Label style={labelStyle}>Informe a data e hora da reunião</Label>
                    <Input
                      type="datetime-local"
                      value={meetingWhen}
                      onChange={(e) => setMeetingWhen(e.target.value)}
                      className="h-12 text-base focus-ring-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border" style={{ ...fieldStyle, ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px` }}
                    />
                  </div>

                  {/* Informações - aparece também para os demais tipos, mas obrigatória apenas em 'novo' (validação virá depois) */}
                  <Textarea
                    placeholder="Informações da reunião"
                    value={info}
                    onChange={(e) => setInfo(e.target.value)}
                    className="min-h-24 placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border" style={{ ...fieldStyle, ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx || 2}px` }}
                  />
                  <Button type="submit" className="w-full h-12 font-semibold transition-all duration-300 shadow-lg" style={buttonStyle}
                    onMouseDown={(e)=>{ (e.currentTarget.style as any).backgroundImage = activeButtonBg; (e.currentTarget.style as any).color = cfg.btnTextActive || cfg.btnText || '#FFFFFF'; (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidthActive || cfg.btnBorderWidth || 0}px`; (e.currentTarget.style as any).borderColor = cfg.btnBorderColorActive || cfg.btnBorderColor || 'transparent'; }}
                    onMouseUp={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = cfg.btnText || '#FFFFFF'; (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidth || 0}px`; (e.currentTarget.style as any).borderColor = cfg.btnBorderColor || 'transparent'; }}
                    onMouseLeave={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = cfg.btnText || '#FFFFFF'; (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidth || 0}px`; (e.currentTarget.style as any).borderColor = cfg.btnBorderColor || 'transparent'; }}
                    disabled={submitting}
                  >
                    {submitting ? 'Agendando...' : 'Agendar Reunião'}
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Modal de sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Agendamento Confirmado!</h2>
            <p className="text-gray-600 mb-6">
              Seu agendamento foi realizado com sucesso. Você receberá um email de confirmação em breve.
            </p>
            <Button
              onClick={() => setShowSuccessModal(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}