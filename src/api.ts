import type { PublicUser, PrivateUser, PublicWish, InAppNotification, SecurityLog, OutboxEmail } from './types';

const TOKEN_KEY = 'birthdayboard_token';
const GUEST_KEY = 'birthdayboard_guest_token';
const SIMULATED_DATE_KEY = 'birthdayboard_simulated_date';

// Memory storage fallback for partitioned/cross-origin iframes
const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Storage access blocked or restricted in iframe
    }
    return memoryStorage[key] ?? null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Storage access blocked or restricted in iframe
    }
    memoryStorage[key] = value;
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Storage access blocked
    }
    delete memoryStorage[key];
  },
};

export const api = {
  getToken(): string | null {
    return safeStorage.getItem(TOKEN_KEY);
  },

  getGuestToken(): string {
    let guestToken = safeStorage.getItem(GUEST_KEY);
    if (!guestToken) {
      guestToken = `guest_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;
      safeStorage.setItem(GUEST_KEY, guestToken);
    }
    return guestToken;
  },

  setToken(token: string | null) {
    if (token) {
      safeStorage.setItem(TOKEN_KEY, token);
    } else {
      safeStorage.removeItem(TOKEN_KEY);
    }
  },

  getSimulatedDate(): string {
    return safeStorage.getItem(SIMULATED_DATE_KEY) || new Date().toISOString().split('T')[0];
  },

  setSimulatedDate(date: string) {
    safeStorage.setItem(SIMULATED_DATE_KEY, date);
  },

  async request<T>(endpoint: string, options: RequestInit = {}, retries = 1): Promise<T> {
    const token = this.getToken();
    const guestToken = this.getGuestToken();
    const simulatedDate = this.getSimulatedDate();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-simulated-date': simulatedDate,
      'x-guest-token': guestToken,
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let lastError: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`/api${endpoint}`, {
          ...options,
          headers,
        });

        // Parse response body safely
        const text = await res.text();
        let data: any = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { message: text };
        }

        if (!res.ok) {
          // If server error 502/503/504 or Neon cold start error, retry once
          if (attempt < retries && (res.status === 502 || res.status === 503 || res.status === 504 || (res.status === 500 && data.message?.includes('Database operation failed')))) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }

          let errorMessage = data.message || data.error;

          // Detect edge 404 HTML/text pages (like Vercel NOT_FOUND cpt1::... or proxy 404s)
          if (res.status === 404 || (errorMessage && (errorMessage.includes('NOT_FOUND') || errorMessage.includes('page could not be found') || errorMessage.includes('<!DOCTYPE')))) {
            errorMessage = 'API server endpoint not found (404). If deployed on Vercel or a static host, ensure serverless API routes (api/index.ts) and vercel.json rewrites are deployed, and DATABASE_URL is set in environment variables.';
          }

          const defaultMsg =
            res.status === 502 || res.status === 503 || res.status === 504
              ? 'Database or server is temporarily unavailable or resuming from sleep. Please try again in a moment.'
              : res.status === 500
              ? errorMessage || 'Database connection error. If using Neon database, please allow a few seconds for it to wake up.'
              : `Request failed with status ${res.status}`;

          throw new Error(errorMessage || defaultMsg);
        }

        return data as T;
      } catch (err: any) {
        lastError = err;
        const isNetworkErr =
          err.name === 'TypeError' ||
          err.message?.includes('fetch') ||
          err.message?.includes('NetworkError') ||
          err.message?.includes('Network request failed');

        if (attempt < retries && isNetworkErr) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }

        if (isNetworkErr) {
          throw new Error('Network request failed: Could not connect to the server. Please check your internet connection or try again in a few seconds.');
        }
        throw err;
      }
    }
    throw lastError;
  },

  // Auth
  async signup(payload: {
    email: string;
    password: string;
    realName: string;
    birthday: string;
    gender: string;
    displayName: string;
  }) {
    return this.request<{ token: string; user: PrivateUser; verificationCodePreview?: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async login(payload: { email: string; password: string }) {
    return this.request<{ token: string; user: PrivateUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async generateAiWish(params: { recipientName?: string; tone?: string; hint?: string }) {
    return this.request<{ wish: string }>('/ai/generate-wish', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getMe() {
    return this.request<{ user: PrivateUser }>('/auth/me');
  },

  async getSystemInfo() {
    return this.request<{
      status: string;
      serverTime: string;
      serverDate: string;
      formattedDate: string;
      totalMembers: number;
      totalWishesDelivered: number;
      activeCelebrationsToday: number;
      upcomingCelebrationsThisWeek: number;
    }>('/system/info');
  },

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  },

  async verifyEmail(code?: string) {
    return this.request<{ success: boolean; message: string; user: PrivateUser }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  async requestPasswordReset(email: string) {
    return this.request<{ success: boolean; message: string; previewCode?: string }>('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(params: { email: string; code: string; newPassword: string }) {
    return this.request<{ success: boolean; token: string; user: PrivateUser; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // User Settings & Privacy Verification
  async updateDisplayName(displayName: string) {
    return this.request<{ success: boolean; message: string; user: PrivateUser }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ displayName }),
    });
  },

  async updateUserProfile(payload: { displayName?: string; birthday?: string; gender?: string; avatarSeed?: string }) {
    return this.request<{ success: boolean; message: string; user: PrivateUser }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Test intentionally attempting to modify locked fields (to verify server-side rejection & logging)
  async attemptModifyLockedFields(fieldsToTry: Record<string, any>) {
    return this.request<any>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(fieldsToTry),
    });
  },

  // Public Users & Birthdays
  async getUsers(params: { filter?: 'today' | 'week' | 'all'; search?: string; gender?: string } = {}) {
    const q = new URLSearchParams();
    if (params.filter) q.set('filter', params.filter);
    if (params.search) q.set('search', params.search);
    if (params.gender) q.set('gender', params.gender);

    return this.request<{
      users: PublicUser[];
      meta: {
        simulatedDate: string;
        totalCount: number;
        todayCount: number;
        weekCount: number;
      };
    }>(`/users?${q.toString()}`);
  },

  async getUserProfile(userId: string) {
    return this.request<{
      user: PublicUser;
      wishes: PublicWish[];
      simulatedDate: string;
    }>(`/users/${userId}`);
  },

  // Wish Board
  async postWish(
    userId: string,
    payload: {
      message: string;
      theme: string;
      anonymousHandleType?: string;
      reactionEmoji?: string;
      musicTrack?: string;
    }
  ) {
    return this.request<{ success: boolean; wish: PublicWish }>(`/users/${userId}/wishes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteWish(userId: string, wishId: string) {
    return this.request<{ success: boolean; message: string }>(`/users/${userId}/wishes/${wishId}`, {
      method: 'DELETE',
    });
  },

  async likeWish(userId: string, wishId: string) {
    return this.request<{ success: boolean; liked: boolean; likesCount: number }>(
      `/users/${userId}/wishes/${wishId}/like`,
      {
        method: 'POST',
      }
    );
  },

  // Notifications
  async getNotifications() {
    return this.request<{ notifications: InAppNotification[] }>('/notifications');
  },

  async markNotificationRead(id: string) {
    return this.request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async clearNotifications() {
    return this.request<{ success: boolean }>('/notifications', {
      method: 'DELETE',
    });
  },

  // Outbox & Logs
  async getOutbox() {
    return this.request<{ emails: OutboxEmail[] }>('/outbox');
  },

  async getSecurityLogs() {
    return this.request<{ logs: SecurityLog[] }>('/security-logs');
  },

  async cleanAllUsers() {
    return this.request<{ success: boolean; message: string }>('/admin/clean-all-users', {
      method: 'POST',
    });
  },

  async setServerSimulatedDate(date: string) {
    return this.request<{ success: boolean; simulatedDate: string }>('/dev/simulate-date', {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  },
};
