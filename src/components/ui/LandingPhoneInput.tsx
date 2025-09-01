import React, { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { ChevronDown, Flag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface Country {
  code: string;
  name: string;
  ddi: string;
  flag: string;
}

const countries: Country[] = [
  { code: 'BR', name: 'Brasil', ddi: '+55', flag: '🇧🇷' },
  { code: 'US', name: 'Estados Unidos', ddi: '+1', flag: '🇺🇸' },
  { code: 'AR', name: 'Argentina', ddi: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', ddi: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colômbia', ddi: '+57', flag: '🇨🇴' },
  { code: 'MX', name: 'México', ddi: '+52', flag: '🇲🇽' },
  { code: 'PE', name: 'Peru', ddi: '+51', flag: '🇵🇪' },
  { code: 'UY', name: 'Uruguai', ddi: '+598', flag: '🇺🇾' },
  { code: 'VE', name: 'Venezuela', ddi: '+58', flag: '🇻🇪' },
  { code: 'PT', name: 'Portugal', ddi: '+351', flag: '🇵🇹' },
  { code: 'ES', name: 'Espanha', ddi: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Itália', ddi: '+39', flag: '🇮🇹' },
  { code: 'FR', name: 'França', ddi: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemanha', ddi: '+49', flag: '🇩🇪' },
  { code: 'GB', name: 'Reino Unido', ddi: '+44', flag: '🇬🇧' },
];

interface LandingPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  globalDefaultColor?: string;
}

export const LandingPhoneInput: React.FC<LandingPhoneInputProps> = ({
  value,
  onChange,
  placeholder = "Telefone",
  className = "",
  error,
  globalDefaultColor = "#E50F5E"
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Brasil como padrão

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    
    // Formata baseado no país selecionado
    if (selectedCountry.code === 'BR') {
      // Formato brasileiro: (11) 99999-9999
      if (numbers.length <= 2) {
        return `(${numbers}`;
      } else if (numbers.length <= 6) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      } else if (numbers.length <= 10) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
      } else {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
      }
    } else {
      // Para outros países, apenas números
      return numbers;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange(formatted);
  };

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    
    if (selectedCountry.code === 'BR') {
      // Validação brasileira: mínimo 10 dígitos, máximo 11
      return numbers.length >= 10 && numbers.length <= 11;
    } else {
      // Para outros países: mínimo 7 dígitos
      return numbers.length >= 7;
    }
  };

  const isValid = value ? validatePhone(value) : true;

  return (
    <div className={`relative z-50 ${className}`}>
      <div className="flex h-12 landing-phone-container">
        {/* Seletor de País */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="border-r-0 h-12 px-3 flex items-center space-x-2 bg-[#2A2A2A] border-white/20 text-white hover:bg-[#3A3A3A] focus:bg-[#3A3A3A] landing-phone-selector"
              style={{
                '--tw-focus-border-color': globalDefaultColor
              }}
            >
              <span className="text-base">{selectedCountry.flag}</span>
              <span className="text-base font-medium">{selectedCountry.ddi}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start"
            side="bottom"
            sideOffset={4}
            className="w-64 max-h-60 overflow-y-auto bg-[#2A2A2A] border-white/20 text-white shadow-lg"
            style={{ zIndex: 999999 }}
          >
            {countries.map((country) => (
              <DropdownMenuItem
                key={country.code}
                onSelect={() => handleCountrySelect(country)}
                className="flex items-center space-x-3 p-3 cursor-pointer text-base landing-phone-dropdown-item"
              >
                <span className="text-base">{country.flag}</span>
                <div className="flex-1">
                  <div className="font-medium text-base">{country.name}</div>
                  <div className="text-sm text-gray-400">{country.ddi}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Input do Telefone */}
        <Input
          value={value}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          className={`flex-1 h-12 text-base md:text-lg bg-[#2A2A2A] border-white/20 text-white placeholder:text-gray-400 focus:ring-white/20 landing-phone-input landing-page-input ${
            !isValid && value ? 'border-red-500 focus:border-red-500' : ''
          }`}
        />
      </div>
      
      {/* Mensagem de erro */}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
      
      {/* Validação visual */}
      {value && !isValid && (
        <p className="text-red-500 text-sm mt-1">
          Telefone inválido para {selectedCountry.name}
        </p>
      )}
    </div>
  );
}; 