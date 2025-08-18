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

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = "Telefone",
  className = "",
  error
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Brasil como padrão
  const [isOpen, setIsOpen] = useState(false);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
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
    <div className={`relative ${className}`}>
      <div className="flex">
        {/* Seletor de País */}
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="rounded-r-none border-r-0 h-12 px-3 flex items-center space-x-2 bg-[#2A2A2A] border-white/20 text-white hover:bg-[#3A3A3A] hover:border-white/40"
            >
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-base md:text-lg font-medium">{selectedCountry.ddi}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 max-h-60 overflow-y-auto bg-[#2A2A2A] border-white/20">
            {countries.map((country) => (
              <DropdownMenuItem
                key={country.code}
                onClick={() => handleCountrySelect(country)}
                className="flex items-center space-x-3 p-3 hover:bg-[#e50f5f] data-[highlighted]:bg-[#e50f5f] data-[highlighted]:text-white data-[state=checked]:bg-[#7c032e] data-[state=checked]:text-white text-white cursor-pointer"
              >
                <span className="text-lg">{country.flag}</span>
                <div className="flex-1">
                  <div className="font-medium">{country.name}</div>
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
          className={`flex-1 rounded-l-none h-12 text-base md:text-lg bg-[#2A2A2A] border-white/20 text-white placeholder:text-gray-400 focus:border-white/40 focus:ring-white/20 ${
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