"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ConditionBadge } from "@/components/combat/ConditionBadge";
import { CombatantPortrait } from "@/components/combat/CombatantPortrait";
import type { CombatParticipant } from "@/lib/types/combat";
import type { AttackFeedback } from "@/components/combat/BattlefieldArena";

interface RollPrediction {
    hitChance?: number;
    avgDamage?: number;
    advantageReasons?: string[];
    disadvantageReasons?: string[];
    isAdvantage?: boolean;
    isDisadvantage?: boolean;
}

export interface ClashCardProps {
    attacker?: CombatParticipant | null;
    defender?: CombatParticipant | null;
    isLocked: boolean;
    onToggleLock?: () => void;
    onClose?: () => void;
    onInspectParticipant?: (p: CombatParticipant) => void;
    prediction?: RollPrediction | null;
    lastAttackFeedback?: AttackFeedback | null;
    damagedParticipantIds?: Set<number>;
    distance?: number | null;
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
        tl: "top-1 left-1",
        tr: "top-1 right-1 scale-x-[-1]",
        bl: "bottom-1 left-1 scale-y-[-1]",
        br: "bottom-1 right-1 scale-x-[-1] scale-y-[-1]",
    }[position];

    return (
        <svg
            className={`absolute w-3 h-3 pointer-events-none opacity-40 ${posClasses}`}
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

export function ClashCard({
    attacker,
    defender,
    isLocked,
    onToggleLock,
    onClose,
    onInspectParticipant,
    prediction,
    lastAttackFeedback,
    damagedParticipantIds = new Set(),
    distance,
}: ClashCardProps) {
    if (!attacker && !defender) return null;

    const isEnemyTurn = attacker?.participant_type === "enemy";
    const attackerDamaged = attacker ? damagedParticipantIds.has(attacker.id) : false;
    const defenderDamaged = defender ? damagedParticipantIds.has(defender.id) : false;

    return (
        <aside
            aria-label="Combat Clash Details"
            className="w-full max-w-[420px] rounded-xl border border-[#c5a059]/40 bg-[#0d0f17]/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.7)] p-3 relative flex flex-col gap-2.5 transition-all duration-200 animate-in fade-in slide-in-from-right-4 z-20 select-none text-slate-200"
        >
            {/* Top Bar: Title, Lock Status, and Close Button */}
            <div className="flex items-center justify-between border-b border-[#c5a059]/25 pb-1.5 px-0.5">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm">⚔️</span>
                    <span className="font-cinzel text-xs font-bold tracking-wider text-[#c5a059] uppercase">
                        Combat Clash
                    </span>
                    {distance != null && (
                        <span className="text-[10px] font-fira-sans px-1.5 py-0.2 rounded bg-[#181a24] border border-slate-700 text-slate-300">
                            {distance <= 5 ? "Melee (5 ft)" : `${distance} ft`}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {onToggleLock && (
                        <button
                            type="button"
                            onClick={onToggleLock}
                            title={isLocked ? "Target locked (click to unlock)" : "Preview only (click to lock)"}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-cinzel font-semibold transition-all cursor-pointer ${
                                isLocked
                                    ? "bg-amber-950/80 border border-amber-500/70 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                                    : "bg-[#141622] hover:bg-[#1f2233] border border-slate-700 text-slate-400"
                            }`}
                        >
                            <span>{isLocked ? "📌" : "🔓"}</span>
                            <span>{isLocked ? "Locked" : "Lock Target"}</span>
                        </button>
                    )}

                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            title="Dismiss Card"
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-bold cursor-pointer"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Main Clash Layout: Side-by-side Attacker vs Defender */}
            <div className="grid grid-cols-11 gap-2 items-center">
                {/* Attacker Panel (Col 1-5) */}
                <div
                    className={`col-span-5 rounded-lg border p-2 relative flex flex-col gap-1.5 transition-all ${
                        isEnemyTurn
                            ? "bg-gradient-to-br from-[#241315] via-[#1a1317] to-[#10121a] border-red-600/50"
                            : "bg-gradient-to-br from-[#1f1b13] via-[#181a24] to-[#10121a] border-[#c5a059]/50"
                    }`}
                >
                    <CornerFiligree position="tl" color={isEnemyTurn ? "#ef4444" : "#c5a059"} />
                    <CornerFiligree position="tr" color={isEnemyTurn ? "#ef4444" : "#c5a059"} />

                    {/* Portrait & Info */}
                    <div className="flex items-center gap-2">
                        <CombatantPortrait
                            participant={attacker}
                            size="sm"
                            showAc={true}
                            isDamaged={attackerDamaged}
                        />
                        <div className="flex-1 min-w-0">
                            <span className="text-[9px] uppercase font-cinzel font-bold tracking-wider text-slate-400 block truncate">
                                {isEnemyTurn ? "Opponent" : "Attacker"}
                            </span>
                            <h4 className="font-cinzel text-xs font-bold text-slate-100 truncate leading-tight">
                                {attacker?.name || "Active"}
                            </h4>
                            <span className="text-[9px] font-lora text-slate-400 truncate block">
                                {attacker?.character?.character_class?.name || (attacker?.participant_type === "enemy" ? "Hostile" : "Hero")}
                            </span>
                        </div>
                    </div>

                    {/* HP Bar */}
                    {attacker && (
                        <div className="w-full">
                            <div className="flex items-center justify-between text-[10px] font-fira-sans mb-0.5">
                                <span className="text-slate-400">HP</span>
                                <span className="font-bold text-emerald-400">
                                    {attacker.current_hp}/{attacker.max_hp}
                                </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-900 border border-slate-700/60 overflow-hidden">
                                <div
                                    className={`h-full bg-gradient-to-r ${hpBarGradient(attacker.current_hp, attacker.max_hp)} transition-all duration-300`}
                                    style={{
                                        width: `${Math.min(100, Math.max(0, (attacker.current_hp / (attacker.max_hp || 1)) * 100))}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Conditions */}
                    {attacker?.conditions && attacker.conditions.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                            {attacker.conditions.slice(0, 3).map((c: any, i: number) => (
                                <ConditionBadge key={i} condition={c} size="sm" />
                            ))}
                        </div>
                    )}
                </div>

                {/* Central VS Emblem (Col 6) */}
                <div className="col-span-1 flex flex-col items-center justify-center select-none py-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#242636] to-[#12131a] border border-[#c5a059]/60 flex items-center justify-center text-[#c5a059] font-cinzel font-black text-[10px] shadow-[0_0_12px_rgba(197,160,89,0.3)]">
                        VS
                    </div>
                </div>

                {/* Defender Panel (Col 7-11) */}
                <div
                    className={`col-span-5 rounded-lg border p-2 relative flex flex-col gap-1.5 transition-all ${
                        defender
                            ? "bg-gradient-to-bl from-[#221c14] via-[#181924] to-[#10121a] border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                            : "bg-[#141620]/60 border-dashed border-slate-800"
                    }`}
                >
                    <CornerFiligree position="tl" color="#f59e0b" />
                    <CornerFiligree position="tr" color="#f59e0b" />

                    {/* Portrait & Info */}
                    <div className="flex items-center gap-2">
                        <CombatantPortrait
                            participant={defender}
                            size="sm"
                            showAc={true}
                            isDamaged={defenderDamaged}
                        />
                        <div className="flex-1 min-w-0">
                            <span className="text-[9px] uppercase font-cinzel font-bold tracking-wider text-amber-300 block truncate">
                                Defender
                            </span>
                            <h4 className="font-cinzel text-xs font-bold text-slate-100 truncate leading-tight">
                                {defender?.name || "No Target"}
                            </h4>
                            <span className="text-[9px] font-lora text-slate-400 truncate block">
                                {defender?.participant_type === "enemy" ? "Opponent" : "Target"}
                            </span>
                        </div>
                    </div>

                    {/* HP Bar */}
                    {defender && (
                        <div className="w-full">
                            <div className="flex items-center justify-between text-[10px] font-fira-sans mb-0.5">
                                <span className="text-slate-400">HP</span>
                                <span
                                    className={`font-bold ${
                                        defender.current_hp <= 0 ? "text-red-500" : "text-amber-300"
                                    }`}
                                >
                                    {defender.current_hp <= 0 ? "💀 0" : `${defender.current_hp}/${defender.max_hp}`}
                                </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-900 border border-slate-700/60 overflow-hidden">
                                <div
                                    className={`h-full bg-gradient-to-r ${hpBarGradient(defender.current_hp, defender.max_hp)} transition-all duration-300`}
                                    style={{
                                        width: `${Math.min(100, Math.max(0, (defender.current_hp / (defender.max_hp || 1)) * 100))}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Conditions */}
                    {defender?.conditions && defender.conditions.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                            {defender.conditions.slice(0, 3).map((c: any, i: number) => (
                                <ConditionBadge key={i} condition={c} size="sm" />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Predictive Analysis & Combat Tags Footer */}
            {prediction && (
                <div className="mt-0.5 p-2 rounded-lg bg-[#12141f] border border-[#c5a059]/20 flex items-center justify-between text-[11px] font-lora">
                    <div className="flex items-center gap-2">
                        {prediction.hitChance != null && (
                            <div className="flex items-center gap-1">
                                <span className="text-slate-400">Hit:</span>
                                <span
                                    className={`font-fira-sans font-bold ${
                                        prediction.hitChance >= 70
                                            ? "text-emerald-400"
                                            : prediction.hitChance >= 45
                                            ? "text-amber-300"
                                            : "text-rose-400"
                                    }`}
                                >
                                    {prediction.hitChance}%
                                </span>
                            </div>
                        )}
                        {prediction.avgDamage != null && prediction.avgDamage > 0 && (
                            <div className="flex items-center gap-1">
                                <span className="text-slate-400">Avg Dmg:</span>
                                <span className="font-fira-sans font-bold text-red-400">
                                    ~{prediction.avgDamage}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                        {prediction.isAdvantage && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-cinzel font-bold bg-amber-950 border border-amber-500/60 text-amber-300">
                                ⚡ Advantage
                            </span>
                        )}
                        {prediction.isDisadvantage && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-cinzel font-bold bg-purple-950 border border-purple-500/60 text-purple-300">
                                ⚠️ Disadv
                            </span>
                        )}
                        {onInspectParticipant && defender && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onInspectParticipant(defender)}
                                className="h-5 px-1.5 text-[10px] text-amber-300 hover:text-white hover:bg-amber-950/40 border border-amber-500/30 font-cinzel font-semibold"
                            >
                                🔍 Inspect
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </aside>
    );
}
