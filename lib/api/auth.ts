import apiClient from './client';

export interface PasswordResetConfirmData {
  uidb64: string;
  token: string;
  password: string;
  password2: string;
}

export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post('/auth/login/', { username, password }),

  register: (username: string, password: string, email: string, firstName?: string, lastName?: string) =>
    apiClient.post('/auth/register/', {
      username,
      password,
      password2: password,
      email,
      first_name: firstName || '',
      last_name: lastName || '',
    }),

  getCurrentUser: () =>
    apiClient.get('/auth/me/'),

  logout: async () => {
    try {
      await apiClient.post('/auth/logout/');
    } catch {
      // Ignore network errors on logout
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },

  requestPasswordReset: (email: string) =>
    apiClient.post('/auth/password-reset/', { email }),

  confirmPasswordReset: (data: PasswordResetConfirmData) =>
    apiClient.post('/auth/password-reset/confirm/', data),
};
