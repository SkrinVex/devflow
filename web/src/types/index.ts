export type SnippetType = 'prompt' | 'code' | 'secret' | 'note';

export interface Snippet {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: SnippetType;
  language: string;
  tags: string[];
  variables: string[];
  is_pinned: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  is_2fa_enabled: boolean;
  created_at: string;
}

export interface TagCount {
  name: string;
  count: number;
}

export interface DetectResponse {
  suggested_title: string;
  detected_type: SnippetType;
  detected_language: string;
  auto_tags: string[];
  extracted_vars: string[];
  is_likely_secret: boolean;
}

export interface PasswordStrength {
  score: number;
  entropy: number;
  is_valid: boolean;
  requirements: string[];
}

export interface AuthResponse {
  token?: string;
  user?: UserProfile;
  requires_2fa?: boolean;
  temp_token?: string;
  backup_codes?: string[];
}

export interface Setup2FAResponse {
  secret: string;
  qr_code: string;
}

export interface SnippetFilter {
  q?: string;
  type?: SnippetType | '';
  language?: string;
  tag?: string;
  is_pinned?: boolean;
  is_favorite?: boolean;
  is_archived?: boolean;
  limit?: number;
  offset?: number;
}
