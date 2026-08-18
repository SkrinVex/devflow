import React from 'react';
import type { SnippetType } from '../../types';
import { Sparkles, Code, KeyRound, FileText } from 'lucide-react';

export interface BadgeProps {
  type?: SnippetType | string;
  label?: string;
  variant?: 'prompt' | 'code' | 'secret' | 'note';
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  type,
  label,
  variant,
  showIcon = true,
}) => {
  const resolvedType = (variant || type || 'note') as SnippetType;
  const badgeClass = `badge badge-${resolvedType}`;

  const renderIcon = () => {
    if (!showIcon) return null;
    switch (resolvedType) {
      case 'prompt':
        return <Sparkles size={11} />;
      case 'code':
        return <Code size={11} />;
      case 'secret':
        return <KeyRound size={11} />;
      case 'note':
      default:
        return <FileText size={11} />;
    }
  };

  const displayText = label || (type === 'code' ? 'Code' : type === 'prompt' ? 'Prompt' : type === 'secret' ? 'Secret' : 'Note');

  return (
    <span className={badgeClass}>
      {renderIcon()}
      <span>{displayText}</span>
    </span>
  );
};
