"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CombatantPortrait } from "@/components/combat/CombatantPortrait";
import type { CombatParticipant, CharacterSpell, AoETargetingConfig } from "@/lib/types/combat";
import { isAoESpell, getAoESpellConfig } from "@/lib/data/spellAoE";

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

    // Slot selection state
    const [selectedLevel, setSelectedLevel] = useState<number>(baseLevel);
    const [isRitual, setIsRitual] = useState<boolean>(false);

    // Target selection state
    const spellDescription = spell.description || spell.spell_details?.description;
    const aoeDef = useMemo(() => {
        return getAoESpellConfig(spell.name, spellDescription, mechanics.range);
    }, [spell.name, spellDescription, mechanics.range]);
    const isHealingSpell = !!mechanics.isHealing || !!aoeDef?.isHealing;
    const isAoE = !!mechanics.isAoE || isAoESpell(spell.name, spellDescription, mechanics.range);
    const isBonusAction = !!mechanics.isBonusAction || !!aoeDef?.isBonusAction || (mechanics.castingTime?.toLowerCase().includes("bonus") ?? false);
    const isMultiMissile = spellNameLower === "magic missile";
    const totalDarts = 3 + Math.max(0, selectedLevel - 1);

    const [targetType, setTargetType] = useState<"enemies" | "allies">(
        isHealingSpell ? "allies" : "enemies"
    );

    // Target arrays
    const enemyParticipants = useMemo(() => allParticipants.filter((p) => p.participant_type === "enemy" && p.is_active), [allParticipants]);
    const allyParticipants = useMemo(() => allParticipants.filter((p) => p.participant_type === "character" && p.is_active), [allParticipants]);
    const displayedParticipants = targetType === "enemies" ? enemyParticipants : allyParticipants;

    const [selectedTargetId, setSelectedTargetId] = useState<number | null>(() => {
        if (isHealingSpell) {
            return caster.id; // healing defaults to caster self
        }
        if (initialTargetId) {
            return parseInt(initialTargetId);
        }
        const enemy = allParticipants.find((p) => p.participant_type === "enemy" && p.is_active);
        return enemy ? enemy.id : null;
    });

    const [selectedTargetIds, setSelectedTargetIds] = useState<number[]>(() => {
        if (!isAoE) return [];
        if (isHealingSpell) {
            return allyParticipants.map((a) => a.id);
        }
        return enemyParticipants.map((e) => e.id);
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

    // Compute effective damage or healing dice based on slot level
    const computedFormula = useMemo(() => {
        if (isMultiMissile) {
            return `${totalDarts}x Darts (1d4+1 Force each)`;
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
            const extra = selectedLevel > baseLevel ? (selectedLevel - baseLevel) * (mechanics.upcastDiceCount || 1) : 0;
            const match = mechanics.damageDice.match(/^(\d+)d(\d+)(\+\d+)?$/);
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
            return dbProg.damage_dice;
        }

        return "";
    }, [isMultiMissile, totalDarts, mechanics, selectedLevel, baseLevel, spellcastingMod, spell.spell_details?.damage_progression]);

    // Check slot availability
    const currentSlotInfo = selectedLevel > 0 ? getSpellSlots(selectedLevel) : null;
    const hasSlotsRemaining = baseLevel === 0 || isRitual || (currentSlotInfo ? currentSlotInfo.remaining > 0 : true);

    const selectedTarget = allParticipants.find((p) => p.id === selectedTargetId) || null;
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
        } else if (selectedTargetId) {
            targetsToCast = [selectedTargetId];
        }

        if (!hasSlotsRemaining || isCasting || targetsToCast.length === 0) return;

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
            isBonusAction,
            castingTime: mechanics.castingTime || spell.spell_details?.casting_time || (isBonusAction ? "1 bonus action" : "1 action"),
            halfOnSave: mechanics.halfOnSave ?? true,
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
                                <span>Range: {spell.spell_details?.range || mechanics.range || "60 ft"}</span>
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

                    {/* Target Selection */}
                    <div className="space-y-2 bg-[#141620] p-3 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <label className="font-cinzel font-bold text-[#c5a059] uppercase tracking-wider text-[11px]">
                                    {isAoE ? "AoE Target Selection" : "Target Selection"}
                                </label>
                                {isAoE && (
                                    <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[9px] font-mono">
                                        Multi-Target ({selectedTargetIds.length})
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
                                    : isAoE
                                    ? selectedTargetIds.includes(p.id)
                                    : selectedTargetId === p.id;
                                const isSelf = p.id === caster.id;
                                const hpPct = Math.max(0, Math.min(100, (p.current_hp / p.max_hp) * 100));
                                return (
                                    <div
                                        key={p.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                            if (isMultiMissile) {
                                                if (unassignedDarts > 0) {
                                                    handleAddDart(p.id);
                                                } else if ((dartAllocations[p.id] || 0) === totalDarts) {
                                                    // Already has all darts assigned
                                                } else {
                                                    setDartAllocations({ [p.id]: totalDarts });
                                                    setSelectedTargetId(p.id);
                                                }
                                            } else if (isAoE) {
                                                toggleTargetId(p.id);
                                            } else {
                                                setSelectedTargetId(p.id);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                if (isMultiMissile) {
                                                    if (unassignedDarts > 0) {
                                                        handleAddDart(p.id);
                                                    } else {
                                                        setDartAllocations({ [p.id]: totalDarts });
                                                        setSelectedTargetId(p.id);
                                                    }
                                                } else if (isAoE) {
                                                    toggleTargetId(p.id);
                                                } else {
                                                    setSelectedTargetId(p.id);
                                                }
                                            }
                                        }}
                                        className={`p-2 rounded border text-left flex items-center gap-2 transition-all cursor-pointer ${
                                            isSelected
                                                ? isMultiMissile
                                                    ? "bg-[#251b2e] border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                                                    : isAoE
                                                    ? "bg-[#241a29] border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                                                    : "bg-[#25201b] border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                                                : "bg-[#181a24] border-slate-800 hover:border-slate-600"
                                        }`}
                                    >
                                        {isAoE && !isMultiMissile && (
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
                                            <span className="text-[9px] text-slate-400 font-fira-sans block mt-0.5">
                                                {p.current_hp}/{p.max_hp} HP
                                            </span>
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

                            {/* Damage or Healing Formula Badge */}
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
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-lora">
                                    {isHealingSpell
                                        ? "Restores hit points up to target's maximum health."
                                        : selectedLevel > baseLevel
                                        ? `Upcast from base Level ${baseLevel} for extra damage.`
                                        : "Standard spell potency."}
                                </p>
                            </div>
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

                        {isAoE && onStartAoETargeting && (
                            <Button
                                type="button"
                                disabled={!hasSlotsRemaining || isCasting}
                                onClick={() => {
                                    const shape = aoeDef?.shape || (
                                        (mechanics.range || "").toLowerCase().includes("cone") ? "cone" :
                                        (mechanics.range || "").toLowerCase().includes("line") ? "line" :
                                        ((mechanics.range || "").toLowerCase().includes("cube") || (mechanics.range || "").toLowerCase().includes("square")) ? "cube" : "sphere"
                                    );
                                    const size = aoeDef?.size || 20;
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
                                <span>Aim {aoeDef?.shape.toUpperCase() || 'AoE'} ({aoeDef?.size || 20} FT) on Grid</span>
                            </Button>
                        )}

                        <Button
                            type="button"
                            onClick={handleExecuteCast}
                            disabled={!hasSlotsRemaining || isCasting || (isMultiMissile ? assignedDartsCount === 0 : (isAoE ? selectedTargetIds.length === 0 : !selectedTargetId))}
                            className={`h-9 px-5 font-cinzel font-bold text-xs uppercase tracking-wider rounded transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${
                                !hasSlotsRemaining || isCasting || (isMultiMissile ? assignedDartsCount === 0 : (isAoE ? selectedTargetIds.length === 0 : !selectedTargetId))
                                    ? "bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed"
                                    : "bg-gradient-to-r from-[#c5a059] to-[#d6b16a] hover:from-[#d6b16a] hover:to-[#e5c27d] text-[#0c0d12] shadow-[0_0_15px_rgba(197,160,89,0.35)]"
                            }`}
                        >
                            {isCasting ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    <span>Invoking...</span>
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
