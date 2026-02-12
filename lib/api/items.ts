import apiClient from './client';

export const itemsApi = {
    getAll: () => apiClient.get('/items/'),
    search: (query: string) => apiClient.get(`/items/?search=${encodeURIComponent(query)}`),
    getById: (id: number) => apiClient.get(`/items/${id}/`),
};
