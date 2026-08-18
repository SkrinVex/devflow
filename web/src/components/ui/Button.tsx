import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const variantClass = `btn-${variant}`;
  const sizeClass = size === 'icon' ? 'btn-icon' : '';

  const sizeStyles: React.CSSProperties = {
    ...(size === 'sm' ? { fontSize: '11.5px', padding: '3px 8px' } : {}),
    ...(size === 'lg' ? { fontSize: '14px', padding: '8px 16px' } : {}),
    ...style,
  };

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      style={sizeStyles}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      ) : null}
      {children}
    </button>
  );
};
