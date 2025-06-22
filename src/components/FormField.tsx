import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, useId } from 'react';

interface BaseFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  helpText?: string;
}

interface InputFieldProps extends BaseFieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  type?: 'text' | 'number' | 'date' | 'time' | 'email' | 'password';
  className?: string;
}

interface SelectFieldProps extends BaseFieldProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  options: Array<{ value: string; label: string }>;
  className?: string;
}

interface TextareaFieldProps extends BaseFieldProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  className?: string;
}

type FormFieldProps = InputFieldProps | SelectFieldProps | TextareaFieldProps;

export function FormField(props: FormFieldProps) {
  const { label, error, required, helpText, className = '', ...rest } = props;
  const id = useId();

  const baseClasses = "block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm";
  const errorClasses = error ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500" : "";
  const inputClasses = `${baseClasses} ${errorClasses} ${className}`;

  const renderInput = () => {
    if ('options' in props) {
      const selectProps = rest as SelectHTMLAttributes<HTMLSelectElement>;
      return (
        <select
          id={id}
          aria-label={label}
          aria-labelledby={id + '-label'}
          className={inputClasses}
          {...selectProps}
        >
          <option value="">Select {label}</option>
          {props.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if ('rows' in props) {
      const textareaProps = rest as TextareaHTMLAttributes<HTMLTextAreaElement>;
      return <textarea id={id} aria-label={label} aria-labelledby={id + '-label'} className={inputClasses} {...textareaProps} />;
    }

    const inputProps = rest as InputHTMLAttributes<HTMLInputElement>;
    return <input id={id} aria-label={label} aria-labelledby={id + '-label'} className={inputClasses} {...inputProps} />;
  };

  return (
    <div>
      <label id={id + '-label'} htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
} 