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
    attack: (sessionId: number, data: { attacker_id: number; target_id: number; attack_name: string; attack_bonus: number; advantage?: boolean; disadvantage?: boolean; dm_override?: boolean; inspiration?: boolean; is_ranged?: boolean; weapon_slot?: string }) =>
        apiClient.post<any>(`/combat/sessions/${sessionId}/attack/`, data),

    // Cast a spell
    castSpell: (sessionId: number, data: {
        caster_id: number;
        target_id?: number | null;
        target_ids?: number[];
        spell_name: string;
        spell_level?: number;
        save_type?: string;
        save_dc?: number;
        damage_string?: string;
        damage_type?: number;
        is_healing?: boolean;
        is_ritual?: boolean;
        requires_concentration?: boolean;
        is_bonus_action?: boolean;
        casting_time?: string;
        half_on_save?: boolean;
    }) =>
        apiClient.post<{
            message: string;
            spell_name: string;
            spell_level?: number;
            is_bonus_action?: boolean;
            target?: string;
            target_id?: number;
            target_hp?: number;
            target_results?: Array<{
                target_id: number;
                target_name: string;
                target_hp: number;
                save_roll?: number;
                save_total?: number;
                save_success?: boolean;
                damage: number;
                healing?: number;
                condition_applied?: string | null;
            }>;
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

    // 5E Tactical Grid Movement
    move: (sessionId: number, data: { participant_id: number; target_x: number; target_y: number }) =>
        apiClient.post<{
            message: string;
            distance_ft: number;
            target_x: number;
            target_y: number;
            participant: any;
            opportunity_attacks?: Array<{
                reactor_name: string;
                attack_roll: number;
                hit: boolean;
                damage: number;
                target_hp_after: number;
            }>;
            session?: CombatSession;
        }>(`/combat/sessions/${sessionId}/move/`, data),

    dash: (sessionId: number, data: { participant_id: number; bonus_action?: boolean }) =>
        apiClient.post<{
            message: string;
            speed_added: number;
            total_speed: number;
            movement_remaining: number;
            participant: any;
            session?: CombatSession;
        }>(`/combat/sessions/${sessionId}/dash/`, data),

    disengage: (sessionId: number, data: { participant_id: number; bonus_action?: boolean }) =>
        apiClient.post<{
            message: string;
            participant: any;
            session?: CombatSession;
        }>(`/combat/sessions/${sessionId}/disengage/`, data),

    dodge: (sessionId: number, data: { participant_id: number; bonus_action?: boolean }) =>
        apiClient.post<{
            message: string;
            participant: any;
            session?: CombatSession;
        }>(`/combat/sessions/${sessionId}/dodge/`, data),
};
