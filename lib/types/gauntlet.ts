import { Character } from './character';

export type GauntletTheme = 'colosseum' | 'crypt' | 'inferno' | 'wilds' | 'dungeon';

export type GauntletStatus = 'preparing' | 'active' | 'respite' | 'ready_for_wave' | 'completed' | 'failed';

export interface GauntletBoon {
    type: 'ac_boost' | 'speed_boost' | 'advantage_first_strike';
    name: string;
    value?: number;
}

export interface GauntletSnapshotHero {
    id: number;
    character_id: number;
    name: string;
    character_class: string;
    level: number;
    current_hp: number;
    max_hp: number;
    temp_hp: number;
    hit_dice_remaining: number;
    hit_dice_total: number;
    hit_die_type: string;
    spell_slots: Record<string, any>;
    is_alive: boolean;
    death_saves: {
        successes: number;
        failures: number;
    };
    created_at: string;
}

export interface GauntletRun {
    id: number;
    name: string;
    status: GauntletStatus;
    theme: GauntletTheme;
    party_level: number;
    party_size: number;
    current_wave: number;
    max_waves: number;
    is_endless: boolean;
    current_combat_session_id?: number;
    score: number;
    enemies_killed: number;
    damage_dealt: number;
    turns_elapsed: number;
    active_boons: GauntletBoon[];
    snapshot_heroes: GauntletSnapshotHero[];
    created_at: string;
    completed_at?: string;
}

export interface GauntletRunCreateRequest {
    name?: string;
    theme: GauntletTheme;
    character_ids: number[];
    auto_delete_oldest?: boolean;
}

export type RespiteChoiceType = 'breather' | 'arcane_surge' | 'supply_drop' | 'tactical_boon';

export interface RespiteRequest {
    choice_type: RespiteChoiceType;
    details?: {
        boon_kind?: 'ac_boost' | 'speed_boost' | 'advantage_first_strike';
    };
}
