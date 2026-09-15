import { create } from 'zustand';
import { authApi } from '@/lib/api/auth';

interface User {
    id: number;
    username: string;
    email: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    initialized: boolean;

    login: (token: string, user: User) => void;
    logout: () => void;
    setUser: (user: User) => void;
    initialize: () => void;
    fetchCurrentUser: () => Promise<User | null>;
}

// Helper to get initial state from localStorage
const getInitialState = () => {
    if (typeof window === 'undefined') {
        return { token: null, user: null, isAuthenticated: false };
    }

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    let user = null;
    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        try {
            user = JSON.parse(userStr);
        } catch (e) {
            console.error('Failed to parse user from localStorage:', e);
            localStorage.removeItem('user');
        }
    }

    return {
        token: token && token !== 'undefined' ? token : null,
        user,
        isAuthenticated: !!(token && token !== 'undefined'),
    };
};

export const useAuthStore = create<AuthState>((set) => ({
    ...getInitialState(),
    initialized: false,

    initialize: () => {
        const state = getInitialState();
        set({ ...state, initialized: true });
        if (state.token && !state.user) {
            authApi.getCurrentUser().then((response) => {
                if (response.data) {
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('user', JSON.stringify(response.data));
                    }
                    set({ user: response.data, isAuthenticated: true });
                }
            }).catch((err) => {
                console.error('Failed to fetch current user on initialize:', err);
            });
        }
    },

    login: (token, user) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
        }
        set({ token, user, isAuthenticated: true });
    },

    logout: async () => {
        await authApi.logout();
        set({ token: null, user: null, isAuthenticated: false });
    },

    setUser: (user) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(user));
        }
        set({ user });
    },

    fetchCurrentUser: async () => {
        try {
            const response = await authApi.getCurrentUser();
            const user = response.data;
            if (user) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('user', JSON.stringify(user));
                }
                set({ user, isAuthenticated: true });
                return user;
            }
        } catch (e) {
            console.error('Failed to fetch current user:', e);
        }
        return null;
    },
}));
