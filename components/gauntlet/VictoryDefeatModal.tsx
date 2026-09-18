'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, Skull, Award, Swords, ArrowRight, ShieldCheck } from 'lucide-react';
import { GauntletRun } from '@/lib/types/gauntlet';

interface VictoryDefeatModalProps {
    run: GauntletRun;
    type: 'victory' | 'defeat';
    onClose?: () => void;
}

export function VictoryDefeatModal({ run, type, onClose }: VictoryDefeatModalProps) {
    const isVictory = type === 'victory';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
            <div className={`relative w-full max-w-lg bg-[#181a21] bg-[radial-gradient(ellipse_at_top,#1f232e_0%,#15171e_100%)] border-2 rounded-xl shadow-2xl p-6 text-center text-[#d1cdb8] ${
                isVictory ? 'border-[#c5a059] shadow-[0_0_30px_rgba(197,160,89,0.3)]' : 'border-rose-600/70 shadow-[0_0_30px_rgba(225,29,72,0.3)]'
            }`}>
                {/* Header Crest */}
                <div className="flex justify-center mb-3">
                    {isVictory ? (
                        <div className="w-16 h-16 rounded-full bg-[#c5a059]/20 border-2 border-[#c5a059] flex items-center justify-center shadow-[0_0_20px_rgba(197,160,89,0.4)]">
                            <Trophy className="w-9 h-9 text-[#c5a059]" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-rose-950/40 border-2 border-rose-500/70 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.4)]">
                            <Skull className="w-9 h-9 text-rose-500" />
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#c5a059]" />
                    <span className="text-[11px] text-[#c5a059] font-cinzel font-bold tracking-widest uppercase">
                        {isVictory ? 'GAUNTLET CONQUERED' : 'TRIAL CONCLUDED'}
                    </span>
                    <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#c5a059]" />
                </div>

                <h2 className={`text-2xl sm:text-3xl font-bold font-cinzel tracking-wider mb-2 ${
                    isVictory ? 'text-[#c5a059]' : 'text-rose-400'
                }`}>
                    {isVictory ? 'APEX VICTORY!' : 'PARTY DEFEATED'}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 font-lora italic mb-5">
                    {isVictory
                        ? `Magnificent triumph! Your heroes conquered all ${run.max_waves} waves of the Gauntlet.`
                        : `Your heroes fought valiantly until falling in Wave ${run.current_wave}.`}
                </p>

                {/* Score & Statistics Breakdown */}
                <div className="bg-[#0c0d12]/70 rounded-lg p-4 border border-slate-800 mb-5">
                    <div className="text-[11px] font-cinzel uppercase font-semibold text-slate-400 mb-2">
                        Official Arena Tally
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-2 bg-[#181a21] rounded border border-slate-700/50">
                            <div className="text-[10px] text-slate-400 font-cinzel">FINAL SCORE</div>
                            <div className="text-lg font-bold font-fira-sans text-[#c5a059]">
                                {run.score.toLocaleString()} PTS
                            </div>
                        </div>
                        <div className="p-2 bg-[#181a21] rounded border border-slate-700/50">
                            <div className="text-[10px] text-slate-400 font-cinzel">WAVES CLEARED</div>
                            <div className="text-lg font-bold font-fira-sans text-white">
                                {Math.max(0, isVictory ? run.current_wave : run.current_wave - 1)}
                            </div>
                        </div>
                        <div className="p-2 bg-[#181a21] rounded border border-slate-700/50">
                            <div className="text-[10px] text-slate-400 font-cinzel">ENEMIES SLAIN</div>
                            <div className="text-lg font-bold font-fira-sans text-emerald-400">
                                {run.enemies_killed}
                            </div>
                        </div>
                        <div className="p-2 bg-[#181a21] rounded border border-slate-700/50">
                            <div className="text-[10px] text-slate-400 font-cinzel">TURNS SURVIVED</div>
                            <div className="text-lg font-bold font-fira-sans text-slate-200">
                                {run.turns_elapsed}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Character Safety Reassurance Banner */}
                <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-center gap-2 text-xs text-emerald-300 font-lora mb-5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>All heroes return safely to your guild roster with full vitals refreshed.</span>
                </div>

                {/* Return Buttons */}
                <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                    <Link
                        href="/gauntlet"
                        className="px-5 py-2.5 rounded bg-[#c5a059] hover:bg-[#d6b16a] text-slate-950 font-cinzel font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                        <span>New Gauntlet Trial</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                        href="/characters"
                        className="px-5 py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-cinzel font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                        <span>View Guild Roster</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
