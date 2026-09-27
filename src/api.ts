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

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || data.error || 'Network request failed');
    }

    return data as T;
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
    return this.request<{ success: boolean; message: string; token?: string }>('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(resetToken: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword }),
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
