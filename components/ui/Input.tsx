import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const baseInput =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm ' +
  'placeholder:text-ink-muted ' +
  'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 ' +
  'disabled:bg-gray-100 disabled:cursor-not-allowed ' +
  'min-h-[44px]';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className = '', ...rest },
  ref
) {
  const inputId = id || rest.name;
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-brand-contrast">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={[baseInput, error ? 'border-red-500 focus:ring-red-200' : '', className].join(' ')}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, className = '', ...rest },
  ref
) {
  const tid = id || rest.name;
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={tid} className="block text-sm font-medium text-brand-contrast">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={tid}
        className={[baseInput, 'min-h-[80px] py-2', error ? 'border-red-500 focus:ring-red-200' : '', className].join(' ')}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
});