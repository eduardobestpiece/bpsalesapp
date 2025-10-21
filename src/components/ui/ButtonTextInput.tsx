import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ButtonTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const ButtonTextInput: React.FC<ButtonTextInputProps> = ({
  value,
  onChange,
  placeholder = "Ex: Enviar, Cadastrar, Continuar...",
  className = "h-12 bg-[#1F1F1F] border-white/20 text-white placeholder:text-gray-400"
}) => {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar com o valor externo apenas quando mudar externamente
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label className="text-white font-medium">Texto do botão</Label>
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
};
