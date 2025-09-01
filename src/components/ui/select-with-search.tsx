import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';

interface Option {
  value: string;
  label: string;
}

interface SelectWithSearchProps {
  options: Option[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SelectWithSearch: React.FC<SelectWithSearchProps> = ({ 
  options, 
  value, 
  onValueChange, 
  placeholder = "Selecione...", 
  disabled = false,
  className = ""
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

  // Obter label da opção selecionada
  const selectedOption = options.find(option => option.value === value);

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
          {selectedOption ? selectedOption.label : placeholder}
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

          {/* Lista de opções */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-sm text-muted-foreground dark:text-gray-400">
                Nenhuma opção encontrada
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onValueChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full text-left p-3 hover:bg-secondary cursor-pointer transition-colors ${
                    value === option.value ? 'bg-secondary text-secondary-foreground' : ''
                  }`}
                >
                  <span className="text-sm text-foreground">{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectWithSearch; 