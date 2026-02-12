import apiClient from './client';

export const racesApi = {
    getAll: (params?: any) => apiClient.get('/character-races/', { params }),
};

export const classesApi = {
    getAll: (params?: any) => apiClient.get('/character-classes/', { params }),
};

export const backgroundsApi = {
    getAll: (params?: any) => apiClient.get('/character-backgrounds/', { params }),
};
