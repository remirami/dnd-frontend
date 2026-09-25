"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConditionBadge } from "@/components/combat/ConditionBadge";
import { CombatantPortrait } from "@/components/combat/CombatantPortrait";
import { BattleGrid } from "@/components/combat/BattleGrid";
import { ClashCard } from "@/components/combat/ClashCard";
import { computeRollPrediction } from "@/components/combat/ActionDock";
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
    environmentalEffects?: import("@/lib/types/combat").EnvironmentalEffect[];
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
    environmentalEffects,
    viewMode: viewModeProp,
    onViewModeChange,
}: BattlefieldArenaProps) {
    // Hovered enemy for live Clash Card preview
    const [hoveredEnemy, setHoveredEnemy] = useState<CombatParticipant | null>(null);
    // Locked target state: clicking an enemy locks the Clash Card on screen
    const [isClashLocked, setIsClashLocked] = useState<boolean>(Boolean(targetParticipant && targetParticipant.current_hp > 0));

    // When user explicitly selects a new target, lock the card
    useEffect(() => {
        if (targetParticipant && targetParticipant.current_hp > 0 && targetParticipant.id !== currentParticipant?.id) {
            setIsClashLocked(true);
        }
    }, [targetParticipant?.id, currentParticipant?.id]);

    // Reset lock and dismiss preview when turn changes
    useEffect(() => {
        setIsClashLocked(false);
        setHoveredEnemy(null);
    }, [currentParticipant?.id]);

    // Auto-dismiss card with a brief delay when target dies (allows impact & text to play)
    useEffect(() => {
        if (targetParticipant && targetParticipant.current_hp <= 0) {
            const timer = setTimeout(() => {
                setIsClashLocked(false);
                setHoveredEnemy(null);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [targetParticipant?.id, targetParticipant?.current_hp]);

    // Active floating combat text state
    const [floatingText, setFloatingText] = useState<AttackFeedback | null>(null);

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

    // Determine the defender to preview or clash with:
    // 1. Hovered enemy takes precedence (instant preview).
    // 2. Otherwise, locked selected target.
    const activeDefender = (hoveredEnemy && hoveredEnemy.id !== currentParticipant?.id && hoveredEnemy.current_hp > 0)
        ? hoveredEnemy
        : (isClashLocked && targetParticipant && targetParticipant.current_hp > 0 && targetParticipant.id !== currentParticipant?.id)
            ? targetParticipant
            : null;

    // Distance in feet between attacker and active defender
    const defenderDistance = (
        currentParticipant?.position_x != null && currentParticipant?.position_y != null &&
        activeDefender?.position_x != null && activeDefender?.position_y != null &&
        (currentParticipant.position_x !== 0 || currentParticipant.position_y !== 0 || activeDefender.position_x !== 0 || activeDefender.position_y !== 0)
    ) ? Math.max(Math.abs(currentParticipant.position_x - activeDefender.position_x), Math.abs(currentParticipant.position_y - activeDefender.position_y)) : null;

    const isMeleeReach = defenderDistance != null ? defenderDistance <= 5 : true;

    // Roll prediction calculations
    const rollPred = computeRollPrediction(
        currentParticipant,
        activeDefender,
        isMeleeReach,
        false,
        allParticipants
    );

    let hitChance = 65;
    if (activeDefender && currentParticipant) {
        const atkBonus = 5;
        const targetAC = activeDefender.armor_class || 10;
        const neededRoll = Math.max(1, Math.min(20, targetAC - atkBonus));
        let baseChance = (21 - neededRoll) / 20;
        if (rollPred.state === 'advantage') {
            baseChance = 1 - Math.pow(1 - baseChance, 2);
        } else if (rollPred.state === 'disadvantage') {
            baseChance = Math.pow(baseChance, 2);
        }
        hitChance = Math.round(Math.max(5, Math.min(95, baseChance * 100)));
    }

    const prediction = {
        hitChance,
        avgDamage: 8,
        isAdvantage: rollPred.state === 'advantage',
        isDisadvantage: rollPred.state === 'disadvantage',
        advantageReasons: rollPred.advReasons,
        disadvantageReasons: rollPred.disadvReasons,
    };

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

    return (
        <div className="w-full flex flex-col items-center justify-start gap-1.5 sm:gap-2 px-2 sm:px-4 py-1 relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]">
            {/* Floating Combat Text (Big immersive hit/miss/spell effects on canvas) */}
            {floatingText && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none drop-shadow-2xl">
                    <FloatingCombatText text={floatingText} />
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

            {/* Unified Battlefield Canvas: Tactical Battle Grid is always active */}
            <div className="relative w-full flex-1 min-h-0 flex flex-col items-center">
                <BattleGrid
                    sessionId={sessionId}
                    currentParticipant={currentParticipant}
                    targetParticipant={targetParticipant}
                    allParticipants={allParticipants}
                    targetId={targetId}
                    onSelectTarget={(id) => {
                        onSelectTarget(id);
                        setIsClashLocked(true);
                    }}
                    onInspectParticipant={onInspectParticipant}
                    onMove={onMove ?? (async () => {})}
                    onDash={onDash}
                    onDisengage={onDisengage}
                    onDodge={onDodge}
                    isMoving={isMoving}
                    isOperating={isOperating}
                    aoeTargeting={aoeTargeting}
                    onConfirmAoECast={onConfirmAoECast}
                    onCancelAoETargeting={onCancelAoETargeting}
                    environmentalEffects={environmentalEffects}
                    onSwitchToDuel={() => {
                        if (targetParticipant) setIsClashLocked(true);
                    }}
                    onHoverEnemy={setHoveredEnemy}
                />

                {/* Live Clash Card (Reveals on enemy hover, locks on click, dismisses on unhover/unlock/death) */}
                {activeDefender && (
                    <div className="absolute top-2 right-2 sm:right-4 z-40 max-w-sm sm:max-w-md w-[calc(100%-1rem)] sm:w-96 pointer-events-auto">
                        <ClashCard
                            attacker={currentParticipant}
                            defender={activeDefender}
                            isLocked={isClashLocked && activeDefender.id === targetParticipant?.id}
                            onToggleLock={() => {
                                if (isClashLocked && activeDefender.id === targetParticipant?.id) {
                                    setIsClashLocked(false);
                                } else {
                                    onSelectTarget(activeDefender.id.toString());
                                    setIsClashLocked(true);
                                }
                            }}
                            onClose={() => {
                                setIsClashLocked(false);
                                setHoveredEnemy(null);
                            }}
                            onInspectParticipant={onInspectParticipant}
                            prediction={prediction}
                            lastAttackFeedback={lastAttackFeedback}
                            damagedParticipantIds={damagedParticipantIds}
                            distance={defenderDistance}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
