import apiClient from './client';

export const authApi = {
    login: (username: string, password: string) =>
        apiClient.post('/auth/login/', { username, password }),

    register: (username: string, password: string, email: string) =>
        apiClient.post('/auth/register/', {
            username,
            password,
            password2: password,  // Django expects password confirmation
            email
        }),

    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
    },
};
