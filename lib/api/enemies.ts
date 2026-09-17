import apiClient from './client';
import type { Enemy } from '@/lib/types/enemy';

export interface EnemyFilters {
    search?: string;
    type?: string;
    cr?: string;
}

function buildParams(filters: EnemyFilters): string {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.type)   params.set('type', filters.type);
    if (filters.cr)     params.set('cr', filters.cr);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
}

export const enemiesApi = {
    getAll: () => apiClient.get<Enemy[]>('/enemies/'),
    search: (query: string) => apiClient.get<Enemy[]>(`/enemies/?search=${encodeURIComponent(query)}`),
    filter: (filters: EnemyFilters) => apiClient.get<Enemy[]>(`/enemies/${buildParams(filters)}`),
    random: (filters: EnemyFilters = {}) => apiClient.get<Enemy>(`/enemies/random/${buildParams(filters)}`),
    getById: (id: number) => apiClient.get<Enemy>(`/enemies/${id}/`),
};
