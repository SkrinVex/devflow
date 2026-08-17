import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useI18n } from '../context/LanguageContext';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmText,
  cancelText,
  isDanger = false,
  onConfirm,
  onClose,
}) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 18px 0 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isDanger ? (
              <AlertTriangle size={17} color="var(--danger)" />
            ) : null}
            <h3 style={{ fontSize: '14.5px', fontWeight: '600' }}>{title}</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '14px 18px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            {description}
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px'
        }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: '12.5px' }}>
            {cancelText || t.cancel}
          </button>
          <button
            className={isDanger ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{ fontSize: '12.5px' }}
          >
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
