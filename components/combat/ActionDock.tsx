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
    onAttack: (attackName: string, attackBonus: number, options?: { advantage?: boolean; disadvantage?: boolean }) => void;
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
    onUseFeature?: (featureName: string, amount?: number, targetId?: number, curePoison?: boolean) => Promise<void>;
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
}: ActionDockProps) {
    const [activeTab, setActiveTab] = useState<'weapons' | 'spells' | 'features' | 'maneuvers' | 'consumables' | 'test'>('weapons');
    const [selectedSpellLevel, setSelectedSpellLevel] = useState<number | null>(null);

    // Feature state (Lay on Hands, etc.)
    const [lohAmount, setLohAmount] = useState<number>(5);
    const [lohTargetId, setLohTargetId] = useState<number | null>(null);
    const [supplyTargetId, setSupplyTargetId] = useState<number | null>(null);
    const [isOperating, setIsOperating] = useState(false);
    const [rollMode, setRollMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');

    // If it's an enemy turn in Gauntlet, display the Autonomous AI indicator card
    if (isEnemyTurn && gauntletRunId) {
        return (
            <div className="w-full bg-[#10121a]/95 border-t border-red-900/50 backdrop-blur-md px-6 py-3 shadow-[0_-4px_25px_rgba(0,0,0,0.6)] z-20">
                <div className="max-w-4xl mx-auto flex items-center justify-center gap-4 py-2 px-4 rounded-lg bg-[#181317] border border-red-800/40">
                    <span className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    <div>
                        <h4 className="font-cinzel text-sm sm:text-base font-bold text-red-200">
                            {currentParticipant?.name} is Acting Autonomously...
                        </h4>
                        <p className="text-[11px] text-slate-400 font-lora italic">
                            Evaluating tactical role, target vulnerabilities, and strikes independently.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const hasAttacksLeft = currentParticipant ? (currentParticipant.attacks_remaining > 0 && !currentParticipant.action_used) : false;
    const isActionDisabled = !targetId || isAttacking || !hasAttacksLeft || currentIsIncapacitated;

    const charFeatures = charData?.features || [];
    const classLower = (charData?.character_class?.name || charData?.class_name || '').toLowerCase();
    const isPaladin = classLower === 'paladin' || charFeatures.some((f: any) => f.name.toLowerCase() === 'lay on hands');
    const isFighter = classLower === 'fighter' || charFeatures.some((f: any) => f.name.toLowerCase() === 'second wind');

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

                    {!isEnemyTurn && (charFeatures.length > 0 || isPaladin || isFighter) && (
                        <button
                            onClick={() => setActiveTab('features')}
                            className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'features'
                                    ? 'bg-[#c5a059] text-[#0c0d12] shadow-[0_0_12px_rgba(197,160,89,0.35)]'
                                    : 'bg-[#151722] text-[#d1cdb8]/70 hover:text-white hover:bg-[#1e2233]'
                            }`}
                        >
                            <span>🌟</span>
                            <span>Features</span>
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

                {/* Middle: Advantage / Normal / Disadvantage Roll Mode Selector */}
                <div className="flex items-center gap-1 bg-[#0b0d14] px-1.5 py-0.5 rounded-md border border-[#c5a059]/25 shadow-inner">
                    <span className="text-[10px] font-cinzel font-bold text-[#c5a059]/70 mr-1 hidden sm:inline">
                        ROLL:
                    </span>
                    <button
                        type="button"
                        onClick={() => setRollMode('advantage')}
                        title="Roll with Advantage (rolls 2d20, takes higher)"
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                            rollMode === 'advantage'
                                ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.6)] font-bold'
                                : 'text-emerald-400/60 hover:text-emerald-300 hover:bg-emerald-950/40'
                        }`}
                    >
                        ADV
                    </button>
                    <button
                        type="button"
                        onClick={() => setRollMode('normal')}
                        title="Normal Roll (1d20)"
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-all cursor-pointer ${
                            rollMode === 'normal'
                                ? 'bg-[#c5a059] text-[#0c0d12] font-bold shadow-[0_0_8px_rgba(197,160,89,0.4)]'
                                : 'text-[#d1cdb8]/60 hover:text-[#d1cdb8] hover:bg-white/5'
                        }`}
                    >
                        NORM
                    </button>
                    <button
                        type="button"
                        onClick={() => setRollMode('disadvantage')}
                        title="Roll with Disadvantage (rolls 2d20, takes lower)"
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                            rollMode === 'disadvantage'
                                ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.6)] font-bold'
                                : 'text-purple-400/60 hover:text-purple-300 hover:bg-purple-950/40'
                        }`}
                    >
                        DIS
                    </button>
                </div>

                {/* Right: 5e Resource Status Pips (Action, Bonus Action, Reaction) */}
                <div className="flex items-center gap-3 font-cinzel text-[11px] text-[#d1cdb8]/80">
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${hasAttacksLeft ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-stone-700'}`} />
                        <span>Action ({currentParticipant?.attacks_remaining ?? 0})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                        <span>Bonus Action</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                        <span>Reaction</span>
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
                                        return (
                                            <button
                                                key={act.id}
                                                onClick={() => onAttack(act.name, act.attack_bonus || 0, { advantage: rollMode === 'advantage', disadvantage: rollMode === 'disadvantage' })}
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
                                    {enemyAttacks.map((atk, i) => (
                                        <button
                                            key={i}
                                            onClick={() => onAttack(atk.name, atk.bonus, { advantage: rollMode === 'advantage', disadvantage: rollMode === 'disadvantage' })}
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
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-[#d1cdb8]/50 italic py-2 font-lora">No monster actions available</p>
                            )
                        ) : (
                            /* Player Character Weapons */
                            characterWeapons.length > 0 ? (
                                <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                                    {characterWeapons.map((wp, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onAttack(wp.name, wp.bonus, { advantage: rollMode === 'advantage', disadvantage: rollMode === 'disadvantage' })}
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
                                    ))}
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
                                                                onAttack(spell.name, charData?.stats?.spell_attack_bonus || 0, { advantage: rollMode === 'advantage', disadvantage: rollMode === 'disadvantage' });
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

                        {/* Fighter: Second Wind */}
                        {isFighter && (
                            <div className="flex-shrink-0 flex items-center gap-3 p-2 rounded-lg bg-[#181a24] border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">🛡️</span>
                                        <span className="font-cinzel text-xs font-bold text-amber-200">Second Wind</span>
                                        <span className="text-[10px] px-1 rounded bg-amber-950 text-amber-300 font-fira-sans">Bonus Action</span>
                                    </div>
                                    <p className="text-[10px] text-[#d1cdb8]/60 font-lora italic">Regain 1d10 + {charData?.level || 1} HP (1/rest)</p>
                                </div>
                                <Button
                                    size="sm"
                                    disabled={currentIsIncapacitated || isAttacking || isOperating || currentParticipant?.bonus_action_used || currentParticipant?.feature_uses?.second_wind_used}
                                    onClick={async () => {
                                        if (!onUseFeature) return;
                                        setIsOperating(true);
                                        try {
                                            await onUseFeature('Second Wind', 0, currentParticipant?.id);
                                        } finally {
                                            setIsOperating(false);
                                        }
                                    }}
                                    className="h-7 px-3 bg-amber-700 hover:bg-amber-600 text-white font-cinzel font-bold text-xs cursor-pointer"
                                >
                                    Catch Breath
                                </Button>
                            </div>
                        )}

                        {/* Other Class / Racial Features Cards */}
                        {charFeatures
                            .filter((f: any) => !['lay on hands', 'second wind'].includes(f.name?.toLowerCase()))
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
                            onClick={() => alert("Dash activated: Your movement speed is doubled for this turn.")}
                            className="px-3 py-2 rounded bg-[#181a24] border border-blue-800/50 hover:border-blue-400 text-blue-200 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                            <span>🏃</span>
                            <span className="font-semibold">Dash</span>
                            <span className="text-[10px] text-blue-300/70">(2x Speed)</span>
                        </button>
                        <button
                            onClick={() => alert("Disengage activated: Movement does not provoke opportunity attacks for the rest of this turn.")}
                            className="px-3 py-2 rounded bg-[#181a24] border border-emerald-800/50 hover:border-emerald-400 text-emerald-200 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                            <span>🕊️</span>
                            <span className="font-semibold">Disengage</span>
                            <span className="text-[10px] text-emerald-300/70">(No OA)</span>
                        </button>
                        <button
                            onClick={() => alert("Dodge activated: Attack rolls against you have disadvantage until the start of your next turn.")}
                            className="px-3 py-2 rounded bg-[#181a24] border border-amber-800/50 hover:border-amber-400 text-amber-200 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                            <span>🛡️</span>
                            <span className="font-semibold">Dodge</span>
                            <span className="text-[10px] text-amber-300/70">(Disadvantage)</span>
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
