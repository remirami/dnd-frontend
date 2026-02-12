import apiClient from './client';
import type { Enemy } from '@/lib/types/enemy';

export const enemiesApi = {
    getAll: () => apiClient.get<Enemy[]>('/enemies/'),
    search: (query: string) => apiClient.get<Enemy[]>(`/enemies/?search=${encodeURIComponent(query)}`),
    getById: (id: number) => apiClient.get<Enemy>(`/enemies/${id}/`),
};
