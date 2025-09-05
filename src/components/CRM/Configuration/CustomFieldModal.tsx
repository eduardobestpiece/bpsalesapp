import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { MultiSelect } from '@/components/ui/multiselect';
import { SelectWithSearch } from '@/components/ui/select-with-search';
import { useCreateCustomField, useUpdateCustomField } from '@/hooks/useCustomFields';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type CustomField = Tables<'custom_fields'>;

interface CustomFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  customField?: CustomField | null;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Área de texto' },
  { value: 'number', label: 'Número' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'date', label: 'Data' },
  { value: 'time', label: 'Hora' },
  { value: 'datetime', label: 'Data e hora' },
  { value: 'money', label: 'Valor monetário' },
  { value: 'multifield', label: 'Multi Campos' },
  { value: 'select', label: 'Seleção única' },
  { value: 'multiselect', label: 'Seleção múltipla' },
  { value: 'radio', label: 'Botão de rádio' }
];

const CURRENCIES = [
  { value: 'R$', label: 'R$ (Real Brasileiro)' },
  { value: '$', label: '$ (Dólar Americano)' },
  { value: '€', label: '€ (Euro)' },
  { value: '£', label: '£ (Libra Esterlina)' },
  { value: '¥', label: '¥ (Iene Japonês)' },
  { value: '₿', label: '₿ (Bitcoin)' },
  { value: '₽', label: '₽ (Rublo Russo)' },
  { value: '₹', label: '₹ (Rupia Indiana)' },
  { value: '₩', label: '₩ (Won Sul-Coreano)' },
  { value: '₪', label: '₪ (Shekel Israelense)' }
];



export function CustomFieldModal({ isOpen, onClose, customField }: CustomFieldModalProps) {
  const { selectedCompanyId } = useCompany();
  const [formData, setFormData] = useState({
    name: '',
    field_type: 'text',
    options: '',
    min_value: '',
    max_value: '',
    layout: 'vertical',
    fields_per_row: 1,
    multifield_config: []
  });
  const [previewCurrency, setPreviewCurrency] = useState('R$');
  const [previewMultiselectValues, setPreviewMultiselectValues] = useState<string[]>([]);
  const [previewSelectValue, setPreviewSelectValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string>('');
  const [previewLayout, setPreviewLayout] = useState<'horizontal' | 'vertical'>('vertical');
  const [multifieldConfig, setMultifieldConfig] = useState<Array<{name: string, type: string}>>([]);

  const createCustomFieldMutation = useCreateCustomField();
  const updateCustomFieldMutation = useUpdateCustomField();

  const isEditing = !!customField;



  useEffect(() => {
    if (customField) {
      // Tentar extrair layout do validation_rules
      let layout = 'vertical';
      let fieldsPerRow = 1;
      let multifieldConfig = [];
      
      if (customField.validation_rules) {
        try {
          const rules = JSON.parse(customField.validation_rules);
          layout = rules.layout || 'vertical';
          fieldsPerRow = rules.fields_per_row || 1;
          multifieldConfig = rules.multifield_config || [];
        } catch (e) {
          layout = 'vertical';
          fieldsPerRow = 1;
          multifieldConfig = [];
        }
      }
      
      setFormData({
        name: customField.name || '',
        field_type: customField.field_type || 'text',
        options: customField.options || '',
        min_value: customField.min_value || '',
        max_value: customField.max_value || '',
        layout: layout,
        fields_per_row: fieldsPerRow,
        multifield_config: multifieldConfig
      });
      setPreviewLayout(layout);
      setMultifieldConfig(multifieldConfig);
    } else {
      setFormData({
        name: '',
        field_type: 'text',
        options: '',
        min_value: '',
        max_value: '',
        layout: 'vertical',
        fields_per_row: 1,
        multifield_config: []
      });
      setPreviewLayout('vertical');
      setMultifieldConfig([]);
    }
  }, [customField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompanyId) {
      toast.error('Empresa não selecionada');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    // Não permitir criar novos campos checkbox
    if (!isEditing && formData.field_type === 'checkbox') {
      toast.error('Não é possível criar novos campos do tipo "Caixa de seleção"');
      return;
    }

    // Validar opções duplicadas antes de salvar
    if (formData.field_type !== 'multifield' && formData.options.trim()) {
      const error = validateOptions(formData.options);
      if (error) {
        setOptionsError(error);
        toast.error('Corrija as opções duplicadas antes de salvar');
        return;
      }
    }





    setIsLoading(true);

    // Debug: Log dos dados sendo enviados
    console.log('Dados sendo enviados:', {
      formData,
      selectedCompanyId,
      field_type: formData.field_type,
      field_type_type: typeof formData.field_type
    });

    try {
      if (isEditing && customField) {
        await updateCustomFieldMutation.mutateAsync({
          id: customField.id,
          name: formData.name.trim(),
          field_type: formData.field_type,
          options: formData.options.trim(),
          min_value: formData.min_value.trim(),
          max_value: formData.max_value.trim(),
          validation_rules: formData.field_type === 'radio' || formData.field_type === 'checkbox' 
            ? JSON.stringify({ layout: formData.layout })
            : formData.field_type === 'multifield'
            ? JSON.stringify({ 
                fields_per_row: formData.fields_per_row,
                multifield_config: multifieldConfig
              })
            : null,
          company_id: selectedCompanyId,
          status: 'active'
        });
        toast.success('Campo personalizado atualizado com sucesso!');
      } else {
        await createCustomFieldMutation.mutateAsync({
          name: formData.name.trim(),
          field_type: formData.field_type,
          options: formData.options.trim(),
          min_value: formData.min_value.trim(),
          max_value: formData.max_value.trim(),
          validation_rules: formData.field_type === 'radio' || formData.field_type === 'checkbox' 
            ? JSON.stringify({ layout: formData.layout })
            : formData.field_type === 'multifield'
            ? JSON.stringify({ 
                fields_per_row: formData.fields_per_row,
                multifield_config: multifieldConfig
              })
            : null,
          company_id: selectedCompanyId,
          status: 'active'
        });
        toast.success('Campo personalizado criado com sucesso!');
      }
      onClose();
      setFormData({
        name: '',
        field_type: 'text',
        options: '',
        min_value: '',
        max_value: '',
        layout: 'vertical',
        fields_per_row: 1,
        multifield_config: []
      });
      setMultifieldConfig([]);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar campo personalizado');
    } finally {
      setIsLoading(false);
    }
  };





  const showOptionsField = ['select', 'multiselect', 'radio'].includes(formData.field_type);
  const showMultifieldConfig = formData.field_type === 'multifield';
  const showLayoutField = ['radio', 'checkbox'].includes(formData.field_type);

  // Função para validar opções duplicadas
  const validateOptions = (optionsText: string) => {
    if (!optionsText.trim()) return '';
    
    const options = optionsText.split('\n').filter(option => option.trim());
    const uniqueOptions = new Set();
    const duplicates: string[] = [];
    
    options.forEach(option => {
      const trimmedOption = option.trim();
      if (uniqueOptions.has(trimmedOption)) {
        duplicates.push(trimmedOption);
      } else {
        uniqueOptions.add(trimmedOption);
      }
    });
    
    if (duplicates.length > 0) {
      return `Opções duplicadas encontradas: ${duplicates.join(', ')}`;
    }
    
    return '';
  };

  // Funções para gerenciar configuração do multifield
  const addMultifieldField = () => {
    setMultifieldConfig(prev => [...prev, { name: '', type: 'text' }]);
  };

  const removeMultifieldField = (index: number) => {
    setMultifieldConfig(prev => prev.filter((_, i) => i !== index));
  };

  const updateMultifieldField = (index: number, field: 'name' | 'type', value: string) => {
    setMultifieldConfig(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // Função para validar entrada de números (apenas números e uma vírgula)
  const validateNumberInput = (value: string) => {
    // Permitir apenas números e uma vírgula
    const regex = /^[0-9]*[,]?[0-9]*$/;
    return regex.test(value);
  };

  // Função para formatar entrada de números
  const formatNumberInput = (value: string) => {
    // Remover caracteres inválidos, mantendo apenas números e uma vírgula
    return value.replace(/[^0-9,]/g, '');
  };

  const renderFieldPreview = () => {
    const options = formData.options.split('\n').filter(option => option.trim());
    
    switch (formData.field_type) {
      case 'text':
        return (
          <Input
            type="text"
            placeholder="Digite aqui..."
            className="campo-brand brand-radius"
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            placeholder="Digite aqui..."
            rows={3}
            className="campo-brand brand-radius"
          />
        );
      
      case 'number':
        return (
          <Input
            type="text"
            placeholder="0"
            className="campo-brand brand-radius"
            onChange={(e) => {
              const inputValue = e.target.value;
              if (inputValue === '' || validateNumberInput(inputValue)) {
                // Permitir entrada vazia ou valores válidos
                e.target.value = inputValue;
              } else {
                // Formatar entrada inválida
                e.target.value = formatNumberInput(inputValue);
              }
            }}
            onKeyPress={(e) => {
              // Permitir apenas números, vírgula, backspace, delete, setas
              const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ',', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
              if (!allowedKeys.includes(e.key)) {
                e.preventDefault();
              }
            }}
          />
        );
      
      case 'email':
        return (
          <Input
            type="email"
            placeholder="exemplo@email.com"
            className="campo-brand brand-radius"
          />
        );
      
      case 'phone':
        return (
          <PhoneInput
            value=""
            onChange={() => {}}
            placeholder="Digite o telefone"
            className="w-full"
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            className="campo-brand brand-radius"
          />
        );
      
      case 'time':
        return (
          <Input
            type="time"
            className="campo-brand brand-radius"
          />
        );
      
      case 'datetime':
        return (
          <Input
            type="datetime-local"
            className="campo-brand brand-radius"
          />
        );
      
      case 'money':
        return (
          <div className="flex">
            <SelectWithSearch
              options={CURRENCIES}
              value={previewCurrency}
              onValueChange={setPreviewCurrency}
              className="w-20 border-r-0 rounded-r-none"
            />
            <Input
              type="number"
              placeholder="0,00"
              step="0.01"
              className="flex-1 rounded-l-none campo-brand brand-radius"
            />
          </div>
        );
      
      case 'select':
        const selectOptions = options.map((option, index) => ({
          value: option.trim(),
          label: option.trim()
        }));
        return (
          <SelectWithSearch
            options={selectOptions}
            value={previewSelectValue}
            onValueChange={setPreviewSelectValue}
            placeholder={options.length > 0 ? "Selecione uma opção" : "Nenhuma opção configurada"}
          />
        );
      
      case 'multiselect':
        const multiselectOptions = options.map((option, index) => ({
          value: option.trim(),
          label: option.trim()
        }));
        return (
                  <MultiSelect
          options={multiselectOptions}
          value={previewMultiselectValues}
          onChange={setPreviewMultiselectValues}
          placeholder="Selecione as opções..."
        />
        );
      
      case 'checkbox':
        return (
          <div className={previewLayout === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'}>
            {options.length > 0 ? (
              options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox />
                  <Label className="text-sm">{option.trim()}</Label>
                </div>
              ))
            ) : (
              <div className="flex items-center space-x-2">
                <Checkbox />
                <Label className="text-sm">Opção</Label>
              </div>
            )}
          </div>
        );
      
      case 'radio':
        return (
          <div className={previewLayout === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'}>
            {options.length > 0 ? (
              options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="preview-radio"
                    className="w-4 h-4 text-primary bg-background border-gray-300 rounded focus:ring-primary"
                  />
                  <Label className="text-sm">{option.trim()}</Label>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma opção configurada</p>
            )}
          </div>
        );
      
      case 'multifield':
        return (
          <div className="space-y-4">
            {multifieldConfig.length > 0 ? (
              <div>
                <div className="mb-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="brand-radius"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Grupo
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {multifieldConfig.map((field, index) => (
                    <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="grid grid-cols-1 gap-3" style={{ 
                        gridTemplateColumns: `repeat(${formData.fields_per_row}, 1fr)` 
                      }}>
                        <div>
                          <Label className="text-sm font-medium">{field.name || `Campo ${index + 1}`}</Label>
                          {field.type === 'money' ? (
                            <div className="flex mt-1">
                              <SelectWithSearch
                                options={CURRENCIES}
                                value={previewCurrency}
                                onValueChange={setPreviewCurrency}
                                className="w-20 border-r-0 rounded-r-none"
                              />
                              <Input
                                type="number"
                                placeholder="0,00"
                                step="0.01"
                                className="flex-1 rounded-l-none campo-brand brand-radius"
                              />
                            </div>
                          ) : field.type === 'phone' ? (
                            <PhoneInput
                              value=""
                              onChange={() => {}}
                              placeholder="Digite o telefone"
                              className="w-full mt-1"
                            />
                          ) : field.type === 'date' ? (
                            <Input
                              type="date"
                              className="campo-brand brand-radius mt-1"
                            />
                          ) : field.type === 'email' ? (
                            <Input
                              type="email"
                              placeholder="exemplo@email.com"
                              className="campo-brand brand-radius mt-1"
                            />
                          ) : field.type === 'number' ? (
                            <Input
                              type="number"
                              placeholder="0"
                              className="campo-brand brand-radius mt-1"
                            />
                          ) : (
                            <Input
                              type="text"
                              placeholder={`Digite ${field.name || `campo ${index + 1}`}...`}
                              className="campo-brand brand-radius mt-1"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-sm text-muted-foreground">Nenhum campo configurado</p>
                <p className="text-xs text-muted-foreground mt-1">Configure os campos do multi campo acima</p>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <Input
            type="text"
            placeholder="Campo não configurado"
            disabled
            className="campo-brand brand-radius"
          />
        );
    }
  };

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Campo Personalizado' : 'Novo Campo Personalizado'}
      actions={<Button type="submit" form="custom-field-form" variant="brandPrimaryToSecondary" className="brand-radius">{isLoading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}</Button>}
    >
      <form id="custom-field-form" onSubmit={handleSubmit} className="space-y-6 bg-[#1F1F1F] p-6 rounded-lg">
        <div>
          <Label htmlFor="name">Nome do Campo *</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Valor da proposta, Data de fechamento"
            required
            disabled={isLoading}
            className="campo-brand brand-radius"
          />
        </div>



        <div>
          <Label htmlFor="field_type">Tipo de Campo *</Label>
          <Select value={formData.field_type} onValueChange={(value) => {
            // Não permitir selecionar checkbox em novos campos
            if (!isEditing && value === 'checkbox') {
              toast.error('Não é possível criar novos campos do tipo "Caixa de seleção"');
              return;
            }
            setFormData(prev => ({ ...prev, field_type: value }));
            // Limpar erro de opções quando mudar o tipo de campo
            setOptionsError('');
            // Resetar layout para vertical quando mudar o tipo de campo
            setPreviewLayout('vertical');
            // Resetar configuração do multifield quando mudar o tipo de campo
            if (value !== 'multifield') {
              setMultifieldConfig([]);
            }
          }} disabled={isLoading}>
            <SelectTrigger className="select-trigger-brand brand-radius">
              <SelectValue placeholder="Selecione o tipo de campo" />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((type) => (
                <SelectItem 
                  key={type.value} 
                  value={type.value} 
                  className="dropdown-item-brand"
                  disabled={!isEditing && type.value === 'checkbox'}
                >
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showMultifieldConfig && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fields_per_row">Campos por Linha</Label>
              <Select
                value={formData.fields_per_row.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, fields_per_row: parseInt(value) }))}
                disabled={isLoading}
              >
                <SelectTrigger className="select-trigger-brand brand-radius">
                  <SelectValue placeholder="Selecione quantos campos por linha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1" className="dropdown-item-brand">1 campo por linha</SelectItem>
                  <SelectItem value="2" className="dropdown-item-brand">2 campos por linha</SelectItem>
                  <SelectItem value="3" className="dropdown-item-brand">3 campos por linha</SelectItem>
                  <SelectItem value="4" className="dropdown-item-brand">4 campos por linha</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Defina quantos campos serão exibidos por linha no formulário
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Campos do Multi Campo</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMultifieldField}
                  disabled={isLoading}
                  className="brand-radius"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Campo
                </Button>
              </div>
              
              {multifieldConfig.length === 0 ? (
                <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <p className="text-sm text-muted-foreground">Nenhum campo configurado</p>
                  <p className="text-xs text-muted-foreground mt-1">Clique em "Adicionar Campo" para começar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {multifieldConfig.map((field, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">Nome do Campo</Label>
                        <Input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateMultifieldField(index, 'name', e.target.value)}
                          placeholder="Ex: Grupo, Cota, Valor"
                          className="campo-brand brand-radius mt-1"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm font-medium">Tipo do Campo</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => updateMultifieldField(index, 'type', value)}
                        >
                          <SelectTrigger className="select-trigger-brand brand-radius mt-1">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text" className="dropdown-item-brand">Texto</SelectItem>
                            <SelectItem value="number" className="dropdown-item-brand">Número</SelectItem>
                            <SelectItem value="email" className="dropdown-item-brand">E-mail</SelectItem>
                            <SelectItem value="phone" className="dropdown-item-brand">Telefone</SelectItem>
                            <SelectItem value="date" className="dropdown-item-brand">Data</SelectItem>
                            <SelectItem value="money" className="dropdown-item-brand">Valor Monetário</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeMultifieldField(index)}
                        disabled={isLoading}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {showOptionsField && (
          <div>
            <Label htmlFor="options">
              {formData.field_type === 'multifield' ? 'Configuração dos Campos' : 'Opções (uma por linha)'}
            </Label>
            <Textarea
              id="options"
              value={formData.options}
              onChange={(e) => {
                const newValue = e.target.value;
                setFormData(prev => ({ ...prev, options: newValue }));
                
                // Validar opções duplicadas apenas para campos que não são multifield
                if (formData.field_type !== 'multifield') {
                  const error = validateOptions(newValue);
                  setOptionsError(error);
                } else {
                  setOptionsError('');
                }
              }}
              placeholder={
                formData.field_type === 'multifield' 
                  ? "Campo 1: Nome do campo, Tipo&#10;Campo 2: Nome do campo, Tipo&#10;Ex: Nome, Texto&#10;Idade, Número" 
                  : "Opção 1&#10;Opção 2&#10;Opção 3"
              }
              rows={4}
              disabled={isLoading}
              className={`campo-brand brand-radius ${optionsError ? 'border-red-500' : ''}`}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formData.field_type === 'multifield' 
                ? 'Digite cada campo em uma linha separada no formato: Nome, Tipo'
                : 'Digite cada opção em uma linha separada'
              }
            </p>
            {optionsError && (
              <p className="text-sm text-red-500 mt-1">
                {optionsError}
              </p>
            )}
          </div>
        )}

        {showLayoutField && (
          <div>
            <Label htmlFor="layout">Layout das Opções</Label>
            <Select
              value={formData.layout}
              onValueChange={(value: 'horizontal' | 'vertical') => {
                setFormData(prev => ({ ...prev, layout: value }));
                setPreviewLayout(value);
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="select-trigger-brand brand-radius">
                <SelectValue placeholder="Selecione o layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vertical" className="dropdown-item-brand">
                  Vertical (uma abaixo da outra)
                </SelectItem>
                <SelectItem value="horizontal" className="dropdown-item-brand">
                  Horizontal (uma ao lado da outra)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Defina como as opções serão exibidas no formulário
            </p>
          </div>
        )}

        {(formData.field_type === 'number' || formData.field_type === 'money') && (
          <div className="space-y-4">
            <Label>Regras</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_value">Número Mínimo</Label>
                <Input
                  id="min_value"
                  type="number"
                  value={formData.min_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_value: e.target.value }))}
                  placeholder="Ex: 0"
                  disabled={isLoading}
                  className="campo-brand brand-radius"
                />
              </div>
              <div>
                <Label htmlFor="max_value">Número Máximo</Label>
                <Input
                  id="max_value"
                  type="number"
                  value={formData.max_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_value: e.target.value }))}
                  placeholder="Ex: 1000000"
                  disabled={isLoading}
                  className="campo-brand brand-radius"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Defina os valores mínimo e máximo permitidos para este campo {formData.field_type === 'money' ? 'monetário' : 'numérico'} (opcional)
            </p>
          </div>
        )}





        <div>
          <Label>Preview do Campo</Label>
          <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800">
            <div className="space-y-2">
              <Label htmlFor="preview-field" className="text-sm font-medium">
                {formData.name || 'Nome do Campo'}
              </Label>
              {renderFieldPreview()}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Visualização de como o campo aparecerá no formulário
          </p>
        </div>

        <div className="flex justify-end space-x-2 pt-4"></div>
      </form>
    </FullScreenModal>
  );
} 