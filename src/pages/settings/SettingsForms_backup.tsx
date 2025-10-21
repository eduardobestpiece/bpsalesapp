import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Plus, GripVertical, ChevronRight, Copy } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LandingPhoneInput } from '@/components/ui/LandingPhoneInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { LeadFormsManager } from '@/components/Managers/LeadFormsManager';
import { Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Componente para campo arrastável
interface SortableFieldProps {
  fieldId: string;
  field: any;
  onRemove: (fieldId: string) => void;
  isExpanded: boolean;
  isRequired: boolean;
  isPlaceholder: boolean;
  placeholderText: string;
  onToggleExpansion: (fieldId: string) => void;
  onToggleRequired: (fieldId: string) => void;
  onTogglePlaceholder: (fieldId: string) => void;
  onUpdatePlaceholderText: (fieldId: string, text: string) => void;
}

// Input isolado que não é afetado por re-renderizações
const PlaceholderInput = ({ 
  fieldId, 
  initialValue, 
  onSave 
}: { 
  fieldId: string; 
  initialValue: string; 
  onSave: (value: string) => void; 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(initialValue);

  // Sincronizar apenas quando o valor inicial muda (não a cada digitação)
  useEffect(() => {
    if (initialValue !== localValue) {
      setLocalValue(initialValue);
      if (inputRef.current) {
        inputRef.current.value = initialValue;
      }
    }
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    // Não chamar onSave a cada digitação - apenas salvar quando necessário
  };

  const handleBlur = () => {
    onSave(localValue);
  };

  return (
    <Input
      ref={inputRef}
      id={`placeholder-text-field-${fieldId}`}
      defaultValue={initialValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="Digite o texto do placeholder"
      className="bg-[#2A2A2A] border-white/20 text-white placeholder:text-gray-400"
    />
  );
};

const SortableField = ({ 
  fieldId, 
  field, 
  onRemove, 
  isExpanded, 
  isRequired, 
  isPlaceholder,
  placeholderText,
  onToggleExpansion, 
  onToggleRequired,
  onTogglePlaceholder,
  onUpdatePlaceholderText
}: SortableFieldProps) => {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fieldId });

  // Função para verificar se o campo pode ter placeholder
  const canHavePlaceholder = (fieldType: string) => {
    const restrictedTypes = ['endereco', 'slider', 'date', 'time', 'datetime', 'checkbox', 'radio'];
    return !restrictedTypes.includes(fieldType.toLowerCase());
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-b last:border-b-0"
    >
      {/* Linha principal */}
      <div className="grid grid-cols-12 gap-4 p-3 text-sm hover:bg-muted/50 transition-colors">
        <div className="col-span-1 flex items-center">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="col-span-1 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpansion(fieldId)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </div>
        <div className="col-span-4">{field?.name}</div>
        <div className="col-span-4">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {field?.type}
          </span>
        </div>
        <div className="col-span-2 flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onRemove(fieldId)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Seção expandida */}
      {isExpanded && (
        <div className="px-4 pb-4 bg-[#1F1F1F] border-t">
          <div className="space-y-4 pt-3">
            <div className="flex items-center justify-between">
              <Label htmlFor={`required-${fieldId}`} className="text-sm font-medium text-white">
                Obrigatório
              </Label>
              <Switch
                id={`required-${fieldId}`}
                checked={isRequired}
                onCheckedChange={() => onToggleRequired(fieldId)}
              />
            </div>
            
            {/* Toggle Placeholder - apenas para campos que podem ter placeholder */}
            {canHavePlaceholder(field?.type || '') && (
              <div className="flex items-center justify-between">
                <Label htmlFor={`placeholder-${fieldId}`} className="text-sm font-medium text-white">
                  Placeholder
                </Label>
                <Switch
                  id={`placeholder-${fieldId}`}
                  checked={isPlaceholder}
                  onCheckedChange={() => onTogglePlaceholder(fieldId)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor={`placeholder-text-field-${fieldId}`} className="text-sm font-medium text-white">
                Texto do placeholder
              </Label>
              <PlaceholderInput
                fieldId={fieldId}
                initialValue={placeholderText}
                onSave={(value) => onUpdatePlaceholderText(fieldId, value)}
              />
              {/* Texto explicativo para campos restritos */}
              {!canHavePlaceholder(field?.type || '') && (
                <p className="text-xs text-gray-400">
                  Este texto substituirá o título do campo no preview
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Lista de moedas (mesma da página Campos Lead)
const currencies = [
  { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$' },
  { code: 'USD', name: 'Dólar Americano', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£' },
  { code: 'JPY', name: 'Iene Japonês', symbol: '¥' },
  { code: 'CAD', name: 'Dólar Canadense', symbol: 'C$' },
  { code: 'AUD', name: 'Dólar Australiano', symbol: 'A$' },
  { code: 'CHF', name: 'Franco Suíço', symbol: 'CHF' },
  { code: 'CNY', name: 'Yuan Chinês', symbol: '¥' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
  { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
  { code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
  { code: 'UYU', name: 'Peso Uruguaio', symbol: '$' }
];

// Função para formatar nome com primeira letra maiúscula (mesma da página Campos Lead)
const formatName = (value: string) => {
  return value
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Função para buscar dados do CEP
const fetchCEPData = async (cep: string) => {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (!data.erro) {
      return data;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
};

// Função para validar e formatar URL
const validateAndFormatURL = (value: string) => {
  // Remove espaços e converte para minúsculas
  let formattedValue = value.replace(/\s/g, '').toLowerCase();
  
  // Verifica se contém apenas caracteres válidos para URL
  const validUrlPattern = /^[a-z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/;
  
  if (formattedValue && !validUrlPattern.test(formattedValue)) {
    // Remove caracteres inválidos
    formattedValue = formattedValue.replace(/[^a-z0-9\-._~:/?#[\]@!$&'()*+,;=%]/g, '');
  }
  
  return formattedValue;
};

// Função para validar se é uma URL válida
const validateURL = (url: string) => {
  if (!url.trim()) return true; // URL vazia é válida
  
  try {
    // Adiciona protocolo se não tiver
    let testUrl = url;
    if (!url.match(/^https?:\/\//)) {
      testUrl = 'http://' + url;
    }
    
    new URL(testUrl);
    return true;
  } catch {
    return false;
  }
};

export default function SettingsForms() {
  
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'leads' | 'agendamentos' | 'resultados' | 'vendas'>('leads');
  const [selectedLeadForm, setSelectedLeadForm] = useState<{ id: string; name: string } | null>(null);
  const [showLeadFormConfig, setShowLeadFormConfig] = useState(false);
  const [leadFormStyle, setLeadFormStyle] = useState<any>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  const [previewFont, setPreviewFont] = useState<string>('');
  const [isFieldPopoverOpen, setIsFieldPopoverOpen] = useState(false);
  const [availableFields, setAvailableFields] = useState<Array<{
    id: string;
    name: string;
    type: string;
    required?: boolean;
    placeholder?: boolean;
    placeholder_text?: string;
    max_length?: number;
    options?: string;
    searchable?: boolean;
    multiselect?: boolean;
    checkbox_multiselect?: boolean;
    checkbox_limit?: number;
    checkbox_columns?: number;
    checkbox_options?: string;
    checkbox_button_mode?: boolean;
    money_limits?: boolean;
    money_min?: number;
    money_max?: number;
    money_currency?: string;
    slider_limits?: boolean;
    slider_min?: number;
    slider_max?: number;
    slider_step?: boolean;
    slider_step_value?: number;
    slider_start_end?: boolean;
    slider_start?: string;
    slider_end?: string;
    document_cpf?: boolean;
    document_cnpj?: boolean;
    selection_connection?: boolean;
    selection_list?: string;
    connection_addition?: boolean;
    connection_list?: string;
    sender?: string;
  }>>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [requiredFields, setRequiredFields] = useState<Set<string>>(new Set());
  const [placeholderFields, setPlaceholderFields] = useState<Set<string>>(new Set());
  const [placeholderTexts, setPlaceholderTexts] = useState<Record<string, string>>({});
  
  // Estados para menu de cópia de estilo
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [showStyleCopyDialog, setShowStyleCopyDialog] = useState(false);
  const [selectedFormsToCopy, setSelectedFormsToCopy] = useState<string[]>([]);
  
  // Estados para formulário base e origem padrão
  const [isBaseForm, setIsBaseForm] = useState(false);
  const [defaultOrigin, setDefaultOrigin] = useState<string>('');
  const [origins, setOrigins] = useState<any[]>([]);
  
  // Estados para modal do formulário base
  const [showBaseFormModal, setShowBaseFormModal] = useState(false);
  
  // Lista de formulários de leads para cópia de estilo
  const [allLeadForms, setAllLeadForms] = useState<Array<{ id: string; name: string }>>([]);

  // Verificar se há campo de conexão com origens
  const hasConnectionField = useMemo(() => {
    if (!selectedFields || selectedFields.length === 0) return false;
    
    return selectedFields.some(fieldId => {
      const field = availableFields?.find(f => f.id === fieldId);
      return field?.type === 'connection' && field?.connection_list === 'origens';
    });
  }, [selectedFields, availableFields]);

  // Função para alternar formulário base
  const handleBaseFormToggle = async (checked: boolean) => {
    if (!checked) {
      setIsBaseForm(false);
      return;
    }

    // Verificar se já existe outro formulário base
    try {
      const { data: existingBase, error } = await (supabase as any)
        .from('lead_forms')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('is_base_form', true)
        .neq('id', selectedLeadForm?.id);

      if (error) throw error;

      if (existingBase && existingBase.length > 0) {
        toast({
          title: 'Erro',
          description: `Já existe um formulário base: "${existingBase[0].name}". Desmarque-o primeiro.`,
          variant: 'destructive'
        });
        return;
      }

      setIsBaseForm(true);
      
      // Salvar no banco
      if (selectedLeadForm?.id) {
        const { error: updateError } = await (supabase as any)
          .from('lead_forms')
          .update({ is_base_form: true })
          .eq('id', selectedLeadForm.id);

        if (updateError) throw updateError;

        toast({
          title: 'Sucesso',
          description: 'Formulário definido como base com sucesso!'
        });
      }
    } catch (error: any) {
      console.error('Erro ao definir formulário base:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao definir formulário base',
        variant: 'destructive'
      });
    }
  };

  // Carregar origens
  const loadOrigins = async () => {
    if (!selectedCompanyId) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('lead_origins')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .order('name');

      if (error) throw error;
      setOrigins(data || []);
    } catch (error: any) {
      console.error('❌ Erro ao carregar origens:', error);
    }
  };

  // Carregar dados do formulário base
  const loadBaseFormData = async () => {
    if (!selectedLeadForm?.id) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('lead_forms')
        .select('is_base_form, default_origin_id')
        .eq('id', selectedLeadForm.id)
        .single();

      if (error) throw error;
      
      setIsBaseForm(data?.is_base_form || false);
      setDefaultOrigin(data?.default_origin_id || '');
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados do formulário base:', error);
    }
  };

  // Carregar todos os formulários de leads
  const loadAllLeadForms = async () => {
    if (!selectedCompanyId) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('lead_forms')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setAllLeadForms(data || []);
    } catch (error: any) {
      console.error('❌ Erro ao carregar formulários de leads:', error);
    }
  };

  // useEffect para carregar origens e dados do formulário
  useEffect(() => {
    loadOrigins();
    loadBaseFormData();
    loadAllLeadForms();
  }, [selectedCompanyId, selectedLeadForm?.id]);

  // Salvar origem padrão
  const saveDefaultOrigin = async (originId: string) => {
    if (!selectedLeadForm?.id) return;
    
    try {
      const { error } = await (supabase as any)
        .from('lead_forms')
        .update({ default_origin_id: originId })
        .eq('id', selectedLeadForm.id);

      if (error) throw error;
      
      setDefaultOrigin(originId);
      toast({
        title: 'Sucesso',
        description: 'Origem padrão definida com sucesso!'
      });
    } catch (error: any) {
      console.error('Erro ao salvar origem padrão:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao salvar origem padrão',
        variant: 'destructive'
      });
    }
  };

  // Função para abrir modal do formulário base
  const openBaseFormModal = () => {
    setShowBaseFormModal(true);
  };

  // Função para fechar modal do formulário base
  const closeBaseFormModal = () => {
    setShowBaseFormModal(false);
  };

  // Função para copiar estilo entre formulários
  const copyStyleToForms = async (sourceForm: string, targetForms: string[]) => {
    try {
      // Obter o estilo do formulário fonte
      let sourceStyle = null;
      
      if (sourceForm === 'leads') {
        sourceStyle = leadsStyle;
      } else if (sourceForm === 'agendamentos') {
        sourceStyle = getAgStyleFromState();
      } else if (sourceForm === 'resultados') {
        sourceStyle = resultsStyle;
      } else if (sourceForm === 'vendas') {
        sourceStyle = salesStyle;
      }

      if (!sourceStyle) {
        toast({
          title: "Erro",
          description: "Estilo do formulário fonte não encontrado.",
          variant: "destructive",
        });
        return;
      }

      // Aplicar o estilo aos formulários de destino
      for (const targetForm of targetForms) {
        // Verificar se é um formulário de lead específico (UUID)
        if (targetForm.length === 36 && targetForm.includes('-')) {
          try {
            const { error } = await supabase
              .from('lead_form_styles' as any)
              .upsert({
                lead_form_id: targetForm,
                company_id: selectedCompanyId,
                style_config: sourceStyle
              }, {
                onConflict: 'lead_form_id'
              });
            
            if (error) throw error;
          } catch (error: any) {
            console.error('❌ Erro ao aplicar estilo ao formulário de lead:', error);
          }
        } else if (targetForm === 'leads') {
          const newLeadsStyle = { ...leadsStyle, ...sourceStyle };
          setLeadsStyle((prev) => ({ ...prev, ...sourceStyle }));
          
          // Aplicar estados de edição para Leads
          if (sourceStyle.fieldBgColor) {
            setEditFieldBg(sourceStyle.fieldBgColor);
          }
          if (sourceStyle.fieldTextColor) {
            setEditFieldText(sourceStyle.fieldTextColor);
          }
          if (sourceStyle.selectBgColor) {
            setEditSelBg(sourceStyle.selectBgColor);
          }
          if (sourceStyle.selectTextColor) {
            setEditSelText(sourceStyle.selectTextColor);
          }
          if (sourceStyle.borderColorNormal) {
            setEditBorderNorm(sourceStyle.borderColorNormal);
          }
          if (sourceStyle.borderColorActive) {
            setEditBorderActive(sourceStyle.borderColorActive);
          }
          
          await saveLeadFormStyle(newLeadsStyle);
        } else if (targetForm === 'agendamentos') {
          
          // Para agendamentos, usar a função existente que aplica todos os campos
          applyAgStyleToState(sourceStyle);
          
          // Aplicar também os estados principais (não apenas os de edição)
          if (sourceStyle.fieldBgColor) {
            setFieldBgColor(sourceStyle.fieldBgColor);
            setEditFieldBg(sourceStyle.fieldBgColor);
          }
          if (sourceStyle.fieldTextColor) {
            setFieldTextColor(sourceStyle.fieldTextColor);
            setEditFieldText(sourceStyle.fieldTextColor);
          }
          if (sourceStyle.selectBgColor) {
            setSelectBgColor(sourceStyle.selectBgColor);
            setEditSelBg(sourceStyle.selectBgColor);
          }
          if (sourceStyle.selectTextColor) {
            setSelectTextColor(sourceStyle.selectTextColor);
            setEditSelText(sourceStyle.selectTextColor);
          }
          if (sourceStyle.borderColorNormal) {
            setBorderColorNormal(sourceStyle.borderColorNormal);
            setEditBorderNorm(sourceStyle.borderColorNormal);
          }
          if (sourceStyle.borderColorActive) {
            setBorderColorActive(sourceStyle.borderColorActive);
            setEditBorderActive(sourceStyle.borderColorActive);
          }
          
          await saveFormStyle('agendamentos');
        } else if (targetForm === 'resultados') {
          const newResultsStyle = { ...resultsStyle, ...sourceStyle };
          setResultsStyle((prev) => ({ ...prev, ...sourceStyle }));
          
          // Aplicar estados principais para Resultados
          if (sourceStyle.fieldBgColor) {
            setFieldBgColor(sourceStyle.fieldBgColor);
            setEditFieldBg(sourceStyle.fieldBgColor);
          }
          if (sourceStyle.fieldTextColor) {
            setFieldTextColor(sourceStyle.fieldTextColor);
            setEditFieldText(sourceStyle.fieldTextColor);
          }
          if (sourceStyle.selectBgColor) {
            setSelectBgColor(sourceStyle.selectBgColor);
            setEditSelBg(sourceStyle.selectBgColor);
          }
          if (sourceStyle.selectTextColor) {
            setSelectTextColor(sourceStyle.selectTextColor);
            setEditSelText(sourceStyle.selectTextColor);
          }
          if (sourceStyle.borderColorNormal) {
            setBorderColorNormal(sourceStyle.borderColorNormal);
            setEditBorderNorm(sourceStyle.borderColorNormal);
          }
          if (sourceStyle.borderColorActive) {
            setBorderColorActive(sourceStyle.borderColorActive);
            setEditBorderActive(sourceStyle.borderColorActive);
          }
          
          await saveFormStyle('resultados');
        } else if (targetForm === 'vendas') {
          const newSalesStyle = { ...salesStyle, ...sourceStyle };
          setSalesStyle((prev) => ({ ...prev, ...sourceStyle }));
          
          // Aplicar estados principais para Vendas
          if (sourceStyle.fieldBgColor) {
            setFieldBgColor(sourceStyle.fieldBgColor);
            setEditFieldBg(sourceStyle.fieldBgColor);
          }
          if (sourceStyle.fieldTextColor) {
            setFieldTextColor(sourceStyle.fieldTextColor);
            setEditFieldText(sourceStyle.fieldTextColor);
          }
          if (sourceStyle.selectBgColor) {
            setSelectBgColor(sourceStyle.selectBgColor);
            setEditSelBg(sourceStyle.selectBgColor);
          }
          if (sourceStyle.selectTextColor) {
            setSelectTextColor(sourceStyle.selectTextColor);
            setEditSelText(sourceStyle.selectTextColor);
          }
          if (sourceStyle.borderColorNormal) {
            setBorderColorNormal(sourceStyle.borderColorNormal);
            setEditBorderNorm(sourceStyle.borderColorNormal);
          }
          if (sourceStyle.borderColorActive) {
            setBorderColorActive(sourceStyle.borderColorActive);
            setEditBorderActive(sourceStyle.borderColorActive);
          }
          
          await saveFormStyle('vendas');
        }
      }

      toast({
        title: "Sucesso",
        description: `Estilo copiado para ${targetForms.length} formulário(s).`,
      });

      setShowStyleCopyDialog(false);
      setSelectedFormsToCopy([]);
    } catch (error) {
      console.error('❌ Erro ao copiar estilo:', error);
      toast({
        title: "Erro",
        description: "Erro ao copiar estilo dos formulários.",
        variant: "destructive",
      });
    }
  };


  // Sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Função para lidar com o reordenamento
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSelectedFields((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over?.id as string);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Função para alternar expansão de campo
  const toggleFieldExpansion = useCallback((fieldId: string) => {
    setExpandedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
  }, []);

  // Função para alternar campo obrigatório
  const toggleFieldRequired = useCallback((fieldId: string) => {
    setRequiredFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
  }, []);

  // Função para alternar placeholder (apenas oculta o nome do campo no preview)
  const toggleFieldPlaceholder = useCallback((fieldId: string) => {
    setPlaceholderFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
  }, []);

  // Função para atualizar texto do placeholder
  const updatePlaceholderText = useCallback((fieldId: string, text: string) => {
    setPlaceholderTexts(prev => ({
      ...prev,
      [fieldId]: text
    }));
  }, []);


  // Função auxiliar para verificar se o campo pode ter placeholder (para uso na prévia)
  const canHavePlaceholderField = (fieldType: string) => {
    const restrictedTypes = ['endereco', 'slider', 'date', 'time', 'datetime', 'checkbox', 'radio'];
    return !restrictedTypes.includes(fieldType.toLowerCase());
  };

  // Função para carregar dados salvos do formulário
  const loadFormData = async (formId: string) => {
    try {
      const { data: formFields, error } = await supabase
        .from('lead_form_fields' as any)
        .select('*')
        .eq('lead_form_id', formId)
        .order('field_order');

      if (error) throw error;

      if (formFields && formFields.length > 0) {
        // Carregar campos selecionados
        const fieldIds = formFields.map(f => f.field_id);
        setSelectedFields(fieldIds);

        // Carregar campos obrigatórios
        const requiredIds = formFields.filter(f => f.is_required).map(f => f.field_id);
        setRequiredFields(new Set(requiredIds));

        // Carregar campos com placeholder habilitado
        const placeholderIds = formFields.filter(f => f.placeholder_enabled).map(f => f.field_id);
        setPlaceholderFields(new Set(placeholderIds));

        // Carregar textos de placeholder
        const placeholderTextsData: Record<string, string> = {};
        formFields.forEach(field => {
          if (field.placeholder_text) {
            placeholderTextsData[field.field_id] = field.placeholder_text;
          }
        });
        setPlaceholderTexts(placeholderTextsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do formulário:', error);
    }
  };

  // Campos padrão removidos - apenas campos personalizados serão exibidos

  // Carregar campos personalizados da tabela lead_fields com todas as configurações
  const loadCustomFields = async () => {
    if (!selectedCompanyId) return;
    
    try {
      setLoadingFields(true);
      const { data, error } = await supabase
        .from('lead_fields' as any)
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('order');

      if (error) throw error;

      // Mapear campos personalizados com todas as configurações
      const customFields = (data || []).map((field: any) => ({
        id: field.id,
        name: field.name,
        type: field.type,
        // Incluir todas as configurações do campo
        required: field.required,
        placeholder: field.placeholder,
        placeholder_text: field.placeholder_text,
        max_length: field.max_length,
        options: field.options,
        searchable: field.searchable,
        multiselect: field.multiselect,
        checkbox_multiselect: field.checkbox_multiselect,
        checkbox_limit: field.checkbox_limit,
        checkbox_columns: field.checkbox_columns,
        checkbox_options: field.checkbox_options,
        checkbox_button_mode: field.checkbox_button_mode,
        money_limits: field.money_limits,
        money_min: field.money_min,
        money_max: field.money_max,
        money_currency: field.money_currency,
        slider_limits: field.slider_limits,
        slider_min: field.slider_min,
        slider_max: field.slider_max,
        slider_step: field.slider_step,
        slider_step_value: field.slider_step_value,
        slider_start_end: field.slider_start_end,
        slider_start: field.slider_start,
        slider_end: field.slider_end,
        document_cpf: field.document_cpf,
        document_cnpj: field.document_cnpj,
        selection_connection: field.selection_connection,
        selection_list: field.selection_list,
        connection_addition: field.connection_addition,
        connection_list: field.connection_list,
        sender: field.sender
      }));

      setAvailableFields(customFields);
    } catch (error) {
      console.error('Erro ao carregar campos personalizados:', error);
      // Em caso de erro, não mostrar nenhum campo
      setAvailableFields([]);
    } finally {
      setLoadingFields(false);
    }
  };

  // Carregar campos quando o componente montar ou quando a empresa mudar
  useEffect(() => {
    loadCustomFields();
  }, [selectedCompanyId]);

  // Limpar duplicatas sempre que selectedFields mudar
  useEffect(() => {
    if (selectedFields && selectedFields.length > 0) {
      const uniqueFields = selectedFields.filter((id, index, self) => self.indexOf(id) === index);
      if (uniqueFields.length !== selectedFields.length) {
        setSelectedFields(uniqueFields);
      }
    }
  }, [selectedFields]);

  // Filtrar campos baseado na pesquisa
  const filteredFields = availableFields.filter(field =>
    field.name.toLowerCase().includes(fieldSearchQuery.toLowerCase())
  );

  // Função para alternar seleção de campo
  const toggleFieldSelection = (fieldId: string, event?: React.MouseEvent) => {
    // Prevenir que o Popover feche
    if (event) {
      event.stopPropagation();
    }
    
    if (setSelectedFields) {
      setSelectedFields(prev => {
        const newFields = prev.includes(fieldId) 
          ? prev.filter(id => id !== fieldId)
          : [...prev, fieldId];
        
        // Remover duplicatas
        return newFields.filter((id, index, self) => self.indexOf(id) === index);
      });
    }
  };

  // Função para remover campo da seleção
  const removeField = useCallback((fieldId: string) => {
    if (setSelectedFields) {
      setSelectedFields(prev => {
        const newFields = prev.filter(id => id !== fieldId);
        // Remover duplicatas
        return newFields.filter((id, index, self) => self.indexOf(id) === index);
      });
    }
  }, [setSelectedFields]);

  // Função para salvar campos selecionados
  const saveSelectedFields = async () => {
    if (!selectedLeadForm?.id) {
      toast({ 
        title: 'Erro', 
        description: 'Nenhum formulário selecionado',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedFields || selectedFields.length === 0) {
      toast({ 
        title: 'Erro', 
        description: 'Nenhum campo selecionado',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Primeiro, remover todos os campos existentes para este formulário
      const { error: deleteError } = await supabase
        .from('lead_form_fields' as any)
        .delete()
        .eq('lead_form_id', selectedLeadForm.id);

      if (deleteError) throw deleteError;

      // Inserir os novos campos selecionados
      const fieldsToInsert = (selectedFields || []).map((fieldId, index) => {
        const field = availableFields.find(f => f.id === fieldId);
        return {
          lead_form_id: selectedLeadForm.id,
          company_id: selectedCompanyId,
          field_id: fieldId,
          field_name: field?.name || fieldId,
          field_type: field?.type || 'text',
          field_order: index,
          is_required: requiredFields.has(fieldId) || ['email', 'telefone'].includes(fieldId), // Campos marcados como obrigatórios ou email/telefone
          placeholder_text: placeholderTexts[fieldId] || null, // Texto do placeholder personalizado
          placeholder_enabled: placeholderFields.has(fieldId) // Estado do toggle placeholder
        };
      });

      const { error: insertError } = await supabase
        .from('lead_form_fields' as any)
        .insert(fieldsToInsert);

      if (insertError) throw insertError;

      toast({ 
        title: 'Sucesso', 
        description: 'Campos do formulário salvos com sucesso'
      });
    } catch (error) {
      console.error('Erro ao salvar campos:', error);
      toast({ 
        title: 'Erro', 
        description: 'Erro ao salvar campos do formulário',
        variant: 'destructive'
      });
    }
  };

  // Carregar campos salvos do formulário
  const loadLeadFormFields = async (formId: string) => {
    try {
      const { data, error } = await supabase
        .from('lead_form_fields' as any)
        .select('field_id, field_name, field_type, field_order, is_required')
        .eq('lead_form_id', formId)
        .eq('status', 'active')
        .order('field_order');

      if (error) throw error;
      
      if (data && data.length > 0) {
        const fieldIds = data.map((field: any) => field.field_id);
        // Remover duplicatas ao carregar
        const uniqueFieldIds = fieldIds.filter((id, index, self) => self.indexOf(id) === index);
        setSelectedFields(uniqueFieldIds);
      } else {
        // Se não há campos salvos, definir campos padrão (email e telefone)
        setSelectedFields(['email', 'telefone']);
      }
    } catch (error) {
      console.error('Erro ao carregar campos do formulário:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar campos do formulário', variant: 'destructive' });
    }
  };

  // Carregar estilo do formulário selecionado
  const loadLeadFormStyle = async (formId: string) => {
    try {
      const { data, error } = await supabase
        .from('lead_form_styles' as any)
        .select('style_config')
        .eq('lead_form_id', formId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setLeadFormStyle(data.style_config);
      } else {
        // Criar estilo padrão se não existir
        const defaultStyle = {
          fieldSpacingPx: 16,
          fontFamily: "",
          fontSizeLabelPx: 14,
          fontSizeInputPx: 16,
          fontSizeButtonPx: 16,
          fieldBgColor: "#2A2A2A",
          fieldTextColor: "#FFFFFF",
          selectBgColor: "#E50F5E",
          selectTextColor: "#FFFFFF",
          borderRadiusPx: 12,
          borderWidthNormalPx: 1,
          borderWidthFocusPx: 2,
          borderColorNormal: "#FFFFFF33",
          borderColorActive: "#E50F5E",
          buttonSpacingPx: 16,
          buttonBgColorNormal: "#E50F5E",
          buttonBgColorPressed: "#7c032e",
          buttonTextColorNormal: "#FFFFFF",
          buttonTextColorPressed: "#FFFFFF",
          buttonBorderRadiusPx: 12,
          buttonBorderWidthNormalPx: 0,
          buttonBorderWidthPressedPx: 0,
          buttonBorderColorNormal: "#FFFFFF00",
          buttonBorderColorPressed: "#FFFFFF00"
        };
        
        const { error: insertError } = await supabase
          .from('lead_form_styles' as any)
          .upsert({
            lead_form_id: formId,
            company_id: selectedCompanyId,
            style_config: defaultStyle
          }, {
            onConflict: 'lead_form_id'
          });

        if (insertError) throw insertError;
        
        setLeadFormStyle(defaultStyle);
      }
    } catch (error) {
      console.error('Erro ao carregar estilo do formulário:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar configurações do formulário', variant: 'destructive' });
    }
  };

  // Escutar evento de abertura de configuração de formulário
  useEffect(() => {
    const handleOpenFormConfig = (event: CustomEvent) => {
      const { formId, formName } = event.detail;
      setSelectedLeadForm({ id: formId, name: formName });
      setShowLeadFormConfig(true);
      loadLeadFormStyle(formId);
      loadLeadFormFields(formId);
      loadFormData(formId); // Carregar dados salvos do formulário
    };

    window.addEventListener('open-form-config', handleOpenFormConfig as EventListener);
    return () => window.removeEventListener('open-form-config', handleOpenFormConfig as EventListener);
  }, [selectedCompanyId]);

  // Salvar estilo do formulário
  const saveLeadFormStyle = async (styleConfig: any) => {
    if (!selectedLeadForm?.id) return;
    
    try {
      const { error } = await supabase
        .from('lead_form_styles' as any)
        .upsert({
          lead_form_id: selectedLeadForm.id,
          company_id: selectedCompanyId,
          style_config: styleConfig
        }, {
          onConflict: 'lead_form_id'
        });

      if (error) throw error;
      
      setLeadFormStyle(styleConfig);
      
      // Também salvar no banco geral para cópia de estilo
      await saveLeadFormStyleToGeneral(styleConfig);
      
      toast({ title: 'Sucesso', description: 'Estilo do formulário salvo com sucesso' });
    } catch (error) {
      console.error('Erro ao salvar estilo do formulário:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar configurações', variant: 'destructive' });
    }
  };

  // Salvar estilo do formulário de leads no banco geral
  const saveLeadFormStyleToGeneral = async (styleConfig: any) => {
    if (!selectedCompanyId) return;
    
    try {
      const { error } = await (supabase as any)
        .from('form_styles')
        .upsert({
          company_id: selectedCompanyId,
          form_type: 'leads',
          style: styleConfig,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id,form_type'
        });
      
      if (error) throw error;
    } catch (e: any) {
      console.error('[SettingsForms] Erro ao salvar estilo de leads no banco geral', e);
      toast({
        title: 'Erro ao salvar estilo',
        description: e?.message || String(e),
        variant: 'destructive',
      });
    }
  };

  const [spacingFieldsPx, setSpacingFieldsPx] = useState<number>(16);
  // Removido conforme pedido do usuário: controle de espaçamento de rótulo
  // Mantemos fixo um espaçamento padrão suave
  const [spacingLabelPx] = useState<number>(8);
  const [fontSizeLabelPx, setFontSizeLabelPx] = useState<number>(14);
  const [fontSizeInputPx, setFontSizeInputPx] = useState<number>(16);
  const [fontSizeButtonPx, setFontSizeButtonPx] = useState<number>(16);
  // Campos - aparência
  const [fieldBgColor, setFieldBgColor] = useState<string>('#2A2A2A');
  const [fieldTextColor, setFieldTextColor] = useState<string>('#FFFFFF');
  const [selectBgColor, setSelectBgColor] = useState<string>('#E50F5E');
  const [selectTextColor, setSelectTextColor] = useState<string>('#FFFFFF');
  const [borderRadiusPx, setBorderRadiusPx] = useState<number>(12);
  const [borderWidthNormalPx, setBorderWidthNormalPx] = useState<number>(1);
  const [borderWidthFocusPx, setBorderWidthFocusPx] = useState<number>(2);
  const [borderColorNormal, setBorderColorNormal] = useState<string>('#FFFFFF33');
  const [borderColorActive, setBorderColorActive] = useState<string>('#E50F5E');
  // Botão - aparência
  const [buttonSpacingPx, setButtonSpacingPx] = useState<number>(16);
  const [btnBg1, setBtnBg1] = useState<string>('#E50F5E');
  const [btnBg2, setBtnBg2] = useState<string>('#7c032e');
  const [btnAngle, setBtnAngle] = useState<number>(90);
  const [btnBgActive1, setBtnBgActive1] = useState<string>('#c80d52');
  const [btnBgActive2, setBtnBgActive2] = useState<string>('#630226');
  const [btnAngleActive, setBtnAngleActive] = useState<number>(90);
  const [btnText, setBtnText] = useState<string>('#FFFFFF');
  const [btnTextActive, setBtnTextActive] = useState<string>('#FFFFFF');
  const [btnRadius, setBtnRadius] = useState<number>(12);
  const [btnBorderWidth, setBtnBorderWidth] = useState<number>(0);
  const [btnBorderWidthActive, setBtnBorderWidthActive] = useState<number>(0);
  const [btnBorderColor, setBtnBorderColor] = useState<string>('#FFFFFF00');
  const [btnBorderColorActive, setBtnBorderColorActive] = useState<string>('#FFFFFF00');
  // Estados de edição para permitir digitação contínua sem perder foco
  const [editFieldBg, setEditFieldBg] = useState<string>(fieldBgColor);
  const [editFieldText, setEditFieldText] = useState<string>(fieldTextColor);
  const [editSelBg, setEditSelBg] = useState<string>(selectBgColor);
  const [editSelText, setEditSelText] = useState<string>(selectTextColor);
  const [editBorderNorm, setEditBorderNorm] = useState<string>(borderColorNormal);
  const [editBorderActive, setEditBorderActive] = useState<string>(borderColorActive);

  const debounceRef = useRef<any>();
  const isValidHex = (v: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim());
  const commitColor = (target: 'fieldBg'|'fieldText'|'selBg'|'selText'|'borderNorm'|'borderActive', value: string) => {
    if (!isValidHex(value)) return;
    switch (target) {
      case 'fieldBg': setFieldBgColor(value); break;
      case 'fieldText': setFieldTextColor(value); break;
      case 'selBg': setSelectBgColor(value); break;
      case 'selText': setSelectTextColor(value); break;
      case 'borderNorm': setBorderColorNormal(value); break;
      case 'borderActive': setBorderColorActive(value); break;
    }
  };
  const scheduleCommit = (target: Parameters<typeof commitColor>[0], value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commitColor(target, value), 300);
  };
  // Sincronizar editores quando estado real muda por outro meio
  useEffect(()=>setEditFieldBg(fieldBgColor),[fieldBgColor]);
  useEffect(()=>setEditFieldText(fieldTextColor),[fieldTextColor]);
  useEffect(()=>setEditSelBg(selectBgColor),[selectBgColor]);
  useEffect(()=>setEditSelText(selectTextColor),[selectTextColor]);
  useEffect(()=>setEditBorderNorm(borderColorNormal),[borderColorNormal]);
  useEffect(()=>setEditBorderActive(borderColorActive),[borderColorActive]);
  const [subTabs, setSubTabs] = useState<{ leads: 'campos' | 'visual' | 'integracoes'; agendamentos: 'visual' | 'integracoes'; resultados: 'etapas' | 'motivos' | 'visual' | 'integracoes'; vendas: 'campos' | 'produtos' | 'visual' | 'integracoes'; }>({
    leads: 'campos',
    agendamentos: 'visual',
    resultados: 'etapas',
    vendas: 'campos',
  });
  // Controlar tipo de agendamento no nível superior para não resetar durante edições de visual
  const [agTypeGlobal, setAgTypeGlobal] = useState<'novo' | 'continuacao' | 'negociacao' | 'remarcacao'>('novo');
  // Controlar seção aberta de Visual (Agendamentos) no nível superior para evitar recolher ao editar
  const [agOpenSection, setAgOpenSection] = useState<'form'|'fields'|'button'|null>('form');

  // Estilo compartilhado para outras abas (Leads, Resultados, Vendas)
  type StyleCfg = {
    spacingFieldsPx: number;
    previewFont: string;
    fontSizeLabelPx: number;
    fontSizeInputPx: number;
    fontSizeButtonPx: number;
    fieldBgColor: string;
    fieldTextColor: string;
    selectBgColor: string;
    selectTextColor: string;
    borderRadiusPx: number;
    borderWidthNormalPx: number;
    borderWidthFocusPx: number;
    borderColorNormal: string;
    borderColorActive: string;
    buttonSpacingPx: number;
    btnBg1: string; btnBg2: string; btnAngle: number;
    btnBgActive1: string; btnBgActive2: string; btnAngleActive: number;
    btnText: string; btnTextActive: string;
    btnRadius: number; btnBorderWidth: number; btnBorderWidthActive: number;
    btnBorderColor: string; btnBorderColorActive: string;
  };
  const defaultStyle = (): StyleCfg => ({
    spacingFieldsPx: 16,
    previewFont: '',
    fontSizeLabelPx: 14,
    fontSizeInputPx: 16,
    fontSizeButtonPx: 16,
    fieldBgColor: '#2A2A2A',
    fieldTextColor: '#FFFFFF',
    selectBgColor: '#E50F5E',
    selectTextColor: '#FFFFFF',
    borderRadiusPx: 12,
    borderWidthNormalPx: 1,
    borderWidthFocusPx: 2,
    borderColorNormal: '#FFFFFF33',
    borderColorActive: '#E50F5E',
    buttonSpacingPx: 16,
    btnBg1: '#E50F5E', btnBg2: '#7c032e', btnAngle: 90,
    btnBgActive1: '#c80d52', btnBgActive2: '#630226', btnAngleActive: 90,
    btnText: '#FFFFFF', btnTextActive: '#FFFFFF',
    btnRadius: 12, btnBorderWidth: 0, btnBorderWidthActive: 0,
    btnBorderColor: '#FFFFFF00', btnBorderColorActive: '#FFFFFF00',
  });
  const [leadsStyle, setLeadsStyle] = useState<StyleCfg>(defaultStyle());
  const [resultsStyle, setResultsStyle] = useState<StyleCfg>(defaultStyle());
  const [salesStyle, setSalesStyle] = useState<StyleCfg>(defaultStyle());
  const [leadsOpenSection, setLeadsOpenSection] = useState<'form'|'fields'|'button'|null>('form');
  const [resultsOpenSection, setResultsOpenSection] = useState<'form'|'fields'|'button'|null>('form');
  const [salesOpenSection, setSalesOpenSection] = useState<'form'|'fields'|'button'|null>('form');

  // Etapas (Resultados)
  const [resultStages, setResultStages] = useState<string[]>([]);
  const [qualifiedStageIdx, setQualifiedStageIdx] = useState<number | null>(null);
  const newStageRef = useRef<HTMLInputElement | null>(null);
  // Entrada da nova etapa (com suporte a composição de acentos)
  const [stageInput, setStageInput] = useState<string>('');
  const [isComposingStage, setIsComposingStage] = useState<boolean>(false);
  // Edição inline de etapas existentes
  const [editingStageIdx, setEditingStageIdx] = useState<number | null>(null);
  const [editingStageInput, setEditingStageInput] = useState<string>('');
  const [isComposingEdit, setIsComposingEdit] = useState<boolean>(false);
  const editingInputRef = useRef<HTMLInputElement | null>(null);
  // Removido: auto-focus para não roubar foco de outros campos

  useEffect(() => {
    if (editingStageIdx !== null && editingInputRef.current) {
      editingInputRef.current.focus();
      const el = editingInputRef.current;
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editingStageIdx]);

  const startEditStage = (idx: number) => {
    setEditingStageIdx(idx);
    setEditingStageInput(resultStages[idx] || '');
  };

  const commitEditStage = () => {
    if (editingStageIdx === null) return;
    const value = editingStageInput.trim();
    if (value) {
      setResultStages((prev) => {
        const arr = [...prev];
        arr[editingStageIdx] = value;
        return arr;
      });
    }
    setEditingStageIdx(null);
    setEditingStageInput('');
  };

  const cancelEditStage = () => {
    setEditingStageIdx(null);
    setEditingStageInput('');
  };

  type FormType = 'leads' | 'agendamentos' | 'resultados' | 'vendas';

  const getAgStyleFromState = (): StyleCfg => ({
    spacingFieldsPx,
    previewFont,
    fontSizeLabelPx,
    fontSizeInputPx,
    fontSizeButtonPx,
    fieldBgColor,
    fieldTextColor,
    selectBgColor,
    selectTextColor,
    borderRadiusPx,
    borderWidthNormalPx,
    borderWidthFocusPx,
    borderColorNormal,
    borderColorActive,
    buttonSpacingPx,
    btnBg1, btnBg2, btnAngle,
    btnBgActive1, btnBgActive2, btnAngleActive,
    btnText, btnTextActive,
    btnRadius, btnBorderWidth, btnBorderWidthActive,
    btnBorderColor, btnBorderColorActive,
  });

  const applyAgStyleToState = (s: Partial<StyleCfg>) => {
    if (typeof s.spacingFieldsPx === 'number') setSpacingFieldsPx(s.spacingFieldsPx);
    if (typeof s.previewFont === 'string') setPreviewFont(s.previewFont);
    if (typeof s.fontSizeLabelPx === 'number') setFontSizeLabelPx(s.fontSizeLabelPx);
    if (typeof s.fontSizeInputPx === 'number') setFontSizeInputPx(s.fontSizeInputPx);
    if (typeof s.fontSizeButtonPx === 'number') setFontSizeButtonPx(s.fontSizeButtonPx);
    if (typeof s.fieldBgColor === 'string') setFieldBgColor(s.fieldBgColor);
    if (typeof s.fieldTextColor === 'string') setFieldTextColor(s.fieldTextColor);
    if (typeof s.selectBgColor === 'string') setSelectBgColor(s.selectBgColor);
    if (typeof s.selectTextColor === 'string') setSelectTextColor(s.selectTextColor);
    if (typeof s.borderRadiusPx === 'number') setBorderRadiusPx(s.borderRadiusPx);
    if (typeof s.borderWidthNormalPx === 'number') setBorderWidthNormalPx(s.borderWidthNormalPx);
    if (typeof s.borderWidthFocusPx === 'number') setBorderWidthFocusPx(s.borderWidthFocusPx);
    if (typeof s.borderColorNormal === 'string') setBorderColorNormal(s.borderColorNormal);
    if (typeof s.borderColorActive === 'string') setBorderColorActive(s.borderColorActive);
    if (typeof s.buttonSpacingPx === 'number') setButtonSpacingPx(s.buttonSpacingPx);
    if (typeof s.btnBg1 === 'string') setBtnBg1(s.btnBg1);
    if (typeof s.btnBg2 === 'string') setBtnBg2(s.btnBg2);
    if (typeof s.btnAngle === 'number') setBtnAngle(s.btnAngle);
    if (typeof s.btnBgActive1 === 'string') setBtnBgActive1(s.btnBgActive1);
    if (typeof s.btnBgActive2 === 'string') setBtnBgActive2(s.btnBgActive2);
    if (typeof s.btnAngleActive === 'number') setBtnAngleActive(s.btnAngleActive);
    if (typeof s.btnText === 'string') setBtnText(s.btnText);
    if (typeof s.btnTextActive === 'string') setBtnTextActive(s.btnTextActive);
    if (typeof s.btnRadius === 'number') setBtnRadius(s.btnRadius);
    if (typeof s.btnBorderWidth === 'number') setBtnBorderWidth(s.btnBorderWidth);
    if (typeof s.btnBorderWidthActive === 'number') setBtnBorderWidthActive(s.btnBorderWidthActive);
    if (typeof s.btnBorderColor === 'string') setBtnBorderColor(s.btnBorderColor);
    if (typeof s.btnBorderColorActive === 'string') setBtnBorderColorActive(s.btnBorderColorActive);
  };

  const saveFormStyle = async (formType: FormType) => {
    if (!selectedCompanyId) {
      toast({ title: 'Selecione uma empresa para salvar', variant: 'destructive' });
      return;
    }
    const payload: any = {
      company_id: selectedCompanyId,
      form_type: formType,
      style: formType === 'agendamentos' ? getAgStyleFromState() : (formType === 'leads' ? leadsStyle : formType === 'resultados' ? resultsStyle : salesStyle),
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    try {
      console.debug('[SettingsForms] Salvando estilo', { formType, payload });
      const { error } = await (supabase as any)
        .from('form_styles')
        .upsert([payload], { onConflict: 'company_id,form_type' });
      if (error) {
        console.error('[SettingsForms] Erro no upsert', error);
        throw error;
      }
      toast({ title: 'Estilo salvo com sucesso!' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar estilo', description: e?.message || String(e), variant: 'destructive' });
    }
  };

  // Salvar etapas de Resultados
  const saveResultStages = async () => {
    if (!selectedCompanyId) {
      toast({ title: 'Selecione uma empresa para salvar', variant: 'destructive' });
      return;
    }
    try {
      console.debug('[SettingsForms] Salvando etapas', { resultStages, qualifiedStageIdx });
      const { error: delError } = await (supabase as any)
        .from('result_stages')
        .delete()
        .eq('company_id', selectedCompanyId);
      if (delError) throw delError;
      if (resultStages.length > 0) {
        const rows = resultStages.map((name, idx) => ({
          company_id: selectedCompanyId,
          name,
          order_index: idx,
          is_qualified: qualifiedStageIdx === idx,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        const { error: insError } = await (supabase as any)
          .from('result_stages')
          .insert(rows);
        if (insError) throw insError;
      }
      toast({ title: 'Etapas salvas!' });
    } catch (e: any) {
      console.error('[SettingsForms] Erro ao salvar etapas', e);
      toast({ title: 'Erro ao salvar etapas', description: e?.message || String(e), variant: 'destructive' });
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!selectedCompanyId) return;
      try {
        const { data, error } = await (supabase as any)
          .from('form_styles')
          .select('form_type, style')
          .eq('company_id', selectedCompanyId);
        if (error) throw error;
        (data || []).forEach((row: any) => {
          const s = row?.style || {};
          if (row.form_type === 'agendamentos') {
            applyAgStyleToState(s);
          }
          if (row.form_type === 'leads') setLeadsStyle((prev) => ({ ...prev, ...s }));
          if (row.form_type === 'resultados') setResultsStyle((prev) => ({ ...prev, ...s }));
          if (row.form_type === 'vendas') setSalesStyle((prev) => ({ ...prev, ...s }));
        });
      } catch (e: any) {
        console.error('[SettingsForms] Erro ao carregar estilos', e);
        toast({ title: 'Erro ao carregar estilos', description: e?.message || String(e), variant: 'destructive' });
      }
    };
    load();
  }, [selectedCompanyId]);

  // Carregar etapas (Resultados)
  useEffect(() => {
    const loadStages = async () => {
      if (!selectedCompanyId) return;
      try {
        const { data, error } = await (supabase as any)
          .from('result_stages')
          .select('name, order_index, is_qualified')
          .eq('company_id', selectedCompanyId)
          .order('order_index');
        if (error) throw error;
        const rows = data || [];
        setResultStages(rows.map((r: any) => r.name));
        const qIdx = rows.findIndex((r: any) => r.is_qualified);
        setQualifiedStageIdx(qIdx >= 0 ? qIdx : null);
      } catch (e: any) {
        console.error('[SettingsForms] Erro ao carregar etapas', e);
        toast({ title: 'Erro ao carregar etapas', description: e?.message || String(e), variant: 'destructive' });
      }
    };
    loadStages();
  }, [selectedCompanyId]);

  const TwoColumns = ({ left, right }: { left: React.ReactNode; right: React.ReactNode }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );

  // Campo dedicado para criar nova etapa, mantendo foco estável durante digitação
  const NewStageField = ({ initialValue, onAdd }: { initialValue: string; onAdd: (name: string) => void }) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const activeRef = useRef<boolean>(false);
    const composingRef = useRef<boolean>(false);
    const [localName, setLocalName] = useState<string>(initialValue || '');
    useEffect(() => {
      if (activeRef.current && inputRef.current) {
        inputRef.current.focus({ preventScroll: true } as any);
      }
    });
    return (
      <div className="flex gap-2" onMouseDown={(e)=> e.stopPropagation()}>
        <input
          ref={(el)=> { inputRef.current = el; if (el) newStageRef.current = el; }}
          value={localName}
          onFocus={() => { activeRef.current = true; }}
          onBlur={() => { activeRef.current = false; }}
          onChange={(e)=> setLocalName(e.currentTarget.value)}
          onMouseDown={(e)=> e.stopPropagation()}
          onKeyDown={(e)=> { if (e.key === 'Enter' && !composingRef.current) { const name = localName.trim(); if (name) { onAdd(name); setLocalName(''); } } }}
          onCompositionStart={() => { composingRef.current = true; }}
          onCompositionEnd={(e) => { composingRef.current = false; setLocalName(e.currentTarget.value); }}
          placeholder="Nome da etapa"
          className="h-10 bg-[#1F1F1F] border border-white/20 text-white px-3 rounded-md w-full"
        />
        <Button type="button" onMouseDown={(e)=> e.preventDefault()} onClick={() => { const name = localName.trim(); if (name) { onAdd(name); setLocalName(''); } }} className="h-10">Adicionar</Button>
      </div>
    );
  };

  // Input estável que evita perda de foco entre re-renders e suporta composição
  const StableInput = ({
    value,
    onValueChange,
    type = 'text',
    className,
    min
  }: { value: string | number; onValueChange: (v: any) => void; type?: 'text'|'number'; className?: string; min?: number }) => {
    const composingRef = useRef(false);
    const [local, setLocal] = useState<string>(String(value ?? ''));
    useEffect(() => {
      if (!composingRef.current) setLocal(String(value ?? ''));
    }, [value]);
    return (
      <input
        type={type}
        min={min as any}
        value={local}
        onChange={(e) => {
          setLocal(e.currentTarget.value);
          const raw = e.currentTarget.value;
          onValueChange(type === 'number' ? Number(raw || 0) : raw);
        }}
        onCompositionStart={() => { composingRef.current = true; }}
        onCompositionEnd={(e) => { composingRef.current = false; const raw = e.currentTarget.value; setLocal(raw); onValueChange(type === 'number' ? Number(raw || 0) : raw); }}
        onMouseDown={(e)=> e.stopPropagation()}
        className={`h-10 bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3 ${className || ''}`}
      />
    );
  };

  const FieldRow = ({ label, control }: { label: React.ReactNode; control: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm text-white">{label}</Label>
      <div className="flex items-center">{control}</div>
    </div>
  );

  // Editor reutilizável de estilo (Formulário, Campos, Botão)
  const StyleEditor = ({ style, setStyle, openSection, setOpenSection }: {
    style: StyleCfg;
    setStyle: React.Dispatch<React.SetStateAction<StyleCfg>>;
    openSection: 'form'|'fields'|'button'|null;
    setOpenSection: (s: 'form'|'fields'|'button'|null) => void;
  }) => (
    <div className="space-y-6">
      {(() => {
        // Estado local para o campo "Espaço entre campos (px)" (todas as abas exceto Agendamentos)
        const [localSpacing, setLocalSpacing] = useState<string>(String(style.spacingFieldsPx));
        const [isCompSpacing, setIsCompSpacing] = useState<boolean>(false);
        useEffect(() => { if (!isCompSpacing) setLocalSpacing(String(style.spacingFieldsPx)); }, [style.spacingFieldsPx]);
        const commitSpacing = (val: string) => {
          const n = Number(val || 0);
          setStyle(s => ({ ...s, spacingFieldsPx: isNaN(n) ? 0 : n }));
        };
        return null;
      })()}
      {/* Formulário */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-md px-2 py-1 cursor-pointer hover:bg-[#2A2A2A]" onClick={() => setOpenSection(openSection === 'form' ? null : 'form')}>
          <h4 className="text-sm font-medium text-muted-foreground">Formulário</h4>
          {openSection === 'form' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
        {openSection === 'form' && (
          <div onMouseDown={(e)=> e.stopPropagation()}>
            <div className="space-y-3">
              {(() => {
                const [localSpacing, setLocalSpacing] = useState<string>(String(style.spacingFieldsPx));
                const [isCompSpacing, setIsCompSpacing] = useState<boolean>(false);
                useEffect(() => { if (!isCompSpacing) setLocalSpacing(String(style.spacingFieldsPx)); }, [style.spacingFieldsPx]);
                const commitSpacing = (val: string) => {
                  const n = Number(val || 0);
                  setStyle(s => ({ ...s, spacingFieldsPx: isNaN(n) ? 0 : n }));
                };
                return (
                  <FieldRow
                    label={<>Espaço entre campos (px)</>}
                    control={
                      <input type="number" min={0 as any} value={localSpacing}
                        onChange={(e) => setLocalSpacing(e.currentTarget.value)}
                        onBlur={(e) => commitSpacing(e.currentTarget.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitSpacing((e.target as HTMLInputElement).value); }}
                        onCompositionStart={() => setIsCompSpacing(true)}
                        onCompositionEnd={(e) => { setIsCompSpacing(false); commitSpacing((e.target as HTMLInputElement).value); }}
                        className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                    }
                  />
                );
              })()}
              <FieldRow
                label={<>Fonte</>}
                control={
                <Select value={style.previewFont} onValueChange={(v)=> setStyle(s=>({ ...s, previewFont: v }))}>
                    <SelectTrigger className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white">
                    <SelectValue placeholder="Escolha a fonte" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-white/20 text-white max-h-80">
                    {['Arial','Athelas','DM Sans','Effra','Facebook Sans','Google Sans','Gotham','Graphique','Inter','Klavika','Lato','Montserrat','Nunito','Open Sans','Poppins','Roboto','SF Pro','Times New Roman'].map(f => (
                      <SelectItem key={f} value={f} className="text-sm" style={{ fontFamily: `${f}, sans-serif` }}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                }
              />
              {(() => {
                const [localVal, setLocalVal] = useState<string>(String(style.fontSizeLabelPx));
                const [isComp, setIsComp] = useState<boolean>(false);
                useEffect(() => { if (!isComp) setLocalVal(String(style.fontSizeLabelPx)); }, [style.fontSizeLabelPx]);
                const commit = (val: string) => setStyle(s=>({ ...s, fontSizeLabelPx: Number(val || 0) }));
                return (
                  <FieldRow
                    label={<>Tamanho da fonte fora do campo (px)</>}
                    control={
                      <input type="number" min={10 as any} value={localVal}
                        onChange={(e)=> setLocalVal(e.currentTarget.value)}
                        onBlur={(e)=> commit(e.currentTarget.value)}
                        onKeyDown={(e)=> { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); }}
                        onCompositionStart={()=> setIsComp(true)}
                        onCompositionEnd={(e)=> { setIsComp(false); commit((e.target as HTMLInputElement).value); }}
                        className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                    }
                  />
                );
              })()}
              {(() => {
                const [localVal, setLocalVal] = useState<string>(String(style.fontSizeInputPx));
                const [isComp, setIsComp] = useState<boolean>(false);
                useEffect(() => { if (!isComp) setLocalVal(String(style.fontSizeInputPx)); }, [style.fontSizeInputPx]);
                const commit = (val: string) => setStyle(s=>({ ...s, fontSizeInputPx: Number(val || 0) }));
                return (
                  <FieldRow
                    label={<>Tamanho da fonte dentro do campo (px)</>}
                    control={
                      <input type="number" min={10 as any} value={localVal}
                        onChange={(e)=> setLocalVal(e.currentTarget.value)}
                        onBlur={(e)=> commit(e.currentTarget.value)}
                        onKeyDown={(e)=> { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); }}
                        onCompositionStart={()=> setIsComp(true)}
                        onCompositionEnd={(e)=> { setIsComp(false); commit((e.target as HTMLInputElement).value); }}
                        className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                    }
                  />
                );
              })()}
              {(() => {
                const [localVal, setLocalVal] = useState<string>(String(style.fontSizeButtonPx));
                const [isComp, setIsComp] = useState<boolean>(false);
                useEffect(() => { if (!isComp) setLocalVal(String(style.fontSizeButtonPx)); }, [style.fontSizeButtonPx]);
                const commit = (val: string) => setStyle(s=>({ ...s, fontSizeButtonPx: Number(val || 0) }));
                return (
                  <FieldRow
                    label={<>Tamanho da fonte no botão (px)</>}
                    control={
                      <input type="number" min={10 as any} value={localVal}
                        onChange={(e)=> setLocalVal(e.currentTarget.value)}
                        onBlur={(e)=> commit(e.currentTarget.value)}
                        onKeyDown={(e)=> { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); }}
                        onCompositionStart={()=> setIsComp(true)}
                        onCompositionEnd={(e)=> { setIsComp(false); commit((e.target as HTMLInputElement).value); }}
                        className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                    }
                  />
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Campos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-md px-2 py-1 cursor-pointer hover:bg-[#2A2A2A]" onClick={() => setOpenSection(openSection === 'fields' ? null : 'fields')}>
          <h4 className="text-sm font-medium text-muted-foreground">Campos</h4>
          {openSection === 'fields' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
        {openSection === 'fields' && (
          <div className="space-y-3" onMouseDown={(e)=> e.stopPropagation()}>
            <FieldRow
              label={<>Cor do fundo do campo</>}
              control={<input type="color" defaultValue={style.fieldBgColor} onChange={(e)=> setStyle(s=>({ ...s, fieldBgColor: e.target.value }))} className="h-10 w-10 border border-white/20 bg-transparent" />}
            />
            <FieldRow
              label={<>Cor da fonte do campo</>}
              control={<input type="color" defaultValue={style.fieldTextColor} onChange={(e)=> setStyle(s=>({ ...s, fieldTextColor: e.target.value }))} className="h-10 w-10 border border-white/20 bg-transparent" />}
            />
            <FieldRow
              label={<>Cor de fundo dos seletores</>}
              control={<input type="color" defaultValue={style.selectBgColor} onChange={(e)=> setStyle(s=>({ ...s, selectBgColor: e.target.value }))} className="h-10 w-10 border border-white/20 bg-transparent" />}
            />
            <FieldRow
              label={<>Cor da fonte dos seletores</>}
              control={<input type="color" defaultValue={style.selectTextColor} onChange={(e)=> setStyle(s=>({ ...s, selectTextColor: e.target.value }))} className="h-10 w-10 border border-white/20 bg-transparent" />}
            />
            <div className="flex items-center justify-between gap-4 py-2">
              <Label className="flex-shrink-0 w-[200px] text-sm text-white">Raio da borda (px)</Label>
              <div className="flex-grow flex justify-end">
                {(() => {
                  const [local, setLocal] = useState<string>(String(style.borderRadiusPx));
                  const [comp, setComp] = useState<boolean>(false);
                  useEffect(() => { if (!comp) setLocal(String(style.borderRadiusPx)); }, [style.borderRadiusPx]);
                  const commit = (val: string) => setStyle(s=>({ ...s, borderRadiusPx: Number(val || 0) }));
                  return (
                    <input type="number" min={0 as any} value={local}
                      onChange={(e)=> setLocal(e.currentTarget.value)}
                      onBlur={(e)=> commit(e.currentTarget.value)}
                      onKeyDown={(e)=> { if (e.key==='Enter') commit((e.target as HTMLInputElement).value); }}
                      onCompositionStart={()=> setComp(true)}
                      onCompositionEnd={(e)=> { setComp(false); commit((e.target as HTMLInputElement).value); }}
                      className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                  );
                })()}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 py-2">
              <Label className="flex-shrink-0 w-[200px] text-sm text-white">Espessura da borda normal (px)</Label>
              <div className="flex-grow flex justify-end">
                {(() => {
                  const [local, setLocal] = useState<string>(String(style.borderWidthNormalPx));
                  const [comp, setComp] = useState<boolean>(false);
                  useEffect(() => { if (!comp) setLocal(String(style.borderWidthNormalPx)); }, [style.borderWidthNormalPx]);
                  const commit = (val: string) => setStyle(s=>({ ...s, borderWidthNormalPx: Number(val || 0) }));
                  return (
                    <input type="number" min={0 as any} value={local}
                      onChange={(e)=> setLocal(e.currentTarget.value)}
                      onBlur={(e)=> commit(e.currentTarget.value)}
                      onKeyDown={(e)=> { if (e.key==='Enter') commit((e.target as HTMLInputElement).value); }}
                      onCompositionStart={()=> setComp(true)}
                      onCompositionEnd={(e)=> { setComp(false); commit((e.target as HTMLInputElement).value); }}
                      className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                  );
                })()}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 py-2">
              <Label className="flex-shrink-0 w-[200px] text-sm text-white">Espessura da borda selecionada (px)</Label>
              <div className="flex-grow flex justify-end">
                {(() => {
                  const [local, setLocal] = useState<string>(String(style.borderWidthFocusPx));
                  const [comp, setComp] = useState<boolean>(false);
                  useEffect(() => { if (!comp) setLocal(String(style.borderWidthFocusPx)); }, [style.borderWidthFocusPx]);
                  const commit = (val: string) => setStyle(s=>({ ...s, borderWidthFocusPx: Number(val || 0) }));
                  return (
                    <input type="number" min={0 as any} value={local}
                      onChange={(e)=> setLocal(e.currentTarget.value)}
                      onBlur={(e)=> commit(e.currentTarget.value)}
                      onKeyDown={(e)=> { if (e.key==='Enter') commit((e.target as HTMLInputElement).value); }}
                      onCompositionStart={()=> setComp(true)}
                      onCompositionEnd={(e)=> { setComp(false); commit((e.target as HTMLInputElement).value); }}
                      className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                  );
                })()}
              </div>
            </div>
            <FieldRow label={<>Cor da borda normal</>}
              control={<input type="color" defaultValue={style.borderColorNormal} onChange={(e)=> setStyle(s=>({ ...s, borderColorNormal: e.target.value }))} className="h-10 w-10 border border-white/20 bg-transparent" />} />
            <FieldRow label={<>Cor da borda pressionado</>}
              control={<input type="color" defaultValue={style.borderColorActive} onChange={(e)=> setStyle(s=>({ ...s, borderColorActive: e.target.value }))} className="h-10 w-10 border border-white/20 bg-transparent" />} />
          </div>
        )}
      </div>

      {/* Botão */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-md px-2 py-1 cursor-pointer hover:bg-[#2A2A2A]" onClick={() => setOpenSection(openSection === 'button' ? null : 'button')}>
          <h4 className="text-sm font-medium text-muted-foreground">Botão</h4>
          {openSection === 'button' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
        {openSection === 'button' && (
          <div className="space-y-3" onMouseDown={(e)=> e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 py-2">
              <Label className="flex-shrink-0 w-[200px] text-sm text-white">Espaçamento do botão (px)</Label>
              <div className="flex-grow flex justify-end">
                {(() => {
                  const [local, setLocal] = useState<string>(String(style.buttonSpacingPx));
                  const [comp, setComp] = useState<boolean>(false);
                  useEffect(() => { if (!comp) setLocal(String(style.buttonSpacingPx)); }, [style.buttonSpacingPx]);
                  const commit = (val: string) => setStyle(s=>({ ...s, buttonSpacingPx: Number(val || 0) }));
                  return (
                    <input type="number" min={0 as any} value={local}
                      onChange={(e)=> setLocal(e.currentTarget.value)}
                      onBlur={(e)=> commit(e.currentTarget.value)}
                      onKeyDown={(e)=> { if (e.key==='Enter') commit((e.target as HTMLInputElement).value); }}
                      onCompositionStart={()=> setComp(true)}
                      onCompositionEnd={(e)=> { setComp(false); commit((e.target as HTMLInputElement).value); }}
                      className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                  );
                })()}
            </div>
            </div>
            <div className="flex items-center justify-between gap-4 py-2">
              <Label className="flex-shrink-0 w-[200px] text-sm text-white">Raio da borda do botão (px)</Label>
              <div className="flex-grow flex justify-end">
                {(() => {
                  const [local, setLocal] = useState<string>(String(style.btnRadius));
                  const [comp, setComp] = useState<boolean>(false);
                  useEffect(() => { if (!comp) setLocal(String(style.btnRadius)); }, [style.btnRadius]);
                  const commit = (val: string) => setStyle(s=>({ ...s, btnRadius: Number(val || 0) }));
                  return (
                    <input type="number" min={0 as any} value={local}
                      onChange={(e)=> setLocal(e.currentTarget.value)}
                      onBlur={(e)=> commit(e.currentTarget.value)}
                      onKeyDown={(e)=> { if (e.key==='Enter') commit((e.target as HTMLInputElement).value); }}
                      onCompositionStart={()=> setComp(true)}
                      onCompositionEnd={(e)=> { setComp(false); commit((e.target as HTMLInputElement).value); }}
                      className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                  );
                })()}
              </div>
            </div>
            <FieldRow label={<>Cor da fonte do botão (normal)</>}
              control={<input type="color" defaultValue={style.btnText} onChange={(e)=> setStyle(s=>({ ...s, btnText: e.target.value }))} className="h-10 w-10 border border-white/20 bg-transparent" />} />
            <FieldRow label={<>Cor da fonte do botão (pressionado)</>}
              control={<input type="color" defaultValue={style.btnTextActive} onChange={(e)=> setStyle(s=>({ ...s, btnTextActive: e.target.value }))} className="h-10 w-10 border border-white/20 bg-transparent" />} />
            <FieldRow label={<>Cor do fundo do botão normal</>} control={
              <div className="flex items-center gap-2">
                  <input type="color" defaultValue={style.btnBg1} onChange={(e)=> setStyle(s=>({ ...s, btnBg1: e.target.value }))} className="h-10 w-10 border border-white/20 bg-transparent" />
                  <input type="color" defaultValue={style.btnBg2} onChange={(e)=> setStyle(s=>({ ...s, btnBg2: e.target.value }))} className="h-10 w-10 border border-white/20 bg-transparent" />
                  {(() => {
                    const [local, setLocal] = useState<string>(String(style.btnAngle));
                    const [comp, setComp] = useState<boolean>(false);
                    useEffect(() => { if (!comp) setLocal(String(style.btnAngle)); }, [style.btnAngle]);
                    const commit = (val: string) => setStyle(s=>({ ...s, btnAngle: Number(val || 0) }));
                    return (
                      <input type="number" value={local} onChange={(e)=> setLocal(e.currentTarget.value)} onBlur={(e)=> commit(e.currentTarget.value)} onCompositionStart={()=> setComp(true)} onCompositionEnd={(e)=> { setComp(false); commit((e.target as HTMLInputElement).value); }} className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                    );
                  })()}
              </div>
              } />
            <FieldRow label={<>Cor do fundo do botão pressionado</>} control={
              <div className="flex items-center gap-2">
                  <input type="color" defaultValue={style.btnBgActive1} onChange={(e)=> setStyle(s=>({ ...s, btnBgActive1: e.target.value }))} className="h-10 w-10 border border-white/20 bg-transparent" />
                  <input type="color" defaultValue={style.btnBgActive2} onChange={(e)=> setStyle(s=>({ ...s, btnBgActive2: e.target.value }))} className="h-10 w-10 border border-white/20 bg-transparent" />
                  {(() => {
                    const [local, setLocal] = useState<string>(String(style.btnAngleActive));
                    const [comp, setComp] = useState<boolean>(false);
                    useEffect(() => { if (!comp) setLocal(String(style.btnAngleActive)); }, [style.btnAngleActive]);
                    const commit = (val: string) => setStyle(s=>({ ...s, btnAngleActive: Number(val || 0) }));
                    return (
                      <input type="number" value={local} onChange={(e)=> setLocal(e.currentTarget.value)} onBlur={(e)=> commit(e.currentTarget.value)} onCompositionStart={()=> setComp(true)} onCompositionEnd={(e)=> { setComp(false); commit((e.target as HTMLInputElement).value); }} className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                    );
                  })()}
              </div>
              } />
            <div className="flex items-center justify-between gap-4 py-2">
              <Label className="flex-shrink-0 w-[200px] text-sm text-white">Espessura da borda do botão (normal) (px)</Label>
              <div className="flex-grow flex justify-end">
                {(() => {
                  const [local, setLocal] = useState<string>(String(style.btnBorderWidth));
                  const [comp, setComp] = useState<boolean>(false);
                  useEffect(() => { if (!comp) setLocal(String(style.btnBorderWidth)); }, [style.btnBorderWidth]);
                  const commit = (val: string) => setStyle(s=>({ ...s, btnBorderWidth: Number(val || 0) }));
                  return (
                    <input type="number" min={0 as any} value={local}
                      onChange={(e)=> setLocal(e.currentTarget.value)}
                      onBlur={(e)=> commit(e.currentTarget.value)}
                      onKeyDown={(e)=> { if (e.key==='Enter') commit((e.target as HTMLInputElement).value); }}
                      onCompositionStart={()=> setComp(true)}
                      onCompositionEnd={(e)=> { setComp(false); commit((e.target as HTMLInputElement).value); }}
                      className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                  );
                })()}
            </div>
            </div>
            <div className="flex items-center justify-between gap-4 py-2">
              <Label className="flex-shrink-0 w-[200px] text-sm text-white">Espessura da borda do botão (pressionado) (px)</Label>
              <div className="flex-grow flex justify-end">
                {(() => {
                  const [local, setLocal] = useState<string>(String(style.btnBorderWidthActive));
                  const [comp, setComp] = useState<boolean>(false);
                  useEffect(() => { if (!comp) setLocal(String(style.btnBorderWidthActive)); }, [style.btnBorderWidthActive]);
                  const commit = (val: string) => setStyle(s=>({ ...s, btnBorderWidthActive: Number(val || 0) }));
                  return (
                    <input type="number" min={0 as any} value={local}
                      onChange={(e)=> setLocal(e.currentTarget.value)}
                      onBlur={(e)=> commit(e.currentTarget.value)}
                      onKeyDown={(e)=> { if (e.key==='Enter') commit((e.target as HTMLInputElement).value); }}
                      onCompositionStart={()=> setComp(true)}
                      onCompositionEnd={(e)=> { setComp(false); commit((e.target as HTMLInputElement).value); }}
                      className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                  );
                })()}
              </div>
            </div>
            <FieldRow label={<>Cor da borda do botão (normal)</>} control={<input type="color" defaultValue={style.btnBorderColor} onChange={(e)=> setStyle(s=>({ ...s, btnBorderColor: e.target.value }))} className="h-10 w-10 border border-white/20 bg-transparent" />} />
            <FieldRow label={<>Cor da borda do botão (pressionado)</>} control={<input type="color" defaultValue={style.btnBorderColorActive} onChange={(e)=> setStyle(s=>({ ...s, btnBorderColorActive: e.target.value }))} className="h-10 w-10 border border-white/20 bg-transparent" />} />
          </div>
        )}
      </div>
    </div>
  );

  const LeftConfig = ({ title, main, openSectionAg, setOpenSectionAg, leadFormStyle, onSaveLeadFormStyle, selectedFields, setSelectedFields }: { title: string; main: 'leads' | 'agendamentos' | 'resultados' | 'vendas'; openSectionAg?: 'form'|'fields'|'button'|null; setOpenSectionAg?: (s: 'form'|'fields'|'button'|null) => void; leadFormStyle?: any; onSaveLeadFormStyle?: (style: any) => void; selectedFields?: string[]; setSelectedFields?: (fields: string[]) => void }) => {
    // Estado local para o campo "Espaço entre campos (px)" da aba Agendamentos
    const [agSpacingLocal, setAgSpacingLocal] = useState<string>(() => {
      const initialValue = String(spacingFieldsPx);
      return initialValue;
    });
    const [agComp, setAgComp] = useState<boolean>(false);
    useEffect(() => { 
      if (!agComp) {
        const newValue = String(spacingFieldsPx);
        setAgSpacingLocal(newValue);
      }
    }, [spacingFieldsPx]);
    const commitAgSpacing = (val: string) => {
      const n = Number(val || 0);
      setSpacingFieldsPx(isNaN(n) ? 0 : n);
    };
    const SectionHeaderAg = ({ label, section }: { label: string; section: 'form'|'fields'|'button' }) => (
      <div className={`flex items-center justify-between rounded-md px-2 py-1 cursor-pointer hover:bg-[#2A2A2A]`} onClick={() => setOpenSectionAg && setOpenSectionAg(openSectionAg === section ? null : section)}>
        <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
        {openSectionAg === section ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>
    );
    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Configurações do formulário</h3>
        <Popover open={showCopyMenu} onOpenChange={setShowCopyMenu}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Copy className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setShowStyleCopyDialog(true);
                  setShowCopyMenu(false);
                }}
              >
                Estilo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                disabled
              >
                Integrações
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Sub-Abas específicas por formulário */}
      {main === 'leads' && (
        <Tabs value={subTabs.leads} onValueChange={(v: any) => setSubTabs(prev => ({ ...prev, leads: v }))} className="w-full">
          <TabsList className="flex gap-2 bg-transparent p-0 rounded-none w-fit">
            <TabsTrigger value="campos" className="px-3 py-2 text-sm rounded-md border border-white/10 bg-[#1F1F1F] text-muted-foreground hover:text-white hover:bg-[#262626] data-[state=active]:bg-[var(--brand-primary,#E50F5E)] data-[state=active]:text-white">Campos</TabsTrigger>
            <TabsTrigger value="visual" className="px-3 py-2 text-sm rounded-md border border-white/10 bg-[#1F1F1F] text-muted-foreground hover:text-white hover:bg-[#262626] data-[state=active]:bg-[var(--brand-primary,#E50F5E)] data-[state=active]:text-white">Estilo</TabsTrigger>
            <TabsTrigger value="integracoes" className="px-3 py-2 text-sm rounded-md border border-white/10 bg-[#1F1F1F] text-muted-foreground hover:text-white hover:bg-[#262626] data-[state=active]:bg-[var(--brand-primary,#E50F5E)] data-[state=active]:text-white">Integrações</TabsTrigger>
          </TabsList>
          <TabsContent value="campos" className="pt-4 space-y-6">
            {/* Campos de configuração do formulário */}
            <div className="space-y-4">
              {/* Formulário base */}
              <div className="flex items-center justify-between p-4 bg-[#1F1F1F] rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="base-form-toggle"
                    checked={isBaseForm}
                    onCheckedChange={handleBaseFormToggle}
                    disabled={!hasConnectionField}
                  />
                  <div>
                    <Label htmlFor="base-form-toggle" className="text-white font-medium">
                      Formulário base
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {hasConnectionField 
                        ? "Este formulário será usado para adição rápida de leads"
                        : "Adicione um campo do tipo Conexão conectado à lista de origens para ativar"
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Definir origem */}
              {!isBaseForm && (
                <div className="space-y-2">
                  <Label className="text-white font-medium">Definir origem</Label>
                  <Select value={defaultOrigin} onValueChange={saveDefaultOrigin}>
                    <SelectTrigger className="h-12 bg-[#1F1F1F] border-white/20 text-white">
                      <SelectValue placeholder="Selecione a origem padrão" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2A2A2A] border-white/20 text-white">
                      {origins.map((origin) => (
                        <SelectItem key={origin.id} value={origin.id} className="hover:bg-[#3A3A3A]">
                          {origin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            {/* Dropdown de seleção de campos */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <Popover open={isFieldPopoverOpen} onOpenChange={setIsFieldPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12 text-base justify-start text-left font-normal hover:bg-[var(--brand-secondary,#7c032e)] hover:border-[var(--brand-secondary,#7c032e)] hover:text-white focus:bg-[var(--brand-secondary,#7c032e)] focus:border-[var(--brand-secondary,#7c032e)] focus:text-white"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Selecione campos para adicionar
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 bg-[#2A2A2A] border-white/20 text-white" align="start">
                    <div className="p-2">
                      <Input
                        placeholder="Pesquisar campos"
                        value={fieldSearchQuery}
                        onChange={(e) => setFieldSearchQuery(e.target.value)}
                        className="h-9 bg-[#1f1f1f] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
                      />
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {loadingFields ? (
                        <div className="p-4 text-center text-sm text-gray-400">
                          Carregando campos personalizados...
                        </div>
                      ) : (
                        filteredFields.map((field) => (
                          <div 
                            key={field.id} 
                            className="flex items-center space-x-2 p-2 hover:bg-white/10 cursor-pointer"
                            onClick={(e) => toggleFieldSelection(field.id, e)}
                          >
                        <Checkbox
                          id={field.id}
                          checked={selectedFields?.includes(field.id) || false}
                              onCheckedChange={() => {}} // Removido para evitar conflito
                        />
                        <Label htmlFor={field.id} className="flex-1 cursor-pointer">
                          {field.name}
                        </Label>
                      </div>
                        ))
                      )}
                      {filteredFields.length === 0 && !loadingFields && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Nenhum campo personalizado encontrado.<br />
                          Crie campos na aba "Campos Lead" para vê-los aqui.
                      </div>
                    )}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button 
                  type="button" 
                  className="h-12 px-4 bg-[var(--brand-primary,#E50F5E)] hover:opacity-90 text-white font-semibold"
                  onClick={() => {
                    // Redirecionar para a aba Campos Lead na página de Definições
                    navigate('/configuracoes/gestao?tab=campos-lead');
                  }}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Tabela de campos selecionados com drag and drop */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">Campos Selecionados</h4>
                <Button 
                  type="button" 
                  onClick={saveSelectedFields}
                  className="bg-[var(--brand-primary,#E50F5E)] hover:opacity-90 text-white font-semibold"
                >
                  Salvar Campos
                </Button>
              </div>
              <div className="border rounded-lg">
                <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium text-muted-foreground border-b">
                  <div className="col-span-1"></div>
                  <div className="col-span-1"></div>
                  <div className="col-span-4">Campo</div>
                  <div className="col-span-4">Tipo</div>
                  <div className="col-span-2 text-right">Ações</div>
                </div>
                {(!selectedFields || selectedFields.length === 0) ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhum campo selecionado
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={selectedFields || []} strategy={verticalListSortingStrategy}>
        {(selectedFields || []).map((fieldId) => {
                    const field = availableFields.find(f => f.id === fieldId);
          const placeholderText = placeholderTexts[fieldId] || '';
          const isExpanded = expandedFields.has(fieldId);
          const isRequired = requiredFields.has(fieldId);
          const isPlaceholder = placeholderFields.has(fieldId);
          
                    return (
            <SortableField
              key={fieldId}
              fieldId={fieldId}
              field={field}
              onRemove={removeField}
              isExpanded={isExpanded}
              isRequired={isRequired}
              isPlaceholder={isPlaceholder}
              placeholderText={placeholderText}
              onToggleExpansion={toggleFieldExpansion}
              onToggleRequired={toggleFieldRequired}
              onTogglePlaceholder={toggleFieldPlaceholder}
              onUpdatePlaceholderText={updatePlaceholderText}
            />
          );
        })}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="visual" className="pt-4 space-y-6">
            {leadFormStyle ? (
              <StyleEditor 
                style={leadFormStyle} 
                setStyle={(newStyle) => {
                  setLeadFormStyle(newStyle);
                  if (onSaveLeadFormStyle) {
                    onSaveLeadFormStyle(newStyle);
                  }
                }} 
                openSection={leadsOpenSection} 
                setOpenSection={setLeadsOpenSection} 
                onSave={onSaveLeadFormStyle || (() => {})} 
              />
            ) : (
              <div className="text-sm text-muted-foreground">Carregando configurações...</div>
            )}
            <div className="flex gap-2">
              <Button type="button" onClick={() => onSaveLeadFormStyle?.(leadFormStyle)}>
                Salvar estilo do formulário
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="integracoes" className="pt-4">
            <div className="text-sm text-muted-foreground">Integrações com webhooks, pixels e APIs.</div>
          </TabsContent>
        </Tabs>
      )}

      {main === 'agendamentos' && (
        <Tabs value={subTabs.agendamentos} onValueChange={(v: any) => setSubTabs(prev => ({ ...prev, agendamentos: v }))} className="w-full">
          <TabsList className="flex gap-2 bg-transparent p-0 rounded-none w-fit">
            <TabsTrigger value="visual" className="px-3 py-2 text-sm rounded-md border border-white/10 bg-[#1F1F1F] text-muted-foreground hover:text-white hover:bg-[#262626] data-[state=active]:bg-[var(--brand-primary,#E50F5E)] data-[state=active]:text-white">Estilo</TabsTrigger>
            <TabsTrigger value="integracoes" className="px-3 py-2 text-sm rounded-md border border-white/10 bg-[#1F1F1F] text-muted-foreground hover:text-white hover:bg-[#262626] data-[state=active]:bg-[var(--brand-primary,#E50F5E)] data-[state=active]:text-white">Integrações</TabsTrigger>
          </TabsList>
          <TabsContent value="visual" className="pt-4 space-y-6">
                <>
                  {/* Formulário */}
                  <div className="space-y-3">
                    <SectionHeaderAg label="Formulário" section="form" />
                    {openSectionAg === 'form' && (
                      <div onMouseDown={(e)=> e.stopPropagation()}>
                        <div className="space-y-3">
                          <FieldRow
                            label={<>Espaço entre campos (px)</>}
                            control={<input type="number" min={0 as any} value={agSpacingLocal} onChange={(e)=> setAgSpacingLocal(e.currentTarget.value)} onBlur={(e)=> commitAgSpacing(e.currentTarget.value)} onKeyDown={(e)=> { if (e.key==='Enter') commitAgSpacing((e.target as HTMLInputElement).value); }} onCompositionStart={()=> setAgComp(true)} onCompositionEnd={(e)=> { setAgComp(false); commitAgSpacing((e.target as HTMLInputElement).value); }} className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />}
                          />
                          <FieldRow
                            label={<>Fonte</>}
                            control={<Select value={previewFont} onValueChange={setPreviewFont}>
                              <SelectTrigger className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white focus:ring-0">
                                <SelectValue placeholder="Escolha a fonte" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#2A2A2A] border-white/20 text-white max-h-80">
                                {['Arial','Athelas','DM Sans','Effra','Facebook Sans','Google Sans','Gotham','Graphique','Inter','Klavika','Lato','Montserrat','Nunito','Open Sans','Poppins','Roboto','SF Pro','Times New Roman'].map(f => (
                                  <SelectItem key={f} value={f} data-font-option={f} className="text-sm" style={{ fontFamily: `${f}, sans-serif` }}>{f}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">A fonte selecionada será aplicada aos campos e botões da prévia.</p>
                        <div className="space-y-3">
                          {(() => {
                              const [localAg, setLocalAg] = useState<string>(String(fontSizeLabelPx));
                              const [compAg, setCompAg] = useState<boolean>(false);
                              useEffect(() => { if (!compAg) setLocalAg(String(fontSizeLabelPx)); }, [fontSizeLabelPx]);
                              const commitAg = (val: string) => setFontSizeLabelPx(Number(val || 0));
                              return (
                                <FieldRow label={<>Tamanho da fonte fora do campo (px)</>} control={<input type="number" min={10 as any} value={localAg} onChange={(e)=> setLocalAg(e.currentTarget.value)} onBlur={(e)=> commitAg(e.currentTarget.value)} onKeyDown={(e)=> { if (e.key==='Enter') commitAg((e.target as HTMLInputElement).value); }} onCompositionStart={()=> setCompAg(true)} onCompositionEnd={(e)=> { setCompAg(false); commitAg((e.target as HTMLInputElement).value); }} className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />} />
                              );
                            })()}
                          {(() => {
                              const [localAg, setLocalAg] = useState<string>(String(fontSizeInputPx));
                              const [compAg, setCompAg] = useState<boolean>(false);
                              useEffect(() => { if (!compAg) setLocalAg(String(fontSizeInputPx)); }, [fontSizeInputPx]);
                              const commitAg = (val: string) => setFontSizeInputPx(Number(val || 0));
                              return (
                                <FieldRow label={<>Tamanho da fonte dentro do campo (px)</>} control={<input type="number" min={10 as any} value={localAg} onChange={(e)=> setLocalAg(e.currentTarget.value)} onBlur={(e)=> commitAg(e.currentTarget.value)} onKeyDown={(e)=> { if (e.key==='Enter') commitAg((e.target as HTMLInputElement).value); }} onCompositionStart={()=> setCompAg(true)} onCompositionEnd={(e)=> { setCompAg(false); commitAg((e.target as HTMLInputElement).value); }} className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />} />
                              );
                            })()}
                          <FieldRow label={<>Tamanho da fonte no botão (px)</>} control={<input type="number" min={10 as any} value={String(fontSizeButtonPx)} onChange={(e) => setFontSizeButtonPx(Number(e.currentTarget.value || 0))} onCompositionEnd={(e) => setFontSizeButtonPx(Number(e.currentTarget.value || 0))} className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Campos */}
                  <div className="space-y-3">
                    <SectionHeaderAg label="Campos" section="fields" />
                    {openSectionAg === 'fields' && (
                      <div className="space-y-3" onMouseDown={(e)=> e.stopPropagation()}>
                        <FieldRow label={<>Cor do fundo do campo</>} control={<input type="color" defaultValue={fieldBgColor} onChange={(e) => { setFieldBgColor(e.target.value); setEditFieldBg(e.target.value); }} className="h-10 w-10 border border-white/20 bg-transparent" />} />
                        <FieldRow label={<>Cor da fonte do campo</>} control={<input type="color" defaultValue={fieldTextColor} onChange={(e) => { setFieldTextColor(e.target.value); setEditFieldText(e.target.value); }} className="h-10 w-10 border border-white/20 bg-transparent" />} />
                        <FieldRow label={<>Cor de fundo dos seletores</>} control={<input type="color" defaultValue={selectBgColor} onChange={(e) => { setSelectBgColor(e.target.value); setEditSelBg(e.target.value); }} className="h-10 w-10 border border-white/20 bg-transparent" />} />
                        <FieldRow label={<>Cor da fonte dos seletores</>} control={<input type="color" defaultValue={selectTextColor} onChange={(e) => { setSelectTextColor(e.target.value); setEditSelText(e.target.value); }} className="h-10 w-10 border border-white/20 bg-transparent" />} />
                        <div className="flex items-center justify-between gap-4 py-2">
              <Label className="flex-shrink-0 w-[200px] text-sm text-white">Raio da borda (px)</Label>
              <div className="flex-grow flex justify-end">
                          {(() => {
                            const [local, setLocal] = useState<string>(String(borderRadiusPx));
                            const [comp, setComp] = useState<boolean>(false);
                            useEffect(() => { if (!comp) setLocal(String(borderRadiusPx)); }, [borderRadiusPx]);
                            const commit = (val: string) => setBorderRadiusPx(Number(val || 0));
                            return (
                              <input type="number" min={0 as any} value={local}
                                onChange={(e)=> setLocal(e.currentTarget.value)}
                                onBlur={(e)=> commit(e.currentTarget.value)}
                                onKeyDown={(e)=> { if (e.key==='Enter') commit((e.target as HTMLInputElement).value); }}
                                onCompositionStart={()=> setComp(true)}
                                onCompositionEnd={(e)=> { setComp(false); commit((e.target as HTMLInputElement).value); }}
                    className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                            );
                          })()}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 py-2">
              <Label className="flex-shrink-0 w-[200px] text-sm text-white">Espessura da borda normal (px)</Label>
              <div className="flex-grow flex justify-end">
                          {(() => {
                            const [local, setLocal] = useState<string>(String(borderWidthNormalPx));
                            const [comp, setComp] = useState<boolean>(false);
                            useEffect(() => { if (!comp) setLocal(String(borderWidthNormalPx)); }, [borderWidthNormalPx]);
                            const commit = (val: string) => setBorderWidthNormalPx(Number(val || 0));
                            return (
                              <input type="number" min={0 as any} value={local}
                                onChange={(e)=> setLocal(e.currentTarget.value)}
                                onBlur={(e)=> commit(e.currentTarget.value)}
                                onKeyDown={(e)=> { if (e.key==='Enter') commit((e.target as HTMLInputElement).value); }}
                                onCompositionStart={()=> setComp(true)}
                                onCompositionEnd={(e)=> { setComp(false); commit((e.target as HTMLInputElement).value); }}
                    className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                            );
                          })()}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 py-2">
              <Label className="flex-shrink-0 w-[200px] text-sm text-white">Espessura da borda selecionada (px)</Label>
              <div className="flex-grow flex justify-end">
                          {(() => {
                            const [local, setLocal] = useState<string>(String(borderWidthFocusPx));
                            const [comp, setComp] = useState<boolean>(false);
                            useEffect(() => { if (!comp) setLocal(String(borderWidthFocusPx)); }, [borderWidthFocusPx]);
                            const commit = (val: string) => setBorderWidthFocusPx(Number(val || 0));
                            return (
                              <input type="number" min={0 as any} value={local}
                                onChange={(e)=> setLocal(e.currentTarget.value)}
                                onBlur={(e)=> commit(e.currentTarget.value)}
                                onKeyDown={(e)=> { if (e.key==='Enter') commit((e.target as HTMLInputElement).value); }}
                                onCompositionStart={()=> setComp(true)}
                                onCompositionEnd={(e)=> { setComp(false); commit((e.target as HTMLInputElement).value); }}
                    className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                            );
                          })()}
                          </div>
                        </div>
                        <FieldRow label={<>Cor da borda normal</>} control={<input type="color" defaultValue={borderColorNormal} onChange={(e)=> { setBorderColorNormal(e.target.value); setEditBorderNorm(e.target.value); }} className="h-10 w-10 border border-white/20 bg-transparent" />} />
                        <FieldRow label={<>Cor da borda pressionado</>} control={<input type="color" defaultValue={borderColorActive} onChange={(e)=> { setBorderColorActive(e.target.value); setEditBorderActive(e.target.value); }} className="h-10 w-10 border border-white/20 bg-transparent" />} />
                      </div>
                    )}
                  </div>

                  {/* Botão */}
                  <div className="space-y-3">
                    <SectionHeaderAg label="Botão" section="button" />
                    {openSectionAg === 'button' && (
                      <div className="space-y-3" onMouseDown={(e)=> e.stopPropagation()}>
                        <div className="flex items-center justify-between gap-4 py-2">
              <Label className="flex-shrink-0 w-[200px] text-sm text-white">Espaçamento do botão (px)</Label>
              <div className="flex-grow flex justify-end">
                          {(() => {
                            const [local, setLocal] = useState<string>(String(buttonSpacingPx));
                            const [comp, setComp] = useState<boolean>(false);
                            useEffect(() => { if (!comp) setLocal(String(buttonSpacingPx)); }, [buttonSpacingPx]);
                            const commit = (val: string) => setButtonSpacingPx(Number(val || 0));
                            return (
                              <input type="number" min={0 as any} value={local}
                                onChange={(e)=> setLocal(e.currentTarget.value)}
                                onBlur={(e)=> commit(e.currentTarget.value)}
                                onKeyDown={(e)=> { if (e.key==='Enter') commit((e.target as HTMLInputElement).value); }}
                                onCompositionStart={()=> setComp(true)}
                                onCompositionEnd={(e)=> { setComp(false); commit((e.target as HTMLInputElement).value); }}
                    className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                            );
                          })()}
                        </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 py-2">
              <Label className="flex-shrink-0 w-[200px] text-sm text-white">Raio da borda do botão (px)</Label>
              <div className="flex-grow flex justify-end">
                          {(() => {
                            const [local, setLocal] = useState<string>(String(btnRadius));
                            const [comp, setComp] = useState<boolean>(false);
                            useEffect(() => { if (!comp) setLocal(String(btnRadius)); }, [btnRadius]);
                            const commit = (val: string) => setBtnRadius(Number(val || 0));
                            return (
                              <input type="number" min={0 as any} value={local}
                                onChange={(e)=> setLocal(e.currentTarget.value)}
                                onBlur={(e)=> commit(e.currentTarget.value)}
                                onKeyDown={(e)=> { if (e.key==='Enter') commit((e.target as HTMLInputElement).value); }}
                                onCompositionStart={()=> setComp(true)}
                                onCompositionEnd={(e)=> { setComp(false); commit((e.target as HTMLInputElement).value); }}
                    className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                            );
                          })()}
                          </div>
                        </div>
                        <FieldRow label={<>Cor da fonte do botão (normal)</>} control={<input type="color" defaultValue={btnText} onChange={(e)=> setBtnText(e.target.value)} className="h-10 w-10 border border-white/20 bg-transparent" />} />
                        <FieldRow label={<>Cor da fonte do botão (pressionado)</>} control={<input type="color" defaultValue={btnTextActive} onChange={(e)=> setBtnTextActive(e.target.value)} className="h-10 w-10 border border-white/20 bg-transparent" />} />

                        <FieldRow label={<>Cor do fundo do botão normal</>} control={<div className="flex items-center gap-2">
                            <input type="color" defaultValue={btnBg1} onChange={(e)=> setBtnBg1(e.target.value)} className="h-10 w-10 border border-white/20 bg-transparent" />
                            <input type="color" defaultValue={btnBg2} onChange={(e)=> setBtnBg2(e.target.value)} className="h-10 w-10 border border-white/20 bg-transparent" />
                            <input type="number" value={String(btnAngle)} onChange={(e)=> setBtnAngle(Number(e.currentTarget.value||0))} onCompositionEnd={(e)=> setBtnAngle(Number(e.currentTarget.value||0))} className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                          </div>} />
                        <FieldRow label={<>Cor do fundo do botão pressionado</>} control={<div className="flex items-center gap-2">
                            <input type="color" defaultValue={btnBgActive1} onChange={(e)=> setBtnBgActive1(e.target.value)} className="h-10 w-10 border border-white/20 bg-transparent" />
                            <input type="color" defaultValue={btnBgActive2} onChange={(e)=> setBtnBgActive2(e.target.value)} className="h-10 w-10 border border-white/20 bg-transparent" />
                            <input type="number" value={String(btnAngleActive)} onChange={(e)=> setBtnAngleActive(Number(e.currentTarget.value||0))} onCompositionEnd={(e)=> setBtnAngleActive(Number(e.currentTarget.value||0))} className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                          </div>} />

                        <div className="flex items-center justify-between gap-4 py-2">
              <Label className="flex-shrink-0 w-[200px] text-sm text-white">Espessura da borda do botão (normal) (px)</Label>
              <div className="flex-grow flex justify-end">
                          {(() => {
                            const [local, setLocal] = useState<string>(String(btnBorderWidth));
                            const [comp, setComp] = useState<boolean>(false);
                            useEffect(() => { if (!comp) setLocal(String(btnBorderWidth)); }, [btnBorderWidth]);
                            const commit = (val: string) => setBtnBorderWidth(Number(val || 0));
                            return (
                              <input type="number" min={0 as any} value={local}
                                onChange={(e)=> setLocal(e.currentTarget.value)}
                                onBlur={(e)=> commit(e.currentTarget.value)}
                                onKeyDown={(e)=> { if (e.key==='Enter') commit((e.target as HTMLInputElement).value); }}
                                onCompositionStart={()=> setComp(true)}
                                onCompositionEnd={(e)=> { setComp(false); commit((e.target as HTMLInputElement).value); }}
                    className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                            );
                          })()}
                        </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 py-2">
              <Label className="flex-shrink-0 w-[200px] text-sm text-white">Espessura da borda do botão (pressionado) (px)</Label>
              <div className="flex-grow flex justify-end">
                          {(() => {
                            const [local, setLocal] = useState<string>(String(btnBorderWidthActive));
                            const [comp, setComp] = useState<boolean>(false);
                            useEffect(() => { if (!comp) setLocal(String(btnBorderWidthActive)); }, [btnBorderWidthActive]);
                            const commit = (val: string) => setBtnBorderWidthActive(Number(val || 0));
                            return (
                              <input type="number" min={0 as any} value={local}
                                onChange={(e)=> setLocal(e.currentTarget.value)}
                                onBlur={(e)=> commit(e.currentTarget.value)}
                                onKeyDown={(e)=> { if (e.key==='Enter') commit((e.target as HTMLInputElement).value); }}
                                onCompositionStart={()=> setComp(true)}
                                onCompositionEnd={(e)=> { setComp(false); commit((e.target as HTMLInputElement).value); }}
                                className="h-10 w-[150px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" />
                            );
                          })()}
                          </div>
                        </div>
                        <FieldRow label={<>Cor da borda do botão (normal)</>} control={<input type="color" defaultValue={btnBorderColor} onChange={(e)=> setBtnBorderColor(e.target.value)} className="h-10 w-10 border border-white/20 bg-transparent" />} />
                        <FieldRow label={<>Cor da borda do botão (pressionado)</>} control={<input type="color" defaultValue={btnBorderColorActive} onChange={(e)=> setBtnBorderColorActive(e.target.value)} className="h-10 w-10 border border-white/20 bg-transparent" />} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => saveFormStyle('agendamentos')}>Salvar estilo de Agendamentos</Button>
                  </div>
                </>
            

            {/* Campos (removido duplicado - já existe acima com SectionHeader) */}
            {false && (() => {
              const [openFields, setOpenFields] = useState(true);
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-muted-foreground">Campos</h4>
                    <button type="button" onClick={() => setOpenFields(o => !o)} className="p-1 text-muted-foreground hover:text-foreground">
                      {openFields ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                  {openFields && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Cor do fundo do campo</Label>
                  <div className="flex items-center gap-2">
                <input type="color" defaultValue={fieldBgColor} onChange={(e) => { setFieldBgColor(e.target.value); setEditFieldBg(e.target.value); }} className="h-10 w-14 border border-white/20 bg-transparent" />
                    <Input value={editFieldBg} onChange={(e) => { const v = e.target.value; setEditFieldBg(v); scheduleCommit('fieldBg', v); }} onBlur={(e)=>commitColor('fieldBg', e.target.value)} className="h-10 bg-[#1F1F1F] border-white/20 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Cor da fonte do campo</Label>
                  <div className="flex items-center gap-2">
                <input type="color" defaultValue={fieldTextColor} onChange={(e) => { setFieldTextColor(e.target.value); setEditFieldText(e.target.value); }} className="h-10 w-14 border border-white/20 bg-transparent" />
                    <Input value={editFieldText} onChange={(e) => { const v = e.target.value; setEditFieldText(v); scheduleCommit('fieldText', v); }} onBlur={(e)=>commitColor('fieldText', e.target.value)} className="h-10 bg-[#1F1F1F] border-white/20 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Cor de fundo dos seletores</Label>
                  <div className="flex items-center gap-2">
                <input type="color" defaultValue={selectBgColor} onChange={(e) => { setSelectBgColor(e.target.value); setEditSelBg(e.target.value); }} className="h-10 w-14 border border-white/20 bg-transparent" />
                    <Input value={editSelBg} onChange={(e) => { const v = e.target.value; setEditSelBg(v); scheduleCommit('selBg', v); }} onBlur={(e)=>commitColor('selBg', e.target.value)} className="h-10 bg-[#1F1F1F] border-white/20 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Cor da fonte dos seletores</Label>
                  <div className="flex items-center gap-2">
                <input type="color" defaultValue={selectTextColor} onChange={(e) => { setSelectTextColor(e.target.value); setEditSelText(e.target.value); }} className="h-10 w-14 border border-white/20 bg-transparent" />
                    <Input value={editSelText} onChange={(e) => { const v = e.target.value; setEditSelText(v); scheduleCommit('selText', v); }} onBlur={(e)=>commitColor('selText', e.target.value)} className="h-10 bg-[#1F1F1F] border-white/20 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Raio da borda (px)</Label>
                  <Input type="number" min={0} value={borderRadiusPx} onChange={(e)=> setBorderRadiusPx(Number(e.target.value || 0))} className="h-10 bg-[#1F1F1F] border-white/20 text-white" />
                </div>
                <div className="space-y-1">
                  <Label>Espessura da borda normal (px)</Label>
                  <Input type="number" min={0} value={borderWidthNormalPx} onChange={(e)=> setBorderWidthNormalPx(Number(e.target.value || 0))} className="h-10 bg-[#1F1F1F] border-white/20 text-white" />
                </div>
                <div className="space-y-1">
                  <Label>Espessura da borda selecionada (px)</Label>
                  <Input type="number" min={0} value={borderWidthFocusPx} onChange={(e)=> setBorderWidthFocusPx(Number(e.target.value || 0))} className="h-10 bg-[#1F1F1F] border-white/20 text-white" />
                </div>
                <div className="space-y-1">
                  <Label>Cor da borda normal</Label>
                  <div className="flex items-center gap-2">
                <input type="color" defaultValue={borderColorNormal} onChange={(e)=> { setBorderColorNormal(e.target.value); setEditBorderNorm(e.target.value); }} className="h-10 w-14 border border-white/20 bg-transparent" />
                    <Input value={editBorderNorm} onChange={(e)=> { const v = e.target.value; setEditBorderNorm(v); scheduleCommit('borderNorm', v); }} onBlur={(e)=>commitColor('borderNorm', e.target.value)} className="h-10 bg-[#1F1F1F] border-white/20 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Cor da borda pressionado</Label>
                  <div className="flex items-center gap-2">
                <input type="color" defaultValue={borderColorActive} onChange={(e)=> { setBorderColorActive(e.target.value); setEditBorderActive(e.target.value); }} className="h-10 w-14 border border-white/20 bg-transparent" />
                    <Input value={editBorderActive} onChange={(e)=> { const v = e.target.value; setEditBorderActive(v); scheduleCommit('borderActive', v); }} onBlur={(e)=>commitColor('borderActive', e.target.value)} className="h-10 bg-[#1F1F1F] border-white/20 text-white" />
                  </div>
                </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </TabsContent>
          <TabsContent value="integracoes" className="pt-4">
            <div className="text-sm text-muted-foreground">Integrações com calendários e webhooks.</div>
          </TabsContent>
        </Tabs>
      )}

      {main === 'resultados' && (
        <Tabs value={subTabs.resultados} onValueChange={(v: any) => setSubTabs(prev => ({ ...prev, resultados: v }))} className="w-full">
          <TabsList className="flex gap-2 bg-transparent p-0 rounded-none w-fit">
            <TabsTrigger value="etapas" className="px-3 py-2 text-sm rounded-md border border-white/10 bg-[#1F1F1F] text-muted-foreground hover:text-white hover:bg-[#262626] data-[state=active]:bg-[var(--brand-primary,#E50F5E)] data-[state=active]:text-white">Etapas</TabsTrigger>
            <TabsTrigger value="visual" className="px-3 py-2 text-sm rounded-md border border-white/10 bg-[#1F1F1F] text-muted-foreground hover:text-white hover:bg-[#262626] data-[state=active]:bg-[var(--brand-primary,#E50F5E)] data-[state=active]:text-white">Estilo</TabsTrigger>
            <TabsTrigger value="integracoes" className="px-3 py-2 text-sm rounded-md border border-white/10 bg-[#1F1F1F] text-muted-foreground hover:text-white hover:bg-[#262626] data-[state=active]:bg-[var(--brand-primary,#E50F5E)] data-[state=active]:text-white">Integrações</TabsTrigger>
          </TabsList>
          <TabsContent value="etapas" className="pt-4 space-y-3">
            <div className="space-y-2">
              <Label>Etapas da venda</Label>
              <NewStageField
                initialValue={stageInput}
                onAdd={(name) => { setResultStages(s=>[...s, name]); newStageRef.current?.focus(); }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Arraste para reordenar</Label>
              <div className="space-y-2">
                {resultStages.map((stage, idx) => (
                  <div
                    key={idx}
                    draggable={editingStageIdx === null}
                    onDragStart={(e)=> { if (editingStageIdx === null) e.dataTransfer.setData('text/plain', String(idx)); }}
                    onDragOver={(e)=> { if (editingStageIdx === null) e.preventDefault(); }}
                    onDrop={(e)=> { if (editingStageIdx !== null) return; const from = Number(e.dataTransfer.getData('text/plain')); const to = idx; if (!Number.isNaN(from)) { setResultStages(s=>{ const arr=[...s]; const [it]=arr.splice(from,1); arr.splice(to,0,it); return arr; }); } }}
                    className="flex items-center justify-between px-3 py-2 rounded-md border border-white/20 bg-[#1F1F1F] select-none"
                  >
                    <div className="flex items-center gap-3 w-full" onMouseDown={(e)=> e.stopPropagation()}>
                      <Checkbox checked={qualifiedStageIdx === idx} onCheckedChange={(v)=> setQualifiedStageIdx(v ? idx : null)} />
                      {editingStageIdx === idx ? (
                        <input
                          ref={editingInputRef}
                          value={editingStageInput}
                          onChange={(e)=> setEditingStageInput(e.currentTarget.value)}
                          onMouseDown={(e)=> e.stopPropagation()}
                          autoFocus
                          onCompositionStart={() => setIsComposingEdit(true)}
                          onCompositionEnd={(e) => { setIsComposingEdit(false); setEditingStageInput(e.currentTarget.value); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isComposingEdit) commitEditStage();
                            if (e.key === 'Escape') cancelEditStage();
                          }}
                          onBlur={(e) => {
                            // só salva se o blur não veio de clique nos botões de ação
                            const related = (e as any).relatedTarget as HTMLElement | null;
                            const isActionBtn = !!related && related.closest('[data-stage-action]');
                            if (!isComposingEdit && !isActionBtn) commitEditStage();
                          }}
                          placeholder="Editar etapa"
                          className="flex-1 h-9 bg-[#1F1F1F] border border-white/20 text-white px-2 rounded-md"
                        />
                      ) : (
                        <span className="cursor-text flex-1" onMouseDown={(e)=> e.stopPropagation()} onClick={() => startEditStage(idx)} tabIndex={0} onKeyDown={(e)=> { if (e.key==='Enter') startEditStage(idx); }}>
                          {stage}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingStageIdx === idx ? (
                        <>
                          <Button data-stage-action variant="outline" size="sm" onMouseDown={(e)=> e.preventDefault()} onClick={commitEditStage}>Salvar</Button>
                          <Button data-stage-action variant="ghost" size="sm" onMouseDown={(e)=> e.preventDefault()} onClick={cancelEditStage}>Cancelar</Button>
                        </>
                      ) : (
                    <Button variant="outline" size="sm" onClick={()=> { setResultStages(s=> s.filter((_,i)=> i!==idx)); if (qualifiedStageIdx === idx) setQualifiedStageIdx(null); }}>Remover</Button>
                      )}
                    </div>
                  </div>
                ))}
                {resultStages.length===0 && <div className="text-sm text-muted-foreground">Nenhuma etapa adicionada.</div>}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => saveResultStages()}>Salvar etapas</Button>
            </div>
          </TabsContent>
          <TabsContent value="visual" className="pt-4 space-y-6">
            <StyleEditor style={resultsStyle} setStyle={setResultsStyle} openSection={resultsOpenSection} setOpenSection={setResultsOpenSection} />
            <div className="flex gap-2">
              <Button type="button" onClick={() => saveFormStyle('resultados')}>Salvar estilo de Resultados</Button>
            </div>
          </TabsContent>
          <TabsContent value="integracoes" className="pt-4">
            <div className="text-sm text-muted-foreground">Integrações com serviços externos.</div>
          </TabsContent>
        </Tabs>
      )}

      {main === 'vendas' && (
        <Tabs value={subTabs.vendas} onValueChange={(v: any) => setSubTabs(prev => ({ ...prev, vendas: v }))} className="w-full">
          <TabsList className="flex gap-2 bg-transparent p-0 rounded-none w-fit">
            <TabsTrigger value="campos" className="px-3 py-2 text-sm rounded-md border border-white/10 bg-[#1F1F1F] text-muted-foreground hover:text-white hover:bg-[#262626] data-[state=active]:bg-[var(--brand-primary,#E50F5E)] data-[state=active]:text-white">Campos</TabsTrigger>
            <TabsTrigger value="produtos" className="px-3 py-2 text-sm rounded-md border border-white/10 bg-[#1F1F1F] text-muted-foreground hover:text-white hover:bg-[#262626] data-[state=active]:bg-[var(--brand-primary,#E50F5E)] data-[state=active]:text-white">Produtos</TabsTrigger>
            <TabsTrigger value="visual" className="px-3 py-2 text-sm rounded-md border border-white/10 bg-[#1F1F1F] text-muted-foreground hover:text-white hover:bg-[#262626] data-[state=active]:bg-[var(--brand-primary,#E50F5E)] data-[state=active]:text-white">Estilo</TabsTrigger>
            <TabsTrigger value="integracoes" className="px-3 py-2 text-sm rounded-md border border-white/10 bg-[#1F1F1F] text-muted-foreground hover:text-white hover:bg-[#262626] data-[state=active]:bg-[var(--brand-primary,#E50F5E)] data-[state=active]:text-white">Integrações</TabsTrigger>
          </TabsList>
          <TabsContent value="campos" className="pt-4">
            <div className="text-sm text-muted-foreground">Defina os campos do formulário de Vendas.</div>
          </TabsContent>
          <TabsContent value="produtos" className="pt-4">
            <div className="text-sm text-muted-foreground">Selecione produtos e vínculos obrigatórios.</div>
          </TabsContent>
          <TabsContent value="visual" className="pt-4 space-y-6">
            <StyleEditor style={salesStyle} setStyle={setSalesStyle} openSection={salesOpenSection} setOpenSection={setSalesOpenSection} />
            <div className="flex gap-2">
              <Button type="button" onClick={() => saveFormStyle('vendas')}>Salvar estilo de Vendas</Button>
            </div>
          </TabsContent>
          <TabsContent value="integracoes" className="pt-4">
            <div className="text-sm text-muted-foreground">Integrações com ERPs, webhooks e pixels.</div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

  const PreviewRight = ({ title, agType: agTypeProp, setAgType: setAgTypeProp, leadFormStyle, selectedFields, availableFields, requiredFields, placeholderFields, placeholderTexts }: { title: string; agType?: 'novo'|'continuacao'|'negociacao'|'remarcacao'; setAgType?: (v: 'novo'|'continuacao'|'negociacao'|'remarcacao') => void; leadFormStyle?: any; selectedFields?: string[]; availableFields?: any[]; requiredFields?: Set<string>; placeholderFields?: Set<string>; placeholderTexts?: Record<string, string> }) => {
  // Estados dinâmicos para cada campo selecionado
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [renderedFields, setRenderedFields] = useState<Set<string>>(new Set());
  
  // Função para atualizar valor de um campo específico
  const updateFieldValue = (fieldId: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Controlar renderização para evitar duplicatas
  useEffect(() => {
    if (selectedFields && Array.isArray(selectedFields)) {
    const uniqueFields = selectedFields.filter((fieldId, index, self) => self.indexOf(fieldId) === index);
    setRenderedFields(new Set(uniqueFields));
    }
  }, [selectedFields]);
  
  // Estados fixos para compatibilidade
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [range, setRange] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { selectedCompanyId } = useCompany();
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);

  const [leadQuery, setLeadQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [meetingQuery, setMeetingQuery] = useState('');

  const isControlledAg = typeof agTypeProp !== 'undefined' && typeof setAgTypeProp !== 'undefined';
  const [agTypeInternal, setAgTypeInternal] = useState<'novo' | 'continuacao' | 'negociacao' | 'remarcacao'>('novo');
  const agType = (isControlledAg ? agTypeProp : agTypeInternal) as 'novo'|'continuacao'|'negociacao'|'remarcacao';
  const setAgType = (v: 'novo'|'continuacao'|'negociacao'|'remarcacao') => {
    if (isControlledAg && setAgTypeProp) return setAgTypeProp(v);
    setAgTypeInternal(v);
  };
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedMeeting, setSelectedMeeting] = useState<string>('');
  const [sameHost, setSameHost] = useState<'sim' | 'nao'>('sim');
  const [meetingWhen, setMeetingWhen] = useState<string>(''); // datetime-local
  const [info, setInfo] = useState('');
  
  // Novos estados para os campos de Resultado
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [isQualified, setIsQualified] = useState<'sim' | 'nao' | ''>('');
  const [hasClosing, setHasClosing] = useState<'sim' | 'nao' | ''>('');
  const [disqualificationReason, setDisqualificationReason] = useState<string>('');
  const [selectedSale, setSelectedSale] = useState<string>('');
  const [scheduledNewMeeting, setScheduledNewMeeting] = useState<'sim' | 'nao' | ''>('');
  const [selectedNewMeeting, setSelectedNewMeeting] = useState<string>('');
  const [lossReasons, setLossReasons] = useState<{ id: string; name: string; justificativa_obrigatoria: boolean }[]>([]);
  const [origins, setOrigins] = useState<{ id: string; name: string }[]>([]);
  const [justificativa, setJustificativa] = useState<string>('');

  // Carregar dados para selects (empresa atual)
  useEffect(() => {
    const load = async () => {
      if (!selectedCompanyId) { setLeads([]); setUsers([]); setMeetings([]); setLossReasons([]); setOrigins([]); return; }
      try {
        const [{ data: leadsData }, { data: usersData }, { data: lossReasonsData }, { data: originsData }] = await Promise.all([
          supabase.from('leads').select('id, nome, email, telefone').eq('company_id', selectedCompanyId).limit(200),
          supabase.from('crm_users').select('id, first_name, last_name, email, phone, company_id').eq('company_id', selectedCompanyId).limit(200),
          (supabase as any).from('loss_reasons').select('id, name, justificativa_obrigatoria').eq('company_id', selectedCompanyId).eq('status', 'active').order('created_at', { ascending: false }),
          (supabase as any).from('lead_origins').select('id, name').eq('company_id', selectedCompanyId).order('created_at', { ascending: false }),
        ]);
        setLeads(leadsData || []);
        setUsers(usersData || []);
        setLossReasons(lossReasonsData || []);
        setOrigins(originsData || []);
        // Reuniões - usando dados mockados por enquanto
        setMeetings([]);
      } catch (error) {
        console.error('Error loading connection data:', error);
        setLeads([]); setUsers([]); setMeetings([]); setLossReasons([]); setOrigins([]);
      }
    };
    load();
  }, [selectedCompanyId]);

  // Determinar o conjunto de estilo conforme a aba
  const cfg = title === 'Agendamentos'
      ? {
          spacingFieldsPx,
          previewFont,
          fontSizeLabelPx,
          fontSizeInputPx,
          fontSizeButtonPx,
          fieldBgColor,
          fieldTextColor,
          selectBgColor,
          selectTextColor,
          borderRadiusPx,
          borderWidthNormalPx,
          borderWidthFocusPx,
          borderColorNormal,
          borderColorActive,
          buttonSpacingPx,
          btnBg1, btnBg2, btnAngle,
          btnBgActive1, btnBgActive2, btnAngleActive,
          btnText, btnTextActive,
          btnRadius, btnBorderWidth, btnBorderWidthActive,
          btnBorderColor, btnBorderColorActive,
        }
      : (title === 'Leads' ? (leadFormStyle || leadsStyle) : (title === 'Resultados' ? resultsStyle : salesStyle));

  const fontStyle = cfg.previewFont ? { fontFamily: `${cfg.previewFont}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'` } : undefined;
  const labelStyle = { ...(fontStyle || {}), fontSize: `${cfg.fontSizeLabelPx}px`, marginBottom: `${spacingLabelPx}px` } as React.CSSProperties;
  const inputStyle = { ...(fontStyle || {}), fontSize: `${cfg.fontSizeInputPx}px` } as React.CSSProperties;
  const fieldStyle = {
    ...inputStyle,
    backgroundColor: cfg.fieldBgColor,
    color: cfg.fieldTextColor,
    borderColor: cfg.borderColorNormal,
    borderWidth: cfg.borderWidthNormalPx,
    borderStyle: 'solid',
    borderRadius: cfg.borderRadiusPx,
  } as React.CSSProperties;
  const selectorVars = ({ ['--selBg']: cfg.selectBgColor, ['--selFg']: cfg.selectTextColor, ['--active-bc']: cfg.borderColorActive, ['--baseBg']: cfg.fieldBgColor, ['--baseFg']: cfg.fieldTextColor } as unknown) as React.CSSProperties;
  const selectorBaseStyle = {
    ...(fontStyle || {}),
    borderColor: cfg.borderColorNormal,
    borderWidth: cfg.borderWidthNormalPx,
    borderStyle: 'solid',
    borderRadius: cfg.borderRadiusPx,
    fontSize: `${cfg.fontSizeInputPx}px`,
  } as React.CSSProperties;
  const normalButtonBg = `linear-gradient(${cfg.btnAngle}deg, ${cfg.btnBg1}, ${cfg.btnBg2})`;
  const activeButtonBg = `linear-gradient(${cfg.btnAngleActive}deg, ${cfg.btnBgActive1}, ${cfg.btnBgActive2})`;
  const buttonStyle = {
    ...(fontStyle || {}),
    fontSize: `${cfg.fontSizeButtonPx}px`,
    marginTop: title === 'Leads' ? `${cfg.buttonSpacingPx}px` : `${cfg.buttonSpacingPx}px`,
    backgroundImage: normalButtonBg,
    color: cfg.btnText,
    borderRadius: cfg.btnRadius,
    borderWidth: cfg.btnBorderWidth,
    borderColor: cfg.btnBorderColor,
    borderStyle: 'solid',
  } as React.CSSProperties;
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Prévia do formulário</h3>
      <div className="w-full bg-[#1F1F1F]/95 backdrop-blur-sm shadow-xl border border-white/10 rounded-md">
        <div className="p-6" style={fontStyle}>
          {/* CSS auxiliar para borda de foco com variável controlada */}
          <style>{`
            .focus-border:focus { border-color: var(--active-bc) !important; border-width: var(--focus-bw, 2px) !important; }
          `}</style>
          <div className="flex flex-col">
              {/* Caso especial: Agendamentos - mostrar estrutura de agendamento */}
              {title === 'Agendamentos' ? (
                <>
                  {/* Tipo de agendamento somente dropdown */}
                  <div className="space-y-2" style={{ marginBottom: `${spacingFieldsPx}px` }}>
                    <Label style={labelStyle}>Selecione o tipo de Reunião</Label>
                    <Select value={agType} onValueChange={(v: any) => setAgType(v)}>
                      <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}>
                        <SelectValue placeholder="Selecione o tipo de Reunião" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-white/20 text-white" style={{ ...(fontStyle||{}), ['--selBg' as any]: selectBgColor, ['--selFg' as any]: selectTextColor, fontSize: `${fontSizeInputPx}px` }}>
                        <SelectItem value="novo" className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${fontSizeInputPx}px` }}>Novo</SelectItem>
                        <SelectItem value="continuacao" className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${fontSizeInputPx}px` }}>Continuação</SelectItem>
                        <SelectItem value="negociacao" className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${fontSizeInputPx}px` }}>Negociação</SelectItem>
                        <SelectItem value="remarcacao" className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${fontSizeInputPx}px` }}>Remarcação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Novo */}
                  {agType === 'novo' && (
                    <>
                      {/* Lead com busca + botão + */}
                      <div className="space-y-2" style={{ marginBottom: `${spacingFieldsPx}px` }}>
                        <div className="flex gap-2" style={{ ...(selectorVars as any) }}>
                          <Select value={selectedLead} onValueChange={setSelectedLead}>
                          <SelectTrigger className="flex-1 h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}>
                              <SelectValue placeholder="Selecione ou Adicione um Lead" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2A2A2A] border-white/20 text-white max-h-80" style={{ ...(fontStyle||{}), ['--selBg' as any]: selectBgColor, ['--selFg' as any]: selectTextColor }}>
                              <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: borderRadiusPx }}>
                                <Input
                                  placeholder="Pesquisar nome, e-mail ou telefone"
                                  value={leadQuery}
                                  onChange={(e) => setLeadQuery(e.target.value)}
                                  className="h-9 bg-[#1f1f1f] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                                  style={{ ...(fontStyle||{}), borderRadius: borderRadiusPx, ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}
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
                                  <SelectItem key={l.id} value={l.id} className="text-base data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${fontSizeInputPx}px` }}>
                                    {l.nome || l.email || l.telefone}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            type="button" 
                            className="h-12 px-3 border hover:bg-[var(--selBg)] hover:text-[var(--selFg)]" 
                            variant="ghost" 
                            title="Adicionar lead" 
                            style={{ backgroundColor: fieldBgColor, color: fieldTextColor, borderColor: borderColorNormal, borderWidth: borderWidthNormalPx, borderRadius: borderRadiusPx }}
                            onClick={openBaseFormModal}
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      {/* Anfitrião com busca */}
                      <div className="space-y-2" style={{ marginBottom: `${spacingFieldsPx}px` }}>
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                          <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}>
                            <SelectValue placeholder="Selecione o Anfitrião" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2A2A2A] border-white/20 text-white max-h-80" style={{ ...(fontStyle||{}), ['--selBg' as any]: selectBgColor, ['--selFg' as any]: selectTextColor, fontSize: `${fontSizeInputPx}px` }}>
                            <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: borderRadiusPx }}>
                              <Input
                                placeholder="Pesquisar usuário"
                                value={userQuery}
                                onChange={(e) => setUserQuery(e.target.value)}
                                className="h-9 bg-[#1f1f1f] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                                style={{ ...(fontStyle||{}), borderRadius: borderRadiusPx, ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}
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
                                <SelectItem key={u.id} value={u.id} className="text-base data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${fontSizeInputPx}px` }}>
                                  {(u.first_name || '') + ' ' + (u.last_name || '') || u.email || u.phone}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Data e hora */}
                      <div className="space-y-1" style={{ marginBottom: `${spacingFieldsPx}px` }}>
                        <Label style={labelStyle}>Informe a data e hora da reunião</Label>
                        <Input
                          type="datetime-local"
                          value={meetingWhen}
                          onChange={(e) => setMeetingWhen(e.target.value)}
                          className="h-12 text-base focus-ring-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border" style={{ ...fieldStyle, ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}
                        />
                      </div>

                      {/* Informações */}
                      <Textarea
                        placeholder="Informações da reunião"
                        value={info}
                        onChange={(e) => setInfo(e.target.value)}
                        className="min-h-24 placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border" style={{ ...fieldStyle, ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}
                      />
                      <Button type="button" className="w-full h-12 font-semibold transition-all duration-300 shadow-lg" style={buttonStyle}
                        onMouseDown={(e)=>{ (e.currentTarget.style as any).backgroundImage = activeButtonBg; (e.currentTarget.style as any).color = btnTextActive; (e.currentTarget.style as any).borderWidth = `${btnBorderWidthActive}px`; (e.currentTarget.style as any).borderColor = btnBorderColorActive; }}
                        onMouseUp={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = btnText; (e.currentTarget.style as any).borderWidth = `${btnBorderWidth}px`; (e.currentTarget.style as any).borderColor = btnBorderColor; }}
                        onMouseLeave={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = btnText; (e.currentTarget.style as any).borderWidth = `${btnBorderWidth}px`; (e.currentTarget.style as any).borderColor = btnBorderColor; }}
                      >
                        Agendar Reunião
                      </Button>
                    </>
                  )}

                  {/* Negociação, Continuação e Remarcação compartilham estrutura */}
                  {(agType === 'negociacao' || agType === 'continuacao' || agType === 'remarcacao') && (
                    <>
                      {/* Reunião com busca */}
                      <div style={{ display: 'grid', rowGap: `${spacingLabelPx}px`, marginBottom: `${spacingFieldsPx}px` }}>
                        <Select value={selectedMeeting} onValueChange={setSelectedMeeting}>
                          <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}>
                            <SelectValue placeholder="Selecione a Reunião" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2A2A2A] border-white/20 text-white max-h-80" style={{ ...(fontStyle||{}), fontSize: `${fontSizeInputPx}px` }}>
                            <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: borderRadiusPx }}>
                              <Input
                                placeholder="Pesquisar reunião (lead)"
                                value={meetingQuery}
                                onChange={(e) => setMeetingQuery(e.target.value)}
                                className="h-9 bg-[#1f1f1f] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                                style={{ ...(fontStyle||{}), borderRadius: borderRadiusPx, ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}
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
                                <SelectItem key={m.id} value={m.id} className="text-base" style={{ ...(fontStyle||{}), fontSize: `${fontSizeInputPx}px` }}>
                                  {m.title || m.lead_name || m.lead_email || m.lead_phone}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Manteve o mesmo anfitrião */}
                      <div className="space-y-2" style={{ ...(selectorVars as any), marginBottom: `${spacingFieldsPx}px` }}>
                        <Label style={labelStyle}>Será feita pelo mesmo anfitrião?</Label>
                        <ToggleGroup type="single" value={sameHost} onValueChange={(v) => setSameHost((v as any) || sameHost)} className="grid grid-cols-2 gap-3" style={{ ...(selectorVars as any), ...(fontStyle||{}) }}>
                          <ToggleGroupItem
                            value="sim"
                            aria-label="Sim"
                            className="font-normal text-base bg-[var(--baseBg)] text-[var(--baseFg)] hover:bg-[var(--selBg)] hover:text-[var(--selFg)] data-[state=on]:bg-[var(--selBg)] data-[state=on]:text-[var(--selFg)] data-[state=on]:border-[var(--active-bc)]"
                            style={{ ...selectorBaseStyle }}
                          >
                            Sim
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="nao"
                            aria-label="Não"
                            className="font-normal text-base bg-[var(--baseBg)] text-[var(--baseFg)] hover:bg-[var(--selBg)] hover:text-[var(--selFg)] data-[state=on]:bg-[var(--selBg)] data-[state=on]:text-[var(--selFg)] data-[state=on]:border-[var(--active-bc)]"
                            style={{ ...selectorBaseStyle }}
                          >
                            Não
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>

                      {/* Anfitrião (apenas quando não manteve) */}
                      {sameHost === 'nao' && (
                        <div className="space-y-2" style={{ marginBottom: `${spacingFieldsPx}px` }}>
                          <Select value={selectedUser} onValueChange={setSelectedUser}>
                          <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}>
                              <SelectValue placeholder="Selecione o Anfitrião" />
                            </SelectTrigger>
                          <SelectContent className="bg-[#2A2A2A] border-white/20 text-white max-h-80" style={{ ...(selectorVars as any), ...(fontStyle||{}) }}>
                            <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: borderRadiusPx }}>
                                <Input
                                  placeholder="Pesquisar usuário"
                                  value={userQuery}
                                  onChange={(e) => setUserQuery(e.target.value)}
                                  className="h-9 bg-[#1f1f1f] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                                style={{ ...(fontStyle||{}), borderRadius: borderRadiusPx, ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}
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
                      <div className="space-y-1" style={{ marginBottom: `${spacingFieldsPx}px` }}>
                        <Label style={labelStyle}>Informe a data e hora da reunião</Label>
                        <Input
                          type="datetime-local"
                          value={meetingWhen}
                          onChange={(e) => setMeetingWhen(e.target.value)}
                          className="h-12 text-base focus-ring-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border" style={{ ...fieldStyle, ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}
                        />
                      </div>

                      {/* Informações - aparece também para os demais tipos, mas obrigatória apenas em 'novo' (validação virá depois) */}
                      <Textarea
                        placeholder="Informações da reunião"
                        value={info}
                        onChange={(e) => setInfo(e.target.value)}
                        className="min-h-24 placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border" style={{ ...fieldStyle, ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}
                      />
                      <Button type="button" className="w-full h-12 font-semibold transition-all duration-300 shadow-lg" style={buttonStyle}
                        onMouseDown={(e)=>{ (e.currentTarget.style as any).backgroundImage = activeButtonBg; (e.currentTarget.style as any).color = btnTextActive; (e.currentTarget.style as any).borderWidth = `${btnBorderWidthActive}px`; (e.currentTarget.style as any).borderColor = btnBorderColorActive; }}
                        onMouseUp={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = btnText; (e.currentTarget.style as any).borderWidth = `${btnBorderWidth}px`; (e.currentTarget.style as any).borderColor = btnBorderColor; }}
                        onMouseLeave={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = btnText; (e.currentTarget.style as any).borderWidth = `${btnBorderWidth}px`; (e.currentTarget.style as any).borderColor = btnBorderColor; }}
                      >
                        Agendar Reunião
                      </Button>
                    </>
                  )}
                </>
              ) : title === 'Resultados' ? (
                <>
                  {/* Selecionar reunião (com busca) */}
                  <div style={{ display: 'grid', rowGap: `${spacingLabelPx}px`, marginBottom: `${cfg.spacingFieldsPx}px` }}>
                    <Label style={labelStyle}>Selecione a Reunião</Label>
                    <Select value={selectedMeeting} onValueChange={setSelectedMeeting}>
                      <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px` }}>
                        <SelectValue placeholder="Selecione a Reunião" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-white/20 text-white max-h-80" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>
                        <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: cfg.borderRadiusPx }}>
                          <Input
                            placeholder="Pesquisar reunião (lead)"
                            value={meetingQuery}
                            onChange={(e) => setMeetingQuery(e.target.value)}
                            className="h-9 bg-[#1f1f1f] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                            style={{ ...(fontStyle||{}), borderRadius: cfg.borderRadiusPx, ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px` }}
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
                            <SelectItem key={m.id} value={m.id} className="text-base" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>
                              {m.title || m.lead_name || m.lead_email || m.lead_phone}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cliente entrou na reunião? */}
                  {(() => {
                    const [state, setState] = [sameHost, setSameHost] as unknown as ['sim'|'nao', (v: 'sim'|'nao')=>void];
                    return (
                      <div className="space-y-2" style={{ ...(selectorVars as any), marginBottom: `${cfg.spacingFieldsPx}px` }}>
                        <Label style={labelStyle}>Cliente entrou na reunião?</Label>
                        <ToggleGroup type="single" value={state} onValueChange={(v) => setState((v as any) || state)} className="grid grid-cols-2 gap-3" style={selectorVars}>
                          <ToggleGroupItem value="sim" aria-label="Sim" className="font-normal text-base bg-[var(--baseBg)] text-[var(--baseFg)] hover:bg-[var(--selBg)] hover:text-[var(--selFg)] data-[state=on]:bg-[var(--selBg)] data-[state=on]:text-[var(--selFg)] data-[state=on]:border-[var(--active-bc)]" style={{ ...selectorBaseStyle }}>
                            Sim
                          </ToggleGroupItem>
                          <ToggleGroupItem value="nao" aria-label="Não" className="font-normal text-base bg-[var(--baseBg)] text-[var(--baseFg)] hover:bg-[var(--selBg)] hover:text-[var(--selFg)] data-[state=on]:bg-[var(--selBg)] data-[state=on]:text-[var(--selFg)] data-[state=on]:border-[var(--active-bc)]" style={{ ...selectorBaseStyle }}>
                            Não
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    );
                  })()}

                  {/* Agendou nova reunião? (aparece apenas quando cliente não entrou) */}
                  {sameHost === 'nao' && (
                    <div className="space-y-2" style={{ ...(selectorVars as any), marginBottom: `${cfg.spacingFieldsPx}px` }}>
                      <Label style={labelStyle}>Agendou nova reunião?</Label>
                      <ToggleGroup type="single" value={selectedUser ? 'sim' : 'nao'} onValueChange={(value) => setSelectedUser(value === 'sim' ? 'selected' : '')} className="grid grid-cols-2 gap-3" style={selectorVars}>
                        <ToggleGroupItem value="sim" aria-label="Sim" className="font-normal text-base bg-[var(--baseBg)] text-[var(--baseFg)] hover:bg-[var(--selBg)] hover:text-[var(--selFg)] data-[state=on]:bg-[var(--selBg)] data-[state=on]:text-[var(--selFg)] data-[state=on]:border-[var(--active-bc)]" style={{ ...selectorBaseStyle }}>
                          Sim
                        </ToggleGroupItem>
                        <ToggleGroupItem value="nao" aria-label="Não" className="font-normal text-base bg-[var(--baseBg)] text-[var(--baseFg)] hover:bg-[var(--selBg)] hover:text-[var(--selFg)] data-[state=on]:bg-[var(--selBg)] data-[state=on]:text-[var(--selFg)] data-[state=on]:border-[var(--active-bc)]" style={{ ...selectorBaseStyle }}>
                          Não
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  )}

                  {/* Fase em que a reunião finalizou (aparece quando cliente entrou) */}
                  {sameHost === 'sim' && (
                    <div className="space-y-2" style={{ marginBottom: `${cfg.spacingFieldsPx}px` }}>
                      <Label style={labelStyle}>Fase em que a reunião finalizou</Label>
                      <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                      <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px` }}>
                          <SelectValue placeholder="Selecione a fase" />
                        </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-white/20 text-white max-h-80" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>
                        <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: cfg.borderRadiusPx }}>
                            <Input
                              placeholder="Pesquisar fase"
                              className="h-9 bg-[#1f1f1f] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                            style={{ ...(fontStyle||{}), borderRadius: cfg.borderRadiusPx, ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px` }}
                            />
                          </div>
                        {(resultStages || []).map((stage, i) => (
                          <SelectItem key={`${stage}-${i}`} value={`${i}`} className="text-base" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>{stage}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Reunião qualificada? (aparece apenas quando fase é qualificada) */}
                  {sameHost === 'sim' && selectedPhase && qualifiedStageIdx !== null && Number(selectedPhase) === qualifiedStageIdx && (
                    <div className="space-y-2" style={{ ...(selectorVars as any), marginBottom: `${cfg.spacingFieldsPx}px` }}>
                      <Label style={labelStyle}>Reunião qualificada?</Label>
                      <ToggleGroup type="single" value={isQualified} onValueChange={(value) => setIsQualified(value as 'sim' | 'nao' | '')} className="grid grid-cols-2 gap-3" style={selectorVars}>
                        <ToggleGroupItem value="sim" aria-label="Sim" className="font-normal text-base bg-[var(--baseBg)] text-[var(--baseFg)] hover:bg-[var(--selBg)] hover:text-[var(--selFg)] data-[state=on]:bg-[var(--selBg)] data-[state=on]:text-[var(--selFg)] data-[state=on]:border-[var(--active-bc)]" style={{ ...selectorBaseStyle }}>
                          Sim
                        </ToggleGroupItem>
                        <ToggleGroupItem value="nao" aria-label="Não" className="font-normal text-base bg-[var(--baseBg)] text-[var(--baseFg)] hover:bg-[var(--selBg)] hover:text-[var(--selFg)] data-[state=on]:bg-[var(--selBg)] data-[state=on]:text-[var(--selFg)] data-[state=on]:border-[var(--active-bc)]" style={{ ...selectorBaseStyle }}>
                          Não
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  )}

                  {/* Houve fechamento? (aparece apenas quando reunião é qualificada) */}
                  {sameHost === 'sim' && isQualified === 'sim' && (
                    <div className="space-y-2" style={{ ...(selectorVars as any), marginBottom: `${cfg.spacingFieldsPx}px` }}>
                      <Label style={labelStyle}>Houve fechamento?</Label>
                      <ToggleGroup type="single" value={hasClosing} onValueChange={(value) => setHasClosing(value as 'sim' | 'nao' | '')} className="grid grid-cols-2 gap-3" style={selectorVars}>
                        <ToggleGroupItem value="sim" aria-label="Sim" className="font-normal text-base bg-[var(--baseBg)] text-[var(--baseFg)] hover:bg-[var(--selBg)] hover:text-[var(--selFg)] data-[state=on]:bg-[var(--selBg)] data-[state=on]:text-[var(--selFg)] data-[state=on]:border-[var(--active-bc)]" style={{ ...selectorBaseStyle }}>
                          Sim
                        </ToggleGroupItem>
                        <ToggleGroupItem value="nao" aria-label="Não" className="font-normal text-base bg-[var(--baseBg)] text-[var(--baseFg)] hover:bg-[var(--selBg)] hover:text-[var(--selFg)] data-[state=on]:bg-[var(--selBg)] data-[state=on]:text-[var(--selFg)] data-[state=on]:border-[var(--active-bc)]" style={{ ...selectorBaseStyle }}>
                          Não
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  )}

                  {/* Motivo de Desqualificação (aparece apenas quando reunião não é qualificada) */}
                  {sameHost === 'sim' && isQualified === 'nao' && (
                    <div className="space-y-2" style={{ marginBottom: `${cfg.spacingFieldsPx}px` }}>
                      <Label style={labelStyle}>Motivo de Desqualificação</Label>
                      <Select value={disqualificationReason} onValueChange={setDisqualificationReason}>
                        <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px` }}>
                          <SelectValue placeholder="Selecione o motivo" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2A2A2A] border-white/20 text-white max-h-80" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>
                          <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: cfg.borderRadiusPx }}>
                            <Input
                              placeholder="Pesquisar motivo"
                              className="h-9 bg-[#1f1f1f] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                              style={{ ...(fontStyle||{}), borderRadius: cfg.borderRadiusPx, ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px` }}
                            />
                          </div>
                          {/* Opções de motivos de desqualificação vindas do Supabase */}
                          {lossReasons.map((reason) => (
                            <SelectItem key={reason.id} value={reason.id} className="text-base" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>
                              {reason.name}
                            </SelectItem>
                          ))}
                          {lossReasons.length === 0 && (
                            <SelectItem value="no-reasons" disabled className="text-base text-muted-foreground" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>
                              Nenhum motivo cadastrado
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Campo Justificativa - aparece quando um motivo com justificativa obrigatória é selecionado */}
                  {sameHost === 'sim' && isQualified === 'nao' && disqualificationReason && lossReasons.find(r => r.id === disqualificationReason)?.justificativa_obrigatoria && (
                    <div className="space-y-2" style={{ marginBottom: `${cfg.spacingFieldsPx}px` }}>
                      <Label style={labelStyle}>Justificativa</Label>
                      <Input
                        type="text"
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
                        placeholder="Descreva a justificativa para a desqualificação"
                        className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                        style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px` }}
                      />
                    </div>
                  )}

                  {/* Selecionar ou Registrar Venda (aparece apenas quando houve fechamento) */}
                  {sameHost === 'sim' && hasClosing === 'sim' && (
                    <div className="space-y-2" style={{ marginBottom: `${cfg.spacingFieldsPx}px` }}>
                      <Label style={labelStyle}>Selecionar ou Registrar Venda</Label>
                      <div className="flex gap-2">
                        <Select value={selectedSale} onValueChange={setSelectedSale} className="flex-1">
                          <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px` }}>
                            <SelectValue placeholder="Selecione uma venda" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2A2A2A] border-white/20 text-white max-h-80" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>
                            <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: cfg.borderRadiusPx }}>
                              <Input
                                placeholder="Pesquisar venda"
                                className="h-9 bg-[#1f1f1f] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                                style={{ ...(fontStyle||{}), borderRadius: cfg.borderRadiusPx, ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px` }}
                              />
                            </div>
                            {/* TODO: Adicionar vendas existentes */}
                            <SelectItem value="nova-venda" className="text-base" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>+ Registrar nova venda</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          className="h-12 px-4 bg-[var(--brand-primary,#E50F5E)] hover:opacity-90 text-white font-semibold"
                          style={{ ...(fontStyle||{}) }}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Agendou nova reunião? (aparece apenas quando não houve fechamento) */}
                  {sameHost === 'sim' && hasClosing === 'nao' && (
                    <div className="space-y-2" style={{ ...(selectorVars as any), marginBottom: `${cfg.spacingFieldsPx}px` }}>
                      <Label style={labelStyle}>Agendou nova reunião?</Label>
                      <ToggleGroup type="single" value={scheduledNewMeeting} onValueChange={(value) => setScheduledNewMeeting(value as 'sim' | 'nao' | '')} className="grid grid-cols-2 gap-3" style={selectorVars}>
                        <ToggleGroupItem value="sim" aria-label="Sim" className="font-normal text-base bg-[var(--baseBg)] text-[var(--baseFg)] hover:bg-[var(--selBg)] hover:text-[var(--selFg)] data-[state=on]:bg-[var(--selBg)] data-[state=on]:text-[var(--selFg)] data-[state=on]:border-[var(--active-bc)]" style={{ ...selectorBaseStyle }}>
                          Sim
                        </ToggleGroupItem>
                        <ToggleGroupItem value="nao" aria-label="Não" className="font-normal text-base bg-[var(--baseBg)] text-[var(--baseFg)] hover:bg-[var(--selBg)] hover:text-[var(--selFg)] data-[state=on]:bg-[var(--selBg)] data-[state=on]:text-[var(--selFg)] data-[state=on]:border-[var(--active-bc)]" style={{ ...selectorBaseStyle }}>
                          Não
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  )}

                  {/* Selecionar ou Agendar nova reunião (aparece apenas quando agendou nova reunião) */}
                  {sameHost === 'sim' && scheduledNewMeeting === 'sim' && (
                    <div className="space-y-2" style={{ marginBottom: `${cfg.spacingFieldsPx}px` }}>
                      <Label style={labelStyle}>Selecionar ou Agendar nova reunião</Label>
                      <div className="flex gap-2">
                        <Select value={selectedNewMeeting} onValueChange={setSelectedNewMeeting} className="flex-1">
                          <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px` }}>
                            <SelectValue placeholder="Selecione uma reunião" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2A2A2A] border-white/20 text-white max-h-80" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>
                            <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: cfg.borderRadiusPx }}>
                              <Input
                                placeholder="Pesquisar reunião"
                                className="h-9 bg-[#1f1f1f] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                                style={{ ...(fontStyle||{}), borderRadius: cfg.borderRadiusPx, ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px` }}
                              />
                            </div>
                            {/* TODO: Adicionar reuniões existentes */}
                            <SelectItem value="nova-reuniao" className="text-base" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>+ Agendar nova reunião</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          className="h-12 px-4 bg-[var(--brand-primary,#E50F5E)] hover:opacity-90 text-white font-semibold"
                          style={{ ...(fontStyle||{}) }}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Botão Registrar feedback */}
                  <div style={{ marginTop: `${cfg.buttonSpacingPx - cfg.spacingFieldsPx}px` }}>
                    <Button 
                      type="button" 
                      className="w-full h-12 text-base font-semibold transition-all duration-300 shadow-lg" 
                      style={buttonStyle}
                      onMouseDown={(e)=>{ (e.currentTarget.style as any).backgroundImage = activeButtonBg; (e.currentTarget.style as any).color = cfg.btnTextActive; (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidthActive}px`; (e.currentTarget.style as any).borderColor = cfg.btnBorderColorActive; }}
                      onMouseUp={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = cfg.btnText; (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidth}px`; (e.currentTarget.style as any).borderColor = cfg.btnBorderColor; }}
                      onMouseLeave={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = cfg.btnText; (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidth}px`; (e.currentTarget.style as any).borderColor = cfg.btnBorderColor; }}
                    >
                      Registrar feedback
                    </Button>
                  </div>
                </>
              ) : title === 'Leads' ? (
                <>
                  {/* Prévia específica para Leads - campos personalizados */}
                  {(!selectedFields || selectedFields.length === 0) ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>Nenhum campo selecionado</p>
                      <p className="text-sm mt-2">Vá para a aba "Campos" para selecionar os campos do formulário</p>
                    </div>
              ) : (
                <>
                      {/* Renderizar campos personalizados dinamicamente */}
                      {Array.from(renderedFields).map((fieldId, index) => {
                        const field = availableFields?.find(f => f.id === fieldId);
                        if (!field) return null;

                        const currentValue = fieldValues[fieldId] || '';
                        const isLastField = index === renderedFields.size - 1;

                        return (
                          <div key={fieldId} style={{ marginBottom: isLastField ? '0px' : `${cfg.spacingFieldsPx}px` }}>
                            {/* Label do campo - lógica especial para campos restritos */}
                            {(() => {
                              const isRestrictedField = !canHavePlaceholderField(field?.type || '');
                              const hasPlaceholderText = placeholderTexts?.[fieldId] && placeholderTexts[fieldId].trim() !== '';
                              const shouldHideLabel = !isRestrictedField && (field.placeholder || (placeholderFields?.has(fieldId) && canHavePlaceholderField(field?.type || '')));
                              
                              if (shouldHideLabel) return null;
                              
                              return (
                              <Label className="block mb-2" style={{ ...labelStyle, ...(fontStyle||{}) }}>
                                  {isRestrictedField && hasPlaceholderText ? placeholderTexts[fieldId] : field.name}
                                  {(field.required || requiredFields?.has(fieldId)) && <span className="text-red-500 ml-1">*</span>}
                              </Label>
                              );
                            })()}
                            
                            {/* Renderizar campo baseado no tipo */}
                            {field.type === 'text' && (
                          <Input
                                placeholder={field.placeholder ? (field.placeholder_text || field.name) : (placeholderTexts?.[fieldId] || field.name)}
                                value={currentValue}
                                onChange={(e) => {
                                  // Aplicar formatação de nome se for campo de nome
                                  const formattedValue = field.name.toLowerCase().includes('nome') || field.name.toLowerCase().includes('name') 
                                    ? formatName(e.target.value)
                                    : e.target.value;
                                  updateFieldValue(fieldId, formattedValue);
                                }}
                            className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                style={{ 
                                  ...fieldStyle, 
                                  ...(fontStyle||{}), 
                                  ['--active-bc' as any]: cfg.borderColorActive, 
                                  ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                  textTransform: 'none' // Evitar transformação automática do browser
                                }}
                                maxLength={field.max_length || undefined}
                              />
                            )}
                            
                            {field.type === 'name' && (
                              <Input
                                placeholder={field.placeholder ? (field.placeholder_text || field.name) : (placeholderTexts?.[fieldId] || field.name)}
                                value={currentValue}
                                onChange={(e) => {
                                  // Aplicar formatação de nome (primeira maiúscula)
                                  const formattedValue = formatName(e.target.value);
                                  updateFieldValue(fieldId, formattedValue);
                                }}
                                className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                style={{ 
                                  ...fieldStyle, 
                                  ...(fontStyle||{}), 
                                  ['--active-bc' as any]: cfg.borderColorActive, 
                                  ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                  textTransform: 'none' // Evitar transformação automática do browser
                                }}
                                maxLength={field.max_length || undefined}
                              />
                            )}
                            
                            {field.type === 'email' && (
                              <div className="space-y-1">
                                <Input
                                  type="email"
                                  placeholder={field.placeholder ? (field.placeholder_text || field.name) : (placeholderTexts?.[fieldId] || field.name)}
                                  value={currentValue}
                                  onChange={(e) => updateFieldValue(fieldId, e.target.value)}
                                  className={`h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border ${currentValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentValue) ? 'border-red-500 focus:border-red-500' : ''}`}
                                  style={{ 
                                    ...fieldStyle, 
                                    ...(fontStyle||{}), 
                                    ['--active-bc' as any]: cfg.borderColorActive, 
                                    ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                  }}
                                  maxLength={field.max_length || undefined}
                                />
                                {currentValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentValue) && (
                                  <p className="text-xs text-red-500">Por favor, insira um email válido</p>
                                )}
                        </div>
                      )}

                            {field.type === 'phone' && (
                          <LandingPhoneInput
                                value={currentValue}
                                onChange={(value) => updateFieldValue(fieldId, value)}
                                placeholder={field.placeholder ? (field.placeholder_text || field.name) : (placeholderTexts?.[fieldId] || field.name)}
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
                              />
                            )}
                            
                            {field.type === 'select' && field.options && (
                              <div className="space-y-2">
                                <Select value={currentValue} onValueChange={(value) => updateFieldValue(fieldId, value)}>
                                  <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px` }}>
                                    <SelectValue placeholder={field.placeholder ? (field.placeholder_text || field.name) : (placeholderTexts?.[fieldId] || field.name)} />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#2A2A2A] border-white/20 text-white" style={{ ...(fontStyle||{}), ['--selBg' as any]: cfg.selectBgColor, ['--selFg' as any]: cfg.selectTextColor, fontSize: `${cfg.fontSizeInputPx}px` }}>
                                    {field.searchable && (
                                      <div className="p-2">
                                        <Input
                                          placeholder="Pesquisar opções..."
                                          value={fieldValues[`${fieldId}_search`] || ''}
                                          onChange={(e) => updateFieldValue(`${fieldId}_search`, e.target.value)}
                                          className="h-9 bg-[#1f1f1f] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
                                        />
                                      </div>
                                    )}
                                    {field.options.split(',').filter(option => 
                                      !field.searchable || 
                                      !fieldValues[`${fieldId}_search`] || 
                                      option.trim().toLowerCase().includes(fieldValues[`${fieldId}_search`].toLowerCase())
                                    ).map((option, index) => (
                                      <SelectItem key={index} value={option.trim()} className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>
                                        {option.trim()}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                        </div>
                      )}
                            
                            {field.type === 'textarea' && (
                              <Textarea
                                placeholder={field.placeholder ? (field.placeholder_text || field.name) : (placeholderTexts?.[fieldId] || field.name)}
                                value={currentValue}
                                onChange={(e) => updateFieldValue(fieldId, e.target.value)}
                                className="h-20 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border resize-none"
                                style={{ 
                                  ...fieldStyle, 
                                  ...(fontStyle||{}), 
                                  ['--active-bc' as any]: cfg.borderColorActive, 
                                  ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                }}
                                maxLength={field.max_length || undefined}
                              />
                            )}
                            
                            {field.type === 'money' && (
                              <div className="flex items-center space-x-2">
                                {/* Seletor de moeda se configurado como variável */}
                                {field.money_currency === 'VARIABLES' && (
                                  <Select 
                                    value={fieldValues[`${fieldId}_currency`] || 'BRL'} 
                                    onValueChange={(value) => updateFieldValue(`${fieldId}_currency`, value)}
                                  >
                                    <SelectTrigger className="w-24 text-sm" style={{...fieldStyle, height: '48px'}}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {currencies.map((currency) => (
                                        <SelectItem key={currency.code} value={currency.code}>
                                          {currency.symbol} {currency.code}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                                <Input
                                  type="text"
                                  placeholder={field.placeholder ? (field.placeholder_text || field.name) : (placeholderTexts?.[fieldId] || "0,00")}
                                  value={currentValue}
                                  onChange={(e) => {
                                    // Aplicar máscara monetária com símbolo
                                    const value = e.target.value.replace(/\D/g, '');
                                    if (value) {
                                      const numericValue = parseInt(value) / 100;
                                      const selectedCurrency = field.money_currency === 'VARIABLES' 
                                        ? currencies.find(c => c.code === (fieldValues[`${fieldId}_currency`] || 'BRL'))
                                        : currencies.find(c => c.code === field.money_currency);
                                      const symbol = selectedCurrency?.symbol || 'R$';
                                      const formatted = `${symbol} ${numericValue.toLocaleString('pt-BR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}`;
                                      updateFieldValue(fieldId, formatted);
                                    } else {
                                      updateFieldValue(fieldId, '');
                                    }
                                  }}
                                  className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                  style={{ 
                                    ...fieldStyle, 
                                    ...(fontStyle||{}), 
                                    ['--active-bc' as any]: cfg.borderColorActive, 
                                    ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                    textAlign: 'left',
                                    flex: 1
                                  }}
                          />
                        </div>
                      )}
                            
                            {field.type === 'number' && (
                              <Input
                                type="number"
                                placeholder={field.placeholder ? (field.placeholder_text || field.name) : (placeholderTexts?.[fieldId] || field.name)}
                                value={currentValue}
                                onChange={(e) => updateFieldValue(fieldId, e.target.value)}
                                className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                style={{ 
                                  ...fieldStyle, 
                                  ...(fontStyle||{}), 
                                  ['--active-bc' as any]: cfg.borderColorActive, 
                                  ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                }}
                                min={field.slider_min || undefined}
                                max={field.slider_max || undefined}
                                step={field.slider_step_value || undefined}
                              />
                            )}
                            
                            {field.type === 'slider' && (
                              <div className="space-y-2">
                                {/* Labels de início e fim */}
                                {field.slider_start_end && (
                                <div className="flex justify-between text-sm text-gray-400">
                                  <span>{field.slider_start || 'Mínimo'}</span>
                                  <span>{field.slider_end || 'Máximo'}</span>
                                </div>
                                )}
                                
                                {/* Layout responsivo: slider + input lado a lado */}
                                <div className="flex flex-col md:flex-row gap-4 items-center">
                                  {/* Slider - 65% em telas grandes, 100% em telas pequenas */}
                                  <div className="w-full md:w-[65%]">
                                <input
                                  type="range"
                                  min={field.slider_min || 0}
                                  max={field.slider_max || 100}
                                  step={field.slider_step_value || 1}
                                  value={currentValue || field.slider_min || 0}
                                  onChange={(e) => updateFieldValue(fieldId, e.target.value)}
                                      className="slider w-full h-2 rounded-lg appearance-none cursor-pointer"
                                  style={{
                                        background: `linear-gradient(to right, ${cfg.selectBgColor} 0%, ${cfg.selectBgColor} ${((parseFloat(currentValue || field.slider_min || 0) - (field.slider_min || 0)) / ((field.slider_max || 100) - (field.slider_min || 0))) * 100}%, ${cfg.fieldBgColor} ${((parseFloat(currentValue || field.slider_min || 0) - (field.slider_min || 0)) / ((field.slider_max || 100) - (field.slider_min || 0))) * 100}%, ${cfg.fieldBgColor} 100%)`,
                                        // Estilo customizado para o thumb (círculo)
                                        '--thumb-bg': cfg.fieldBgColor,
                                        '--thumb-border': cfg.borderColorActive,
                                        '--thumb-border-width': '2px'
                                      } as React.CSSProperties & {
                                        '--thumb-bg': string;
                                        '--thumb-border': string;
                                        '--thumb-border-width': string;
                                      }}
                                    />
                                    <style>{`
                                      .slider::-webkit-slider-thumb {
                                        appearance: none;
                                        width: 20px;
                                        height: 20px;
                                        border-radius: 50%;
                                        background: var(--thumb-bg);
                                        border: var(--thumb-border-width) solid var(--thumb-border);
                                        cursor: pointer;
                                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                                      }
                                      
                                      .slider::-moz-range-thumb {
                                        width: 20px;
                                        height: 20px;
                                        border-radius: 50%;
                                        background: var(--thumb-bg);
                                        border: var(--thumb-border-width) solid var(--thumb-border);
                                        cursor: pointer;
                                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                                      }
                                    `}</style>
                                  </div>
                                  
                                  {/* Input - 35% em telas grandes, 100% em telas pequenas */}
                                  <div className="w-full md:w-[35%]">
                                    <Input
                                      type="number"
                                      value={currentValue || field.slider_min || 0}
                                      onChange={(e) => {
                                        const newValue = parseFloat(e.target.value);
                                        const minValue = field.slider_min || 0;
                                        const maxValue = field.slider_max || 100;
                                        if (!isNaN(newValue) && newValue >= minValue && newValue <= maxValue) {
                                          updateFieldValue(fieldId, newValue.toString());
                                        }
                                      }}
                                      min={field.slider_min || 0}
                                      max={field.slider_max || 100}
                                      step={field.slider_step_value || 1}
                                      className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                      style={{ 
                                        ...fieldStyle, 
                                        ...(fontStyle||{}), 
                                        ['--active-bc' as any]: cfg.borderColorActive, 
                                        ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                      }}
                                    />
                                  </div>
                                </div>
                                
                                {/* Valor atual centralizado (se não tiver input) */}
                                {!field.slider_step && (
                                  <div className="text-center text-sm font-medium" style={{ ...(fontStyle||{}), color: cfg.fieldTextColor }}>
                                  {currentValue || field.slider_min || 0}
                                </div>
                                )}
                              </div>
                            )}
                            
                            {field.type === 'time' && (
                              <Input
                                type="time"
                                placeholder={field.placeholder ? (field.placeholder_text || field.name) : (placeholderTexts?.[fieldId] || field.name)}
                                value={currentValue}
                                onChange={(e) => updateFieldValue(fieldId, e.target.value)}
                                className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                style={{ 
                                  ...fieldStyle, 
                                  ...(fontStyle||{}), 
                                  ['--active-bc' as any]: cfg.borderColorActive, 
                                  ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                }}
                              />
                            )}
                            
                            {field.type === 'datetime' && (
                              <Input
                                type="datetime-local"
                                placeholder={field.placeholder ? (field.placeholder_text || field.name) : (placeholderTexts?.[fieldId] || field.name)}
                                value={currentValue}
                                onChange={(e) => updateFieldValue(fieldId, e.target.value)}
                                className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                style={{ 
                                  ...fieldStyle, 
                                  ...(fontStyle||{}), 
                                  ['--active-bc' as any]: cfg.borderColorActive, 
                                  ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                }}
                              />
                            )}
                            
                            {field.type === 'address' && (
                              <div className="space-y-3">
                                {/* Linha 1: CEP e Estado */}
                                <div className="grid grid-cols-2 gap-3">
                                <Input
                                  type="text"
                                  placeholder="CEP"
                                    maxLength={9}
                                  value={fieldValues[`${fieldId}_cep`] || ''}
                                    onChange={async (e) => {
                                      // Aplicar máscara do CEP
                                    let value = e.target.value.replace(/\D/g, '');
                                    if (value.length >= 5) {
                                      value = value.substring(0, 5) + '-' + value.substring(5, 8);
                                    }
                                    updateFieldValue(`${fieldId}_cep`, value);
                                      
                                      // Se CEP completo, buscar dados
                                      if (value.length === 9) {
                                        const cep = value.replace(/\D/g, '');
                                        if (cep.length === 8) {
                                          const cepData = await fetchCEPData(cep);
                                          if (cepData) {
                                            // Preencher campos automaticamente
                                            updateFieldValue(`${fieldId}_estado`, cepData.uf || '');
                                            updateFieldValue(`${fieldId}_cidade`, cepData.localidade || '');
                                            updateFieldValue(`${fieldId}_bairro`, cepData.bairro || '');
                                            updateFieldValue(`${fieldId}_endereco`, cepData.logradouro || '');
                                          }
                                        }
                                      }
                                    }}
                                  className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                  style={{ 
                                    ...fieldStyle, 
                                    ...(fontStyle||{}), 
                                    ['--active-bc' as any]: cfg.borderColorActive, 
                                    ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                  }}
                                />
                                  <Input
                                    type="text"
                                    placeholder="Estado"
                                    value={fieldValues[`${fieldId}_estado`] || ''}
                                    onChange={(e) => updateFieldValue(`${fieldId}_estado`, e.target.value)}
                                    className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                    style={{ 
                                      ...fieldStyle, 
                                      ...(fontStyle||{}), 
                                      ['--active-bc' as any]: cfg.borderColorActive, 
                                      ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                    }}
                                  />
                                </div>
                                
                                {/* Linha 2: Cidade e Bairro */}
                                <div className="grid grid-cols-2 gap-3">
                                  <Input
                                    type="text"
                                    placeholder="Cidade"
                                    value={fieldValues[`${fieldId}_cidade`] || ''}
                                    onChange={(e) => updateFieldValue(`${fieldId}_cidade`, e.target.value)}
                                    className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                    style={{ 
                                      ...fieldStyle, 
                                      ...(fontStyle||{}), 
                                      ['--active-bc' as any]: cfg.borderColorActive, 
                                      ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                    }}
                                  />
                                  <Input
                                    type="text"
                                    placeholder="Bairro"
                                    value={fieldValues[`${fieldId}_bairro`] || ''}
                                    onChange={(e) => updateFieldValue(`${fieldId}_bairro`, e.target.value)}
                                    className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                    style={{ 
                                      ...fieldStyle, 
                                      ...(fontStyle||{}), 
                                      ['--active-bc' as any]: cfg.borderColorActive, 
                                      ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                    }}
                                  />
                                </div>
                                
                                {/* Linha 3: Endereço */}
                                  <Input
                                    type="text"
                                  placeholder="Endereço"
                                  value={fieldValues[`${fieldId}_endereco`] || ''}
                                  onChange={(e) => updateFieldValue(`${fieldId}_endereco`, e.target.value)}
                                    className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                    style={{ 
                                      ...fieldStyle, 
                                      ...(fontStyle||{}), 
                                      ['--active-bc' as any]: cfg.borderColorActive, 
                                      ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                    }}
                                  />
                                
                                {/* Linha 4: Número e Complemento - 3 colunas (1 para número, 2 para complemento) */}
                                <div className="grid grid-cols-3 gap-3">
                                <Input
                                  type="text"
                                    placeholder="Número"
                                    value={fieldValues[`${fieldId}_numero`] || ''}
                                    onChange={(e) => updateFieldValue(`${fieldId}_numero`, e.target.value)}
                                  className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                  style={{ 
                                    ...fieldStyle, 
                                    ...(fontStyle||{}), 
                                    ['--active-bc' as any]: cfg.borderColorActive, 
                                    ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                  }}
                                />
                                  <div className="col-span-2">
                                <Input
                                  type="text"
                                  placeholder="Complemento"
                                  value={fieldValues[`${fieldId}_complemento`] || ''}
                                  onChange={(e) => updateFieldValue(`${fieldId}_complemento`, e.target.value)}
                                  className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                  style={{ 
                                    ...fieldStyle, 
                                    ...(fontStyle||{}), 
                                    ['--active-bc' as any]: cfg.borderColorActive, 
                                    ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                  }}
                                />
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {field.type === 'document' && (
                              <Input
                                type="text"
                                placeholder={field.placeholder ? (field.placeholder_text || field.name) : (placeholderTexts?.[fieldId] || field.name)}
                                value={currentValue}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/\D/g, '');
                                  if (field.document_cpf) {
                                    // Máscara CPF: 000.000.000-00
                                    if (value.length <= 11) {
                                      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                                    }
                                  } else if (field.document_cnpj) {
                                    // Máscara CNPJ: 00.000.000/0000-00
                                    if (value.length <= 14) {
                                      value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                                    }
                                  }
                                  updateFieldValue(fieldId, value);
                                }}
                                maxLength={field.document_cpf ? 14 : field.document_cnpj ? 18 : undefined}
                                className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                style={{ 
                                  ...fieldStyle, 
                                  ...(fontStyle||{}), 
                                  ['--active-bc' as any]: cfg.borderColorActive, 
                                  ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                }}
                              />
                            )}
                            
                            {field.type === 'connection' && (
                              <div className="space-y-2">
                                <Select value={currentValue} onValueChange={(value) => updateFieldValue(fieldId, value)}>
                                  <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: cfg.borderColorActive, ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px` }}>
                                    <SelectValue placeholder={field.placeholder ? (field.placeholder_text || field.name) : (placeholderTexts?.[fieldId] || field.name)} />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#2A2A2A] border-white/20 text-white" style={{ ...(fontStyle||{}), ['--selBg' as any]: cfg.selectBgColor, ['--selFg' as any]: cfg.selectTextColor, fontSize: `${cfg.fontSizeInputPx}px` }}>
                                    <div className="p-2 border-b border-white/20">
                                      <Input
                                        placeholder="Pesquisar..."
                                        value={fieldValues[`${fieldId}_search`] || ''}
                                        onChange={(e) => updateFieldValue(`${fieldId}_search`, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-[#2A2A2A] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
                                        style={{
                                          ...fieldStyle,
                                          height: '32px',
                                          fontSize: '14px'
                                        }}
                                      />
                                    </div>
                                    {field.connection_list === 'leads' && leads.filter(lead => 
                                      !fieldValues[`${fieldId}_search`] || 
                                      (lead.name || lead.email || '').toLowerCase().includes(fieldValues[`${fieldId}_search`].toLowerCase())
                                    ).map((lead) => (
                                      <SelectItem key={lead.id} value={lead.id} className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>
                                        {lead.name || lead.email}
                                      </SelectItem>
                                    ))}
                                    {field.connection_list === 'users' && users.filter(user => 
                                      !fieldValues[`${fieldId}_search`] || 
                                      (user.name || user.email || '').toLowerCase().includes(fieldValues[`${fieldId}_search`].toLowerCase())
                                    ).map((user) => (
                                      <SelectItem key={user.id} value={user.id} className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>
                                        {user.name || user.email}
                                      </SelectItem>
                                    ))}
                                    {field.connection_list === 'meetings' && meetings.filter(meeting => 
                                      !fieldValues[`${fieldId}_search`] || 
                                      (meeting.title || meeting.subject || '').toLowerCase().includes(fieldValues[`${fieldId}_search`].toLowerCase())
                                    ).map((meeting) => (
                                      <SelectItem key={meeting.id} value={meeting.id} className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>
                                        {meeting.title || meeting.subject}
                                      </SelectItem>
                                    ))}
                                    {field.connection_list === 'motivos-perda' && lossReasons.filter(reason => 
                                      !fieldValues[`${fieldId}_search`] || 
                                      (reason.name || '').toLowerCase().includes(fieldValues[`${fieldId}_search`].toLowerCase())
                                    ).map((reason) => (
                                      <SelectItem key={reason.id} value={reason.id} className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>
                                        {reason.name}
                                      </SelectItem>
                                    ))}
                                    {field.connection_list === 'origens' && origins.filter(origin => 
                                      !fieldValues[`${fieldId}_search`] || 
                                      (origin.name || '').toLowerCase().includes(fieldValues[`${fieldId}_search`].toLowerCase())
                                    ).map((origin) => (
                                      <SelectItem key={origin.id} value={origin.id} className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${cfg.fontSizeInputPx}px` }}>
                                        {origin.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                
                                {field.connection_addition && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                      // Lógica para adicionar novo item
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar {field.connection_list === 'leads' ? 'Lead' : field.connection_list === 'users' ? 'Usuário' : 'Reunião'}
                                  </Button>
                                )}
                              </div>
                            )}
                            
                            {field.type === 'date' && (
                              <Input
                                type="date"
                                placeholder={field.placeholder ? (field.placeholder_text || field.name) : (placeholderTexts?.[fieldId] || field.name)}
                                value={currentValue}
                                onChange={(e) => updateFieldValue(fieldId, e.target.value)}
                                className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                style={{ 
                                  ...fieldStyle, 
                                  ...(fontStyle||{}), 
                                  ['--active-bc' as any]: cfg.borderColorActive, 
                                  ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                }}
                              />
                            )}
                            
                            {field.type === 'checkbox' && (
                              <div className="space-y-2">
                                
                                {/* Processar opções do campo checkbox */}
                                {(() => {
                                  const processCheckboxOptions = (optionsText: string) => {
                                    if (!optionsText?.trim()) return [];
                                    
                                    // Dividir por vírgula ou quebra de linha
                                    const options = optionsText
                                      .split(/[,\n]/)
                                      .map(option => option.trim())
                                      .filter(option => option.length > 0);
                                    
                                    return options;
                                  };

                                  const checkboxOptions = processCheckboxOptions(field.checkbox_options || field.options || '');

                                  if (checkboxOptions.length > 0) {
                                    // Renderizar opções com checkboxes
                                    const columns = field.checkbox_columns || 1;
                                    
                                    // Função para lidar com seleção
                                    const handleOptionSelect = (index: number) => {
                                      const currentSelections = currentValue ? JSON.parse(currentValue) : [];
                                      
                                      if (field.checkbox_multiselect) {
                                        // Multiseleção: adicionar/remover da lista
                                        if (currentSelections.includes(index)) {
                                          const newSelections = currentSelections.filter((i: number) => i !== index);
                                          updateFieldValue(fieldId, JSON.stringify(newSelections));
                                        } else {
                                          // Verificar limite
                                          if (field.checkbox_limit > 0 && currentSelections.length >= field.checkbox_limit) {
                                            return; // Não permitir seleção se limite atingido
                                          }
                                          const newSelections = [...currentSelections, index];
                                          updateFieldValue(fieldId, JSON.stringify(newSelections));
                                        }
                                      } else {
                                        // Seleção única: substituir seleção anterior
                                        updateFieldValue(fieldId, JSON.stringify([index]));
                                      }
                                    };

                                    const currentSelections = currentValue ? JSON.parse(currentValue) : [];

                                    if (field.checkbox_button_mode) {
                                      // Renderizar como botões
                                      return (
                                        <div 
                                          className="grid gap-2"
                                          style={{
                                            gridTemplateColumns: `repeat(${columns}, 1fr)`
                                          }}
                                        >
                                          {checkboxOptions.map((option, index) => {
                                            const isSelected = currentSelections.includes(index);
                                            const canSelect = !field.checkbox_multiselect || 
                                              field.checkbox_limit === 0 || 
                                              currentSelections.length < field.checkbox_limit ||
                                              isSelected;
                                            
                                            return (
                                              <button
                                                key={index}
                                                type="button"
                                                onClick={() => handleOptionSelect(index)}
                                                className="px-4 py-2 text-sm font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                                                disabled={!canSelect}
                                                style={{
                                                  ...(fontStyle||{}),
                                                  fontSize: `${cfg.fontSizeInputPx}px`,
                                                  // Cores baseadas no estado
                                                  backgroundColor: isSelected
                                                    ? cfg.selectBgColor
                                                    : canSelect
                                                      ? cfg.fieldBgColor
                                                      : '#f3f4f6',
                                                  borderColor: isSelected
                                                    ? cfg.borderColorActive
                                                    : canSelect
                                                      ? (cfg.borderColor || '#d1d5db')
                                                      : '#d1d5db',
                                                  color: isSelected
                                                    ? (cfg.selectFgColor || '#3f3f3f')
                                                    : canSelect
                                                      ? cfg.fieldTextColor
                                                      : '#9ca3af',
                                                  cursor: canSelect ? 'pointer' : 'not-allowed',
                                                  // Hover styles (só aplica se não estiver selecionado)
                                                  '--hover-bg': isSelected ? cfg.selectBgColor : cfg.fieldBgColor,
                                                  '--hover-border': isSelected ? cfg.borderColorActive : cfg.borderColorActive,
                                                  '--hover-color': isSelected ? (cfg.selectFgColor || '#3f3f3f') : cfg.fieldTextColor,
                                                  // Active styles
                                                  '--active-bg': cfg.selectBgColor,
                                                  '--active-border': cfg.borderColorActive,
                                                  '--active-color': cfg.selectFgColor || '#3f3f3f'
                                                } as React.CSSProperties & {
                                                  '--hover-bg': string;
                                                  '--hover-border': string;
                                                  '--hover-color': string;
                                                  '--active-bg': string;
                                                  '--active-border': string;
                                                  '--active-color': string;
                                                }}
                                                onMouseEnter={(e) => {
                                                  if (canSelect) {
                                                    if (isSelected) {
                                                      // Se já está selecionado, mantém as cores de seleção
                                                      e.currentTarget.style.backgroundColor = cfg.selectBgColor;
                                                      e.currentTarget.style.borderColor = cfg.borderColorActive;
                                                      e.currentTarget.style.color = cfg.selectFgColor || '#3f3f3f';
                                                    } else {
                                                      // Se não está selecionado, aplica hover
                                                      e.currentTarget.style.backgroundColor = cfg.fieldBgColor;
                                                      e.currentTarget.style.borderColor = cfg.borderColorActive;
                                                      e.currentTarget.style.color = cfg.fieldTextColor;
                                                    }
                                                  }
                                                }}
                                                onMouseLeave={(e) => {
                                                  if (canSelect) {
                                                    // Sempre volta às cores baseadas no estado de seleção
                                                    e.currentTarget.style.backgroundColor = isSelected 
                                                      ? cfg.selectBgColor 
                                                      : cfg.fieldBgColor;
                                                    e.currentTarget.style.borderColor = isSelected 
                                                      ? cfg.borderColorActive 
                                                      : (cfg.borderColor || '#d1d5db');
                                                    e.currentTarget.style.color = isSelected 
                                                      ? (cfg.selectFgColor || '#3f3f3f')
                                                      : cfg.fieldTextColor;
                                                  }
                                                }}
                                                onMouseDown={(e) => {
                                                  if (canSelect) {
                                                    e.currentTarget.style.backgroundColor = cfg.selectBgColor;
                                                    e.currentTarget.style.borderColor = cfg.borderColorActive;
                                                    e.currentTarget.style.color = cfg.selectFgColor || '#3f3f3f';
                                                  }
                                                }}
                                                onMouseUp={(e) => {
                                                  if (canSelect) {
                                                    // Após o clique, verificar se foi selecionado ou não
                                                    const newSelections = isSelected 
                                                      ? (field.checkbox_multiselect 
                                                          ? currentSelections.filter((i: number) => i !== index)
                                                          : [])
                                                      : (field.checkbox_multiselect 
                                                          ? [...currentSelections, index]
                                                          : [index]);
                                                    
                                                    const willBeSelected = newSelections.includes(index);
                                                    
                                                    e.currentTarget.style.backgroundColor = willBeSelected 
                                                      ? cfg.selectBgColor 
                                                      : cfg.fieldBgColor;
                                                    e.currentTarget.style.borderColor = willBeSelected 
                                                      ? cfg.borderColorActive 
                                                      : (cfg.borderColor || '#d1d5db');
                                                    e.currentTarget.style.color = willBeSelected 
                                                      ? (cfg.selectFgColor || '#3f3f3f')
                                                      : cfg.fieldTextColor;
                                                  }
                                                }}
                                              >
                                                {option}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      );
                                    } else {
                                      // Renderizar como checkboxes
                                      return (
                                        <div 
                                          className="grid gap-2"
                                          style={{
                                            gridTemplateColumns: `repeat(${columns}, 1fr)`
                                          }}
                                        >
                                          {checkboxOptions.map((option, index) => {
                                            const isSelected = currentSelections.includes(index);
                                            const canSelect = !field.checkbox_multiselect || 
                                              field.checkbox_limit === 0 || 
                                              currentSelections.length < field.checkbox_limit ||
                                              isSelected;
                                            
                                            return (
                                              <div key={index} className="flex items-center space-x-2">
                                                <Checkbox 
                                                  id={`${fieldId}-checkbox-${index}`}
                                                  checked={isSelected}
                                                  onCheckedChange={() => handleOptionSelect(index)}
                                                  className="data-[state=checked]:bg-[var(--brand-primary,#E50F5E)] data-[state=checked]:border-[var(--brand-primary,#E50F5E)]"
                                                  disabled={!canSelect}
                                                />
                                                <Label 
                                                  htmlFor={`${fieldId}-checkbox-${index}`}
                                                  className="text-sm"
                                                  style={{
                                                    ...(fontStyle||{}),
                                                    color: canSelect ? cfg.fieldTextColor : 'gray',
                                                    cursor: canSelect ? 'pointer' : 'not-allowed'
                                                  }}
                                                >
                                                  {option}
                                                </Label>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    }
                                  } else {
                                    // Renderizar checkbox simples quando não há opções
                                    return (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${fieldId}-checkbox`}
                                  checked={currentValue}
                                  onCheckedChange={(checked) => updateFieldValue(fieldId, checked)}
                                          className="data-[state=checked]:bg-[var(--brand-primary,#E50F5E)] data-[state=checked]:border-[var(--brand-primary,#E50F5E)]"
                                        />
                                        <Label 
                                          htmlFor={`${fieldId}-checkbox`} 
                                          className="text-sm"
                                          style={{ ...(fontStyle||{}), color: cfg.fieldTextColor }}
                                        >
                                  {field.name}
                                </Label>
                                      </div>
                                    );
                                  }
                                })()}
                                
                                {/* Mostrar limite se aplicável */}
                                {field.checkbox_multiselect && field.checkbox_limit > 0 && (() => {
                                  const currentSelections = currentValue ? JSON.parse(currentValue) : [];
                                  return (
                                    <p className="text-xs text-gray-500" style={{ ...(fontStyle||{}), color: cfg.fieldTextColor }}>
                                      Limite: {field.checkbox_limit} opção(ões) selecionada(s) - {currentSelections.length} selecionada(s)
                                    </p>
                                  );
                                })()}
                              </div>
                            )}
                            
                            {field.type === 'radio' && field.options && (
                              <div className="space-y-2">
                                {field.options.split(',').map((option, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id={`${fieldId}-${index}`}
                                      name={fieldId}
                                      value={option.trim()}
                                      checked={currentValue === option.trim()}
                                      onChange={(e) => updateFieldValue(fieldId, e.target.value)}
                                      className="text-[var(--brand-primary,#E50F5E)] focus:ring-[var(--brand-primary,#E50F5E)]"
                                    />
                                    <Label htmlFor={`${fieldId}-${index}`} className="text-sm">
                                      {option.trim()}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {field.type === 'url' && (
                              <div className="space-y-1">
                                <Input
                                  type="text"
                                  placeholder={field.placeholder ? (field.placeholder_text || field.name) : (placeholderTexts?.[fieldId] || field.name)}
                                  value={currentValue}
                                  onChange={(e) => {
                                    const formattedValue = validateAndFormatURL(e.target.value);
                                    updateFieldValue(fieldId, formattedValue);
                                  }}
                                  className={`h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border ${currentValue && !validateURL(currentValue) ? 'border-red-500 focus:border-red-500' : ''}`}
                                  style={{ 
                                    ...fieldStyle, 
                                    ...(fontStyle||{}), 
                                    ['--active-bc' as any]: cfg.borderColorActive, 
                                    ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                  }}
                                />
                                {currentValue && !validateURL(currentValue) && (
                                  <p className="text-xs text-red-500">Por favor, insira uma URL válida</p>
                                )}
                              </div>
                            )}
                            
                            {/* Fallback para tipos não reconhecidos */}
                            {!['text', 'email', 'phone', 'select', 'textarea', 'money', 'number', 'date', 'checkbox', 'radio', 'name', 'connection', 'datetime', 'document', 'address', 'time', 'slider', 'url'].includes(field.type) && (
                              <Input
                                placeholder={field.placeholder ? (field.placeholder_text || field.name) : (placeholderTexts?.[fieldId] || field.name)}
                                value={currentValue}
                                onChange={(e) => updateFieldValue(fieldId, e.target.value)}
                                className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
                                style={{ 
                                  ...fieldStyle, 
                                  ...(fontStyle||{}), 
                                  ['--active-bc' as any]: cfg.borderColorActive, 
                                  ['--focus-bw' as any]: `${cfg.borderWidthFocusPx}px`,
                                }}
                                maxLength={field.max_length || undefined}
                              />
                            )}
                          </div>
                        );
                        })}

                      {/* Botão Enviar - sempre presente */}
                      <Button 
                        type="button" 
                        className="w-full h-12 text-base font-semibold transition-all duration-300 shadow-lg" 
                        style={buttonStyle}
                        onMouseDown={(e)=>{ (e.currentTarget.style as any).backgroundImage = activeButtonBg; (e.currentTarget.style as any).color = cfg.btnTextActive; (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidthActive}px`; (e.currentTarget.style as any).borderColor = cfg.btnBorderColorActive; }}
                        onMouseUp={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = cfg.btnText; (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidth}px`; (e.currentTarget.style as any).borderColor = cfg.btnBorderColor; }}
                        onMouseLeave={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = cfg.btnText; (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidth}px`; (e.currentTarget.style as any).borderColor = cfg.btnBorderColor; }}
                      >
                        Enviar
                      </Button>

                      {/* Mensagem de segurança - sempre presente */}
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Seus dados estão 100% protegidos
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Prévia padrão (Resultados/Vendas) mantida */}
              <Input
                placeholder="Nome e sobrenome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-base bg-[#2A2A2A] border-white/20 text-white placeholder:text-gray-400 focus:ring-white/20 landing-page-input focus:border-[var(--brand-primary,#E50F5E)]"
                style={{ ...(fontStyle||{}) }}
              />
              <Input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base bg-[#2A2A2A] border-white/20 text-white placeholder:text-gray-400 focus:ring-white/20 landing-page-input focus:border-[var(--brand-primary,#E50F5E)]"
                style={{ ...(fontStyle||{}) }}
              />
              <LandingPhoneInput
                value={phone}
                onChange={setPhone}
                placeholder="Telefone (WhatsApp)"
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
              />
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger className={`${!range ? 'text-[#9BA3AF]' : 'text-white'} h-12 text-base bg-[#2A2A2A] border-white/20 landing-page-input focus:border-[var(--brand-primary,#E50F5E)] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0`} style={{ ...(fontStyle||{}) }}>
                  <SelectValue placeholder="Quanto poderia investir mensalmente hoje?" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-white/20 text-white" style={{ ...(fontStyle||{}) }}>
                  <SelectItem value="1" className="text-base" style={{ ...(fontStyle||{}) }}>Entre R$ 400 e R$ 1.000,00</SelectItem>
                  <SelectItem value="2" className="text-base" style={{ ...(fontStyle||{}) }}>De R$ 1.000,00 a 2.500,00</SelectItem>
                  <SelectItem value="3" className="text-base" style={{ ...(fontStyle||{}) }}>De R$ 2.500,00 a R$ 5.000,00</SelectItem>
                  <SelectItem value="4" className="text-base" style={{ ...(fontStyle||{}) }}>Acima de R$ 5.000,00</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" className="w-full h-12 text-base font-semibold bg-gradient-to-r from-[var(--brand-primary,#E50F5E)] to-[#7c032e] hover:opacity-90 transition-all duration-300 shadow-lg text-white" style={{ ...(fontStyle||{}) }}>
                Enviar
              </Button>
                </>
              )}
            </div>
        </div>
      </div>

      {/* Modal do Formulário Base */}
      <Dialog open={showBaseFormModal} onOpenChange={setShowBaseFormModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1F1F1F] border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">
              Adicionar Novo Lead
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Aqui será renderizado o formulário base */}
            <div className="text-center text-muted-foreground">
              <p>Formulário base será carregado aqui</p>
              <p className="text-sm mt-2">Esta funcionalidade será implementada em breve</p>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={closeBaseFormModal}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  // Aqui será implementada a lógica de salvar o lead
                  toast({
                    title: 'Sucesso',
                    description: 'Lead adicionado com sucesso!'
                  });
                  closeBaseFormModal();
                }}
                className="bg-[var(--brand-primary,#E50F5E)] hover:opacity-90 text-white"
              >
                Salvar Lead
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SettingsForms() {
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();
  const [tab, setTab] = useState<'leads' | 'agendamentos' | 'resultados' | 'vendas'>('leads');
  
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Formulários</h1>
        <p className="text-muted-foreground">Configure e visualize formulários da plataforma.</p>
      </div>

      <Card className="shadow-xl border-0 bg-card">
        <CardContent className="p-0">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList className="flex items-end border-b border-border/30 bg-transparent p-0 rounded-none justify-start w-fit">
              <TabsTrigger value="leads" className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5">
                Leads
              </TabsTrigger>
              <div className="w-px h-6 bg-border/30 self-center"></div>
              <TabsTrigger value="agendamentos" className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5">
                Agendamentos
              </TabsTrigger>
              <div className="w-px h-6 bg-border/30 self-center"></div>
              <TabsTrigger value="resultados" className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5">
                Resultados
              </TabsTrigger>
              <div className="w-px h-6 bg-border/30 self-center"></div>
              <TabsTrigger value="vendas" className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5">
                Vendas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leads" className="p-6">
              <div className="text-center text-muted-foreground">
                <p>Configuração de Leads</p>
              </div>
            </TabsContent>

            <TabsContent value="agendamentos" className="p-6">
              <div className="text-center text-muted-foreground">
                <p>Configuração de Agendamentos</p>
              </div>
            </TabsContent>

            <TabsContent value="resultados" className="p-6">
              <div className="text-center text-muted-foreground">
                <p>Configuração de Resultados</p>
              </div>
            </TabsContent>

            <TabsContent value="vendas" className="p-6">
              <div className="text-center text-muted-foreground">
                <p>Configuração de Vendas</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
