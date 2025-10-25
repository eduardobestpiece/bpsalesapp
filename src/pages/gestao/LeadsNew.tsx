import { useMemo, useState, useEffect } from 'react';
import { GestaoLayout } from '@/components/Layout/GestaoLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, RotateCcw, RefreshCw, Copy, Check, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useCompany } from '@/contexts/CompanyContext';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLeadFields } from '@/hooks/useLeadFields';

type Lead = {
  id: string;
  created_at?: string;
  origem?: string;
  nome?: string;
  telefone?: string;
  email?: string;
  responsavel?: string;
  reunioes?: number;
  vendas?: number;
  valor?: number;
  ip?: string;
  browser?: string;
  device?: string;
  pais?: string;
  url?: string;
  parametros?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_source?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  fbid?: string;
  crm_id?: string;
  fonte?: string;
  dados_extras?: any;
};

type ColumnKey = keyof Lead | 'trash' | 'form_name' | 'contato' | 'informacoes' | 'selecao';

const STATIC_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'selecao', label: 'Seleção' },
  { key: 'contato', label: 'Contato' },
  { key: 'informacoes', label: 'Informações' },
  { key: 'responsavel', label: 'Responsável' },
  { key: 'trash', label: '' },
];

const DEFAULT_VISIBLE: ColumnKey[] = STATIC_COLUMNS.map(c => c.key);

export default function GestaoLeadsNew() {
  const { selectedCompanyId } = useCompany();
  const { userRole, crmUser } = useCrmAuth();
  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['leads-new', selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      // Buscar leads com informações de formulário e origem
      const { data, error } = await supabase
        .from('leads' as any)
        .select(`
          id,
          created_at,
          nome,
          email,
          telefone,
          origem,
          status,
          fonte,
          form_id,
          lead_forms!leads_form_id_fkey (
            id,
            name,
            default_origin_id,
            lead_origins!lead_forms_default_origin_id_fkey (
              id,
              name
            )
          )
        `)
        .eq('company_id', selectedCompanyId as string)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Processar os dados para incluir origem correta
      const processedLeads = (data || []).map((lead: any) => {
        const form = lead.lead_forms;
        let origemDisplay = lead.origem;
        
        // Se o lead tem um formulário associado
        if (form) {
          // Se o formulário tem uma origem padrão, usar ela
          if (form.lead_origins?.name) {
            origemDisplay = form.lead_origins.name;
          }
          // Se não tem origem padrão, usar o nome do formulário
          else if (form.name) {
            origemDisplay = form.name;
          }
        }
        
        return {
          ...lead,
          form_name: form?.name || 'Formulário',
          origem: origemDisplay
        } as any;
      });
      
      return processedLeads as Lead[];
    }
  });

  const { data: leadFields = [], isLoading: loadingFields } = useLeadFields();
  const [visibleColumns] = useState<ColumnKey[]>(DEFAULT_VISIBLE);
  const [baseFormId, setBaseFormId] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [iframeCode, setIframeCode] = useState<string>('');
  const [isFormConfigured, setIsFormConfigured] = useState(false);
  const [showFormSelector, setShowFormSelector] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');

  // Função para gerar iframe quando um formulário é selecionado
  const handleFormSelect = (formId: string) => {
    setSelectedFormId(formId);
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const baseUrl = window.location.origin;
    const iframeUrl = `${baseUrl}/form/${formId}?v=${timestamp}&r=${randomId}`;
    
    const iframeCode = `<iframe 
  src="${iframeUrl}" 
  width="100%" 
  height="auto" 
  frameborder="0" 
  style="border: none; border-radius: 8px; box-shadow: none; background-color: transparent; padding: 20px; min-height: 300px;"
  title="Formulário de Contato"
  id="form-iframe">
</iframe>

<script>
// Função para redimensionar o iframe automaticamente
function resizeIframe(height) {
  const iframe = document.getElementById('form-iframe');
  if (iframe) {
    // Altura mínima para evitar iframe muito pequeno
    const minHeight = 300;
    const finalHeight = Math.max(minHeight, height);
    iframe.style.height = finalHeight + 'px';
    iframe.style.minHeight = finalHeight + 'px';
    iframe.style.maxHeight = finalHeight + 'px';
  }
}

// Escutar mensagens do iframe filho
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'resize') {
    resizeIframe(event.data.height);
  }
});

// Aplicar redimensionamento quando o iframe carregar
document.addEventListener('DOMContentLoaded', function() {
  const iframe = document.getElementById('form-iframe');
  if (iframe) {
    iframe.onload = function() {
      // Tentar redimensionar imediatamente após carregar
      setTimeout(function() {
        try {
          // Encontrar todos os elementos visíveis
          const allElements = iframe.contentWindow.document.querySelectorAll('*');
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
          const bodyHeight = iframe.contentWindow.document.body.scrollHeight;
          const documentHeight = iframe.contentWindow.document.documentElement.scrollHeight;
          
          // Encontrar o elemento com fundo colorido
          const rootElement = iframe.contentWindow.document.getElementById('root') || iframe.contentWindow.document.body;
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
          
          resizeIframe(finalHeight);
        } catch (e) {
          // Fallback para casos de CORS
          console.log('Usando comunicação por postMessage para redimensionamento');
        }
      }, 100);
    };
    
    // Redimensionar também quando a janela for redimensionada
    window.addEventListener('resize', function() {
      try {
        // Encontrar todos os elementos visíveis
        const allElements = iframe.contentWindow.document.querySelectorAll('*');
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
        const bodyHeight = iframe.contentWindow.document.body.scrollHeight;
        const documentHeight = iframe.contentWindow.document.documentElement.scrollHeight;
        
        // Encontrar o elemento com fundo colorido
        const rootElement = iframe.contentWindow.document.getElementById('root') || iframe.contentWindow.document.body;
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
        
        resizeIframe(finalHeight);
      } catch (e) {
        // Fallback para casos de CORS
        console.log('Redimensionamento via postMessage');
      }
    });
    
    // Múltiplas tentativas de redimensionamento para garantir funcionamento
    const resizeAttempts = [500, 1000, 1500, 2000, 3000];
    resizeAttempts.forEach(delay => {
      setTimeout(function() {
        try {
          // Encontrar todos os elementos visíveis
          const allElements = iframe.contentWindow.document.querySelectorAll('*');
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
          const bodyHeight = iframe.contentWindow.document.body.scrollHeight;
          const documentHeight = iframe.contentWindow.document.documentElement.scrollHeight;
          
          // Encontrar o elemento com fundo colorido
          const rootElement = iframe.contentWindow.document.getElementById('root') || iframe.contentWindow.document.body;
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
          
          resizeIframe(finalHeight);
        } catch (e) {
          console.log('Tentativa de redimensionamento via postMessage');
        }
      }, delay);
    });
  }
});

// Função para detectar mudanças no conteúdo do iframe
function observeIframeContent() {
  const iframe = document.getElementById('form-iframe');
  if (iframe && iframe.contentWindow) {
    try {
      // Observar mudanças no DOM do iframe
      const observer = new MutationObserver(function() {
        try {
          // Calcular altura considerando todos os elementos
          const bodyHeight = iframe.contentWindow.document.body.scrollHeight;
          const documentHeight = iframe.contentWindow.document.documentElement.scrollHeight;
          const windowHeight = iframe.contentWindow.innerHeight;
          
          // Encontrar o elemento com fundo colorido (container principal)
          const rootElement = iframe.contentWindow.document.getElementById('root') || iframe.contentWindow.document.body;
          const rootHeight = rootElement.scrollHeight;
          
          // Usar a maior altura entre todos os elementos
          const calculatedHeight = Math.max(bodyHeight, documentHeight, windowHeight, rootHeight);
          
          // Adicionar margem mínima para garantir que tudo seja visível
          const finalHeight = Math.max(300, calculatedHeight + 20);
          
          resizeIframe(finalHeight);
        } catch (e) {
          // Fallback para casos de CORS
        }
      });
      
      observer.observe(iframe.contentWindow.document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
      
      // Observador específico para mudanças de etapa
      const stepObserver = new MutationObserver(function(mutations) {
        let shouldResize = false;
        
        mutations.forEach(function(mutation) {
          // Detectar mudanças em elementos de formulário
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === 1) { // Element node
                if (node.tagName === 'INPUT' || node.tagName === 'SELECT' || 
                    node.tagName === 'BUTTON' || node.tagName === 'DIV' ||
                    node.classList?.contains('step') || node.classList?.contains('form-step')) {
                  shouldResize = true;
                }
              }
            });
            
            mutation.removedNodes.forEach(function(node) {
              if (node.nodeType === 1) { // Element node
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
            shouldResize = true;
          }
        });
        
        if (shouldResize) {
          setTimeout(function() {
            try {
              // Calcular altura considerando todos os elementos
              const bodyHeight = iframe.contentWindow.document.body.scrollHeight;
              const documentHeight = iframe.contentWindow.document.documentElement.scrollHeight;
              const windowHeight = iframe.contentWindow.innerHeight;
              
              // Encontrar o elemento com fundo colorido (container principal)
              const rootElement = iframe.contentWindow.document.getElementById('root') || iframe.contentWindow.document.body;
              const rootHeight = rootElement.scrollHeight;
              
              // Usar a maior altura entre todos os elementos
              const calculatedHeight = Math.max(bodyHeight, documentHeight, windowHeight, rootHeight);
              
              // Adicionar margem mínima para garantir que tudo seja visível
              const finalHeight = Math.max(300, calculatedHeight + 20);
              
              resizeIframe(finalHeight);
            } catch (e) {
              // Fallback para casos de CORS
            }
          }, 100);
        }
      });
      
      // Observar mudanças mais específicas para formulários multi-etapa
      stepObserver.observe(iframe.contentWindow.document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'data-step']
      });
      
    } catch (e) {
      // Fallback para casos de CORS
      console.log('Observador de mudanças não disponível devido a CORS');
    }
  }
}

// Iniciar observação após carregamento
setTimeout(observeIframeContent, 500);
</script>`;
    
    setIframeCode(iframeCode);
  };

  // Função para salvar o iframe
  const handleSaveIframe = async () => {
    if (!selectedFormId || !selectedCompanyId) return;
    
    try {
      // Salvar ou atualizar a configuração no backend
      const { error } = await supabase
        .from('company_form_settings' as any)
        .upsert({
          company_id: selectedCompanyId,
          default_lead_form_id: selectedFormId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id'
        });
      
      if (error) throw error;
      
      // Invalidar cache para atualizar a query
      queryClient.invalidateQueries({ queryKey: ['company-form-settings', selectedCompanyId] });
      
      setIsFormConfigured(true);
      setShowFormSelector(false);
    } catch (error) {
      console.error('Erro ao salvar configuração do formulário:', error);
    }
  };

  // Buscar formulários da empresa
  const { data: companyForms = [] } = useQuery<any[]>({
    queryKey: ['company-forms', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const { data, error } = await supabase
        .from('lead_forms' as any)
        .select('id, name, status')
        .eq('company_id', selectedCompanyId)
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCompanyId
  });

  // Buscar configuração de formulário padrão da empresa
  const { data: companyFormSettings } = useQuery<any>({
    queryKey: ['company-form-settings', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return null;
      const { data, error } = await supabase
        .from('company_form_settings' as any)
        .select('default_lead_form_id')
        .eq('company_id', selectedCompanyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompanyId
  });

  // Função para trocar formulário
  const handleChangeForm = () => {
    setShowFormSelector(true);
    setIsFormConfigured(false);
    setIframeCode('');
    setSelectedFormId('');
  };

  // Função para atualizar a tabela de leads
  const handleRefreshLeads = async () => {
    setIsRefreshing(true);
    try {
      // Invalidar todas as queries relacionadas aos leads
      await queryClient.invalidateQueries({ queryKey: ['leads-new', selectedCompanyId] });
      await queryClient.invalidateQueries({ queryKey: ['leads', selectedCompanyId] });
      
      // Aguardar um pouco para mostrar o loading
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Erro ao atualizar leads:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Carregar formulário salvo automaticamente quando a empresa for selecionada
  useEffect(() => {
    if (companyFormSettings?.default_lead_form_id && companyForms.length > 0) {
      const savedFormId = companyFormSettings.default_lead_form_id;
      const formExists = companyForms.find(form => form.id === savedFormId);
      
      if (formExists) {
        setSelectedFormId(savedFormId);
        handleFormSelect(savedFormId);
        setIsFormConfigured(true);
        setShowFormSelector(false);
      }
    }
  }, [companyFormSettings, companyForms]);

  // Usuários para o dropdown de Responsável
  const isMaster = (userRole === 'master') && (crmUser?.email === 'eduardocosta@bestpiece.com.br');
  const { data: companyUsers = [] } = useQuery<any[]>({
    queryKey: ['company-users', selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_users')
        .select('id, first_name, last_name, email, company_id, role, status')
        .eq('company_id', selectedCompanyId as string);
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar o master para eventualmente adicionar na lista quando logado como master em qualquer empresa
  const { data: masterUser } = useQuery<any | null>({
    queryKey: ['master-user'],
    enabled: isMaster,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_users')
        .select('id, first_name, last_name, email')
        .eq('email', 'eduardocosta@bestpiece.com.br')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const responsibleOptions = useMemo(() => {
    let list = companyUsers.filter(u => u.status !== 'archived');
    // Para usuários que NÃO são master, remover o master da lista
    if (!isMaster) {
      list = list.filter(u => u.email !== 'eduardocosta@bestpiece.com.br');
    }
    // Para o master, garantir que ele próprio apareça, mesmo fora da empresa
    if (isMaster && masterUser && !list.some(u => u.id === masterUser.id)) {
      list = [masterUser, ...list];
    }
    return list.map(u => ({ id: u.id, label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email }));
  }, [companyUsers, isMaster, masterUser]);

  const responsibleNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    responsibleOptions.forEach(opt => { map[opt.id] = opt.label; });
    return map;
  }, [responsibleOptions]);

  // Carregar valores dinâmicos dos leads em lote
  const leadIds = useMemo(() => leads.map(l => l.id), [leads]);
  const { data: customValues = [] } = useQuery<any[]>({
    queryKey: ['lead-field-values', selectedCompanyId, leadIds],
    enabled: !!selectedCompanyId && leadIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_field_values' as any)
        .select('lead_id, field_id, value_text, value_numeric, value_timestamp, value_jsonb')
        .in('lead_id', leadIds);
      if (error) throw error;
      return data || [];
    }
  });

  const customValuesMap = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    customValues.forEach((row: any) => {
      const v = row.value_text ?? row.value_numeric ?? row.value_timestamp ?? row.value_jsonb ?? null;
      if (!map[row.lead_id]) map[row.lead_id] = {};
      map[row.lead_id][row.field_id] = v;
    });
    return map;
  }, [customValues]);

  // Carregar Formulário base da empresa
  useEffect(() => {
    const loadBase = async () => {
      if (!selectedCompanyId) return;
      const { data } = await supabase
        .from('lead_forms' as any)
        .select('id')
        .eq('company_id', selectedCompanyId as string)
        .eq('is_base_form', true)
        .eq('status', 'active')
        .maybeSingle();
      setBaseFormId((data as any)?.id || null);
    };
    loadBase();
  }, [selectedCompanyId]);

  // Construir colunas dinâmicas a partir de leadFields
  const dynamicColumns = useMemo(() => {
    return [] as { key: ColumnKey; label: string }[]; // sem colunas dinâmicas na listagem, apenas fixas
  }, [leadFields]);

  const allColumns = useMemo(() => {
    return [...STATIC_COLUMNS, ...dynamicColumns];
  }, [dynamicColumns]);

  const columnsMap = useMemo(() => {
    const map: Record<string, string> = {};
    allColumns.forEach(c => { map[c.key as string] = c.label; });
    return map;
  }, [allColumns]);

  // Atualizar colunas visíveis padrão incluindo todos os campos dinâmicos, além de criado e responsável
  // Colunas fixas; sem seletor de colunas


  const deleteLead = async (id: string) => {
    const { error } = await supabase.from('leads' as any).delete().eq('id', id);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ['leads-new', selectedCompanyId] });
  };

  const isVisible = (key: ColumnKey) => visibleColumns.includes(key);

  const parseParametros = (parametros?: string): Record<string, any> => {
    if (!parametros) return {};
    try { return JSON.parse(parametros); } catch { return {}; }
  };

  const getDynamicValue = (lead: Lead, customKey: string) => {
    // customKey = custom_<fieldId>
    const fieldId = customKey.replace('custom_', '');
    // 1) tentar valor normalizado em lead_field_values
    const normalized = customValuesMap[lead.id]?.[fieldId];
    if (normalized !== undefined && normalized !== null) return normalized;
    // 2) tentar em parametros JSON
    const params = parseParametros(lead.parametros);
    if (params && params[fieldId] !== undefined) return params[fieldId];
    // 3) tentar em dados_extras.fieldValues (edge)
    const fromExtras = (lead as any)?.dados_extras?.fieldValues?.[fieldId];
    if (fromExtras !== undefined) return fromExtras;
    return '-';
  };

  // Timezone da empresa para formatar data
  const { data: companyProfile } = useQuery<any | null>({
    queryKey: ['company-profile', selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('timezone')
        .eq('company_id', selectedCompanyId as string)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const formatDateTz = (iso?: string) => {
    if (!iso) return '-';
    const tz = companyProfile?.timezone || 'America/Sao_Paulo';
    try {
      const d = new Date(iso);
      const parts = new Intl.DateTimeFormat('pt-BR', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).formatToParts(d);
      const get = (t: string) => parts.find(p => p.type === t)?.value || '';
      return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')}`;
    } catch {
      return iso;
    }
  };

  // Mapa de forms por id
  const usedFormIds = useMemo(() => {
    const ids = new Set<string>();
    leads.forEach(l => {
      const directId = (l as any).form_id as string | undefined;
      if (directId) ids.add(directId);
      const fromExtras = (l as any)?.dados_extras?.formId as string | undefined;
      if (fromExtras) ids.add(fromExtras);
      const params = parseParametros(l.parametros);
      const fromParams = (params as any)?.formId as string | undefined;
      if (fromParams) ids.add(fromParams);
    });
    return Array.from(ids);
  }, [leads]);

  const { data: formsList = [] } = useQuery<any[]>({
    queryKey: ['lead-forms', usedFormIds],
    enabled: usedFormIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_forms' as any)
        .select('id, name, default_origin_id')
        .in('id', usedFormIds);
      if (error) throw error;
      return data || [];
    }
  });

  const formNameById = useMemo(() => {
    const map: Record<string, string> = {};
    formsList.forEach(f => { map[f.id] = f.name; });
    return map;
  }, [formsList]);

  const getFormName = (lead: Lead) => {
    const directId = (lead as any).form_id as string | undefined;
    if (directId && formNameById[directId]) return formNameById[directId];
    const extrasName = (lead as any)?.dados_extras?.formName as string | undefined;
    if (extrasName) return extrasName;
    const params = parseParametros(lead.parametros);
    const fromParamsId = (params as any)?.formId as string | undefined;
    if (fromParamsId && formNameById[fromParamsId]) return formNameById[fromParamsId];
    return '-';
  };

  // Resolver Origem
  const originFields = useMemo(() => (leadFields || []).filter((f: any) => (f.type === 'connection') && ((f.selection_list || '').toLowerCase() === 'origens' || (f.name || '').toLowerCase() === 'origem')), [leadFields]);

  const getFormId = (lead: Lead): string | null => {
    const directId = (lead as any).form_id as string | undefined;
    if (directId) return directId;
    const extrasId = (lead as any)?.dados_extras?.formId as string | undefined;
    if (extrasId) return extrasId;
    const params = parseParametros(lead.parametros);
    const fromParamsId = (params as any)?.formId as string | undefined;
    return fromParamsId || null;
  };

  const usedOriginIds = useMemo(() => {
    const ids = new Set<string>();
    // dos campos dinâmicos "Origem"
    leads.forEach(lead => {
      for (const field of originFields) {
        const v = customValuesMap[lead.id]?.[field.id] ?? getDynamicValue(lead as any, `custom_${field.id}`);
        if (typeof v === 'string' && v.length >= 8) ids.add(v);
      }
      // default_origin_id do formulário
      const fId = getFormId(lead);
      if (fId) {
        const form = formsList.find(f => f.id === fId);
        if (form?.default_origin_id) ids.add(form.default_origin_id);
      }
    });
    return Array.from(ids);
  }, [leads, originFields, customValuesMap, formsList]);

  const { data: origins = [] } = useQuery<any[]>({
    queryKey: ['lead-origins', selectedCompanyId, usedOriginIds],
    enabled: !!selectedCompanyId && usedOriginIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_origins' as any)
        .select('id, name')
        .eq('company_id', selectedCompanyId as string)
        .in('id', usedOriginIds);
      if (error) throw error;
      return data || [];
    }
  });

  const originNameById = useMemo(() => {
    const map: Record<string, string> = {};
    origins.forEach(o => { map[o.id] = o.name; });
    return map;
  }, [origins]);

  const getOriginName = (lead: Lead) => {
    // 1) Campo dinâmico do formulário base (seleção de origem) - buscar nos parametros
    const params = parseParametros(lead.parametros);
    
    // Buscar qualquer campo de conexão com origens nos parametros
    if (params) {
      for (const [fieldId, value] of Object.entries(params)) {
        if (typeof value === 'string' && value.length > 8 && originNameById[value]) {
          return originNameById[value];
        }
      }
    }
    
    // Buscar nos campos customizados
    for (const field of originFields) {
      // Primeiro tentar nos custom values
      let v = customValuesMap[lead.id]?.[field.id] ?? getDynamicValue(lead as any, `custom_${field.id}`);
      
      // Se não encontrou, buscar nos parametros
      if (!v && params) {
        v = params[field.id];
      }
      
      if (typeof v === 'string' && originNameById[v]) return originNameById[v];
    }
    
    // 2) default_origin_id do formulário
    const formId = getFormId(lead);
    if (formId) {
      const form = formsList.find(f => f.id === formId);
      if (form?.default_origin_id && originNameById[form.default_origin_id]) return originNameById[form.default_origin_id];
    }
    
    // 3) Fallback: string registrada em leads.origem
    return (lead as any).origem || '-';
  };

  // Função para formatar telefone com DDI
  const formatPhoneWithDDI = (phone: string) => {
    if (!phone) return '-';
    
    // Remover todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Se o telefone já tem DDI (começa com 55 e tem pelo menos 12 dígitos)
    if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
      const ddi = cleanPhone.substring(0, 2);
      const number = cleanPhone.substring(2);
      
      // Formatar número brasileiro: (11) 99999-9999
      if (number.length === 11) {
        const ddd = number.substring(0, 2);
        const first = number.substring(2, 7);
        const last = number.substring(7, 11);
        return `+${ddi} (${ddd}) ${first}-${last}`;
      } else if (number.length === 10) {
        const ddd = number.substring(0, 2);
        const first = number.substring(2, 6);
        const last = number.substring(6, 10);
        return `+${ddi} (${ddd}) ${first}-${last}`;
      } else {
        return `+${ddi} ${number}`;
      }
    } else if (cleanPhone.length === 11) {
      // Telefone brasileiro sem DDI - adicionar +55
      const ddd = cleanPhone.substring(0, 2);
      const first = cleanPhone.substring(2, 7);
      const last = cleanPhone.substring(7, 11);
      return `+55 (${ddd}) ${first}-${last}`;
    } else if (cleanPhone.length === 10) {
      // Telefone brasileiro sem DDI - adicionar +55
      const ddd = cleanPhone.substring(0, 2);
      const first = cleanPhone.substring(2, 6);
      const last = cleanPhone.substring(6, 10);
      return `+55 (${ddd}) ${first}-${last}`;
    } else {
      // Para outros casos, retornar como está
      return phone;
    }
  };

  // Função para copiar texto para a área de transferência
  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => ({ ...prev, [itemId]: true }));
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [itemId]: false }));
      }, 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  // Função para limpar texto (remover espaços e caracteres especiais)
  const cleanText = (text: string) => {
    return text.replace(/[\s\-\(\)\+]/g, '');
  };

  // Cálculos de paginação
  const totalLeads = leads.length;
  const totalPages = Math.ceil(totalLeads / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeads = leads.slice(startIndex, endIndex);

  // Funções de navegação
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Funções de seleção
  const isAllSelected = currentLeads.length > 0 && currentLeads.every(lead => selectedLeads.has(lead.id));
  const isIndeterminate = currentLeads.some(lead => selectedLeads.has(lead.id)) && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(selectedLeads);
      currentLeads.forEach(lead => newSelected.add(lead.id));
      setSelectedLeads(newSelected);
    } else {
      const newSelected = new Set(selectedLeads);
      currentLeads.forEach(lead => newSelected.delete(lead.id));
      setSelectedLeads(newSelected);
    }
  };

  const handleSelectLead = (leadId: string, index: number, event?: React.MouseEvent) => {
    const isCtrlOrCmd = event?.metaKey || event?.ctrlKey;
    const isShift = event?.shiftKey;

    if (isShift && lastSelectedIndex !== null) {
      // Seleção em range
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const newSelected = new Set(selectedLeads);
      
      for (let i = start; i <= end; i++) {
        if (currentLeads[i]) {
          newSelected.add(currentLeads[i].id);
        }
      }
      setSelectedLeads(newSelected);
    } else if (isCtrlOrCmd) {
      // Toggle individual
      const newSelected = new Set(selectedLeads);
      if (newSelected.has(leadId)) {
        newSelected.delete(leadId);
      } else {
        newSelected.add(leadId);
      }
      setSelectedLeads(newSelected);
      setLastSelectedIndex(index);
    } else {
      // Seleção simples
      setSelectedLeads(new Set([leadId]));
      setLastSelectedIndex(index);
    }
  };

  const handleLeadClick = (leadId: string, index: number, event: React.MouseEvent) => {
    // Verificar se o clique foi em um botão de cópia
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return; // Não abrir modal se clicou em botão
    }

    // Só processa se for Ctrl/Cmd ou Shift
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      event.preventDefault();
      handleSelectLead(leadId, index, event);
    } else {
      // Abrir modal de edição
      const lead = currentLeads.find(l => l.id === leadId);
      if (lead) {
        setEditingLead(lead);
        setEditModalOpen(true);
      }
    }
  };

  // Funções para edição inline
  const startEditing = (fieldName: string, currentValue: string) => {
    setEditingField(fieldName);
    setEditingValue(currentValue);
  };

  const saveEdit = async () => {
    if (!editingLead || !editingField) return;

    // Validações específicas por campo
    if (editingField === 'email' && editingValue && !validateEmail(editingValue)) {
      setEmailError('E-mail inválido');
      return;
    }

    if (editingField === 'telefone' && editingValue && !validatePhone(editingValue)) {
      setPhoneError('Telefone inválido (mínimo 10 dígitos)');
      return;
    }

    try {
      if (editingField.startsWith('custom_')) {
        // Campo customizado - atualizar em lead_field_values
        const fieldId = editingField.replace('custom_', '');
        
        const { error: customError } = await supabase
          .from('lead_field_values' as any)
          .upsert({
            lead_id: editingLead.id,
            field_id: fieldId,
            value_text: editingValue
          }, { onConflict: 'lead_id,field_id' });

        if (customError) throw customError;
      } else {
        // Campo básico - atualizar na tabela leads
        const { error } = await supabase
          .from('leads' as any)
          .update({ [editingField]: editingValue })
          .eq('id', editingLead.id);

        if (error) throw error;
      }

      // Atualizar cache
      await queryClient.invalidateQueries({ queryKey: ['leads-new', selectedCompanyId] });
      await queryClient.invalidateQueries({ queryKey: ['lead-custom-values', selectedCompanyId] });
      
      // Limpar estados de edição
      setEditingField(null);
      setEditingValue('');
      setEmailError('');
      setPhoneError('');
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditingValue('');
    setEmailError('');
    setPhoneError('');
  };

  // Funções de validação
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  };

  const handleFieldEdit = (fieldName: string, currentValue: string) => {
    setEditingField(fieldName);
    setEditingValue(currentValue);
    setEmailError('');
    setPhoneError('');
  };

  // Função para extrair todos os campos do lead
  const getAllLeadFields = (lead: Lead) => {
    const fields: Array<{name: string, value: string, key: string}> = [];
    
    // Usar a mesma lógica da tabela para extrair dados
    const leadNome = (lead as any).nome || 
      (leadFields.find((f: any) => f.type === 'name')?.id ? 
        (customValuesMap[lead.id]?.[leadFields.find((f: any) => f.type === 'name')?.id] ?? 
         getDynamicValue(lead as any, `custom_${leadFields.find((f: any) => f.type === 'name')?.id}`)) : 
        '') || '-';
    
    const leadEmail = (lead as any).email || 
      (leadFields.find((f: any) => f.type === 'email')?.id ? 
        (customValuesMap[lead.id]?.[leadFields.find((f: any) => f.type === 'email')?.id] ?? 
         getDynamicValue(lead as any, `custom_${leadFields.find((f: any) => f.type === 'email')?.id}`)) : 
        '') || '-';
    
    const leadTelefone = (lead as any).telefone || 
      (leadFields.find((f: any) => f.type === 'phone')?.id ? 
        (customValuesMap[lead.id]?.[leadFields.find((f: any) => f.type === 'phone')?.id] ?? 
         getDynamicValue(lead as any, `custom_${leadFields.find((f: any) => f.type === 'phone')?.id}`)) : 
        '') || '-';

    // Campos básicos usando os valores extraídos corretamente (ordem específica)
    const basicFields = [
      { key: 'nome', name: 'Nome', value: leadNome },
      { key: 'email', name: 'E-mail', value: leadEmail },
      { key: 'telefone', name: 'Telefone', value: leadTelefone },
      { key: 'origem', name: 'Origem', value: getOriginName(lead) },
    ];

    fields.push(...basicFields);

    // Campos customizados de lead_field_values
    const leadCustomValues = customValuesMap[lead.id] || {};
    Object.entries(leadCustomValues).forEach(([fieldId, value]) => {
      // Buscar nome do campo
      const field = leadFields.find(f => f.id === fieldId);
      if (field && value) {
        // Converter valor para string se não for
        const stringValue = typeof value === 'string' ? value : 
                          typeof value === 'object' ? JSON.stringify(value) : 
                          String(value || '');
        
        if (stringValue.trim()) {
          fields.push({
            key: `custom_${fieldId}`,
            name: field.name || fieldId,
            value: stringValue
          });
        }
      }
    });

    return fields;
  };

  return (
    <GestaoLayout>
      <div className="max-w-[1200px] mx-auto space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Leads</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRefreshLeads}
                disabled={isRefreshing}
                className="brand-radius"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              <Dialog open={openModal} onOpenChange={setOpenModal}>
                <DialogTrigger asChild>
                  <Button size="sm" className="brand-radius" onClick={() => setOpenModal(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Lead
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Lead</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {!isFormConfigured ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="form-select">Selecionar Formulário</Label>
                          <Select value={selectedFormId} onValueChange={handleFormSelect}>
                            <SelectTrigger>
                              <SelectValue placeholder="Escolha um formulário" />
                            </SelectTrigger>
                            <SelectContent>
                              {companyForms.map((form) => (
                                <SelectItem key={form.id} value={form.id}>
                                  {form.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
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
                            
                            <Button onClick={handleSaveIframe} className="w-full">
                              Salvar
                            </Button>
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
                    <Button variant="outline" onClick={() => setOpenModal(false)}>
                      Fechar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Modal de Edição do Lead */}
              <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingLead?.nome || 'Lead sem nome'}
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground">
                      Criado em: {formatDateTz(editingLead?.created_at)}
                    </div>
                  </DialogHeader>
                  
                  {editingLead && (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Campo</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getAllLeadFields(editingLead).map((field) => (
                            <TableRow key={field.key}>
                              <TableCell className="font-medium">{field.name}</TableCell>
                              <TableCell>
                                {editingField === field.key ? (
                                  <div className="space-y-2">
                                    {field.key === 'origem' ? (
                                      <Select
                                        value={editingValue}
                                        onValueChange={setEditingValue}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione uma origem" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {origins.map((origin) => (
                                            <SelectItem key={origin.id} value={origin.id}>
                                              {origin.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Input
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveEdit();
                                          if (e.key === 'Escape') cancelEdit();
                                        }}
                                        autoFocus
                                        type={field.key === 'email' ? 'email' : 'text'}
                                      />
                                    )}
                                    {field.key === 'email' && emailError && (
                                      <div className="text-sm text-red-500">{emailError}</div>
                                    )}
                                    {field.key === 'telefone' && phoneError && (
                                      <div className="text-sm text-red-500">{phoneError}</div>
                                    )}
                                  </div>
                                ) : (
                                  field.value || '-'
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleFieldEdit(field.key, field.value)}
                                  disabled={editingField === field.key}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                      Fechar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            <div className="w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumns.map(colKey => {
                      if (colKey === 'selecao') {
                        return (
                          <TableHead key={colKey as string} className="w-7">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={handleSelectAll}
                              ref={(el) => {
                                if (el && 'indeterminate' in el) {
                                  (el as any).indeterminate = isIndeterminate;
                                }
                              }}
                            />
                          </TableHead>
                        );
                      }
                      return (
                      <TableHead key={colKey as string}>{columnsMap[colKey as string]}</TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.length} className="text-center text-muted-foreground py-6">
                        Nenhum lead de formulário encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentLeads.map((lead, index) => {
                      // Obter dados do lead - priorizar campos básicos da tabela leads
                      const leadNome = lead.nome || 
                        (leadFields.find((f: any) => f.type === 'name')?.id ? 
                          (customValuesMap[lead.id]?.[leadFields.find((f: any) => f.type === 'name')?.id] ?? 
                           getDynamicValue(lead as any, `custom_${leadFields.find((f: any) => f.type === 'name')?.id}`)) : 
                          '') || '-';
                      
                      const leadEmail = lead.email || 
                        (leadFields.find((f: any) => f.type === 'email')?.id ? 
                          (customValuesMap[lead.id]?.[leadFields.find((f: any) => f.type === 'email')?.id] ?? 
                           getDynamicValue(lead as any, `custom_${leadFields.find((f: any) => f.type === 'email')?.id}`)) : 
                          '') || '-';
                      
                      const leadTelefone = lead.telefone || 
                        (leadFields.find((f: any) => f.type === 'phone')?.id ? 
                          (customValuesMap[lead.id]?.[leadFields.find((f: any) => f.type === 'phone')?.id] ?? 
                           getDynamicValue(lead as any, `custom_${leadFields.find((f: any) => f.type === 'phone')?.id}`)) : 
                          '') || '-';

                      return (
                        <TableRow key={lead.id} className={selectedLeads.has(lead.id) ? 'bg-muted/50' : ''}>
                        {visibleColumns.map(colKey => {
                            if (colKey === 'selecao') {
                              return (
                                <TableCell key={`${lead.id}_selecao`} className="w-7">
                                  <Checkbox
                                    checked={selectedLeads.has(lead.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedLeads(prev => new Set([...prev, lead.id]));
                                      } else {
                                        setSelectedLeads(prev => {
                                          const newSet = new Set(prev);
                                          newSet.delete(lead.id);
                                          return newSet;
                                        });
                                      }
                                      setLastSelectedIndex(index);
                                    }}
                                  />
                                </TableCell>
                              );
                            }
                          if (colKey === 'trash') {
                            return (
                              <TableCell key={`${lead.id}_trash`} onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}>
                                <Button variant="outline" size="icon" className="h-8 w-8" title="Excluir">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            );
                          }
                            
                            if (colKey === 'contato') {
                            return (
                                <TableCell 
                                  key={`${lead.id}_contato`} 
                                  className="py-2 cursor-pointer hover:bg-muted/30"
                                  onClick={(e) => handleLeadClick(lead.id, index, e)}
                                >
                                  <div className="space-y-1">
                                    <div className="font-medium">{leadNome}</div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <span>{leadEmail}</span>
                                      {leadEmail !== '-' && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => copyToClipboard(cleanText(leadEmail), `email_${lead.id}`)}
                                        >
                                          {copiedItems[`email_${lead.id}`] ? (
                                            <Check className="h-3 w-3 text-green-600" />
                                          ) : (
                                            <Copy className="h-3 w-3" />
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <span>{formatPhoneWithDDI(leadTelefone)}</span>
                                      {leadTelefone !== '-' && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => copyToClipboard(cleanText(leadTelefone), `phone_${lead.id}`)}
                                        >
                                          {copiedItems[`phone_${lead.id}`] ? (
                                            <Check className="h-3 w-3 text-green-600" />
                                          ) : (
                                            <Copy className="h-3 w-3" />
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              );
                            }
                            
                            if (colKey === 'informacoes') {
                              return (
                                <TableCell 
                                  key={`${lead.id}_informacoes`} 
                                  className="py-2 cursor-pointer hover:bg-muted/30"
                                  onClick={(e) => handleLeadClick(lead.id, index, e)}
                                >
                                  <div className="space-y-1 text-sm">
                                    <div className="font-medium">
                                      {getOriginName(lead)}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {getFormName(lead)}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                      {formatDateTz(lead.created_at)}
                                    </div>
                                  </div>
                                </TableCell>
                              );
                            }
                            
                            if (colKey === 'responsavel') {
                              const raw = (lead as any).responsavel;
                              const label = raw ? (responsibleNameMap[String(raw)] || '') : '';
                          return (
                                <TableCell key={`${lead.id}_${colKey}`}>{label}</TableCell>
                          );
                            }
                            
                            return null;
                        })}
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          
          {/* Controles de Paginação */}
          {totalLeads > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, totalLeads)} de {totalLeads} leads
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNumber)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </GestaoLayout>
  );
}


