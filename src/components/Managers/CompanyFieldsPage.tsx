import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, GripVertical, Eye, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Tipos de campos disponíveis
  const availableFieldTypes = [
    { id: 'text', name: 'Texto', type: 'text' },
    { id: 'name', name: 'Nome e sobrenome', type: 'name' },
    { id: 'email', name: 'E-mail', type: 'email' },
    { id: 'phone', name: 'Telefone', type: 'tel' },
    { id: 'number', name: 'Número', type: 'number' },
    { id: 'date', name: 'Data', type: 'date' },
    { id: 'time', name: 'Hora', type: 'time' },
    { id: 'datetime', name: 'Data e Hora', type: 'datetime-local' },
    { id: 'money', name: 'Monetário', type: 'number' },
    { id: 'slider', name: 'Slider', type: 'range' },
    { id: 'address', name: 'Endereço', type: 'text' },
    { id: 'document', name: 'Documento', type: 'text' },
    { id: 'url', name: 'URL', type: 'url' },
    { id: 'connection', name: 'Conexão', type: 'email' },
    { id: 'textarea', name: 'Texto Longo', type: 'textarea' },
    { id: 'select', name: 'Seleção', type: 'select' },
    { id: 'checkbox', name: 'Caixa de Seleção', type: 'checkbox' }
  ];

// Lista de países com DDI e bandeiras
const countries = [
  { code: 'BR', name: 'Brasil', ddi: '+55', flag: '🇧🇷', mask: '(##) #####-####' },
  { code: 'US', name: 'Estados Unidos', ddi: '+1', flag: '🇺🇸', mask: '(###) ###-####' },
  { code: 'AR', name: 'Argentina', ddi: '+54', flag: '🇦🇷', mask: '## ####-####' },
  { code: 'CL', name: 'Chile', ddi: '+56', flag: '🇨🇱', mask: '# #### ####' },
  { code: 'CO', name: 'Colômbia', ddi: '+57', flag: '🇨🇴', mask: '### ### ####' },
  { code: 'PE', name: 'Peru', ddi: '+51', flag: '🇵🇪', mask: '### ### ###' },
  { code: 'UY', name: 'Uruguai', ddi: '+598', flag: '🇺🇾', mask: '## ### ###' },
  { code: 'PY', name: 'Paraguai', ddi: '+595', flag: '🇵🇾', mask: '### ### ###' },
  { code: 'BO', name: 'Bolívia', ddi: '+591', flag: '🇧🇴', mask: '### ### ###' },
  { code: 'VE', name: 'Venezuela', ddi: '+58', flag: '🇻🇪', mask: '### ### ####' },
  { code: 'EC', name: 'Equador', ddi: '+593', flag: '🇪🇨', mask: '## ### ####' },
  { code: 'GY', name: 'Guiana', ddi: '+592', flag: '🇬🇾', mask: '### ####' },
  { code: 'SR', name: 'Suriname', ddi: '+597', flag: '🇸🇷', mask: '### ####' },
  { code: 'GF', name: 'Guiana Francesa', ddi: '+594', flag: '🇬🇫', mask: '### ### ###' },
  { code: 'MX', name: 'México', ddi: '+52', flag: '🇲🇽', mask: '## #### ####' },
  { code: 'CA', name: 'Canadá', ddi: '+1', flag: '🇨🇦', mask: '(###) ###-####' },
  { code: 'GB', name: 'Reino Unido', ddi: '+44', flag: '🇬🇧', mask: '#### ### ####' },
  { code: 'FR', name: 'França', ddi: '+33', flag: '🇫🇷', mask: '# ## ## ## ##' },
  { code: 'DE', name: 'Alemanha', ddi: '+49', flag: '🇩🇪', mask: '### ########' },
  { code: 'IT', name: 'Itália', ddi: '+39', flag: '🇮🇹', mask: '### ### ####' },
  { code: 'ES', name: 'Espanha', ddi: '+34', flag: '🇪🇸', mask: '### ## ## ##' },
  { code: 'PT', name: 'Portugal', ddi: '+351', flag: '🇵🇹', mask: '### ### ###' },
  { code: 'JP', name: 'Japão', ddi: '+81', flag: '🇯🇵', mask: '##-####-####' },
  { code: 'CN', name: 'China', ddi: '+86', flag: '🇨🇳', mask: '### #### ####' },
  { code: 'IN', name: 'Índia', ddi: '+91', flag: '🇮🇳', mask: '##### #####' },
  { code: 'AU', name: 'Austrália', ddi: '+61', flag: '🇦🇺', mask: '### ### ###' },
  { code: 'RU', name: 'Rússia', ddi: '+7', flag: '🇷🇺', mask: '### ###-##-##' },
  { code: 'ZA', name: 'África do Sul', ddi: '+27', flag: '🇿🇦', mask: '## ### ####' },
  { code: 'EG', name: 'Egito', ddi: '+20', flag: '🇪🇬', mask: '## #### ####' },
  { code: 'NG', name: 'Nigéria', ddi: '+234', flag: '🇳🇬', mask: '### ### ####' }
];

// Lista de moedas
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

// Lista de opções para o campo Conexão
const connectionLists = [
  { id: 'leads', name: 'Leads' },
  { id: 'agendamentos', name: 'Agendamentos' },
  { id: 'resultados', name: 'Resultados' },
  { id: 'clientes', name: 'Clientes' },
  { id: 'empresas', name: 'Empresas' },
  { id: 'vendas', name: 'Vendas' },
  { id: 'origens', name: 'Origens' },
  { id: 'motivos-perda', name: 'Motivos de perda' }
];

interface CompanyField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  order: number;
  // Configurações específicas por tipo de campo
  placeholder?: boolean; // Se o nome aparece dentro do input
  placeholder_text?: string; // Texto personalizado do placeholder
  max_length?: number; // Limite de caracteres
  sender?: string; // Nome do campo para webhook
  // Configurações específicas para seleção
  options?: string; // Opções separadas por vírgula ou quebra de linha
  searchable?: boolean; // Se o dropdown tem pesquisa
  multiselect?: boolean; // Se permite múltipla seleção
  selection_connection?: boolean; // Se usa conexão para seleção
  selection_list?: string; // Lista selecionada para campo de seleção
  // Configurações específicas para checkbox
  checkbox_multiselect?: boolean; // Se permite múltipla seleção em checkbox
  checkbox_limit?: number; // Limite de itens selecionáveis
  checkbox_columns?: number; // Número de colunas para exibir opções
  checkbox_options?: string; // Opções para checkbox
  checkbox_button_mode?: boolean; // Se as opções aparecem como botões
  // Configurações específicas para monetário
  money_limits?: boolean; // Se tem limites de valor
  money_min?: number; // Valor mínimo
  money_max?: number; // Valor máximo
  money_currency?: string; // Moeda selecionada
  // Configurações específicas para slider
  slider_limits?: boolean; // Se tem limites de valor
  slider_min?: number; // Valor mínimo
  slider_max?: number; // Valor máximo
  slider_step?: boolean; // Se tem espaçamento entre valores
  slider_step_value?: number; // Valor do espaçamento
  slider_start_end?: boolean; // Se tem textos de início e fim
  slider_start?: string; // Texto de início
  slider_end?: string; // Texto de fim
  connection_list?: string; // Lista selecionada para campo Conexão
  connection_addition?: boolean; // Se permite adicionar novos itens
}

export function CompanyFieldsPage() {
  const { selectedCompanyId } = useCompany();
  const { toast } = useToast();
  
  // Usar selectedCompanyId como effectiveCompanyId
  const effectiveCompanyId = selectedCompanyId;
  const [fields, setFields] = useState<CompanyField[]>([]);
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  const [selectedFieldType, setSelectedFieldType] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [previewField, setPreviewField] = useState<CompanyField | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para configurações do campo
  const [fieldName, setFieldName] = useState<string>('');
  const [fieldRequired, setFieldRequired] = useState<boolean>(false);
  const [fieldPlaceholder, setFieldPlaceholder] = useState<boolean>(false);
  const [fieldPlaceholderText, setFieldPlaceholderText] = useState<string>('');
  const [fieldMaxLength, setFieldMaxLength] = useState<number>(0);
  const [fieldSender, setFieldSender] = useState<string>('');
  const [senderManuallyEdited, setSenderManuallyEdited] = useState<boolean>(false);
  
  // Estados específicos para seleção
  const [fieldOptions, setFieldOptions] = useState<string>('');
  const [fieldSearchable, setFieldSearchable] = useState<boolean>(false);
  const [fieldMultiselect, setFieldMultiselect] = useState<boolean>(false);
  const [fieldSelectionConnection, setFieldSelectionConnection] = useState<boolean>(false);
  const [fieldSelectionList, setFieldSelectionList] = useState<string>('');
  const [selectionConnectionItems, setSelectionConnectionItems] = useState<any[]>([]);
  const [selectionSearchQuery, setSelectionSearchQuery] = useState<string>('');
  const [selectedSelectionItem, setSelectedSelectionItem] = useState<any>(null);
  const [isSelectionDropdownOpen, setIsSelectionDropdownOpen] = useState<boolean>(false);
  
  // Estados específicos para checkbox
  const [fieldCheckboxMultiselect, setFieldCheckboxMultiselect] = useState<boolean>(false);
  const [fieldCheckboxLimit, setFieldCheckboxLimit] = useState<number>(0);
  const [fieldCheckboxColumns, setFieldCheckboxColumns] = useState<number>(1);
  const [fieldCheckboxOptions, setFieldCheckboxOptions] = useState<string>('');
  const [fieldCheckboxButtonMode, setFieldCheckboxButtonMode] = useState<boolean>(false);
  
  // Estados específicos para monetário
  const [fieldMoneyLimits, setFieldMoneyLimits] = useState<boolean>(false);
  const [fieldMoneyMin, setFieldMoneyMin] = useState<string>('');
  const [fieldMoneyMax, setFieldMoneyMax] = useState<string>('');
  const [fieldMoneyCurrency, setFieldMoneyCurrency] = useState<string>('BRL');
  
  // Estado separado para preview do campo monetário
  const [previewMoneyCurrency, setPreviewMoneyCurrency] = useState<string>('BRL');
  
  // Estados específicos para telefone
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Brasil por padrão
  const [phoneValue, setPhoneValue] = useState<string>('');
  
  // Estados específicos para nome
  const [nameValue, setNameValue] = useState<string>('');
  
  // Estados para seleção de opções
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  
  // Estados específicos para endereço
  const [addressCep, setAddressCep] = useState<string>('');
  const [addressEstado, setAddressEstado] = useState<string>('');
  const [addressCidade, setAddressCidade] = useState<string>('');
  const [addressBairro, setAddressBairro] = useState<string>('');
  const [addressEndereco, setAddressEndereco] = useState<string>('');
  const [addressNumero, setAddressNumero] = useState<string>('');
  const [addressComplemento, setAddressComplemento] = useState<string>('');
  
  // Estados específicos para slider
  const [fieldSliderLimits, setFieldSliderLimits] = useState<boolean>(false);
  const [fieldSliderMin, setFieldSliderMin] = useState<string>('');
  const [fieldSliderMax, setFieldSliderMax] = useState<string>('');
  const [fieldSliderStep, setFieldSliderStep] = useState<boolean>(false);
  const [fieldSliderStepValue, setFieldSliderStepValue] = useState<string>('');
  const [fieldSliderStartEnd, setFieldSliderStartEnd] = useState<boolean>(false);
  const [fieldSliderStart, setFieldSliderStart] = useState<string>('');
  const [fieldSliderEnd, setFieldSliderEnd] = useState<string>('');
  
  // Estado para controlar o valor do slider no preview
  const [sliderValue, setSliderValue] = useState<number>(50);
  
  // Estados específicos para documento
  const [fieldDocumentCpf, setFieldDocumentCpf] = useState<boolean>(false);
  const [fieldDocumentCnpj, setFieldDocumentCnpj] = useState<boolean>(false);
  
  // Estados específicos para conexão
  const [fieldConnectionList, setFieldConnectionList] = useState<string>('');
  const [fieldConnectionAddition, setFieldConnectionAddition] = useState<boolean>(false);
  const [connectionItems, setConnectionItems] = useState<any[]>([]);
  const [connectionSearchQuery, setConnectionSearchQuery] = useState<string>('');
  const [selectedConnectionItem, setSelectedConnectionItem] = useState<any>(null);
  const [isConnectionDropdownOpen, setIsConnectionDropdownOpen] = useState<boolean>(false);
  const [documentValue, setDocumentValue] = useState<string>('');
  
  // Estado específico para URL
  const [urlValue, setUrlValue] = useState<string>('');
  
  // Estado para pesquisa de tipos de campo
  const [fieldTypeSearch, setFieldTypeSearch] = useState<string>('');
  const [isFieldTypeSelectOpen, setIsFieldTypeSelectOpen] = useState<boolean>(false);

  // Resetar seleções quando o campo de prévia muda
  useEffect(() => {
    setSelectedOptions([]);
  }, [previewField?.id]);

  // Limpar pesquisa quando o dropdown é fechado
  useEffect(() => {
    if (!isFieldTypeSelectOpen) {
      setFieldTypeSearch('');
    }
  }, [isFieldTypeSelectOpen]);

  // Atualizar valor inicial do slider quando as configurações mudarem
  useEffect(() => {
    if (previewField?.type === 'slider') {
      const minValue = fieldSliderLimits && fieldSliderMin ? parseFloat(fieldSliderMin) : 0;
      const maxValue = fieldSliderLimits && fieldSliderMax ? parseFloat(fieldSliderMax) : 100;
      
      
      // Se Start/End estiver configurado, inicializar no valor máximo para mostrar o End
      if (fieldSliderStartEnd && (fieldSliderStart.trim() !== '' || fieldSliderEnd.trim() !== '')) {
        setSliderValue(maxValue);
      } else {
        const initialValue = (minValue + maxValue) / 2; // Valor central
        setSliderValue(initialValue);
      }
    }
  }, [previewField?.type, fieldSliderLimits, fieldSliderMin, fieldSliderMax, fieldSliderStartEnd, fieldSliderStart, fieldSliderEnd]);

  // Filtrar tipos de campos baseado na pesquisa e ordenar alfabeticamente
  const filteredFieldTypes = availableFieldTypes
    .filter(fieldType =>
      fieldType.name.toLowerCase().includes(fieldTypeSearch.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  // Função para gerar sender padrão
  const generateDefaultSender = (fieldName: string): string => {
    const cleanName = fieldName
      .toLowerCase()
      .normalize('NFD') // Normaliza caracteres unicode
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '_') // Substitui espaços por underscore
      .trim();
    
    return `empresa_${cleanName}`;
  };

  // Carregar configurações do campo selecionado
  const loadFieldConfig = (field: ClientField) => {
    setFieldName(field.name);
    setFieldRequired(field.required);
    setFieldPlaceholder(field.placeholder || false);
    
    // Definir placeholder padrão baseado no tipo do campo
    let defaultPlaceholder = 'Digite aqui...';
    if (field.type === 'email') {
      defaultPlaceholder = 'seu@email.com';
    } else if (field.type === 'tel') {
      defaultPlaceholder = '(11) 99999-9999';
    } else if (field.type === 'name') {
      defaultPlaceholder = 'João Silva';
    }
    setFieldPlaceholderText(field.placeholder_text || defaultPlaceholder);
    setFieldMaxLength(field.max_length || 0);
    
    // Carregar configurações específicas para seleção
    setFieldOptions(field.options || '');
    setFieldSearchable(field.searchable || false);
    setFieldMultiselect(field.multiselect || false);
    setFieldSelectionConnection(field.selection_connection || false);
    setFieldSelectionList(field.selection_list || '');
    
    // Carregar configurações específicas para checkbox
    setFieldCheckboxMultiselect(field.checkbox_multiselect || false);
    setFieldCheckboxLimit(field.checkbox_limit || 0);
    setFieldCheckboxColumns(field.checkbox_columns || 1);
    setFieldCheckboxOptions(field.checkbox_options || '');
    setFieldCheckboxButtonMode(field.checkbox_button_mode || false);
    
    // Carregar configurações específicas para monetário
    setFieldMoneyLimits(field.money_limits || false);
    setFieldMoneyMin(field.money_min?.toString() || '');
    setFieldMoneyMax(field.money_max?.toString() || '');
    setFieldMoneyCurrency(field.money_currency || 'BRL');
    
    // Carregar estado do preview separadamente
    setPreviewMoneyCurrency(field.money_currency || 'BRL');
    
    setFieldSender(field.sender || generateDefaultSender(field.name));
    setSenderManuallyEdited(false);
    
    // Resetar estados do telefone
    setSelectedCountry(countries[0]);
    setPhoneValue('');
    
    // Resetar estados do nome
    setNameValue('');
    
    // Resetar estados do endereço
    setAddressCep('');
    setAddressEstado('');
    setAddressCidade('');
    setAddressBairro('');
    setAddressEndereco('');
    setAddressNumero('');
    setAddressComplemento('');
    
    // Resetar valor do slider
    setSliderValue(50);
    
    // Resetar estados do documento
    setFieldDocumentCpf(field.document_cpf || false);
    setFieldDocumentCnpj(field.document_cnpj || false);
    setDocumentValue('');
    
    // Resetar estado da URL
    setUrlValue('');
    
    // Carregar configurações específicas para slider
    setFieldSliderLimits(field.slider_limits || false);
    setFieldSliderMin(field.slider_min?.toString() || '');
    setFieldSliderMax(field.slider_max?.toString() || '');
    setFieldSliderStep(field.slider_step || false);
    setFieldSliderStepValue(field.slider_step_value?.toString() || '');
    setFieldSliderStartEnd(field.slider_start_end || false);
    setFieldSliderStart(field.slider_start || '');
    setFieldSliderEnd(field.slider_end || '');
    
    // Carregar configurações específicas para conexão
    console.log('Loading connection config:', field.connection_list);
    setFieldConnectionList(field.connection_list || '');
    setFieldConnectionAddition(field.connection_addition || false);
    setSelectedConnectionItem(null);
    setConnectionSearchQuery('');
  };

  // Atualizar sender automaticamente quando nome mudar
  const handleFieldNameChange = (newName: string) => {
    setFieldName(newName);
    if (!senderManuallyEdited) {
      setFieldSender(generateDefaultSender(newName));
    }
  };

  // Marcar sender como editado manualmente
  const handleSenderChange = (newSender: string) => {
    // Se o usuário não digitou o prefixo, adicionar automaticamente
    let formattedSender = newSender;
    if (!newSender.startsWith('empresa_')) {
      // Aplicar formatação automática ao sender
      const cleanName = newSender
        .toLowerCase()
        .normalize('NFD') // Normaliza caracteres unicode
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '_') // Substitui espaços por underscore
        .trim();
      
      formattedSender = `empresa_${cleanName}`;
    } else {
      // Se já tem o prefixo, apenas formatar a parte após "empresa_"
      const afterPrefix = newSender.substring(8); // Remove "empresa_"
      const cleanAfterPrefix = afterPrefix
        .toLowerCase()
        .normalize('NFD') // Normaliza caracteres unicode
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '_') // Substitui espaços por underscore
        .trim();
      
      formattedSender = `empresa_${cleanAfterPrefix}`;
    }
    
    setFieldSender(formattedSender);
    setSenderManuallyEdited(true);
  };

  // Aplicar máscara de telefone baseada no país
  const applyPhoneMask = (value: string, mask: string) => {
    const numbers = value.replace(/\D/g, '');
    let maskedValue = '';
    let numberIndex = 0;

    for (let i = 0; i < mask.length && numberIndex < numbers.length; i++) {
      if (mask[i] === '#') {
        maskedValue += numbers[numberIndex];
        numberIndex++;
      } else {
        maskedValue += mask[i];
      }
    }

    return maskedValue;
  };

  // Validar número de telefone baseado no país
  const validatePhoneNumber = (value: string, countryCode: string) => {
    const numbers = value.replace(/\D/g, '');
    
    switch (countryCode) {
      case 'BR':
        return numbers.length >= 10 && numbers.length <= 11;
      case 'US':
      case 'CA':
        return numbers.length === 10;
      case 'AR':
        return numbers.length >= 10 && numbers.length <= 11;
      case 'CL':
        return numbers.length >= 8 && numbers.length <= 9;
      default:
        return numbers.length >= 8 && numbers.length <= 15;
    }
  };

  // Formatar nome com primeira letra maiúscula
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
        // Preencher campos automaticamente
        // Em um cenário real, você precisaria de refs para os inputs
        console.log('Dados do CEP encontrados:', data);
        return data;
      } else {
        console.log('CEP não encontrado');
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  };

  // Função para validar CPF
  const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Calcular primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cpf.charAt(9)) !== digit1) return false;
    
    // Calcular segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return parseInt(cpf.charAt(10)) === digit2;
  };

  // Função para validar CNPJ
  const validateCNPJ = (cnpj: string) => {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    // Calcular primeiro dígito verificador
    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cnpj.charAt(12)) !== digit1) return false;
    
    // Calcular segundo dígito verificador
    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return parseInt(cnpj.charAt(13)) === digit2;
  };

  // Função para aplicar máscara de CPF
  const applyCPFMask = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  // Função para aplicar máscara de CNPJ
  const applyCNPJMask = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  // Função para validar URL
  const validateURL = (url: string) => {
    try {
      // Padrão mais robusto para URL
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      
      // Verificar se é uma URL válida usando o construtor URL
      if (urlPattern.test(url)) {
        try {
          // Se não tem protocolo, adicionar https://
          const urlToTest = url.startsWith('http') ? url : `https://${url}`;
          new URL(urlToTest);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  // Função para carregar itens da lista selecionada
  const loadConnectionItems = async (listType: string) => {
    if (!listType) return;
    
    try {
      let query = supabase.from('');
      
      switch (listType) {
        case 'leads':
          query = supabase.from('leads').select('id, name').eq('company_id', effectiveCompanyId);
          break;
        case 'agendamentos':
          query = supabase.from('appointments').select('id, title').eq('company_id', effectiveCompanyId);
          break;
        case 'resultados':
          query = supabase.from('meeting_results').select('id, result_name').eq('company_id', effectiveCompanyId);
          break;
        case 'clientes':
          query = supabase.from('clients').select('id, name').eq('company_id', effectiveCompanyId);
          break;
        case 'empresas':
          query = supabase.from('companies').select('id, name').eq('company_id', effectiveCompanyId);
          break;
        case 'vendas':
          query = supabase.from('sales').select('id, title').eq('company_id', effectiveCompanyId);
          break;
        case 'origens':
          query = supabase.from('lead_origins').select('id, name').eq('company_id', effectiveCompanyId);
          break;
        case 'motivos-perda':
          query = supabase.from('loss_reasons').select('id, name').eq('company_id', effectiveCompanyId);
          break;
        default:
          return;
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      setConnectionItems(data || []);
    } catch (error) {
      console.error('Erro ao carregar itens da lista:', error);
      setConnectionItems([]);
    }
  };

  // Função para carregar itens da lista selecionada para campo Seleção
  const loadSelectionConnectionItems = async (listType: string) => {
    if (!listType) return;
    
    console.log('Loading selection connection items for list type:', listType, 'company:', effectiveCompanyId);
    
    try {
      let query = supabase.from('');
      
      switch (listType) {
        case 'leads':
          query = supabase.from('leads').select('id, name').eq('company_id', effectiveCompanyId);
          break;
        case 'agendamentos':
          query = supabase.from('appointments').select('id, title').eq('company_id', effectiveCompanyId);
          break;
        case 'resultados':
          query = supabase.from('meeting_results').select('id, result_name').eq('company_id', effectiveCompanyId);
          break;
        case 'clientes':
          query = supabase.from('clients').select('id, name').eq('company_id', effectiveCompanyId);
          break;
        case 'empresas':
          query = supabase.from('companies').select('id, name').eq('company_id', effectiveCompanyId);
          break;
        case 'vendas':
          query = supabase.from('sales').select('id, title').eq('company_id', effectiveCompanyId);
          break;
        case 'origens':
          query = supabase.from('lead_origins').select('id, name').eq('company_id', effectiveCompanyId);
          break;
        case 'motivos-perda':
          query = supabase.from('loss_reasons').select('id, name').eq('company_id', effectiveCompanyId);
          break;
        default:
          return;
      }
      
      console.log('Executando query:', query);
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro na query:', error);
        throw error;
      }
      
      console.log('Loaded selection connection items:', data);
      setSelectionConnectionItems(data || []);
    } catch (error) {
      console.error('Erro ao carregar itens da lista para seleção:', error);
      setSelectionConnectionItems([]);
    }
  };

  // Validar se tem pelo menos um sobrenome
  const validateName = (value: string) => {
    const words = value.trim().split(' ').filter(word => word.length > 0);
    return words.length >= 2; // Nome + pelo menos um sobrenome
  };

  // Salvar configurações do campo
  const saveFieldConfig = async () => {
    if (!previewField) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('company_fields')
        .update({
          field_name: fieldName,
          is_required: fieldRequired,
          placeholder: fieldPlaceholder,
          placeholder_text: fieldPlaceholderText,
          max_length: fieldMaxLength,
          options: fieldOptions,
          searchable: fieldSearchable,
          multiselect: fieldMultiselect,
          selection_connection: fieldSelectionConnection,
          selection_list: fieldSelectionList,
          checkbox_multiselect: fieldCheckboxMultiselect,
          checkbox_limit: fieldCheckboxLimit,
          checkbox_columns: fieldCheckboxColumns,
          checkbox_options: fieldCheckboxOptions,
          checkbox_button_mode: fieldCheckboxButtonMode,
          sender: fieldSender,
          // Configurações monetárias
          money_limits: fieldMoneyLimits,
          money_min: fieldMoneyMin ? parseFloat(fieldMoneyMin) : null,
          money_max: fieldMoneyMax ? parseFloat(fieldMoneyMax) : null,
          money_currency: fieldMoneyCurrency,
          // Configurações do slider
          slider_limits: fieldSliderLimits,
          slider_min: fieldSliderMin ? parseFloat(fieldSliderMin) : null,
          slider_max: fieldSliderMax ? parseFloat(fieldSliderMax) : null,
          slider_step: fieldSliderStep,
          slider_step_value: fieldSliderStepValue ? parseFloat(fieldSliderStepValue) : null,
          slider_start_end: fieldSliderStartEnd,
          slider_start: fieldSliderStart,
          slider_end: fieldSliderEnd,
          document_cpf: fieldDocumentCpf,
          document_cnpj: fieldDocumentCnpj,
          connection_list: fieldConnectionList,
          connection_addition: fieldConnectionAddition
        })
        .eq('id', previewField.id);

      if (error) throw error;

      // Atualizar o campo na lista local
      setFields(prev => prev.map(field => 
        field.id === previewField.id 
          ? { 
              ...field, 
              name: fieldName, 
              required: fieldRequired, 
              placeholder: fieldPlaceholder, 
              placeholder_text: fieldPlaceholderText, 
              max_length: fieldMaxLength, 
              options: fieldOptions, 
              searchable: fieldSearchable, 
              multiselect: fieldMultiselect, 
              checkbox_multiselect: fieldCheckboxMultiselect, 
              checkbox_limit: fieldCheckboxLimit, 
              checkbox_columns: fieldCheckboxColumns, 
              checkbox_options: fieldCheckboxOptions, 
              checkbox_button_mode: fieldCheckboxButtonMode, 
              sender: fieldSender,
              // Configurações monetárias
              money_limits: fieldMoneyLimits,
              money_min: fieldMoneyMin ? parseFloat(fieldMoneyMin) : 0,
              money_max: fieldMoneyMax ? parseFloat(fieldMoneyMax) : 0,
              money_currency: fieldMoneyCurrency
            }
          : field
      ));

      // Atualizar o campo de prévia
      setPreviewField(prev => prev ? { 
        ...prev, 
        name: fieldName, 
        required: fieldRequired, 
        placeholder: fieldPlaceholder, 
        placeholder_text: fieldPlaceholderText, 
        max_length: fieldMaxLength, 
        options: fieldOptions, 
        searchable: fieldSearchable, 
        multiselect: fieldMultiselect, 
        checkbox_multiselect: fieldCheckboxMultiselect, 
        checkbox_limit: fieldCheckboxLimit, 
        checkbox_columns: fieldCheckboxColumns, 
        checkbox_options: fieldCheckboxOptions, 
        checkbox_button_mode: fieldCheckboxButtonMode, 
        sender: fieldSender,
        // Configurações monetárias
        money_limits: fieldMoneyLimits,
        money_min: fieldMoneyMin ? parseFloat(fieldMoneyMin) : 0,
        money_max: fieldMoneyMax ? parseFloat(fieldMoneyMax) : 0,
        money_currency: fieldMoneyCurrency
      } : null);

      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso' });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar configurações', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Carregar campos salvos
  const loadFields = async () => {
    if (!selectedCompanyId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_fields')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('field_order');

      if (error) throw error;
      
      
      // Mapear dados do banco para o formato esperado
      const mappedFields = (data || []).map((field: any) => {
        let defaultPlaceholder = 'Digite aqui...';
        if (field.field_type === 'email') {
          defaultPlaceholder = 'seu@email.com';
        } else if (field.field_type === 'tel') {
          defaultPlaceholder = '(11) 99999-9999';
        } else if (field.field_type === 'name') {
          defaultPlaceholder = 'João Silva';
        }
        
        return {
          id: field.id,
          name: field.field_name,
          type: field.field_type,
          required: field.is_required,
          order: field.field_order,
          placeholder: field.placeholder || false,
          placeholder_text: field.placeholder_text || defaultPlaceholder,
          max_length: field.max_length || 0,
          options: field.options || '',
          searchable: field.searchable || false,
          multiselect: field.multiselect || false,
          selection_connection: field.selection_connection || false,
          selection_list: field.selection_list || '',
          checkbox_multiselect: field.checkbox_multiselect || false,
          checkbox_limit: field.checkbox_limit || 0,
          checkbox_columns: field.checkbox_columns || 1,
          checkbox_options: field.checkbox_options || '',
          checkbox_button_mode: field.checkbox_button_mode || false,
          sender: field.sender || generateDefaultSender(field.field_name),
          // Configurações monetárias
          money_limits: field.money_limits || false,
          money_min: field.money_min || 0,
          money_max: field.money_max || 0,
          money_currency: field.money_currency || 'BRL',
          // Configurações do slider
          slider_limits: field.slider_limits || false,
          slider_min: field.slider_min || 0,
          slider_max: field.slider_max || 100,
          slider_step: field.slider_step || false,
          slider_step_value: field.slider_step_value || 1,
          slider_start_end: field.slider_start_end || false,
          slider_start: field.slider_start || '',
          slider_end: field.slider_end || '',
          // Configurações do documento
          document_cpf: field.document_cpf || false,
          document_cnpj: field.document_cnpj || false,
          // Configurações de conexão
          connection_list: field.connection_list || '',
          connection_addition: field.connection_addition || false
        };
      });
      
      setFields(mappedFields);
    } catch (error) {
      console.error('Erro ao carregar campos:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar campos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, [selectedCompanyId]);

  // Carregar itens da lista quando a lista de conexão for selecionada
  useEffect(() => {
    if (fieldConnectionList) {
      loadConnectionItems(fieldConnectionList);
    }
  }, [fieldConnectionList, effectiveCompanyId]);

  // Carregar itens da lista de seleção quando fieldSelectionList mudar
  useEffect(() => {
    if (fieldSelectionList) {
      loadSelectionConnectionItems(fieldSelectionList);
    }
  }, [fieldSelectionList, effectiveCompanyId]);

  // Adicionar novo campo
  const addField = async () => {
    if (!selectedFieldType || !newFieldName.trim()) {
      toast({ title: 'Erro', description: 'Selecione um tipo e digite um nome para o campo', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
        let defaultPlaceholder = 'Digite aqui...';
        if (selectedFieldType === 'email') {
          defaultPlaceholder = 'seu@email.com';
        } else if (selectedFieldType === 'tel') {
          defaultPlaceholder = '(11) 99999-9999';
        } else if (selectedFieldType === 'name') {
          defaultPlaceholder = 'João Silva';
        }
        
        const newField: ClientField = {
          id: `field_${Date.now()}`,
          name: newFieldName.trim(),
          type: selectedFieldType,
          required: false,
          order: fields.length,
          placeholder: false,
          placeholder_text: defaultPlaceholder,
          max_length: 0,
          options: '',
          searchable: false,
          multiselect: false,
          checkbox_multiselect: false,
          checkbox_limit: 0,
          checkbox_columns: 1,
          checkbox_options: '',
          checkbox_button_mode: false,
          sender: generateDefaultSender(newFieldName.trim()),
          // Configurações monetárias
          money_limits: false,
          money_min: 0,
          money_max: 0,
          money_currency: 'BRL'
        };

      const { data, error } = await supabase
        .from('company_fields')
        .insert({
          company_id: selectedCompanyId,
          field_name: newField.name,
          field_type: newField.type,
          is_required: newField.required,
          field_order: newField.order,
          placeholder: newField.placeholder,
          placeholder_text: newField.placeholder_text,
          max_length: newField.max_length,
          options: newField.options,
          searchable: newField.searchable,
          multiselect: newField.multiselect,
          checkbox_multiselect: newField.checkbox_multiselect,
          checkbox_limit: newField.checkbox_limit,
          checkbox_columns: newField.checkbox_columns,
          checkbox_options: newField.checkbox_options,
          checkbox_button_mode: newField.checkbox_button_mode,
          sender: newField.sender,
          // Configurações monetárias
          money_limits: newField.money_limits,
          money_min: newField.money_min,
          money_max: newField.money_max,
          money_currency: newField.money_currency,
          // Configurações do documento
          document_cpf: false,
          document_cnpj: false
        })
        .select()
        .single();

      if (error) throw error;

      setFields(prev => [...prev, { ...newField, id: data.id }]);
      setSelectedFieldType('');
      setNewFieldName('');
      toast({ title: 'Sucesso', description: 'Campo adicionado com sucesso' });
    } catch (error) {
      console.error('Erro ao adicionar campo:', error);
      toast({ title: 'Erro', description: 'Erro ao adicionar campo', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Remover campo
  const removeField = async (fieldId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('company_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      setFields(prev => prev.filter(field => field.id !== fieldId));
      if (previewField?.id === fieldId) {
        setPreviewField(null);
      }
      toast({ title: 'Sucesso', description: 'Campo removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover campo:', error);
      toast({ title: 'Erro', description: 'Erro ao remover campo', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Reordenar campos
  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Atualizar ordem no estado
    const updatedFields = items.map((field, index) => ({
      ...field,
      order: index
    }));

    setFields(updatedFields);

    // Salvar nova ordem no banco
    try {
      const updates = updatedFields.map(field => ({
        id: field.id,
        field_order: field.order
      }));

      for (const update of updates) {
        await supabase
          .from('company_fields')
          .update({ field_order: update.field_order })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Erro ao salvar ordem:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar ordem dos campos', variant: 'destructive' });
    }
  };

  // Renderizar prévia do campo seguindo exatamente o padrão da página de formulários
  const renderFieldPreview = (field: ClientField) => {
    // Estilos exatos da página de formulários - usando os mesmos valores padrão
    const fontStyle = { fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'` };
    const labelStyle = { ...fontStyle, fontSize: '14px', marginBottom: '8px' } as React.CSSProperties;
    const inputStyle = { ...fontStyle, fontSize: '16px' } as React.CSSProperties;
    const fieldStyle = {
      ...inputStyle,
      backgroundColor: '#2A2A2A',  // fieldBgColor padrão
      color: '#FFFFFF',           // fieldTextColor padrão
      borderColor: '#FFFFFF33',   // borderColorNormal padrão
      borderWidth: 1,             // borderWidthNormalPx padrão
      borderStyle: 'solid',
      borderRadius: 12,           // borderRadiusPx padrão
    } as React.CSSProperties;

    const baseProps = {
      required: field.required,
      style: fieldStyle,
      className: "h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border focus-border"
    };

    // Determinar placeholder baseado na configuração
    const getPlaceholder = () => {
      if (fieldPlaceholder && field.type !== 'checkbox') {
        return field.name; // Nome do campo como placeholder
      }
      // Usar texto personalizado do placeholder se disponível
      if (fieldPlaceholderText && field.type !== 'checkbox') return fieldPlaceholderText;
      // Placeholders padrão por tipo
      switch (field.type) {
        case 'email': return 'seu@email.com';
        case 'phone': return '(11) 99999-9999';
        case 'number': return '123';
        case 'money': return '0,00';
        case 'textarea': return 'Digite sua mensagem...';
        case 'time': return '14:30';
        case 'datetime': return '2024-01-01T14:30';
        case 'address': return 'Digite o CEP';
        case 'document': return '000.000.000-00';
        case 'url': return 'https://exemplo.com';
        default: return 'Digite aqui...';
      }
    };

    switch (field.type) {
      case 'text':
        return <Input {...baseProps} type="text" placeholder={getPlaceholder()} maxLength={fieldMaxLength || undefined} />;
      case 'name':
        return (
          <Input 
            {...baseProps} 
            type="text" 
            placeholder={getPlaceholder()}
            value={nameValue}
            onChange={(e) => {
              const formattedValue = formatName(e.target.value);
              setNameValue(formattedValue);
            }}
            style={{
              ...fieldStyle,
              textTransform: 'none' // Evitar transformação automática do browser
            }}
          />
        );
      case 'email':
        return <Input {...baseProps} type="email" placeholder={getPlaceholder()} pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" />;
      case 'phone':
        return (
          <div className="flex">
            {/* DDI Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-3 border border-white/20 rounded-l-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border focus-border"
                  style={{
                    ...fieldStyle,
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    borderRight: 'none',
                    minWidth: '120px',
                    height: '48px'
                  }}
                >
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="text-sm">{selectedCountry.ddi}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-64 max-h-60 overflow-y-auto bg-[#2A2A2A] border-white/20"
                align="start"
              >
                {countries.map((country) => (
                  <DropdownMenuItem
                    key={country.code}
                    className="flex items-center gap-3 px-3 py-2 text-white hover:bg-[#3A3A3A] focus:bg-[#3A3A3A] cursor-pointer"
                    onClick={() => {
                      setSelectedCountry(country);
                      setPhoneValue(''); // Limpar número ao trocar país
                    }}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm font-medium">{country.ddi}</span>
                    <span className="text-sm text-gray-300">{country.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Número do telefone */}
            <Input 
              {...baseProps} 
              type="tel" 
              placeholder={getPlaceholder()}
              value={phoneValue}
              onChange={(e) => {
                const maskedValue = applyPhoneMask(e.target.value, selectedCountry.mask);
                setPhoneValue(maskedValue);
              }}
              className="rounded-l-none border-l-0 focus-border focus-border"
              style={{
                ...fieldStyle,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                height: '48px'
              }}
            />
          </div>
        );
      case 'number':
        return <Input {...baseProps} type="number" placeholder={getPlaceholder()} />;
      case 'date':
        return <Input {...baseProps} type="date" />;
      case 'time':
        return <Input {...baseProps} type="time" />;
      case 'datetime':
        return <Input {...baseProps} type="datetime-local" />;
      case 'money':
        const isVariables = fieldMoneyCurrency === 'VARIABLES';
        const selectedCurrency = isVariables 
          ? currencies.find(c => c.code === previewMoneyCurrency)
          : currencies.find(c => c.code === fieldMoneyCurrency);
        
        return (
          <div className="flex items-center space-x-2">
            {isVariables && (
              <Select value={previewMoneyCurrency} onValueChange={setPreviewMoneyCurrency}>
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
              {...baseProps} 
              type="text"
              placeholder="0,00"
              style={{
                ...fieldStyle,
                textAlign: 'left',
                flex: 1
              }}
              onChange={(e) => {
                // Aplicar máscara monetária com símbolo
                const value = e.target.value.replace(/\D/g, '');
                if (value) {
                  const numericValue = parseInt(value) / 100;
                  const symbol = selectedCurrency?.symbol || 'R$';
                  const formatted = `${symbol} ${numericValue.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}`;
                  e.target.value = formatted;
                }
              }}
            />
          </div>
        );
      case 'slider':
        // Calcular valores baseados nas configurações
        const minValue = fieldSliderLimits && fieldSliderMin ? parseFloat(fieldSliderMin) : 0;
        const maxValue = fieldSliderLimits && fieldSliderMax ? parseFloat(fieldSliderMax) : 100;
        const stepValue = fieldSliderStep && fieldSliderStepValue ? parseFloat(fieldSliderStepValue) : 1;
        
        // Calcular posição do texto baseada no valor normal
        const percentage = ((sliderValue - minValue) / (maxValue - minValue)) * 100;
        const textPosition = Math.max(0, Math.min(100, percentage));
        
        // Determinar valor de exibição com lógica especial para Start/End
        let displayValue = sliderValue.toString();
        if (fieldSliderStartEnd && (fieldSliderStart.trim() !== '' || fieldSliderEnd.trim() !== '')) {
          if (sliderValue === minValue && fieldSliderStart.trim() !== '') {
            displayValue = fieldSliderStart;
          } else if (sliderValue === maxValue && fieldSliderEnd.trim() !== '') {
            // Quando está no valor máximo, mostrar o End (200+)
            displayValue = fieldSliderEnd;
          } else {
            displayValue = sliderValue.toString();
          }
        }
        
        // Calcular posição restrita para o texto não ultrapassar as margens
        // Estimar largura do texto baseado no número de caracteres
        const textLength = displayValue.length;
        const estimatedTextWidthPercent = Math.max(6, Math.min(15, textLength * 1.5)); // Entre 6% e 15%
        const halfTextWidth = estimatedTextWidthPercent / 2;
        const constrainedPosition = Math.max(halfTextWidth, Math.min(100 - halfTextWidth, percentage));
        
        
        return (
          <div className="space-y-2">
            {/* Layout responsivo: slider + input lado a lado em telas grandes, empilhados em telas pequenas */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Slider - 65% em telas grandes, 100% em telas pequenas */}
              <div className="w-full md:w-[65%]">
                <input
                  type="range"
                  min={minValue}
                  max={maxValue}
                  step={stepValue}
                  value={sliderValue}
                  onChange={(e) => setSliderValue(parseFloat(e.target.value))}
                  className="slider w-full h-2 bg-[#FFFFFF33] rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #E50F5E 0%, #E50F5E ${percentage}%, #FFFFFF33 ${percentage}%, #FFFFFF33 100%)`
                  }}
                />
              </div>
              
              {/* Input - 35% em telas grandes, 100% em telas pequenas */}
              <div className="w-full md:w-[35%]">
                <Input
                  type="number"
                  value={sliderValue}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value);
                    if (!isNaN(newValue) && newValue >= minValue && newValue <= maxValue) {
                      setSliderValue(newValue);
                    }
                  }}
                  min={minValue}
                  max={maxValue}
                  step={stepValue}
                  className="w-full"
                  style={{
                    ...fieldStyle,
                    height: '48px'
                  }}
                />
              </div>
            </div>
          </div>
        );
      case 'address':
        return (
          <div className="space-y-3">
            {/* Linha 1: CEP e Estado */}
            <div className="grid grid-cols-2 gap-3">
              <Input 
                {...baseProps} 
                type="text" 
                placeholder="CEP"
                maxLength={9}
                value={addressCep}
                style={{...fieldStyle, height: '48px'}}
                onChange={async (e) => {
                  // Aplicar máscara do CEP
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length >= 5) {
                    value = value.substring(0, 5) + '-' + value.substring(5, 8);
                  }
                  setAddressCep(value);
                  
                  // Se CEP completo, buscar dados
                  if (value.length === 9) {
                    const cep = value.replace(/\D/g, '');
                    if (cep.length === 8) {
                      const cepData = await fetchCEPData(cep);
                      if (cepData) {
                        // Preencher campos automaticamente
                        setAddressEstado(cepData.uf || '');
                        setAddressCidade(cepData.localidade || '');
                        setAddressBairro(cepData.bairro || '');
                        setAddressEndereco(cepData.logradouro || '');
                      }
                    }
                  }
                }}
              />
              <Input 
                {...baseProps} 
                type="text" 
                placeholder="Estado"
                value={addressEstado}
                onChange={(e) => setAddressEstado(e.target.value)}
                style={{...fieldStyle, height: '48px'}}
              />
            </div>
            
            {/* Linha 2: Cidade e Bairro */}
            <div className="grid grid-cols-2 gap-3">
              <Input 
                {...baseProps} 
                type="text" 
                placeholder="Cidade"
                value={addressCidade}
                onChange={(e) => setAddressCidade(e.target.value)}
                style={{...fieldStyle, height: '48px'}}
              />
              <Input 
                {...baseProps} 
                type="text" 
                placeholder="Bairro"
                value={addressBairro}
                onChange={(e) => setAddressBairro(e.target.value)}
                style={{...fieldStyle, height: '48px'}}
              />
            </div>
            
            {/* Linha 3: Endereço */}
            <Input 
              {...baseProps} 
              type="text" 
              placeholder="Endereço"
              value={addressEndereco}
              onChange={(e) => setAddressEndereco(e.target.value)}
              style={{...fieldStyle, height: '48px'}}
            />
            
            {/* Linha 4: Número e Complemento - 3 colunas (1 para número, 2 para complemento) */}
            <div className="grid grid-cols-3 gap-3">
              <Input 
                {...baseProps} 
                type="text" 
                placeholder="Número"
                value={addressNumero}
                onChange={(e) => setAddressNumero(e.target.value)}
                style={{...fieldStyle, height: '48px'}}
              />
              <div className="col-span-2">
                <Input 
                  {...baseProps} 
                  type="text" 
                  placeholder="Complemento"
                  value={addressComplemento}
                  onChange={(e) => setAddressComplemento(e.target.value)}
                  style={{...fieldStyle, height: '48px'}}
                />
              </div>
            </div>
          </div>
        );
      case 'document':
        const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          let value = e.target.value;
          let maskedValue = value;
          
          if (fieldDocumentCpf) {
            maskedValue = applyCPFMask(value);
            const numbers = value.replace(/\D/g, '');
            if (numbers.length === 11) {
              if (!validateCPF(numbers)) {
                // CPF inválido - não permitir continuar digitando
                return;
              }
            }
          } else if (fieldDocumentCnpj) {
            maskedValue = applyCNPJMask(value);
            const numbers = value.replace(/\D/g, '');
            if (numbers.length === 14) {
              if (!validateCNPJ(numbers)) {
                // CNPJ inválido - não permitir continuar digitando
                return;
              }
            }
          }
          
          setDocumentValue(maskedValue);
        };
        
        return (
          <Input 
            {...baseProps} 
            type="text" 
            placeholder={getPlaceholder()}
            value={documentValue}
            onChange={handleDocumentChange}
            maxLength={fieldDocumentCpf ? 14 : fieldDocumentCnpj ? 18 : undefined}
          />
        );
      case 'url':
        const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          setUrlValue(value);
        };
        
        const isUrlValid = urlValue.trim() === '' || validateURL(urlValue);
        
        return (
          <div className="space-y-1">
            <Input 
              {...baseProps} 
              type="url" 
              placeholder={getPlaceholder()}
              value={urlValue}
              onChange={handleUrlChange}
              className={`h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border ${!isUrlValid ? 'border-red-500 focus:border-red-500' : ''}`}
              style={{
                ...fieldStyle,
                height: '48px'
              }}
            />
            {!isUrlValid && urlValue.trim() !== '' && (
              <p className="text-xs text-red-500">Por favor, insira uma URL válida</p>
            )}
          </div>
        );
      
      case 'connection':
        console.log('Rendering connection field:', {
          fieldConnectionList,
          connectionItems: connectionItems.length,
          selectedConnectionItem
        });
        
        const filteredConnectionItems = connectionItems.filter(item => {
          const searchField = item.name || item.title || item.result_name;
          return searchField?.toLowerCase().includes(connectionSearchQuery.toLowerCase());
        });

        // Usar o mesmo estilo do campo select com conexão
        return (
          <div className="flex items-center space-x-2">
            <Select 
              value={selectedConnectionItem?.id || ''} 
              onValueChange={(value) => {
                const item = connectionItems.find(item => item.id === value);
                setSelectedConnectionItem(item);
              }}
              open={isConnectionDropdownOpen}
              onOpenChange={setIsConnectionDropdownOpen}
            >
              <SelectTrigger style={{ ...fieldStyle, ...fontStyle, ['--active-bc' as any]: '#E50F5E', ['--focus-bw' as any]: '2px' }} className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border focus-border">
                <SelectValue placeholder={selectedConnectionItem ? (selectedConnectionItem.name || selectedConnectionItem.title || selectedConnectionItem.result_name) : getPlaceholder()} />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-white/20 text-white" style={{...fontStyle, ['--selBg' as any]: '#E50F5E', ['--selFg' as any]: '#FFFFFF', fontSize: '16px'}}>
                <div className="p-2 border-b border-white/20">
                  <Input
                    placeholder="Pesquisar..."
                    value={connectionSearchQuery}
                    onChange={(e) => setConnectionSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#2A2A2A] border-white/20 text-white"
                    style={{
                      ...fieldStyle,
                      height: '32px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                {filteredConnectionItems.length > 0 ? (
                  filteredConnectionItems.map((item) => (
                    <SelectItem 
                      key={item.id}
                      value={item.id}
                      className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" 
                      style={{...fontStyle, fontSize: '16px'}}
                    >
                      {item.name || item.title || item.result_name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-items" disabled>
                    {connectionItems.length === 0 ? 'Nenhum item disponível' : 'Nenhum item encontrado'}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {/* Ícone de adição - só aparece quando toggle Adição estiver ativado */}
            {fieldConnectionAddition && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 border-white/20 text-white hover:bg-white/10"
                onClick={() => {
                  // TODO: Abrir modal para adicionar novo item
                  console.log('Abrir modal para adicionar item na lista:', fieldConnectionList);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      case 'textarea':
          return (
            <textarea 
              {...baseProps} 
              rows={3} 
              placeholder={getPlaceholder()} 
              maxLength={fieldMaxLength || undefined}
              className="w-full h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border"
              style={{
                ...fieldStyle, 
                height: '120px', // Altura maior que os outros campos
                minHeight: '120px',
                width: '100%',
                resize: 'vertical',
                padding: '12px' // Adicionar padding interno para não ficar colado nas bordas
              }}
            />
          );
      case 'select':
        // Processar opções do campo
        const processOptions = (optionsText: string) => {
          if (!optionsText.trim()) return [];
          
          // Dividir por vírgula ou quebra de linha
          const options = optionsText
            .split(/[,\n]/)
            .map(option => option.trim())
            .filter(option => option.length > 0);
          
          return options;
        };

        const selectOptions = processOptions(fieldOptions);

        if (fieldMultiselect) {
          // Renderizar multiseleção usando Select com checkboxes dentro
          return (
            <Select>
              <SelectTrigger style={{ ...fieldStyle, ...fontStyle, ['--active-bc' as any]: '#E50F5E', ['--focus-bw' as any]: '2px' }} className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border focus-border">
                <SelectValue placeholder={getPlaceholder()} />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-white/20 text-white max-h-80">
                {fieldSearchable && (
                  <div className="p-2">
                    <Input
                      placeholder="Pesquisar opções..."
                      className="h-9 bg-[#1f1f1f] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
                    />
                  </div>
                )}
                {selectOptions.length > 0 ? (
                  selectOptions.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 hover:bg-white/10 cursor-pointer">
                      <Checkbox
                        id={`preview-select-${index}`}
                        className="data-[state=checked]:bg-[var(--brand-primary,#E50F5E)] data-[state=checked]:border-[var(--brand-primary,#E50F5E)]"
                      />
                      <Label 
                        htmlFor={`preview-select-${index}`}
                        className="flex-1 cursor-pointer"
                        style={{
                          ...labelStyle,
                          color: 'white'
                        }}
                      >
                        {option}
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhuma opção configurada
                  </div>
                )}
              </SelectContent>
            </Select>
          );
        } else {
          // Renderizar seleção simples
          return (
            <Select>
              <SelectTrigger style={{ ...fieldStyle, ...fontStyle, ['--active-bc' as any]: '#E50F5E', ['--focus-bw' as any]: '2px' }} className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border focus-border">
                <SelectValue placeholder={getPlaceholder()} />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-white/20 text-white" style={{...fontStyle, ['--selBg' as any]: '#E50F5E', ['--selFg' as any]: '#FFFFFF', fontSize: '16px'}}>
                {fieldSearchable && (
                  <div className="p-2 border-b border-white/20">
                    <Input
                      placeholder="Pesquisar..."
                      className="bg-[#2A2A2A] border-white/20 text-white"
                      style={{
                        ...fieldStyle,
                        height: '32px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                )}
                {selectOptions.length > 0 ? (
                  selectOptions.map((option, index) => (
                    <SelectItem 
                      key={index}
                      value={`option-${index}`}
                      className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" 
                      style={{...fontStyle, fontSize: '16px'}}
                    >
                      {option}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-options" disabled>
                    Nenhuma opção configurada
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          );
        }
      case 'checkbox':
        // Processar opções do campo checkbox
        const processCheckboxOptions = (optionsText: string) => {
          if (!optionsText.trim()) return [];
          
          // Dividir por vírgula ou quebra de linha
          const options = optionsText
            .split(/[,\n]/)
            .map(option => option.trim())
            .filter(option => option.length > 0);
          
          return options;
        };

        const checkboxOptions = processCheckboxOptions(fieldCheckboxOptions);

        if (checkboxOptions.length > 0) {
          // Renderizar opções com checkboxes ou botões
          const columns = fieldCheckboxColumns || 1;
          
          // Função para lidar com seleção
          const handleOptionSelect = (index: number) => {
            if (fieldCheckboxMultiselect) {
              // Multiseleção: adicionar/remover da lista
              if (selectedOptions.includes(index)) {
                setSelectedOptions(prev => prev.filter(i => i !== index));
              } else {
                // Verificar limite
                if (fieldCheckboxLimit > 0 && selectedOptions.length >= fieldCheckboxLimit) {
                  return; // Não permitir seleção se limite atingido
                }
                setSelectedOptions(prev => [...prev, index]);
              }
            } else {
              // Seleção única: substituir seleção anterior
              setSelectedOptions([index]);
            }
          };
          
          if (fieldCheckboxButtonMode) {
            // Renderizar como botões
            return (
              <div className="space-y-2">
                <div 
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, 1fr)`
                  }}
                >
                  {checkboxOptions.map((option, index) => {
                    const isSelected = selectedOptions.includes(index);
                    const canSelect = !fieldCheckboxMultiselect || 
                      fieldCheckboxLimit === 0 || 
                      selectedOptions.length < fieldCheckboxLimit ||
                      isSelected;
                    
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleOptionSelect(index)}
                        className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-[#E50F5E] focus:ring-offset-2 focus:ring-offset-[#2A2A2A] ${
                          isSelected 
                            ? 'bg-[#E50F5E] border-[#E50F5E] text-white' 
                            : canSelect 
                              ? 'border-white/20 bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]' 
                              : 'border-white/10 bg-[#1A1A1A] text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!canSelect}
                        style={{
                          fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'`,
                          fontSize: '14px'
                        }}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                {fieldCheckboxMultiselect && fieldCheckboxLimit > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Limite: {fieldCheckboxLimit} opção(ões) selecionada(s) - {selectedOptions.length} selecionada(s)
                  </p>
                )}
              </div>
            );
          } else {
            // Renderizar como checkboxes
            return (
              <div className="space-y-2">
                <div 
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, 1fr)`
                  }}
                >
                  {checkboxOptions.map((option, index) => {
                    const isSelected = selectedOptions.includes(index);
                    const canSelect = !fieldCheckboxMultiselect || 
                      fieldCheckboxLimit === 0 || 
                      selectedOptions.length < fieldCheckboxLimit ||
                      isSelected;
                    
                    return (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`preview-checkbox-${index}`}
                          checked={isSelected}
                          onCheckedChange={() => handleOptionSelect(index)}
                          className="data-[state=checked]:bg-[var(--brand-primary,#E50F5E)] data-[state=checked]:border-[var(--brand-primary,#E50F5E)]"
                          disabled={!canSelect}
                        />
                        <Label 
                          htmlFor={`preview-checkbox-${index}`}
                          style={{
                            ...labelStyle,
                            color: canSelect ? 'white' : 'gray',
                            cursor: canSelect ? 'pointer' : 'not-allowed'
                          }}
                        >
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                {fieldCheckboxMultiselect && fieldCheckboxLimit > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Limite: {fieldCheckboxLimit} opção(ões) selecionada(s) - {selectedOptions.length} selecionada(s)
                  </p>
                )}
              </div>
            );
          }
        } else {
          // Renderizar checkbox simples quando não há opções
          return (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`preview-${field.id}`} 
                className="data-[state=checked]:bg-[var(--brand-primary,#E50F5E)] data-[state=checked]:border-[var(--brand-primary,#E50F5E)]"
              />
              <Label htmlFor={`preview-${field.id}`} style={{...labelStyle, color: 'white'}}>
                Marque esta opção
              </Label>
            </div>
          );
        }
      default:
        return <Input {...baseProps} type="text" placeholder="Digite aqui..." />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Coluna Esquerda - Configuração */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Campos da Empresa</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Gerencie os campos personalizados para empresas. Arraste e solte para reordenar.
          </p>

          {/* Adicionar novo campo */}
          <div className="flex items-end gap-3 mb-6">
            <div className="flex-1">
              <Select 
                value={selectedFieldType} 
                onValueChange={setSelectedFieldType}
                open={isFieldTypeSelectOpen}
                onOpenChange={setIsFieldTypeSelectOpen}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {/* Campo de pesquisa */}
                  <div className="p-2 border-b" onClick={(e) => e.stopPropagation()}>
                    <Input
                      placeholder="Pesquisar tipo de campo..."
                      value={fieldTypeSearch}
                      onChange={(e) => setFieldTypeSearch(e.target.value)}
                      className="text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  {/* Lista de tipos de campo */}
                  {filteredFieldTypes.map((fieldType) => (
                    <SelectItem key={fieldType.id} value={fieldType.id}>
                      {fieldType.name}
                    </SelectItem>
                  ))}
                  
                  {/* Mensagem quando não há resultados */}
                  {filteredFieldTypes.length === 0 && (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      Nenhum tipo encontrado
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Input
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="Nome do Campo"
              />
            </div>

            <Button 
              onClick={addField} 
              disabled={loading || !selectedFieldType || !newFieldName.trim()}
              size="icon"
              className="h-10 w-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Lista de campos */}
          <div>
            <h4 className="text-sm font-medium mb-3">Campos Configurados</h4>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Carregando campos...
              </div>
            ) : fields.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhum campo configurado
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="fields">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {fields.map((field, index) => (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div {...provided.dragHandleProps} className="cursor-grab">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{field.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {availableFieldTypes.find(t => t.id === field.type)?.name}
                                      {field.required && ' • Obrigatório'}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setPreviewField(field);
                                      loadFieldConfig(field);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeField(field.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      </div>

      {/* Coluna Direita - Prévia */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Prévia do Campo</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Clique em um campo para ver sua aparência.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {previewField ? `Prévia: ${previewField.name}` : 'Selecione um campo'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {previewField ? (
              <>
                {/* CSS auxiliar para borda de foco com variável controlada - igual à página de formulários */}
                <style>{`
                  .focus-border:focus { border-color: var(--active-bc) !important; border-width: var(--focus-bw, 2px) !important; }
                  
                  /* Estilos para slider baseado no arquivo de referência */
                  .slider {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 100%;
                    height: 4px;
                    border-radius: 2px;
                    background: rgba(255,255,255,0.12);
                    outline: none;
                  }
                  
                  .slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #E50F5E;
                    border: 2px solid #fff;
                    cursor: pointer;
                  }
                  
                  .slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #E50F5E;
                    border: 2px solid #fff;
                    cursor: pointer;
                  }
                `}</style>
            <div className="space-y-2" style={{ marginBottom: '16px' }}>
              {(!fieldPlaceholder || ['checkbox', 'money', 'time', 'datetime', 'date', 'slider', 'address'].includes(previewField.type)) && (
                <Label 
                  htmlFor={`preview-${previewField.id}`}
                  style={{
                    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'`,
                    fontSize: '14px',
                    marginBottom: '8px',
                    color: 'white',
                    fontWeight: '500',
                    display: 'block'
                  }}
                >
                  {previewField.name}
                  {previewField.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              )}
              {renderFieldPreview(previewField)}
            </div>
                {/* Configurações do campo */}
                {previewField && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-sm font-medium">Configurações do Campo</h4>
                    

                    {/* 3. Caracteres (apenas para texto e textarea) */}
                    {(previewField.type === 'text' || previewField.type === 'textarea') && (
                      <div className="space-y-2">
                        <Label htmlFor="field-max-length" className="text-sm">
                          Caracteres
                        </Label>
                        <Input
                          id="field-max-length"
                          type="number"
                          value={fieldMaxLength || ''}
                          onChange={(e) => setFieldMaxLength(parseInt(e.target.value) || 0)}
                          placeholder="Limite de caracteres (0 = sem limite)"
                          className="text-sm"
                          min="0"
                        />
                        <p className="text-xs text-muted-foreground">
                          Digite 0 para sem limite de caracteres
                        </p>
                      </div>
                    )}





                    {/* 3. Limites (apenas para Monetário) */}
                    {previewField.type === 'money' && (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="field-money-limits" className="text-sm">
                          Limites
                        </Label>
                        <Switch
                          id="field-money-limits"
                          checked={fieldMoneyLimits}
                          onCheckedChange={setFieldMoneyLimits}
                        />
                      </div>
                    )}

                    {/* 4. Campos de valor mínimo e máximo (apenas para Monetário com limites) */}
                    {previewField.type === 'money' && fieldMoneyLimits && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="field-money-min" className="text-sm">
                            Valor mínimo
                          </Label>
                          <Input
                            id="field-money-min"
                            type="number"
                            step="0.01"
                            value={fieldMoneyMin}
                            onChange={(e) => setFieldMoneyMin(e.target.value)}
                            placeholder="0,00"
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="field-money-max" className="text-sm">
                            Valor máximo
                          </Label>
                          <Input
                            id="field-money-max"
                            type="number"
                            step="0.01"
                            value={fieldMoneyMax}
                            onChange={(e) => setFieldMoneyMax(e.target.value)}
                            placeholder="1000,00"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* 5. Moeda (apenas para Monetário) */}
                    {previewField.type === 'money' && (
                      <div className="space-y-2">
                        <Label htmlFor="field-money-currency" className="text-sm">
                          Moeda
                        </Label>
                        <Select value={fieldMoneyCurrency} onValueChange={setFieldMoneyCurrency}>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Selecione a moeda" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VARIABLES">Variáveis</SelectItem>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.code} value={currency.code}>
                                {currency.name} - {currency.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* 6. Configurações específicas para slider */}
                    {previewField.type === 'slider' && (
                      <>
                        {/* Limites */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="field-slider-limits" className="text-sm">
                            Limites
                          </Label>
                          <Switch
                            id="field-slider-limits"
                            checked={fieldSliderLimits}
                            onCheckedChange={setFieldSliderLimits}
                          />
                        </div>

                        {/* Campos de valor mínimo e máximo (apenas para Slider com limites) */}
                        {fieldSliderLimits && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="field-slider-min" className="text-sm">
                                Valor mínimo
                              </Label>
                              <Input
                                id="field-slider-min"
                                type="number"
                                value={fieldSliderMin}
                                onChange={(e) => setFieldSliderMin(e.target.value)}
                                placeholder="0"
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="field-slider-max" className="text-sm">
                                Valor máximo
                              </Label>
                              <Input
                                id="field-slider-max"
                                type="number"
                                value={fieldSliderMax}
                                onChange={(e) => setFieldSliderMax(e.target.value)}
                                placeholder="100"
                                className="text-sm"
                              />
                            </div>
                          </div>
                        )}

                        {/* Espaço entre valores */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="field-slider-step" className="text-sm">
                            Espaço entre valores
                          </Label>
                          <Switch
                            id="field-slider-step"
                            checked={fieldSliderStep}
                            onCheckedChange={setFieldSliderStep}
                          />
                        </div>

                        {/* Valor do espaçamento (apenas se Espaço entre valores estiver ativo) */}
                        {fieldSliderStep && (
                          <div className="space-y-2">
                            <Label htmlFor="field-slider-step-value" className="text-sm">
                              Valor
                            </Label>
                            <Input
                              id="field-slider-step-value"
                              type="number"
                              value={fieldSliderStepValue}
                              onChange={(e) => setFieldSliderStepValue(e.target.value)}
                              placeholder="1"
                              className="text-sm"
                              min="0.1"
                              step="0.1"
                            />
                          </div>
                        )}

                        {/* Start End */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="field-slider-start-end" className="text-sm">
                            Start End
                          </Label>
                          <Switch
                            id="field-slider-start-end"
                            checked={fieldSliderStartEnd}
                            onCheckedChange={setFieldSliderStartEnd}
                          />
                        </div>

                        {/* Campos Start e End (apenas se Start End estiver ativo) */}
                        {fieldSliderStartEnd && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="field-slider-start" className="text-sm">
                                Start
                              </Label>
                              <Input
                                id="field-slider-start"
                                type="text"
                                value={fieldSliderStart}
                                onChange={(e) => setFieldSliderStart(e.target.value)}
                                placeholder="Início"
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="field-slider-end" className="text-sm">
                                End
                              </Label>
                              <Input
                                id="field-slider-end"
                                type="text"
                                value={fieldSliderEnd}
                                onChange={(e) => setFieldSliderEnd(e.target.value)}
                                placeholder="Fim"
                                className="text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* 7. Configurações específicas para documento */}
                    {previewField.type === 'document' && (
                      <>
                        {/* CPF */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="field-document-cpf" className="text-sm">
                            CPF
                          </Label>
                          <Switch
                            id="field-document-cpf"
                            checked={fieldDocumentCpf}
                            onCheckedChange={(checked) => {
                              setFieldDocumentCpf(checked);
                              if (checked) {
                                setFieldDocumentCnpj(false);
                              }
                            }}
                          />
                        </div>

                        {/* CNPJ */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="field-document-cnpj" className="text-sm">
                            CNPJ
                          </Label>
                          <Switch
                            id="field-document-cnpj"
                            checked={fieldDocumentCnpj}
                            onCheckedChange={(checked) => {
                              setFieldDocumentCnpj(checked);
                              if (checked) {
                                setFieldDocumentCpf(false);
                              }
                            }}
                          />
                        </div>
                      </>
                    )}

                    {/* 8. Configurações específicas para conexão */}
                    {previewField.type === 'connection' && (
                      <>
                        {/* Adição */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="field-connection-addition" className="text-sm">
                            Adição
                          </Label>
                          <Switch
                            id="field-connection-addition"
                            checked={fieldConnectionAddition}
                            onCheckedChange={setFieldConnectionAddition}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="field-connection-list" className="text-sm">
                            Selecione a lista
                          </Label>
                          <Select value={fieldConnectionList} onValueChange={setFieldConnectionList}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma lista" />
                            </SelectTrigger>
                            <SelectContent>
                              {connectionLists.map((list) => (
                                <SelectItem key={list.id} value={list.id}>
                                  {list.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {/* 7. Configurações específicas para seleção */}
                    {previewField.type === 'select' && (
                      <>
                        {/* Pesquisa */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="field-searchable" className="text-sm">
                            Pesquisa
                          </Label>
                          <Switch
                            id="field-searchable"
                            checked={fieldSearchable}
                            onCheckedChange={setFieldSearchable}
                          />
                        </div>

                        {/* Multiseleção */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="field-multiselect" className="text-sm">
                            Multiseleção
                          </Label>
                          <Switch
                            id="field-multiselect"
                            checked={fieldMultiselect}
                            onCheckedChange={setFieldMultiselect}
                          />
                        </div>

                        {/* Opções */}
                        <div className="space-y-2">
                          <Label htmlFor="field-options" className="text-sm">
                            Opções
                          </Label>
                          <textarea
                            id="field-options"
                            value={fieldOptions}
                            onChange={(e) => setFieldOptions(e.target.value)}
                            placeholder="Digite as opções separadas por vírgula ou quebra de linha&#10;Exemplo:&#10;Opção 1, Opção 2, Opção 3&#10;ou&#10;Opção 1&#10;Opção 2&#10;Opção 3"
                            className="w-full p-3 border border-white/20 rounded-md text-sm resize-vertical min-h-20 bg-[#2A2A2A] text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                            style={{
                              fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'`,
                              fontSize: '16px',
                              backgroundColor: '#2A2A2A',
                              color: '#FFFFFF',
                              borderColor: '#FFFFFF33',
                              borderWidth: 1,
                              borderStyle: 'solid',
                              borderRadius: 12,
                              ['--active-bc' as any]: '#E50F5E',
                              ['--focus-bw' as any]: '2px'
                            }}
                            rows={4}
                          />
                          <p className="text-xs text-muted-foreground">
                            Separe as opções por vírgula ou quebra de linha
                          </p>
                        </div>
                      </>
                    )}

                    {/* 3. Configurações específicas para checkbox */}
                    {previewField.type === 'checkbox' && (
                      <>
                        {/* Modo botão */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="field-checkbox-button-mode" className="text-sm">
                            Modo botão
                          </Label>
                          <Switch
                            id="field-checkbox-button-mode"
                            checked={fieldCheckboxButtonMode}
                            onCheckedChange={setFieldCheckboxButtonMode}
                          />
                        </div>

                        {/* Multiseleção */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="field-checkbox-multiselect" className="text-sm">
                            Multiseleção
                          </Label>
                          <Switch
                            id="field-checkbox-multiselect"
                            checked={fieldCheckboxMultiselect}
                            onCheckedChange={setFieldCheckboxMultiselect}
                          />
                        </div>

                        {/* Limite (apenas se multiseleção estiver ativada) */}
                        {fieldCheckboxMultiselect && (
                          <div className="space-y-2">
                            <Label htmlFor="field-checkbox-limit" className="text-sm">
                              Limite
                            </Label>
                            <Input
                              id="field-checkbox-limit"
                              type="number"
                              value={fieldCheckboxLimit || ''}
                              onChange={(e) => setFieldCheckboxLimit(parseInt(e.target.value) || 0)}
                              placeholder="Limite de itens selecionáveis (0 = sem limite)"
                              className="text-sm"
                              min="0"
                            />
                            <p className="text-xs text-muted-foreground">
                              Digite 0 para sem limite de seleção
                            </p>
                          </div>
                        )}

                        {/* Colunas */}
                        <div className="space-y-2">
                          <Label htmlFor="field-checkbox-columns" className="text-sm">
                            Colunas
                          </Label>
                          <Input
                            id="field-checkbox-columns"
                            type="number"
                            value={fieldCheckboxColumns || ''}
                            onChange={(e) => setFieldCheckboxColumns(parseInt(e.target.value) || 1)}
                            placeholder="Número de colunas (1-10)"
                            className="text-sm"
                            min="1"
                            max="10"
                          />
                          <p className="text-xs text-muted-foreground">
                            Número de colunas para exibir as opções (1-10)
                          </p>
                        </div>

                        {/* Opções */}
                        <div className="space-y-2">
                          <Label htmlFor="field-checkbox-options" className="text-sm">
                            Opções
                          </Label>
                          <textarea
                            id="field-checkbox-options"
                            value={fieldCheckboxOptions}
                            onChange={(e) => setFieldCheckboxOptions(e.target.value)}
                            placeholder="Digite as opções separadas por vírgula ou quebra de linha&#10;Exemplo:&#10;Opção 1, Opção 2, Opção 3&#10;ou&#10;Opção 1&#10;Opção 2&#10;Opção 3"
                            className="w-full p-3 border border-white/20 rounded-md text-sm resize-vertical min-h-20 bg-[#2A2A2A] text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                            style={{
                              fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'`,
                              fontSize: '16px',
                              backgroundColor: '#2A2A2A',
                              color: '#FFFFFF',
                              borderColor: '#FFFFFF33',
                              borderWidth: 1,
                              borderStyle: 'solid',
                              borderRadius: 12,
                              ['--active-bc' as any]: '#E50F5E',
                              ['--focus-bw' as any]: '2px'
                            }}
                            rows={4}
                          />
                          <p className="text-xs text-muted-foreground">
                            Separe as opções por vírgula ou quebra de linha
                          </p>
                        </div>
                      </>
                    )}

                    {/* 4. Nome do campo */}
                    <div className="space-y-2">
                      <Label htmlFor="field-name" className="text-sm">
                        Nome do campo
                      </Label>
                      <Input
                        id="field-name"
                        value={fieldName}
                        onChange={(e) => handleFieldNameChange(e.target.value)}
                        placeholder="Nome do campo"
                        className="text-sm"
                      />
                    </div>

                    {/* 5. Texto do Placeholder (oculto se placeholder estiver ativado, for campo de data, hora, datetime, checkbox, slider, address ou money) */}
                    {!fieldPlaceholder && !['date', 'time', 'datetime', 'checkbox', 'slider', 'address', 'money'].includes(previewField.type) && (
                      <div className="space-y-2">
                        <Label htmlFor="field-placeholder-text" className="text-sm">
                          Texto do Placeholder
                        </Label>
                        <Input
                          id="field-placeholder-text"
                          value={fieldPlaceholderText}
                          onChange={(e) => setFieldPlaceholderText(e.target.value)}
                          placeholder="Digite o texto do placeholder"
                          className="text-sm"
                        />
                      </div>
                    )}

                    {/* 6. Sender */}
                    <div className="space-y-2">
                      <Label htmlFor="field-sender" className="text-sm">
                        Sender (nome do campo no webhook)
                      </Label>
                      <Input
                        id="field-sender"
                        value={fieldSender}
                        onChange={(e) => {
                          handleSenderChange(e.target.value);
                        }}
                        placeholder="nome_do_campo"
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Apenas letras minúsculas, números e underscores
                      </p>
                    </div>

                    {/* Botão Salvar */}
                    <Button 
                      onClick={saveFieldConfig}
                      className="w-full"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Salvar Configurações
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Clique no ícone de olho de um campo para ver sua prévia</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
