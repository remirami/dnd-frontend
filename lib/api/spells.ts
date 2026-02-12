import apiClient from './client';

export const spellsApi = {
    getAll: () => apiClient.get('/spells/'),
    search: (query: string, params?: Record<string, any>) => {
        const queryParams = new URLSearchParams({ search: query, ...params });
        return apiClient.get(`/spells/?${queryParams.toString()}`);
    },
    getById: (id: number) => apiClient.get(`/spells/${id}/`),
};
