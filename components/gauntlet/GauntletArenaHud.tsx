'use client';

import React from 'react';
import { Trophy, Shield, Zap, Skull, Award } from 'lucide-react';
import { GauntletRun } from '@/lib/types/gauntlet';

interface GauntletArenaHudProps {
    run: GauntletRun | null;
    enemiesRemaining: number;
    onOpenRespite?: () => void;
}

export function GauntletArenaHud({ run, enemiesRemaining, onOpenRespite }: GauntletArenaHudProps) {
    if (!run) return null;

    const isEndless = run.is_endless || run.current_wave > 10;
    const waveLabel = isEndless ? `ENDLESS WAVE ${run.current_wave}` : `WAVE ${run.current_wave} / ${run.max_waves}`;
    const isWaveComplete = enemiesRemaining === 0 || run.status === 'respite';

    return (
        <div className="w-full bg-[#12141c]/95 border-b-2 border-[#c5a059]/40 backdrop-blur-md shadow-2xl py-2 px-4 sticky top-0 z-30 transition-all">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-lora">
                {/* Left: Gauntlet Title & Wave Indicator */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#c5a059]/20 border border-[#c5a059]/40 text-[#c5a059] font-cinzel font-bold tracking-wider">
                        <Trophy className="w-4 h-4 text-[#c5a059]" />
                        <span>GAUNTLET</span>
                    </div>

                    <div className={`px-3 py-1 rounded font-cinzel font-bold text-xs tracking-widest ${
                        isEndless
                            ? 'bg-purple-950/60 border border-purple-500/50 text-purple-300 animate-pulse'
                            : 'bg-amber-950/40 border border-amber-500/40 text-amber-200'
                    }`}>
                        {waveLabel}
                    </div>

                    <span className="text-slate-400 hidden md:inline">•</span>
                    <span className="text-slate-300 italic hidden md:inline truncate max-w-[200px]">{run.name}</span>
                </div>

                {/* Center: Enemies Left & Active Boons */}
                <div className="flex items-center gap-2">
                    {/* Enemies Remaining */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181a21] border border-slate-700/60 text-slate-200">
                        <Skull className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[11px] font-semibold text-slate-400">ENEMIES:</span>
                        <span className={`font-bold font-fira-sans ${enemiesRemaining === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {enemiesRemaining}
                        </span>
                    </div>

                    {/* Active Boons */}
                    {run.active_boons && run.active_boons.length > 0 && (
                        <div className="flex items-center gap-1">
                            {run.active_boons.map((boon, bIdx) => (
                                <span
                                    key={bIdx}
                                    title={boon.name}
                                    className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/50 text-[11px] text-emerald-300 font-semibold flex items-center gap-1"
                                >
                                    <Zap className="w-3 h-3 text-emerald-400" />
                                    <span>{boon.name}</span>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Score & Respite Action */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#0c0d12]/70 border border-[#c5a059]/30 font-fira-sans">
                        <Award className="w-4 h-4 text-[#c5a059]" />
                        <span className="text-[11px] font-semibold text-slate-400 font-cinzel">SCORE:</span>
                        <span className="font-bold text-[#c5a059] tracking-wider text-sm">
                            {run.score.toLocaleString()}
                        </span>
                    </div>

                    {isWaveComplete && onOpenRespite && (
                        <button
                            onClick={onOpenRespite}
                            className="px-3.5 py-1 rounded bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold font-cinzel text-xs tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all animate-bounce"
                        >
                            ✦ ENTER RESPITE ✦
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
