import apiClient from './client';
import type { CombatSession, DamagePayload, HealingPayload } from '@/lib/types/combat';

export const combatApi = {
    // Get all combat sessions
    getAll: () => apiClient.get<CombatSession[]>('/combat/sessions/'),

    // Get a specific combat session
    getById: (id: number) => apiClient.get<CombatSession>(`/combat/sessions/${id}/`),

    // Create a new combat session
    create: (data: { campaign?: number; encounter?: number }) =>
        apiClient.post<CombatSession>('/combat/sessions/', data),

    // Start combat
    start: (id: number) => apiClient.post<CombatSession>(`/combat/sessions/${id}/start/`),

    // Advance to next turn
    nextTurn: (id: number) => apiClient.post<{ message: string; session: CombatSession }>(`/combat/sessions/${id}/next_turn/`),

    // Apply damage to a participant
    applyDamage: (participantId: number, data: { amount: number; source_id?: number; damage_type?: number }) =>
        apiClient.post(`/combat/participants/${participantId}/damage/`, data),

    // Apply healing to a participant
    applyHealing: (participantId: number, data: { amount: number; source_id?: number }) =>
        apiClient.post(`/combat/participants/${participantId}/heal/`, data),

    // End combat
    end: (id: number) => apiClient.post<CombatSession>(`/combat/sessions/${id}/end/`),

    // Delete combat session
    delete: (id: number) => apiClient.delete(`/combat/sessions/${id}/`),

    // Add participant to combat
    addParticipant: (id: number, data: { participant_type: 'character' | 'enemy'; character_id?: number; enemy_id?: number; enemy_name?: string }) =>
        apiClient.post<CombatSession>(`/combat/sessions/${id}/add_participant/`, data),

    // Roll initiative for all participants
    rollInitiative: (id: number) => apiClient.post<CombatSession>(`/combat/sessions/${id}/roll_initiative/`),

    // Make an attack
    attack: (sessionId: number, data: { attacker_id: number; target_id: number; attack_name: string; attack_bonus: number }) =>
        apiClient.post<any>(`/combat/sessions/${sessionId}/attack/`, data),
};
