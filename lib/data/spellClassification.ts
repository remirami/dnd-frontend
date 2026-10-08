/**
 * Authoritative 5E Spell Classification System
 * 
 * Classifies spells into combat-ready vs. out-of-combat utility,
 * distinguishing combat spells (attacks, AoEs, healing, crowd control, and buffs like Shield/Bless/Mage Armor)
 * from pure exploration, social, downtime, or 10+ minute rituals.
 */

import type { CharacterSpell } from "@/lib/types/combat";

// Explicit list of known combat buff / defensive reaction spells
export const COMBAT_BUFF_SPELLS = new Set([
    "shield",
    "mage armor",
    "bless",
    "shield of faith",
    "haste",
    "heroism",
    "barkskin",
    "protection from evil and good",
    "protection from undead",
    "protect from evil and good",
    "protect from undead",
    "guidance",
    "resistance",
    "invisibility",
    "blur",
    "mirror image",
    "false life",
    "armor of agathys",
    "expeditious retreat",
    "fire shield",
    "absorb elements",
    "misty step",
    "dimension door",
    "spiritual weapon",
    "counterspell",
    "hellish rebuke",
    "feather fall",
    "blink",
    "fly",
    "pass without trace",
    "see invisibility",
    "beacon of hope",
    "aid",
    "crusader's mantle",
    "holy weapon",
    "stoneskin",
    "death ward",
    "freedom of movement",
    "warding bond",
    "sanctuary",
    "enhance ability",
    "elemental weapon",
    "divine favor",
    "spirit guardians",
    "aura of vitality",
    "aura of life",
    "aura of purity",
]);

// Explicit list of pure non-combat utility / exploration / social / downtime spells
export const NON_COMBAT_UTILITY_SPELLS = new Set([
    "comprehend languages",
    "detect magic",
    "identify",
    "unseen servant",
    "purify food and drink",
    "speak with animals",
    "animal messenger",
    "beast sense",
    "locate animals or plants",
    "water breathing",
    "water walk",
    "tongues",
    "mending",
    "prestidigitation",
    "druidcraft",
    "thaumaturgy",
    "alarm",
    "leomund's tiny hut",
    "tiny hut",
    "tenser's floating disk",
    "floating disk",
    "find familiar",
    "continual flame",
    "gentle repose",
    "augury",
    "locate object",
    "clairvoyance",
    "nystul's magic aura",
    "magic aura",
    "zone of truth",
    "feign death",
    "phantom steed",
    "tiny servant",
    "sending",
    "magic mouth",
    "arcane lock",
    "rope trick",
    "illusory script",
    "animal friendship",
    "snare",
    "locate creature",
    "divination",
    "commune",
    "commune with nature",
    "contact other plane",
    "dream",
    "legend lore",
    "scrying",
    "telepathic bond",
    "rary's telepathic bond",
    "teleportation circle",
    "word of recall",
    "forbiddance",
    "guards and wards",
    "plant growth",
    "speak with plants",
    "speak with dead",
    "prayer of healing", // 10 min cast time out-of-combat heal
]);

export interface SpellClassification {
    isCombat: boolean;
    category: 'attack' | 'aoe' | 'heal' | 'buff' | 'control' | 'utility';
    castingTime: string;
    isLongCast: boolean;
    reason?: string;
    badgeLabel?: string;
}

/**
 * Returns whether a spell has a casting time incompatible with active 6-second combat turns
 * (e.g. "1 minute", "10 minutes", "1 hour", "8 hours", "24 hours").
 */
export function isLongCastTime(castingTime?: string | null): boolean {
    if (!castingTime) return false;
    const lower = castingTime.toLowerCase();
    return (
        lower.includes("minute") ||
        lower.includes("min") ||
        lower.includes("hour") ||
        lower.includes("hr") ||
        lower.includes("day")
    );
}

/**
 * Classifies a spell into combat-ready vs. utility
 */
export function classifySpell(spell: CharacterSpell | { name: string; range?: string | null; description?: string | null; casting_time?: string | null; spell_details?: any }): SpellClassification {
    const rawName = spell.name || "";
    const cleanName = rawName.toLowerCase().trim();
    const details = (spell as any).spell_details;
    const castingTime = details?.casting_time || (spell as any).casting_time || "1 action";
    const isLong = isLongCastTime(castingTime);

    // 1. Spells with 1+ minute cast times are canonically non-combat in turn-based 5e
    if (isLong) {
        return {
            isCombat: false,
            category: 'utility',
            castingTime,
            isLongCast: true,
            reason: `Casting time is ${castingTime} (cannot be cast within a 6-second combat turn)`,
            badgeLabel: `⏳ ${castingTime}`,
        };
    }

    // 2. Explicit combat buffs and defensive reactions (Shield, Mage Armor, Bless, Haste, etc.)
    if (COMBAT_BUFF_SPELLS.has(cleanName)) {
        const isReaction = castingTime.toLowerCase().includes("reaction");
        const isBonus = castingTime.toLowerCase().includes("bonus");
        return {
            isCombat: true,
            category: 'buff',
            castingTime,
            isLongCast: false,
            badgeLabel: isReaction ? "⚡ Reaction Buff" : isBonus ? "✨ Bonus Buff" : "✦ Positive Buff",
        };
    }

    // 3. Explicit non-combat / exploration / social / downtime spells
    if (NON_COMBAT_UTILITY_SPELLS.has(cleanName)) {
        return {
            isCombat: false,
            category: 'utility',
            castingTime,
            isLongCast: false,
            reason: "Exploration, social, or downtime utility spell with no direct combat mechanics",
            badgeLabel: "🕯️ Non-Combat RP",
        };
    }

    // 4. Check damage progression or spell description heuristics
    const damageProg = details?.damage_progression;
    if (Array.isArray(damageProg) && damageProg.length > 0) {
        return {
            isCombat: true,
            category: 'attack',
            castingTime,
            isLongCast: false,
        };
    }

    const desc = (spell as any).description || details?.description || "";
    const lowerDesc = desc.toLowerCase();

    // Healing keywords
    if (lowerDesc.includes("regains hit points") || lowerDesc.includes("restores hit points") || lowerDesc.includes("regain hit points")) {
        return {
            isCombat: true,
            category: 'heal',
            castingTime,
            isLongCast: false,
            badgeLabel: "💚 Healing",
        };
    }

    // Offensive / Attack / Save keywords
    if (
        lowerDesc.includes("saving throw") ||
        lowerDesc.includes("spell attack") ||
        lowerDesc.includes("take damage") ||
        lowerDesc.includes("takes damage") ||
        lowerDesc.includes("damage:") ||
        lowerDesc.includes("force damage") ||
        lowerDesc.includes("fire damage") ||
        lowerDesc.includes("radiant damage") ||
        lowerDesc.includes("necrotic damage") ||
        lowerDesc.includes("acid damage") ||
        lowerDesc.includes("poison damage") ||
        lowerDesc.includes("cold damage") ||
        lowerDesc.includes("lightning damage") ||
        lowerDesc.includes("psychic damage") ||
        lowerDesc.includes("thunder damage")
    ) {
        return {
            isCombat: true,
            category: 'attack',
            castingTime,
            isLongCast: false,
        };
    }

    // Condition control keywords
    if (
        lowerDesc.includes("paralyzed") ||
        lowerDesc.includes("blinded") ||
        lowerDesc.includes("poisoned") ||
        lowerDesc.includes("stunned") ||
        lowerDesc.includes("unconscious") ||
        lowerDesc.includes("frightened") ||
        lowerDesc.includes("charmed") ||
        lowerDesc.includes("restrained") ||
        lowerDesc.includes("prone")
    ) {
        return {
            isCombat: true,
            category: 'control',
            castingTime,
            isLongCast: false,
            badgeLabel: "⚡ Control",
        };
    }

    // Default: If cast time is 1 action/bonus/reaction and hasn't been flagged as pure utility, assume combat viable
    return {
        isCombat: true,
        category: 'attack',
        castingTime,
        isLongCast: false,
    };
}

/**
 * Convenient boolean check for combat viability
 */
export function isCombatSpell(spell: CharacterSpell | { name: string; range?: string | null; description?: string | null; casting_time?: string | null; spell_details?: any }): boolean {
    return classifySpell(spell).isCombat;
}
