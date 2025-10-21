import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Checkbox } from './checkbox';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  primaryColor?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Selecione...", 
  disabled = false,
  className = "",
  primaryColor = 'var(--brand-primary, #E50F5E)'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar opções baseado na busca
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Selecionar/deselecionar todos
  const handleSelectAll = () => {
    if (value.length === filteredOptions.length) {
      // Deselecionar todos os filtrados
      const remainingValues = value.filter(v => 
        !filteredOptions.some(option => option.value === v)
      );
      onChange(remainingValues);
    } else {
      // Selecionar todos os filtrados
      const newValues = [...new Set([...value, ...filteredOptions.map(option => option.value)])];
      onChange(newValues);
    }
  };

  // Verificar se todos os filtrados estão selecionados
  const allFilteredSelected = filteredOptions.length > 0 && 
    filteredOptions.every(option => value.includes(option.value));

  // Verificar se alguns filtrados estão selecionados
  const someFilteredSelected = filteredOptions.some(option => value.includes(option.value));

  // Contar itens selecionados
  const selectedCount = value.length;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botão do dropdown */}
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full justify-between text-left font-normal campo-brand brand-radius hover:bg-transparent ${disabled ? 'opacity-50' : ''}`}
        style={{ 
          borderColor: 'var(--brand-secondary, #E5E7EB)'
        }}
      >
        <span className="truncate">
          {selectedCount === 0 
            ? placeholder 
            : selectedCount === 1 
              ? options.find(opt => opt.value === value[0])?.label 
              : `${selectedCount} item(s) selecionado(s)`
          }
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-1 bg-background border border-border shadow-lg max-h-80 overflow-hidden brand-radius"
        >
          {/* Campo de busca */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-8 h-9 text-sm campo-brand field-secondary-focus no-ring-focus"
                style={{ borderRadius: 'var(--brand-radius, 6px)' }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Cabeçalho com checkbox "Selecionar Todos" */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={allFilteredSelected}
                ref={(el) => {
                  if (el) {
                    el.indeterminate = someFilteredSelected && !allFilteredSelected;
                  }
                }}
                onCheckedChange={handleSelectAll}
                style={{ 
                  '--brand-primary': primaryColor
                } as React.CSSProperties}
              />
              <span className="text-sm font-medium text-foreground">
                {allFilteredSelected ? 'Deselecionar Todos' : 'Selecionar Todos'}
              </span>
            </div>
          </div>

          {/* Lista de opções */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-sm text-muted-foreground dark:text-gray-400">
                Nenhuma opção encontrada
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-2 p-3 hover:bg-secondary cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={value.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onChange([...value, option.value]);
                      } else {
                        onChange(value.filter(v => v !== option.value));
                      }
                    }}
                    style={{ 
                      '--brand-primary': primaryColor
                    } as React.CSSProperties}
                  />
                  <span className="text-sm flex-1 text-foreground">{option.label}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect; 