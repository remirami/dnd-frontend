"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConditionBadge } from "@/components/combat/ConditionBadge";
import { GauntletArenaHud } from "@/components/gauntlet/GauntletArenaHud";
import { CombatantPortrait } from "@/components/combat/CombatantPortrait";
import { BattleGrid } from "@/components/combat/BattleGrid";
import { isIncapacitating } from "@/lib/data/conditions";
import type { CombatParticipant, AoETargetingConfig } from "@/lib/types/combat";
import type { GauntletRun } from "@/lib/types/gauntlet";

export interface AttackFeedback {
    targetId: number;
    hit: boolean;
    critical?: boolean;
    damage?: number;
    timestamp: number;
    // Spell specific feedback
    spellName?: string;
    isSpell?: boolean;
    isHealing?: boolean;
    isFeature?: boolean;
    healingAmount?: number;
    saveSuccess?: boolean;
    conditionApplied?: string | null;
}

interface BattlefieldArenaProps {
    sessionId?: number;
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
    lastAttackFeedback?: AttackFeedback | null;
    onMove?: (targetX: number, targetY: number) => Promise<void>;
    onDash?: () => Promise<void>;
    onDisengage?: () => Promise<void>;
    onDodge?: () => Promise<void>;
    isMoving?: boolean;
    isOperating?: boolean;
    aoeTargeting?: AoETargetingConfig | null;
    onConfirmAoECast?: (data: { targetIds: number[] }) => Promise<void>;
    onCancelAoETargeting?: () => void;
    viewMode?: "grid" | "duel";
    onViewModeChange?: (mode: "grid" | "duel") => void;
}

const hpBarGradient = (cur: number, max: number) => {
    if (max <= 0) return "from-slate-600 to-slate-500";
    const pct = (cur / max) * 100;
    if (pct > 50) return "from-emerald-500 via-emerald-400 to-teal-400";
    if (pct > 20) return "from-amber-500 via-amber-400 to-orange-400";
    return "from-rose-600 via-rose-500 to-red-400";
};

// Reusable corner filigree accents for fantasy cards
function CornerFiligree({
    position,
    color = "#c5a059",
}: {
    position: "tl" | "tr" | "bl" | "br";
    color?: string;
}) {
    const posClasses = {
        tl: "top-1.5 left-1.5",
        tr: "top-1.5 right-1.5 scale-x-[-1]",
        bl: "bottom-1.5 left-1.5 scale-y-[-1]",
        br: "bottom-1.5 right-1.5 scale-x-[-1] scale-y-[-1]",
    }[position];

    return (
        <svg
            className={`absolute w-3.5 h-3.5 pointer-events-none opacity-50 ${posClasses}`}
            viewBox="0 0 20 20"
            fill="none"
            stroke={color}
            strokeWidth="1.6"
        >
            <path d="M2 18V5a3 3 0 0 1 3-3h13" />
            <circle cx="5" cy="5" r="1.5" fill={color} />
        </svg>
    );
}

function FloatingCombatText({ text }: { text: AttackFeedback }) {
    if (text.isFeature) {
        const isRage = text.spellName?.toLowerCase().includes('rage');
        const isSurge = text.spellName?.toLowerCase().includes('surge');
        const isReckless = text.spellName?.toLowerCase().includes('reckless');
        return (
            <div className="animate-combat-hit flex flex-col items-center select-none">
                <span className={`font-cinzel text-2xl sm:text-3xl font-black tracking-widest uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.9)] ${
                    isRage ? 'text-rose-500 drop-shadow-[0_0_25px_rgba(244,63,94,0.95)]' :
                    isSurge ? 'text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.95)]' :
                    isReckless ? 'text-orange-400 drop-shadow-[0_0_25px_rgba(249,115,22,0.95)]' :
                    'text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.95)]'
                }`}>
                    {isRage ? '🔥 RAGE!' : isSurge ? '⚡ ACTION SURGE!' : isReckless ? '⚡ RECKLESS ATTACK!' : `⚡ ${text.spellName?.toUpperCase()}`}
                </span>
                <span className="font-fira-sans text-xs sm:text-sm font-bold text-slate-200 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] mt-0.5">
                    {isRage ? 'Physical Resistance & Melee Bonus Active' :
                     isSurge ? '+1 Action Granted' :
                     isReckless ? 'Advantage on Melee STR Attacks' :
                     'Feature Activated'}
                </span>
            </div>
        );
    }

    if (text.isHealing) {
        return (
            <div className="animate-combat-hit flex flex-col items-center select-none">
                <span className="font-cinzel text-2xl sm:text-3xl font-black tracking-widest uppercase text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.95)]">
                    💚 HEALED!
                </span>
                {text.healingAmount != null && text.healingAmount > 0 && (
                    <span className="font-fira-sans text-xl sm:text-2xl font-extrabold text-emerald-300 drop-shadow-[0_0_12px_rgba(110,231,183,0.85)] mt-0.5">
                        +{text.healingAmount} HP
                    </span>
                )}
            </div>
        );
    }

    if (text.isSpell) {
        if (text.saveSuccess === true) {
            return (
                <div className="animate-combat-miss flex flex-col items-center select-none">
                    <span className="font-cinzel text-xl sm:text-2xl font-black tracking-widest uppercase text-sky-300 drop-shadow-[0_0_14px_rgba(125,211,252,0.8)]">
                        🛡️ SAVED!
                    </span>
                    {text.damage != null && text.damage > 0 ? (
                        <span className="font-fira-sans text-base sm:text-lg font-bold text-amber-300 mt-0.5">
                            Half Damage: -{text.damage} HP
                        </span>
                    ) : (
                        <span className="font-lora text-xs font-semibold text-slate-300/80 italic tracking-wider">
                            RESISTED
                        </span>
                    )}
                </div>
            );
        }

        if (text.saveSuccess === false) {
            return (
                <div className="animate-combat-hit flex flex-col items-center select-none">
                    <span className="font-cinzel text-2xl sm:text-3xl font-black tracking-widest uppercase text-red-500 drop-shadow-[0_0_18px_rgba(239,68,68,0.9)]">
                        💥 SAVE FAILED!
                    </span>
                    {text.damage != null && text.damage > 0 && (
                        <span className="font-fira-sans text-xl sm:text-2xl font-extrabold text-red-400 drop-shadow-[0_0_12px_rgba(220,38,38,0.85)] mt-0.5">
                            -{text.damage} HP
                        </span>
                    )}
                    {text.conditionApplied && (
                        <span className="font-cinzel text-sm sm:text-base font-bold text-purple-300 uppercase tracking-wider mt-1 drop-shadow-[0_0_10px_rgba(216,180,254,0.8)]">
                            ⚡ {text.conditionApplied}
                        </span>
                    )}
                </div>
            );
        }

        return (
            <div className="animate-combat-hit flex flex-col items-center select-none">
                <span className="font-cinzel text-2xl sm:text-3xl font-black tracking-widest uppercase text-purple-400 drop-shadow-[0_0_18px_rgba(192,132,252,0.9)]">
                    ✨ {text.spellName ? text.spellName.toUpperCase() : "SPELL HIT!"}
                </span>
                {text.damage != null && text.damage > 0 && (
                    <span className="font-fira-sans text-xl sm:text-2xl font-extrabold text-red-400 drop-shadow-[0_0_12px_rgba(220,38,38,0.85)] mt-0.5">
                        -{text.damage} HP
                    </span>
                )}
                {text.conditionApplied && (
                    <span className="font-cinzel text-sm sm:text-base font-bold text-amber-300 uppercase tracking-wider mt-1">
                        ⚡ {text.conditionApplied}
                    </span>
                )}
            </div>
        );
    }

    return text.hit ? (
        <div className="animate-combat-hit flex flex-col items-center select-none">
            <span
                className={`font-cinzel text-2xl sm:text-3xl font-black tracking-widest uppercase ${
                    text.critical
                        ? "text-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.95)]"
                        : "text-red-500 drop-shadow-[0_0_18px_rgba(239,68,68,0.9)]"
                }`}
            >
                {text.critical ? "💥 CRITICAL HIT!" : "⚔️ HIT!"}
            </span>
            {text.damage != null && text.damage > 0 && (
                <span className="font-fira-sans text-xl sm:text-2xl font-extrabold text-red-400 drop-shadow-[0_0_12px_rgba(220,38,38,0.85)] mt-0.5">
                    -{text.damage} HP
                </span>
            )}
        </div>
    ) : (
        <div className="animate-combat-miss flex flex-col items-center select-none">
            <span className="font-cinzel text-xl sm:text-2xl font-black tracking-widest uppercase text-slate-100 drop-shadow-[0_0_14px_rgba(241,245,249,0.8)]">
                🛡️ MISS
            </span>
            <span className="font-lora text-xs font-semibold text-slate-300/80 italic tracking-wider">
                DEFLECTED
            </span>
        </div>
    );
}

export function BattlefieldArena({
    sessionId,
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
    lastAttackFeedback,
    onMove,
    onDash,
    onDisengage,
    onDodge,
    isMoving,
    isOperating,
    aoeTargeting,
    onConfirmAoECast,
    onCancelAoETargeting,
    viewMode: viewModeProp,
    onViewModeChange,
}: BattlefieldArenaProps) {
    const [internalViewMode, setInternalViewMode] = useState<"grid" | "duel">("grid");
    const viewMode = viewModeProp !== undefined ? viewModeProp : internalViewMode;

    const setViewMode = useCallback(
        (mode: "grid" | "duel") => {
            if (onViewModeChange) {
                onViewModeChange(mode);
            } else {
                setInternalViewMode(mode);
            }
        },
        [onViewModeChange]
    );

    // Reset view mode back to tactical grid whenever the active turn ends or changes
    useEffect(() => {
        setViewMode("grid");
    }, [currentParticipant?.id, setViewMode]);

    // Active floating combat text state
    const [floatingText, setFloatingText] = useState<AttackFeedback | null>(null);

    // Switch to tactical grid view immediately if AoE targeting mode is activated
    useEffect(() => {
        if (aoeTargeting) {
            setViewMode("grid");
        }
    }, [aoeTargeting, setViewMode]);

    // Trigger floating combat text whenever a new attack feedback arrives
    useEffect(() => {
        if (lastAttackFeedback) {
            setFloatingText(lastAttackFeedback);

            const timer = setTimeout(() => {
                setFloatingText(null);
            }, 2200);

            return () => clearTimeout(timer);
        }
    }, [lastAttackFeedback]);

    // Determine valid target options for quick switcher
    const targetCandidates = allParticipants.filter((p) => {
        if (!currentParticipant) return false;
        const oppType = currentParticipant.participant_type === "character" ? "enemy" : "character";
        return p.participant_type === oppType && p.current_hp > 0 && p.is_active;
    });

    const enemiesRemaining = allParticipants.filter(
        (p) => p.participant_type === "enemy" && p.current_hp > 0 && p.is_active
    ).length;

    const currentIsIncapacitated = currentParticipant?.conditions?.some((c: any) =>
        isIncapacitating(typeof c === "string" ? c : c.name)
    ) ?? false;

    const incapacitatingCond = currentParticipant?.conditions?.find((c: any) =>
        isIncapacitating(typeof c === "string" ? c : c.name)
    );
    const incapacitatingName = incapacitatingCond
        ? typeof incapacitatingCond === "string"
            ? incapacitatingCond
            : incapacitatingCond.name || "Incapacitated"
        : "Incapacitated";

    const attackerIsTargetOfAttack = floatingText && currentParticipant?.id === floatingText.targetId;
    const defenderIsTargetOfAttack = floatingText && targetParticipant?.id === floatingText.targetId;

    return (
        <div className="w-full flex flex-col items-center justify-start gap-1.5 sm:gap-2 px-2 sm:px-4 py-1 relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]">
            {/* Pinned Arena Top Header: Mode Switcher (Always accessible, never scrolled off or obscured) */}
            {onMove && (
                <div className="sticky top-0 z-30 w-full flex items-center justify-center py-1 bg-[#0c0d12]/95 backdrop-blur-md border-b border-[#c5a059]/25 shadow-md flex-shrink-0">
                    <div className="flex items-center gap-1.5 bg-[#12141c]/90 p-1 rounded-lg border border-[#c5a059]/30 shadow-md">
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            className={`px-3 py-1 rounded text-xs font-cinzel font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                viewMode === "grid"
                                    ? "bg-[#c5a059] text-[#0c0d12] shadow-[0_0_12px_rgba(197,160,89,0.4)]"
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <span>🗺️</span>
                            <span>Tactical Grid</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("duel")}
                            className={`px-3 py-1 rounded text-xs font-cinzel font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                viewMode === "duel"
                                    ? "bg-[#c5a059] text-[#0c0d12] shadow-[0_0_12px_rgba(197,160,89,0.4)]"
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <span>⚔️</span>
                            <span>Duel Focus</span>
                        </button>
                    </div>
                </div>
            )}

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
                <div
                    className={`w-full max-w-4xl mx-auto px-4 py-2 rounded-lg border text-xs sm:text-sm font-lora font-medium flex items-center justify-between shadow-lg transition-all animate-in slide-in-from-top-2 duration-200 ${
                        aiActionBanner.isHit
                            ? "bg-red-950/90 text-red-200 border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                            : "bg-[#181a21]/95 text-amber-200 border-[#c5a059]/40 shadow-[0_0_15px_rgba(197,160,89,0.2)]"
                    }`}
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/40 border border-current flex-shrink-0 font-cinzel">
                            ⚡ Action
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

            {/* View Mode 1: 2D Tactical Battle Grid */}
            {viewMode === "grid" && onMove ? (
                <BattleGrid
                    sessionId={sessionId}
                    currentParticipant={currentParticipant}
                    targetParticipant={targetParticipant}
                    allParticipants={allParticipants}
                    targetId={targetId}
                    onSelectTarget={onSelectTarget}
                    onInspectParticipant={onInspectParticipant}
                    onMove={onMove}
                    onDash={onDash}
                    onDisengage={onDisengage}
                    onDodge={onDodge}
                    isMoving={isMoving}
                    isOperating={isOperating}
                    aoeTargeting={aoeTargeting}
                    onConfirmAoECast={onConfirmAoECast}
                    onCancelAoETargeting={onCancelAoETargeting}
                    onSwitchToDuel={() => setViewMode("duel")}
                />
            ) : (
                /* View Mode 2: Central Clash Stage: Attacker vs Defender */
                <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-11 gap-3 sm:gap-4 items-center my-auto">
                {/* Attacker Card (Col 1-5) */}
                <div
                    className={`md:col-span-5 rounded-xl border p-4 transition-all duration-300 relative shadow-xl ${
                        attackerIsTargetOfAttack && floatingText?.hit ? "animate-card-impact" : ""
                    } ${
                        isEnemyTurn
                            ? "bg-gradient-to-br from-[#241315] via-[#1a1317] to-[#10121a] border-red-600/70 shadow-[0_0_25px_rgba(239,68,68,0.25)]"
                            : "bg-gradient-to-br from-[#1f1b13] via-[#181a24] to-[#10121a] border-[#c5a059]/70 shadow-[0_0_25px_rgba(197,160,89,0.25)]"
                    }`}
                >
                    {/* Corner filigree brackets */}
                    <CornerFiligree position="tl" color={isEnemyTurn ? "#ef4444" : "#c5a059"} />
                    <CornerFiligree position="tr" color={isEnemyTurn ? "#ef4444" : "#c5a059"} />
                    <CornerFiligree position="bl" color={isEnemyTurn ? "#ef4444" : "#c5a059"} />
                    <CornerFiligree position="br" color={isEnemyTurn ? "#ef4444" : "#c5a059"} />

                    {/* Floating Combat Text Overlay if Attacker was targeted (e.g. counter-attack / turn damage / self-heal) */}
                    {attackerIsTargetOfAttack && floatingText && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                            <FloatingCombatText text={floatingText} />
                        </div>
                    )}

                    {/* Header with Portrait & Titles */}
                    <div className="flex items-center gap-3 mb-2.5">
                        <CombatantPortrait
                            participant={currentParticipant}
                            size="md"
                            showAc={true}
                            isDamaged={damagedParticipantIds.has(currentParticipant?.id ?? -1)}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                    className={`w-2 h-2 rounded-full ${
                                        isEnemyTurn ? "bg-red-400" : "bg-[#c5a059]"
                                    } animate-pulse`}
                                />
                                <span className="text-[10px] uppercase tracking-widest font-cinzel font-bold text-[#d1cdb8]/70">
                                    Active Attacker
                                </span>
                                {isEnemyTurn && gauntletRunId && (
                                    <Badge className="bg-red-950/80 text-red-300 border-red-700/60 text-[9px] px-1.5 py-0 font-cinzel">
                                        Autonomous AI
                                    </Badge>
                                )}
                            </div>
                            <h3
                                className={`font-cinzel text-base sm:text-lg font-bold tracking-wide truncate ${
                                    isEnemyTurn ? "text-red-200" : "text-[#e0bc75]"
                                }`}
                            >
                                {currentParticipant?.name || "None"}
                            </h3>
                            <p className="text-[10px] font-lora text-[#d1cdb8]/60 truncate">
                                {currentParticipant?.participant_type === "character"
                                    ? `${currentParticipant.character?.character_class?.name || "Hero"} • Lvl ${
                                          currentParticipant.character?.level || 1
                                      }`
                                    : "Hostile Creature"}
                            </p>
                        </div>

                        {currentParticipant && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onInspectParticipant(currentParticipant)}
                                className="text-[11px] h-7 px-2 text-[#c5a059] hover:bg-[#c5a059]/10 border border-[#c5a059]/20 font-lora flex-shrink-0"
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
                                        {currentParticipant.current_hp}{" "}
                                        <span className="text-[#d1cdb8]/50">/ {currentParticipant.max_hp}</span>
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-[#0c0d12] rounded-full overflow-hidden border border-[#c5a059]/20">
                                    <div
                                        className={`h-full transition-all duration-300 bg-gradient-to-r ${
                                            damagedParticipantIds.has(currentParticipant.id)
                                                ? "from-red-600 to-red-400"
                                                : hpBarGradient(
                                                      currentParticipant.current_hp,
                                                      currentParticipant.max_hp
                                                  )
                                        }`}
                                        style={{
                                            width: `${Math.max(
                                                0,
                                                Math.min(
                                                    100,
                                                    (currentParticipant.current_hp / currentParticipant.max_hp) * 100
                                                )
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Stat Chips */}
                            <div className="grid grid-cols-3 gap-2 pt-1">
                                <div className="px-2 py-1 rounded bg-[#0c0d12]/60 border border-slate-800 text-center">
                                    <span className="text-[9px] uppercase text-slate-400 block font-lora">Armor Class</span>
                                    <span className="font-fira-sans font-bold text-sm text-[#e0bc75]">
                                        🛡 {currentParticipant.armor_class}
                                    </span>
                                </div>
                                <div className="px-2 py-1 rounded bg-[#0c0d12]/60 border border-slate-800 text-center">
                                    <span className="text-[9px] uppercase text-slate-400 block font-lora">Initiative</span>
                                    <span className="font-fira-sans font-bold text-sm text-[#e0bc75]">
                                        {currentParticipant.initiative}
                                    </span>
                                </div>
                                <div className="px-2 py-1 rounded bg-[#0c0d12]/60 border border-slate-800 text-center">
                                    <span className="text-[9px] uppercase text-slate-400 block font-lora">Attacks Left</span>
                                    <span
                                        className={`font-fira-sans font-bold text-sm ${
                                            currentParticipant.attacks_remaining > 0
                                                ? "text-emerald-400"
                                                : "text-slate-500"
                                        }`}
                                    >
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
                <div className="md:col-span-1 flex flex-col items-center justify-center my-[-8px] md:my-0 select-none">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#242636] to-[#12131a] border-2 border-[#c5a059]/60 flex items-center justify-center text-[#c5a059] font-cinzel font-black text-sm shadow-[0_0_20px_rgba(197,160,89,0.35)] relative">
                        VS
                        <div className="absolute inset-0 rounded-full border border-amber-400/20 animate-ping opacity-30 pointer-events-none" />
                    </div>
                </div>

                {/* Target Defender Card (Col 7-11) */}
                <div
                    className={`md:col-span-5 rounded-xl border p-4 transition-all duration-300 relative shadow-xl ${
                        defenderIsTargetOfAttack && floatingText?.hit ? "animate-card-impact" : ""
                    } ${
                        targetParticipant
                            ? "bg-gradient-to-bl from-[#221c14] via-[#181924] to-[#10121a] border-amber-500/70 shadow-[0_0_25px_rgba(245,158,11,0.22)]"
                            : "bg-[#141620]/60 border-dashed border-slate-800"
                    }`}
                >
                    {/* Corner filigree brackets */}
                    <CornerFiligree position="tl" color="#f59e0b" />
                    <CornerFiligree position="tr" color="#f59e0b" />
                    <CornerFiligree position="bl" color="#f59e0b" />
                    <CornerFiligree position="br" color="#f59e0b" />

                    {/* Floating Combat Text Overlay when Defender is targeted */}
                    {defenderIsTargetOfAttack && floatingText && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                            <FloatingCombatText text={floatingText} />
                        </div>
                    )}

                    {/* Header with Portrait & Titles */}
                    <div className="flex items-center gap-3 mb-2.5">
                        <CombatantPortrait
                            participant={targetParticipant}
                            size="md"
                            showAc={true}
                            isDamaged={damagedParticipantIds.has(targetParticipant?.id ?? -1)}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                <span className="text-[10px] uppercase tracking-widest font-cinzel font-bold text-amber-300">
                                    Current Target
                                </span>
                            </div>
                            <h3 className="font-cinzel text-base sm:text-lg font-bold tracking-wide mt-0.5 text-slate-100 truncate">
                                {targetParticipant?.name || "No Target Selected"}
                            </h3>
                            <p className="text-[10px] font-lora text-[#d1cdb8]/60 truncate">
                                {targetParticipant
                                    ? targetParticipant.participant_type === "character"
                                        ? `${targetParticipant.character?.character_class?.name || "Hero"} • Lvl ${
                                              targetParticipant.character?.level || 1
                                          }`
                                        : "Hostile Opponent"
                                    : "Choose an opponent to attack"}
                            </p>
                        </div>

                        {targetParticipant && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onInspectParticipant(targetParticipant)}
                                className="text-[11px] h-7 px-2 text-amber-300 hover:bg-amber-950/30 border border-amber-500/30 font-lora flex-shrink-0"
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
                                        {targetParticipant.current_hp}{" "}
                                        <span className="text-[#d1cdb8]/50">/ {targetParticipant.max_hp}</span>
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-[#0c0d12] rounded-full overflow-hidden border border-[#c5a059]/20">
                                    <div
                                        className={`h-full transition-all duration-300 bg-gradient-to-r ${
                                            damagedParticipantIds.has(targetParticipant.id)
                                                ? "from-red-600 to-red-400"
                                                : hpBarGradient(
                                                      targetParticipant.current_hp,
                                                      targetParticipant.max_hp
                                                  )
                                        }`}
                                        style={{
                                            width: `${Math.max(
                                                0,
                                                Math.min(
                                                    100,
                                                    (targetParticipant.current_hp / targetParticipant.max_hp) * 100
                                                )
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Target Stat Chips */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <div className="px-2 py-1 rounded bg-[#0c0d12]/60 border border-slate-800 text-center">
                                    <span className="text-[9px] uppercase text-slate-400 block font-lora">Armor Class</span>
                                    <span className="font-fira-sans font-bold text-sm text-amber-300">
                                        🛡 {targetParticipant.armor_class}
                                    </span>
                                </div>
                                <div className="px-2 py-1 rounded bg-[#0c0d12]/60 border border-slate-800 text-center">
                                    <span className="text-[9px] uppercase text-slate-400 block font-lora">Faction</span>
                                    <span className="font-fira-sans font-semibold text-xs text-slate-300">
                                        {targetParticipant.participant_type === "character" ? "🛡 Party Ally" : "⚔ Hostile"}
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

                    {/* Quick Target Switcher Chips */}
                    {(!isEnemyTurn || !gauntletRunId) && targetCandidates.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                            <span className="text-[10px] text-[#c5a059]/80 uppercase tracking-wider font-cinzel font-bold block mb-1.5">
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
                                                    ? "bg-amber-500/25 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                                    : "bg-[#12141c] border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white"
                                            }`}
                                        >
                                            <span className="font-semibold">{cand.name}</span>
                                            <span className="text-[10px] font-fira-sans text-slate-400">
                                                ({cand.current_hp} HP)
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            )}
        </div>
    );
}
