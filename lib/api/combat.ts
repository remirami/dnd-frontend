import apiClient from './client';
import type { CombatSession, DamagePayload, HealingPayload, AITurnResponse, AutoEnemyTurnsResponse } from '@/lib/types/combat';

export const combatApi = {
    // Get all combat sessions
    getAll: () => apiClient.get<CombatSession[]>('/combat/sessions/'),

    // Get a specific combat session
    getById: (id: number) => apiClient.get<CombatSession>(`/combat/sessions/${id}/`),

    // Create a new combat session
    create: (data: { campaign?: number; encounter?: number; auto_delete_oldest?: boolean }) =>
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

    // Remove participant from combat
    removeParticipant: (id: number, data: { participant_id?: number; character_id?: number }) =>
        apiClient.post<{ message: string; session: CombatSession }>(`/combat/sessions/${id}/remove_participant/`, data),

    // Roll initiative for participants (auto-rolls for those without manual overrides)
    rollInitiative: (id: number, overrides?: Record<number, number>) =>
        apiClient.post<CombatSession>(`/combat/sessions/${id}/roll_initiative/`, overrides ? { overrides } : {}),

    // Make an attack
    attack: (sessionId: number, data: { attacker_id: number; target_id: number; attack_name: string; attack_bonus: number; advantage?: boolean; disadvantage?: boolean; dm_override?: boolean; inspiration?: boolean }) =>
        apiClient.post<any>(`/combat/sessions/${sessionId}/attack/`, data),

    // Cast a spell
    castSpell: (sessionId: number, data: {
        caster_id: number;
        target_id?: number | null;
        spell_name: string;
        spell_level?: number;
        save_type?: string;
        save_dc?: number;
        damage_string?: string;
        damage_type?: number;
        is_healing?: boolean;
        is_ritual?: boolean;
        requires_concentration?: boolean;
    }) =>
        apiClient.post<{
            message: string;
            spell_name: string;
            spell_level?: number;
            target?: string;
            target_id?: number;
            target_hp?: number;
            is_healing?: boolean;
            healing_amount?: number;
            save_type?: string;
            save_dc?: number;
            save_roll?: number;
            save_total?: number;
            save_success?: boolean;
            damage?: number;
            condition_applied?: string | null;
            concentration_started?: boolean;
            action: any;
            session?: CombatSession;
        }>(`/combat/sessions/${sessionId}/cast_spell/`, data),

    // Use consumable item (Potion of Healing, etc.)
    useItem: (sessionId: number, data: {
        participant_id: number;
        target_id?: number;
        item_name?: string;
    }) =>
        apiClient.post<{
            message: string;
            heal_amount: number;
            actual_healed: number;
            target_hp: number;
            action: any;
        }>(`/combat/sessions/${sessionId}/use_item/`, data),

    // Use class feature / trait (Lay on Hands, Second Wind, Rage, Action Surge, etc.)
    useFeature: (sessionId: number, data: {
        participant_id: number;
        target_id?: number;
        feature_name: string;
        amount?: number;
        cure_poison?: boolean;
        end_rage?: boolean;
        subaction?: string;
        [key: string]: any;
    }) =>
        apiClient.post<{
            message: string;
            healed_amount?: number;
            actual_healed?: number;
            remaining_pool?: number;
            target_hp?: number;
            action: any;
            [key: string]: any;
        }>(`/combat/sessions/${sessionId}/use_feature/`, data),

    // AI: Resolve current enemy's turn
    aiTurn: (sessionId: number) =>
        apiClient.post<AITurnResponse>(`/combat/sessions/${sessionId}/ai_turn/`),

    // AI: Resolve all consecutive enemy turns
    autoEnemyTurns: (sessionId: number) =>
        apiClient.post<AutoEnemyTurnsResponse>(`/combat/sessions/${sessionId}/auto_enemy_turns/`),
};
