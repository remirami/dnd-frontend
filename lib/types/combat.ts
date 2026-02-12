export interface CombatAction {
    id: number;
    action_type: string;
    action_type_display: string;
    actor: number;
    actor_name: string;
    target?: number;
    target_name?: string;
    attack_name?: string;
    attack_roll?: number;
    attack_modifier?: number;
    attack_total?: number;
    hit?: boolean;
    critical?: boolean;
    damage_total?: number;
    damage_type?: string;
    description: string;
    round_number: number;
    turn_number: number;
    timestamp: string;
}

export interface CombatParticipant {
    id: number;
    combat_session: number;
    participant_type: 'character' | 'enemy';
    character?: number;
    enemy?: number;
    encounter_enemy?: {
        enemy: number;
    };
    name: string;
    initiative: number;
    current_hp: number;
    max_hp: number;
    armor_class: number;
    is_player: boolean;
    is_active: boolean;
    conditions: string[];
}

export interface CombatSession {
    id: number;
    campaign?: number;
    encounter?: number;
    current_turn: number;
    round_number: number;
    is_active: boolean;
    status_display: string;
    started_at?: string;
    ended_at?: string;
    participants: CombatParticipant[];
    actions?: CombatAction[];
    current_participant?: CombatParticipant;
}

export interface CombatLogEntry {
    id: number;
    timestamp: string;
    message: string;
    action_type: 'damage' | 'healing' | 'turn' | 'status' | 'other';
}

export interface DamagePayload {
    participant_id: number;
    amount: number;
    damage_type?: string;
}

export interface HealingPayload {
    participant_id: number;
    amount: number;
}
