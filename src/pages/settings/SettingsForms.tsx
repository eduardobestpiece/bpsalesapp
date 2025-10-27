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
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { LeadFormsManager } from '@/components/Managers/LeadFormsManager';
import { loadFormRedirectConfig, saveFormRedirectConfig, RedirectConfig } from '@/utils/redirectManager';
import { IntegrationsManager } from '@/components/Integrations/IntegrationsManager';
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
  // Disqualify props
  disqualifyEnabled: Set<string>;
  setDisqualifyEnabled: React.Dispatch<React.SetStateAction<Set<string>>>;
  disqualifyMin: Record<string, number | null>;
  setDisqualifyMin: React.Dispatch<React.SetStateAction<Record<string, number | null>>>;
  disqualifyMax: Record<string, number | null>;
  setDisqualifyMax: React.Dispatch<React.SetStateAction<Record<string, number | null>>>;
  disqualifyOption: Record<string, string | null>;
  setDisqualifyOption: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  // Estados para divisões
  divisionButtonTexts: Record<string, string>;
  setDivisionButtonTexts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
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

// Input isolado para URL de redirecionamento
const RedirectUrlInput = ({ 
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
      id={fieldId}
      type="url"
      defaultValue={initialValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="https://exemplo.com/obrigado"
      className="bg-[#2A2A2A] border-white/10 focus:border-[var(--brand-primary,#E50F5E)]"
    />
  );
};

// Editor de texto do botão (desacoplado, padrão do exemplo)
const ButtonTextEditor = ({ 
  initialValue, 
  onCommit 
}: { 
  initialValue: string; 
  onCommit: (value: string) => void; 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(initialValue);

  useEffect(() => {
    if (initialValue !== localValue) {
      setLocalValue(initialValue);
      if (inputRef.current) inputRef.current.value = initialValue;
    }
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    onCommit(localValue);
  };

  return (
    <Input
      ref={inputRef}
      defaultValue={initialValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="Ex: Enviar, Cadastrar, Continuar..."
      className="mt-2 h-12 bg-[#1F1F1F] border-white/20 text-white placeholder:text-gray-400"
    />
  );
};

// Editor numérico desacoplado (permite digitar continuamente e só comita no blur)
const NumberEditor = ({
  initialValue,
  onCommit,
  placeholder
}: {
  initialValue: number | null | undefined;
  onCommit: (value: number | null) => void;
  placeholder?: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(
    initialValue === null || initialValue === undefined ? '' : String(initialValue)
  );

  useEffect(() => {
    const next = initialValue === null || initialValue === undefined ? '' : String(initialValue);
    if (next !== localValue) {
      setLocalValue(next);
      if (inputRef.current) inputRef.current.value = next;
    }
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    const trimmed = String(localValue).trim();
    if (trimmed === '') return onCommit(null);
    const num = Number(trimmed);
    onCommit(Number.isNaN(num) ? null : num);
  };

  return (
    <Input
      ref={inputRef}
      type="number"
      defaultValue={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className="mt-1 bg-[#2A2A2A] border-white/20 text-white placeholder:text-gray-400"
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
  onUpdatePlaceholderText,
  disqualifyEnabled,
  setDisqualifyEnabled,
  disqualifyMin,
  setDisqualifyMin,
  disqualifyMax,
  setDisqualifyMax,
  disqualifyOption,
  setDisqualifyOption,
  divisionButtonTexts,
  setDivisionButtonTexts
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
        <div className="col-span-4">
          {fieldId.startsWith('division_') ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="font-medium">Divisão {fieldId.split('_')[1]}</span>
            </div>
          ) : (
            field?.name
          )}
        </div>
        <div className="col-span-4">
          {fieldId.startsWith('division_') ? (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              Divisão
            </span>
          ) : (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {field?.type}
            </span>
          )}
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
            {fieldId.startsWith('division_') ? (
              <div className="space-y-4">
                {/* Campo para texto do botão de próxima */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white">Texto do botão de próxima</Label>
                  <ButtonTextEditor
                    initialValue={divisionButtonTexts[fieldId] || 'Próxima'}
                    onCommit={(value) => {
                      // Salvar o texto do botão de próxima para esta divisão
                      setDivisionButtonTexts(prev => ({ ...prev, [fieldId]: value }));
                    }}
                  />
                </div>
              </div>
            ) : (
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
            )}
            
            {/* Toggle Placeholder - apenas para campos que podem ter placeholder e não são divisões */}
            {!fieldId.startsWith('division_') && canHavePlaceholder(field?.type || '') && (
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

            {/* Desqualificar - tipos: Número, Monetário, Seleção, Checkbox */}
            {['numero', 'número', 'number', 'monetario', 'monetário', 'money', 'selecao', 'seleção', 'select', 'checkbox'].includes((field?.type || '').toLowerCase()) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-white">Desqualificar</Label>
                  <Switch
                    checked={disqualifyEnabled.has(fieldId)}
                    onCheckedChange={(checked) => {
                      setDisqualifyEnabled(prev => {
                        const next = new Set(prev);
                        if (checked) next.add(fieldId); else next.delete(fieldId);
                        return next;
                      });
                    }}
                  />
                </div>

                {/* Número / Monetário: mínimo e máximo */}
                {disqualifyEnabled.has(fieldId) && ['numero', 'número', 'number', 'monetario', 'monetário', 'money'].includes((field?.type || '').toLowerCase()) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-white">Valor mínimo</Label>
                      <NumberEditor
                        initialValue={disqualifyMin[fieldId]}
                        onCommit={(val) => setDisqualifyMin(prev => ({ ...prev, [fieldId]: val }))}
                        placeholder="Mínimo"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-white">Valor máximo</Label>
                      <NumberEditor
                        initialValue={disqualifyMax[fieldId]}
                        onCommit={(val) => setDisqualifyMax(prev => ({ ...prev, [fieldId]: val }))}
                        placeholder="Máximo"
                      />
                    </div>
                  </div>
                )}

                {/* Seleção / Checkbox: selecionar opção */}
                {disqualifyEnabled.has(fieldId) && ['selecao', 'seleção', 'select', 'checkbox'].includes((field?.type || '').toLowerCase()) && (
                  <div>
                    <Label className="text-sm font-medium text-white">Selecione a resposta</Label>
                    <Select
                      value={disqualifyOption[fieldId] ?? ''}
                      onValueChange={(value) => setDisqualifyOption(prev => ({ ...prev, [fieldId]: value }))}
                    >
                      <SelectTrigger className="mt-1 h-10 bg-[#1F1F1F] border-white/20 text-white">
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-white/20 text-white">
                        {(field?.options || '').split(',').map((opt: string, idx: number) => (
                          <SelectItem key={idx} value={opt.trim()}>
                            {opt.trim()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Texto do placeholder - apenas para campos que não são divisões */}
            {!fieldId.startsWith('division_') && (
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
            )}
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
  // Desqualificar (por campo)
  const [disqualifyEnabled, setDisqualifyEnabled] = useState<Set<string>>(new Set());
  const [disqualifyMin, setDisqualifyMin] = useState<Record<string, number | null>>({});
  const [disqualifyMax, setDisqualifyMax] = useState<Record<string, number | null>>({});
  const [disqualifyOption, setDisqualifyOption] = useState<Record<string, string | null>>({});
  
  // Estados para divisões
  const [divisions, setDivisions] = useState<Array<{id: string, name: string, step: number}>>([]);
  const [divisionCounter, setDivisionCounter] = useState(1);
  const [divisionButtonTexts, setDivisionButtonTexts] = useState<Record<string, string>>({});
  
  // Estados para menu de cópia de estilo
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [showStyleCopyDialog, setShowStyleCopyDialog] = useState(false);
  const [selectedFormsToCopy, setSelectedFormsToCopy] = useState<string[]>([]);
  
  // Estados para iframe
  const [showIframeDialog, setShowIframeDialog] = useState(false);
  const [iframeCode, setIframeCode] = useState('');
  
  // Estados para HTML
  const [showHtmlDialog, setShowHtmlDialog] = useState(false);
  const [htmlCode, setHtmlCode] = useState('');
  
  // Estados para formulário base e origem padrão
  const [isBaseForm, setIsBaseForm] = useState(false);
  const [defaultOrigin, setDefaultOrigin] = useState<string>('');
  const [buttonText, setButtonText] = useState<string>('Enviar');
  const [buttonTextInput, setButtonTextInput] = useState<string>('Enviar');
  const [origins, setOrigins] = useState<any[]>([]);
  const [isButtonRowExpanded, setIsButtonRowExpanded] = useState<boolean>(false);
  
  

  
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
        .select('is_base_form, default_origin_id, button_text')
        .eq('id', selectedLeadForm.id)
        .single();

      if (error) throw error;
      
      setIsBaseForm(data?.is_base_form || false);
      setDefaultOrigin(data?.default_origin_id || '');
      const text = data?.button_text || 'Enviar';
      setButtonText(text);
      setButtonTextInput(text);
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
      console.error('❌ Erro ao salvar origem padrão:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao salvar origem padrão',
        variant: 'destructive'
      });
    }
  };

  // Salvar texto do botão
  const saveButtonText = async (text: string) => {
    if (!selectedLeadForm?.id) return;
    
    try {
      const { error } = await (supabase as any)
        .from('lead_forms')
        .update({ button_text: text })
        .eq('id', selectedLeadForm.id);

      if (error) throw error;
      
      setButtonText(text);
      setButtonTextInput(text);
      toast({
        title: 'Sucesso',
        description: 'Texto do botão salvo com sucesso!'
      });
    } catch (error: any) {
      console.error('❌ Erro ao salvar texto do botão:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao salvar texto do botão',
        variant: 'destructive'
      });
    }
  };

  // Salvar texto do botão quando clicar em "Salvar Campos"
  const saveButtonTextOnSave = async () => {
    if (!selectedLeadForm?.id) return;
    
    try {
      const { error } = await (supabase as any)
        .from('lead_forms')
        .update({ button_text: buttonTextInput })
        .eq('id', selectedLeadForm.id);

      if (error) throw error;
      
      setButtonText(buttonTextInput);
    } catch (error: any) {
      console.error('❌ Erro ao salvar texto do botão ao salvar campos:', error);
    }
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
        const fieldIds = formFields.map((f: any) => f.field_id);
        setSelectedFields(fieldIds);

        // Carregar divisões
        const divisionFields = formFields.filter((f: any) => f.is_division);
        const divisionsData = divisionFields.map((f: any) => ({
          id: f.field_id,
          name: f.field_name,
          step: f.division_step || 1
        }));
        setDivisions(divisionsData);
        
        // Carregar textos dos botões de próxima
        const buttonTextsData: Record<string, string> = {};
        divisionFields.forEach((f: any) => {
          if (f.division_button_text) {
            buttonTextsData[f.field_id] = f.division_button_text;
          }
        });
        setDivisionButtonTexts(buttonTextsData);
        
        // Atualizar contador de divisões
        const maxStep = Math.max(...divisionFields.map((f: any) => f.division_step || 1), 0);
        setDivisionCounter(maxStep + 1);

        // Carregar campos obrigatórios
        const requiredIds = formFields.filter((f: any) => f.is_required).map((f: any) => f.field_id);
        setRequiredFields(new Set(requiredIds));

        // Carregar campos com placeholder habilitado
        const placeholderIds = formFields.filter((f: any) => f.placeholder_enabled).map((f: any) => f.field_id);
        setPlaceholderFields(new Set(placeholderIds));

        // Carregar textos de placeholder
        const placeholderTextsData: Record<string, string> = {};
        const dqEnabled = new Set<string>();
        const dqMin: Record<string, number | null> = {};
        const dqMax: Record<string, number | null> = {};
        const dqOpt: Record<string, string | null> = {};
        formFields.forEach((field: any) => {
          if (field.placeholder_text) {
            placeholderTextsData[field.field_id] = field.placeholder_text;
          }
          if (field.disqualify_enabled) dqEnabled.add(field.field_id);
          dqMin[field.field_id] = field.disqualify_min ?? null;
          dqMax[field.field_id] = field.disqualify_max ?? null;
          dqOpt[field.field_id] = field.disqualify_selected_option ?? null;
        });
        setPlaceholderTexts(placeholderTextsData);
        setDisqualifyEnabled(dqEnabled);
        setDisqualifyMin(dqMin);
        setDisqualifyMax(dqMax);
        setDisqualifyOption(dqOpt);
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

  // Função para adicionar divisão
  const addDivision = () => {
    const newDivision = {
      id: `division_${divisionCounter}`,
      name: `Divisão ${divisionCounter}`,
      step: divisionCounter
    };
    setDivisions([...divisions, newDivision]);
    setSelectedFields([...selectedFields, newDivision.id]);
    setDivisionCounter(divisionCounter + 1);
  };

  // Função para gerar código iframe
  const generateIframeCode = () => {
    if (!selectedLeadForm?.id) {
      toast({
        title: 'Erro',
        description: 'Nenhum formulário selecionado',
        variant: 'destructive'
      });
      return;
    }

    const baseUrl = window.location.origin;
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const formUrl = `${baseUrl}/form/${selectedLeadForm.id}?v=${timestamp}&r=${randomId}`;
    
    // Aplicar estilos do iframe baseados na configuração
    const padding = leadFormStyle?.iframePaddingPx || 20;
    const backgroundColor = leadFormStyle?.iframeBackgroundColor || '#FFFFFF';
    const shadowEnabled = leadFormStyle?.iframeShadowEnabled !== false;
    const shadowStyle = shadowEnabled ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none';
    
    const iframeHtml = `<iframe 
  src="${formUrl}" 
  width="100%" 
      height="auto" 
  frameborder="0" 
      style="border: none; border-radius: 8px; box-shadow: ${shadowStyle}; background-color: transparent; padding: ${padding}px; min-height: 300px;"
      title="Formulário de Contato"
      id="form-iframe">
    </iframe>
    
    <script>
    // ===== SISTEMA ROBUSTO DE CAPTURA DE UTMs DA PÁGINA PAI =====
    (function() {
      'use strict';
      
      
      // Função para obter parâmetros da URL da página pai
      function getParentUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const params = {};
        for (const [key, value] of urlParams.entries()) {
          params[key] = value;
        }
        return params;
      }
      
      // Função para obter cookies da página pai
      function getParentCookie(name) {
        const value = \`; \${document.cookie}\`;
        const parts = value.split(\`; \${name}=\`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return '';
      }
      
      // Função para capturar dados de tracking da página pai
      function captureParentTrackingData() {
        const urlParams = getParentUrlParams();
        
        const trackingData = {
          parentUrl: window.location.href,
          parentUrlParams: urlParams,
          utmSource: urlParams.utm_source || '',
          utmMedium: urlParams.utm_medium || '',
          utmCampaign: urlParams.utm_campaign || '',
          utmContent: urlParams.utm_content || '',
          utmTerm: urlParams.utm_term || '',
          gclid: urlParams.gclid || '',
          fbclid: urlParams.fbclid || '',
          fbc: getParentCookie('_fbc') || '',
          fbp: getParentCookie('_fbp') || '',
          fbid: getParentCookie('_fbid') || '',
          referrer: document.referrer || '',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        };
        
        
        return trackingData;
      }
      
      // Função para enviar dados de tracking para o iframe
      function sendTrackingDataToIframe() {
        const trackingData = captureParentTrackingData();
        const iframe = document.getElementById('form-iframe');
        
        if (iframe && iframe.contentWindow) {
          try {
            // Enviar dados de tracking para o iframe
            iframe.contentWindow.postMessage({
              type: 'PARENT_TRACKING_DATA',
              data: trackingData
            }, '*');
            
          } catch (error) {
            // Erro silencioso
          }
        } else {
          // Iframe não encontrado
        }
      }
      
      // Função para responder a solicitações do iframe
      function handleIframeRequests(event) {
        if (event.data && typeof event.data === 'object') {
          
          if (event.data.type === 'REQUEST_PARENT_URL') {
            // Responder com a URL da página pai
            event.source.postMessage({
              type: 'PARENT_URL_RESPONSE',
              url: window.location.href
            }, '*');
          } else if (event.data.type === 'REQUEST_COOKIE') {
            // Responder com o valor do cookie solicitado
            const cookieValue = getParentCookie(event.data.cookieName);
            event.source.postMessage({
              type: 'PARENT_COOKIE_RESPONSE',
              cookieName: event.data.cookieName,
              cookieValue: cookieValue
            }, '*');
          } else if (event.data.type === 'REQUEST_TRACKING_DATA') {
            // Responder com todos os dados de tracking
            const trackingData = captureParentTrackingData();
            event.source.postMessage({
              type: 'PARENT_TRACKING_RESPONSE',
              data: trackingData
            }, '*');
          }
        }
      }
      
      // Inicializar sistema de tracking
      function initTracking() {
        
        // Escutar solicitações do iframe
        window.addEventListener('message', handleIframeRequests);
        
        // Enviar dados imediatamente quando o iframe carregar
        const iframe = document.getElementById('form-iframe');
        if (iframe) {
          iframe.onload = function() {
            setTimeout(sendTrackingDataToIframe, 100);
            setTimeout(sendTrackingDataToIframe, 500);
            setTimeout(sendTrackingDataToIframe, 1000);
          };
          
          // Se o iframe já estiver carregado
          if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
            setTimeout(sendTrackingDataToIframe, 100);
          }
        }
        
        // Enviar dados periodicamente (para garantir que o iframe receba)
        setInterval(sendTrackingDataToIframe, 2000);
        
        // Enviar dados quando a página ganha foco (caso o usuário volte para a aba)
        window.addEventListener('focus', () => {
          setTimeout(sendTrackingDataToIframe, 100);
        });
        
        // Enviar dados quando a URL mudar (SPA)
        let currentUrl = window.location.href;
        const urlObserver = new MutationObserver(() => {
          if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            setTimeout(sendTrackingDataToIframe, 100);
          }
        });
        
        urlObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
        
      }
      
      // Inicializar quando o DOM estiver pronto
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTracking);
      } else {
        initTracking();
      }
    })();
    
    // ===== SISTEMA DE REDIMENSIONAMENTO DO IFRAME =====
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
              // Tentativa de redimensionamento via postMessage
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
                // Ignorar elementos de dropdown
                if (node.hasAttribute('data-radix-select-content') || 
                    node.hasAttribute('data-radix-dropdown-menu-content') ||
                    node.classList?.contains('select-content') ||
                    node.classList?.contains('phone-dropdown-content')) {
                  return; // Não redimensionar para dropdowns
                }
                
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
    }
  }
}

// Iniciar observação após carregamento
setTimeout(observeIframeContent, 500);
</script>`;

    setIframeCode(iframeHtml);
    setShowIframeDialog(true);
  };

  // Função para gerar código HTML completo
  const generateHtmlCode = () => {
    if (!selectedLeadForm?.id) {
      toast({
        title: 'Erro',
        description: 'Nenhum formulário selecionado',
        variant: 'destructive'
      });
      return;
    }

    console.log('🔍 [DEBUG] Gerando HTML - leadFormStyle:', leadFormStyle);
    console.log('🔍 [DEBUG] Configurações específicas:', {
      borderColorNormal: leadFormStyle?.borderColorNormal,
      borderColorActive: leadFormStyle?.borderColorActive,
      btnRadius: leadFormStyle?.btnRadius,
      borderWidthNormalPx: leadFormStyle?.borderWidthNormalPx,
      borderWidthFocusPx: leadFormStyle?.borderWidthFocusPx
    });

    const baseUrl = window.location.origin;
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const formUrl = `${baseUrl}/form/${selectedLeadForm.id}?v=${timestamp}&r=${randomId}`;

    // Gerar estilos CSS baseados na configuração do formulário
    const generateStyles = () => {
      const styles = `
        <style>
          /* Reset e estilos base */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: ${leadFormStyle?.previewFont || leadFormStyle?.fontFamily || 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'};
            background-color: transparent;
            color: ${leadFormStyle?.fieldTextColor || '#333333'};
            line-height: 1.6;
            margin: 0;
            padding: 0;
          }
          
          .bp-form-container {
            max-width: 600px;
            margin: 0 auto;
            padding: ${leadFormStyle?.iframePaddingPx || 20}px;
            background: transparent;
            border-radius: ${leadFormStyle?.btnRadius || 8}px; /* Usar raio da borda do botão */
            box-shadow: ${leadFormStyle?.iframeShadowEnabled ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none'};
            border: none;
          }
          
          .bp-form-title {
            font-size: ${leadFormStyle?.fontSizeLabelPx || 24}px;
            font-weight: bold;
            color: ${leadFormStyle?.fieldTextColor || '#333333'};
            margin-bottom: ${leadFormStyle?.spacingFieldsPx || 20}px;
            text-align: left;
          }
          
          .bp-form-description {
            font-size: ${leadFormStyle?.fontSizeInputPx || 16}px;
            color: ${leadFormStyle?.fieldTextColor || '#666666'};
            margin-bottom: ${leadFormStyle?.spacingFieldsPx || 30}px;
            text-align: left;
          }
          
          .bp-form-field {
            margin-bottom: ${leadFormStyle?.spacingFieldsPx || leadFormStyle?.fieldSpacingPx || 20}px;
          }
          
          .bp-form-label {
            display: block;
            font-size: ${leadFormStyle?.fontSizeLabelPx || 14}px;
            font-weight: medium;
            color: ${leadFormStyle?.fieldTextColor || '#333333'};
            margin-bottom: 8px;
          }
          
          .bp-form-input,
          .bp-form-select,
          .bp-form-textarea {
            width: 100%;
            height: 48px; /* Altura fixa para todos os campos */
            padding: 12px;
            font-size: ${leadFormStyle?.fontSizeInputPx || 16}px;
            border: ${leadFormStyle?.borderWidthNormalPx || 1}px solid ${leadFormStyle?.borderColorNormal || '#d1d5db'};
            border-radius: ${leadFormStyle?.btnRadius || 6}px; /* Usar raio da borda do botão */
            background-color: ${leadFormStyle?.fieldBgColor || 'rgba(255, 255, 255, 0.9)'};
            color: ${leadFormStyle?.fieldTextColor || '#333333'};
            transition: border-color 0.2s ease;
          }
          
          /* Ajuste especial para textarea */
          .bp-form-textarea {
            height: auto;
            min-height: 48px;
            resize: vertical;
          }
          
          .bp-form-input:focus,
          .bp-form-select:focus,
          .bp-form-textarea:focus {
            outline: none;
            border-color: ${leadFormStyle?.borderColorActive || '#3b82f6'};
            border-width: ${leadFormStyle?.borderWidthFocusPx || 2}px;
          }
          
          .bp-form-button {
            width: 100%;
            padding: 12px;
            font-size: ${leadFormStyle?.fontSizeButtonPx || 16}px;
            font-weight: medium;
            color: ${leadFormStyle?.btnText || '#ffffff'};
            background: linear-gradient(${leadFormStyle?.btnAngle || 180}deg, ${leadFormStyle?.btnBg1 || '#3b82f6'}, ${leadFormStyle?.btnBg2 || '#2563eb'});
            border: ${leadFormStyle?.btnBorderWidth || 0}px solid ${leadFormStyle?.btnBorderColor || 'transparent'};
            border-radius: ${leadFormStyle?.btnRadius || 6}px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: none;
            margin-top: ${leadFormStyle?.buttonSpacingPx || 16}px;
          }
          
          .bp-form-button:hover {
            background: linear-gradient(${leadFormStyle?.btnAngleActive || 90}deg, ${leadFormStyle?.btnBgActive1 || '#2563eb'}, ${leadFormStyle?.btnBgActive2 || '#1d4ed8'});
            color: ${leadFormStyle?.btnTextActive || '#ffffff'};
            border-color: ${leadFormStyle?.btnBorderColorActive || 'transparent'};
            border-width: ${leadFormStyle?.btnBorderWidthActive || 0}px;
            transform: translateY(-1px);
          }
          
          .bp-form-button:active {
            transform: translateY(0);
          }
          
          .bp-form-error {
            color: #ef4444;
            font-size: 14px;
            margin-top: 4px;
          }
          
          .bp-form-success {
            color: #10b981;
            font-size: 14px;
            margin-top: 4px;
          }
          
          /* Estilos para campo de seleção avançado */
          .bp-select-container {
            position: relative;
            width: 100%;
          }
          
          .bp-select-trigger {
            width: 100%;
            height: 48px;
            padding: 12px;
            font-size: ${leadFormStyle?.fontSizeInputPx || 16}px;
            border: ${leadFormStyle?.borderWidthNormalPx || 1}px solid ${leadFormStyle?.borderColorNormal || '#d1d5db'};
            border-radius: ${leadFormStyle?.btnRadius || 6}px;
            background-color: ${leadFormStyle?.fieldBgColor || 'rgba(255, 255, 255, 0.9)'};
            color: ${leadFormStyle?.fieldTextColor || '#333333'};
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: border-color 0.2s ease;
          }
          
          .bp-select-trigger:hover {
            border-color: ${leadFormStyle?.borderColorActive || '#3b82f6'};
          }
          
          .bp-select-trigger.active {
            border-color: ${leadFormStyle?.borderColorActive || '#3b82f6'};
            border-width: ${leadFormStyle?.borderWidthFocusPx || 2}px;
          }
          
          .bp-select-value {
            flex: 1;
            text-align: left;
          }
          
          .bp-select-arrow {
            font-size: 12px;
            transition: transform 0.2s ease;
          }
          
          .bp-select-trigger.active .bp-select-arrow {
            transform: rotate(180deg);
          }
          
          .bp-select-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: ${leadFormStyle?.fieldBgColor || 'rgba(255, 255, 255, 0.95)'};
            border: ${leadFormStyle?.borderWidthNormalPx || 1}px solid ${leadFormStyle?.borderColorNormal || '#d1d5db'};
            border-radius: ${leadFormStyle?.btnRadius || 6}px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-height: 200px;
            overflow-y: auto;
          }
          
          .bp-select-search {
            padding: 8px;
            border-bottom: 1px solid ${leadFormStyle?.borderColorNormal || '#e5e5e5'};
          }
          
          .bp-select-search-input {
            width: 100%;
            padding: 8px;
            font-size: ${leadFormStyle?.fontSizeInputPx || 16}px;
            border: ${leadFormStyle?.borderWidthNormalPx || 1}px solid ${leadFormStyle?.borderColorNormal || '#d1d5db'};
            border-radius: ${leadFormStyle?.btnRadius || 6}px;
            background-color: ${leadFormStyle?.fieldBgColor || 'rgba(255, 255, 255, 0.9)'};
            color: ${leadFormStyle?.fieldTextColor || '#333333'};
            outline: none;
            transition: border-color 0.2s ease;
          }
          
          .bp-select-search-input:focus {
            border-color: ${leadFormStyle?.borderColorActive || '#3b82f6'};
            border-width: ${leadFormStyle?.borderWidthFocusPx || 2}px;
          }
          
          .bp-select-options {
            max-height: 150px;
            overflow-y: auto;
          }
          
          .bp-select-option {
            padding: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: ${leadFormStyle?.fontSizeInputPx || 16}px;
            color: ${leadFormStyle?.fieldTextColor || '#333333'};
            transition: background-color 0.2s ease;
          }
          
          .bp-select-option:hover {
            background-color: ${leadFormStyle?.selectBgColor || '#f3f4f6'};
            color: ${leadFormStyle?.selectTextColor || '#333333'};
          }
          
          .bp-select-option.selected {
            background-color: ${leadFormStyle?.selectBgColor || '#3b82f6'};
            color: ${leadFormStyle?.selectTextColor || '#ffffff'};
          }
          
          .bp-select-checkbox {
            width: 16px;
            height: 16px;
            margin: 0;
            cursor: pointer;
          }
          
          .bp-select-option-text {
            flex: 1;
          }
          
          /* Estilos para checkbox e radio */
          .checkbox-group,
          .radio-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .checkbox-item,
          .radio-item {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            font-size: ${leadFormStyle?.fontSizeInputPx || 16}px;
            color: ${leadFormStyle?.fieldTextColor || '#333333'};
          }
          
          .checkbox-item input[type="checkbox"],
          .radio-item input[type="radio"] {
            width: auto;
            margin: 0;
            cursor: pointer;
          }
          
          /* Estilos para divisões */
          .division-field {
            margin: 30px 0;
          }
          
          .division-separator {
            position: relative;
            text-align: center;
          }
          
          .division-separator hr {
            border: none;
            border-top: 1px solid ${leadFormStyle?.borderColorNormal || '#e5e5e5'};
            margin: 20px 0;
          }
          
          .division-label {
            background: transparent;
            padding: 0 15px;
            color: ${leadFormStyle?.fieldTextColor || '#666666'};
            font-size: ${leadFormStyle?.fontSizeInputPx || 16}px;
            position: relative;
            top: -12px;
          }
          
          /* Responsividade */
          @media (max-width: 768px) {
            .bp-form-container {
              margin: 10px;
              padding: 15px;
              background: transparent;
            }
            
            .bp-form-title {
              font-size: 20px;
            }
            
            .bp-form-input,
            .bp-form-select,
            .bp-form-textarea {
              font-size: 16px; /* Evita zoom no iOS */
              background-color: ${leadFormStyle?.fieldBgColor || 'rgba(255, 255, 255, 0.9)'};
            }
            
            .checkbox-group,
            .radio-group {
              gap: 6px;
            }
          }
        </style>
      `;
      return styles;
    };

    // Função auxiliar para processar opções
    const processOptions = (optionsString: string) => {
      if (!optionsString) return [];
      
      try {
        // Tentar fazer parse como JSON primeiro
        const parsed = JSON.parse(optionsString);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        // Se falhar, tratar como string separada por vírgulas
        console.log(`Processando opções como string separada por vírgulas: ${optionsString}`);
        return optionsString.split(',').map(opt => opt.trim()).filter(opt => opt);
      }
    };

    // Gerar campos do formulário
    const generateFormFields = () => {
      if (!selectedFields || selectedFields.length === 0) {
        console.log('Nenhum campo selecionado para gerar HTML');
        return '';
      }
      
      console.log('Gerando campos HTML:', selectedFields);
      console.log('Campos disponíveis:', availableFields);
      
      return selectedFields.map((fieldId, index) => {
        try {
          const field = availableFields.find(f => f.id === fieldId);
          if (!field) {
            console.warn(`Campo não encontrado: ${fieldId}`);
            return '';
          }
          
          console.log(`Gerando campo ${index}:`, field);
          
          const fieldIdAttr = `field_${index}`;
          const isRequired = requiredFields.has(fieldId) || ['email', 'telefone'].includes(fieldId);
          const placeholderText = placeholderFields.has(fieldId) ? placeholderTexts[fieldId] || '' : '';
          
                  switch (field.type) {
                    case 'text':
                    case 'email':
                    case 'tel':
                    case 'phone':
                    case 'number':
                    case 'money':
                    case 'name':
                      const inputType = field.type === 'phone' ? 'tel' : 
                                      field.type === 'money' ? 'text' : 
                                      field.type === 'name' ? 'text' : 
                                      field.type;
                      return `
                        <div class="bp-form-field">
                          <label for="${fieldIdAttr}" class="bp-form-label">
                            ${field.name}${isRequired ? ' *' : ''}
                          </label>
                          <input 
                            type="${inputType}" 
                            id="${fieldIdAttr}" 
                            name="${fieldId}" 
                            class="bp-form-input"
                            ${isRequired ? 'required' : ''}
                            ${placeholderText ? `placeholder="${placeholderText}"` : ''}
                            ${field.max_length ? `maxlength="${field.max_length}"` : ''}
                            ${field.type === 'money' ? 'data-type="money"' : ''}
                          />
                          <div class="bp-form-error" id="${fieldIdAttr}_error"></div>
                        </div>
                      `;
                      
                    case 'select':
                      const options = processOptions(field.options || '');
                      const isSearchable = field.searchable || false;
                      const isMultiselect = field.multiselect || false;
                      const searchPlaceholder = field.search_placeholder || 'Pesquisar opções...';
                      const selectPlaceholder = field.placeholder_text || field.name || 'Selecione uma opção';
                      
                      return `
                        <div class="bp-form-field">
                          <label for="${fieldIdAttr}" class="bp-form-label">
                            ${field.name}${isRequired ? ' *' : ''}
                          </label>
                          <div class="bp-select-container" data-field-id="${fieldId}" data-searchable="${isSearchable}" data-multiselect="${isMultiselect}">
                            <div class="bp-select-trigger" id="${fieldIdAttr}" ${isRequired ? 'data-required="true"' : ''}>
                              <span class="bp-select-value">${selectPlaceholder}</span>
                              <span class="bp-select-arrow">▼</span>
                            </div>
                            <div class="bp-select-dropdown" style="display: none;">
                              ${isSearchable ? `
                                <div class="bp-select-search">
                                  <input type="text" placeholder="${searchPlaceholder}" class="bp-select-search-input" />
                                </div>
                              ` : ''}
                              <div class="bp-select-options">
                                ${options.map((option: any, index: number) => {
                                  const optionValue = option.value || option;
                                  const optionLabel = option.label || option;
                                  return `
                                    <div class="bp-select-option" data-value="${optionValue}" data-index="${index}">
                                      ${isMultiselect ? '<input type="checkbox" class="bp-select-checkbox" />' : ''}
                                      <span class="bp-select-option-text">${optionLabel}</span>
                                    </div>
                                  `;
                                }).join('')}
                              </div>
                            </div>
                          </div>
                          <div class="bp-form-error" id="${fieldIdAttr}_error"></div>
                        </div>
                      `;
                      
                    case 'textarea':
                      return `
                        <div class="bp-form-field">
                          <label for="${fieldIdAttr}" class="bp-form-label">
                            ${field.name}${isRequired ? ' *' : ''}
                          </label>
                          <textarea 
                            id="${fieldIdAttr}" 
                            name="${fieldId}" 
                            class="bp-form-textarea"
                            rows="4"
                            ${isRequired ? 'required' : ''}
                            ${placeholderText ? `placeholder="${placeholderText}"` : ''}
                            ${field.max_length ? `maxlength="${field.max_length}"` : ''}
                          ></textarea>
                          <div class="bp-form-error" id="${fieldIdAttr}_error"></div>
                        </div>
                      `;
                      
                    case 'checkbox':
                      const checkboxOptions = processOptions(field.checkbox_options || '');
                      return `
                        <div class="bp-form-field">
                          <label class="bp-form-label">
                            ${field.name}${isRequired ? ' *' : ''}
                          </label>
                          <div class="checkbox-group">
                            ${checkboxOptions.map((option: any, optIndex: number) => 
                              `<label class="checkbox-item">
                                <input type="checkbox" name="${fieldId}[]" value="${option.value || option}" />
                                <span>${option.label || option}</span>
                              </label>`
                            ).join('')}
                          </div>
                          <div class="bp-form-error" id="${fieldIdAttr}_error"></div>
                        </div>
                      `;
                      
                    case 'radio':
                      const radioOptions = processOptions(field.options || '');
                      return `
                        <div class="bp-form-field">
                          <label class="bp-form-label">
                            ${field.name}${isRequired ? ' *' : ''}
                          </label>
                          <div class="radio-group">
                            ${radioOptions.map((option: any, optIndex: number) => 
                              `<label class="radio-item">
                                <input type="radio" name="${fieldId}" value="${option.value || option}" ${optIndex === 0 ? 'required' : ''} />
                                <span>${option.label || option}</span>
                              </label>`
                            ).join('')}
                          </div>
                          <div class="bp-form-error" id="${fieldIdAttr}_error"></div>
                        </div>
                      `;
                      
                    case 'division':
                      return `
                        <div class="bp-form-field division-field">
                          <div class="division-separator">
                            <hr />
                            <span class="division-label">${field.name}</span>
                          </div>
                        </div>
                      `;
                      
                    default:
                      return '';
                  }
                } catch (error) {
                  console.error(`Erro ao gerar campo ${fieldId}:`, error);
                  return '';
                }
              }).join('');
    };

    // Gerar JavaScript para funcionalidades
    const generateJavaScript = () => {
      return `
        <script>
          // Função para capturar UTMs da URL atual
          function captureUTMs() {
            const urlParams = new URLSearchParams(window.location.search);
            return {
              utm_source: urlParams.get('utm_source') || '',
              utm_medium: urlParams.get('utm_medium') || '',
              utm_campaign: urlParams.get('utm_campaign') || '',
              utm_content: urlParams.get('utm_content') || '',
              utm_term: urlParams.get('utm_term') || '',
              gclid: urlParams.get('gclid') || '',
              fbclid: urlParams.get('fbclid') || ''
            };
          }
          
          // Função para capturar cookies
          function captureCookies() {
            const cookies = {};
            document.cookie.split(';').forEach(cookie => {
              const [name, value] = cookie.trim().split('=');
              if (name && value) {
                cookies[name] = value;
              }
            });
            return cookies;
          }
          
          // Função para validar formulário
          function validateForm() {
            const form = document.getElementById('bp-form');
            const fields = form.querySelectorAll('[required]');
            let isValid = true;
            
            fields.forEach(field => {
              const errorElement = document.getElementById(field.id + '_error');
              let hasValue = false;
              
              if (field.type === 'checkbox' || field.type === 'radio') {
                // Para checkbox e radio, verificar se pelo menos um está selecionado
                const name = field.name;
                const sameNameFields = form.querySelectorAll(\`[name="\${name}"]\`);
                hasValue = Array.from(sameNameFields).some(f => f.checked);
              } else {
                // Para outros campos, verificar se tem valor
                hasValue = field.value.trim() !== '';
              }
              
              if (!hasValue) {
                errorElement.textContent = 'Este campo é obrigatório';
                isValid = false;
              } else {
                errorElement.textContent = '';
              }
            });
            
            return isValid;
          }
          
          // Função para enviar formulário
          async function submitForm(event) {
            event.preventDefault();
            
            if (!validateForm()) {
              return;
            }
            
            const form = document.getElementById('bp-form');
            const formData = new FormData(form);
            const utms = captureUTMs();
            const cookies = captureCookies();
            
            // Adicionar UTMs aos dados do formulário
            Object.keys(utms).forEach(key => {
              if (utms[key]) {
                formData.append(key, utms[key]);
              }
            });
            
            // Adicionar cookies aos dados do formulário
            Object.keys(cookies).forEach(key => {
              if (cookies[key]) {
                formData.append('cookie_' + key, cookies[key]);
              }
            });
            
            try {
              const response = await fetch('${formUrl}', {
                method: 'POST',
                body: formData
              });
              
              if (response.ok) {
                // Sucesso
                const successElement = document.getElementById('form-success');
                successElement.style.display = 'block';
                form.style.display = 'none';
              } else {
                throw new Error('Erro ao enviar formulário');
              }
            } catch (error) {
              console.error('Erro:', error);
              alert('Erro ao enviar formulário. Tente novamente.');
            }
          }
          
          // Função para controlar campos de seleção avançados
          function initializeSelectFields() {
            const selectContainers = document.querySelectorAll('.bp-select-container');
            
            selectContainers.forEach(container => {
              const trigger = container.querySelector('.bp-select-trigger');
              const dropdown = container.querySelector('.bp-select-dropdown');
              const options = container.querySelectorAll('.bp-select-option');
              const searchInput = container.querySelector('.bp-select-search-input');
              const isSearchable = container.dataset.searchable === 'true';
              const isMultiselect = container.dataset.multiselect === 'true';
              const fieldId = container.dataset.fieldId;
              
              let selectedValues = [];
              let selectedOptions = [];
              
              // Função para atualizar o valor exibido
              function updateDisplayValue() {
                const valueSpan = trigger.querySelector('.bp-select-value');
                if (selectedOptions.length === 0) {
                  valueSpan.textContent = trigger.dataset.placeholder || 'Selecione uma opção';
                } else if (isMultiselect) {
                  valueSpan.textContent = selectedOptions.length === 1 
                    ? selectedOptions[0].textContent 
                    : \`\${selectedOptions.length} opções selecionadas\`;
                } else {
                  valueSpan.textContent = selectedOptions[0].textContent;
                }
              }
              
              // Função para filtrar opções
              function filterOptions(searchTerm) {
                options.forEach(option => {
                  const text = option.querySelector('.bp-select-option-text').textContent.toLowerCase();
                  const matches = !searchTerm || text.includes(searchTerm.toLowerCase());
                  option.style.display = matches ? 'flex' : 'none';
                });
              }
              
              // Função para selecionar opção
              function selectOption(option) {
                const value = option.dataset.value;
                const text = option.querySelector('.bp-select-option-text').textContent;
                
                if (isMultiselect) {
                  const checkbox = option.querySelector('.bp-select-checkbox');
                  if (selectedValues.includes(value)) {
                    // Desmarcar
                    selectedValues = selectedValues.filter(v => v !== value);
                    selectedOptions = selectedOptions.filter(o => o.value !== value);
                    checkbox.checked = false;
                    option.classList.remove('selected');
                  } else {
                    // Marcar
                    selectedValues.push(value);
                    selectedOptions.push({ value, textContent: text });
                    checkbox.checked = true;
                    option.classList.add('selected');
                  }
                } else {
                  // Seleção única
                  selectedValues = [value];
                  selectedOptions = [{ value, textContent: text }];
                  
                  // Remover seleção anterior
                  options.forEach(opt => {
                    opt.classList.remove('selected');
                    const cb = opt.querySelector('.bp-select-checkbox');
                    if (cb) cb.checked = false;
                  });
                  
                  // Marcar atual
                  option.classList.add('selected');
                  const cb = option.querySelector('.bp-select-checkbox');
                  if (cb) cb.checked = true;
                  
                  // Fechar dropdown
                  dropdown.style.display = 'none';
                  trigger.classList.remove('active');
                }
                
                updateDisplayValue();
              }
              
              // Event listeners
              trigger.addEventListener('click', function(e) {
                e.stopPropagation();
                const isOpen = dropdown.style.display === 'block';
                
                if (isOpen) {
                  dropdown.style.display = 'none';
                  trigger.classList.remove('active');
                } else {
                  dropdown.style.display = 'block';
                  trigger.classList.add('active');
                  
                  // Focar no campo de pesquisa se existir
                  if (searchInput) {
                    setTimeout(() => searchInput.focus(), 100);
                  }
                }
              });
              
              // Pesquisa
              if (searchInput) {
                searchInput.addEventListener('input', function(e) {
                  filterOptions(e.target.value);
                });
              }
              
              // Seleção de opções
              options.forEach(option => {
                option.addEventListener('click', function(e) {
                  e.stopPropagation();
                  selectOption(option);
                });
              });
              
              // Fechar ao clicar fora
              document.addEventListener('click', function(e) {
                if (!container.contains(e.target)) {
                  dropdown.style.display = 'none';
                  trigger.classList.remove('active');
                }
              });
              
              // Adicionar campo hidden para envio do formulário
              const hiddenInput = document.createElement('input');
              hiddenInput.type = 'hidden';
              hiddenInput.name = fieldId;
              hiddenInput.id = fieldId + '_hidden';
              container.appendChild(hiddenInput);
              
              // Atualizar campo hidden quando valores mudarem
              const originalUpdateDisplayValue = updateDisplayValue;
              updateDisplayValue = function() {
                originalUpdateDisplayValue();
                hiddenInput.value = isMultiselect ? JSON.stringify(selectedValues) : selectedValues[0] || '';
              };
            });
          }
          
          // Inicializar quando a página carregar
          document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('bp-form');
            if (form) {
              form.addEventListener('submit', submitForm);
            }
            
            // Inicializar campos de seleção avançados
            initializeSelectFields();
          });
        </script>
      `;
    };

    // Gerar HTML completo
    const completeHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${selectedLeadForm.name || 'Formulário de Contato'}</title>
    ${generateStyles()}
</head>
<body>
    <div class="bp-form-container">
        ${selectedLeadForm.title ? `<h1 class="bp-form-title">${selectedLeadForm.title}</h1>` : ''}
        ${selectedLeadForm.description ? `<p class="bp-form-description">${selectedLeadForm.description}</p>` : ''}
        
        <form id="bp-form" method="POST" action="${formUrl}">
            ${generateFormFields()}
            
            <button type="submit" class="bp-form-button">
                ${buttonText || 'Enviar'}
            </button>
        </form>
        
        <div id="form-success" class="bp-form-success" style="display: none;">
            <h3>Formulário enviado com sucesso!</h3>
            <p>Obrigado pelo seu contato. Entraremos em contato em breve.</p>
        </div>
    </div>
    
    ${generateJavaScript()}
</body>
</html>`;

    setHtmlCode(completeHtml);
    setShowHtmlDialog(true);
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
      // Salvar texto do botão primeiro
      await saveButtonTextOnSave();
      // Primeiro, remover todos os campos existentes para este formulário
      const { error: deleteError } = await supabase
        .from('lead_form_fields' as any)
        .delete()
        .eq('lead_form_id', selectedLeadForm.id);

      if (deleteError) throw deleteError;

      // Inserir os novos campos selecionados
      const fieldsToInsert = (selectedFields || []).map((fieldId, index) => {
        const field = availableFields.find(f => f.id === fieldId);
        const isDivision = fieldId.startsWith('division_');
        
        return {
          lead_form_id: selectedLeadForm.id,
          company_id: selectedCompanyId,
          field_id: fieldId,
          field_name: isDivision ? `Divisão ${fieldId.split('_')[1]}` : (field?.name || fieldId),
          field_type: isDivision ? 'division' : (field?.type || 'text'),
          field_order: index,
          is_required: requiredFields.has(fieldId) || ['email', 'telefone'].includes(fieldId), // Campos marcados como obrigatórios ou email/telefone
          placeholder_text: placeholderTexts[fieldId] || null, // Texto do placeholder personalizado
          placeholder_enabled: placeholderFields.has(fieldId), // Estado do toggle placeholder
          disqualify_enabled: disqualifyEnabled.has(fieldId),
          disqualify_min: disqualifyMin[fieldId] ?? null,
          disqualify_max: disqualifyMax[fieldId] ?? null,
          disqualify_selected_option: disqualifyOption[fieldId] ?? null,
          is_division: isDivision,
          division_step: isDivision ? parseInt(fieldId.split('_')[1]) : null,
          division_button_text: isDivision ? (divisionButtonTexts[fieldId] || 'Próxima') : null
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
      // Carregar estilo do formulário
      const { data: styleData, error: styleError } = await supabase
        .from('lead_form_styles' as any)
        .select('style_config')
        .eq('lead_form_id', formId)
        .eq('status', 'active')
        .single();

      if (styleError && styleError.code !== 'PGRST116') throw styleError;
      
      // Carregar configurações de redirecionamento específicas do formulário
      const redirectConfig = await loadFormRedirectConfig(formId, selectedCompanyId);
      
      if (styleData) {
        // Combinar estilo com configurações de redirecionamento
        const combinedStyle = {
          ...(styleData as any).style_config,
          redirectEnabled: redirectConfig.redirectEnabled,
          redirectUrl: redirectConfig.redirectUrl
        };
        setLeadFormStyle(combinedStyle);
        setFormSpecificStyle(combinedStyle);
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
          buttonBorderColorPressed: "#FFFFFF00",
          // Novos campos para configuração do iframe
          iframePaddingPx: 20,
          iframeBackgroundColor: "#FFFFFF",
          iframeShadowEnabled: true,
          // Configurações de redirecionamento
          redirectEnabled: redirectConfig.redirectEnabled,
          redirectUrl: redirectConfig.redirectUrl
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
        setFormSpecificStyle(defaultStyle);
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
    // Configurações de redirecionamento
    redirectEnabled: boolean;
    redirectUrl: string;
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
    // Configurações de redirecionamento
    redirectEnabled: false,
    redirectUrl: '',
  });
  const [leadsStyle, setLeadsStyle] = useState<StyleCfg>(defaultStyle());
  const [formSpecificStyle, setFormSpecificStyle] = useState<StyleCfg>(defaultStyle());
  const [resultsStyle, setResultsStyle] = useState<StyleCfg>(defaultStyle());
  const [salesStyle, setSalesStyle] = useState<StyleCfg>(defaultStyle());
  const [agStyle, setAgStyle] = useState<StyleCfg>(defaultStyle());
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
    if (typeof s.redirectEnabled === 'boolean') setAgStyle(prev => ({ ...prev, redirectEnabled: s.redirectEnabled }));
    if (typeof s.redirectUrl === 'string') setAgStyle(prev => ({ ...prev, redirectUrl: s.redirectUrl }));
  };

  const saveFormStyle = async (formType: FormType) => {
    if (!selectedCompanyId) {
      toast({ title: 'Selecione uma empresa para salvar', variant: 'destructive' });
      return;
    }
    
    if (!selectedLeadForm?.id) {
      toast({ title: 'Selecione um formulário para salvar', variant: 'destructive' });
      return;
    }
    
    const currentStyle = formType === 'agendamentos' ? getAgStyleFromState() : (formType === 'leads' ? formSpecificStyle : formType === 'resultados' ? resultsStyle : salesStyle);
    
    try {
      console.debug('[SettingsForms] Salvando estilo', { formType, currentStyle });
      console.debug('[SettingsForms] Dados do formulário:', { 
        selectedLeadFormId: selectedLeadForm.id, 
        selectedCompanyId 
      });
      
      // Salvar estilo do formulário (sem redirecionamento)
      const stylePayload = {
        lead_form_id: selectedLeadForm.id,
      company_id: selectedCompanyId,
        style_config: currentStyle,
        status: 'active',
        updated_at: new Date().toISOString()
      };
      
      console.debug('[SettingsForms] Payload do estilo:', stylePayload);
      
      const { error: styleError } = await supabase
        .from('lead_form_styles' as any)
        .upsert(stylePayload, {
          onConflict: 'lead_form_id'
        });
        
      if (styleError) {
        console.error('[SettingsForms] Erro ao salvar estilo', styleError);
        throw styleError;
      }
      
      // Salvar configurações de redirecionamento separadamente
      const redirectConfig: RedirectConfig = {
        redirectEnabled: currentStyle.redirectEnabled || false,
        redirectUrl: currentStyle.redirectUrl || ''
      };
      
      console.debug('[SettingsForms] Configurações de redirecionamento:', redirectConfig);
      
      const redirectSaved = await saveFormRedirectConfig(
        selectedLeadForm.id,
        selectedCompanyId,
        redirectConfig
      );
      
      console.debug('[SettingsForms] Resultado do salvamento de redirecionamento:', redirectSaved);
      
      if (!redirectSaved) {
        console.warn('Erro ao salvar configurações de redirecionamento');
      }
      
      console.log('Configurações salvas com sucesso!');
      toast({ title: 'Estilo salvo com sucesso!' });
    } catch (e: any) {
      console.error('Erro ao salvar configurações:', e);
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
          .select('form_type, style, redirect_enabled, redirect_url')
          .eq('company_id', selectedCompanyId);
        if (error) throw error;
        (data || []).forEach((row: any) => {
          const s = row?.style || {};
          const redirectConfig = {
            redirectEnabled: row.redirect_enabled || false,
            redirectUrl: row.redirect_url || ''
          };
          
          if (row.form_type === 'agendamentos') {
            applyAgStyleToState({ ...s, ...redirectConfig });
          }
          if (row.form_type === 'leads') setLeadsStyle((prev) => ({ ...prev, ...s, ...redirectConfig }));
          if (row.form_type === 'resultados') setResultsStyle((prev) => ({ ...prev, ...s, ...redirectConfig }));
          if (row.form_type === 'vendas') setSalesStyle((prev) => ({ ...prev, ...s, ...redirectConfig }));
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
              
              {/* Novos campos para configuração do iframe */}
              {(() => {
                const [localVal, setLocalVal] = useState<string>(String(style.iframePaddingPx || 20));
                const [isComp, setIsComp] = useState<boolean>(false);
                useEffect(() => { if (!isComp) setLocalVal(String(style.iframePaddingPx || 20)); }, [style.iframePaddingPx]);
                const commit = (val: string) => setStyle(s=>({ ...s, iframePaddingPx: Number(val || 20) }));
                return (
                  <FieldRow
                    label={<>Padding da iframe (px)</>}
                    control={
                      <input type="number" min={0 as any} value={localVal}
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
              
              <FieldRow
                label={<>Cor do Fundo iframe</>}
                control={
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={style.iframeBackgroundColor || "#FFFFFF"} 
                      onChange={(e)=> setStyle(s=>({ ...s, iframeBackgroundColor: e.target.value }))} 
                      className="h-10 w-10 border border-white/20 bg-transparent" 
                    />
                    <input 
                      type="text" 
                      value={style.iframeBackgroundColor || "#FFFFFF"} 
                      onChange={(e)=> setStyle(s=>({ ...s, iframeBackgroundColor: e.target.value }))} 
                      className="h-10 w-[120px] bg-[#1F1F1F] border-white/20 text-white rounded-md border px-3" 
                      placeholder="#FFFFFF"
                    />
                  </div>
                }
              />
              
              <FieldRow
                label={<>Sombra do iframe</>}
                control={
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={style.iframeShadowEnabled !== false} 
                      onChange={(e)=> setStyle(s=>({ ...s, iframeShadowEnabled: e.target.checked }))} 
                      className="h-4 w-4 text-[var(--brand-primary,#E50F5E)] bg-[#1F1F1F] border-white/20 rounded focus:ring-[var(--brand-primary,#E50F5E)] focus:ring-2" 
                    />
                    <span className="text-sm text-white">
                      {style.iframeShadowEnabled !== false ? 'Ativada' : 'Desativada'}
                    </span>
                  </div>
                }
              />
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
                  variant="outline"
                  className="h-12 px-4 border-white/20 text-white hover:bg-white/10"
                  onClick={addDivision}
                >
                  Adicionar divisão
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
                  <></>
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
              disqualifyEnabled={disqualifyEnabled}
              setDisqualifyEnabled={setDisqualifyEnabled}
              disqualifyMin={disqualifyMin}
              setDisqualifyMin={setDisqualifyMin}
              disqualifyMax={disqualifyMax}
              setDisqualifyMax={setDisqualifyMax}
              disqualifyOption={disqualifyOption}
              setDisqualifyOption={setDisqualifyOption}
              divisionButtonTexts={divisionButtonTexts}
              setDivisionButtonTexts={setDivisionButtonTexts}
            />
          );
        })}
                    </SortableContext>
                  </DndContext>
                )}

                {/* Linha fixa do Botão Enviar (não arrastável, não removível) */}
                <div className="border-t">
                  <div className="grid grid-cols-12 gap-4 p-3 text-sm hover:bg-muted/50 transition-colors">
                    <div className="col-span-1 flex items-center" />
                    <div className="col-span-1 flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsButtonRowExpanded((v) => !v)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {isButtonRowExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    <div className="col-span-4 flex items-center">Enviar</div>
                    <div className="col-span-4 flex items-center">Botão</div>
                    <div className="col-span-2 flex items-center justify-end text-right text-gray-400" />
                  </div>

                  {isButtonRowExpanded && (
                    <div className="p-3 bg-muted/10 border-t">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-12 md:col-span-6">
                          <Label className="text-white font-medium">Texto do botão</Label>
                          <ButtonTextEditor
                            initialValue={buttonTextInput}
                            onCommit={(value) => {
                              setButtonTextInput(value);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
          <TabsContent value="integracoes" className="pt-4 space-y-6">
            {/* Configurações de Redirecionamento */}
            <div className="space-y-4">
              <div className="space-y-4 p-4 bg-[#1F1F1F] rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="redirect-toggle"
                    checked={formSpecificStyle.redirectEnabled}
                    onCheckedChange={(checked) => setFormSpecificStyle(prev => ({ ...prev, redirectEnabled: checked }))}
                    className="data-[state=checked]:bg-[var(--brand-primary,#E50F5E)]"
                  />
                  <div>
                    <Label htmlFor="redirect-toggle" className="text-sm font-medium">
                      Redirecionamento
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Redirecionar usuário após envio do formulário
                    </p>
                  </div>
                </div>
                
                {formSpecificStyle.redirectEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="redirect-url" className="text-sm font-medium">
                      URL do Redirecionamento
                    </Label>
                    <RedirectUrlInput
                      fieldId="redirect-url"
                      initialValue={formSpecificStyle.redirectUrl || ''}
                      onSave={(value) => setFormSpecificStyle(prev => ({ ...prev, redirectUrl: value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      URL para onde o usuário será redirecionado após preencher o formulário
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sistema de Integrações Avançadas */}
            {selectedLeadForm?.id && (
              <div className="space-y-4">
                <div className="border-t border-white/10 pt-6">
                  <IntegrationsManager 
                    formId={selectedLeadForm.id} 
                    formType="leads" 
                  />
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button type="button" onClick={() => saveFormStyle('leads')}>
                Salvar configurações de redirecionamento
              </Button>
            </div>
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
          <TabsContent value="integracoes" className="pt-4 space-y-6">
            {/* Configurações de Redirecionamento */}
            <div className="space-y-4">
              <div className="space-y-4 p-4 bg-[#1F1F1F] rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="redirect-toggle-ag"
                    checked={agStyle.redirectEnabled}
                    onCheckedChange={(checked) => setAgStyle(prev => ({ ...prev, redirectEnabled: checked }))}
                    className="data-[state=checked]:bg-[var(--brand-primary,#E50F5E)]"
                  />
                  <div>
                    <Label htmlFor="redirect-toggle-ag" className="text-sm font-medium">
                      Redirecionamento
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Redirecionar usuário após envio do formulário
                    </p>
                  </div>
                </div>
                
                {agStyle.redirectEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="redirect-url-ag" className="text-sm font-medium">
                      URL do Redirecionamento
                    </Label>
                    <RedirectUrlInput
                      fieldId="redirect-url-ag"
                      initialValue={agStyle.redirectUrl || ''}
                      onSave={(value) => setAgStyle(prev => ({ ...prev, redirectUrl: value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      URL para onde o usuário será redirecionado após preencher o formulário
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sistema de Integrações Avançadas */}
            <div className="space-y-4">
              <div className="border-t border-white/10 pt-6">
                <IntegrationsManager 
                  formId="agendamentos-form" 
                  formType="agendamentos" 
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button type="button" onClick={() => saveFormStyle('agendamentos')}>
                Salvar configurações de redirecionamento
              </Button>
            </div>
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
          <TabsContent value="integracoes" className="pt-4 space-y-6">
            {/* Configurações de Redirecionamento */}
            <div className="space-y-4">
              <div className="space-y-4 p-4 bg-[#1F1F1F] rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="redirect-toggle-res"
                    checked={resultsStyle.redirectEnabled}
                    onCheckedChange={(checked) => setResultsStyle(prev => ({ ...prev, redirectEnabled: checked }))}
                    className="data-[state=checked]:bg-[var(--brand-primary,#E50F5E)]"
                  />
                  <div>
                    <Label htmlFor="redirect-toggle-res" className="text-sm font-medium">
                      Redirecionamento
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Redirecionar usuário após envio do formulário
                    </p>
                  </div>
                </div>
                
                {resultsStyle.redirectEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="redirect-url-res" className="text-sm font-medium">
                      URL do Redirecionamento
                    </Label>
                    <RedirectUrlInput
                      fieldId="redirect-url-res"
                      initialValue={resultsStyle.redirectUrl || ''}
                      onSave={(value) => setResultsStyle(prev => ({ ...prev, redirectUrl: value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      URL para onde o usuário será redirecionado após preencher o formulário
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sistema de Integrações Avançadas */}
            <div className="space-y-4">
              <div className="border-t border-white/10 pt-6">
                <IntegrationsManager 
                  formId="resultados-form" 
                  formType="resultados" 
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button type="button" onClick={() => saveFormStyle('resultados')}>
                Salvar configurações de redirecionamento
              </Button>
            </div>
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
          <TabsContent value="integracoes" className="pt-4 space-y-6">
            {/* Configurações de Redirecionamento */}
            <div className="space-y-4">
              <div className="space-y-4 p-4 bg-[#1F1F1F] rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="redirect-toggle-sales"
                    checked={salesStyle.redirectEnabled}
                    onCheckedChange={(checked) => setSalesStyle(prev => ({ ...prev, redirectEnabled: checked }))}
                    className="data-[state=checked]:bg-[var(--brand-primary,#E50F5E)]"
                  />
                  <div>
                    <Label htmlFor="redirect-toggle-sales" className="text-sm font-medium">
                      Redirecionamento
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Redirecionar usuário após envio do formulário
                    </p>
                  </div>
                </div>
                
                {salesStyle.redirectEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="redirect-url-sales" className="text-sm font-medium">
                      URL do Redirecionamento
                    </Label>
                    <RedirectUrlInput
                      fieldId="redirect-url-sales"
                      initialValue={salesStyle.redirectUrl || ''}
                      onSave={(value) => setSalesStyle(prev => ({ ...prev, redirectUrl: value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      URL para onde o usuário será redirecionado após preencher o formulário
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sistema de Integrações Avançadas */}
            <div className="space-y-4">
              <div className="border-t border-white/10 pt-6">
                <IntegrationsManager 
                  formId="vendas-form" 
                  formType="vendas" 
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button type="button" onClick={() => saveFormStyle('vendas')}>
                Salvar configurações de redirecionamento
              </Button>
            </div>
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
  
  // Estados para controle de etapas
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(1);
  
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

  // Calcular etapas baseadas nas divisões
  useEffect(() => {
    if (selectedFields && Array.isArray(selectedFields)) {
      const divisionIndices = selectedFields
        .map((fieldId, index) => fieldId.startsWith('division_') ? index : -1)
        .filter(index => index !== -1);
      
      setTotalSteps(divisionIndices.length + 1);
    } else {
      setTotalSteps(1);
    }
  }, [selectedFields]);

  // Função para obter campos da etapa atual
  const getFieldsForCurrentStep = () => {
    if (!selectedFields || !Array.isArray(selectedFields)) return [];
    
    const divisionIndices = selectedFields
      .map((fieldId, index) => fieldId.startsWith('division_') ? index : -1)
      .filter(index => index !== -1);
    
    if (currentStep === 1) {
      // Primeira etapa: campos até a primeira divisão
      const firstDivisionIndex = divisionIndices[0];
      return firstDivisionIndex !== undefined 
        ? selectedFields.slice(0, firstDivisionIndex)
        : selectedFields.filter(fieldId => !fieldId.startsWith('division_'));
    } else if (currentStep === totalSteps) {
      // Última etapa: campos após a última divisão
      const lastDivisionIndex = divisionIndices[divisionIndices.length - 1];
      return lastDivisionIndex !== undefined 
        ? selectedFields.slice(lastDivisionIndex + 1)
        : [];
    } else {
      // Etapas intermediárias: campos entre divisões
      const startIndex = divisionIndices[currentStep - 2] + 1;
      const endIndex = divisionIndices[currentStep - 1];
      return selectedFields.slice(startIndex, endIndex);
    }
  };

  // Função para ir para próxima etapa
  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Função para ir para etapa anterior
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Prévia do formulário</h3>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={generateIframeCode}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Gerar Iframe
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={generateHtmlCode}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Gerar HTML
          </Button>
        </div>
      </div>
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
                          <Button type="button" className="h-12 px-3 border hover:bg-[var(--selBg)] hover:text-[var(--selFg)]" variant="ghost" title="Adicionar lead" style={{ backgroundColor: fieldBgColor, color: fieldTextColor, borderColor: borderColorNormal, borderWidth: borderWidthNormalPx, borderRadius: borderRadiusPx }}>
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
                        <div className="flex-1">
                          <Select value={selectedSale} onValueChange={setSelectedSale}>
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
                        </div>
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
                        <div className="flex-1">
                          <Select value={selectedNewMeeting} onValueChange={setSelectedNewMeeting}>
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
                        </div>
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
                      {/* Indicador de progresso das etapas */}
                      {totalSteps > 1 && (
                        <div className="mb-6">
                          <div 
                            className="w-full rounded-full h-2"
                            style={{ backgroundColor: cfg.fieldBgColor }}
                          >
                            <div 
                              className="h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${(currentStep / totalSteps) * 100}%`,
                                backgroundColor: cfg.borderColorActive
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Renderizar campos personalizados dinamicamente */}
                      {getFieldsForCurrentStep().map((fieldId, index) => {
                        const field = availableFields?.find(f => f.id === fieldId);
                        if (!field) return null;

                        const currentValue = fieldValues[fieldId] || '';
                        const currentStepFields = getFieldsForCurrentStep();
                        const isLastField = index === currentStepFields.length - 1;

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
                            fontSizeInputPx={cfg.fontSizeInputPx}
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
                        onClick={() => {
                          if (currentStep < totalSteps) {
                            goToNextStep();
                          }
                        }}
                        onMouseDown={(e)=>{ (e.currentTarget.style as any).backgroundImage = activeButtonBg; (e.currentTarget.style as any).color = cfg.btnTextActive; (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidthActive}px`; (e.currentTarget.style as any).borderColor = cfg.btnBorderColorActive; }}
                        onMouseUp={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = cfg.btnText; (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidth}px`; (e.currentTarget.style as any).borderColor = cfg.btnBorderColor; }}
                        onMouseLeave={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = cfg.btnText; (e.currentTarget.style as any).borderWidth = `${cfg.btnBorderWidth}px`; (e.currentTarget.style as any).borderColor = cfg.btnBorderColor; }}
                      >
                        {currentStep === totalSteps ? buttonText : (divisionButtonTexts[`division_${currentStep}`] || 'Próxima')}
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
      </div>
    );
  };

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
              {!showLeadFormConfig ? (
                <LeadFormsManager />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {selectedLeadForm ? `Formulário: ${selectedLeadForm.name}` : 'Selecione um formulário'}
                      </h3>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowLeadFormConfig(false)}
                    >
                      ← Voltar para lista
                    </Button>
                  </div>
                  <TwoColumns 
                    left={<LeftConfig title="Leads" main="leads" leadFormStyle={leadFormStyle} onSaveLeadFormStyle={saveLeadFormStyle} selectedFields={selectedFields} setSelectedFields={setSelectedFields} />} 
                    right={<PreviewRight title="Leads" leadFormStyle={leadFormStyle} selectedFields={selectedFields} availableFields={availableFields} requiredFields={requiredFields} placeholderFields={placeholderFields} placeholderTexts={placeholderTexts} />} 
                  />
                </div>
              )}
            </TabsContent>
            <TabsContent value="agendamentos" className="p-6">
              <TwoColumns left={<LeftConfig title="Agendamentos" main="agendamentos" openSectionAg={agOpenSection} setOpenSectionAg={setAgOpenSection} />} right={<PreviewRight title="Agendamentos" agType={agTypeGlobal} setAgType={setAgTypeGlobal} />} />
            </TabsContent>
            <TabsContent value="resultados" className="p-6">
              <TwoColumns left={<LeftConfig title="Resultados" main="resultados" />} right={<PreviewRight title="Resultados" />} />
            </TabsContent>
            <TabsContent value="vendas" className="p-6">
              <TwoColumns left={<LeftConfig title="Vendas" main="vendas" />} right={<PreviewRight title="Vendas" />} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Diálogo de cópia de estilo */}
      {showStyleCopyDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1F1F1F] border border-white/20 rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Copiar Estilo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Selecione os formulários para aplicar o estilo do formulário atual:
            </p>
            
            <div className="space-y-3 mb-6">
              {/* Formulários principais */}
              {[
                { id: 'agendamentos', name: 'Agendamentos', current: tab === 'agendamentos' },
                { id: 'resultados', name: 'Resultados', current: tab === 'resultados' },
                { id: 'vendas', name: 'Vendas', current: tab === 'vendas' }
              ].filter(form => !form.current).map((form) => (
                <div key={form.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={form.id}
                    checked={selectedFormsToCopy.includes(form.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFormsToCopy(prev => [...prev, form.id]);
                      } else {
                        setSelectedFormsToCopy(prev => prev.filter(id => id !== form.id));
                      }
                    }}
                    className="data-[state=checked]:bg-[var(--brand-primary,#E50F5E)] data-[state=checked]:border-[var(--brand-primary,#E50F5E)]"
                  />
                  <Label htmlFor={form.id} className="text-sm cursor-pointer">
                    {form.name}
                  </Label>
                </div>
              ))}
              
              {/* Formulários de Leads */}
              {allLeadForms.length > 0 && (
                <>
                  <div className="border-t border-white/10 my-3"></div>
                  <p className="text-sm text-muted-foreground mb-2">Formulários de Leads:</p>
                  {allLeadForms.filter(form => form.id !== selectedLeadForm?.id).map((form) => (
                <div key={form.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={form.id}
                    checked={selectedFormsToCopy.includes(form.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFormsToCopy(prev => [...prev, form.id]);
                      } else {
                        setSelectedFormsToCopy(prev => prev.filter(id => id !== form.id));
                      }
                    }}
                    className="data-[state=checked]:bg-[var(--brand-primary,#E50F5E)] data-[state=checked]:border-[var(--brand-primary,#E50F5E)]"
                  />
                  <Label htmlFor={form.id} className="text-sm cursor-pointer">
                    {form.name}
                  </Label>
                </div>
              ))}
                </>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStyleCopyDialog(false);
                  setSelectedFormsToCopy([]);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (selectedFormsToCopy.length > 0) {
                    copyStyleToForms(tab, selectedFormsToCopy);
                  }
                }}
                disabled={selectedFormsToCopy.length === 0}
              >
                Copiar Estilo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal do código iframe */}
      {showIframeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1F1F1F] border border-white/20 rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Código Iframe</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Copie o código abaixo e cole em seu site para exibir o formulário:
            </p>
            
            <div className="bg-[#2A2A2A] border border-white/20 rounded-lg p-4 mb-4 overflow-y-auto max-h-[60vh]">
              <pre className="text-sm text-white whitespace-pre-wrap overflow-x-auto">
                {iframeCode}
              </pre>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowIframeDialog(false)}
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(iframeCode);
                  toast({
                    title: 'Sucesso',
                    description: 'Código copiado para a área de transferência!',
                  });
                }}
              >
                Copiar Código
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal do código HTML */}
      {showHtmlDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1F1F1F] border border-white/20 rounded-lg p-6 w-[800px] max-w-[90vw] max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Código HTML Completo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Copie o código HTML abaixo e salve como arquivo .html para usar em qualquer site:
            </p>
            
            <div className="bg-[#2A2A2A] border border-white/20 rounded-lg p-4 mb-4 overflow-y-auto max-h-[60vh]">
              <pre className="text-sm text-white whitespace-pre-wrap overflow-x-auto">
                {htmlCode}
              </pre>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowHtmlDialog(false)}
              >
                Fechar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const blob = new Blob([htmlCode], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `formulario_${selectedLeadForm?.id || 'form'}.html`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast({
                    title: 'Sucesso',
                    description: 'Arquivo HTML baixado com sucesso!',
                  });
                }}
              >
                Baixar HTML
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(htmlCode);
                  toast({
                    title: 'Sucesso',
                    description: 'Código HTML copiado para a área de transferência!',
                  });
                }}
              >
                Copiar Código
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
