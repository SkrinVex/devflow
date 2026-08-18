import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  icon,
  rightElement,
  label,
  error,
  className = '',
  style,
  ...props
}) => {
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        {icon && (
          <div style={{ position: 'absolute', left: '10px', display: 'flex', alignItems: 'center', color: 'var(--text-dim)', pointerEvents: 'none' }}>
            {icon}
          </div>
        )}
        <input
          className={`input-field ${className}`.trim()}
          style={{
            ...(icon ? { paddingLeft: '32px' } : {}),
            ...(rightElement ? { paddingRight: '36px' } : {}),
            ...(error ? { borderColor: 'var(--danger)' } : {}),
            ...style,
          }}
          {...props}
        />
        {rightElement && (
          <div style={{ position: 'absolute', right: '8px', display: 'flex', alignItems: 'center' }}>
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>
          {error}
        </div>
      )}
    </div>
  );
};
