import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  icon?: boolean; // If true, renders as an icon-only button
  children: React.ReactNode;
  className?: string;
}

/**
 * Button component supporting primary/secondary variants and icon-only mode.
 * - Use `icon` prop for icon-only buttons (e.g., close/cancel X).
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  icon = false,
  type = 'button',
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const base = icon
    ? 'inline-flex items-center justify-center rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 w-9 h-9 p-0 text-neutral-400 hover:text-neutral-600 hover:-translate-y-0.5'
    : 'inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 hover:-translate-y-0.5';
  const variants: Record<string, string> = {
    primary:
      'bg-primary-500 text-white shadow-card hover:bg-primary-600 hover:shadow-card-hover active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed',
    secondary:
      icon
        ? 'bg-transparent border-none'
        : 'bg-white text-primary-500 border border-primary-500 hover:bg-primary-50 hover:shadow-card-hover active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed',
  };
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}; 