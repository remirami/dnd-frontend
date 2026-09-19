"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConditionBadge } from "@/components/combat/ConditionBadge";
import { GauntletArenaHud } from "@/components/gauntlet/GauntletArenaHud";
import { isIncapacitating } from "@/lib/data/conditions";
import type { CombatParticipant } from "@/lib/types/combat";
import type { GauntletRun } from "@/lib/types/gauntlet";

interface BattlefieldArenaProps {
    currentParticipant?: CombatParticipant | null;
    targetParticipant?: CombatParticipant | null;
    allParticipants: CombatParticipant[];
    targetId: string;
    onSelectTarget: (id: string) => void;
    onInspectParticipant: (p: CombatParticipant) => void;
    damagedParticipantIds: Set<number>;
    aiActionBanner: { message: string; isHit: boolean } | null;
    onDismissAiBanner: () => void;
    gauntletRun: GauntletRun | null;
    gauntletRunId: number | null;
    isEnemyTurn: boolean;
    onOpenRespite?: () => void;
}

const hpBarGradient = (cur: number, max: number) => {
    if (max <= 0) return 'from-slate-600 to-slate-500';
    const pct = (cur / max) * 100;
    if (pct > 50) return 'from-emerald-500 via-emerald-400 to-teal-400';
    if (pct > 20) return 'from-amber-500 via-amber-400 to-orange-400';
    return 'from-rose-600 via-rose-500 to-red-400';
};

export function BattlefieldArena({
    currentParticipant,
    targetParticipant,
    allParticipants,
    targetId,
    onSelectTarget,
    onInspectParticipant,
    damagedParticipantIds,
    aiActionBanner,
    onDismissAiBanner,
    gauntletRun,
    gauntletRunId,
    isEnemyTurn,
    onOpenRespite,
}: BattlefieldArenaProps) {
    // Determine valid target options for quick switcher
    const targetCandidates = allParticipants.filter((p) => {
        if (!currentParticipant) return false;
        const oppType = currentParticipant.participant_type === 'character' ? 'enemy' : 'character';
        return p.participant_type === oppType && p.current_hp > 0 && p.is_active;
    });

    const enemiesRemaining = allParticipants.filter(
        (p) => p.participant_type === 'enemy' && p.current_hp > 0 && p.is_active
    ).length;

    const currentIsIncapacitated = currentParticipant?.conditions?.some((c: any) =>
        isIncapacitating(typeof c === 'string' ? c : c.name)
    ) ?? false;

    const incapacitatingCond = currentParticipant?.conditions?.find((c: any) =>
        isIncapacitating(typeof c === 'string' ? c : c.name)
    );
    const incapacitatingName = incapacitatingCond
        ? (typeof incapacitatingCond === 'string' ? incapacitatingCond : (incapacitatingCond.name || 'Incapacitated'))
        : 'Incapacitated';

    return (
        <div className="w-full flex flex-col items-center justify-between gap-3 px-4 py-2 relative flex-1 min-h-0 overflow-y-auto">
            {/* Gauntlet HUD if in Gauntlet Mode */}
            {gauntletRun && gauntletRunId && (
                <div className="w-full max-w-5xl mx-auto">
                    <GauntletArenaHud run={gauntletRun} enemiesRemaining={enemiesRemaining} onOpenRespite={onOpenRespite} />
                </div>
            )}

            {/* Incapacitation Alert Banner */}
            {currentIsIncapacitated && (
                <div className="w-full max-w-3xl mx-auto p-3 rounded-lg bg-red-950/80 border border-red-500 shadow-[0_0_25px_rgba(220,38,38,0.35)] flex items-center gap-3 animate-in fade-in duration-300">
                    <span className="text-2xl">🛑</span>
                    <div className="flex-1">
                        <h4 className="font-cinzel font-bold text-red-200 text-xs sm:text-sm tracking-wide">
                            {currentParticipant?.name} is {incapacitatingName}
                        </h4>
                        <p className="text-[11px] text-red-300/90 font-lora leading-tight mt-0.5">
                            Incapacitated creatures cannot take actions or reactions. You cannot attack, cast spells, or use abilities this turn. Click <strong>End Turn →</strong> above to proceed.
                        </p>
                    </div>
                </div>
            )}

            {/* Floating AI / Combat Announcement Banner */}
            {aiActionBanner && (
                <div className={`w-full max-w-4xl mx-auto px-4 py-2 rounded-lg border text-xs sm:text-sm font-lora font-medium flex items-center justify-between shadow-lg transition-all animate-in slide-in-from-top-2 duration-200 ${
                    aiActionBanner.isHit
                        ? 'bg-red-950/90 text-red-200 border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                        : 'bg-[#181a21]/95 text-amber-200 border-[#c5a059]/40 shadow-[0_0_15px_rgba(197,160,89,0.2)]'
                }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/40 border border-current flex-shrink-0 font-cinzel">
                            ⚡ Combat Action
                        </span>
                        <span className="font-semibold truncate">{aiActionBanner.message}</span>
                    </div>
                    <button
                        onClick={onDismissAiBanner}
                        className="text-slate-400 hover:text-white text-xs px-2 py-1 font-bold cursor-pointer flex-shrink-0"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Central Clash Stage: Attacker vs Defender */}
            <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-11 gap-3 sm:gap-4 items-center my-auto">
                {/* Attacker Card (Col 1-5) */}
                <div className={`md:col-span-5 rounded-xl border p-4 transition-all duration-300 relative shadow-xl ${
                    isEnemyTurn
                        ? 'bg-gradient-to-br from-[#241315] via-[#1a1317] to-[#12131a] border-red-600/60 shadow-[0_0_25px_rgba(239,68,68,0.2)]'
                        : 'bg-gradient-to-br from-[#1c1810] via-[#181a24] to-[#12131a] border-[#c5a059]/60 shadow-[0_0_25px_rgba(197,160,89,0.2)]'
                }`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isEnemyTurn ? 'bg-red-400' : 'bg-[#c5a059]'} animate-pulse`} />
                                <span className="text-[10px] uppercase tracking-widest font-cinzel font-bold text-[#d1cdb8]/70">
                                    Active Attacker
                                </span>
                                {isEnemyTurn && gauntletRunId && (
                                    <Badge className="bg-red-950/80 text-red-300 border-red-700/60 text-[9px] px-1.5 py-0 font-cinzel">
                                        Autonomous AI
                                    </Badge>
                                )}
                            </div>
                            <h3 className={`font-cinzel text-lg sm:text-xl font-bold tracking-wide mt-0.5 truncate ${
                                isEnemyTurn ? 'text-red-200' : 'text-[#e0bc75]'
                            }`}>
                                {currentParticipant?.name || "None"}
                            </h3>
                        </div>

                        {currentParticipant && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onInspectParticipant(currentParticipant)}
                                className="text-[11px] h-7 px-2 text-[#c5a059] hover:bg-[#c5a059]/10 border border-[#c5a059]/20 font-lora"
                            >
                                🔍 Inspect
                            </Button>
                        )}
                    </div>

                    {/* Vitals Grid */}
                    {currentParticipant && (
                        <div className="space-y-2">
                            {/* HP Bar */}
                            <div>
                                <div className="flex justify-between text-xs font-fira-sans mb-1 text-[#d1cdb8]/80">
                                    <span>Hit Points</span>
                                    <span className="font-bold text-slate-100">
                                        {currentParticipant.current_hp} <span className="text-[#d1cdb8]/50">/ {currentParticipant.max_hp}</span>
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-[#0c0d12] rounded-full overflow-hidden border border-[#c5a059]/20">
                                    <div
                                        className={`h-full transition-all duration-300 bg-gradient-to-r ${
                                            damagedParticipantIds.has(currentParticipant.id)
                                                ? 'from-red-600 to-red-400'
                                                : hpBarGradient(currentParticipant.current_hp, currentParticipant.max_hp)
                                        }`}
                                        style={{ width: `${Math.max(0, Math.min(100, (currentParticipant.current_hp / currentParticipant.max_hp) * 100))}%` }}
                                    />
                                </div>
                            </div>

                            {/* Stat Chips */}
                            <div className="grid grid-cols-3 gap-2 pt-1">
                                <div className="px-2 py-1 rounded bg-[#0c0d12]/60 border border-slate-800 text-center">
                                    <span className="text-[9px] uppercase text-slate-400 block font-lora">Armor Class</span>
                                    <span className="font-fira-sans font-bold text-sm text-[#e0bc75]">🛡 {currentParticipant.armor_class}</span>
                                </div>
                                <div className="px-2 py-1 rounded bg-[#0c0d12]/60 border border-slate-800 text-center">
                                    <span className="text-[9px] uppercase text-slate-400 block font-lora">Initiative</span>
                                    <span className="font-fira-sans font-bold text-sm text-[#e0bc75]">{currentParticipant.initiative}</span>
                                </div>
                                <div className="px-2 py-1 rounded bg-[#0c0d12]/60 border border-slate-800 text-center">
                                    <span className="text-[9px] uppercase text-slate-400 block font-lora">Attacks Left</span>
                                    <span className={`font-fira-sans font-bold text-sm ${currentParticipant.attacks_remaining > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {currentParticipant.attacks_remaining}
                                    </span>
                                </div>
                            </div>

                            {/* Conditions */}
                            {currentParticipant.conditions && currentParticipant.conditions.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                    {currentParticipant.conditions.map((c: any, i: number) => (
                                        <ConditionBadge key={i} condition={c} size="sm" />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* VS Clash Emblem (Col 6) */}
                <div className="md:col-span-1 flex flex-col items-center justify-center my-[-8px] md:my-0">
                    <div className="w-10 h-10 rounded-full bg-[#181a21] border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] font-cinzel font-bold text-sm shadow-[0_0_15px_rgba(197,160,89,0.25)]">
                        VS
                    </div>
                </div>

                {/* Target Defender Card (Col 7-11) */}
                <div className={`md:col-span-5 rounded-xl border p-4 transition-all duration-300 relative shadow-xl ${
                    targetParticipant
                        ? 'bg-gradient-to-bl from-[#1f1a14] via-[#181922] to-[#12131a] border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.18)]'
                        : 'bg-[#141620]/60 border-dashed border-slate-800'
                }`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                <span className="text-[10px] uppercase tracking-widest font-cinzel font-bold text-amber-300">
                                    Current Target
                                </span>
                            </div>
                            <h3 className="font-cinzel text-lg sm:text-xl font-bold tracking-wide mt-0.5 text-slate-100 truncate">
                                {targetParticipant?.name || "No Target Selected"}
                            </h3>
                        </div>

                        {targetParticipant && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onInspectParticipant(targetParticipant)}
                                className="text-[11px] h-7 px-2 text-amber-300 hover:bg-amber-950/30 border border-amber-500/30 font-lora"
                            >
                                🔍 Inspect
                            </Button>
                        )}
                    </div>

                    {targetParticipant ? (
                        <div className="space-y-2">
                            {/* Target HP Bar */}
                            <div>
                                <div className="flex justify-between text-xs font-fira-sans mb-1 text-[#d1cdb8]/80">
                                    <span>Hit Points</span>
                                    <span className="font-bold text-slate-100">
                                        {targetParticipant.current_hp} <span className="text-[#d1cdb8]/50">/ {targetParticipant.max_hp}</span>
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-[#0c0d12] rounded-full overflow-hidden border border-[#c5a059]/20">
                                    <div
                                        className={`h-full transition-all duration-300 bg-gradient-to-r ${
                                            damagedParticipantIds.has(targetParticipant.id)
                                                ? 'from-red-600 to-red-400'
                                                : hpBarGradient(targetParticipant.current_hp, targetParticipant.max_hp)
                                        }`}
                                        style={{ width: `${Math.max(0, Math.min(100, (targetParticipant.current_hp / targetParticipant.max_hp) * 100))}%` }}
                                    />
                                </div>
                            </div>

                            {/* Target Stat Chips */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <div className="px-2 py-1 rounded bg-[#0c0d12]/60 border border-slate-800 text-center">
                                    <span className="text-[9px] uppercase text-slate-400 block font-lora">Armor Class</span>
                                    <span className="font-fira-sans font-bold text-sm text-amber-300">🛡 {targetParticipant.armor_class}</span>
                                </div>
                                <div className="px-2 py-1 rounded bg-[#0c0d12]/60 border border-slate-800 text-center">
                                    <span className="text-[9px] uppercase text-slate-400 block font-lora">Faction</span>
                                    <span className="font-fira-sans font-semibold text-xs text-slate-300">
                                        {targetParticipant.participant_type === 'character' ? '🛡 Hero' : '⚔ Hostile'}
                                    </span>
                                </div>
                            </div>

                            {/* Conditions */}
                            {targetParticipant.conditions && targetParticipant.conditions.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                    {targetParticipant.conditions.map((c: any, i: number) => (
                                        <ConditionBadge key={i} condition={c} size="sm" />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-[#d1cdb8]/50 italic text-center py-6 font-lora">
                            Select a target using the quick chips below or in the initiative ribbon.
                        </p>
                    )}

                    {/* Quick Target Switcher Chips: Only show when player turn or practice */}
                    {(!isEnemyTurn || !gauntletRunId) && targetCandidates.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                            <span className="text-[10px] text-[#c5a059]/70 uppercase tracking-wider font-cinzel font-bold block mb-1.5">
                                Switch Target (1-Click):
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {targetCandidates.map((cand) => {
                                    const isSelected = targetId === cand.id.toString();
                                    return (
                                        <button
                                            key={cand.id}
                                            onClick={() => onSelectTarget(cand.id.toString())}
                                            className={`px-2 py-1 rounded text-xs font-lora font-medium transition-all duration-150 flex items-center gap-1.5 border cursor-pointer ${
                                                isSelected
                                                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                                                    : 'bg-[#12141c] border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                                            }`}
                                        >
                                            <span className="font-semibold">{cand.name}</span>
                                            <span className="text-[10px] font-fira-sans text-slate-400">({cand.current_hp} HP)</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
