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
    damage_amount?: number;
    damage_type?: string;
    is_ai?: boolean;
    description: string;
    round_number: number;
    turn_number: number;
    timestamp: string;
}

// --- Character Sheet Types (nested in CombatParticipant.character) ---

export interface CharacterStats {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    strength_modifier: number;
    dexterity_modifier: number;
    constitution_modifier: number;
    intelligence_modifier: number;
    wisdom_modifier: number;
    charisma_modifier: number;
    hit_points: number;
    max_hit_points: number;
    armor_class: number;
    speed: number;
    initiative: number;
    spell_save_dc?: number | null;
    spell_attack_bonus?: number | null;
    spell_slots: Record<string, number>;       // e.g. { "1": 4, "2": 3 }
    expended_spell_slots: Record<string, number>;
}

export interface CharacterItemDetails {
    id: number;
    name: string;
    description: string;
    weight: number;
    rarity: string;
    category: string;
    properties: string[];
    // Weapon fields (present when item is a weapon)
    weapon_type?: string;
    weapon_type_display?: string;
    damage_dice?: string;
    damage_type?: string;
    damage_type_id?: number;
    finesse?: boolean;
    thrown?: boolean;
    two_handed?: boolean;
    heavy?: boolean;
    light?: boolean;
    reach?: boolean;
    ammunition?: boolean;
    range_normal?: number;
    range_long?: number;
    versatile_damage?: string;
}

export interface CharacterItem {
    id: number;
    character: number;
    item: number;
    item_id: number;
    quantity: number;
    is_equipped: boolean;
    equipment_slot: string;
    notes: string;
    item_details: CharacterItemDetails | null;
}

export interface CharacterSpellDetails {
    id: number;
    name: string;
    slug: string;
    level: number;
    level_display: string;
    school: string;
    school_display: string;
    casting_time: string;
    range: string;
    concentration: boolean;
    ritual: boolean;
}

export interface CharacterSpell {
    id: number;
    character: number;
    spell?: number | null;
    name: string;
    level: number;
    level_display: string;
    school: string;
    is_prepared: boolean;
    is_ritual: boolean;
    description?: string | null;
    spell_details: CharacterSpellDetails | null;
}

export interface CharacterData {
    id: number;
    name: string;
    level: number;
    proficiency_bonus: number;
    stats: CharacterStats;
    character_items: CharacterItem[];
    spells: CharacterSpell[];
    saving_throws: Record<string, { modifier: number; proficient: boolean; bonus: number }>;
    skills: Record<string, { modifier: number; proficient: boolean; bonus: number }>;
}

export interface EnemyAbilityScore {
    score: number;
    modifier: number;
}

export interface EnemyStatBlock {
    ability_scores: {
        strength: EnemyAbilityScore;
        dexterity: EnemyAbilityScore;
        constitution: EnemyAbilityScore;
        intelligence: EnemyAbilityScore;
        wisdom: EnemyAbilityScore;
        charisma: EnemyAbilityScore;
    };
    saving_throws: {
        str: number | null;
        dex: number | null;
        con: number | null;
        int: number | null;
        wis: number | null;
        cha: number | null;
    };
    speed: string | null;
    proficiency_bonus: number | null;
    senses: {
        darkvision: string | null;
        blindsight: string | null;
        tremorsense: string | null;
        truesight: string | null;
        passive_perception: number | null;
    };
}

export interface EnemyAttackInfo {
    name: string;
    bonus: number;
    damage: string;
}

export interface EnemyAbilityInfo {
    name: string;
    description: string;
}

export interface EnemyResistanceInfo {
    damage_type: string;
    type: 'resistance' | 'immunity' | 'vulnerability';
}

export interface CombatParticipant {
    id: number;
    combat_session: number;
    participant_type: 'character' | 'enemy';
    character?: CharacterData | null;
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
    attacks_remaining: number;
    equipped_items?: {
        weapon?: { name: string; damage_dice: string } | null;
        armor?: { name: string; base_ac: number } | null;
        shield?: { name: string; ac_bonus: number } | null;
    };
    effective_ac?: number;
    // Enemy stat block (only present for enemy participants)
    enemy_stats?: EnemyStatBlock;
    enemy_attacks?: EnemyAttackInfo[];
    enemy_abilities?: EnemyAbilityInfo[];
    enemy_resistances?: EnemyResistanceInfo[];
}

export interface CombatSession {
    id: number;
    campaign?: number;
    encounter?: number;
    current_turn_index: number;
    current_round: number;
    is_active: boolean;
    status_display: string;
    started_at?: string;
    ended_at?: string;
    participants: CombatParticipant[];
    actions?: CombatAction[];
    current_participant?: CombatParticipant;
    status?: string;
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

export interface AIActionResult {
    type: 'attack' | 'skip';
    attacker?: string;
    attacker_id?: number;
    target?: string;
    target_id?: number;
    attack_name?: string;
    roll?: number;
    attack_bonus?: number;
    attack_total?: number;
    target_ac?: number;
    hit?: boolean;
    critical?: boolean;
    fumble?: boolean;
    damage?: number;
    damage_type?: string;
    target_hp_before?: number;
    target_hp_after?: number;
    target_killed?: boolean;
    message?: string;
}

export interface AITurnResponse {
    message: string;
    actor: string;
    actor_id: number;
    actions: AIActionResult[];
    next_turn?: string;
    session: CombatSession;
}

export interface AutoEnemyTurnsResponse {
    message: string;
    turns_resolved: number;
    enemy_turns: {
        actor: string;
        actor_id: number;
        actions: AIActionResult[];
    }[];
    current_turn?: string;
    session: CombatSession;
}
