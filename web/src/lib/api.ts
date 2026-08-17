import type { 
  AuthResponse, 
  DetectResponse, 
  PasswordStrength, 
  Setup2FAResponse, 
  Snippet, 
  SnippetFilter, 
  TagCount, 
  UserProfile 
} from '../types';

const API_BASE = '/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('devflow_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('devflow_token', token);
    } else {
      localStorage.removeItem('devflow_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      const errorMsg = data.message || data.error || `HTTP error ${response.status}`;
      throw new Error(errorMsg);
    }

    return (data.data !== undefined ? data.data : data) as T;
  }

  // Auth
  async register(req: { username: string; email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  async login(req: { username: string; password: string; code_2fa?: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  async verify2FATemp(tempToken: string, code: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/2fa/verify-temp', {
      method: 'POST',
      body: JSON.stringify({ temp_token: tempToken, code }),
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  async checkPasswordStrength(password: string): Promise<PasswordStrength> {
    return this.request<PasswordStrength>('/auth/check-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me');
  }

  async setup2FA(): Promise<Setup2FAResponse> {
    return this.request<Setup2FAResponse>('/auth/2fa/setup', { method: 'POST' });
  }

  async confirm2FA(secret: string, code: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/2fa/confirm', {
      method: 'POST',
      body: JSON.stringify({ secret, code }),
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  async disable2FA(password: string): Promise<void> {
    await this.request('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.request('/auth/password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // Snippets
  async listSnippets(filter: SnippetFilter = {}): Promise<{ items: Snippet[]; total: number }> {
    const params = new URLSearchParams();
    if (filter.q) params.set('q', filter.q);
    if (filter.type) params.set('type', filter.type);
    if (filter.language) params.set('language', filter.language);
    if (filter.tag) params.set('tag', filter.tag);
    if (filter.is_pinned !== undefined) params.set('is_pinned', String(filter.is_pinned));
    if (filter.is_favorite !== undefined) params.set('is_favorite', String(filter.is_favorite));
    if (filter.is_archived !== undefined) params.set('is_archived', String(filter.is_archived));
    if (filter.limit) params.set('limit', String(filter.limit));
    if (filter.offset) params.set('offset', String(filter.offset));

    const qs = params.toString();
    return this.request<{ items: Snippet[]; total: number }>(`/snippets${qs ? `?${qs}` : ''}`);
  }

  async createSnippet(data: {
    title?: string;
    content: string;
    type?: string;
    language?: string;
    tags?: string[];
    is_pinned?: boolean;
    is_favorite?: boolean;
  }): Promise<Snippet> {
    return this.request<Snippet>('/snippets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSnippet(id: string): Promise<Snippet> {
    return this.request<Snippet>(`/snippets/${id}`);
  }

  async updateSnippet(id: string, data: Partial<Snippet>): Promise<Snippet> {
    return this.request<Snippet>(`/snippets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSnippet(id: string): Promise<void> {
    await this.request(`/snippets/${id}`, { method: 'DELETE' });
  }

  async togglePin(id: string): Promise<Snippet> {
    return this.request<Snippet>(`/snippets/${id}/pin`, { method: 'POST' });
  }

  async toggleFavorite(id: string): Promise<Snippet> {
    return this.request<Snippet>(`/snippets/${id}/favorite`, { method: 'POST' });
  }

  async runPrompt(id: string, variables: Record<string, string>): Promise<{ rendered_content: string }> {
    return this.request<{ rendered_content: string }>(`/snippets/${id}/run`, {
      method: 'POST',
      body: JSON.stringify({ variables }),
    });
  }

  async detectContent(content: string): Promise<DetectResponse> {
    return this.request<DetectResponse>('/detect', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getTags(): Promise<TagCount[]> {
    return this.request<TagCount[]>('/tags');
  }

  // Vault Export / Import
  async exportVault(): Promise<any> {
    return this.request<any>('/vault/export');
  }

  async importVault(exportData: any): Promise<{ imported_count: number }> {
    return this.request<{ imported_count: number }>('/vault/import', {
      method: 'POST',
      body: JSON.stringify(exportData),
    });
  }
}

export const api = new ApiClient();
