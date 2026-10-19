"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CombatantPortrait } from "@/components/combat/CombatantPortrait";
import type { CombatParticipant, CharacterSpell, AoETargetingConfig } from "@/lib/types/combat";
import { isAoESpell, getAoESpellConfig } from "@/lib/data/spellAoE";
import { get3DBoundingBoxDist } from "@/components/combat/BattleGrid";

interface SpellMechanic {
    saveType?: "DEX" | "CON" | "WIS" | "STR" | "INT" | "CHA";
    isAttackRoll?: boolean;
    damageDice?: string;
    damageType?: string;
    upcastDiceCount?: number; // extra dice per level above base
    isHealing?: boolean;
    healingBaseDice?: string; // e.g. "1d8", "1d4", "2d8"
    condition?: string;
    halfOnSave?: boolean;
    requiresConcentration?: boolean;
    range?: string;
    castingTime?: string;
    isAoE?: boolean;
    isBonusAction?: boolean;
}

// Authoritative 5e SRD spell mechanics
const SPELL_MECHANICS: Record<string, SpellMechanic> = {
    // Cantrips (At-Will)
    "fire bolt": { isAttackRoll: true, damageDice: "1d10", damageType: "fire", range: "120 ft", castingTime: "1 action" },
    "eldritch blast": { isAttackRoll: true, damageDice: "1d10", damageType: "force", range: "120 ft", castingTime: "1 action" },
    "ray of frost": { isAttackRoll: true, damageDice: "1d8", damageType: "cold", range: "60 ft", castingTime: "1 action" },
    "shocking grasp": { isAttackRoll: true, damageDice: "1d8", damageType: "lightning", range: "Touch", castingTime: "1 action" },
    "sacred flame": { saveType: "DEX", damageDice: "1d8", damageType: "radiant", halfOnSave: false, range: "60 ft", castingTime: "1 action" },
    "toll the dead": { saveType: "WIS", damageDice: "1d8", damageType: "necrotic", halfOnSave: false, range: "60 ft", castingTime: "1 action" },
    "vicious mockery": { saveType: "WIS", damageDice: "1d4", damageType: "psychic", halfOnSave: false, range: "60 ft", castingTime: "1 action" },
    "acid splash": { saveType: "DEX", damageDice: "1d6", damageType: "acid", halfOnSave: false, range: "60 ft", castingTime: "1 action", isAoE: true },
    "poison spray": { saveType: "CON", damageDice: "1d12", damageType: "poison", condition: "poisoned", halfOnSave: false, range: "10 ft", castingTime: "1 action" },
    "chill touch": { isAttackRoll: true, damageDice: "1d8", damageType: "necrotic", range: "120 ft", castingTime: "1 action" },
    "produce flame": { isAttackRoll: true, damageDice: "1d8", damageType: "fire", range: "30 ft", castingTime: "1 action" },
    "thorn whip": { isAttackRoll: true, damageDice: "1d6", damageType: "piercing", range: "30 ft", castingTime: "1 action" },
    "primal savagery": { isAttackRoll: true, damageDice: "1d10", damageType: "acid", range: "Touch", castingTime: "1 action" },
    "thunderclap": { saveType: "CON", damageDice: "1d6", damageType: "thunder", halfOnSave: false, range: "Self (5-ft sphere)", castingTime: "1 action", isAoE: true },
    "word of radiance": { saveType: "CON", damageDice: "1d6", damageType: "radiant", halfOnSave: false, range: "Self (5-ft sphere)", castingTime: "1 action", isAoE: true },
    "mind sliver": { saveType: "INT", damageDice: "1d6", damageType: "psychic", halfOnSave: false, range: "60 ft", castingTime: "1 action" },
    "frostbite": { saveType: "CON", damageDice: "1d6", damageType: "cold", halfOnSave: false, range: "60 ft", castingTime: "1 action" },
    "infestation": { saveType: "CON", damageDice: "1d6", damageType: "poison", halfOnSave: false, range: "30 ft", castingTime: "1 action" },
    "create bonfire": { saveType: "DEX", damageDice: "1d8", damageType: "fire", halfOnSave: false, requiresConcentration: true, range: "60 ft (5-ft cube)", castingTime: "1 action", isAoE: true },
    "lightning lure": { saveType: "STR", damageDice: "1d8", damageType: "lightning", halfOnSave: false, range: "15 ft", castingTime: "1 action" },
    "sword burst": { saveType: "DEX", damageDice: "1d6", damageType: "force", halfOnSave: false, range: "Self (5-ft sphere)", castingTime: "1 action", isAoE: true },
    "shillelagh": { damageDice: "1d8", damageType: "magical bludgeoning", range: "Touch", castingTime: "1 bonus action", isBonusAction: true },
    "guidance": { range: "Touch", castingTime: "1 action", requiresConcentration: true },
    "resistance": { range: "Touch", castingTime: "1 action", requiresConcentration: true },

    // Level 1
    "cure wounds": { isHealing: true, healingBaseDice: "1d8", upcastDiceCount: 1, range: "Touch", castingTime: "1 action" },
    "healing word": { isHealing: true, healingBaseDice: "1d4", upcastDiceCount: 1, range: "60 ft", castingTime: "1 bonus action", isBonusAction: true },
    "magic missile": { damageDice: "3d4+3", damageType: "force", upcastDiceCount: 1, range: "120 ft", castingTime: "1 action" },
    "burning hands": { saveType: "DEX", damageDice: "3d6", damageType: "fire", upcastDiceCount: 1, halfOnSave: true, range: "Self (15-ft cone)", castingTime: "1 action", isAoE: true },
    "guiding bolt": { isAttackRoll: true, damageDice: "4d6", damageType: "radiant", upcastDiceCount: 1, range: "120 ft", castingTime: "1 action" },
    "inflict wounds": { isAttackRoll: true, damageDice: "3d10", damageType: "necrotic", upcastDiceCount: 1, range: "Touch", castingTime: "1 action" },
    "thunderwave": { saveType: "CON", damageDice: "2d8", damageType: "thunder", upcastDiceCount: 1, halfOnSave: true, range: "Self (15-ft cube)", castingTime: "1 action", isAoE: true },
    "sleep": { damageDice: "5d8", condition: "unconscious", upcastDiceCount: 2, range: "90 ft", castingTime: "1 action", isAoE: true },
    "grease": { saveType: "DEX", range: "60 ft (10-ft square)", castingTime: "1 action", isAoE: true },
    "fog cloud": { range: "120 ft (20-ft radius)", castingTime: "1 action", requiresConcentration: true, isAoE: true },
    "charm person": { saveType: "WIS", condition: "charmed", requiresConcentration: false, range: "30 ft", castingTime: "1 action" },
    "cause fear": { saveType: "WIS", condition: "frightened", requiresConcentration: true, range: "60 ft", castingTime: "1 action" },
    "witch bolt": { isAttackRoll: true, damageDice: "1d12", damageType: "lightning", upcastDiceCount: 1, requiresConcentration: true, range: "30 ft", castingTime: "1 action" },

    // Level 2
    "hold person": { saveType: "WIS", condition: "paralyzed", requiresConcentration: true, range: "60 ft", castingTime: "1 action" },
    "blindness/deafness": { saveType: "CON", condition: "blinded", range: "30 ft", castingTime: "1 action" },
    "scorching ray": { isAttackRoll: true, damageDice: "6d6", damageType: "fire", upcastDiceCount: 2, range: "120 ft", castingTime: "1 action" },
    "shatter": { saveType: "CON", damageDice: "3d8", damageType: "thunder", upcastDiceCount: 1, halfOnSave: true, range: "60 ft (10-ft radius)", castingTime: "1 action", isAoE: true },
    "prayer of healing": { isHealing: true, healingBaseDice: "2d8", upcastDiceCount: 1, range: "30 ft", castingTime: "10 minutes" },
    "spiritual weapon": { isAttackRoll: true, damageDice: "1d8", damageType: "force", upcastDiceCount: 1, range: "60 ft", castingTime: "1 bonus action", isBonusAction: true },
    "ray of enfeeblement": { saveType: "CON", condition: "poisoned", requiresConcentration: true, range: "60 ft", castingTime: "1 action" },
    "acid arrow": { isAttackRoll: true, damageDice: "4d4", damageType: "acid", upcastDiceCount: 1, range: "90 ft", castingTime: "1 action" },

    // Level 3
    "fireball": { saveType: "DEX", damageDice: "8d6", damageType: "fire", upcastDiceCount: 1, halfOnSave: true, range: "150 ft (20-ft radius)", castingTime: "1 action", isAoE: true },
    "lightning bolt": { saveType: "DEX", damageDice: "8d6", damageType: "lightning", upcastDiceCount: 1, halfOnSave: true, range: "Self (100-ft line)", castingTime: "1 action", isAoE: true },
    "mass healing word": { isHealing: true, healingBaseDice: "1d4", upcastDiceCount: 1, range: "60 ft", castingTime: "1 bonus action", isBonusAction: true, isAoE: true },
    "hold monster": { saveType: "WIS", condition: "paralyzed", requiresConcentration: true, range: "90 ft", castingTime: "1 action" },

    // Combat Buffs, Defenses & Reactions
    "shield": { range: "Self", castingTime: "1 reaction", requiresConcentration: false },
    "absorb elements": { range: "Self", castingTime: "1 reaction", requiresConcentration: false },
    "mage armor": { range: "Touch", castingTime: "1 action", requiresConcentration: false },
    "bless": { range: "30 ft", castingTime: "1 action", requiresConcentration: true },
    "shield of faith": { range: "60 ft", castingTime: "1 bonus action", isBonusAction: true, requiresConcentration: true },
    "protection from evil and good": { range: "Touch", castingTime: "1 action", requiresConcentration: true },
    "haste": { range: "30 ft", castingTime: "1 action", requiresConcentration: true },
    "blur": { range: "Self", castingTime: "1 action", requiresConcentration: true },
    "mirror image": { range: "Self", castingTime: "1 action", requiresConcentration: false },
    "false life": { range: "Self", castingTime: "1 action", requiresConcentration: false },
    "armor of agathys": { range: "Self", castingTime: "1 action", requiresConcentration: false },
    "expeditious retreat": { range: "Self", castingTime: "1 bonus action", isBonusAction: true, requiresConcentration: true },
    "fire shield": { range: "Self", castingTime: "1 action", requiresConcentration: false },
    "heroism": { range: "Touch", castingTime: "1 action", requiresConcentration: true },
    "barkskin": { range: "Touch", castingTime: "1 action", requiresConcentration: true },
    "invisibility": { range: "Touch", castingTime: "1 action", requiresConcentration: true },
    "counterspell": { range: "60 ft", castingTime: "1 reaction", requiresConcentration: false },
    "hellish rebuke": { saveType: "DEX", damageDice: "2d10", damageType: "fire", upcastDiceCount: 1, halfOnSave: true, range: "60 ft", castingTime: "1 reaction" },
    "misty step": { range: "Self", castingTime: "1 bonus action", isBonusAction: true, requiresConcentration: false },

    // Expanded High-Priority Combat & Condition Spells
    "bane": { saveType: "CHA", range: "30 ft", castingTime: "1 action", requiresConcentration: true, isAoE: true },
    "banishment": { saveType: "CHA", range: "60 ft", castingTime: "1 action", requiresConcentration: true },
    "bestow curse": { saveType: "WIS", range: "Touch", castingTime: "1 action", requiresConcentration: true },
    "dominate monster": { saveType: "WIS", range: "60 ft", castingTime: "1 action", requiresConcentration: true },
    "eyebite": { saveType: "WIS", range: "Self", castingTime: "1 action", requiresConcentration: true },
    "feeblemind": { saveType: "INT", damageDice: "4d6", damageType: "psychic", range: "150 ft", castingTime: "1 action" },
    "flesh to stone": { saveType: "CON", range: "60 ft", castingTime: "1 action", requiresConcentration: true },
    "power word kill": { range: "60 ft", castingTime: "1 action" },
    "power word stun": { range: "60 ft", castingTime: "1 action" },
    "wall of thorns": { saveType: "DEX", damageDice: "7d8", damageType: "piercing", range: "120 ft", castingTime: "1 action", isAoE: true, requiresConcentration: true },
    "storm of vengeance": { saveType: "CON", damageDice: "2d6", damageType: "thunder", range: "Sight", castingTime: "1 action", isAoE: true, requiresConcentration: true },
    "reverse gravity": { saveType: "DEX", range: "120 ft", castingTime: "1 action", isAoE: true, requiresConcentration: true },
    "telekinesis": { saveType: "STR", range: "60 ft", castingTime: "1 action", requiresConcentration: true },
    "suggestion": { saveType: "WIS", range: "30 ft", castingTime: "1 action", requiresConcentration: true },
    "mass suggestion": { saveType: "WIS", range: "60 ft", castingTime: "1 action", isAoE: true },
    "true strike": { range: "30 ft", castingTime: "1 action", requiresConcentration: true },
    "wall of force": { range: "120 ft", castingTime: "1 action", requiresConcentration: true, isAoE: true },
    "wall of stone": { saveType: "DEX", range: "120 ft", castingTime: "1 action", requiresConcentration: true, isAoE: true },
    "prismatic wall": { saveType: "DEX", damageDice: "10d6", damageType: "fire", range: "60 ft", castingTime: "1 action", isAoE: true },

    // Expanded High-Priority Buffs & Defenses
    "greater invisibility": { range: "Touch", castingTime: "1 action", requiresConcentration: true },
    "hunter's mark": { range: "90 ft", castingTime: "1 bonus action", isBonusAction: true, requiresConcentration: true },
    "hex": { range: "90 ft", castingTime: "1 bonus action", isBonusAction: true, requiresConcentration: true },
    "divine favor": { range: "Self", castingTime: "1 bonus action", isBonusAction: true, requiresConcentration: true },
    "crusader's mantle": { range: "Self (30-ft aura)", castingTime: "1 action", requiresConcentration: true },
    "stoneskin": { range: "Touch", castingTime: "1 action", requiresConcentration: true },
    "sanctuary": { range: "30 ft", castingTime: "1 bonus action", isBonusAction: true },
    "death ward": { range: "Touch", castingTime: "1 action" },
    "freedom of movement": { range: "Touch", castingTime: "1 action" },
    "protection from energy": { range: "Touch", castingTime: "1 action", requiresConcentration: true },
    "protection from poison": { range: "Touch", castingTime: "1 action" },
    "beacon of hope": { range: "30 ft", castingTime: "1 action", requiresConcentration: true, isAoE: true },
    "magic weapon": { range: "Touch", castingTime: "1 bonus action", isBonusAction: true, requiresConcentration: true },
    "enlarge/reduce": { range: "30 ft", castingTime: "1 action", requiresConcentration: true },
    "enhance ability": { range: "Touch", castingTime: "1 action", requiresConcentration: true },
    "blink": { range: "Self", castingTime: "1 action" },
    "see invisibility": { range: "Self", castingTime: "1 action" },
    "spider climb": { range: "Touch", castingTime: "1 action", requiresConcentration: true },
    "longstrider": { range: "Touch", castingTime: "1 action" },
};

const BUFF_TACTICAL_EFFECTS: Record<string, string> = {
    "shield": "⚡ Reaction: +5 bonus to AC and complete immunity to Magic Missile until next turn.",
    "mage armor": "🛡️ Warding: Base unarmored AC becomes 13 + Dexterity modifier.",
    "bless": "✨ Divine Favor: +1d4 bonus added to all attack rolls and saving throws.",
    "shield of faith": "🛡️ Divine Aegis: +2 bonus to Armor Class while concentrated.",
    "protection from evil and good": "⚔️ Warded: Aberrations, celestials, elementals, fey, fiends, and undead have Disadvantage on attacks against target; immune to charmed and frightened.",
    "haste": "⚡ Accelerated: +2 AC, double walking speed, advantage on Dex saves, and an extra Hasted Action each turn (weapon attack, Dash, Disengage, Hide).",
    "blur": "👁️ Shifting Form: Attack rolls against target have Disadvantage.",
    "mirror image": "👥 Illusions: Three illusory duplicates absorb and redirect incoming strikes.",
    "false life": "❤️ Bolstered: Grants temporary hit points to absorb incoming damage.",
    "armor of agathys": "❄️ Rime Warded: Spectral frost grants temp HP; melee attackers take retaliatory cold damage.",
    "expeditious retreat": "🏃 Swift: Take the Dash action as a bonus action on each of your turns.",
    "heroism": "🦁 Valorous: Immune to frightened, and gains temporary HP at the start of each turn.",
    "barkskin": "🪵 Resilient: Target's AC cannot be less than 16, regardless of armor.",
    "guidance": "🌟 Divine Guidance: Touch a willing creature and choose a skill. Until the spell ends, the creature adds 1d4 to any ability check using the chosen skill (Touch: 5 ft, 1 min conc).",
    "resistance": "🛡️ Divine Resistance: Touch a willing creature. Target adds 1d4 to one saving throw of its choice (Touch: 5 ft, 1 min conc).",
    "greater invisibility": "👁️ Flawless Invisibility: Attack rolls have advantage, attacks against have disadvantage. Does not break on attack or spellcasting.",
    "hunter's mark": "🏹 Quarry: You deal an extra 1d6 damage to the marked target whenever you hit it with a weapon attack.",
    "hex": "🔮 Cursed: Deal an extra 1d6 necrotic damage on hit and grant disadvantage on chosen ability checks.",
    "divine favor": "⚔️ Radiant Strikes: Your weapon attacks deal an extra 1d4 radiant damage on hit.",
    "crusader's mantle": "☀️ Holy Aura: 30-ft aura granting you and allies +1d4 radiant damage on weapon attacks.",
    "stoneskin": "🪨 Granite Flesh: Resistance to nonmagical bludgeoning, piercing, and slashing damage.",
    "sanctuary": "🕊️ Divine Ward: Any creature targeting target must make a Wisdom saving throw or lose the attack.",
    "death ward": "🛡️ Death Denial: First time the target drops to 0 HP, it drops to 1 HP instead and the ward ends.",
    "freedom of movement": "💨 Free Motion: Movement speed cannot be reduced; completely immune to paralyzed and restrained.",
    "protection from energy": "🔥 Elemental Ward: Resistance to chosen damage type (acid, cold, fire, lightning, or thunder).",
    "protection from poison": "🧪 Purity: Advantage on saves against poison and resistance to poison damage.",
    "beacon of hope": "🌟 Hope Eternal: Allies have advantage on WIS and death saves, and regain maximum HP from healing.",
    "magic weapon": "⚔️ Enchanted: Weapon gains +1 bonus to attack rolls and damage rolls.",
    "enlarge/reduce": "🍄 Titan Form: Target grows one size, advantage on STR checks/saves, +1d4 weapon damage.",
    "enhance ability": "✨ Ascendant: Advantage on checks with chosen ability; Bear's Endurance grants temporary hit points.",
    "blink": "🌀 Ethereal Flicker: 50% chance at end of each turn to vanish into Ethereal Plane, reappearing next turn.",
    "see invisibility": "👁️ True Sight: See invisible and ethereal creatures as if they were visible.",
    "spider climb": "🕷️ Arachnid: Climbing speed equal to walking speed, walk up walls and across ceilings.",
    "longstrider": "🏃 Swift Step: Walking speed increases by 10 feet.",
};

export interface SpellCastModalProps {
    isOpen: boolean;
    onClose: () => void;
    spell: CharacterSpell | null;
    caster: CombatParticipant | null;
    allParticipants: CombatParticipant[];
    initialTargetId?: string;
    getSpellSlots: (level: number) => { total: number; used: number; remaining: number };
    isCasting: boolean;
    onCast: (data: {
        casterId: number;
        targetId: number | null;
        targetIds?: number[];
        spellName: string;
        spellLevel: number;
        saveType?: string;
        saveDc?: number;
        damageString?: string;
        isHealing?: boolean;
        isRitual?: boolean;
        requiresConcentration?: boolean;
        isBonusAction?: boolean;
        castingTime?: string;
        halfOnSave?: boolean;
        metamagic?: string;
        twinnedTargetId?: number;
        carefulTargetIds?: number[];
    }) => Promise<void>;
    onStartAoETargeting?: (config: AoETargetingConfig) => void;
}

/**
 * Inner component mounted only when spell and caster are present.
 * Ensures unconditional hook execution to prevent React Compiler / static flag errors.
 */
function SpellCastModalContent({
    onClose,
    spell,
    caster,
    allParticipants,
    initialTargetId,
    getSpellSlots,
    isCasting,
    onCast,
    onStartAoETargeting,
}: {
    onClose: () => void;
    spell: CharacterSpell;
    caster: CombatParticipant;
    allParticipants: CombatParticipant[];
    initialTargetId?: string;
    getSpellSlots: (level: number) => { total: number; used: number; remaining: number };
    isCasting: boolean;
    onCast: SpellCastModalProps["onCast"];
    onStartAoETargeting?: (config: AoETargetingConfig) => void;
}) {
    const baseLevel = spell.level;
    const spellNameLower = spell.name.toLowerCase().trim();
    const mechanics = SPELL_MECHANICS[spellNameLower] || {};

    // Determine spellcasting ability modifier
    const spellcastingMod = useMemo(() => {
        const stats = caster.character?.stats;
        const cls = caster.character?.character_class?.name?.toLowerCase() || "";
        if (["cleric", "druid", "ranger"].includes(cls)) return stats?.wisdom_modifier ?? 3;
        if (["bard", "sorcerer", "warlock", "paladin"].includes(cls)) return stats?.charisma_modifier ?? 3;
        return stats?.intelligence_modifier ?? 3;
    }, [caster.character?.stats, caster.character?.character_class?.name]);

    // Spell Save DC (Calculated strictly by 5e rules: 8 + prof + mod)
    const spellSaveDc = useMemo(() => {
        return (
            caster.character?.stats?.spell_save_dc ||
            8 + (caster.character?.proficiency_bonus || 2) + spellcastingMod
        );
    }, [caster.character?.stats?.spell_save_dc, caster.character?.proficiency_bonus, spellcastingMod]);

    // Spell Attack Bonus (prof + mod)
    const spellAttackBonus = useMemo(() => {
        return (
            caster.character?.stats?.spell_attack_bonus ||
            (caster.character?.proficiency_bonus || 2) + spellcastingMod
        );
    }, [caster.character?.stats?.spell_attack_bonus, caster.character?.proficiency_bonus, spellcastingMod]);

    // Slot selection state - default to lowest available slot level >= baseLevel
    const initialLevel = useMemo(() => {
        if (baseLevel === 0) return 0;
        const baseSlot = getSpellSlots(baseLevel);
        if (baseSlot && baseSlot.remaining > 0) return baseLevel;
        const charSlots = caster.character?.stats?.spell_slots || {};
        const maxKnownSlot = Math.max(
            ...Object.keys(charSlots).map(Number),
            baseLevel
        );
        for (let lvl = baseLevel; lvl <= Math.min(9, Math.max(maxKnownSlot, baseLevel)); lvl++) {
            const s = getSpellSlots(lvl);
            if (s && s.remaining > 0) {
                return lvl;
            }
        }
        return baseLevel;
    }, [baseLevel, getSpellSlots, caster.character?.stats?.spell_slots]);

    const [selectedLevel, setSelectedLevel] = useState<number>(initialLevel);
    const [isRitual, setIsRitual] = useState<boolean>(false);

    // Sorcerer Metamagic state & capabilities
    const isSorcerer = !!(
        caster.is_sorcerer ||
        caster.character?.character_class?.name?.toLowerCase() === "sorcerer"
    );
    const sorceryPointsCurrent =
        caster.sorcery_points_current ??
        caster.character?.stats?.sorcery_points_current ??
        0;
    const sorceryPointsMax =
        caster.sorcery_points_max ??
        caster.character?.stats?.sorcery_points_max ??
        0;
    const hasMetamagic =
        isSorcerer &&
        ((caster.level || caster.character?.level || 1) >= 3 || !!caster.has_metamagic);

    const [selectedMetamagic, setSelectedMetamagic] = useState<string | null>(null);
    const [twinnedTargetId, setTwinnedTargetId] = useState<number | null>(null);
    const [carefulTargetIds, setCarefulTargetIds] = useState<number[]>([]);
    const twinnedCost = Math.max(1, isRitual ? 0 : selectedLevel);

    // Target selection state
    const spellDescription = spell.description || spell.spell_details?.description;
    const aoeDef = useMemo(() => {
        return getAoESpellConfig(spell.name, spellDescription, mechanics.range);
    }, [spell.name, spellDescription, mechanics.range]);
    const isHealingSpell = !!mechanics.isHealing || !!aoeDef?.isHealing;
    const isAoE = (!!mechanics.isAoE || isAoESpell(spell.name, spellDescription, mechanics.range)) && (!!aoeDef || !!mechanics.isAoE);
    const isBonusAction = !!mechanics.isBonusAction || !!aoeDef?.isBonusAction || (mechanics.castingTime?.toLowerCase().includes("bonus") ?? false);
    const isMultiMissile = spellNameLower === "magic missile";
    const totalDarts = 3 + Math.max(0, selectedLevel - 1);

    const upcastMultiTargetSpells = [
        "hold person", "invisibility", "blindness/deafness", "charm person",
        "fly", "banishment", "command"
    ];
    const isUpcastMultiTarget = upcastMultiTargetSpells.includes(spellNameLower);
    const maxAllowedTargets = isUpcastMultiTarget
        ? 1 + Math.max(0, selectedLevel - baseLevel)
        : 1;

    const isBuffSpell = useMemo(() => {
        const clean = spellNameLower.trim();
        const buffList = [
            "mage armor", "shield", "shield of faith", "bless", "haste", "heroism", "barkskin",
            "protection from evil and good", "protection from undead", "protect from undead",
            "protect from evil and good", "guidance", "resistance", "invisibility",
            "blur", "mirror image", "false life", "armor of agathys", "expeditious retreat", "fire shield", "aid", "fly",
            "greater invisibility", "hunter's mark", "hex", "divine favor", "crusader's mantle",
            "stoneskin", "sanctuary", "death ward", "freedom of movement", "protection from energy",
            "protection from poison", "beacon of hope", "magic weapon", "enlarge/reduce",
            "enhance ability", "blink", "see invisibility", "spider climb", "longstrider"
        ];
        return buffList.includes(clean);
    }, [spellNameLower]);

    const isSelfSpell = useMemo(() => {
        const clean = spellNameLower.trim();
        const selfList = ["shield", "blur", "mirror image", "false life", "expeditious retreat", "fire shield", "armor of agathys", "blink"];
        return selfList.includes(clean) || (mechanics.range?.toLowerCase().startsWith("self") && !mechanics.range?.toLowerCase().includes("("));
    }, [spellNameLower, mechanics.range]);

    // Authoritative range calculation & distance checking
    const effectiveSpellRange = spell.spell_details?.range || mechanics.range || "60 ft";
    const isTouchSpell = useMemo(() => effectiveSpellRange.toLowerCase().includes("touch"), [effectiveSpellRange]);
    const maxRangeFeet = useMemo(() => {
        if (isTouchSpell) return 5;
        if (isSelfSpell) return 0;
        const match = effectiveSpellRange.match(/(\d+)/);
        return match ? parseInt(match[1]) : 60;
    }, [isTouchSpell, isSelfSpell, effectiveSpellRange]);

    const getTargetDistance = (target: CombatParticipant): number => {
        if (target.id === caster.id) return 0;
        const x1 = caster.position_x ?? 0;
        const y1 = caster.position_y ?? 0;
        const z1 = caster.altitude ?? 0;
        const w1 = caster.size_dimensions?.feet ?? 5;

        const x2 = target.position_x ?? 0;
        const y2 = target.position_y ?? 0;
        const z2 = target.altitude ?? 0;
        const w2 = target.size_dimensions?.feet ?? 5;

        const hasCoords = (x1 !== 0 || y1 !== 0 || x2 !== 0 || y2 !== 0);
        if (!hasCoords) return 0;

        return get3DBoundingBoxDist(x1, y1, z1, w1, x2, y2, z2, w2);
    };

    const isTargetOutOfRange = (target: CombatParticipant): boolean => {
        if (target.id === caster.id) return false;
        const hasCoords = (
            (caster.position_x ?? 0) !== 0 ||
            (caster.position_y ?? 0) !== 0 ||
            (target.position_x ?? 0) !== 0 ||
            (target.position_y ?? 0) !== 0
        );
        if (!hasCoords) return false;
        const dist = getTargetDistance(target);
        return dist > maxRangeFeet;
    };

    const [targetType, setTargetType] = useState<"enemies" | "allies">(
        (isHealingSpell || isBuffSpell || isSelfSpell) ? "allies" : "enemies"
    );

    // Target arrays
    const enemyParticipants = useMemo(() => allParticipants.filter((p) => p.participant_type === "enemy" && p.is_active), [allParticipants]);
    const allyParticipants = useMemo(() => allParticipants.filter((p) => p.participant_type === "character" && p.is_active), [allParticipants]);
    const displayedParticipants = targetType === "enemies" ? enemyParticipants : allyParticipants;

    const [selectedTargetId, setSelectedTargetId] = useState<number | null>(() => {
        if (isHealingSpell || isSelfSpell || (isBuffSpell && !initialTargetId)) {
            return caster.id; // healing / self / buff defaults to caster self
        }
        if (initialTargetId) {
            const initId = parseInt(initialTargetId);
            const initP = allParticipants.find((p) => p.id === initId);
            if (initP && isTouchSpell && isTargetOutOfRange(initP)) {
                return caster.id; // Touch spell target out of range, fall back to self
            }
            return initId;
        }
        const enemy = allParticipants.find((p) => p.participant_type === "enemy" && p.is_active);
        return enemy ? enemy.id : null;
    });

    const selectedTarget = useMemo(
        () => allParticipants.find((p) => p.id === selectedTargetId) || null,
        [allParticipants, selectedTargetId]
    );
    const selectedTargetDist = selectedTarget ? getTargetDistance(selectedTarget) : 0;
    const isCurrentTargetOutOfRange = selectedTarget ? isTargetOutOfRange(selectedTarget) : false;

    const [selectedTargetIds, setSelectedTargetIds] = useState<number[]>(() => {
        if (isAoE) {
            if (isHealingSpell) {
                return allyParticipants.map((a) => a.id);
            }
            return enemyParticipants.map((e) => e.id);
        }
        if (isUpcastMultiTarget) {
            if (initialTargetId) {
                return [parseInt(initialTargetId)];
            }
            const firstTarget = (isHealingSpell || isBuffSpell) ? allyParticipants[0] : enemyParticipants[0];
            return firstTarget ? [firstTarget.id] : [];
        }
        return [];
    });

    // Magic Missile individual dart allocations (Target ID -> Dart Count)
    const [dartAllocations, setDartAllocations] = useState<Record<number, number>>(() => {
        if (!isMultiMissile) return {};
        const defaultTarget = initialTargetId
            ? parseInt(initialTargetId)
            : allParticipants.find((p) => p.participant_type === "enemy" && p.is_active)?.id;
        if (defaultTarget) {
            return { [defaultTarget]: 3 + Math.max(0, baseLevel - 1) };
        }
        return {};
    });

    useEffect(() => {
        if (!isMultiMissile) return;
        setDartAllocations((prev) => {
            const currentSum = Object.values(prev).reduce((sum, n) => sum + n, 0);
            if (currentSum === 0) {
                const defaultTarget = selectedTargetId || enemyParticipants[0]?.id;
                if (defaultTarget) return { [defaultTarget]: totalDarts };
                return {};
            }
            if (currentSum !== totalDarts) {
                const diff = totalDarts - currentSum;
                const targetIds = Object.keys(prev).map(Number);
                const primaryId = targetIds[0] || enemyParticipants[0]?.id;
                if (primaryId) {
                    const newCount = Math.max(0, (prev[primaryId] || 0) + diff);
                    return { ...prev, [primaryId]: newCount };
                }
            }
            return prev;
        });
    }, [isMultiMissile, totalDarts, enemyParticipants]);

    const assignedDartsCount = Object.values(dartAllocations).reduce((sum, n) => sum + n, 0);
    const unassignedDarts = Math.max(0, totalDarts - assignedDartsCount);

    const handleAddDart = (targetId: number) => {
        if (unassignedDarts <= 0) return;
        setDartAllocations((prev) => ({
            ...prev,
            [targetId]: (prev[targetId] || 0) + 1,
        }));
    };

    const handleRemoveDart = (targetId: number) => {
        setDartAllocations((prev) => {
            const cur = prev[targetId] || 0;
            if (cur <= 0) return prev;
            const next = { ...prev };
            if (cur === 1) {
                delete next[targetId];
            } else {
                next[targetId] = cur - 1;
            }
            return next;
        });
    };

    const toggleTargetId = (id: number) => {
        if (isUpcastMultiTarget) {
            setSelectedTargetIds((prev) => {
                if (prev.includes(id)) {
                    return prev.filter((x) => x !== id);
                }
                if (prev.length >= maxAllowedTargets) {
                    return [...prev.slice(1), id];
                }
                return [...prev, id];
            });
            return;
        }
        setSelectedTargetIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const selectAllDisplayed = () => {
        const ids = displayedParticipants.map((p) => p.id);
        setSelectedTargetIds((prev) => Array.from(new Set([...prev, ...ids])));
    };

    const deselectAllDisplayed = () => {
        const idSet = new Set(displayedParticipants.map((p) => p.id));
        setSelectedTargetIds((prev) => prev.filter((id) => !idSet.has(id)));
    };

    // Available spell slots
    const availableSlots = useMemo(() => {
        if (baseLevel === 0) return [];
        const levels: number[] = [];
        const charSlots = caster.character?.stats?.spell_slots || {};
        const maxKnownSlot = Math.max(
            ...Object.keys(charSlots).map(Number),
            baseLevel
        );
        for (let lvl = baseLevel; lvl <= Math.min(9, Math.max(maxKnownSlot, baseLevel)); lvl++) {
            levels.push(lvl);
        }
        return levels;
    }, [baseLevel, caster.character?.stats?.spell_slots]);

    // Determine caster level for cantrip scaling (5e rules: scales at lvl 5, 11, 17)
    const casterLevel = caster.character?.level ?? caster.character_level ?? caster.level ?? 1;
    const cantripMultiplier = casterLevel >= 17 ? 4 : casterLevel >= 11 ? 3 : casterLevel >= 5 ? 2 : 1;

    // Compute effective damage or healing dice based on slot level and cantrip scaling
    const computedFormula = useMemo(() => {
        if (isMultiMissile) {
            return `${totalDarts}x Darts (1d4+1 Force each)`;
        }

        if (spellNameLower === "scorching ray") {
            const extraRays = Math.max(0, selectedLevel - baseLevel);
            const totalRays = 3 + extraRays;
            return `${totalRays}x Rays (2d6 Fire each — ${totalRays * 2}d6 total)`;
        }

        if (spellNameLower === "sleep") {
            const extraDice = Math.max(0, selectedLevel - baseLevel) * 2;
            return `${5 + extraDice}d8 HP pool`;
        }

        if (spellNameLower === "color spray") {
            const extraDice = Math.max(0, selectedLevel - baseLevel) * 2;
            return `${6 + extraDice}d10 HP pool`;
        }

        if (spellNameLower === "spiritual weapon") {
            const extraDice = Math.floor(Math.max(0, selectedLevel - baseLevel) / 2);
            return `${1 + extraDice}d8+${spellcastingMod} Force`;
        }

        if (spellNameLower === "disintegrate") {
            const extraDice = Math.max(0, selectedLevel - baseLevel) * 3;
            return `${10 + extraDice}d6+40 Force`;
        }

        if (spellNameLower === "armor of agathys") {
            const hp = 5 * selectedLevel;
            return `${hp} Temp HP & ${hp} Cold Retaliation`;
        }

        if (spellNameLower === "false life") {
            const bonus = 5 * Math.max(0, selectedLevel - 1);
            return `1d4 + ${4 + bonus} Temp HP`;
        }

        if (spellNameLower === "aid") {
            const boost = 5 + 5 * Math.max(0, selectedLevel - 2);
            return `+${boost} Max & Current HP`;
        }

        if (spellNameLower === "power word kill") {
            return "Instant death if target has ≤ 100 HP";
        }

        if (spellNameLower === "power word stun") {
            return "Stunned if target has ≤ 150 HP";
        }

        if (spellNameLower === "hunter's mark") {
            return "+1d6 Weapon Damage on hit";
        }

        if (spellNameLower === "hex") {
            return "+1d6 Necrotic Damage on hit";
        }

        if (spellNameLower === "divine favor") {
            return "+1d4 Radiant Damage on weapon attacks";
        }

        if (spellNameLower === "crusader's mantle") {
            return "+1d4 Radiant Damage (30-ft aura)";
        }

        if (spellNameLower === "magic weapon") {
            return "+1 to Attack and Damage rolls";
        }

        if (spellNameLower === "enlarge/reduce") {
            return "+1d4 Weapon Damage & Advantage on STR";
        }

        if (spellNameLower === "enhance ability") {
            return "Advantage on Ability Checks (+2d6 Temp HP if Bear)";
        }

        if (spellNameLower === "stoneskin") {
            return "Resistance to nonmagical Bludgeoning/Piercing/Slashing";
        }

        if (spellNameLower === "death ward") {
            return "Drops to 1 HP instead of 0 HP on fatal damage";
        }

        if (spellNameLower === "beacon of hope") {
            return "Advantage on WIS/Death saves & Maximize all healing";
        }

        if (mechanics.isHealing && mechanics.healingBaseDice) {
            const extra = selectedLevel > baseLevel ? (selectedLevel - baseLevel) * (mechanics.upcastDiceCount || 1) : 0;
            const match = mechanics.healingBaseDice.match(/^(\d+)d(\d+)$/);
            if (match) {
                const totalDice = parseInt(match[1]) + extra;
                return `${totalDice}d${match[2]}+${spellcastingMod}`;
            }
            return `${mechanics.healingBaseDice}+${spellcastingMod}`;
        }

        if (mechanics.damageDice) {
            if (baseLevel === 0) {
                // Cantrip scaling by character level (Level 1-4: 1x, 5-10: 2x, 11-16: 3x, 17-20: 4x)
                let baseDiceStr = mechanics.damageDice;
                if (spellNameLower === "toll the dead" && selectedTarget) {
                    const curHp = selectedTarget.current_hp ?? 0;
                    const maxHp = selectedTarget.max_hp ?? 0;
                    if (maxHp > 0 && curHp < maxHp) {
                        baseDiceStr = "1d12";
                    }
                }
                const match = baseDiceStr.match(/^(\d+)d(\d+)([+-]\d+)?$/);
                if (match) {
                    const totalDice = parseInt(match[1]) * cantripMultiplier;
                    const mod = match[3] || "";
                    return `${totalDice}d${match[2]}${mod}`;
                }
                return baseDiceStr;
            }

            const extra = selectedLevel > baseLevel ? (selectedLevel - baseLevel) * (mechanics.upcastDiceCount || 1) : 0;
            const match = mechanics.damageDice.match(/^(\d+)d(\d+)([+-]\d+)?$/);
            if (match) {
                const totalDice = parseInt(match[1]) + extra;
                const mod = match[3] || "";
                return `${totalDice}d${match[2]}${mod}`;
            }
            return mechanics.damageDice;
        }

        // Check if spell_details has damage progression from DB
        const dbProg = spell.spell_details?.damage_progression?.find(
            (dp) => dp.spell_slot_level === selectedLevel
        );
        if (dbProg) {
            if (baseLevel === 0 && cantripMultiplier > 1) {
                const match = dbProg.damage_dice.match(/^(\d+)d(\d+)([+-]\d+)?$/);
                if (match) {
                    const totalDice = parseInt(match[1]) * cantripMultiplier;
                    const mod = match[3] || "";
                    return `${totalDice}d${match[2]}${mod}`;
                }
            }
            return dbProg.damage_dice;
        }

        // Generic fallback for any unlisted cantrip with baseLevel === 0:
        // parse description for damage dice pattern (e.g. 1d8, 1d10, 1d6, 1d12, 1d4)
        if (baseLevel === 0) {
            const descMatch = (spellDescription || "").match(/(\d+)d(\d+)([+-]\d+)?/i);
            if (descMatch) {
                const totalDice = parseInt(descMatch[1]) * cantripMultiplier;
                const mod = descMatch[3] || "";
                return `${totalDice}d${descMatch[2]}${mod}`;
            }
        }

        return "";
    }, [isMultiMissile, totalDarts, mechanics, selectedLevel, baseLevel, spellcastingMod, spell.spell_details?.damage_progression, cantripMultiplier, spellNameLower, selectedTarget, spellDescription]);

    // Dynamic tactical description for buffs factoring upcasting
    const dynamicBuffEffect = useMemo(() => {
        if (spellNameLower === "armor of agathys") {
            const hp = 5 * selectedLevel;
            return `❄️ Rime Warded: Spectral frost grants ${hp} temp HP; melee attackers take ${hp} retaliatory cold damage.`;
        }
        if (spellNameLower === "false life") {
            const bonus = 5 * Math.max(0, selectedLevel - 1);
            return `❤️ Bolstered: Grants 1d4 + ${4 + bonus} temporary hit points.`;
        }
        if (spellNameLower === "aid") {
            const boost = 5 + 5 * Math.max(0, selectedLevel - 2);
            return `🛡️ Toughness: Increases maximum and current HP by ${boost} for 8 hours.`;
        }
        return BUFF_TACTICAL_EFFECTS[spellNameLower] || "Combat Enhancement (Target radiates emerald aura)";
    }, [spellNameLower, selectedLevel]);

    // Check slot availability
    const currentSlotInfo = selectedLevel > 0 ? getSpellSlots(selectedLevel) : null;
    const hasSlotsRemaining = baseLevel === 0 || isRitual || (currentSlotInfo ? currentSlotInfo.remaining > 0 : true);

    const requiresConcentration = spell.spell_details?.concentration ?? (mechanics.requiresConcentration || false);

    const handleExecuteCast = async () => {
        let targetsToCast: number[] = [];
        let formula = computedFormula || undefined;

        if (isMultiMissile) {
            Object.entries(dartAllocations).forEach(([idStr, count]) => {
                const id = Number(idStr);
                for (let i = 0; i < count; i++) {
                    targetsToCast.push(id);
                }
            });
            const fallbackTarget = selectedTargetId || enemyParticipants[0]?.id;
            if (fallbackTarget) {
                while (targetsToCast.length < totalDarts) {
                    targetsToCast.push(fallbackTarget);
                }
            }
            formula = "1d4+1";
        } else if (isAoE) {
            targetsToCast = selectedTargetIds;
        } else if (isUpcastMultiTarget) {
            targetsToCast = selectedTargetIds.length > 0 ? selectedTargetIds : (selectedTargetId ? [selectedTargetId] : []);
        } else if (selectedTargetId) {
            targetsToCast = [selectedTargetId];
        }

        if (!hasSlotsRemaining || isCasting || targetsToCast.length === 0) return;

        // Range & Touch validation
        for (const tid of targetsToCast) {
            if (tid !== caster.id) {
                const targetP = allParticipants.find((p) => p.id === tid);
                if (targetP && isTargetOutOfRange(targetP)) {
                    const dist = getTargetDistance(targetP);
                    alert(
                        `${spell.name} is a ${
                            isTouchSpell ? "Touch spell (5 ft maximum reach)" : `ranged spell (max ${maxRangeFeet} ft)`
                        }! ${targetP.name} is ${dist} ft away. Move closer first!`
                    );
                    return;
                }
            }
        }

        const effectiveIsBonusAction =
            isBonusAction || selectedMetamagic === "quickened";
        const effectiveCastingTime =
            selectedMetamagic === "quickened"
                ? "1 bonus action"
                : mechanics.castingTime ||
                  spell.spell_details?.casting_time ||
                  (isBonusAction ? "1 bonus action" : "1 action");

        await onCast({
            casterId: caster.id,
            targetId: targetsToCast[0] || null,
            targetIds: targetsToCast,
            spellName: spell.name,
            spellLevel: isRitual ? 0 : selectedLevel,
            saveType: mechanics.saveType || undefined,
            saveDc: mechanics.saveType ? spellSaveDc : undefined,
            damageString: formula,
            isHealing: isHealingSpell,
            isRitual,
            requiresConcentration,
            isBonusAction: effectiveIsBonusAction,
            castingTime: effectiveCastingTime,
            halfOnSave: mechanics.halfOnSave ?? true,
            metamagic: selectedMetamagic || undefined,
            twinnedTargetId:
                selectedMetamagic === "twinned" ? (twinnedTargetId || undefined) : undefined,
            carefulTargetIds:
                selectedMetamagic === "careful" && carefulTargetIds.length > 0
                    ? carefulTargetIds
                    : undefined,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto animate-fade-in font-lora">
            <div className="bg-[#10121a] border-2 border-[#c5a059]/60 rounded-xl max-w-2xl w-full shadow-[0_0_50px_rgba(197,160,89,0.25)] flex flex-col max-h-[92vh] overflow-hidden text-slate-200">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-[#181a28] via-[#1b1c28] to-[#12131b] border-b border-[#c5a059]/30 px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">✨</span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-cinzel text-lg sm:text-xl font-bold text-[#f3e1b7] tracking-wider">
                                    {spell.name}
                                </h2>
                                <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[10px] font-mono">
                                    {baseLevel === 0 ? "Cantrip" : `Level ${baseLevel}`}
                                </Badge>
                                {spell.school && (
                                    <span className="text-xs text-[#c5a059]/80 font-cinzel italic">
                                        • {spell.school}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 font-fira-sans">
                                <span>Casting: {spell.spell_details?.casting_time || mechanics.castingTime || "1 action"}</span>
                                <span>•</span>
                                <span>
                                    Range:{" "}
                                    <strong className={isTouchSpell ? "text-amber-300 font-bold" : "text-slate-200"}>
                                        {isTouchSpell ? "Touch (5 ft)" : effectiveSpellRange}
                                    </strong>
                                </span>
                                {requiresConcentration && (
                                    <>
                                        <span>•</span>
                                        <span className="text-amber-400 font-semibold">⚠️ Concentration</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800/60 transition-colors text-lg cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                    {/* Spell Description Preview */}
                    {(spell.description || spell.spell_details?.description) && (
                        <div className="p-3 rounded-lg bg-[#151722]/80 border border-slate-800/80 text-slate-300 italic text-[11px] leading-relaxed">
                            "{spell.description || spell.spell_details?.description}"
                        </div>
                    )}

                    {/* Spell Slot Selection (if not cantrip) */}
                    {baseLevel > 0 && (
                        <div className="space-y-1.5 bg-[#141620] p-3 rounded-lg border border-[#c5a059]/20">
                            <div className="flex items-center justify-between">
                                <label className="font-cinzel font-bold text-[#c5a059] uppercase tracking-wider text-[11px]">
                                    Cast at Spell Slot Level
                                </label>
                                {spell.is_ritual && (
                                    <label className="flex items-center gap-1.5 cursor-pointer text-blue-300 hover:text-blue-200">
                                        <input
                                            type="checkbox"
                                            checked={isRitual}
                                            onChange={(e) => setIsRitual(e.target.checked)}
                                            className="rounded border-slate-700 bg-slate-900 text-[#c5a059]"
                                        />
                                        <span className="text-[11px] font-medium">Cast as Ritual (0 Slots, 10 min)</span>
                                    </label>
                                )}
                            </div>

                            {!isRitual && (
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
                                    {availableSlots.map((lvl) => {
                                        const slots = getSpellSlots(lvl);
                                        const isSelected = selectedLevel === lvl;
                                        const isExhausted = slots.remaining <= 0;
                                        return (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => setSelectedLevel(lvl)}
                                                disabled={isExhausted}
                                                className={`p-2 rounded border text-center transition-all cursor-pointer ${
                                                    isSelected
                                                        ? "bg-[#c5a059] text-black font-bold border-[#e0bc75] shadow-[0_0_12px_rgba(197,160,89,0.4)]"
                                                        : isExhausted
                                                        ? "bg-[#111218] border-slate-800 text-slate-600 opacity-50 cursor-not-allowed"
                                                        : "bg-[#181a24] border-slate-700 hover:border-[#c5a059]/60 text-slate-300"
                                                }`}
                                            >
                                                <div className="font-cinzel text-xs font-bold">
                                                    Level {lvl}
                                                </div>
                                                <div className="text-[10px] font-fira-sans mt-0.5">
                                                    {slots.remaining}/{slots.total} left
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {!hasSlotsRemaining && (
                                <p className="text-red-400 text-[11px] mt-1 font-semibold flex items-center gap-1">
                                    <span>⚠️</span> No Level {selectedLevel} spell slots remaining. Select another level or cast as ritual if available.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Metamagic Selection (Sorcerer Feature) */}
                    {hasMetamagic && (
                        <div className="space-y-2 bg-gradient-to-r from-purple-950/40 via-[#151624] to-[#141520] p-3 rounded-lg border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🔮</span>
                                    <label className="font-cinzel font-bold text-purple-300 uppercase tracking-wider text-[11px]">
                                        Metamagic Enhancement
                                    </label>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/50 text-purple-200 font-mono text-[10px] font-bold">
                                    <span>💎</span>
                                    <span>{sorceryPointsCurrent} / {sorceryPointsMax} SP</span>
                                </div>
                            </div>

                            {/* Metamagic Options Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                                {[
                                    {
                                        id: null,
                                        name: "Standard Cast",
                                        icon: "✨",
                                        cost: 0,
                                        tagline: "No Metamagic",
                                        desc: "Cast standard without spending Sorcery Points.",
                                        available: true,
                                    },
                                    {
                                        id: "quickened",
                                        name: "Quickened",
                                        icon: "⚡",
                                        cost: 2,
                                        tagline: "Bonus Action",
                                        desc: "Changes casting time to 1 Bonus Action.",
                                        available: !isBonusAction && sorceryPointsCurrent >= 2,
                                    },
                                    {
                                        id: "twinned",
                                        name: "Twinned",
                                        icon: "👥",
                                        cost: twinnedCost,
                                        tagline: "2nd Target",
                                        desc: "Target a second creature in range.",
                                        available: !isAoE && !isSelfSpell && sorceryPointsCurrent >= twinnedCost,
                                    },
                                    {
                                        id: "subtle",
                                        name: "Subtle",
                                        icon: "🤫",
                                        cost: 1,
                                        tagline: "No Verbal/Somatic",
                                        desc: "Cast without verbal or somatic components.",
                                        available: sorceryPointsCurrent >= 1,
                                    },
                                    {
                                        id: "empowered",
                                        name: "Empowered",
                                        icon: "🔥",
                                        cost: 1,
                                        tagline: "Reroll Damage",
                                        desc: "Reroll up to CHA modifier damage dice.",
                                        available: (!!mechanics.damageDice || !!computedFormula) && sorceryPointsCurrent >= 1,
                                    },
                                    {
                                        id: "heightened",
                                        name: "Heightened",
                                        icon: "🎯",
                                        cost: 3,
                                        tagline: "Disadv on Save",
                                        desc: "Target has Disadvantage on the saving throw.",
                                        available: !!mechanics.saveType && sorceryPointsCurrent >= 3,
                                    },
                                    {
                                        id: "careful",
                                        name: "Careful",
                                        icon: "🛡️",
                                        cost: 1,
                                        tagline: "Protect Allies",
                                        desc: "Chosen allies automatically succeed on the save.",
                                        available: !!mechanics.saveType && sorceryPointsCurrent >= 1,
                                    },
                                ].map((meta) => {
                                    const isSelected = selectedMetamagic === meta.id;
                                    const isDisabled = !meta.available;

                                    return (
                                        <button
                                            key={meta.name}
                                            type="button"
                                            onClick={() => setSelectedMetamagic(meta.id)}
                                            disabled={isDisabled}
                                            title={meta.desc}
                                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer relative ${
                                                isSelected
                                                    ? "bg-gradient-to-r from-purple-900 to-indigo-900 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                                                    : isDisabled
                                                    ? "bg-[#111218]/60 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed"
                                                    : "bg-[#161826] border-purple-900/40 hover:border-purple-500/60 text-slate-300 hover:text-white"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-cinzel text-xs font-bold flex items-center gap-1">
                                                    <span>{meta.icon}</span>
                                                    <span>{meta.name}</span>
                                                </span>
                                                {meta.cost > 0 && (
                                                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                                        isSelected
                                                            ? "bg-purple-950 text-purple-200 border border-purple-400"
                                                            : "bg-purple-950/60 text-purple-300"
                                                    }`}>
                                                        {meta.cost} SP
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                                                {meta.tagline}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Secondary Target Selector for Twinned Spell */}
                            {selectedMetamagic === "twinned" && (
                                <div className="mt-2 p-2.5 rounded bg-purple-950/40 border border-purple-500/30">
                                    <label className="text-[11px] font-cinzel font-bold text-purple-200 block mb-1.5">
                                        👥 Select Secondary Target (Twinned Spell)
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {allParticipants
                                            .filter((p) => p.is_active && p.current_hp > 0 && p.id !== caster.id && p.id !== selectedTargetId)
                                            .map((p) => {
                                                const isPicked = twinnedTargetId === p.id;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => setTwinnedTargetId(isPicked ? null : p.id)}
                                                        className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                                            isPicked
                                                                ? "bg-purple-600 text-white border-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                                                : "bg-[#181a26] text-purple-200 border-purple-800/60 hover:border-purple-400"
                                                        }`}
                                                    >
                                                        <span>{p.participant_type === "enemy" ? "👹" : "🛡️"}</span>
                                                        <span>{p.name}</span>
                                                        <span className="text-[10px] text-slate-400">({p.current_hp}/{p.max_hp} HP)</span>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                    {!twinnedTargetId && (
                                        <p className="text-[10px] text-amber-300/80 mt-1 italic">
                                            Select a 2nd target creature within range to twin this spell.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Careful Spell Allies Multi-Select */}
                            {selectedMetamagic === "careful" && (
                                <div className="mt-2 p-2.5 rounded bg-purple-950/40 border border-purple-500/30">
                                    <label className="text-[11px] font-cinzel font-bold text-purple-200 block mb-1.5">
                                        🛡️ Protected Creatures (Auto-Succeed Save)
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {allParticipants
                                            .filter((p) => p.is_active && p.current_hp > 0 && p.participant_type === caster.participant_type)
                                            .map((p) => {
                                                const isProtected = carefulTargetIds.includes(p.id);
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setCarefulTargetIds((prev) =>
                                                                isProtected ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                                                            );
                                                        }}
                                                        className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                                            isProtected
                                                                ? "bg-emerald-700 text-white border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                                                : "bg-[#181a26] text-slate-300 border-slate-700 hover:border-emerald-500"
                                                        }`}
                                                    >
                                                        <span>{isProtected ? "✓" : "○"}</span>
                                                        <span>{p.name}</span>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Target Selection */}
                    <div className="space-y-2 bg-[#141620] p-3 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <label className="font-cinzel font-bold text-[#c5a059] uppercase tracking-wider text-[11px]">
                                    {isAoE ? "AoE Target Selection" : isUpcastMultiTarget ? "Multi-Target Selection" : "Target Selection"}
                                </label>
                                {isAoE && (
                                    <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[9px] font-mono">
                                        Multi-Target ({selectedTargetIds.length})
                                    </Badge>
                                )}
                                {isUpcastMultiTarget && (
                                    <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[9px] font-mono">
                                        Targets ({selectedTargetIds.length} / {maxAllowedTargets} max)
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {isAoE && (
                                    <div className="flex items-center gap-1 mr-1">
                                        <button
                                            type="button"
                                            onClick={selectAllDisplayed}
                                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#181a24] hover:bg-[#252838] text-amber-300 border border-amber-600/40 cursor-pointer transition-colors"
                                        >
                                            Select All ({displayedParticipants.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={deselectAllDisplayed}
                                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#181a24] hover:bg-[#252838] text-slate-400 border border-slate-700 cursor-pointer transition-colors"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center gap-1 bg-[#0c0d12] p-0.5 rounded border border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setTargetType("enemies")}
                                        className={`px-2.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                            targetType === "enemies"
                                                ? "bg-red-950 text-red-300 border border-red-800/60"
                                                : "text-slate-400 hover:text-white"
                                        }`}
                                    >
                                        Hostiles ({enemyParticipants.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTargetType("allies")}
                                        className={`px-2.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                            targetType === "allies"
                                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                                                : "text-slate-400 hover:text-white"
                                        }`}
                                    >
                                        Allies & Self ({allyParticipants.length})
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Target Grid */}
                        {isMultiMissile && (
                            <div className="flex items-center justify-between px-3 py-1.5 rounded bg-purple-950/70 border border-purple-600/50 mb-2">
                                <div className="flex items-center gap-1.5 text-xs text-purple-200 font-cinzel font-bold">
                                    <span>🎯</span>
                                    <span>Divide Missiles: {totalDarts} Darts (1d4+1 Force each)</span>
                                </div>
                                <span className={`text-[11px] font-fira-sans font-bold px-2 py-0.5 rounded ${
                                    unassignedDarts === 0 ? "bg-emerald-950 text-emerald-300 border border-emerald-600/60" : "bg-amber-950 text-amber-300 border border-amber-600/60 animate-pulse"
                                }`}>
                                    {unassignedDarts === 0 ? "✓ All Darts Assigned" : `${unassignedDarts} Remaining`}
                                </span>
                            </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                            {displayedParticipants.map((p) => {
                                const isSelected = isMultiMissile
                                    ? (dartAllocations[p.id] || 0) > 0
                                    : (isAoE || isUpcastMultiTarget)
                                    ? selectedTargetIds.includes(p.id)
                                    : selectedTargetId === p.id;
                                const isSelf = p.id === caster.id;
                                const isOutOfRange = isTargetOutOfRange(p);
                                const dist = getTargetDistance(p);
                                const hasCoords = (
                                    (caster.position_x ?? 0) !== 0 ||
                                    (caster.position_y ?? 0) !== 0 ||
                                    (p.position_x ?? 0) !== 0 ||
                                    (p.position_y ?? 0) !== 0
                                );
                                const hpPct = Math.max(0, Math.min(100, (p.current_hp / p.max_hp) * 100));
                                return (
                                    <div
                                        key={p.id}
                                        role="button"
                                        tabIndex={isOutOfRange ? -1 : 0}
                                        onClick={() => {
                                            if (isOutOfRange) return;
                                            if (isMultiMissile) {
                                                if (unassignedDarts > 0) {
                                                    handleAddDart(p.id);
                                                } else if ((dartAllocations[p.id] || 0) === totalDarts) {
                                                    // Already has all darts assigned
                                                } else {
                                                    setDartAllocations({ [p.id]: totalDarts });
                                                    setSelectedTargetId(p.id);
                                                }
                                            } else if (isAoE || isUpcastMultiTarget) {
                                                toggleTargetId(p.id);
                                            } else {
                                                setSelectedTargetId(p.id);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (isOutOfRange) return;
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                if (isMultiMissile) {
                                                    if (unassignedDarts > 0) {
                                                        handleAddDart(p.id);
                                                    } else {
                                                        setDartAllocations({ [p.id]: totalDarts });
                                                        setSelectedTargetId(p.id);
                                                    }
                                                } else if (isAoE || isUpcastMultiTarget) {
                                                    toggleTargetId(p.id);
                                                } else {
                                                    setSelectedTargetId(p.id);
                                                }
                                            }
                                        }}
                                        className={`p-2 rounded border text-left flex items-center gap-2 transition-all ${
                                            isOutOfRange
                                                ? "bg-[#161218] border-rose-950/60 opacity-50 cursor-not-allowed"
                                                : isSelected
                                                ? isMultiMissile
                                                    ? "bg-[#251b2e] border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)] cursor-pointer"
                                                    : (isAoE || isUpcastMultiTarget)
                                                    ? "bg-[#241a29] border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)] cursor-pointer"
                                                    : "bg-[#25201b] border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.25)] cursor-pointer"
                                                : "bg-[#181a24] border-slate-800 hover:border-slate-600 cursor-pointer"
                                        }`}
                                    >
                                        {(isAoE || isUpcastMultiTarget) && !isMultiMissile && (
                                            <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold border flex-shrink-0 transition-colors ${
                                                isSelected
                                                    ? "bg-purple-600 border-purple-400 text-white"
                                                    : "border-slate-700 bg-slate-900 text-transparent"
                                            }`}>
                                                ✓
                                            </div>
                                        )}
                                        <CombatantPortrait participant={p} size="sm" showAc={false} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="font-cinzel text-xs font-bold text-slate-200 truncate">
                                                    {isSelf ? `${p.name} (Self)` : p.name}
                                                </span>
                                                <span className="text-[10px] font-fira-sans text-[#c5a059]">
                                                    AC {p.armor_class}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                                                <div
                                                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                                                    style={{ width: `${hpPct}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-[9px] font-fira-sans mt-0.5">
                                                <span className="text-slate-400">
                                                    {p.current_hp}/{p.max_hp} HP
                                                </span>
                                                {isSelf ? (
                                                    <span className="text-emerald-400 font-bold px-1 py-0.2 rounded bg-emerald-950/60 border border-emerald-700/60">
                                                        Touch / Self
                                                    </span>
                                                ) : isOutOfRange ? (
                                                    <span
                                                        className="text-rose-400 font-bold px-1 py-0.2 rounded bg-rose-950/80 border border-rose-800/80"
                                                        title={`Distance: ${dist} ft. Maximum range is ${maxRangeFeet} ft.`}
                                                    >
                                                        ❌ {dist} ft (Out of Range)
                                                    </span>
                                                ) : hasCoords ? (
                                                    <span className="text-emerald-400 font-medium px-1 py-0.2 rounded bg-emerald-950/60 border border-emerald-700/60">
                                                        {isTouchSpell ? `✅ Reach (${dist} ft)` : `✅ ${dist} ft`}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>

                                        {isMultiMissile && (
                                            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveDart(p.id)}
                                                    disabled={!(dartAllocations[p.id] > 0)}
                                                    className="w-5 h-5 rounded bg-purple-950 hover:bg-purple-800 border border-purple-600/70 disabled:opacity-25 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                                                >
                                                    -
                                                </button>
                                                <span className="min-w-5 text-center font-fira-sans font-bold text-xs text-purple-200">
                                                    {dartAllocations[p.id] || 0}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddDart(p.id)}
                                                    disabled={unassignedDarts <= 0}
                                                    className="w-5 h-5 rounded bg-purple-950 hover:bg-purple-800 border border-purple-600/70 disabled:opacity-25 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Authoritative 5e Mechanics & Resolution Preview (Read-Only) */}
                    <div className="bg-[#141620] p-3.5 rounded-lg border border-[#c5a059]/30 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="font-cinzel font-bold text-[#e0bc75] uppercase tracking-wider text-[11px]">
                                5e Ruleset Mechanics
                            </span>
                            <span className="text-[10px] text-slate-400 font-fira-sans">
                                Action Cost: <strong className={isBonusAction ? "text-amber-400" : "text-emerald-400"}>{isBonusAction ? "1 Bonus Action" : "1 Action"}</strong>
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {/* Roll / Save Badge */}
                            {mechanics.saveType ? (
                                <div className="p-2.5 rounded bg-[#181924] border border-red-900/40">
                                    <span className="text-[10px] uppercase font-cinzel font-bold text-red-300 block">
                                        Saving Throw Requirement
                                    </span>
                                    <div className="text-sm font-bold font-cinzel text-amber-200 mt-0.5">
                                        DC {spellSaveDc} {mechanics.saveType} Save
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-lora">
                                        {mechanics.halfOnSave
                                            ? "Target takes half damage on successful save."
                                            : "Target negates the spell effect on successful save."}
                                    </p>
                                </div>
                            ) : mechanics.isAttackRoll ? (
                                <div className="p-2.5 rounded bg-[#181924] border border-emerald-900/40">
                                    <span className="text-[10px] uppercase font-cinzel font-bold text-emerald-300 block">
                                        Spell Attack Roll
                                    </span>
                                    <div className="text-sm font-bold font-cinzel text-emerald-300 mt-0.5">
                                        +{spellAttackBonus} to Hit
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-lora">
                                        Rolls 1d20 + {spellAttackBonus} vs target's Armor Class.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-2.5 rounded bg-[#181924] border border-slate-800">
                                    <span className="text-[10px] uppercase font-cinzel font-bold text-slate-300 block">
                                        Resolution
                                    </span>
                                    <div className="text-sm font-bold font-cinzel text-[#e0bc75] mt-0.5">
                                        Automatic Hit / Direct
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-lora">
                                        Applies effect directly without an attack roll or save.
                                    </p>
                                </div>
                            )}

                            {/* Damage, Healing, or Tactical Buff Badge */}
                            {isBuffSpell ? (
                                <div className="p-2.5 rounded bg-emerald-950/50 border border-emerald-600/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                                    <span className="text-[10px] uppercase font-cinzel font-bold text-emerald-300 block">
                                        ✨ Positive Tactical Buff
                                    </span>
                                    <div className="text-xs font-bold font-fira-sans text-emerald-200 mt-1 flex items-center gap-1.5">
                                        <span>{dynamicBuffEffect}</span>
                                    </div>
                                    <p className="text-[10px] text-emerald-400/80 mt-1 font-lora">
                                        Applies tactical buffs, AC modifications, or protective wards directly to the target combatant.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-2.5 rounded bg-[#181924] border border-purple-900/40">
                                    <span className="text-[10px] uppercase font-cinzel font-bold text-purple-300 block">
                                        {isHealingSpell ? "💚 Restorative Healing" : "💥 Damage Output"}
                                    </span>
                                    <div className="text-sm font-bold font-fira-sans text-slate-100 mt-0.5 flex items-center gap-1.5">
                                        <span>{computedFormula || "No Direct Damage"}</span>
                                        {mechanics.damageType && (
                                            <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[9px] uppercase font-mono">
                                                {mechanics.damageType}
                                            </Badge>
                                        )}
                                        {baseLevel === 0 && spellNameLower === "eldritch blast" && cantripMultiplier > 1 && (
                                            <span className="text-[10px] text-purple-300/80 font-mono">
                                                ({cantripMultiplier} beams)
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-lora">
                                        {isHealingSpell
                                            ? "Restores hit points up to target's maximum health."
                                            : baseLevel === 0
                                            ? `Cantrip potency scales with character level (Level ${casterLevel}: ${cantripMultiplier} ${spellNameLower === "eldritch blast" ? `beam${cantripMultiplier > 1 ? "s" : ""}` : `dice`}).`
                                            : selectedLevel > baseLevel
                                            ? `Upcast from base Level ${baseLevel} for extra potency.`
                                            : "Standard spell potency."}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Status Condition Trigger */}
                        {mechanics.condition && (
                            <div className="p-2 rounded bg-purple-950/40 border border-purple-800/50 flex items-center gap-2">
                                <span className="text-lg">⚡</span>
                                <div>
                                    <span className="text-[10px] text-purple-300 font-cinzel uppercase font-bold">
                                        Status Condition:
                                    </span>
                                    <span className="text-xs font-bold text-amber-300 ml-1.5 uppercase tracking-wide">
                                        {mechanics.condition}
                                    </span>
                                    <p className="text-[10px] text-slate-400 font-lora">
                                        Automatically applied to target upon a failed saving throw.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-[#141620] border-t border-[#c5a059]/30 px-5 py-3.5 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>Target:</span>
                        <span className="font-bold text-[#e0bc75] font-cinzel">
                            {isMultiMissile
                                ? `${assignedDartsCount}/${totalDarts} Darts Assigned`
                                : isAoE
                                ? `${selectedTargetIds.length} Target${selectedTargetIds.length !== 1 ? 's' : ''} in AoE`
                                : isUpcastMultiTarget
                                ? `${selectedTargetIds.length} / ${maxAllowedTargets} Target${maxAllowedTargets !== 1 ? 's' : ''}`
                                : (selectedTarget ? selectedTarget.name : "None selected")}
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="ghost"
                            className="text-slate-400 hover:text-white text-xs h-9 px-3 cursor-pointer"
                        >
                            Cancel
                        </Button>

                        {isAoE && onStartAoETargeting && aoeDef && (
                            <Button
                                type="button"
                                disabled={!hasSlotsRemaining || isCasting}
                                onClick={() => {
                                    const shape = aoeDef.shape;
                                    const size = aoeDef.size;
                                    onStartAoETargeting({
                                        spell,
                                        spellLevel: selectedLevel,
                                        shape,
                                        size,
                                        saveType: mechanics.saveType || aoeDef?.saveType,
                                        saveDc: spellSaveDc,
                                        damageFormula: computedFormula || aoeDef?.damageFormula || "",
                                        damageType: mechanics.damageType || aoeDef?.damageType,
                                        isHealing: isHealingSpell,
                                        halfOnSave: mechanics.halfOnSave ?? aoeDef?.halfOnSave ?? true,
                                        requiresConcentration: mechanics.requiresConcentration || aoeDef?.requiresConcentration,
                                        isBonusAction: isBonusAction,
                                        castingTime: mechanics.castingTime || aoeDef?.castingTime,
                                    });
                                    onClose();
                                }}
                                className="h-9 px-4 font-cinzel font-bold text-xs uppercase tracking-wider rounded bg-cyan-600 hover:bg-cyan-500 border border-cyan-400 text-white shadow-[0_0_18px_rgba(6,182,212,0.5)] cursor-pointer flex items-center gap-1.5 transition-all"
                            >
                                <span>🎯</span>
                                <span>Aim {aoeDef.shape.toUpperCase()} ({aoeDef.size} FT) on Grid</span>
                            </Button>
                        )}

                        <Button
                            type="button"
                            onClick={handleExecuteCast}
                            disabled={
                                !hasSlotsRemaining ||
                                isCasting ||
                                (isMultiMissile
                                    ? assignedDartsCount === 0
                                    : isAoE
                                    ? selectedTargetIds.length === 0
                                    : !selectedTargetId) ||
                                isCurrentTargetOutOfRange
                            }
                            className={`h-9 px-5 font-cinzel font-bold text-xs uppercase tracking-wider rounded transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${
                                !hasSlotsRemaining ||
                                isCasting ||
                                (isMultiMissile ? assignedDartsCount === 0 : isAoE ? selectedTargetIds.length === 0 : !selectedTargetId) ||
                                isCurrentTargetOutOfRange
                                    ? "bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed"
                                    : "bg-gradient-to-r from-[#c5a059] to-[#d6b16a] hover:from-[#d6b16a] hover:to-[#e5c27d] text-[#0c0d12] shadow-[0_0_15px_rgba(197,160,89,0.35)]"
                            }`}
                        >
                            {isCasting ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    <span>Invoking...</span>
                                </>
                            ) : isCurrentTargetOutOfRange ? (
                                <>
                                    <span>⚠️</span>
                                    <span>Target Out of Reach ({selectedTargetDist} ft &gt; {maxRangeFeet} ft)</span>
                                </>
                            ) : (
                                <>
                                    <span>{isAoE ? "⚡" : "✨"}</span>
                                    <span>{isAoE ? (selectedTargetIds.length > 0 ? `List Cast (${selectedTargetIds.length})` : "List Cast") : `Cast ${spell.name}`}</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Outer wrapper that only mounts the content when prerequisites are met.
 * Strictly adheres to React Rules of Hooks.
 */
export function SpellCastModal(props: SpellCastModalProps) {
    if (!props.isOpen || !props.spell || !props.caster) {
        return null;
    }

    return (
        <SpellCastModalContent
            onClose={props.onClose}
            spell={props.spell}
            caster={props.caster}
            allParticipants={props.allParticipants}
            initialTargetId={props.initialTargetId}
            getSpellSlots={props.getSpellSlots}
            isCasting={props.isCasting}
            onCast={props.onCast}
            onStartAoETargeting={props.onStartAoETargeting}
        />
    );
}
