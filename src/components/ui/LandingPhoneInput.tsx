import React, { useState, useEffect } from 'react';
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
  mask: string;
}

const countries: Country[] = [
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
  { code: 'PT', name: 'Portugal', ddi: '+351', flag: '🇵🇹', mask: '### ### ###' },
  { code: 'ES', name: 'Espanha', ddi: '+34', flag: '🇪🇸', mask: '### ## ## ##' },
];

interface LandingPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  globalDefaultColor?: string;
  accentFocus?: boolean;
  onDdiChange?: (ddi: string, countryCode: string, countryName: string) => void;
  // Novas props para estilização
  selectBgColor?: string;
  selectTextColor?: string;
  fieldBgColor?: string;
  fieldTextColor?: string;
  borderColorNormal?: string;
  borderColorActive?: string;
  borderRadiusPx?: number;
  borderWidthNormalPx?: number;
  borderWidthFocusPx?: number;
  fontSizeInputPx?: number;
  verifyExistence?: boolean;
}

export const LandingPhoneInput: React.FC<LandingPhoneInputProps> = ({
  value,
  onChange,
  placeholder = "Telefone",
  className = "",
  error,
  globalDefaultColor = "#E50F5E",
  accentFocus = false,
  onDdiChange,
  // Novas props com valores padrão
  selectBgColor = "#FFFFFF",
  selectTextColor = "#000000",
  fieldBgColor = "#2A2A2A",
  fieldTextColor = "#FFFFFF",
  borderColorNormal = "#FFFFFF33",
  borderColorActive = "#E50F5E",
  borderRadiusPx = 8,
  borderWidthNormalPx = 1,
  borderWidthFocusPx = 2,
  fontSizeInputPx = 16,
  verifyExistence = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [existsError, setExistsError] = useState<string | null>(null);

  useEffect(() => {
    if (onDdiChange) {
      onDdiChange(selectedCountry.ddi.replace(/\D/g, ''), selectedCountry.code, selectedCountry.name);
    }
  }, []);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    onChange(''); // Limpar número ao trocar país
    if (onDdiChange) {
      onDdiChange(country.ddi.replace(/\D/g, ''), country.code, country.name);
    }
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

  const formatPhoneNumber = (value: string) => {
    return applyPhoneMask(value, selectedCountry.mask);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange(formatted);
    setExistsError(null);
  };

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    
    switch (selectedCountry.code) {
      case 'BR':
        // Brasil: exigir exatamente 11 dígitos (fora DDI)
        return numbers.length === 11;
      case 'US':
      case 'CA':
        return numbers.length === 10;
      case 'AR':
        return numbers.length >= 10 && numbers.length <= 11;
      case 'CL':
        return numbers.length >= 8 && numbers.length <= 9;
      case 'CO':
        return numbers.length === 10;
      case 'PE':
        return numbers.length === 9;
      case 'UY':
        return numbers.length === 8;
      case 'PY':
        return numbers.length === 9;
      case 'BO':
        return numbers.length === 8;
      case 'VE':
        return numbers.length === 10;
      case 'EC':
        return numbers.length === 9;
      case 'GY':
        return numbers.length === 7;
      case 'SR':
        return numbers.length === 7;
      case 'GF':
        return numbers.length === 9;
      case 'MX':
        return numbers.length === 10;
      case 'GB':
        return numbers.length === 10;
      case 'FR':
        return numbers.length === 10;
      case 'DE':
        return numbers.length >= 10 && numbers.length <= 11;
      case 'IT':
        return numbers.length === 10;
      case 'PT':
        return numbers.length === 9;
      case 'ES':
        return numbers.length === 9;
      default:
        return numbers.length >= 7;
    }
  };

  const isValid = value ? validatePhone(value) : true;

  // Verificação de existência (opcional) ao perder foco
  const checkExistence = async () => {
    if (!verifyExistence) return;
    try {
      setIsChecking(true);
      setExistsError(null);
      const digits = (value || '').replace(/\D/g, '');
      if (!digits) { setIsChecking(false); return; }
      // Montar E.164 com DDI selecionado
      const ddi = selectedCountry.ddi.replace(/\D/g, '');
      const e164 = `+${ddi}${digits}`;
      const res = await fetch('/functions/v1/validate-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164 })
      });
      const data = await res.json();
      if (data?.skipped) {
        // Sem provider configurado: não bloquear
        setExistsError(null);
      } else if (data?.valid === false) {
        setExistsError('Número inexistente ou inválido.');
      } else {
        setExistsError(null);
      }
    } catch {
      // Falha de rede: não bloquear o usuário
      setExistsError(null);
    } finally {
      setIsChecking(false);
    }
  };

  // Filtrar países baseado na pesquisa
  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.ddi.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative z-50 ${className}`}>
      <style>
        {`
          .landing-phone-input:focus {
            border-color: ${borderColorActive} !important;
            border-width: ${borderWidthFocusPx}px !important;
          }
          .landing-phone-input {
            border-color: ${borderColorNormal} !important;
            border-width: ${borderWidthNormalPx}px !important;
            background-color: ${fieldBgColor} !important;
          }
          .landing-phone-container button {
            background-color: ${fieldBgColor} !important;
          }
          .landing-phone-container button:hover,
          .landing-phone-container button:focus {
            background-color: ${selectBgColor} !important;
            color: ${selectTextColor} !important;
          }
          
          /* Forçar cor da opção selecionada */
          .phone-dropdown-item[data-selected="true"] {
            background-color: ${selectBgColor} !important;
            color: ${selectTextColor} !important;
          }
          
          /* Forçar cor via Radix */
          [data-radix-dropdown-menu-item][data-selected="true"] {
            background-color: ${selectBgColor} !important;
            color: ${selectTextColor} !important;
          }
          
          /* Forçar cor do hover */
          .phone-dropdown-item:hover {
            background-color: ${selectBgColor} !important;
            color: ${selectTextColor} !important;
          }
          
          /* Forçar cor do hover via Radix */
          [data-radix-dropdown-menu-item]:hover {
            background-color: ${selectBgColor} !important;
            color: ${selectTextColor} !important;
          }
          
          /* Forçar cor do hover em todos os estados */
          .phone-dropdown-item:hover,
          .phone-dropdown-item:focus,
          .phone-dropdown-item:active {
            background-color: ${selectBgColor} !important;
            color: ${selectTextColor} !important;
          }
          
          /* Forçar cor do hover via Radix em todos os estados */
          [data-radix-dropdown-menu-item]:hover,
          [data-radix-dropdown-menu-item]:focus,
          [data-radix-dropdown-menu-item]:active {
            background-color: ${selectBgColor} !important;
            color: ${selectTextColor} !important;
          }
          
          /* Estilo da barra de pesquisa */
          .phone-dropdown-content input {
            background-color: ${fieldBgColor} !important;
            color: ${fieldTextColor} !important;
            border-color: ${borderColorNormal} !important;
          }
          
          .phone-dropdown-content input:focus {
            border-color: ${borderColorActive} !important;
            border-width: ${borderWidthFocusPx}px !important;
          }
          
          /* Ajustes específicos para mobile */
          @media (max-width: 640px) {
            .landing-phone-container button {
              padding-left: 0.5rem !important;
              padding-right: 0.5rem !important;
              margin-right: 0.25rem !important;
            }
            
            .landing-phone-container button span {
              font-size: 0.875rem !important;
            }
            
            .landing-phone-container button svg {
              width: 0.75rem !important;
              height: 0.75rem !important;
            }
          }
        `}
      </style>
      <div className="flex h-12 landing-phone-container">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-12 px-2 sm:px-3 mr-1 sm:mr-[5px] flex items-center space-x-1 sm:space-x-2 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{
                backgroundColor: `${fieldBgColor} !important`,
                color: fieldTextColor,
                borderColor: borderColorNormal,
                borderWidth: `${borderWidthNormalPx}px`,
                borderRadius: `${borderRadiusPx}px`,
                borderStyle: 'solid',
                fontSize: `${fontSizeInputPx}px`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${selectBgColor} !important`;
                e.currentTarget.style.color = selectTextColor;
                e.currentTarget.style.borderColor = borderColorActive;
                e.currentTarget.style.borderWidth = `${borderWidthFocusPx}px`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${fieldBgColor} !important`;
                e.currentTarget.style.color = fieldTextColor;
                e.currentTarget.style.borderColor = borderColorNormal;
                e.currentTarget.style.borderWidth = `${borderWidthNormalPx}px`;
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = `${selectBgColor} !important`;
                e.currentTarget.style.color = selectTextColor;
                e.currentTarget.style.borderColor = borderColorActive;
                e.currentTarget.style.borderWidth = `${borderWidthFocusPx}px`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = `${fieldBgColor} !important`;
                e.currentTarget.style.color = fieldTextColor;
                e.currentTarget.style.borderColor = borderColorNormal;
                e.currentTarget.style.borderWidth = `${borderWidthNormalPx}px`;
              }}
            >
              <span style={{ fontSize: `${fontSizeInputPx}px` }}>{selectedCountry.flag}</span>
              <span className="font-medium text-sm sm:text-base" style={{ fontSize: `${fontSizeInputPx}px` }}>{selectedCountry.ddi}</span>
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start"
            side="bottom"
            sideOffset={4}
            className="w-64 max-h-60 overflow-y-auto shadow-lg phone-dropdown-content"
            style={{ 
              zIndex: 999999,
              backgroundColor: `${fieldBgColor} !important`,
              color: fieldTextColor,
              borderColor: borderColorNormal,
              borderWidth: `${borderWidthNormalPx}px`,
              borderRadius: `${borderRadiusPx}px`,
            }}
          >
            {/* Barra de pesquisa */}
            <div className="p-2 border-b border-gray-600">
              <Input
                type="text"
                placeholder="Pesquisar país ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 text-sm"
                style={{
                  backgroundColor: fieldBgColor,
                  color: fieldTextColor,
                  borderColor: borderColorNormal,
                  borderWidth: `${borderWidthNormalPx}px`,
                  borderRadius: `${borderRadiusPx}px`,
                  fontSize: `${fontSizeInputPx}px`,
                }}
              />
            </div>
            
            {filteredCountries.map((country) => {
              const isSelected = selectedCountry.code === country.code;
              return (
                <DropdownMenuItem
                  key={country.code}
                  onSelect={() => handleCountrySelect(country)}
                  className="flex items-center space-x-3 p-3 cursor-pointer text-base phone-dropdown-item"
                  data-selected={isSelected}
                  style={{
                    color: isSelected ? selectTextColor : fieldTextColor,
                    backgroundColor: isSelected ? selectBgColor : fieldBgColor,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = selectBgColor;
                    e.currentTarget.style.color = selectTextColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isSelected ? selectBgColor : fieldBgColor;
                    e.currentTarget.style.color = isSelected ? selectTextColor : fieldTextColor;
                  }}
                >
                <div className="flex items-center space-x-2 w-full">
                  <span className="text-base">{country.flag}</span>
                  <span className="font-medium text-base flex-1" style={{ color: isSelected ? selectTextColor : fieldTextColor }}>
                    {country.name}
                  </span>
                  <span className="text-base font-medium" style={{ color: isSelected ? selectTextColor : fieldTextColor }}>
                    {country.ddi}
                  </span>
                </div>
              </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Input
          value={value}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          className={`flex-1 h-12 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 landing-phone-input landing-page-input ${
            !isValid && value ? 'border-red-500 focus:border-red-500' : ''
          }`}
          style={{
            backgroundColor: `${fieldBgColor} !important`,
            color: fieldTextColor,
            borderColor: !isValid && value ? '#ef4444' : borderColorNormal,
            borderWidth: `${borderWidthNormalPx}px`,
            borderRadius: `${borderRadiusPx}px`,
            borderStyle: 'solid',
            fontSize: `${fontSizeInputPx}px`,
            '--border-color-focus': borderColorActive,
            '--border-color-normal': borderColorNormal,
          } as React.CSSProperties}
          onFocus={(e) => {
            // Forçar aplicação da cor de foco
            e.currentTarget.style.setProperty('border-color', borderColorActive, 'important');
            e.currentTarget.style.setProperty('border-width', `${borderWidthFocusPx}px`, 'important');
          }}
          onBlur={(e) => {
            // Forçar aplicação da cor normal
            e.currentTarget.style.setProperty('border-color', borderColorNormal, 'important');
            e.currentTarget.style.setProperty('border-width', `${borderWidthNormalPx}px`, 'important');
          }}
          onBlur={checkExistence}
        />

      {isChecking && (
        <p className="text-xs text-muted-foreground mt-1">Verificando telefone...</p>
      )}
      {existsError && (
        <p className="text-red-500 text-sm mt-1">{existsError}</p>
      )}
      </div>
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
      
      {value && !isValid && (
        <p className="text-red-500 text-sm mt-1">
          Telefone inválido para {selectedCountry.name}
        </p>
      )}
    </div>
  );
};
