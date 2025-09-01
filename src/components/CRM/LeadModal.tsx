
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectWithSearch } from '@/components/ui/select-with-search';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCreateLead, useUpdateLead } from '@/hooks/useLeads';
import { useCrmUsers } from '@/hooks/useCrmUsers';
import { useSources } from '@/hooks/useSources';
import { useFunnels } from '@/hooks/useFunnels';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useLeadCustomFieldValues, useSaveLeadCustomFieldValues } from '@/hooks/useLeadCustomFieldValues';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { ChevronDown, Edit2, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  lead?: any;
}

export const LeadModal = ({ isOpen, onClose, companyId, lead }: LeadModalProps) => {
  const { crmUser } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const effectiveCompanyId = companyId || selectedCompanyId;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phoneDdi: '+55',
    sourceId: '',
    responsibleId: '',
    funnelId: '',
    stageId: ''
  });



  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');


  const [isEditingResponsible, setIsEditingResponsible] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [forceUpdate, setForceUpdate] = useState(0);
  const [localLead, setLocalLead] = useState<any>(null);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  // Hooks para buscar dados
  const { data: sources = [] } = useSources(effectiveCompanyId);
  const { data: crmUsers = [] } = useCrmUsers(effectiveCompanyId);
  const { data: allFunnels = [] } = useFunnels(effectiveCompanyId, 'active');
  const { data: customFields = [] } = useCustomFields();
  
  // Ordenar campos personalizados baseado na ordenação salva
  const orderedCustomFields = useMemo(() => {
    if (customFields.length === 0) return [];
    
    // Tentar carregar ordenação salva do localStorage
    const savedOrder = localStorage.getItem('customFieldsOrder');
    
    if (savedOrder) {
      try {
        const orderData = JSON.parse(savedOrder);
        return [...customFields].sort((a, b) => {
          const aOrder = orderData.find((item: any) => item.id === a.id)?.order ?? 999;
          const bOrder = orderData.find((item: any) => item.id === b.id)?.order ?? 999;
          return aOrder - bOrder;
        });
      } catch (error) {
        console.error('Erro ao carregar ordenação dos campos personalizados:', error);
        return customFields;
      }
    }
    
    return customFields;
  }, [customFields]);
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();
  
  // Hooks para campos personalizados
  const { data: existingCustomFieldValues = [] } = useLeadCustomFieldValues(lead?.id || '');
  const saveCustomFieldValuesMutation = useSaveLeadCustomFieldValues();

  // Estado para os valores dos campos personalizados
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  // Estado para as moedas selecionadas nos campos monetários
  const [currencyValues, setCurrencyValues] = useState<Record<string, string>>({});

  // Inicializar valores dos campos personalizados quando o lead muda ou quando dados são carregados
  useEffect(() => {
    if (!lead) {
      // Se não há lead (novo lead), limpar valores
      setCustomFieldValues({});
      return;
    }

    // Processar valores existentes quando disponíveis
    if (existingCustomFieldValues && existingCustomFieldValues.length > 0) {
      const values: Record<string, any> = {};
      existingCustomFieldValues.forEach((item: any) => {
        const fieldId = item.custom_field_id;
        let fieldValue = item.value;
        
        // Tentar fazer parse de JSON para campos multiselect
        try {
          const parsed = JSON.parse(fieldValue);
          if (Array.isArray(parsed)) {
            fieldValue = parsed;
          }
        } catch {
          // Se não for JSON válido, usar o valor como string
        }
        
        values[fieldId] = fieldValue;
      });

      setCustomFieldValues(values);
    } else if (existingCustomFieldValues && existingCustomFieldValues.length === 0) {
      // Se não há valores existentes, limpar
      setCustomFieldValues({});
    }
  }, [lead?.id, existingCustomFieldValues?.length]); // Dependência do lead ID e quantidade de valores existentes

  // Buscar cores da empresa para o estilo das abas
  const { data: branding } = useQuery({
    queryKey: ['company_branding', effectiveCompanyId],
    enabled: !!effectiveCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .maybeSingle();
      return data;
    }
  });

  const primaryColor = branding?.primary_color || '#A86F57';
  const secondaryColor = branding?.secondary_color || '#8B7355';

  // Função para lidar com mudanças nos campos personalizados
  const handleCustomFieldChange = useCallback((fieldId: string, newValue: any) => {
    // console.log('[LeadModal] handleCustomFieldChange chamado:', { 
    //   fieldId, 
    //   newValue, 
    //   newValueType: typeof newValue,
    //   newValueLength: newValue?.length
    // });
    setCustomFieldValues(prev => {
      const newValues = {
        ...prev,
        [fieldId]: newValue
      };
      // console.log('[LeadModal] Novos valores dos campos personalizados:', {
      //   previousValues: prev,
      //   newValues,
      //   changedField: fieldId,
      //   totalFields: Object.keys(newValues).length
      // });
      return newValues;
    });
  }, []);

  // Função para renderizar campos personalizados
  const renderCustomField = (field: any) => {
    const value = customFieldValues[field.id] || '';

    switch (field.field_type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
            className="brand-radius campo-primary-focus"
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
            className="w-full min-h-[80px] px-3 py-2 bg-background border border-input rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 brand-radius campo-primary-focus"
            rows={3}
          />
        );
      
      case 'number':
        return (
          <div className="space-y-1">
            <Input
              type="number"
              value={value}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
              placeholder={`Digite ${field.name.toLowerCase()}`}
              min={field.min_value || undefined}
              max={field.max_value || undefined}
              className="brand-radius campo-primary-focus"
            />
            {(field.min_value || field.max_value) && (
              <div className="text-xs text-muted-foreground">
                {field.min_value && field.max_value && (
                  <span>Valor entre {field.min_value} e {field.max_value}</span>
                )}
                {field.min_value && !field.max_value && (
                  <span>Valor mínimo: {field.min_value}</span>
                )}
                {!field.min_value && field.max_value && (
                  <span>Valor máximo: {field.max_value}</span>
                )}
              </div>
            )}
          </div>
        );
      
      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
            className="brand-radius campo-primary-focus"
          />
        );
      
      case 'phone':
        return (
          <PhoneInput
            value={value}
            onChange={(newValue) => handleCustomFieldChange(field.id, newValue)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
            className="w-full"
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className="brand-radius campo-primary-focus"
          />
        );
      
      case 'time':
        return (
          <Input
            type="time"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className="brand-radius campo-primary-focus"
          />
        );
      
      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className="brand-radius campo-primary-focus"
          />
        );
      
      case 'money':
        const selectedCurrency = currencyValues[field.id] || 'R$';
        return (
          <div className="space-y-1">
            <div className="flex">
              <SelectWithSearch
                options={CURRENCIES}
                value={selectedCurrency}
                onValueChange={(newCurrency) => {
                  setCurrencyValues(prev => ({
                    ...prev,
                    [field.id]: newCurrency
                  }));
                }}
                className="w-20 border-r-0 rounded-r-none"
              />
              <Input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                placeholder={`Digite ${field.name.toLowerCase()}`}
                min={field.min_value || undefined}
                max={field.max_value || undefined}
                className="flex-1 rounded-l-none brand-radius campo-primary-focus"
              />
            </div>
            {(field.min_value || field.max_value) && (
              <div className="text-xs text-muted-foreground">
                {field.min_value && field.max_value && (
                  <span>Valor entre {field.min_value} e {field.max_value}</span>
                )}
                {field.min_value && !field.max_value && (
                  <span>Valor mínimo: {field.min_value}</span>
                )}
                {!field.min_value && field.max_value && (
                  <span>Valor máximo: {field.max_value}</span>
                )}
              </div>
            )}
          </div>
        );
      
      case 'select':
        const selectOptions = field.options ? field.options.split('\n').filter((opt: string) => opt.trim()) : [];
        const selectOptionsFormatted = selectOptions.map((option: string, index: number) => ({
          value: option.trim(),
          label: option.trim()
        }));
        return (
          <SelectWithSearch
            options={selectOptionsFormatted}
            value={value}
            onValueChange={(newValue) => handleCustomFieldChange(field.id, newValue)}
            placeholder={`Selecione ${field.name.toLowerCase()}`}
            className="w-full brand-radius"
          />
        );
      
      case 'multiselect':
        const multiselectOptions = field.options ? field.options.split('\n').filter((opt: string) => opt.trim()) : [];
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {multiselectOptions.map((option: string, index: number) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.trim())}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option.trim()]
                      : selectedValues.filter((v: string) => v !== option.trim());
                    handleCustomFieldChange(field.id, newValues);
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-white">{option.trim()}</span>
              </label>
            ))}
          </div>
        );
      

      
      case 'checkbox':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-white">Marcar como {field.name.toLowerCase()}</span>
          </label>
        );
      
      case 'radio':
        const radioOptions = field.options ? field.options.split('\n').filter((opt: string) => opt.trim()) : [];
        return (
          <div className="space-y-2">
            {radioOptions.map((option: string, index: number) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`radio-${field.id}`}
                  value={option.trim()}
                  checked={value === option.trim()}
                  onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-white">{option.trim()}</span>
              </label>
            ))}
          </div>
        );
      
      case 'multifield':
        // Extrair configuração do multifield
        let multifieldConfig: any[] = [];
        let fieldsPerRow = 1;
        
        if (field.validation_rules) {
          try {
            const rules = JSON.parse(field.validation_rules);
            multifieldConfig = rules.multifield_config || [];
            fieldsPerRow = rules.fields_per_row || 1;
          } catch (e) {
            console.error('Erro ao carregar configuração do multifield:', e);
          }
        }
        
        // Obter valores atuais do campo multifield
        const multifieldValues = Array.isArray(value) ? value : [];
        
        const addMultifieldGroup = () => {
          const newGroup = multifieldConfig.map(fieldConfig => ({
            fieldName: fieldConfig.name,
            fieldType: fieldConfig.type,
            value: ''
          }));
          handleCustomFieldChange(field.id, [...multifieldValues, newGroup]);
        };
        
        const removeMultifieldGroup = (groupIndex: number) => {
          const newValues = multifieldValues.filter((_, index) => index !== groupIndex);
          handleCustomFieldChange(field.id, newValues);
        };
        
        const updateMultifieldValue = (groupIndex: number, fieldIndex: number, newValue: string) => {
          const newValues = [...multifieldValues];
          if (!newValues[groupIndex]) {
            newValues[groupIndex] = multifieldConfig.map(fieldConfig => ({
              fieldName: fieldConfig.name,
              fieldType: fieldConfig.type,
              value: ''
            }));
          }
          newValues[groupIndex][fieldIndex].value = newValue;
          handleCustomFieldChange(field.id, newValues);
        };
        
        return (
          <div className="space-y-4">
            {multifieldValues.map((group, groupIndex) => (
              <div key={groupIndex} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">Grupo {groupIndex + 1}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMultifieldGroup(groupIndex)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid gap-3" style={{ 
                  gridTemplateColumns: `repeat(${fieldsPerRow}, 1fr)` 
                }}>
                  {multifieldConfig.map((fieldConfig, fieldIndex) => (
                    <div key={fieldIndex}>
                      <Label className="text-sm font-medium text-white">
                        {fieldConfig.name || `Campo ${fieldIndex + 1}`}
                      </Label>
                      {fieldConfig.type === 'money' ? (
                        <div className="flex mt-1">
                          <SelectWithSearch
                            options={CURRENCIES}
                            value={selectedCurrency}
                            onValueChange={(newCurrency) => {
                              setCurrencyValues(prev => ({
                                ...prev,
                                [`${field.id}-${groupIndex}-${fieldIndex}`]: newCurrency
                              }));
                            }}
                            className="w-20 border-r-0 rounded-r-none"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            value={group[fieldIndex]?.value || ''}
                            onChange={(e) => updateMultifieldValue(groupIndex, fieldIndex, e.target.value)}
                            placeholder="0,00"
                            className="flex-1 rounded-l-none brand-radius campo-primary-focus"
                          />
                        </div>
                      ) : fieldConfig.type === 'phone' ? (
                        <PhoneInput
                          value={group[fieldIndex]?.value || ''}
                          onChange={(newValue) => updateMultifieldValue(groupIndex, fieldIndex, newValue)}
                          placeholder="Digite o telefone"
                          className="w-full mt-1"
                        />
                      ) : fieldConfig.type === 'date' ? (
                        <Input
                          type="date"
                          value={group[fieldIndex]?.value || ''}
                          onChange={(e) => updateMultifieldValue(groupIndex, fieldIndex, e.target.value)}
                          className="brand-radius campo-primary-focus mt-1"
                        />
                      ) : fieldConfig.type === 'email' ? (
                        <Input
                          type="email"
                          value={group[fieldIndex]?.value || ''}
                          onChange={(e) => updateMultifieldValue(groupIndex, fieldIndex, e.target.value)}
                          placeholder="exemplo@email.com"
                          className="brand-radius campo-primary-focus mt-1"
                        />
                      ) : fieldConfig.type === 'number' ? (
                        <Input
                          type="number"
                          value={group[fieldIndex]?.value || ''}
                          onChange={(e) => updateMultifieldValue(groupIndex, fieldIndex, e.target.value)}
                          placeholder="0"
                          className="brand-radius campo-primary-focus mt-1"
                        />
                      ) : (
                        <Input
                          type="text"
                          value={group[fieldIndex]?.value || ''}
                          onChange={(e) => updateMultifieldValue(groupIndex, fieldIndex, e.target.value)}
                          placeholder={`Digite ${fieldConfig.name || `campo ${fieldIndex + 1}`}...`}
                          className="brand-radius campo-primary-focus mt-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addMultifieldGroup}
              className="brand-radius"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Grupo
            </Button>
          </div>
        );
      
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
            className="brand-radius campo-primary-focus"
          />
        );
    }
  };

  // Filtrar funis baseado nas permissões do usuário
  const allowedFunnels = React.useMemo(() => {
    if (!allFunnels || !crmUser) return [];
    
    // Se for master ou admin, tem acesso a todos os funis
    if (crmUser.role === 'master' || crmUser.role === 'admin') {
      return allFunnels;
    }
    
    // Se for user ou leader, verificar funis atribuídos
    const assignedFunnels = crmUser.funnels || [];
    if (Array.isArray(assignedFunnels) && assignedFunnels.length > 0) {
      return allFunnels.filter(funnel => assignedFunnels.includes(funnel.id));
    }
    
    // Se não tem funis atribuídos, não tem acesso a nenhum
    return [];
  }, [allFunnels, crmUser]);

  // Buscar fases do funil selecionado
  const selectedFunnel = React.useMemo(() => {
    return allowedFunnels.find(funnel => funnel.id === formData.funnelId);
  }, [allowedFunnels, formData.funnelId]);

  const funnelStages = React.useMemo(() => {
    if (!selectedFunnel || !selectedFunnel.stages) return [];
    return selectedFunnel.stages.sort((a: any, b: any) => a.stage_order - b.stage_order);
  }, [selectedFunnel]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (lead) {
        // Edit mode
        setFormData({
          firstName: lead.first_name || '',
          lastName: lead.last_name || '',
          email: lead.email || '',
          phone: lead.phone || '',
          phoneDdi: lead.phone_ddi || '+55',
          sourceId: lead.source_id || 'none',
          responsibleId: lead.responsible_id || '',
          funnelId: lead.funnel_id || 'none',
          stageId: lead.current_stage_id || 'none'
        });
        // Inicializar lead local
        setLocalLead({ ...lead });
      } else {
        // Create mode
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          phoneDdi: '+55',
          sourceId: 'none',
          responsibleId: crmUser?.id || '',
          funnelId: allowedFunnels.length > 0 ? allowedFunnels[0].id : 'none',
          stageId: 'none'
        });
        setLocalLead(null);
      }
      setEmailError('');
    }
  }, [isOpen, lead?.id, crmUser?.id, allowedFunnels.length]);





  // Reset stage when funnel changes
  useEffect(() => {
    if (formData.funnelId && formData.funnelId !== 'none' && funnelStages.length > 0) {
      setFormData(prev => ({
        ...prev,
        stageId: funnelStages[0].id
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        stageId: 'none'
      }));
    }
  }, [formData.funnelId, funnelStages]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validar email em tempo real
    if (field === 'email') {
      if (value && !validateEmail(value)) {
        setEmailError('Email inválido');
      } else {
        setEmailError('');
      }
    }
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Se o valor contém espaço, mover para o campo sobrenome
    if (value.includes(' ')) {
      const parts = value.split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');
      
      setFormData(prev => ({
        ...prev,
        firstName: firstName,
        lastName: lastName
      }));
      
      // Mover foco para o campo sobrenome
      setTimeout(() => {
        const lastNameInput = document.getElementById('lastName') as HTMLInputElement;
        if (lastNameInput) {
          lastNameInput.focus();
          // Posicionar o cursor no final do texto
          lastNameInput.setSelectionRange(lastName.length, lastName.length);
        }
      }, 0);
    } else {
      // Se não tem espaço, apenas atualizar o nome
      setFormData(prev => ({ ...prev, firstName: value }));
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({ ...prev, phone: value }));
  };



  // Obter usuário responsável selecionado
  const selectedResponsible = React.useMemo(() => {
    return crmUsers.find(user => user.id === formData.responsibleId);
  }, [crmUsers, formData.responsibleId]);

  // Obter funil e fase atual do lead
  const selectedFunnelForLead = React.useMemo(() => {
    if (!lead) return null;
    // Se estamos editando e o formData.funnelId foi alterado, usar o novo valor
    const funnelIdToUse = formData.funnelId !== 'none' ? formData.funnelId : lead.funnel_id;
    return allowedFunnels.find(funnel => funnel.id === funnelIdToUse);
  }, [allowedFunnels.length, lead?.funnel_id, formData.funnelId]);

  const currentStageForLead = React.useMemo(() => {
    if (!selectedFunnelForLead || !lead) return null;
    return selectedFunnelForLead.stages?.find(stage => stage.id === lead.current_stage_id);
  }, [selectedFunnelForLead?.id, lead?.current_stage_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // console.log('[LeadModal] ===== INÍCIO DO HANDLE SUBMIT =====');
    // console.log('[LeadModal] handleSubmit iniciado');
    // console.log('[LeadModal] Estado atual:', {
    //   selectedCompanyId,
    //   lead,
    //   customFieldValues,
    //   formData
    // });
    
    if (!selectedCompanyId) {
      toast.error('Empresa não selecionada');
      return;
    }

    const formDataToSubmit = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      phone_ddi: formData.phoneDdi,
      responsible_id: formData.responsibleId,
      funnel_id: formData.funnelId === 'none' ? null : formData.funnelId,
      current_stage_id: formData.stageId === 'none' ? null : formData.stageId,
      source_id: formData.sourceId === 'none' ? null : formData.sourceId,
      company_id: selectedCompanyId,
      status: 'active'
    };

    // console.log('[LeadModal] Dados para submissão:', formDataToSubmit);

    try {
      let savedLeadId = lead?.id;

      if (lead) {
        // console.log('[LeadModal] Editando lead existente:', lead.id);
        // Se estamos editando um lead, não sobrescrever a fase se ela foi atualizada pelo funil
        const updateData = { ...formDataToSubmit };
        
        // Se o localLead tem uma fase diferente da original, manter a fase atualizada
        if (localLead && localLead.current_stage_id !== lead.current_stage_id) {
          // console.log('[LeadModal] Mantendo fase atualizada pelo funil:', {
          //   originalStageId: lead.current_stage_id,
          //   currentStageId: localLead.current_stage_id
          // });
          updateData.current_stage_id = localLead.current_stage_id;
        }
        
        await updateLeadMutation.mutateAsync({
          id: lead.id,
          ...updateData
        });
        // console.log('[LeadModal] Lead atualizado com sucesso');
        toast.success('Lead atualizado com sucesso!');
      } else {
        // console.log('[LeadModal] Criando novo lead');
        const newLead = await createLeadMutation.mutateAsync(formDataToSubmit);
        savedLeadId = newLead.id;
        // console.log('[LeadModal] Novo lead criado com ID:', savedLeadId);
        toast.success('Lead criado com sucesso!');
      }

      // Salvar campos personalizados
      // console.log('[LeadModal] === INÍCIO SALVAMENTO CAMPOS PERSONALIZADOS ===');
      // console.log('[LeadModal] Dados para salvamento:', {
      //   savedLeadId,
      //   customFieldValues,
      //   hasValues: Object.keys(customFieldValues).length > 0,
      //   customFieldValuesKeys: Object.keys(customFieldValues),
      //   customFieldValuesValues: Object.values(customFieldValues)
      // });
      
      if (savedLeadId && Object.keys(customFieldValues).length > 0) {
        // console.log('[LeadModal] Condições atendidas, salvando campos personalizados...');
        try {
          const result = await saveCustomFieldValuesMutation.mutateAsync({
            leadId: savedLeadId,
            customFieldValues: customFieldValues
          });
          // console.log('[LeadModal] Campos personalizados salvos com sucesso:', result);
        } catch (error: any) {
          console.error('[LeadModal] Erro ao salvar campos personalizados:', error);
          
          // Verificar se é erro de validação
          if (error.message && error.message.includes('Erros de validação:')) {
            toast.error(error.message);
            // Não fechar o modal em caso de erro de validação
            return;
          } else {
            console.error('[LeadModal] Detalhes do erro:', {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint
            });
            toast.error('Lead salvo, mas houve erro ao salvar campos personalizados');
          }
        }
      } else {
        // console.log('[LeadModal] Não salvando campos personalizados:', {
        //   reason: !savedLeadId ? 'sem leadId' : 'sem valores',
        //   savedLeadId,
        //   customFieldValues,
        //   customFieldValuesLength: Object.keys(customFieldValues).length
        // });
      }
      // console.log('[LeadModal] === FIM SALVAMENTO CAMPOS PERSONALIZADOS ===');
      
      // console.log('[LeadModal] ===== FIM DO HANDLE SUBMIT - SUCESSO =====');
      onClose();
    } catch (error: any) {
      console.error('[LeadModal] ===== FIM DO HANDLE SUBMIT - ERRO =====');
      console.error('[LeadModal] Erro ao salvar lead:', error);
      toast.error(error.message || 'Erro ao salvar lead');
    }
  };



  // Componente de título editável COMPLETAMENTE ISOLADO
  const EditableTitle = React.memo(() => {
    console.log('[EditableTitle] Renderizando componente');
    
    // Estados internos do componente (isolados do pai)
    const [internalIsEditing, setInternalIsEditing] = React.useState(false);
    const [internalFirstName, setInternalFirstName] = React.useState('');
    const [internalLastName, setInternalLastName] = React.useState('');
    
    // Refs para controle de foco
    const firstNameRef = React.useRef<HTMLInputElement>(null);
    const lastNameRef = React.useRef<HTMLInputElement>(null);
    
    // Inicializar valores quando o lead mudar
    React.useEffect(() => {
      if (lead) {
        setInternalFirstName(formData.firstName);
        setInternalLastName(formData.lastName);
      }
    }, [lead?.id, formData.firstName, formData.lastName]);
    
    // Focar no primeiro campo quando entrar em modo de edição
    React.useEffect(() => {
      if (internalIsEditing && firstNameRef.current) {
        console.log('[EditableTitle] Focando no campo nome');
        firstNameRef.current.focus();
      }
    }, [internalIsEditing]);
    
    // Funções internas
    const handleStartEdit = () => {
      console.log('[EditableTitle] Iniciando edição');
      setInternalIsEditing(true);
    };
    
    const handleSave = () => {
      console.log('[EditableTitle] Salvando');
      setFormData(prev => ({
        ...prev,
        firstName: internalFirstName,
        lastName: internalLastName
      }));
      setInternalIsEditing(false);
    };
    
    const handleCancel = () => {
      console.log('[EditableTitle] Cancelando');
      setInternalFirstName(formData.firstName);
      setInternalLastName(formData.lastName);
      setInternalIsEditing(false);
    };
    
    if (!lead) return <span>Novo Lead</span>;
    
    const borderRadius = branding?.border_radius || '8px';
    
    if (internalIsEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            ref={firstNameRef}
            value={internalFirstName}
            onChange={(e) => {
              console.log('[EditableTitle] Input Nome onChange:', e.target.value);
              setInternalFirstName(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                lastNameRef.current?.focus();
              } else if (e.key === 'Enter') {
                handleSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            className="w-32 h-8 text-sm bg-[#1F1F1F] text-white font-semibold editable-title-input transition-all duration-200"
            style={{
              borderRadius: borderRadius
            }}
            placeholder="Nome"
          />
          <Input
            ref={lastNameRef}
            value={internalLastName}
            onChange={(e) => {
              console.log('[EditableTitle] Input Sobrenome onChange:', e.target.value);
              setInternalLastName(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                firstNameRef.current?.focus();
              } else if (e.key === 'Enter') {
                handleSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            className="w-32 h-8 text-sm bg-[#1F1F1F] text-white font-semibold editable-title-input transition-all duration-200"
            style={{
              borderRadius: borderRadius
            }}
            placeholder="Sobrenome"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleSave}
            className="h-6 w-6 p-0 text-green-400 hover:text-green-300 hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent border-0 shadow-none"
          >
            ✓
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent border-0 shadow-none"
          >
            ✕
          </Button>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <span className="text-white font-semibold">
          {formData.firstName} {formData.lastName}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleStartEdit}
          className="h-6 w-6 p-0 text-white hover:text-white hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
    );
  });

  // Componente de usuário responsável editável
  const EditableResponsible = () => {
    if (!selectedResponsible) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-xs">?</AvatarFallback>
          </Avatar>
          <span className="text-sm">Selecionar usuário</span>
        </div>
      );
    }

    if (isEditingResponsible) {
      return (
        <div className="flex items-center gap-2">
          <Select
            value={formData.responsibleId}
            onValueChange={(value) => {
              handleInputChange('responsibleId', value);
              setIsEditingResponsible(false);
            }}
          >
            <SelectTrigger className="w-48 h-8 text-sm bg-transparent border border-white/20 text-white select-trigger-primary">
              <SelectValue placeholder="Selecione o usuário" />
            </SelectTrigger>
            <SelectContent className="dropdown-item-brand">
              {crmUsers.map((user) => (
                <SelectItem key={user.id} value={user.id || 'none'} className="lead-dropdown-item">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.first_name} {user.last_name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditingResponsible(false)}
            className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
          >
            ✕
          </Button>
        </div>
      );
    }

    return (
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-white/10 rounded px-2 py-1 transition-colors"
        onClick={() => setIsEditingResponsible(true)}
      >
        <Avatar className="w-6 h-6">
          <AvatarImage src={selectedResponsible.avatar_url} />
          <AvatarFallback className="text-xs">
            {selectedResponsible.first_name?.[0]}{selectedResponsible.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm text-white">
          {selectedResponsible.first_name} {selectedResponsible.last_name}
        </span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </div>
    );
  };

  // Estado para edição do funil
  const [isEditingFunnel, setIsEditingFunnel] = useState(false);

  // Componente do nome do funil editável
  const EditableFunnelName = () => {
    if (isEditingFunnel) {
      return (
        <div className="flex items-center gap-2">
          <Select
            value={formData.funnelId}
            onValueChange={(value) => {
              console.log('[EditableFunnelName] Funil alterado:', value);
              handleInputChange('funnelId', value);
              // Resetar a fase quando o funil for alterado
              handleInputChange('stageId', 'none');
              setIsEditingFunnel(false);
            }}
          >
            <SelectTrigger className="w-48 h-8 text-sm bg-gray-700 border border-gray-600 text-white select-trigger-primary">
              <SelectValue placeholder="Selecione o funil" />
            </SelectTrigger>
            <SelectContent className="dropdown-item-brand">
              <SelectItem value="none" className="lead-dropdown-item">
                <span className="text-muted-foreground">Nenhum funil</span>
              </SelectItem>
              {allowedFunnels.map((funnel) => (
                <SelectItem key={funnel.id} value={funnel.id} className="lead-dropdown-item">
                  <span>{funnel.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditingFunnel(false)}
            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent"
          >
            ✕
          </Button>
        </div>
      );
    }

    return (
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-600 rounded px-2 py-1 transition-colors"
        onClick={() => setIsEditingFunnel(true)}
      >
        <div 
          className="bg-gray-700 text-white px-4 py-2 rounded-l-lg font-medium text-sm"
          style={{ clipPath: 'polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)' }}
        >
          {selectedFunnelForLead.name}
        </div>
        <Edit2 className="w-3 h-3 text-gray-400" />
      </div>
    );
  };

  // Componente do funil visual
  const FunnelVisual = React.useMemo(() => {
    // Remover console.log para reduzir re-renders
    if (!localLead || !selectedFunnelForLead) {
      return null;
    }
    
    if (!localLead || !selectedFunnelForLead) {
      return null;
    }

    const stages = selectedFunnelForLead.stages || [];
    const currentStageIndex = stages.findIndex(stage => stage.id === localLead.current_stage_id);
    const isWon = localLead.status === 'won';
    const isLost = localLead.status === 'lost';

    const handleStageClick = async (stageId: string) => {
      if (stageId === localLead.current_stage_id) {
        console.log('[FunnelVisual] Tentativa de clicar na fase atual, ignorando...');
        return; // Não fazer nada se clicar na fase atual
      }

      if (isUpdatingStage) {
        console.log('[FunnelVisual] Atualização já em andamento, ignorando...');
        return; // Não fazer nada se já estiver atualizando
      }

      console.log('[FunnelVisual] Iniciando atualização de fase:', {
        leadId: localLead.id,
        currentStageId: localLead.current_stage_id,
        newStageId: stageId,
        localLead: JSON.stringify(localLead, null, 2)
      });

      setSelectedStageId(stageId);
      setIsUpdatingStage(true);
      
      try {
        // Aguardar um pequeno delay para evitar múltiplas chamadas
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const result = await updateLeadMutation.mutateAsync({
          id: localLead.id,
          current_stage_id: stageId
        });
        
        console.log('[FunnelVisual] Resultado da atualização:', result);
        
        toast.success('Fase do lead atualizada com sucesso!');
        
        // Atualizar o lead localmente para refletir a mudança
        setLocalLead(prev => {
          const updatedLead = {
            ...prev,
            current_stage_id: stageId
          };
          console.log('[FunnelVisual] setLocalLead chamado:', {
            previousStageId: prev?.current_stage_id,
            newStageId: stageId,
            updatedLead
          });
          return updatedLead;
        });
        
        // Forçar re-render do componente
        setSelectedStageId(''); // Reset do estado de seleção
        setForceUpdate(prev => prev + 1); // Forçar re-render
        
        console.log('[FunnelVisual] Lead atualizado localmente:', {
          leadId: localLead.id,
          newCurrentStageId: stageId
        });
        
        // Aguardar mais um pouco antes de liberar para próxima atualização
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: any) {
        console.error('[FunnelVisual] Erro ao atualizar fase do lead:', error);
        toast.error(error.message || 'Erro ao atualizar fase do lead');
        setSelectedStageId('');
      } finally {
        setIsUpdatingStage(false);
      }
    };

    return (
      <div className="w-full bg-[#1F1F1F] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          {/* Nome da fase atual do funil */}
          <div className="flex items-center">
            {isEditingFunnel ? (
              <div className="flex items-center gap-2">
                <Select
                  value={formData.funnelId}
                  onValueChange={(value) => {
                    console.log('[EditableFunnelName] Funil alterado:', value);
                    handleInputChange('funnelId', value);
                    // Resetar a fase quando o funil for alterado
                    handleInputChange('stageId', 'none');
                    
                    // Atualizar o localLead para refletir a mudança do funil
                    if (localLead) {
                      const newFunnel = allowedFunnels.find(f => f.id === value);
                      const firstStage = newFunnel?.stages?.[0];
                      
                      setLocalLead(prev => ({
                        ...prev,
                        funnel_id: value === 'none' ? null : value,
                        current_stage_id: firstStage?.id || null
                      }));
                      
                      console.log('[EditableFunnelName] LocalLead atualizado:', {
                        newFunnelId: value,
                        newStageId: firstStage?.id || null,
                        newFunnel: newFunnel?.name
                      });
                    }
                    
                    setIsEditingFunnel(false);
                  }}
                >
                  <SelectTrigger 
                    className="w-48 h-8 text-sm text-white funnel-select-trigger"
                    style={{
                      borderRadius: branding?.border_radius || '8px'
                    }}
                  >
                    <SelectValue placeholder="Selecione o funil" />
                  </SelectTrigger>
                  <SelectContent className="dropdown-item-brand">
                    <SelectItem value="none" className="lead-dropdown-item">
                      <span className="text-muted-foreground">Nenhum funil</span>
                    </SelectItem>
                    {allowedFunnels.map((funnel) => (
                      <SelectItem key={funnel.id} value={funnel.id} className="lead-dropdown-item">
                        <span>{funnel.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingFunnel(false)}
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent"
                >
                  ✕
                </Button>
              </div>
            ) : (
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-transparent transition-colors"
                onClick={() => setIsEditingFunnel(true)}
              >
                <span className="text-white font-medium text-sm">
                  {selectedFunnelForLead ? selectedFunnelForLead.name : 'Selecione'}
                </span>
                <Edit2 className="w-3 h-3 text-gray-400 hover:text-white transition-colors" />
              </div>
            )}
          </div>

          {/* Fases do funil */}
          <div className="flex items-center flex-1 mx-4 justify-between">
            {selectedFunnelForLead && stages.length > 0 ? (
              stages.map((stage, index) => {
                const isCurrentStage = stage.id === localLead.current_stage_id;
                const isPreviousStage = index < currentStageIndex;
                const isSelected = stage.id === selectedStageId;
                const stageColor = isCurrentStage ? primaryColor : (isPreviousStage ? secondaryColor : '#131313');
                
                return (
                  <div 
                    key={`${stage.id}-${forceUpdate}`}
                    className={`flex flex-col items-start flex-1 cursor-pointer transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-blue-400 ring-opacity-50 rounded' : ''
                    } hover:opacity-80`}
                    style={{ marginRight: index < stages.length - 1 ? '3px' : '0' }}
                    onClick={() => handleStageClick(stage.id)}
                    title={`Clique para mover o lead para a fase: ${stage.name}`}
                  >
                    <div className="text-white text-xs font-medium mb-1 text-left w-full">
                      {stage.name}
                    </div>
                    <div 
                      className="py-2 text-white text-xs font-medium w-full"
                      style={{ 
                        backgroundColor: stageColor,
                        clipPath: 'polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)',
                        textAlign: 'center'
                      }}
                    >
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center flex-1">
                <span className="text-gray-400 text-sm">Selecione</span>
              </div>
            )}
          </div>

          {/* Saída do funil */}
          <div className="flex items-center">
            <div 
              className="bg-gray-700 text-white px-4 py-2 rounded-r-lg font-medium text-sm"
              style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 15% 100%, 0 50%)' }}
            >
              {isWon ? 'Ganho' : isLost ? 'Perdido' : 'Resultado'}
            </div>
          </div>
        </div>
      </div>
    );
      }, [localLead?.id, localLead?.current_stage_id, localLead?.status, selectedFunnelForLead?.id, selectedStageId, forceUpdate, primaryColor, secondaryColor, updateLeadMutation]);

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={<EditableTitle />}
      actions={
        <div className="flex items-center gap-4">
          <EditableResponsible />
          <Button
            type="button"
            disabled={isSubmitting || !!emailError}
            variant="brandPrimaryToSecondary"
            className="brand-radius"
            onClick={(e) => {
              e.preventDefault();
              // console.log('[LeadModal] Botão Salvar clicado!');
              // console.log('[LeadModal] Estado no momento do clique:', {
              //   isSubmitting,
              //   emailError,
              //   lead,
              //   customFieldValues,
              //   formData,
              //   selectedCompanyId
              // });
              
              // Chamar handleSubmit diretamente
              // console.log('[LeadModal] Chamando handleSubmit diretamente...');
              handleSubmit(e as any);
            }}
          >
            {isSubmitting ? 'Criando...' : (lead ? 'Salvar' : 'Criar Lead')}
          </Button>
        </div>
      }
    >
      {lead ? (
        <>
          {/* Modal de Edição com Abas */}
          <div className="w-full">
            {FunnelVisual}
          </div>
          <div className="w-full mt-6 bg-[#1F1F1F] rounded-lg p-0">
            <Tabs defaultValue="contato" className="w-full">
              <TabsList className="flex items-end border-b border-border/30 bg-transparent p-0 rounded-none justify-start w-fit">
                <TabsTrigger 
                  value="contato" 
                  className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[var(--tab-active-color)]"
                  style={{ 
                    '--tab-active-color': primaryColor 
                  } as React.CSSProperties}
                >
                  Contato
                </TabsTrigger>
                <div className="w-px h-6 bg-border/30 self-center"></div>
                <TabsTrigger 
                  value="adicionais" 
                  className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[var(--tab-active-color)]"
                  style={{ 
                    '--tab-active-color': primaryColor 
                  } as React.CSSProperties}
                >
                  Adicionais
                </TabsTrigger>
                <div className="w-px h-6 bg-border/30 self-center"></div>
                <TabsTrigger 
                  value="observacoes" 
                  className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[var(--tab-active-color)]"
                  style={{ 
                    '--tab-active-color': primaryColor 
                  } as React.CSSProperties}
                >
                  Observações
                </TabsTrigger>
                <div className="w-px h-6 bg-border/30 self-center"></div>
                <TabsTrigger 
                  value="parametros" 
                  className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[var(--tab-active-color)]"
                  style={{ 
                    '--tab-active-color': primaryColor 
                  } as React.CSSProperties}
                >
                  Parâmetros
                </TabsTrigger>
                <div className="w-px h-6 bg-border/30 self-center"></div>
                <TabsTrigger 
                  value="historico" 
                  className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[var(--tab-active-color)]"
                  style={{ 
                    '--tab-active-color': primaryColor 
                  } as React.CSSProperties}
                >
                  Histórico
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contato" className="p-6">
                <div className="space-y-6 lead-modal-dropdown">
                  <form id="lead-form" onSubmit={handleSubmit}>
                  {/* Origem */}
                  <div>
                    <Label htmlFor="source" className="block text-sm font-medium text-white">
                      Origem
                    </Label>
                    <Select
                      value={formData.sourceId}
                      onValueChange={(value) => handleInputChange('sourceId', value)}
                    >
                      <SelectTrigger className="w-full brand-radius select-trigger-primary">
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                      <SelectContent className="dropdown-item-brand">
                        <SelectItem value="none" className="lead-dropdown-item">Nenhuma origem</SelectItem>
                        {sources.map((source) => (
                          <SelectItem key={source.id} value={source.id || 'none'} className="lead-dropdown-item">
                            {source.name || 'Fonte sem nome'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Email */}
                  <div className="mt-6">
                    <Label htmlFor="email" className="block text-sm font-medium text-white">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`brand-radius campo-primary-focus ${emailError ? 'border-red-500' : ''}`}
                      placeholder="Digite o email"
                      required
                    />
                    {emailError && (
                      <p className="text-red-500 text-sm mt-1">{emailError}</p>
                    )}
                  </div>

                  {/* Telefone com DDI */}
                  <div className="mt-6">
                    <Label htmlFor="phone" className="block text-sm font-medium text-white">
                      Telefone
                    </Label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="Digite o telefone"
                      className="w-full"
                    />
                  </div>
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="adicionais" className="p-6">
                <div className="space-y-6">
                  {customFields.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p>Nenhum campo personalizado configurado para esta empresa.</p>
                      <p className="text-sm mt-2">Configure campos personalizados em Configurações → CRM → Campos Personalizados</p>
                    </div>
                  ) : (
                    orderedCustomFields.map((field) => (
                      <div key={field.id}>
                        <Label htmlFor={`custom-${field.id}`} className="block text-sm font-medium text-white">
                          {field.name}
                          {field.is_required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="mt-2">
                          {renderCustomField(field)}
                        </div>
                        {field.description && (
                          <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="observacoes" className="p-6">
                <div className="text-center text-muted-foreground py-8">
                  <p>Funcionalidade de Observações em desenvolvimento...</p>
                </div>
              </TabsContent>

              <TabsContent value="parametros" className="p-6">
                <div className="text-center text-muted-foreground py-8">
                  <p>Funcionalidade de Parâmetros em desenvolvimento...</p>
                </div>
              </TabsContent>

              <TabsContent value="historico" className="p-6">
                <div className="text-center text-muted-foreground py-8">
                  <p>Funcionalidade de Histórico em desenvolvimento...</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      ) : (
        // Modal de Criação (sem abas)
        <form id="lead-form" onSubmit={handleSubmit} className="space-y-6 lead-modal-dropdown bg-[#1F1F1F] p-6 rounded-lg">
          {/* Nome e Sobrenome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="block text-sm font-medium text-white">
                Nome *
              </Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleFirstNameChange}
                className="brand-radius campo-primary-focus"
                placeholder="Digite o nome"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="block text-sm font-medium text-white">
                Sobrenome
              </Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="brand-radius campo-primary-focus"
                placeholder="Digite o sobrenome"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-white">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`brand-radius campo-primary-focus ${emailError ? 'border-red-500' : ''}`}
              placeholder="Digite o email"
              required
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>

          {/* Telefone com DDI */}
          <div>
            <Label htmlFor="phone" className="block text-sm font-medium text-white">
              Telefone
            </Label>
            <PhoneInput
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="Digite o telefone"
              className="w-full"
            />
          </div>

          {/* Origem */}
          <div>
            <Label htmlFor="source" className="block text-sm font-medium text-white">
              Origem
            </Label>
            <Select
              value={formData.sourceId}
              onValueChange={(value) => handleInputChange('sourceId', value)}
            >
              <SelectTrigger className="w-full brand-radius select-trigger-primary">
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent className="dropdown-item-brand">
                <SelectItem value="none" className="lead-dropdown-item">Nenhuma origem</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.id || 'none'} className="lead-dropdown-item">
                    {source.name || 'Fonte sem nome'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Funil */}
          <div>
            <Label htmlFor="funnel" className="block text-sm font-medium text-white">
              Funil *
            </Label>
            <Select
              value={formData.funnelId}
              onValueChange={(value) => handleInputChange('funnelId', value)}
              disabled={allowedFunnels.length === 0}
            >
              <SelectTrigger className="w-full brand-radius select-trigger-primary">
                <SelectValue placeholder={allowedFunnels.length === 0 ? "Nenhum funil disponível" : "Selecione o funil"} />
              </SelectTrigger>
              <SelectContent className="dropdown-item-brand">
                {allowedFunnels.map((funnel) => (
                  <SelectItem key={funnel.id} value={funnel.id || 'none'} className="lead-dropdown-item">
                    {funnel.name || 'Funnel sem nome'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {allowedFunnels.length === 0 && (
              <p className="text-yellow-500 text-sm mt-1">
                Você não tem acesso a nenhum funil. Entre em contato com o administrador.
              </p>
            )}
          </div>

          {/* Fase do Funil */}
          {formData.funnelId && formData.funnelId !== 'none' && funnelStages.length > 0 && (
            <div>
              <Label htmlFor="stage" className="block text-sm font-medium text-white">
                Fase do Funil *
              </Label>
              <Select
                value={formData.stageId}
                onValueChange={(value) => handleInputChange('stageId', value)}
              >
                <SelectTrigger className="w-full brand-radius select-trigger-primary">
                  <SelectValue placeholder="Selecione a fase" />
                </SelectTrigger>
                <SelectContent className="dropdown-item-brand">
                  {funnelStages.map((stage: any) => (
                    <SelectItem key={stage.id} value={stage.id || 'none'} className="lead-dropdown-item">
                      {stage.name || 'Fase sem nome'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Usuário Responsável */}
          <div>
            <Label htmlFor="responsible" className="block text-sm font-medium text-white">
              Usuário Responsável *
            </Label>
            <Select
              value={formData.responsibleId}
              onValueChange={(value) => handleInputChange('responsibleId', value)}
            >
              <SelectTrigger className="w-full brand-radius select-trigger-primary">
                <SelectValue placeholder="Selecione o usuário responsável" />
              </SelectTrigger>
              <SelectContent className="dropdown-item-brand">
                {crmUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id || 'none'} className="lead-dropdown-item">
                    {user.first_name || ''} {user.last_name || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        </form>
      )}
    </FullScreenModal>
  );
};