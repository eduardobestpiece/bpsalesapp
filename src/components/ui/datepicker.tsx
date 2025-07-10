
import * as React from "react";
import { Input } from "@/components/ui/input";

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, placeholder, className, disabled, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        {...props}
      />
    );
  }
);

DatePicker.displayName = "DatePicker";
