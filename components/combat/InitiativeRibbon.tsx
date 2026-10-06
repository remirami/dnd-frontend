"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import type { CombatParticipant } from "@/lib/types/combat";
import { resolveParticipantToken } from "@/lib/utils/tokenResolver";

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

            {/* Center: Dynamic Centered Initiative Track */}
            <div className="flex-1 flex items-center justify-center gap-2.5 sm:gap-3 overflow-x-auto py-1.5 px-2 scrollbar-thin scrollbar-thumb-[#c5a059]/20 scrollbar-track-transparent">
                {participants.map((p) => {
                    const isCurrent = currentParticipant?.id === p.id;
                    const isTarget = targetId === p.id.toString();
                    const isDead = p.current_hp <= 0;
                    const isPlayer = p.participant_type === 'character';
                    const isDamaged = damagedParticipantIds.has(p.id);
                    const isViewing = viewingParticipantId === p.id;
                    const hpPct = p.max_hp > 0 ? Math.max(0, Math.min(100, (p.current_hp / p.max_hp) * 100)) : 0;
                    const tokenInfo = resolveParticipantToken(p);

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
                            className={`relative group flex-shrink-0 rounded-xl transition-all duration-200 cursor-pointer border flex items-center gap-2.5 p-2 min-w-[175px] sm:min-w-[205px] h-17 sm:h-19 ${
                                isCurrent
                                    ? isPlayer
                                        ? 'bg-gradient-to-r from-[#1c2233] to-[#12141f] border-[#c5a059] shadow-[0_0_18px_rgba(197,160,89,0.5)] ring-2 ring-[#c5a059]/60 scale-105 z-10'
                                        : 'bg-gradient-to-r from-[#2c1418] to-[#180c0f] border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.5)] ring-2 ring-red-500/60 scale-105 z-10'
                                    : isTarget
                                        ? 'bg-[#221c17] border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                                        : isDead
                                            ? 'bg-[#0c0d12]/60 border-stone-800/80 opacity-40 grayscale'
                                            : isViewing
                                                ? 'bg-[#181a21] border-[#c5a059]/50'
                                                : 'bg-[#12141d]/90 border-slate-800/90 hover:border-[#c5a059]/40 hover:bg-[#181a24]'
                            }`}
                        >
                            {/* Turn Crown indicator */}
                            {isCurrent && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs drop-shadow-[0_0_6px_rgba(197,160,89,0.9)] animate-bounce z-20">
                                    👑
                                </span>
                            )}

                            {/* Left: Cameo Portrait with Initiative Badge */}
                            <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-slate-700/80 bg-black/60 shadow-md">
                                {tokenInfo.imageUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={tokenInfo.imageUrl}
                                        alt={p.name}
                                        className="w-full h-full object-cover object-[center_20%] select-none pointer-events-none"
                                    />
                                ) : (
                                    <span className="text-xl sm:text-2xl select-none filter drop-shadow">
                                        {tokenInfo.fallbackIcon}
                                    </span>
                                )}

                                {/* Initiative Badge on Portrait Corner */}
                                <span className={`absolute -bottom-1 -left-1 text-[9px] font-fira-sans font-bold px-1 rounded-full border shadow-xs ${
                                    isPlayer ? 'bg-amber-950/95 border-[#c5a059] text-amber-200' : 'bg-red-950/95 border-red-500 text-red-200'
                                }`}>
                                    {p.initiative}
                                </span>
                            </div>

                            {/* Right: Info Column */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                                {/* Top: Name & AC */}
                                <div className="flex items-center justify-between gap-1">
                                    <span className={`text-xs sm:text-sm font-cinzel font-bold truncate ${
                                        isDead ? 'line-through text-slate-500' : 'text-slate-100'
                                    }`}>
                                        {p.name}
                                    </span>
                                    {(() => {
                                        const effAc = p.effective_ac ?? p.armor_class;
                                        const hasBuffedAc = p.effective_ac != null && p.effective_ac > p.armor_class;
                                        const coverText = p.cover ? ` (+${p.cover.bonus} ${p.cover.source})` : '';
                                        return (
                                            <span
                                                className={`text-[10px] font-fira-sans font-bold px-1.5 py-0.2 rounded border flex-shrink-0 flex items-center gap-1 transition-colors ${
                                                    hasBuffedAc
                                                        ? 'text-emerald-300 bg-emerald-950/80 border-emerald-500/70 shadow-xs'
                                                        : 'text-amber-300 bg-amber-950/60 border-amber-700/40'
                                                }`}
                                                title={`Armor Class: ${effAc}${hasBuffedAc ? ` (Base: ${p.armor_class}${coverText})` : ''}`}
                                            >
                                                <span>🛡️</span>
                                                <span>{effAc}</span>
                                                {hasBuffedAc && (
                                                    <span className="text-[8px] text-emerald-400 font-extrabold leading-none">
                                                        +{effAc - p.armor_class}
                                                    </span>
                                                )}
                                            </span>
                                        );
                                    })()}

                                </div>

                                {/* Middle: HP Numeric + Target Badge */}
                                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-fira-sans font-bold">
                                    <span className={`${
                                        isDead ? 'text-red-400 font-extrabold' :
                                        hpPct > 50 ? 'text-emerald-400' :
                                        hpPct > 20 ? 'text-amber-400' :
                                        'text-rose-400 animate-pulse'
                                    }`}>
                                        {isDead ? '💀 FALLEN' : `HP ${p.current_hp}/${p.max_hp}`}
                                    </span>
                                    {isTarget && (
                                        <span className="text-amber-400 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider font-cinzel flex items-center gap-0.5">
                                            <span>🎯</span> TARGET
                                        </span>
                                    )}
                                </div>

                                {/* Bottom: Health Progress Bar */}
                                <div className="w-full h-1.5 sm:h-2 bg-black/90 rounded-full overflow-hidden border border-slate-700/80 shadow-inner">
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
                                <div className="absolute -bottom-1.5 right-2 flex items-center gap-0.5">
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
                {isEnemyTurn ? (
                    <div className="flex items-center gap-1.5">
                        {aiProcessing ? (
                            <div className="flex items-center gap-2 px-3 py-1 rounded bg-red-950/80 border border-red-500/70 text-red-200 font-cinzel text-xs font-semibold shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
                                <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                <span className="hidden sm:inline">AI Turn...</span>
                            </div>
                        ) : (
                            <Button
                                size="sm"
                                onClick={onAiTurn}
                                className="bg-red-900 hover:bg-red-800 border border-red-500 text-white font-cinzel text-xs h-8 px-3 cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                            >
                                🤖 AI Turn
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={onNextTurn}
                            disabled={aiProcessing}
                            className="bg-[#181a21] hover:bg-[#222638] border border-slate-700 text-slate-300 font-cinzel text-xs h-8 px-3 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Skip to next participant"
                        >
                            Skip →
                        </Button>
                    </div>
                ) : (
                    <Button
                        size="sm"
                        onClick={onNextTurn}
                        disabled={aiProcessing}
                        className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs uppercase tracking-wider h-8 px-4 rounded shadow-[0_0_15px_rgba(197,160,89,0.3)] hover:shadow-[0_0_20px_rgba(197,160,89,0.5)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        End Turn →
                    </Button>
                )}
            </div>
        </div>
    );
}
