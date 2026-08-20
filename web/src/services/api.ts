import type {
  User,
  Snippet,
  CreateSnippetRequest,
  UpdateSnippetRequest,
  ListSnippetsParams,
  ListSnippetsResponse,
  DetectResponse,
  PasswordStrengthResponse,
  AuthResponse,
  TwoFASetupResponse,
  TwoFAConfirmResponse,
  TagCount,
  VaultExport,
} from '../types';

class ApiService {
  private get baseUrl(): string {
    return '/api/v1';
  }

  private getToken(): string | null {
    return localStorage.getItem('devflow_token');
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
      // Clear token on 401 Unauthorized
      localStorage.removeItem('devflow_token');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data.data !== undefined ? data.data : data;
  }

  // --- Auth Endpoints ---

  async register(req: { username: string; email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async login(req: { username?: string; login?: string; password: string }): Promise<AuthResponse> {
    const ident = req.username || req.login || '';
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: ident,
        login: ident,
        password: req.password,
      }),
    });
  }

  async verify2FATemp(tempToken: string, code: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/2fa/verify-temp', {
      method: 'POST',
      body: JSON.stringify({ temp_token: tempToken, code }),
    });
  }

  async checkPassword(password: string): Promise<PasswordStrengthResponse> {
    return this.request<PasswordStrengthResponse>('/auth/check-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async setup2FA(): Promise<TwoFASetupResponse> {
    return this.request<TwoFASetupResponse>('/auth/2fa/setup', {
      method: 'POST',
    });
  }

  async confirm2FA(code: string): Promise<TwoFAConfirmResponse> {
    return this.request<TwoFAConfirmResponse>('/auth/2fa/confirm', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async disable2FA(password: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('devflow_token');
    }
  }

  // --- Snippet Endpoints ---

  async listSnippets(params: ListSnippetsParams = {}): Promise<ListSnippetsResponse> {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.type) query.set('type', params.type);
    if (params.tag) query.set('tag', params.tag);
    if (params.language) query.set('language', params.language);
    if (params.is_pinned !== undefined) query.set('is_pinned', String(params.is_pinned));
    if (params.is_favorite !== undefined) query.set('is_favorite', String(params.is_favorite));
    if (params.is_archived !== undefined) query.set('is_archived', String(params.is_archived));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));

    const qs = query.toString();
    return this.request<ListSnippetsResponse>(`/snippets${qs ? `?${qs}` : ''}`);
  }

  async getSnippet(id: string): Promise<Snippet> {
    return this.request<Snippet>(`/snippets/${id}`);
  }

  async createSnippet(req: CreateSnippetRequest): Promise<Snippet> {
    return this.request<Snippet>('/snippets', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async updateSnippet(id: string, req: UpdateSnippetRequest): Promise<Snippet> {
    return this.request<Snippet>(`/snippets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    });
  }

  async deleteSnippet(id: string): Promise<void> {
    await this.request(`/snippets/${id}`, {
      method: 'DELETE',
    });
  }

  async togglePin(id: string): Promise<Snippet> {
    return this.request<Snippet>(`/snippets/${id}/pin`, {
      method: 'POST',
    });
  }

  async toggleFavorite(id: string): Promise<Snippet> {
    return this.request<Snippet>(`/snippets/${id}/favorite`, {
      method: 'POST',
    });
  }

  async runPrompt(id: string, variables: Record<string, string>): Promise<{ rendered_content: string }> {
    return this.request<{ rendered_content: string }>(`/snippets/${id}/run`, {
      method: 'POST',
      body: JSON.stringify({ variables }),
    });
  }

  async detect(content: string): Promise<DetectResponse> {
    return this.request<DetectResponse>('/detect', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getTags(): Promise<TagCount[]> {
    return this.request<TagCount[]>('/tags');
  }

  // --- Vault Export / Import ---

  async exportVault(): Promise<VaultExport> {
    return this.request<VaultExport>('/vault/export');
  }

  async importVault(exportData: VaultExport): Promise<{ message: string; imported_count: number }> {
    return this.request<{ message: string; imported_count: number }>('/vault/import', {
      method: 'POST',
      body: JSON.stringify(exportData),
    });
  }
}

export const api = new ApiService();
