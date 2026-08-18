export type SnippetType = 'prompt' | 'code' | 'secret' | 'note';

export type Language = 'ru' | 'en';
export type Theme = 'dark' | 'light';

export interface User {
  id: string;
  username: string;
  email: string;
  is_2fa_enabled: boolean;
  created_at?: string;
}

export interface Snippet {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: SnippetType;
  language: string;
  tags: string[];
  variables?: string[];
  is_pinned: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TagCount {
  name: string;
  count: number;
}

export interface CreateSnippetRequest {
  title?: string;
  content: string;
  type?: SnippetType;
  language?: string;
  tags?: string[];
  is_pinned?: boolean;
  is_favorite?: boolean;
}

export interface UpdateSnippetRequest {
  title?: string;
  content?: string;
  type?: SnippetType;
  language?: string;
  tags?: string[];
  is_pinned?: boolean;
  is_favorite?: boolean;
  is_archived?: boolean;
}

export interface ListSnippetsParams {
  q?: string;
  type?: SnippetType | '';
  tag?: string;
  language?: string;
  is_pinned?: boolean;
  is_favorite?: boolean;
  is_archived?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListSnippetsResponse {
  items: Snippet[];
  total: number;
}

export interface DetectResponse {
  detected_type: SnippetType;
  detected_language: string;
  suggested_title: string;
  auto_tags: string[];
  extracted_vars: string[];
}

export interface PasswordStrengthResponse {
  score: number; // 0-4
  label: string;
  is_strong: boolean;
  feedback: string[];
}

export interface AuthResponse {
  token?: string;
  user?: User;
  requires_2fa?: boolean;
  temp_token?: string;
}

export interface TwoFASetupResponse {
  secret: string;
  qr_code_url: string;
}

export interface TwoFAConfirmResponse {
  backup_codes: string[];
}

export interface VaultExport {
  version: string;
  exported_at: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  snippets: Snippet[];
}

export interface WebSocketEvent {
  type: 'connected' | 'snippet:created' | 'snippet:updated' | 'snippet:deleted' | 'snippet:pinned' | 'snippet:favorited' | 'vault:imported';
  user_id?: string;
  payload?: any;
  timestamp?: string;
}
