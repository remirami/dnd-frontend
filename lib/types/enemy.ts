export interface Attack {
    id: number;
    name: string;
    bonus: number;
    damage: string; // e.g. "2d6+3 slashing"
}

export interface EnemyActionDamage {
    id: number;
    dice_count: number;
    dice_sides: number;
    damage_bonus: number;
    damage_type_name?: string | null;
    is_secondary: boolean;
    formula: string;
}

export interface EnemyAction {
    id: number;
    name: string;
    description: string;
    action_type: 'action' | 'bonus_action' | 'reaction' | 'legendary_action' | 'special';
    action_type_display: string;
    attack_type: 'melee_weapon' | 'ranged_weapon' | 'melee_spell' | 'ranged_spell' | 'saving_throw' | 'utility';
    attack_type_display: string;
    attack_bonus?: number | null;
    reach_or_range?: string;
    saving_throw_dc?: number | null;
    saving_throw_ability?: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA' | null;
    half_damage_on_save?: boolean;
    conditions_inflicted_names?: string[];
    condition_save_end?: boolean;
    has_recharge: boolean;
    recharge_min_roll?: number | null;
    is_charged?: boolean;
    target_count_or_area?: string;
    legendary_cost?: number;
    damage_rolls: EnemyActionDamage[];
}

export interface EnemyMultiattack {
    id?: number;
    description: string;
    action_count: number;
    sequence: Array<{ action_name: string; count: number }>;
}

export interface EnemyTrait {
    id?: number;
    name: string;
    description: string;
    trait_type?: string;
}

export interface Enemy {
    id: number;
    name: string;
    size: string;
    size_display?: string;
    type?: string;
    creature_type?: string;
    creature_type_display?: string;
    alignment: string;
    alignment_display?: string;
    challenge_rating: string | number;
    hp?: number;
    ac?: number;
    attacks?: Attack[];
    actions?: EnemyAction[];
    multiattack?: EnemyMultiattack | null;
    traits?: EnemyTrait[];
    stats?: {
        hit_points: number;
        armor_class: number;
        speed?: string;
        strength?: number;
        dexterity?: number;
        constitution?: number;
        intelligence?: number;
        wisdom?: number;
        charisma?: number;
        strength_modifier?: number;
        dexterity_modifier?: number;
        constitution_modifier?: number;
        intelligence_modifier?: number;
        wisdom_modifier?: number;
        charisma_modifier?: number;
        str_save?: number | null;
        dex_save?: number | null;
        con_save?: number | null;
        int_save?: number | null;
        wis_save?: number | null;
        cha_save?: number | null;
        perception?: number | null;
        stealth?: number | null;
        athletics?: number | null;
        darkvision?: string | null;
        blindsight?: string | null;
        passive_perception?: number | null;
        hit_dice?: string | null;
    };
    resistances?: Array<{
        damage_type?: { name: string };
        type?: string;
    }>;
    languages?: Array<{
        language?: { name: string };
    }>;
    condition_immunities?: Array<{
        condition?: { name: string };
    }>;
}
