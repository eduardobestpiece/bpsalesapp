import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { LandingPhoneInput } from '@/components/ui/LandingPhoneInput';
import { LeadField } from '@/hooks/useLeadFields';

interface DynamicLeadFieldsProps {
  fields: LeadField[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  errors?: Record<string, string>;
}

export const DynamicLeadFields: React.FC<DynamicLeadFieldsProps> = ({
  fields,
  values,
  onChange,
  errors = {}
}) => {
  const renderField = (field: LeadField) => {
    const value = values[field.id] || '';
    const error = errors[field.id];

    switch (field.type) {
      case 'text':
      case 'name':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              type="text"
              maxLength={field.max_length}
              className={error ? 'border-red-500' : ''}
              placeholder={field.placeholder_text || field.name}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );

      case 'email':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              type="email"
              className={error ? 'border-red-500' : ''}
              placeholder={field.placeholder_text || field.name}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );

      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <LandingPhoneInput
              value={value}
              onChange={(newValue) => onChange(field.id, newValue)}
              placeholder={field.placeholder_text || field.name}
              error={error}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );

      case 'number':
      case 'money':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              type="number"
              min={field.money_min || field.slider_min}
              max={field.money_max || field.slider_max}
              className={error ? 'border-red-500' : ''}
              placeholder={field.placeholder_text || field.name}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              type="date"
              className={error ? 'border-red-500' : ''}
              placeholder={field.placeholder_text || field.name}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );

      case 'time':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              type="time"
              className={error ? 'border-red-500' : ''}
              placeholder={field.placeholder_text || field.name}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );

      case 'datetime-local':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              type="datetime-local"
              className={error ? 'border-red-500' : ''}
              placeholder={field.placeholder_text || field.name}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );

      case 'url':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              type="url"
              className={error ? 'border-red-500' : ''}
              placeholder={field.placeholder_text || field.name}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              rows={4}
              maxLength={field.max_length}
              className={error ? 'border-red-500' : ''}
              placeholder={field.placeholder_text || field.name}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );

      case 'select':
        const options = field.options?.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0) || [];
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(newValue) => onChange(field.id, newValue)}>
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder_text || `Selecione ${field.name.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );

      case 'checkbox':
        const checkboxOptions = field.checkbox_options?.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0) || [];
        const selectedValues = Array.isArray(value) ? value : [];
        
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className={`grid gap-2 ${field.checkbox_columns ? `grid-cols-${field.checkbox_columns}` : 'grid-cols-1'}`}>
              {checkboxOptions.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${index}`}
                    checked={selectedValues.includes(option)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const newValues = [...selectedValues, option];
                        if (field.checkbox_limit && newValues.length > field.checkbox_limit) {
                          return; // Não adiciona se exceder o limite
                        }
                        onChange(field.id, newValues);
                      } else {
                        onChange(field.id, selectedValues.filter(v => v !== option));
                      }
                    }}
                  />
                  <Label htmlFor={`${field.id}-${index}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );

      case 'slider':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              <Slider
                value={[value || field.slider_min || 0]}
                onValueChange={(newValue) => onChange(field.id, newValue[0])}
                min={field.slider_min || 0}
                max={field.slider_max || 100}
                step={field.slider_step_value || 1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{field.slider_start || field.slider_min || 0}</span>
                <span className="font-medium">{value || field.slider_min || 0}</span>
                <span>{field.slider_end || field.slider_max || 100}</span>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );

      case 'document':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              type="text"
              className={error ? 'border-red-500' : ''}
              placeholder={field.placeholder_text || (field.document_cpf ? '000.000.000-00' : field.document_cnpj ? '00.000.000/0000-00' : field.name)}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );

      case 'address':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              rows={3}
              className={error ? 'border-red-500' : ''}
              placeholder={field.placeholder_text || 'Digite o endereço completo'}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );

      case 'connection':
        // Para campos de conexão, vamos mostrar uma mensagem informativa
        // pois precisamos carregar dados de tabelas específicas
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="p-3 border border-dashed border-gray-300 rounded-md bg-gray-50">
              <p className="text-sm text-gray-600">
                Campo de conexão: {field.connection_list}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Este campo será implementado para carregar dados de {field.connection_list}
              </p>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              type="text"
              className={error ? 'border-red-500' : ''}
              placeholder={field.placeholder_text || field.name}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {fields.map(renderField)}
    </div>
  );
};
