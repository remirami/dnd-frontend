import { create } from 'zustand';

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
    },

    login: (token, user) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
        }
        set({ token, user, isAuthenticated: true });
    },

    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        set({ token: null, user: null, isAuthenticated: false });
    },

    setUser: (user) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(user));
        }
        set({ user });
    },
}));
