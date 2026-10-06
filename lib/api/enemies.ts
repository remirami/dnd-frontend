import apiClient from './client';
import type { Enemy, EnemyListResponse } from '@/lib/types/enemy';

export interface EnemyFilters {
    search?: string;
    type?: string;
    cr?: string;
    page?: number;
}

function buildParams(filters: EnemyFilters): string {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.type)   params.set('type', filters.type);
    if (filters.cr)     params.set('cr', filters.cr);
    if (filters.page)   params.set('page', filters.page.toString());
    const qs = params.toString();
    return qs ? `?${qs}` : '';
}

export const enemiesApi = {
    getAll: (page: number = 1) => apiClient.get<EnemyListResponse>(`/enemies/?page=${page}`),
    search: (query: string, page: number = 1) => apiClient.get<EnemyListResponse>(`/enemies/?search=${encodeURIComponent(query)}&page=${page}`),
    filter: (filters: EnemyFilters) => apiClient.get<EnemyListResponse>(`/enemies/${buildParams(filters)}`),
    random: (filters: EnemyFilters = {}) => apiClient.get<Enemy>(`/enemies/random/${buildParams(filters)}`),
    getById: (id: number) => apiClient.get<Enemy>(`/enemies/${id}/`),
};

