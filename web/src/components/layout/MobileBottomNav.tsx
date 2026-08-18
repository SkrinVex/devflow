import React from 'react';
import { 
  Layers, 
  Sparkles, 
  Code, 
  KeyRound, 
  FileText 
} from 'lucide-react';
import type { SnippetType } from '../../types';
import { useI18n } from '../../context/LanguageContext';

export interface MobileBottomNavProps {
  activeType: SnippetType | '';
  onTypeChange: (type: SnippetType | '') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeType,
  onTypeChange,
}) => {
  const { t } = useI18n();

  return (
    <nav className="mobile-bottom-bar">
      <button
        className={`mobile-nav-btn ${activeType === '' ? 'active' : ''}`}
        onClick={() => onTypeChange('')}
      >
        <Layers size={17} />
        <span>{t.mobileNavAll}</span>
      </button>
      <button
        className={`mobile-nav-btn ${activeType === 'prompt' ? 'active' : ''}`}
        onClick={() => onTypeChange('prompt')}
      >
        <Sparkles size={17} />
        <span>{t.mobileNavPrompts}</span>
      </button>
      <button
        className={`mobile-nav-btn ${activeType === 'code' ? 'active' : ''}`}
        onClick={() => onTypeChange('code')}
      >
        <Code size={17} />
        <span>{t.mobileNavCode}</span>
      </button>
      <button
        className={`mobile-nav-btn ${activeType === 'secret' ? 'active' : ''}`}
        onClick={() => onTypeChange('secret')}
      >
        <KeyRound size={17} />
        <span>{t.mobileNavSecrets}</span>
      </button>
      <button
        className={`mobile-nav-btn ${activeType === 'note' ? 'active' : ''}`}
        onClick={() => onTypeChange('note')}
      >
        <FileText size={17} />
        <span>{t.mobileNavNotes}</span>
      </button>
    </nav>
  );
};
