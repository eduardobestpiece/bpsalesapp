import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GestaoLayout } from '@/components/Layout/GestaoLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, RotateCcw, RefreshCw, Copy, Check, ChevronLeft, ChevronRight, Pencil, X, Search, Filter, User } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
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
  const navigate = useNavigate();

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [selectedResponsible, setSelectedResponsible] = useState<string>('');
  const [dateRange, setDateRange] = useState<{from: string, to: string}>({from: '', to: ''});
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['leads-new', selectedCompanyId, searchTerm, selectedOrigin, selectedForm, selectedResponsible, dateRange],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      // Construir query base
      let query = supabase
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
          formulario_cadastro,
          url,
          utm_campaign,
          utm_medium,
          utm_content,
          utm_source,
          utm_term,
          fbclid,
          gclid,
          fbc,
          fbp,
          fbid,
          ip,
          browser,
          device,
          pais,
          responsible_id,
          responsavel,
          crm_users!leads_responsible_id_fkey (
            id,
            first_name,
            last_name,
            email
          ),
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
        .eq('company_id', selectedCompanyId as string);

      // Restrição para colaboradores: só podem ver seus próprios leads
      if (isCollaborator && crmUser?.id) {
        console.log('🔒 Aplicando filtro de colaborador - User ID:', crmUser.id);
        query = query.eq('responsible_id', crmUser.id);
      } else {
        console.log('🔓 Sem filtro de colaborador aplicado');
      }

      // Aplicar filtros
      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%`);
      }

      if (selectedOrigin) {
        query = query.eq('origem', selectedOrigin);
      }

      if (selectedForm) {
        query = query.eq('form_id', selectedForm);
      }

      if (selectedResponsible) {
        if (selectedResponsible === 'none') {
          query = query.is('responsible_id', null);
        } else {
          query = query.eq('responsible_id', selectedResponsible);
        }
      }

      if (dateRange.from) {
        query = query.gte('created_at', dateRange.from);
      }

      if (dateRange.to) {
        query = query.lte('created_at', dateRange.to);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Processar os dados para incluir origem correta
      const processedLeads = (data || []).map((lead: any) => {
        const form = lead.lead_forms;
        const responsibleUser = lead.crm_users;
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
        
        // Construir nome do responsável
        let responsibleName = '';
        if (responsibleUser) {
          responsibleName = `${responsibleUser.first_name || ''} ${responsibleUser.last_name || ''}`.trim();
        } else if (lead.responsavel) {
          responsibleName = lead.responsavel;
        }
        
        return {
          ...lead,
          form_name: form?.name || 'Formulário',
          origem: origemDisplay,
          responsavel: responsibleName
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
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [editingLeadName, setEditingLeadName] = useState<boolean>(false);
  const [leadNameValue, setLeadNameValue] = useState<string>('');
  const [showNavigationData, setShowNavigationData] = useState<boolean>(false);
  const [editingResponsible, setEditingResponsible] = useState<boolean>(false);
  const [selectedResponsibleId, setSelectedResponsibleId] = useState<string>('');
  const [editingResponsibleLeadId, setEditingResponsibleLeadId] = useState<string | null>(null);
  const [inlineResponsibleId, setInlineResponsibleId] = useState<string>('');
  
  // Estados para ações em lote
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isBulkResponsibleModalOpen, setIsBulkResponsibleModalOpen] = useState<boolean>(false);
  const [bulkResponsibleId, setBulkResponsibleId] = useState<string>('');
  const [deleteConfirmationNumber, setDeleteConfirmationNumber] = useState<string>('');

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

  // Listener para comunicação com iframes de formulários
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verificar se a mensagem é de um iframe solicitando dados do usuário logado
      if (event.data.type === 'REQUEST_LOGGED_USER') {
        console.log('📨 Iframe solicitando dados do usuário logado');
        
        if (crmUser) {
          console.log('👤 Enviando dados do usuário logado para o iframe:', crmUser);
          
          // Enviar dados do usuário logado de volta para o iframe
          event.source?.postMessage({
            type: 'LOGGED_USER_RESPONSE',
            user: {
              id: crmUser.id,
              first_name: crmUser.first_name,
              last_name: crmUser.last_name,
              email: crmUser.email
            }
          }, event.origin);
        } else {
          console.log('⚠️ Nenhum usuário logado encontrado');
          
          // Enviar resposta vazia
          event.source?.postMessage({
            type: 'LOGGED_USER_RESPONSE',
            user: null
          }, event.origin);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [crmUser]);

  // Usuários para o dropdown de Responsável
  const isMaster = (userRole === 'master') && (crmUser?.email === 'eduardocosta@bestpiece.com.br');
  const isCollaborator = userRole === 'user'; // Usuários com role 'user' são colaboradores
  
  // Debug: Log do role do usuário
  console.log('🔍 Debug - User Role:', userRole);
  console.log('🔍 Debug - CRM User ID:', crmUser?.id);
  console.log('🔍 Debug - CRM User Email:', crmUser?.email);
  console.log('🔍 Debug - Is Collaborator:', isCollaborator);
  console.log('🔍 Debug - Selected Company ID:', selectedCompanyId);
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
    // Verificação de segurança: colaboradores não podem excluir leads
    if (isCollaborator) {
      console.log('🚫 Tentativa de exclusão bloqueada - usuário é colaborador');
      toast.error('Colaboradores não podem excluir leads');
      return;
    }
    
    console.log('🗑️ Excluindo lead:', id);
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

  // Função para filtrar leads
  const getFilteredLeads = () => {
    let filteredLeads = leads;

    // Filtro de pesquisa geral
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredLeads = filteredLeads.filter(lead => {
        // Buscar em campos básicos
        const basicFields = [
          lead.nome,
          lead.email,
          lead.telefone,
          lead.origem,
          (lead as any).formulario_cadastro
        ].join(' ').toLowerCase();

        // Buscar em campos customizados
        const customValues = customValuesMap[lead.id] || {};
        const customFields = Object.values(customValues).join(' ').toLowerCase();

        return basicFields.includes(searchLower) || customFields.includes(searchLower);
      });
    }

    // Filtro de origem
    if (selectedOrigin) {
      filteredLeads = filteredLeads.filter(lead => {
        const originName = getOriginName(lead);
        return originName === selectedOrigin;
      });
    }

    // Filtro de formulário
    if (selectedForm) {
      filteredLeads = filteredLeads.filter(lead => {
        const formName = getFormName(lead);
        return formName === selectedForm;
      });
    }

    // Filtro de data
    if (dateRange.from || dateRange.to) {
      filteredLeads = filteredLeads.filter(lead => {
        if (!lead.created_at) return false;
        
        const leadDate = new Date(lead.created_at);
        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        const toDate = dateRange.to ? new Date(dateRange.to + 'T23:59:59') : null;

        if (fromDate && leadDate < fromDate) return false;
        if (toDate && leadDate > toDate) return false;
        
        return true;
      });
    }

    return filteredLeads;
  };

  // Função para limpar texto (remover espaços e caracteres especiais)
  const cleanText = (text: string) => {
    return text.replace(/[\s\-\(\)\+]/g, '');
  };

  // Obter leads filtrados
  const filteredLeads = getFilteredLeads();

  // Cálculos de paginação
  const totalLeads = filteredLeads.length;
  const totalPages = Math.ceil(totalLeads / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeads = filteredLeads.slice(startIndex, endIndex);

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
  const isAllSelected = currentLeads.length > 0 && currentLeads.every(lead => selectedLeads.includes(lead.id));
  const isIndeterminate = currentLeads.some(lead => selectedLeads.includes(lead.id)) && !isAllSelected;


  const handleLeadClick = (leadId: string, index: number, event: React.MouseEvent) => {
    // Verificar se o clique foi em um botão de cópia
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return; // Não abrir modal se clicou em botão
    }

    // Só processa se for Ctrl/Cmd ou Shift
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      event.preventDefault();
      const isCtrlOrCmd = event.metaKey || event.ctrlKey;
      const isShift = event.shiftKey;

      if (isShift && lastSelectedIndex !== null) {
        // Seleção em range
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const newSelected = [...selectedLeads];
        
        for (let i = start; i <= end; i++) {
          if (currentLeads[i] && !newSelected.includes(currentLeads[i].id)) {
            newSelected.push(currentLeads[i].id);
          }
        }
        setSelectedLeads(newSelected);
      } else if (isCtrlOrCmd) {
        // Toggle individual
        if (selectedLeads.includes(leadId)) {
          setSelectedLeads(prev => prev.filter(id => id !== leadId));
        } else {
          setSelectedLeads(prev => [...prev, leadId]);
        }
        setLastSelectedIndex(index);
      } else {
        // Seleção simples
        setSelectedLeads([leadId]);
        setLastSelectedIndex(index);
      }
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

  // Função para iniciar edição do nome do lead
  const startEditingLeadName = () => {
    if (!editingLead) return;
    
    // Buscar o nome do lead usando a mesma lógica da tabela
    const leadNome = editingLead.nome || 
      (leadFields.find((f: any) => f.type === 'name')?.id ? 
        (customValuesMap[editingLead.id]?.[leadFields.find((f: any) => f.type === 'name')?.id] ?? 
         getDynamicValue(editingLead as any, `custom_${leadFields.find((f: any) => f.type === 'name')?.id}`)) : 
        '') || '';
    
    setLeadNameValue(leadNome);
    setEditingLeadName(true);
  };

  // Função para salvar o nome do lead
  const saveLeadName = async () => {
    if (!editingLead || !leadNameValue.trim()) return;

    try {
      // Verificar se é um campo customizado ou campo básico
      const nameField = leadFields.find((f: any) => f.type === 'name');
      
      if (nameField) {
        // Campo customizado - atualizar em lead_field_values
        const { error: customError } = await supabase
          .from('lead_field_values' as any)
          .upsert({
            lead_id: editingLead.id,
            field_id: nameField.id,
            value_text: leadNameValue.trim()
          }, { onConflict: 'lead_id,field_id' });

        if (customError) throw customError;
      } else {
        // Campo básico - atualizar na tabela leads
        const { error } = await supabase
          .from('leads' as any)
          .update({ nome: leadNameValue.trim() })
          .eq('id', editingLead.id);

        if (error) throw error;
      }

      // Atualizar cache
      await queryClient.invalidateQueries({ queryKey: ['leads-new', selectedCompanyId] });
      await queryClient.invalidateQueries({ queryKey: ['lead-field-values', selectedCompanyId] });
      
      // Atualizar o lead localmente
      setEditingLead(prev => prev ? { ...prev, nome: leadNameValue.trim() } : null);
      
      // Sair do modo de edição
      setEditingLeadName(false);
    } catch (error) {
      console.error('Erro ao salvar nome do lead:', error);
    }
  };

  // Função para cancelar edição do nome
  const cancelEditingLeadName = () => {
    setEditingLeadName(false);
    setLeadNameValue('');
  };

  const startEditingResponsible = () => {
    if (editingLead) {
      const currentResponsibleId = (editingLead as any).responsible_id;
      setSelectedResponsibleId(currentResponsibleId || 'none');
      setEditingResponsible(true);
    }
  };

  const saveResponsible = async () => {
    if (!editingLead) return;

    try {
      const isNoneSelected = selectedResponsibleId === 'none';
      const responsibleName = isNoneSelected ? '' : 
        (responsibleOptions.find(r => r.id === selectedResponsibleId)?.label || '');

      const { error } = await supabase
        .from('leads' as any)
        .update({ 
          responsible_id: isNoneSelected ? null : selectedResponsibleId,
          responsavel: isNoneSelected ? null : responsibleName
        })
        .eq('id', editingLead.id);

      if (error) throw error;

      // Atualizar o lead local
      setEditingLead({
        ...editingLead,
        responsible_id: isNoneSelected ? null : selectedResponsibleId,
        responsavel: isNoneSelected ? '' : responsibleName
      } as any);

      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['leads-new', selectedCompanyId] });
      
      setEditingResponsible(false);
    } catch (error) {
      console.error('Erro ao salvar responsável:', error);
    }
  };

  const cancelEditingResponsible = () => {
    setEditingResponsible(false);
    setSelectedResponsibleId('none');
  };

  // Funções para edição inline na tabela
  const startInlineResponsibleEdit = (leadId: string, currentResponsibleId: string | null) => {
    setEditingResponsibleLeadId(leadId);
    setInlineResponsibleId(currentResponsibleId || 'none');
  };

  const saveInlineResponsible = async (leadId: string) => {
    try {
      const isNoneSelected = inlineResponsibleId === 'none';
      const responsibleName = isNoneSelected ? '' : 
        (responsibleOptions.find(r => r.id === inlineResponsibleId)?.label || '');

      const { error } = await supabase
        .from('leads' as any)
        .update({ 
          responsible_id: isNoneSelected ? null : inlineResponsibleId,
          responsavel: isNoneSelected ? null : responsibleName
        })
        .eq('id', leadId);

      if (error) throw error;

      // Invalidar cache para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['leads-new', selectedCompanyId] });
      
      setEditingResponsibleLeadId(null);
      setInlineResponsibleId('');
    } catch (error) {
      console.error('Erro ao salvar responsável inline:', error);
    }
  };

  const cancelInlineResponsibleEdit = () => {
    setEditingResponsibleLeadId(null);
    setInlineResponsibleId('');
  };

  // Funções para ações em lote
  const handleSelectAllLeads = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleBulkDelete = async () => {
    // Verificação de segurança: colaboradores não podem excluir leads
    if (isCollaborator) {
      console.log('🚫 Tentativa de exclusão em lote bloqueada - usuário é colaborador');
      toast.error('Colaboradores não podem excluir leads');
      return;
    }
    
    if (deleteConfirmationNumber !== selectedLeads.length.toString()) {
      toast.error('Número de confirmação incorreto');
      return;
    }

    try {
      console.log('🗑️ Excluindo leads em lote:', selectedLeads);
      const { error } = await supabase
        .from('leads' as any)
        .delete()
        .in('id', selectedLeads);

      if (error) throw error;

      toast.success(`${selectedLeads.length} leads excluídos com sucesso!`);
      setSelectedLeads([]);
      setIsDeleteModalOpen(false);
      setDeleteConfirmationNumber('');
      queryClient.invalidateQueries({ queryKey: ['leads-new', selectedCompanyId] });
    } catch (error) {
      console.error('Erro ao excluir leads:', error);
      toast.error('Erro ao excluir leads');
    }
  };

  const handleBulkUpdateResponsible = async () => {
    if (!bulkResponsibleId) {
      toast.error('Selecione um responsável');
      return;
    }

    try {
      const isNoneSelected = bulkResponsibleId === 'none';
      const responsibleName = isNoneSelected ? '' : 
        (responsibleOptions.find(r => r.id === bulkResponsibleId)?.label || '');

      const { error } = await supabase
        .from('leads' as any)
        .update({ 
          responsible_id: isNoneSelected ? null : bulkResponsibleId,
          responsavel: isNoneSelected ? null : responsibleName
        })
        .in('id', selectedLeads);

      if (error) throw error;

      toast.success(`Responsável atualizado para ${selectedLeads.length} leads!`);
      setSelectedLeads([]);
      setIsBulkResponsibleModalOpen(false);
      setBulkResponsibleId('');
      queryClient.invalidateQueries({ queryKey: ['leads-new', selectedCompanyId] });
    } catch (error) {
      console.error('Erro ao atualizar responsável:', error);
      toast.error('Erro ao atualizar responsável');
    }
  };

  // Função para extrair todos os campos do lead
  const getAllLeadFields = (lead: Lead) => {
    const fields: Array<{name: string, value: string, key: string}> = [];
    
    // Usar a mesma lógica da tabela para extrair dados
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

    // Campos básicos (removido nome pois já está no título)
    const basicFields = [
      { key: 'email', name: 'E-mail', value: leadEmail },
      { key: 'telefone', name: 'Telefone', value: leadTelefone },
      { key: 'origem', name: 'Origem', value: getOriginName(lead) },
    ];

    fields.push(...basicFields);

    // Campos customizados de lead_field_values (excluindo nome, email, telefone e origem)
    const leadCustomValues = customValuesMap[lead.id] || {};
    Object.entries(leadCustomValues).forEach(([fieldId, value]) => {
      // Buscar nome do campo
      const field = leadFields.find(f => f.id === fieldId);
      if (field && value) {
        // Pular campos de nome, email, telefone e origem para evitar duplicação
        if (field.type === 'name' || field.type === 'email' || field.type === 'phone' || field.type === 'connection') {
          return;
        }
        
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

  // Função para obter dados de navegação do lead
  const getNavigationData = (lead: Lead) => {
    const navigationFields = [
      { key: 'url', name: 'URL', value: lead.url && lead.url.trim() ? lead.url : '-' },
      { key: 'utm_campaign', name: 'UTM Campaign', value: lead.utm_campaign && lead.utm_campaign.trim() ? lead.utm_campaign : '-' },
      { key: 'utm_medium', name: 'UTM Medium', value: lead.utm_medium && lead.utm_medium.trim() ? lead.utm_medium : '-' },
      { key: 'utm_content', name: 'UTM Content', value: lead.utm_content && lead.utm_content.trim() ? lead.utm_content : '-' },
      { key: 'utm_source', name: 'UTM Source', value: lead.utm_source && lead.utm_source.trim() ? lead.utm_source : '-' },
      { key: 'utm_term', name: 'UTM Term', value: lead.utm_term && lead.utm_term.trim() ? lead.utm_term : '-' },
      { key: 'fbclid', name: 'Facebook Click ID', value: lead.fbclid && lead.fbclid.trim() ? lead.fbclid : '-' },
      { key: 'gclid', name: 'Google Click ID', value: lead.gclid && lead.gclid.trim() ? lead.gclid : '-' },
      { key: 'fbc', name: 'Facebook Browser', value: lead.fbc && lead.fbc.trim() ? lead.fbc : '-' },
      { key: 'fbp', name: 'Facebook Pixel', value: lead.fbp && lead.fbp.trim() ? lead.fbp : '-' },
      { key: 'fbid', name: 'Facebook ID', value: lead.fbid && lead.fbid.trim() ? lead.fbid : '-' },
      { key: 'ip', name: 'IP', value: lead.ip && lead.ip.trim() ? lead.ip : '-' },
      { key: 'browser', name: 'Browser', value: lead.browser && lead.browser.trim() ? lead.browser : '-' },
      { key: 'device', name: 'Device', value: lead.device && lead.device.trim() ? lead.device : '-' },
      { key: 'pais', name: 'País', value: lead.pais && lead.pais.trim() ? lead.pais : '-' },
    ];

    return navigationFields;
  };

  return (
    <GestaoLayout>
      <div className="max-w-[1200px] mx-auto space-y-4">
        <Card>
          <CardHeader>
            {/* Linha 1: Título, Filtros, Atualizar e Adicionar */}
            <div className="flex items-center justify-between">
              <CardTitle>Leads</CardTitle>
              
          <div className="flex items-center gap-2">
            {/* Ações em lote - aparecem quando há leads selecionados */}
            {selectedLeads.length > 0 && (
              <>
                {/* Botão de exclusão - apenas para não-colaboradores */}
                {!isCollaborator && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('🗑️ Botão de exclusão em lote clicado');
                      setIsDeleteModalOpen(true);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 brand-radius"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir ({selectedLeads.length})
                  </Button>
                )}
                {isCollaborator && (
                  <div className="text-sm text-muted-foreground">
                    Colaboradores não podem excluir leads
                  </div>
                )}
                
                <Select value={bulkResponsibleId} onValueChange={setBulkResponsibleId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Alterar responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem responsável</SelectItem>
                    {responsibleOptions.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkResponsibleModalOpen(true)}
                  disabled={!bulkResponsibleId}
                  className="brand-radius"
                >
                  <User className="h-4 w-4 mr-2" />
                  Confirmar
                </Button>
              </>
            )}

            {/* Botão para limpar filtros - aparece à esquerda do botão Filtros */}
            {(searchTerm || selectedOrigin || selectedForm || (!isCollaborator && selectedResponsible) || dateRange.from || dateRange.to) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedOrigin('');
                  setSelectedForm('');
                  if (!isCollaborator) {
                    setSelectedResponsible('');
                  }
                  setDateRange({from: '', to: ''});
                }}
                className="text-muted-foreground brand-radius"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar filtros
              </Button>
            )}
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="brand-radius"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            
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
                <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Lead</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 py-0">
                    {!isFormConfigured ? (
                      <div className="space-y-4">
                        {/* Apenas admin e master podem trocar formulário */}
                        {!isCollaborator && (
                          <div>
                            <Label htmlFor="form-select">Selecionar Formulário</Label>
                            <Select value={selectedFormId} onValueChange={handleFormSelect}>
                              <SelectTrigger>
                                <SelectValue placeholder="Escolha um formulário" />
                              </SelectTrigger>
                              <SelectContent>
                                {companyForms.filter(form => form.name === 'Formulário base').map((form) => (
                                  <SelectItem key={form.id} value={form.id}>
                                    {form.name}
                                  </SelectItem>
                                ))}
                                {companyForms.filter(form => form.name === 'Formulário base').length === 0 && (
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
                        
                        {/* Colaboradores veem apenas o formulário embedado */}
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
            </div>

            {/* Modal de Edição do Lead */}
              <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-4">
                      {editingLeadName ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={leadNameValue}
                            onChange={(e) => setLeadNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveLeadName();
                              if (e.key === 'Escape') cancelEditingLeadName();
                            }}
                            autoFocus
                            className="text-lg font-semibold"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={saveLeadName}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditingLeadName}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <span>
                            {editingLead ? (
                              editingLead.nome || 
                              (leadFields.find((f: any) => f.type === 'name')?.id ? 
                                (customValuesMap[editingLead.id]?.[leadFields.find((f: any) => f.type === 'name')?.id] ?? 
                                 getDynamicValue(editingLead as any, `custom_${leadFields.find((f: any) => f.type === 'name')?.id}`)) : 
                                '') || 'Lead sem nome'
                            ) : 'Lead sem nome'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={startEditingLeadName}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Campo de Responsável */}
                      {editingLead && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Responsável:</span>
                          {editingResponsible ? (
                            <div className="flex items-center gap-2">
                              <Select
                                value={selectedResponsibleId}
                                onValueChange={setSelectedResponsibleId}
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue placeholder="Selecione um responsável" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Sem responsável</SelectItem>
                                  {responsibleOptions.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={saveResponsible}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="h-3 w-3 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditingResponsible}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {(editingLead as any).responsavel || 'Sem responsável'}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={startEditingResponsible}
                                className="h-6 w-6 p-0"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground">
                      Criado em: {formatDateTz(editingLead?.created_at)}
                    </div>
                    {editingLead && (
                      <div className="text-sm text-muted-foreground">
                        Formulário de cadastro: {(editingLead as any).formulario_cadastro || 'Formulário'}
                      </div>
                    )}
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
                  
                  {/* Toggle e Tabela de Dados de Navegação */}
                  {editingLead && (
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="navigation-data"
                          checked={showNavigationData}
                          onCheckedChange={setShowNavigationData}
                        />
                        <Label htmlFor="navigation-data" className="text-sm font-medium">
                          Dados de navegação
                        </Label>
                      </div>
                      
                      {showNavigationData && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Informações de navegação e tracking</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Campo</TableHead>
                                <TableHead>Valor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getNavigationData(editingLead).map((field) => (
                                <TableRow key={field.key}>
                                  <TableCell className="font-medium">{field.name}</TableCell>
                                  <TableCell className="text-muted-foreground">{field.value}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
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

          {/* Linha 2: Filtros Colapsáveis */}
          {showFilters && (
            <div className="px-6 pb-4">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Campo de pesquisa geral */}
                <div className="relative min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filtro de origem */}
                <Select value={selectedOrigin || "all"} onValueChange={(value) => setSelectedOrigin(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todas as origens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as origens</SelectItem>
                    {origins.map((origin) => (
                      <SelectItem key={origin.id} value={origin.name}>
                        {origin.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtro de formulário */}
                <Select value={selectedForm || "all"} onValueChange={(value) => setSelectedForm(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos os formulários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os formulários</SelectItem>
                    {formsList.map((form) => (
                      <SelectItem key={form.id} value={form.name}>
                        {form.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtro de responsável - apenas para não-colaboradores */}
                {!isCollaborator && (
                  <Select value={selectedResponsible || "all"} onValueChange={(value) => setSelectedResponsible(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Todos os responsáveis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os responsáveis</SelectItem>
                      <SelectItem value="none">Sem responsável</SelectItem>
                      {responsibleOptions.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Filtro de data */}
                <div className="flex gap-2 items-center">
                  <Input
                    type="date"
                    placeholder="Data inicial"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="w-[140px]"
                  />
                  <span className="text-muted-foreground">até</span>
                  <Input
                    type="date"
                    placeholder="Data final"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="w-[140px]"
                  />
                </div>

              </div>
            </div>
          )}

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
                              checked={selectedLeads.length === leads.length && leads.length > 0}
                              onCheckedChange={handleSelectAllLeads}
                              ref={(el) => {
                                if (el && 'indeterminate' in el) {
                                  (el as any).indeterminate = selectedLeads.length > 0 && selectedLeads.length < leads.length;
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
                        {leads.length === 0 
                          ? 'Nenhum lead de formulário encontrado.' 
                          : 'Nenhum lead encontrado com os filtros aplicados.'}
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
                        <TableRow key={lead.id} className={selectedLeads.includes(lead.id) ? 'bg-muted/50' : ''}>
                        {visibleColumns.map(colKey => {
                            if (colKey === 'selecao') {
                              return (
                                <TableCell key={`${lead.id}_selecao`} className="w-7">
                                  <Checkbox
                                    checked={selectedLeads.includes(lead.id)}
                                    onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                                  />
                                </TableCell>
                              );
                            }
                          if (colKey === 'trash') {
                            // Colaboradores não podem excluir leads
                            if (isCollaborator) {
                              console.log('🚫 Colaborador - ocultando botão de exclusão individual');
                              return (
                                <TableCell key={`${lead.id}_trash`}>
                                  <div className="h-8 w-8"></div>
                                </TableCell>
                              );
                            }
                            console.log('✅ Usuário não-colaborador - mostrando botão de exclusão individual');
                            return (
                              <TableCell key={`${lead.id}_trash`} onClick={(e) => { 
                                e.stopPropagation(); 
                                console.log('🗑️ Botão de exclusão individual clicado para lead:', lead.id);
                                deleteLead(lead.id); 
                              }}>
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
                              const responsibleName = (lead as any).responsavel || '';
                              const isEditingThisLead = editingResponsibleLeadId === lead.id;
                              
                              return (
                                <TableCell key={`${lead.id}_${colKey}`}>
                                  {isEditingThisLead ? (
                                    <div className="flex items-center gap-2 max-w-[200px]">
                                      <Select
                                        value={inlineResponsibleId}
                                        onValueChange={setInlineResponsibleId}
                                      >
                                        <SelectTrigger className="flex-1 min-w-0">
                                          <SelectValue placeholder="Selecione um responsável" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">Sem responsável</SelectItem>
                                          {responsibleOptions.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                              {user.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => saveInlineResponsible(lead.id)}
                                        className="h-6 w-6 p-0 flex-shrink-0"
                                      >
                                        <Check className="h-3 w-3 text-green-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={cancelInlineResponsibleEdit}
                                        className="h-6 w-6 p-0 flex-shrink-0"
                                      >
                                        <X className="h-3 w-3 text-red-600" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div 
                                      className="text-sm cursor-pointer px-2 py-1 rounded flex items-center gap-2 group"
                                      onClick={() => startInlineResponsibleEdit(lead.id, (lead as any).responsible_id)}
                                    >
                                      <User className="h-3 w-3 text-muted-foreground" />
                                      <span className="hover:underline">{responsibleName || 'Sem responsável'}</span>
                                      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                                    </div>
                                  )}
                                </TableCell>
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

      {/* Modal de confirmação para exclusão em lote */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Você está prestes a excluir <strong>{selectedLeads.length} leads</strong> permanentemente.
            </p>
            <p className="text-sm text-muted-foreground">
              Esta ação não pode ser desfeita.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="confirmation-number">
                Digite <strong>{selectedLeads.length}</strong> para confirmar:
              </Label>
              <Input
                id="confirmation-number"
                type="text"
                value={deleteConfirmationNumber}
                onChange={(e) => setDeleteConfirmationNumber(e.target.value)}
                placeholder={`Digite ${selectedLeads.length}`}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteConfirmationNumber('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={deleteConfirmationNumber !== selectedLeads.length.toString()}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir {selectedLeads.length} Leads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação para alteração de responsável em lote */}
      <Dialog open={isBulkResponsibleModalOpen} onOpenChange={setIsBulkResponsibleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Confirmar Alteração de Responsável
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Você está prestes a alterar o responsável de <strong>{selectedLeads.length} leads</strong>.
            </p>
            
            <div className="space-y-2">
              <Label>Novo responsável:</Label>
              <div className="p-3 bg-muted rounded-md">
                {bulkResponsibleId === 'none' ? 'Sem responsável' : 
                 responsibleOptions.find(r => r.id === bulkResponsibleId)?.label || 'Nenhum'}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkResponsibleModalOpen(false);
                setBulkResponsibleId('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBulkUpdateResponsible}
              className="brand-radius"
              variant="brandPrimaryToSecondary"
            >
              <User className="h-4 w-4 mr-2" />
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GestaoLayout>
  );
}


