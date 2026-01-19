import { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, iconPosition = 'left', className = '', ...props }, ref) => {
    const baseClasses = 'input';
    const errorClasses = error ? 'input-error' : '';
    const iconPaddingLeft = icon && iconPosition === 'left' ? 'pl-11' : '';
    const iconPaddingRight = icon && iconPosition === 'right' ? 'pr-11' : '';

    return (
      <div className="form-group">
        {label && (
          <label className="form-label">{label}</label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`${baseClasses} ${errorClasses} ${iconPaddingLeft} ${iconPaddingRight} ${className}`}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {icon}
            </span>
          )}
        </div>
        {error && (
          <p className="form-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const baseClasses = 'input min-h-[120px] resize-y';
    const errorClasses = error ? 'input-error' : '';

    return (
      <div className="form-group">
        {label && (
          <label className="form-label">{label}</label>
        )}
        <textarea
          ref={ref}
          className={`${baseClasses} ${errorClasses} ${className}`}
          {...props}
        />
        {error && (
          <p className="form-error">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    const baseClasses = 'select';
    const errorClasses = error ? 'input-error' : '';

    return (
      <div className="form-group">
        {label && (
          <label className="form-label">{label}</label>
        )}
        <select
          ref={ref}
          className={`${baseClasses} ${errorClasses} ${className}`}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="form-error">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  colors: { name: string; value: string }[];
}

export function ColorPicker({ label, value, onChange, colors }: ColorPickerProps) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">{label}</label>
      )}
      <div className="flex gap-2 flex-wrap">
        {colors.map(color => (
          <button
            key={color.value}
            type="button"
            onClick={() => onChange(color.value)}
            className={`w-9 h-9 rounded-xl transition-all duration-200 ${
              value === color.value
                ? 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-white scale-110'
                : 'hover:scale-105 opacity-80 hover:opacity-100'
            }`}
            style={{ backgroundColor: color.value }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
}
