"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CombatParticipant, CharacterSpell } from "@/lib/types/combat";

interface ActionDockProps {
    currentParticipant?: CombatParticipant | null;
    targetId: string;
    isEnemyTurn: boolean;
    gauntletRunId: number | null;
    isAttacking: boolean;
    currentIsIncapacitated: boolean;
    onAttack: (attackName: string, attackBonus: number, options?: { advantage?: boolean; disadvantage?: boolean; dm_override?: boolean; inspiration?: boolean }) => void;
    // Weapon & Spell data
    characterWeapons: Array<{
        name: string;
        bonus: number;
        damage: string;
        damageType?: string;
        abilityMod: number;
        properties: string[];
    }>;
    characterSpells: Map<number, CharacterSpell[]>;
    charData: any;
    getSpellSlots: (level: number) => { total: number; used: number; remaining: number };
    onSelectSpell?: (spell: CharacterSpell) => void;
    // Monster actions (practice mode)
    enemyAttacks: Array<{ name: string; bonus: number; damage: string; type?: string; description?: string }>;
    // Test mode damage/healing
    damageAmount: string;
    setDamageAmount: (v: string) => void;
    healAmount: string;
    setHealAmount: (v: string) => void;
    onApplyDamage: () => void;
    onApplyHealing: () => void;
    allParticipants?: CombatParticipant[];
    onUseItem?: (itemName: string, targetId?: number) => Promise<void>;
    onUseFeature?: (featureName: string, amount?: number, targetId?: number, curePoison?: boolean, extraData?: Record<string, any>) => Promise<void>;
    onForceAiTurn?: () => void;
    onNextTurn?: () => void;
    onDash?: (bonusAction?: boolean) => Promise<void>;
    onDisengage?: (bonusAction?: boolean) => Promise<void>;
    onDodge?: (bonusAction?: boolean) => Promise<void>;
}

function getConditionNames(p?: CombatParticipant | null): string[] {
    if (!p || !p.conditions) return [];
    return p.conditions.map((c: any) => (typeof c === 'string' ? c : c.name || '')).map(s => s.toLowerCase());
}

export function computeRollPrediction(
    attacker?: CombatParticipant | null,
    target?: CombatParticipant | null,
    isMelee: boolean = true,
    useInspiration: boolean = false,
    allParticipants: CombatParticipant[] = []
): { state: 'normal' | 'advantage' | 'disadvantage' | 'canceled'; advReasons: string[]; disadvReasons: string[] } {
    const advReasons: string[] = [];
    const disadvReasons: string[] = [];

    const atkConds = getConditionNames(attacker);
    const tgtConds = getConditionNames(target);

    // Flanking check for melee attacks (5e rules)
    if (isMelee && attacker && target && allParticipants && allParticipants.length > 0) {
        const allies = allParticipants.filter(p =>
            p.participant_type === attacker.participant_type &&
            p.id !== attacker.id &&
            p.is_active &&
            p.current_hp > 0
        );
        const activeAllies = allies.filter(a => {
            const conds = getConditionNames(a);
            return !conds.some(c => ['incapacitated', 'paralyzed', 'petrified', 'stunned', 'unconscious'].includes(c));
        });
        if (activeAllies.length > 0) {
            advReasons.push('Flanking');
        }
    }

    // Attacker conditions
    if (atkConds.includes('blinded')) disadvReasons.push('Attacker Blinded');
    if (atkConds.includes('poisoned')) disadvReasons.push('Attacker Poisoned');
    if (atkConds.includes('frightened')) disadvReasons.push('Attacker Frightened');
    if (atkConds.includes('restrained')) disadvReasons.push('Attacker Restrained');
    if (atkConds.includes('prone')) disadvReasons.push('Attacker Prone');
    if (atkConds.includes('invisible')) advReasons.push('Attacker Invisible');

    // Attacker features (Reckless Attack grants advantage on melee attacks)
    if (attacker?.reckless_attack_active && isMelee) {
        advReasons.push('Reckless Attack');
    }

    // Target conditions
    for (const c of ['blinded', 'paralyzed', 'restrained', 'stunned', 'unconscious']) {
        if (tgtConds.includes(c)) {
            advReasons.push(`Target ${c.charAt(0).toUpperCase() + c.slice(1)}`);
            break;
        }
    }
    if (tgtConds.includes('prone')) {
        if (isMelee) {
            advReasons.push('Target Prone (Melee Advantage)');
        } else {
            disadvReasons.push('Target Prone (Ranged Disadvantage)');
        }
    }
    if (tgtConds.includes('invisible')) {
        disadvReasons.push('Target Invisible');
    }
    if (tgtConds.includes('dodging')) {
        disadvReasons.push('Target Dodging');
    }

    // Target features (Attacking a reckless creature grants advantage)
    if (target?.reckless_attack_active) {
        advReasons.push('Target is Reckless');
    }

    // Heroic Inspiration
    if (useInspiration) {
        advReasons.push('Heroic Inspiration');
    }

    let state: 'normal' | 'advantage' | 'disadvantage' | 'canceled' = 'normal';
    if (advReasons.length > 0 && disadvReasons.length > 0) {
        state = 'canceled';
    } else if (advReasons.length > 0) {
        state = 'advantage';
    } else if (disadvReasons.length > 0) {
        state = 'disadvantage';
    }

    return { state, advReasons, disadvReasons };
}

export function ActionDock({
    currentParticipant,
    targetId,
    isEnemyTurn,
    gauntletRunId,
    isAttacking,
    currentIsIncapacitated,
    onAttack,
    characterWeapons,
    characterSpells,
    charData,
    getSpellSlots,
    onSelectSpell,
    enemyAttacks,
    damageAmount,
    setDamageAmount,
    healAmount,
    setHealAmount,
    onApplyDamage,
    onApplyHealing,
    allParticipants = [],
    onUseItem,
    onUseFeature,
    onForceAiTurn,
    onNextTurn,
    onDash,
    onDisengage,
    onDodge,
}: ActionDockProps) {
    const [activeTab, setActiveTab] = useState<'weapons' | 'spells' | 'features' | 'maneuvers' | 'consumables' | 'test'>('weapons');
    const [selectedSpellLevel, setSelectedSpellLevel] = useState<number | null>(null);

    // Feature state (Lay on Hands, etc.)
    const [lohAmount, setLohAmount] = useState<number>(5);
    const [lohTargetId, setLohTargetId] = useState<number | null>(null);
    const [supplyTargetId, setSupplyTargetId] = useState<number | null>(null);
    const [isOperating, setIsOperating] = useState(false);
    const [useInspiration, setUseInspiration] = useState<boolean>(false);
    const [dmOverrideMode, setDmOverrideMode] = useState<'auto' | 'advantage' | 'normal' | 'disadvantage'>('auto');

    // If it's an enemy turn in Gauntlet, display the Autonomous AI indicator card with interactive overrides
    if (isEnemyTurn && gauntletRunId) {
        return (
            <div className="w-full bg-[#10121a]/95 border-t border-red-900/50 backdrop-blur-md px-6 py-3 shadow-[0_-4px_25px_rgba(0,0,0,0.6)] z-20">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 py-2 px-4 rounded-lg bg-[#181317] border border-red-800/40">
                    <div className="flex items-center gap-3">
                        <span className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        <div>
                            <h4 className="font-cinzel text-sm sm:text-base font-bold text-red-200">
                                {currentParticipant?.name} is Acting Autonomously...
                            </h4>
                            <p className="text-[11px] text-slate-400 font-lora italic">
                                Evaluating tactical role, target vulnerabilities, and strikes independently.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {onForceAiTurn && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onForceAiTurn}
                                className="bg-red-950/60 hover:bg-red-900/80 text-red-200 border-red-700/60 text-xs font-cinzel h-8 px-3 cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                            >
                                ⚡ Strike Now
                            </Button>
                        )}
                        {onNextTurn && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onNextTurn}
                                className="text-slate-400 hover:text-slate-200 text-xs font-lora h-8 px-2.5 cursor-pointer hover:bg-slate-800/50"
                            >
                                Skip Turn →
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const hasAttacksLeft = currentParticipant ? (currentParticipant.attacks_remaining > 0 && !currentParticipant.action_used) : false;
    const isActionDisabled = !targetId || isAttacking || !hasAttacksLeft || currentIsIncapacitated;

    const charFeatures = charData?.features || [];
    const classLower = (charData?.character_class?.name || charData?.class_name || '').toLowerCase();
    const isPaladin = classLower === 'paladin' || charFeatures.some((f: any) => f.name.toLowerCase() === 'lay on hands') || !!currentParticipant?.is_paladin;
    const isFighter = classLower === 'fighter' || charFeatures.some((f: any) => f.name.toLowerCase() === 'second wind') || !!currentParticipant?.is_fighter;
    const isBarbarian = classLower === 'barbarian' || charFeatures.some((f: any) => f.name.toLowerCase().includes('rage')) || !!currentParticipant?.is_barbarian;
    const isRogue = classLower === 'rogue' || charFeatures.some((f: any) => f.name.toLowerCase().includes('sneak attack') || f.name.toLowerCase().includes('cunning action')) || !!currentParticipant?.is_rogue;

    const isRaging = !!currentParticipant?.is_raging;
    const maxRageUses = currentParticipant?.max_rage_uses ?? 2;
    const rageUses = currentParticipant?.rage_uses_remaining ?? maxRageUses;
    const recklessActive = !!currentParticipant?.reckless_attack_active;
    const canReckless = !!currentParticipant?.has_reckless_attack || (isBarbarian && (charData?.level || 1) >= 2);

    const actionSurgeUsed = !!currentParticipant?.action_surge_used || !!currentParticipant?.feature_uses?.action_surge_used;
    const canActionSurge = isFighter && (currentParticipant?.action_surge_available ?? (!actionSurgeUsed && (charData?.level || 1) >= 2));
    const secondWindUsed = !!currentParticipant?.second_wind_used || !!currentParticipant?.feature_uses?.second_wind_used;

    const canCunningAction = isRogue && ((charData?.level || 1) >= 2 || !!currentParticipant?.cunning_action_available);

    const baseSpeed = currentParticipant?.speed ?? 30;
    const movementUsed = currentParticipant?.movement_used ?? 0;
    const movementRemaining = currentParticipant?.movement_remaining ?? Math.max(0, baseSpeed - movementUsed);

    const paladinLevel = charData?.level || 1;
    const lohMax = currentParticipant?.max_lay_on_hands_pool ?? (paladinLevel * 5);
    const lohPool = currentParticipant?.lay_on_hands_pool ?? lohMax;

    const friendlyAllies = allParticipants?.filter(p =>
        p.participant_type === 'character' && (p.current_hp > 0 || (p.death_save_status?.failures ?? 0) < 3)
    ) || [];

    const inventoryPotions = (charData?.character_items || []).filter((ci: any) =>
        ci.item_details?.name?.toLowerCase().includes('potion') ||
        ci.item_details?.category === 'Consumable' ||
        ci.item_details?.category?.name === 'Consumable'
    );

    const targetParticipant = allParticipants?.find(p => p.id === parseInt(targetId));
    const rollPreview = computeRollPrediction(currentParticipant, targetParticipant, true, useInspiration, allParticipants);

    const getAttackOptions = (isMelee: boolean = true) => {
        if (activeTab === 'test' && !gauntletRunId && dmOverrideMode !== 'auto') {
            return {
                dm_override: true,
                advantage: dmOverrideMode === 'advantage',
                disadvantage: dmOverrideMode === 'disadvantage',
            };
        }
        const pred = computeRollPrediction(currentParticipant, targetParticipant, isMelee, useInspiration, allParticipants);
        const opts = {
            dm_override: false,
            inspiration: useInspiration,
            advantage: pred.state === 'advantage',
            disadvantage: pred.state === 'disadvantage',
        };
        if (useInspiration) {
            setUseInspiration(false);
        }
        return opts;
    };

    return (
        <div className="w-full bg-[#10121a]/98 border-t border-[#c5a059]/30 backdrop-blur-md px-4 py-2.5 shadow-[0_-4px_25px_rgba(0,0,0,0.6)] z-20 flex flex-col gap-2">
            {/* Top Row: Action Category Tabs + Resource Status Pips */}
            <div className="flex items-center justify-between gap-2 border-b border-[#c5a059]/15 pb-2 flex-wrap">
                {/* Category Selector Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto font-lora">
                    <button
                        onClick={() => setActiveTab('weapons')}
                        className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'weapons'
                                ? 'bg-[#c5a059] text-[#0c0d12] shadow-[0_0_12px_rgba(197,160,89,0.35)]'
                                : 'bg-[#151722] text-[#d1cdb8]/70 hover:text-white hover:bg-[#1e2233]'
                        }`}
                    >
                        <span>⚔️</span>
                        <span>{isEnemyTurn ? 'Monster Actions' : 'Weapons'}</span>
                        {!isEnemyTurn && characterWeapons.length > 0 && (
                            <span className="text-[10px] opacity-80">({characterWeapons.length})</span>
                        )}
                    </button>

                    {!isEnemyTurn && characterSpells.size > 0 && (
                        <button
                            onClick={() => setActiveTab('spells')}
                            className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'spells'
                                    ? 'bg-[#c5a059] text-[#0c0d12] shadow-[0_0_12px_rgba(197,160,89,0.35)]'
                                    : 'bg-[#151722] text-[#d1cdb8]/70 hover:text-white hover:bg-[#1e2233]'
                            }`}
                        >
                            <span>✨</span>
                            <span>Spells</span>
                            {charData?.stats?.spell_save_dc && (
                                <span className="text-[10px] opacity-80">(DC {charData.stats.spell_save_dc})</span>
                            )}
                        </button>
                    )}

                    {!isEnemyTurn && (charFeatures.length > 0 || isPaladin || isFighter || isBarbarian || isRogue) && (
                        <button
                            onClick={() => setActiveTab('features')}
                            className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'features'
                                    ? isRaging
                                        ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.6)]'
                                        : 'bg-[#c5a059] text-[#0c0d12] shadow-[0_0_12px_rgba(197,160,89,0.35)]'
                                    : isRaging
                                        ? 'bg-rose-950/80 border border-rose-500/60 text-rose-300 animate-pulse'
                                        : 'bg-[#151722] text-[#d1cdb8]/70 hover:text-white hover:bg-[#1e2233]'
                            }`}
                        >
                            <span>{isRaging ? '🔥' : '🌟'}</span>
                            <span>Features</span>
                            {isRaging && (
                                <span className="text-[10px] font-fira-sans text-rose-100 font-bold bg-rose-900/90 px-1 py-0.5 rounded">
                                    RAGING
                                </span>
                            )}
                            {!isRaging && isBarbarian && (
                                <span className="text-[10px] font-fira-sans text-rose-300 font-bold">
                                    ({rageUses}/{maxRageUses >= 900 ? '∞' : maxRageUses})
                                </span>
                            )}
                            {isPaladin && (
                                <span className="text-[10px] font-fira-sans text-amber-300 font-bold">
                                    ({lohPool}/{lohMax} HP)
                                </span>
                            )}
                        </button>
                    )}

                    <button
                        onClick={() => setActiveTab('maneuvers')}
                        className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'maneuvers'
                                ? 'bg-[#c5a059] text-[#0c0d12] shadow-[0_0_12px_rgba(197,160,89,0.35)]'
                                : 'bg-[#151722] text-[#d1cdb8]/70 hover:text-white hover:bg-[#1e2233]'
                        }`}
                    >
                        <span>🛡️</span>
                        <span>Maneuvers</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('consumables')}
                        className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'consumables'
                                ? 'bg-[#c5a059] text-[#0c0d12] shadow-[0_0_12px_rgba(197,160,89,0.35)]'
                                : 'bg-[#151722] text-[#d1cdb8]/70 hover:text-white hover:bg-[#1e2233]'
                        }`}
                    >
                        <span>🧪</span>
                        <span>Supplies</span>
                    </button>

                    {!gauntletRunId && (
                        <button
                            onClick={() => setActiveTab('test')}
                            className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                                activeTab === 'test'
                                    ? 'bg-amber-600 text-black shadow-[0_0_10px_rgba(217,119,6,0.35)]'
                                    : 'bg-[#151722] text-amber-300/60 hover:text-amber-300 hover:bg-[#1e2233]'
                            }`}
                        >
                            <span>💊</span>
                            <span>Test Mode</span>
                        </button>
                    )}
                </div>

                {/* Middle: 5e Rules-Based Roll Indicator & Inspiration / DM Override */}
                {activeTab === 'test' ? (
                    <div className="flex items-center gap-1 bg-[#16120f] px-2 py-0.5 rounded-md border border-amber-600/40 shadow-inner">
                        <span className="text-[10px] font-cinzel font-bold text-amber-400 mr-1">
                            🧪 DM OVERRIDE:
                        </span>
                        <button
                            type="button"
                            onClick={() => setDmOverrideMode('auto')}
                            className={`px-1.5 py-0.5 text-[10px] rounded transition-all cursor-pointer ${
                                dmOverrideMode === 'auto'
                                    ? 'bg-amber-600 text-stone-950 font-bold'
                                    : 'text-stone-400 hover:text-stone-200'
                            }`}
                        >
                            AUTO
                        </button>
                        <button
                            type="button"
                            onClick={() => setDmOverrideMode('advantage')}
                            className={`px-1.5 py-0.5 text-[10px] rounded transition-all cursor-pointer ${
                                dmOverrideMode === 'advantage'
                                    ? 'bg-emerald-600 text-white font-bold shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                    : 'text-emerald-400/60 hover:text-emerald-300'
                            }`}
                        >
                            ADV
                        </button>
                        <button
                            type="button"
                            onClick={() => setDmOverrideMode('normal')}
                            className={`px-1.5 py-0.5 text-[10px] rounded transition-all cursor-pointer ${
                                dmOverrideMode === 'normal'
                                    ? 'bg-stone-600 text-white font-bold'
                                    : 'text-stone-400 hover:text-stone-200'
                            }`}
                        >
                            NORM
                        </button>
                        <button
                            type="button"
                            onClick={() => setDmOverrideMode('disadvantage')}
                            className={`px-1.5 py-0.5 text-[10px] rounded transition-all cursor-pointer ${
                                dmOverrideMode === 'disadvantage'
                                    ? 'bg-purple-600 text-white font-bold shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                                    : 'text-purple-400/60 hover:text-purple-300'
                            }`}
                        >
                            DIS
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 bg-[#0b0d14] px-2 py-0.5 rounded-md border border-[#c5a059]/25 shadow-inner">
                        <span className="text-[10px] font-cinzel font-bold text-[#c5a059]/70 mr-0.5 hidden sm:inline">
                            ROLL:
                        </span>
                        {rollPreview.state === 'advantage' && (
                            <div
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold text-[10px] shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                title={`Advantage: ${rollPreview.advReasons.join(', ')}`}
                            >
                                <span>✨</span>
                                <span>ADVANTAGE</span>
                                {rollPreview.advReasons.length > 0 && (
                                    <span className="text-[9px] text-emerald-400/80 font-normal font-sans hidden md:inline">
                                        ({rollPreview.advReasons[0]})
                                    </span>
                                )}
                            </div>
                        )}
                        {rollPreview.state === 'disadvantage' && (
                            <div
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/60 text-purple-300 font-bold text-[10px] shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                                title={`Disadvantage: ${rollPreview.disadvReasons.join(', ')}`}
                            >
                                <span>⚠️</span>
                                <span>DISADVANTAGE</span>
                                {rollPreview.disadvReasons.length > 0 && (
                                    <span className="text-[9px] text-purple-400/80 font-normal font-sans hidden md:inline">
                                        ({rollPreview.disadvReasons[0]})
                                    </span>
                                )}
                            </div>
                        )}
                        {rollPreview.state === 'canceled' && (
                            <div
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/50 text-amber-300 font-bold text-[10px]"
                                title={`Canceled: Advantage (${rollPreview.advReasons.join(', ')}) & Disadvantage (${rollPreview.disadvReasons.join(', ')})`}
                            >
                                <span>⚖️</span>
                                <span>CANCELED</span>
                            </div>
                        )}
                        {rollPreview.state === 'normal' && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-stone-900 border border-stone-700/60 text-stone-300 font-semibold text-[10px]">
                                <span>⚔️</span>
                                <span>NORMAL (1d20)</span>
                            </div>
                        )}

                        {/* Heroic Inspiration Button */}
                        <button
                            type="button"
                            onClick={() => setUseInspiration(prev => !prev)}
                            title={useInspiration ? "Heroic Inspiration active (+Advantage)" : "Spend Heroic Inspiration for Advantage on this roll"}
                            className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer ${
                                useInspiration
                                    ? 'bg-amber-500 text-stone-950 shadow-[0_0_10px_rgba(245,158,11,0.6)] font-bold'
                                    : 'text-amber-400/70 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-500/30'
                            }`}
                        >
                            <span>⭐</span>
                            <span className="hidden sm:inline">Inspiration</span>
                        </button>
                    </div>
                )}

                {/* Right: 5e Resource Status Pips (Action, Bonus Action, Reaction) */}
                <div className="flex items-center gap-3 font-cinzel text-[11px] text-[#d1cdb8]/80">
                    <div className="flex items-center gap-1.5" title={hasAttacksLeft ? `${currentParticipant?.attacks_remaining} attack(s) available` : "Action used this turn"}>
                        <span className={`w-2.5 h-2.5 rounded-full ${hasAttacksLeft ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-stone-700'}`} />
                        <span className={hasAttacksLeft ? "text-emerald-300 font-semibold" : "text-stone-500 line-through"}>
                            Action ({currentParticipant?.attacks_remaining ?? 0})
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5" title={!currentParticipant?.bonus_action_used ? "Bonus Action available" : "Bonus Action used this turn"}>
                        <span className={`w-2.5 h-2.5 rounded-full ${!currentParticipant?.bonus_action_used ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-stone-700'}`} />
                        <span className={!currentParticipant?.bonus_action_used ? "text-amber-300 font-semibold" : "text-stone-500 line-through"}>
                            Bonus Action
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5" title={!currentParticipant?.reaction_used ? "Reaction available" : "Reaction expended this round"}>
                        <span className={`w-2.5 h-2.5 rounded-full ${!currentParticipant?.reaction_used ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' : 'bg-stone-700'}`} />
                        <span className={!currentParticipant?.reaction_used ? "text-blue-300 font-semibold" : "text-stone-500 line-through"}>
                            Reaction
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5" title={`Speed: ${baseSpeed} ft | Remaining: ${movementRemaining} ft`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${movementRemaining > 0 ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-stone-700'}`} />
                        <span className={movementRemaining > 0 ? "text-cyan-300 font-semibold" : "text-stone-500 line-through"}>
                            Move ({movementRemaining} ft)
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Content Area: Active Tab Content */}
            <div className="min-h-[85px] max-h-[120px] overflow-y-auto px-1 py-1">
                {/* 1. Weapons & Attacks Tab */}
                {activeTab === 'weapons' && (
                    <div>
                        {isEnemyTurn ? (
                            /* Practice Mode Enemy Actions */
                            currentParticipant?.enemy_actions && currentParticipant.enemy_actions.length > 0 ? (
                                <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                                    {currentParticipant.enemy_actions.map((act: any) => {
                                        const isRecharging = act.has_recharge && (currentParticipant.recharge_state?.[act.name] === false);
                                        const disabled = isActionDisabled || isRecharging;
                                        const isMelee = act.attack_type !== 'ranged_weapon';
                                        return (
                                            <button
                                                key={act.id}
                                                onClick={() => onAttack(act.name, act.attack_bonus || 0, getAttackOptions(isMelee))}
                                                disabled={disabled}
                                                className={`flex-shrink-0 px-3 py-2 rounded border text-left transition-all duration-150 w-48 ${
                                                    disabled
                                                        ? 'bg-[#181a21]/40 border-slate-800 opacity-40 cursor-not-allowed'
                                                        : 'bg-[#1a1518] border-red-800/60 hover:border-red-500 hover:bg-[#28151b] cursor-pointer'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-cinzel text-xs font-bold text-red-200 truncate">{act.name}</span>
                                                    {act.has_recharge && (
                                                        <span className="text-[9px] px-1 rounded bg-red-950 text-red-300 font-fira-sans">
                                                            {isRecharging ? 'Recharging' : '✦ Ready'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1 text-[10px] font-fira-sans text-slate-300">
                                                    {act.attack_bonus != null && (
                                                        <span className="text-red-300 font-bold">+{act.attack_bonus} to hit</span>
                                                    )}
                                                    {act.damage_rolls?.length > 0 && (
                                                        <span className="text-[#d1cdb8]/70">{act.damage_rolls[0].formula}</span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : enemyAttacks.length > 0 ? (
                                <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                                    {enemyAttacks.map((atk, i) => {
                                        const isMelee = !atk.type?.includes('ranged');
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => onAttack(atk.name, atk.bonus, getAttackOptions(isMelee))}
                                                disabled={isActionDisabled}
                                                className={`flex-shrink-0 px-3 py-2 rounded border text-left transition-all duration-150 w-44 ${
                                                    isActionDisabled
                                                        ? 'bg-[#181a21]/40 border-slate-800 opacity-40 cursor-not-allowed'
                                                        : 'bg-[#1a1518] border-red-800/60 hover:border-red-500 hover:bg-[#28151b] cursor-pointer'
                                                }`}
                                            >
                                                <p className="font-cinzel text-xs font-bold text-red-200 truncate">{atk.name}</p>
                                                <p className="text-[10px] font-fira-sans text-red-300 mt-1">+{atk.bonus} to hit • {atk.damage}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-[#d1cdb8]/50 italic py-2 font-lora">No monster actions available</p>
                            )
                        ) : (
                            /* Player Character Weapons */
                            characterWeapons.length > 0 ? (
                                <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                                    {characterWeapons.map((wp, idx) => {
                                        const isMelee = !wp.properties?.some((p: string) => p.toLowerCase().includes('ranged'));
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => onAttack(wp.name, wp.bonus, getAttackOptions(isMelee))}
                                                disabled={isActionDisabled}
                                                className={`flex-shrink-0 px-3.5 py-2 rounded border text-left transition-all duration-150 w-52 ${
                                                    isActionDisabled
                                                        ? 'bg-[#181a21]/40 border-slate-800 opacity-40 cursor-not-allowed'
                                                        : 'bg-[#181a24] border-[#c5a059]/40 hover:border-[#c5a059] hover:bg-[#222536] hover:shadow-[0_0_15px_rgba(197,160,89,0.2)] cursor-pointer'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-cinzel text-xs font-bold text-[#e0bc75] truncate">{wp.name}</span>
                                                    <span className="text-[10px] font-fira-sans font-bold text-emerald-400">
                                                        +{wp.bonus} to hit
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-[11px] font-fira-sans">
                                                    <span className="text-red-300 font-bold">{wp.damage} + {wp.abilityMod}</span>
                                                    {wp.damageType && (
                                                        <span className="text-[10px] text-[#d1cdb8]/60 font-lora italic">{wp.damageType}</span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-3 text-xs text-[#d1cdb8]/60 font-lora">
                                    No weapons equipped in inventory. Unarmed strikes default to 1 + STR mod.
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* 2. Spells Tab */}
                {activeTab === 'spells' && !isEnemyTurn && (
                    <div className="flex items-center gap-3 overflow-x-auto py-1">
                        {Array.from(characterSpells.entries())
                            .sort(([a], [b]) => a - b)
                            .map(([level, spells]) => {
                                const slots = level > 0 ? getSpellSlots(level) : null;
                                return (
                                    <div key={level} className="flex-shrink-0 flex items-center gap-2 border-r border-[#c5a059]/20 pr-3 last:border-r-0">
                                        <div className="text-[10px] font-cinzel font-bold text-[#c5a059] flex flex-col items-center">
                                            <span>{level === 0 ? 'Cantrips' : `Lvl ${level}`}</span>
                                            {slots && (
                                                <span className="text-[9px] font-fira-sans text-emerald-400">
                                                    {slots.remaining}/{slots.total}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {spells.map((spell) => {
                                                const noSlots = slots !== null && slots.remaining <= 0;
                                                const disabled = !hasAttacksLeft || currentIsIncapacitated || isAttacking || (noSlots && !spell.is_ritual);
                                                return (
                                                    <button
                                                        key={spell.id}
                                                        onClick={() => {
                                                            if (onSelectSpell) {
                                                                onSelectSpell(spell);
                                                            } else {
                                                                onAttack(spell.name, charData?.stats?.spell_attack_bonus || 0, getAttackOptions(false));
                                                            }
                                                        }}
                                                        disabled={disabled}
                                                        className={`px-3 py-1.5 rounded border text-xs font-lora font-medium transition-all flex items-center gap-1.5 ${
                                                            disabled
                                                                ? 'bg-[#141622]/40 border-slate-800 opacity-40 cursor-not-allowed'
                                                                : 'bg-[#181a28] border-purple-800/60 hover:border-purple-400 text-purple-200 hover:bg-[#251f33] shadow-[0_0_10px_rgba(168,85,247,0.15)] cursor-pointer'
                                                        }`}
                                                    >
                                                        <span>✨</span>
                                                        <span>{spell.name}</span>
                                                        {spell.is_ritual && (
                                                            <span className="text-[9px] px-1 rounded bg-blue-950 text-blue-300 font-mono">
                                                                R
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}

                {/* 3. Features & Traits Tab (Lay on Hands, Second Wind, etc.) */}
                {activeTab === 'features' && !isEnemyTurn && (
                    <div className="flex items-center gap-3 overflow-x-auto py-1 font-lora">
                        {/* Paladin: Lay on Hands */}
                        {isPaladin && (
                            <div className="flex-shrink-0 flex items-center gap-3 p-2 rounded-lg bg-[#181a24] border border-[#c5a059]/50 shadow-[0_0_15px_rgba(197,160,89,0.15)]">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">✨</span>
                                        <span className="font-cinzel text-xs font-bold text-[#e0bc75]">Lay on Hands</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 font-fira-sans font-bold">
                                            {lohPool} / {lohMax} HP
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-[#d1cdb8]/60 italic font-lora">
                                        Action • Touch creature to restore HP or spend 5 HP to cure poison
                                    </span>
                                </div>

                                {/* Target Selector */}
                                <div className="flex items-center gap-1.5 bg-[#0c0d12] px-2 py-1 rounded border border-[#c5a059]/20 text-xs">
                                    <span className="text-[10px] text-[#d1cdb8]/60 uppercase font-cinzel">Target:</span>
                                    <select
                                        value={lohTargetId ?? currentParticipant?.id ?? ''}
                                        onChange={(e) => setLohTargetId(parseInt(e.target.value))}
                                        className="bg-transparent text-[#e0bc75] text-xs font-lora outline-none cursor-pointer"
                                    >
                                        <option value={currentParticipant?.id} className="bg-[#181a24] text-white">
                                            Self ({currentParticipant?.name})
                                        </option>
                                        {friendlyAllies
                                            .filter(a => a.id !== currentParticipant?.id)
                                            .map(a => (
                                                <option key={a.id} value={a.id} className="bg-[#181a24] text-white">
                                                    {a.name} ({a.current_hp}/{a.max_hp} HP)
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {/* Amount Selector */}
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="number"
                                        min={1}
                                        max={Math.max(1, lohPool)}
                                        value={lohAmount}
                                        onChange={(e) => setLohAmount(Math.max(1, Math.min(lohPool, parseInt(e.target.value) || 1)))}
                                        className="w-14 h-7 bg-[#0c0d12] border border-[#c5a059]/40 rounded text-center text-xs font-fira-sans text-[#e0bc75] outline-none"
                                    />
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setLohAmount(1)}
                                            className="px-1.5 py-0.5 rounded bg-[#10121a] hover:bg-[#202436] text-[10px] text-[#d1cdb8]/80 border border-slate-700 cursor-pointer"
                                        >
                                            1
                                        </button>
                                        {lohPool >= 5 && (
                                            <button
                                                type="button"
                                                onClick={() => setLohAmount(5)}
                                                className="px-1.5 py-0.5 rounded bg-[#10121a] hover:bg-[#202436] text-[10px] text-[#d1cdb8]/80 border border-slate-700 cursor-pointer"
                                            >
                                                5
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setLohAmount(lohPool)}
                                            className="px-1.5 py-0.5 rounded bg-[#10121a] hover:bg-[#202436] text-[10px] text-amber-300 font-bold border border-amber-800/40 cursor-pointer"
                                        >
                                            Max
                                        </button>
                                    </div>
                                </div>

                                {/* Action Execution Buttons */}
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        size="sm"
                                        disabled={!hasAttacksLeft || currentIsIncapacitated || isAttacking || isOperating || lohPool <= 0}
                                        onClick={async () => {
                                            if (!onUseFeature) return;
                                            setIsOperating(true);
                                            try {
                                                await onUseFeature('Lay on Hands', lohAmount, lohTargetId || currentParticipant?.id, false);
                                            } finally {
                                                setIsOperating(false);
                                            }
                                        }}
                                        className="h-7 px-3 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-cinzel font-bold text-xs shadow-[0_0_10px_rgba(197,160,89,0.3)] cursor-pointer"
                                    >
                                        Heal Touch
                                    </Button>

                                    {lohPool >= 5 && (
                                        <Button
                                            size="sm"
                                            disabled={!hasAttacksLeft || currentIsIncapacitated || isAttacking || isOperating}
                                            onClick={async () => {
                                                if (!onUseFeature) return;
                                                setIsOperating(true);
                                                try {
                                                    await onUseFeature('Lay on Hands', 5, lohTargetId || currentParticipant?.id, true);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="h-7 px-2.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/50 text-[11px] font-medium cursor-pointer"
                                        >
                                            Cure Poison (5 HP)
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Barbarian: Rage */}
                        {isBarbarian && (
                            <div className={`flex-shrink-0 flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                                isRaging
                                    ? 'bg-gradient-to-r from-rose-950/80 via-[#221015] to-[#181a24] border-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.3)]'
                                    : 'bg-[#181a24] border-rose-800/40 hover:border-rose-600/60'
                            }`}>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">🔥</span>
                                        <span className="font-cinzel text-xs font-bold text-rose-200">
                                            {isRaging ? 'Active Rage' : 'Rage'}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 font-fira-sans font-semibold border border-rose-800/50">
                                            Bonus Action
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10121a] text-amber-300 font-fira-sans font-bold border border-slate-700">
                                            {maxRageUses >= 900 ? 'Uses: ∞' : `Uses: ${rageUses}/${maxRageUses}`}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-0.5">
                                        {isRaging
                                            ? `Resist Bludgeoning, Piercing, Slashing • +${currentParticipant?.rage_damage_bonus || 2} melee STR dmg`
                                            : `Halve physical damage • +${currentParticipant?.rage_damage_bonus || 2} melee STR dmg`}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    disabled={
                                        currentIsIncapacitated || isAttacking || isOperating ||
                                        (!isRaging && (currentParticipant?.bonus_action_used || rageUses <= 0))
                                    }
                                    onClick={async () => {
                                        if (!onUseFeature) return;
                                        setIsOperating(true);
                                        try {
                                            await onUseFeature('Rage', 0, currentParticipant?.id, false, { end_rage: isRaging });
                                        } finally {
                                            setIsOperating(false);
                                        }
                                    }}
                                    className={`h-7 px-3 font-cinzel font-bold text-xs cursor-pointer ${
                                        isRaging
                                            ? 'bg-zinc-800 hover:bg-zinc-700 text-rose-200 border border-rose-500/40 shadow-sm'
                                            : 'bg-rose-700 hover:bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]'
                                    }`}
                                >
                                    {isRaging ? 'End Rage' : 'Enter Rage'}
                                </Button>
                            </div>
                        )}

                        {/* Barbarian: Reckless Attack */}
                        {canReckless && (
                            <div className={`flex-shrink-0 flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                                recklessActive
                                    ? 'bg-gradient-to-r from-amber-950/70 via-[#241a10] to-[#181a24] border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                                    : 'bg-[#181a24] border-amber-700/40 hover:border-amber-500/60'
                            }`}>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">⚡</span>
                                        <span className="font-cinzel text-xs font-bold text-amber-200">Reckless Attack</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-fira-sans font-semibold border border-amber-800/50">
                                            On Turn
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-0.5">
                                        {recklessActive
                                            ? 'ACTIVE: You have Advantage on melee STR attacks. Attacks against you have Advantage.'
                                            : 'Advantage on melee STR attacks this turn; incoming attacks gain Advantage.'}
                                    </p>
                                </div>
                                {recklessActive ? (
                                    <span className="h-7 px-2.5 flex items-center bg-amber-950/80 border border-amber-500/60 text-amber-300 font-cinzel font-bold text-[11px] rounded">
                                        Active
                                    </span>
                                ) : (
                                    <Button
                                        size="sm"
                                        disabled={currentIsIncapacitated || isAttacking || isOperating}
                                        onClick={async () => {
                                            if (!onUseFeature) return;
                                            setIsOperating(true);
                                            try {
                                                await onUseFeature('Reckless Attack', 0, currentParticipant?.id);
                                            } finally {
                                                setIsOperating(false);
                                            }
                                        }}
                                        className="h-7 px-3 bg-amber-600 hover:bg-amber-500 text-black font-cinzel font-bold text-xs shadow-[0_0_10px_rgba(217,119,6,0.35)] cursor-pointer"
                                    >
                                        Go Reckless
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Fighter: Action Surge */}
                        {isFighter && (
                            <div className={`flex-shrink-0 flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                                !actionSurgeUsed
                                    ? 'bg-[#181a24] border-yellow-500/40 hover:border-yellow-400/60 shadow-[0_0_12px_rgba(234,179,8,0.12)]'
                                    : 'bg-[#12131b] border-slate-800 opacity-60'
                            }`}>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">⚡</span>
                                        <span className="font-cinzel text-xs font-bold text-yellow-200">Action Surge</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-950 text-yellow-300 font-fira-sans font-semibold border border-yellow-800/50">
                                            1/Rest
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-0.5">
                                        {actionSurgeUsed ? 'Used (regained after rest)' : 'Take 1 additional Action immediately this turn'}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    disabled={currentIsIncapacitated || isAttacking || isOperating || actionSurgeUsed}
                                    onClick={async () => {
                                        if (!onUseFeature) return;
                                        setIsOperating(true);
                                        try {
                                            await onUseFeature('Action Surge', 0, currentParticipant?.id);
                                        } finally {
                                            setIsOperating(false);
                                        }
                                    }}
                                    className={`h-7 px-3 font-cinzel font-bold text-xs ${
                                        actionSurgeUsed
                                            ? 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                            : 'bg-yellow-600 hover:bg-yellow-500 text-black shadow-[0_0_12px_rgba(202,138,4,0.4)] cursor-pointer'
                                    }`}
                                >
                                    {actionSurgeUsed ? 'Used' : 'Surge Action'}
                                </Button>
                            </div>
                        )}

                        {/* Fighter: Second Wind */}
                        {isFighter && (
                            <div className="flex-shrink-0 flex items-center gap-3 p-2 rounded-lg bg-[#181a24] border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">🛡️</span>
                                        <span className="font-cinzel text-xs font-bold text-amber-200">Second Wind</span>
                                        <span className="text-[10px] px-1 rounded bg-amber-950 text-amber-300 font-fira-sans">Bonus Action</span>
                                    </div>
                                    <p className="text-[10px] text-[#d1cdb8]/60 font-lora italic">
                                        {secondWindUsed ? 'Used (regained after rest)' : `Regain 1d10 + ${charData?.level || 1} HP (1/rest)`}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    disabled={currentIsIncapacitated || isAttacking || isOperating || currentParticipant?.bonus_action_used || secondWindUsed}
                                    onClick={async () => {
                                        if (!onUseFeature) return;
                                        setIsOperating(true);
                                        try {
                                            await onUseFeature('Second Wind', 0, currentParticipant?.id);
                                        } finally {
                                            setIsOperating(false);
                                        }
                                    }}
                                    className={`h-7 px-3 font-cinzel font-bold text-xs ${
                                        secondWindUsed
                                            ? 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                            : 'bg-amber-700 hover:bg-amber-600 text-white cursor-pointer'
                                    }`}
                                >
                                    {secondWindUsed ? 'Used' : 'Catch Breath'}
                                </Button>
                            </div>
                        )}

                        {/* Rogue: Cunning Action */}
                        {canCunningAction && (
                            <div className="flex-shrink-0 flex items-center gap-3 p-2.5 rounded-lg bg-[#181a24] border border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.15)]">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">🗡️</span>
                                        <span className="font-cinzel text-xs font-bold text-violet-200">Cunning Action</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 font-fira-sans font-semibold border border-violet-800/50">
                                            Bonus Action
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-0.5">
                                        Dash, Disengage, or Hide as a Bonus Action
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {(['dash', 'disengage', 'hide'] as const).map(sub => (
                                        <button
                                            key={sub}
                                            disabled={currentIsIncapacitated || isAttacking || isOperating || currentParticipant?.bonus_action_used}
                                            onClick={async () => {
                                                setIsOperating(true);
                                                try {
                                                    if (sub === 'dash' && onDash) {
                                                        await onDash(true);
                                                    } else if (sub === 'disengage' && onDisengage) {
                                                        await onDisengage(true);
                                                    } else if (onUseFeature) {
                                                        await onUseFeature('Cunning Action', 0, currentParticipant?.id, false, { subaction: sub });
                                                    }
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="h-7 px-2 rounded bg-[#10121a] hover:bg-violet-900/50 text-violet-200 border border-violet-700/50 text-[10px] font-cinzel font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {sub}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Other Class / Racial Features Cards */}
                        {charFeatures
                            .filter((f: any) => !['lay on hands', 'second wind', 'rage', 'reckless attack', 'action surge', 'cunning action'].includes(f.name?.toLowerCase()))
                            .slice(0, 4)
                            .map((f: any) => (
                                <div key={f.id} className="flex-shrink-0 max-w-[220px] p-2 rounded border border-slate-800 bg-[#141620] text-left">
                                    <div className="flex items-center justify-between">
                                        <span className="font-cinzel text-xs font-semibold text-[#d1cdb8] truncate">{f.name}</span>
                                        <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-300 font-fira-sans">{f.source || 'Class'}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-lora line-clamp-2 mt-0.5 leading-snug">{f.description}</p>
                                </div>
                            ))}
                    </div>
                )}

                {/* 4. Maneuvers Tab */}
                {activeTab === 'maneuvers' && (
                    <div className="flex items-center gap-2.5 py-1 font-lora text-xs">
                        <button
                            disabled={currentIsIncapacitated || isAttacking || isOperating || currentParticipant?.action_used || currentParticipant?.dashed_this_turn}
                            onClick={async () => {
                                if (!onDash) return;
                                setIsOperating(true);
                                try {
                                    await onDash(false);
                                } finally {
                                    setIsOperating(false);
                                }
                            }}
                            className="px-3 py-2 rounded bg-[#181a24] border border-blue-800/50 hover:border-blue-400 text-blue-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <span>🏃</span>
                            <span className="font-semibold">Dash</span>
                            <span className="text-[10px] text-blue-300/70">(Action • +{baseSpeed} ft)</span>
                        </button>
                        <button
                            disabled={currentIsIncapacitated || isAttacking || isOperating || currentParticipant?.action_used || currentParticipant?.is_disengaged}
                            onClick={async () => {
                                if (!onDisengage) return;
                                setIsOperating(true);
                                try {
                                    await onDisengage(false);
                                } finally {
                                    setIsOperating(false);
                                }
                            }}
                            className="px-3 py-2 rounded bg-[#181a24] border border-emerald-800/50 hover:border-emerald-400 text-emerald-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <span>🕊️</span>
                            <span className="font-semibold">Disengage</span>
                            <span className="text-[10px] text-emerald-300/70">(Action • No OA)</span>
                        </button>
                        <button
                            disabled={currentIsIncapacitated || isAttacking || isOperating || currentParticipant?.action_used || currentParticipant?.is_dodging}
                            onClick={async () => {
                                if (!onDodge) return;
                                setIsOperating(true);
                                try {
                                    await onDodge(false);
                                } finally {
                                    setIsOperating(false);
                                }
                            }}
                            className="px-3 py-2 rounded bg-[#181a24] border border-amber-800/50 hover:border-amber-400 text-amber-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <span>🛡️</span>
                            <span className="font-semibold">Dodge</span>
                            <span className="text-[10px] text-amber-300/70">(Action • Disadvantage)</span>
                        </button>
                        <button
                            onClick={() => alert("Hide action taken: Make a Dexterity (Stealth) check.")}
                            className="px-3 py-2 rounded bg-[#181a24] border border-slate-800 hover:border-slate-500 text-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                            <span>👤</span>
                            <span className="font-semibold">Hide</span>
                            <span className="text-[10px] text-slate-400">(Stealth)</span>
                        </button>
                    </div>
                )}

                {/* 5. Consumables / Supplies Tab */}
                {activeTab === 'consumables' && (
                    <div className="flex items-center gap-3 overflow-x-auto py-1 font-lora text-xs">
                        {/* Target Recipient Selector (Strictly friendly characters only) */}
                        <div className="flex items-center gap-1.5 bg-[#141622] px-2.5 py-1.5 rounded border border-[#c5a059]/30 flex-shrink-0">
                            <span className="text-[10px] font-cinzel font-bold text-[#c5a059] uppercase">Recipient:</span>
                            <select
                                value={supplyTargetId ?? currentParticipant?.id ?? ''}
                                onChange={(e) => setSupplyTargetId(parseInt(e.target.value))}
                                className="bg-transparent text-[#e0bc75] text-xs font-lora outline-none cursor-pointer"
                            >
                                <option value={currentParticipant?.id} className="bg-[#181a24] text-white">
                                    Self ({currentParticipant?.name})
                                </option>
                                {friendlyAllies
                                    .filter(a => a.id !== currentParticipant?.id)
                                    .map(a => (
                                        <option key={a.id} value={a.id} className="bg-[#181a24] text-white">
                                            Ally: {a.name} ({a.current_hp}/{a.max_hp} HP)
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Standard Potion of Healing */}
                        <div className="flex items-center gap-2 p-1.5 rounded border border-emerald-500/50 bg-emerald-950/40 flex-shrink-0">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm">🧪</span>
                                    <span className="font-cinzel text-xs font-bold text-emerald-200">Potion of Healing</span>
                                    <span className="text-[10px] text-emerald-300 font-fira-sans font-semibold">(2d4 + 2 HP)</span>
                                </div>
                                <span className="text-[10px] text-emerald-400/70 italic font-lora">
                                    Action • {supplyTargetId && supplyTargetId !== currentParticipant?.id ? 'Administer to ally' : 'Drink (Self)'}
                                </span>
                            </div>

                            <Button
                                size="sm"
                                disabled={!hasAttacksLeft || currentIsIncapacitated || isAttacking || isOperating}
                                onClick={async () => {
                                    if (onUseItem) {
                                        setIsOperating(true);
                                        try {
                                            await onUseItem('Potion of Healing', supplyTargetId || currentParticipant?.id);
                                        } finally {
                                            setIsOperating(false);
                                        }
                                    } else {
                                        setHealAmount("7");
                                        onApplyHealing();
                                    }
                                }}
                                className="h-7 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-cinzel font-bold text-xs shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer"
                            >
                                {supplyTargetId && supplyTargetId !== currentParticipant?.id ? 'Administer' : 'Drink'}
                            </Button>
                        </div>

                        {/* Other Inventory Potions */}
                        {inventoryPotions
                            .filter((ci: any) => !ci.item_details?.name?.toLowerCase().includes('potion of healing') || ci.quantity > 1)
                            .map((ci: any) => (
                                <div key={ci.id} className="flex items-center gap-2 p-1.5 rounded border border-blue-500/40 bg-blue-950/30 flex-shrink-0">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm">🧪</span>
                                            <span className="font-cinzel text-xs font-bold text-blue-200">{ci.item_details?.name}</span>
                                            <span className="text-[10px] text-blue-300 font-fira-sans">x{ci.quantity}</span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        disabled={!hasAttacksLeft || currentIsIncapacitated || isAttacking || isOperating}
                                        onClick={async () => {
                                            if (onUseItem) {
                                                setIsOperating(true);
                                                try {
                                                    await onUseItem(ci.item_details?.name, supplyTargetId || currentParticipant?.id);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }
                                        }}
                                        className="h-7 px-2.5 bg-blue-800 hover:bg-blue-700 text-white font-cinzel font-bold text-xs cursor-pointer"
                                    >
                                        Use
                                    </Button>
                                </div>
                            ))}
                    </div>
                )}

                {/* 5. Test Mode (Only in Practice Combat) */}
                {activeTab === 'test' && !gauntletRunId && (
                    <div className="flex items-center gap-4 py-1">
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={damageAmount}
                                onChange={(e) => setDamageAmount(e.target.value)}
                                placeholder="Damage"
                                className="h-8 w-24 bg-[#0c0d12] border-red-900/60 text-xs font-fira-sans"
                            />
                            <Button
                                size="sm"
                                onClick={onApplyDamage}
                                disabled={!damageAmount || !targetId}
                                className="h-8 bg-red-950/70 hover:bg-red-900 border border-red-600 text-xs text-red-200"
                            >
                                Apply Damage
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={healAmount}
                                onChange={(e) => setHealAmount(e.target.value)}
                                placeholder="Healing"
                                className="h-8 w-24 bg-[#0c0d12] border-emerald-900/60 text-xs font-fira-sans"
                            />
                            <Button
                                size="sm"
                                onClick={onApplyHealing}
                                disabled={!healAmount || !targetId}
                                className="h-8 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600 text-xs text-emerald-200"
                            >
                                Apply Healing
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
