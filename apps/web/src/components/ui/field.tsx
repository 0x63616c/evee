import type { InputHTMLAttributes, ReactNode } from 'react';

interface FieldInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  action?: ReactNode;
  error?: string;
}

export function FieldInput({
  label,
  action,
  error,
  id,
  className,
  ...rest
}: FieldInputProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" htmlFor={id}>
          {label}
        </label>
        {action}
      </div>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 placeholder:text-muted-foreground focus:ring-2 transition-shadow aria-invalid:border-destructive aria-invalid:ring-destructive/50 aria-invalid:focus:ring-2 ${className ?? ''}`}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
