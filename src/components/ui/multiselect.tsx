import React from 'react';

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
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ options, value, onChange, placeholder, disabled }) => {
  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className={`border border-border dark:border-[#A86F57]/30 rounded p-2 bg-background dark:bg-[#131313] ${disabled ? 'opacity-50 pointer-events-none' : ''}`}> 
      <div className="mb-1 text-sm text-muted-foreground dark:text-gray-300">{placeholder}</div>
      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
        {options.map(option => (
          <label key={option.value} className="flex items-center gap-2 cursor-pointer text-foreground dark:text-white hover:bg-muted dark:hover:bg-[#161616] p-1 rounded">
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={() => handleToggle(option.value)}
              disabled={disabled}
              className="accent-[#A86F57]"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default MultiSelect; 