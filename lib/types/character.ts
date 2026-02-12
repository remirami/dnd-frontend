export interface CharacterRace {
    id: number;
    name: string;
    name_display?: string;
    size?: string;
    speed?: number;
}

export interface CharacterClass {
    id: number;
    name: string;
    name_display?: string;
    hit_dice?: string;
}

export interface CharacterStats {
    id: number;
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    hit_points: number;
    max_hit_points: number;
    temporary_hit_points?: number;
    armor_class: number;
    speed: number;
    initiative: number;
    // Resource Management
    spell_slots?: Record<string, number>;
    expended_spell_slots?: Record<string, number>;
    hit_dice_used?: number;
    hit_dice_total?: string;
}

export interface ClassLevel {
    class_id: number;
    class_name: string;
    level: number;
    subclass?: string | null;
}

export interface Character {
    id: number;
    name: string;
    race: CharacterRace;
    character_class: CharacterClass;
    level: number;
    experience_points: number;
    stats?: CharacterStats;
    background?: any;
    alignment?: string;

    // Aesthetic/RP
    description?: string;
    backstory?: string;
    bonds?: string;
    flaws?: string;
    ideals?: string;
    notes?: string;

    user: number;
    created_at: string;
    character_items?: CharacterItem[];
    spells?: CharacterSpell[];
    proficiencies?: CharacterProficiency[];
    features?: CharacterFeature[];
    character_feats?: CharacterFeat[];
    pending_asi_levels?: number[];
    pending_spell_choices?: {
        count: number;
        max_level: number;
        source: string;
        type: string;
    } | null;
    subclass?: string;
    pending_subclass_selection?: boolean;
    pending_language_choices?: number;
    class_levels?: ClassLevel[];

    // Computed props
    proficiency_bonus?: number;
    skills?: Record<string, Skill>;
    saving_throws?: Record<string, SavingThrow>;
}

export interface Skill {
    ability: string;
    modifier: number;
    proficient: boolean;
    expertise: boolean;
    bonus: number;
}

export interface SavingThrow {
    modifier: number;
    proficient: boolean;
    bonus: number;
}

export interface Subclass {
    name: string;
    description: string;
}

export interface Feat {
    id: number;
    name: string;
    description: string;
    strength_requirement: number;
    dexterity_requirement: number;
    constitution_requirement: number;
    intelligence_requirement: number;
    wisdom_requirement: number;
    charisma_requirement: number;
    minimum_level: number;
    proficiency_requirements: string;
    ability_score_increase?: string;
    source: string;
    is_eligible?: boolean;
    reason_if_not?: string | null;
}

export interface CharacterFeat {
    id: number;
    feat: Feat;
    level_taken: number;
    taken_at: string;
}

export interface CharacterItem {
    id: number;
    item_details: {
        id: number;
        name: string;
        description: string;
        weight: number;
        rarity: string;
        category: any;
        properties: any[];
        // Weapon specific
        weapon_type_display?: string;
        damage_dice?: string;
        two_handed_damage_dice?: string;
        damage_type?: string;
        properties_display?: string[];
        // Armor specific
        armor_type_display?: string;
        base_ac?: number;
        ac_bonus?: number;
        // Consumable specific
        consumable_type_display?: string;
    };
    quantity: number;
    is_equipped: boolean;
    equipment_slot?: string;
}

export interface CharacterSpell {
    id: number;
    spell_details?: {
        id: number;
        name: string;
        level: number;
        school: string;
        casting_time: string;
        range: string;
        components: string;
        duration: string;
        description: string;
        concentration?: boolean;
    };
    name: string; // Legacy/Fallback
    level: number;
    school?: string;
    is_ritual?: boolean;
    description?: string;
    is_prepared: boolean;
    in_spellbook: boolean;
}

export interface CharacterProficiency {
    id: number;
    proficiency_type: string; // 'skill', 'tool', 'language', etc.
    proficiency_level: string; // 'proficient', 'expertise'
    skill_name?: string;
    item_name?: string;
    ability_score?: string;
    language?: any; // Assuming it returns a full object or ID, typically object in nested serializer
    source?: string;
}

export interface CharacterFeature {
    id: number;
    name: string;
    feature_type: string; // 'class', 'racial', 'background', 'feat'
    description: string;
    source?: string;
    options?: string[];
    selection?: string[];
    choice_limit?: number;
}

export interface CharacterCreateData {
    name: string;
    race_id: number;
    character_class_id: number;
    background_id?: number;
    alignment?: string;
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}

export interface AbilityScores {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}
