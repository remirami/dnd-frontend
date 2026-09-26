import type { CharacterSpell, AoETargetingConfig } from '@/lib/types/combat';

export interface AoESpellDefinition {
    shape: 'sphere' | 'cone' | 'line' | 'cube' | 'cylinder';
    size: number; // in feet
    range?: string;
    saveType?: 'DEX' | 'CON' | 'WIS' | 'STR' | 'INT' | 'CHA';
    damageFormula?: string;
    damageType?: string;
    halfOnSave?: boolean;
    isHealing?: boolean;
    requiresConcentration?: boolean;
    isBonusAction?: boolean;
    castingTime?: string;
    condition?: string;
    environmentalType?: 'terrain' | 'lighting' | 'weather' | 'hazard';
    descriptionSummary?: string;
}

/**
 * Standard 5e Area of Effect spell definitions for all AoE spells in the database.
 */
export const AOE_SPELL_REGISTRY: Record<string, AoESpellDefinition> = {
    // Cantrips
    "acid splash": {
        shape: "sphere",
        size: 5,
        range: "60 feet",
        saveType: "DEX",
        damageFormula: "1d6",
        damageType: "acid",
        halfOnSave: false,
        castingTime: "1 action",
    },

    // 1st Level
    "burning hands": {
        shape: "cone",
        size: 15,
        range: "Self (15-foot cone)",
        saveType: "DEX",
        damageFormula: "3d6",
        damageType: "fire",
        halfOnSave: true,
        castingTime: "1 action",
    },
    "color spray": {
        shape: "cone",
        size: 15,
        range: "Self (15-foot cone)",
        damageFormula: "6d10",
        condition: "blinded",
        castingTime: "1 action",
    },
    "entangle": {
        shape: "cube",
        size: 20,
        range: "90 feet",
        saveType: "STR",
        condition: "restrained",
        requiresConcentration: true,
        environmentalType: "terrain",
        castingTime: "1 action",
    },
    "faerie fire": {
        shape: "cube",
        size: 20,
        range: "60 feet",
        saveType: "DEX",
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "fog cloud": {
        shape: "sphere",
        size: 20,
        range: "120 feet",
        requiresConcentration: true,
        environmentalType: "weather",
        castingTime: "1 action",
    },
    "grease": {
        shape: "cube",
        size: 10,
        range: "60 feet",
        saveType: "DEX",
        condition: "prone",
        environmentalType: "terrain",
        castingTime: "1 action",
    },
    "sleep": {
        shape: "sphere",
        size: 20,
        range: "90 feet",
        damageFormula: "5d8",
        condition: "unconscious",
        castingTime: "1 action",
    },
    "thunderwave": {
        shape: "cube",
        size: 15,
        range: "Self (15-foot cube)",
        saveType: "CON",
        damageFormula: "2d8",
        damageType: "thunder",
        halfOnSave: true,
        castingTime: "1 action",
    },

    // 2nd Level
    "calm emotions": {
        shape: "sphere",
        size: 20,
        range: "60 feet",
        saveType: "CHA",
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "darkness": {
        shape: "sphere",
        size: 15,
        range: "60 feet",
        requiresConcentration: true,
        environmentalType: "lighting",
        castingTime: "1 action",
    },
    "flaming sphere": {
        shape: "sphere",
        size: 5,
        range: "60 feet",
        saveType: "DEX",
        damageFormula: "2d6",
        damageType: "fire",
        halfOnSave: true,
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "gust of wind": {
        shape: "line",
        size: 60,
        range: "Self (60-foot line)",
        saveType: "STR",
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "moonbeam": {
        shape: "cylinder",
        size: 5,
        range: "120 feet",
        saveType: "CON",
        damageFormula: "2d10",
        damageType: "radiant",
        halfOnSave: true,
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "shatter": {
        shape: "sphere",
        size: 10,
        range: "60 feet",
        saveType: "CON",
        damageFormula: "3d8",
        damageType: "thunder",
        halfOnSave: true,
        castingTime: "1 action",
    },
    "silence": {
        shape: "sphere",
        size: 20,
        range: "120 feet",
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "spike growth": {
        shape: "sphere",
        size: 20,
        range: "150 feet",
        damageFormula: "2d4",
        damageType: "piercing",
        requiresConcentration: true,
        environmentalType: "terrain",
        castingTime: "1 action",
    },
    "web": {
        shape: "cube",
        size: 20,
        range: "60 feet",
        saveType: "DEX",
        condition: "restrained",
        requiresConcentration: true,
        environmentalType: "terrain",
        castingTime: "1 action",
    },
    "zone of truth": {
        shape: "sphere",
        size: 15,
        range: "60 feet",
        saveType: "CHA",
        castingTime: "1 action",
    },

    // 3rd Level
    "call lightning": {
        shape: "cylinder",
        size: 5,
        range: "120 feet",
        saveType: "DEX",
        damageFormula: "3d10",
        damageType: "lightning",
        halfOnSave: true,
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "daylight": {
        shape: "sphere",
        size: 60,
        range: "60 feet",
        castingTime: "1 action",
    },
    "fear": {
        shape: "cone",
        size: 30,
        range: "Self (30-foot cone)",
        saveType: "WIS",
        condition: "frightened",
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "fireball": {
        shape: "sphere",
        size: 20,
        range: "150 feet",
        saveType: "DEX",
        damageFormula: "8d6",
        damageType: "fire",
        halfOnSave: true,
        castingTime: "1 action",
    },
    "glyph of warding": {
        shape: "sphere",
        size: 20,
        range: "Touch",
        saveType: "DEX",
        damageFormula: "5d8",
        damageType: "thunder",
        halfOnSave: true,
        castingTime: "1 hour",
    },
    "hypnotic pattern": {
        shape: "cube",
        size: 30,
        range: "120 feet",
        saveType: "WIS",
        condition: "incapacitated",
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "lightning bolt": {
        shape: "line",
        size: 100,
        range: "Self (100-foot line)",
        saveType: "DEX",
        damageFormula: "8d6",
        damageType: "lightning",
        halfOnSave: true,
        castingTime: "1 action",
    },
    "magic circle": {
        shape: "cylinder",
        size: 10,
        range: "10 feet",
        castingTime: "1 minute",
    },
    "plant growth": {
        shape: "sphere",
        size: 100,
        range: "150 feet",
        environmentalType: "terrain",
        castingTime: "1 action",
    },
    "sleet storm": {
        shape: "cylinder",
        size: 40,
        range: "150 feet",
        saveType: "DEX",
        condition: "prone",
        requiresConcentration: true,
        environmentalType: "weather",
        castingTime: "1 action",
    },
    "slow": {
        shape: "cube",
        size: 40,
        range: "120 feet",
        saveType: "WIS",
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "spirit guardians": {
        shape: "sphere",
        size: 15,
        range: "Self (15-foot radius)",
        saveType: "WIS",
        damageFormula: "3d8",
        damageType: "radiant",
        halfOnSave: true,
        requiresConcentration: true,
        environmentalType: "terrain",
        castingTime: "1 action",
    },
    "stinking cloud": {
        shape: "sphere",
        size: 20,
        range: "90 feet",
        saveType: "CON",
        condition: "poisoned",
        requiresConcentration: true,
        environmentalType: "hazard",
        castingTime: "1 action",
    },
    "wind wall": {
        shape: "line",
        size: 50,
        range: "120 feet",
        saveType: "STR",
        damageFormula: "3d8",
        damageType: "bludgeoning",
        halfOnSave: true,
        requiresConcentration: true,
        castingTime: "1 action",
    },

    // 4th Level
    "black tentacles": {
        shape: "cube",
        size: 20,
        range: "90 feet",
        saveType: "DEX",
        damageFormula: "3d6",
        damageType: "bludgeoning",
        condition: "restrained",
        requiresConcentration: true,
        environmentalType: "terrain",
        castingTime: "1 action",
    },
    "confusion": {
        shape: "sphere",
        size: 10,
        range: "90 feet",
        saveType: "WIS",
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "control water": {
        shape: "cube",
        size: 100,
        range: "300 feet",
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "ice storm": {
        shape: "cylinder",
        size: 20,
        range: "300 feet",
        saveType: "DEX",
        damageFormula: "2d8+4d6",
        damageType: "cold",
        halfOnSave: true,
        environmentalType: "terrain",
        castingTime: "1 action",
    },
    "resilient sphere": {
        shape: "sphere",
        size: 5,
        range: "30 feet",
        saveType: "DEX",
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "wall of fire": {
        shape: "line",
        size: 60,
        range: "120 feet",
        saveType: "DEX",
        damageFormula: "5d8",
        damageType: "fire",
        halfOnSave: true,
        requiresConcentration: true,
        castingTime: "1 action",
    },

    // 5th Level
    "antilife shell": {
        shape: "sphere",
        size: 10,
        range: "Self (10-foot radius)",
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "cloudkill": {
        shape: "sphere",
        size: 20,
        range: "120 feet",
        saveType: "CON",
        damageFormula: "5d8",
        damageType: "poison",
        halfOnSave: true,
        requiresConcentration: true,
        environmentalType: "hazard",
        castingTime: "1 action",
    },
    "cone of cold": {
        shape: "cone",
        size: 60,
        range: "Self (60-foot cone)",
        saveType: "CON",
        damageFormula: "8d8",
        damageType: "cold",
        halfOnSave: true,
        castingTime: "1 action",
    },
    "destructive wave": {
        shape: "sphere",
        size: 30,
        range: "Self (30-foot radius)",
        saveType: "CON",
        damageFormula: "5d6+5d6",
        damageType: "thunder",
        halfOnSave: true,
        castingTime: "1 action",
    },
    "flame strike": {
        shape: "cylinder",
        size: 10,
        range: "60 feet",
        saveType: "DEX",
        damageFormula: "4d6+4d6",
        damageType: "fire",
        halfOnSave: true,
        castingTime: "1 action",
    },
    "hallow": {
        shape: "sphere",
        size: 60,
        range: "Touch",
        castingTime: "24 hours",
    },
    "insect plague": {
        shape: "sphere",
        size: 20,
        range: "300 feet",
        saveType: "CON",
        damageFormula: "4d10",
        damageType: "piercing",
        halfOnSave: true,
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "mass cure wounds": {
        shape: "sphere",
        size: 30,
        range: "60 feet",
        damageFormula: "3d8",
        isHealing: true,
        castingTime: "1 action",
    },
    "wall of force": {
        shape: "line",
        size: 50,
        range: "120 feet",
        requiresConcentration: true,
        castingTime: "1 action",
    },

    // 6th Level+
    "blade barrier": {
        shape: "line",
        size: 100,
        range: "90 feet",
        saveType: "DEX",
        damageFormula: "6d10",
        damageType: "slashing",
        halfOnSave: true,
        requiresConcentration: true,
        environmentalType: "terrain",
        castingTime: "1 action",
    },
    "circle of death": {
        shape: "sphere",
        size: 60,
        range: "150 feet",
        saveType: "CON",
        damageFormula: "8d6",
        damageType: "necrotic",
        halfOnSave: true,
        castingTime: "1 action",
    },
    "freezing sphere": {
        shape: "sphere",
        size: 60,
        range: "300 feet",
        saveType: "CON",
        damageFormula: "10d6",
        damageType: "cold",
        halfOnSave: true,
        castingTime: "1 action",
    },
    "globe of invulnerability": {
        shape: "sphere",
        size: 10,
        range: "Self (10-foot radius)",
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "sunbeam": {
        shape: "line",
        size: 60,
        range: "Self (60-foot line)",
        saveType: "CON",
        damageFormula: "6d8",
        damageType: "radiant",
        condition: "blinded",
        halfOnSave: true,
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "wall of ice": {
        shape: "line",
        size: 100,
        range: "120 feet",
        saveType: "DEX",
        damageFormula: "10d6",
        damageType: "cold",
        halfOnSave: true,
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "wall of thorns": {
        shape: "line",
        size: 60,
        range: "120 feet",
        saveType: "DEX",
        damageFormula: "7d8",
        damageType: "piercing",
        halfOnSave: true,
        requiresConcentration: true,
        environmentalType: "terrain",
        castingTime: "1 action",
    },
    "delayed blast fireball": {
        shape: "sphere",
        size: 20,
        range: "150 feet",
        saveType: "DEX",
        damageFormula: "12d6",
        damageType: "fire",
        halfOnSave: true,
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "fire storm": {
        shape: "cube",
        size: 10,
        range: "150 feet",
        saveType: "DEX",
        damageFormula: "7d10",
        damageType: "fire",
        halfOnSave: true,
        castingTime: "1 action",
    },
    "forcecage": {
        shape: "cube",
        size: 20,
        range: "100 feet",
        castingTime: "1 action",
    },
    "prismatic spray": {
        shape: "cone",
        size: 60,
        range: "Self (60-foot cone)",
        saveType: "DEX",
        damageFormula: "10d6",
        halfOnSave: true,
        castingTime: "1 action",
    },
    "reverse gravity": {
        shape: "cylinder",
        size: 50,
        range: "100 feet",
        saveType: "DEX",
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "symbol": {
        shape: "sphere",
        size: 60,
        range: "Touch",
        saveType: "CON",
        damageFormula: "10d10",
        castingTime: "1 minute",
    },
    "antimagic field": {
        shape: "sphere",
        size: 10,
        range: "Self (10-foot radius)",
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "earthquake": {
        shape: "sphere",
        size: 100,
        range: "500 feet",
        saveType: "DEX",
        condition: "prone",
        requiresConcentration: true,
        environmentalType: "terrain",
        castingTime: "1 action",
    },
    "holy aura": {
        shape: "sphere",
        size: 30,
        range: "Self (30-foot radius)",
        requiresConcentration: true,
        castingTime: "1 action",
    },
    "incendiary cloud": {
        shape: "sphere",
        size: 20,
        range: "150 feet",
        saveType: "DEX",
        damageFormula: "10d8",
        damageType: "fire",
        halfOnSave: true,
        requiresConcentration: true,
        environmentalType: "weather",
        castingTime: "1 action",
    },
    "sunburst": {
        shape: "sphere",
        size: 60,
        range: "150 feet",
        saveType: "CON",
        damageFormula: "12d6",
        damageType: "radiant",
        condition: "blinded",
        halfOnSave: true,
        castingTime: "1 action",
    },
    "meteor swarm": {
        shape: "sphere",
        size: 40,
        range: "1 mile",
        saveType: "DEX",
        damageFormula: "40d6",
        damageType: "fire",
        halfOnSave: true,
        castingTime: "1 action",
    },
    "prismatic wall": {
        shape: "line",
        size: 90,
        range: "60 feet",
        castingTime: "1 action",
    },
    "storm of vengeance": {
        shape: "cylinder",
        size: 360,
        range: "Sight",
        saveType: "CON",
        damageFormula: "2d6",
        damageType: "thunder",
        requiresConcentration: true,
        environmentalType: "weather",
        castingTime: "1 action",
    },
    "weird": {
        shape: "sphere",
        size: 30,
        range: "120 feet",
        saveType: "WIS",
        damageFormula: "4d10",
        damageType: "psychic",
        condition: "frightened",
        requiresConcentration: true,
        castingTime: "1 action",
    },
};

/**
 * Check if a spell is known or detected as an Area of Effect (AoE) spell.
 */
export function isAoESpell(spellName: string, description?: string | null, range?: string | null): boolean {
    if (!spellName) return false;
    const clean = spellName.trim().toLowerCase();
    if (AOE_SPELL_REGISTRY[clean]) return true;

    // Dynamic fallback checking description / range for 5e AoE patterns
    const combined = `${spellName} ${range || ""} ${description || ""}`.toLowerCase();
    return (
        combined.includes("cone") ||
        combined.includes("radius") ||
        combined.includes("cube") ||
        combined.includes("cylinder") ||
        (combined.includes("line") && !combined.includes("line of sight")) ||
        combined.includes("square") ||
        combined.includes("blast")
    );
}

/**
 * Retrieve AoE configuration for a spell, dynamically resolving unknown/homebrew spells if possible.
 */
export function getAoESpellConfig(
    spellName: string,
    description?: string | null,
    range?: string | null
): AoESpellDefinition | null {
    if (!spellName) return null;
    const clean = spellName.trim().toLowerCase();
    if (AOE_SPELL_REGISTRY[clean]) {
        return AOE_SPELL_REGISTRY[clean];
    }

    // Dynamic resolution based on description and range text
    const combined = `${spellName} ${range || ""} ${description || ""}`.toLowerCase();

    // Check shape and size
    let shape: 'sphere' | 'cone' | 'line' | 'cube' | 'cylinder' = 'sphere';
    let size = 20;

    const coneMatch = combined.match(/(\d+)[-\s]foot cone/);
    const cubeMatch = combined.match(/(\d+)[-\s]foot (cube|square)/);
    const lineMatch = combined.match(/(\d+)[-\s]foot line/);
    const cylMatch = combined.match(/(\d+)[-\s]foot[-\s](radius )?cylinder/);
    const sphereMatch = combined.match(/(\d+)[-\s]foot[-\s](radius|sphere)/);

    if (coneMatch) {
        shape = 'cone';
        size = parseInt(coneMatch[1], 10);
    } else if (lineMatch) {
        shape = 'line';
        size = parseInt(lineMatch[1], 10);
    } else if (cubeMatch) {
        shape = 'cube';
        size = parseInt(cubeMatch[1], 10);
    } else if (cylMatch) {
        shape = 'cylinder';
        size = parseInt(cylMatch[1], 10);
    } else if (sphereMatch) {
        shape = 'sphere';
        size = parseInt(sphereMatch[1], 10);
    } else if (combined.includes('cone')) {
        shape = 'cone';
        size = 15;
    } else if (combined.includes('cube') || combined.includes('square')) {
        shape = 'cube';
        size = 15;
    } else if (combined.includes('line')) {
        shape = 'line';
        size = 60;
    } else if (combined.includes('cylinder')) {
        shape = 'cylinder';
        size = 10;
    } else if (combined.includes('radius') || combined.includes('sphere')) {
        shape = 'sphere';
        size = 20;
    } else {
        return null; // Not an AoE spell
    }

    // Detect save type
    let saveType: 'DEX' | 'CON' | 'WIS' | 'STR' | 'INT' | 'CHA' | undefined;
    if (combined.includes('dexterity saving throw') || combined.includes('dexterity save')) saveType = 'DEX';
    else if (combined.includes('constitution saving throw') || combined.includes('constitution save')) saveType = 'CON';
    else if (combined.includes('wisdom saving throw') || combined.includes('wisdom save')) saveType = 'WIS';
    else if (combined.includes('strength saving throw') || combined.includes('strength save')) saveType = 'STR';
    else if (combined.includes('intelligence saving throw') || combined.includes('intelligence save')) saveType = 'INT';
    else if (combined.includes('charisma saving throw') || combined.includes('charisma save')) saveType = 'CHA';

    // Detect damage formula
    const dmgMatch = combined.match(/(\d+d\d+(\s*\+\s*\d+)?)\s*(fire|cold|lightning|thunder|radiant|necrotic|poison|acid|force|psychic|slashing|piercing|bludgeoning)?/);
    const damageFormula = dmgMatch ? dmgMatch[1] : undefined;
    const damageType = dmgMatch ? dmgMatch[3] : undefined;

    return {
        shape,
        size,
        saveType,
        damageFormula,
        damageType,
        halfOnSave: combined.includes('half as much damage on a successful') || combined.includes('half damage'),
        requiresConcentration: combined.includes('concentration'),
        castingTime: combined.includes('bonus action') ? '1 bonus action' : '1 action',
    };
}
