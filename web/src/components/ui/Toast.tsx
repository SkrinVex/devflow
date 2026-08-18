import React from 'react';
import type { ToastMessage } from '../../hooks/useToast';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-item ${t.type === 'success' ? 'toast-success' : t.type === 'error' ? 'toast-error' : ''}`}
        >
          {t.type === 'success' ? (
            <Check size={14} />
          ) : t.type === 'error' ? (
            <AlertCircle size={14} />
          ) : (
            <Info size={14} />
          )}
          <span style={{ flex: 1 }}>{t.text}</span>
          <button
            className="btn btn-ghost btn-icon"
            style={{ padding: '2px', marginLeft: '6px' }}
            onClick={() => onRemove(t.id)}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};
