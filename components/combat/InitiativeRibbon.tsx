"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import type { CombatParticipant } from "@/lib/types/combat";

interface InitiativeRibbonProps {
    participants: CombatParticipant[];
    currentParticipant?: CombatParticipant | null;
    viewingParticipantId: number | null;
    targetId: string;
    onSelectTarget: (id: string) => void;
    onInspectParticipant: (p: CombatParticipant) => void;
    damagedParticipantIds: Set<number>;
    isEnemyTurn: boolean;
    gauntletRunId: number | null;
    aiProcessing: boolean;
    onAiTurn: () => void;
    onAutoEnemyTurns: () => void;
    onNextTurn: () => void;
    currentRound: number;
}

const hpColor = (current: number, max: number) => {
    if (max <= 0) return 'from-slate-600 to-slate-500';
    const pct = (current / max) * 100;
    if (pct > 50) return 'from-emerald-600 to-emerald-400';
    if (pct > 20) return 'from-amber-600 to-amber-400';
    return 'from-rose-600 to-rose-400';
};

export function InitiativeRibbon({
    participants,
    currentParticipant,
    viewingParticipantId,
    targetId,
    onSelectTarget,
    onInspectParticipant,
    damagedParticipantIds,
    isEnemyTurn,
    gauntletRunId,
    aiProcessing,
    onAiTurn,
    onAutoEnemyTurns,
    onNextTurn,
    currentRound,
}: InitiativeRibbonProps) {
    return (
        <div className="w-full bg-[#10121a]/95 border-b border-[#c5a059]/25 backdrop-blur-md px-4 py-2 flex items-center justify-between gap-4 z-20 select-none shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            {/* Left: Round & Combatant Count */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className="px-2.5 py-1 rounded bg-[#181a21] border border-[#c5a059]/30 text-[#c5a059] font-cinzel text-xs font-bold tracking-wider shadow-[0_0_10px_rgba(197,160,89,0.15)] flex items-center gap-1.5">
                    <span className="text-[10px] text-[#c5a059]/70">ROUND</span>
                    <span className="font-fira-sans text-sm text-[#e0bc75]">{currentRound}</span>
                </div>
                <span className="text-[11px] text-[#d1cdb8]/60 font-lora hidden sm:inline">
                    {participants.length} combatants
                </span>
            </div>

            {/* Center: Scrollable Initiative Track */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-[#c5a059]/20 scrollbar-track-transparent">
                {participants.map((p) => {
                    const isCurrent = currentParticipant?.id === p.id;
                    const isTarget = targetId === p.id.toString();
                    const isDead = p.current_hp <= 0;
                    const isPlayer = p.participant_type === 'character';
                    const isDamaged = damagedParticipantIds.has(p.id);
                    const isViewing = viewingParticipantId === p.id;
                    const hpPct = p.max_hp > 0 ? Math.max(0, Math.min(100, (p.current_hp / p.max_hp) * 100)) : 0;

                    return (
                        <div
                            key={p.id}
                            onClick={() => {
                                // If alive and opponent, select as target; otherwise inspect
                                if (!isDead && currentParticipant) {
                                    const oppType = currentParticipant.participant_type === 'character' ? 'enemy' : 'character';
                                    if (p.participant_type === oppType) {
                                        onSelectTarget(p.id.toString());
                                    }
                                }
                                onInspectParticipant(p);
                            }}
                            className={`relative group flex-shrink-0 rounded-md transition-all duration-200 cursor-pointer border flex flex-col justify-between p-1.5 w-32 sm:w-36 h-14 ${
                                isCurrent
                                    ? isPlayer
                                        ? 'bg-[#1a1f2c] border-[#c5a059] shadow-[0_0_14px_rgba(197,160,89,0.45)] ring-1 ring-[#c5a059]/50 scale-[1.02]'
                                        : 'bg-[#281518] border-red-500 shadow-[0_0_14px_rgba(239,68,68,0.45)] ring-1 ring-red-500/50 scale-[1.02]'
                                    : isTarget
                                        ? 'bg-[#221c17] border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                                        : isDead
                                            ? 'bg-[#0c0d12]/50 border-stone-800/80 opacity-40 grayscale'
                                            : isViewing
                                                ? 'bg-[#181a21] border-[#c5a059]/50'
                                                : 'bg-[#141620]/80 border-slate-800 hover:border-[#c5a059]/40 hover:bg-[#181a21]'
                            }`}
                        >
                            {/* Turn Arrow indicator */}
                            {isCurrent && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#c5a059]" />
                            )}

                            {/* Top row: Init badge, name, AC */}
                            <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={`text-[10px] font-fira-sans font-bold px-1 rounded ${
                                        isPlayer ? 'bg-[#c5a059]/20 text-[#c5a059]' : 'bg-red-950/60 text-red-300'
                                    }`}>
                                        {p.initiative}
                                    </span>
                                    <span className={`text-xs font-lora font-semibold truncate ${
                                        isDead ? 'line-through text-slate-500' : 'text-slate-200'
                                    }`}>
                                        {p.name}
                                    </span>
                                </div>
                                <span className="text-[10px] font-fira-sans text-[#c5a059]/90 flex-shrink-0 flex items-center">
                                    🛡{p.armor_class}
                                </span>
                            </div>

                            {/* Bottom row: HP Bar & numerical values */}
                            <div className="space-y-0.5 mt-auto">
                                <div className="flex items-center justify-between text-[9px] font-fira-sans text-[#d1cdb8]/70">
                                    <span>{isDead ? 'DEAD' : `${p.current_hp}/${p.max_hp}`}</span>
                                    {isTarget && (
                                        <span className="text-amber-400 text-[8px] font-bold uppercase tracking-wider font-cinzel">
                                            🎯 Target
                                        </span>
                                    )}
                                </div>
                                <div className="w-full h-1 bg-[#0c0d12] rounded-full overflow-hidden border border-slate-800/80">
                                    <div
                                        className={`h-full transition-all duration-300 bg-gradient-to-r ${
                                            isDamaged ? 'from-red-600 to-red-400 animate-pulse' : hpColor(p.current_hp, p.max_hp)
                                        }`}
                                        style={{ width: `${hpPct}%` }}
                                    />
                                </div>
                            </div>

                            {/* Mini conditions row */}
                            {p.conditions && p.conditions.length > 0 && (
                                <div className="absolute -bottom-2 right-1 flex items-center gap-0.5">
                                    {p.conditions.slice(0, 2).map((c: any, cI: number) => (
                                        <span
                                            key={cI}
                                            title={typeof c === 'string' ? c : c.name}
                                            className="w-3.5 h-3.5 rounded-full bg-red-950 border border-red-500 text-[8px] flex items-center justify-center text-red-200 shadow-sm"
                                        >
                                            !
                                        </span>
                                    ))}
                                    {p.conditions.length > 2 && (
                                        <span className="text-[8px] text-slate-400 font-bold font-fira-sans">
                                            +{p.conditions.length - 2}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Right: Turn Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {isEnemyTurn && (
                    gauntletRunId ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-950/70 border border-red-500/60 text-red-200 font-cinzel text-xs font-semibold shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse">
                            <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            <span className="hidden sm:inline">AI Turn...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <Button
                                size="sm"
                                onClick={onAiTurn}
                                disabled={aiProcessing}
                                className="bg-red-950/60 hover:bg-red-900 border border-red-500/50 text-red-200 text-xs h-8 px-3"
                            >
                                {aiProcessing ? '...' : '🤖 AI'}
                            </Button>
                            <Button
                                size="sm"
                                onClick={onAutoEnemyTurns}
                                disabled={aiProcessing}
                                className="bg-[#181a21] hover:bg-red-950/40 border border-red-500/40 text-red-300 text-xs h-8 px-2.5"
                            >
                                ⚡ All
                            </Button>
                        </div>
                    )
                )}

                {(!isEnemyTurn || !gauntletRunId) && (
                    <Button
                        size="sm"
                        onClick={onNextTurn}
                        className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs uppercase tracking-wider h-8 px-4 rounded shadow-[0_0_15px_rgba(197,160,89,0.3)] hover:shadow-[0_0_20px_rgba(197,160,89,0.5)] transition-all cursor-pointer"
                    >
                        End Turn →
                    </Button>
                )}
            </div>
        </div>
    );
}
