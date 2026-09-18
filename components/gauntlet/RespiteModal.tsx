'use client';

import React, { useState } from 'react';
import { Heart, Sparkles, Package, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { GauntletRun, RespiteChoiceType } from '@/lib/types/gauntlet';
import { gauntletApi } from '@/lib/api/gauntlet';

interface RespiteModalProps {
    run: GauntletRun;
    onWaveStarted: (nextSessionId: number) => void;
    onClaimVictory?: () => void;
    onEnterEndless?: () => void;
}

export function RespiteModal({ run, onWaveStarted, onClaimVictory, onEnterEndless }: RespiteModalProps) {
    const [selectedChoice, setSelectedChoice] = useState<RespiteChoiceType | null>(null);
    const [boonKind, setBoonKind] = useState<'ac_boost' | 'speed_boost' | 'advantage_first_strike'>('ac_boost');
    const [applying, setApplying] = useState(false);
    const [respiteApplied, setRespiteApplied] = useState(run.status === 'ready_for_wave');
    const [respiteMessage, setRespiteMessage] = useState<string>('');
    const [summoning, setSummoning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isWave10Victory = run.current_wave >= 10 && !run.is_endless;

    const handleApplyRespite = async () => {
        if (!selectedChoice) return;
        setApplying(true);
        setError(null);

        try {
            const resp = await gauntletApi.applyRespite(run.id, {
                choice_type: selectedChoice,
                details: selectedChoice === 'tactical_boon' ? { boon_kind: boonKind } : undefined,
            });

            setRespiteMessage(resp.data.result.message);
            setRespiteApplied(true);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to apply respite choice.');
        } finally {
            setApplying(false);
        }
    };

    const handleSummonNextWave = async () => {
        setSummoning(true);
        setError(null);

        try {
            const resp = await gauntletApi.nextWave(run.id);
            if (resp.data.combat_session_id) {
                onWaveStarted(resp.data.combat_session_id);
            }
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to summon next wave.');
            setSummoning(false);
        }
    };

    const choices = [
        {
            id: 'breather' as RespiteChoiceType,
            title: 'Take a Breather',
            icon: <Heart className="w-6 h-6 text-rose-400" />,
            badge: 'HP Recovery',
            description: 'Surviving heroes spend 1 Hit Die to bandage wounds and recover Hit Points.',
        },
        {
            id: 'arcane_surge' as RespiteChoiceType,
            title: 'Arcane Surge',
            icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
            badge: 'Spell Slots',
            description: 'Surge ambient leylines to restore 1 expended spell slot across spellcasters.',
        },
        {
            id: 'supply_drop' as RespiteChoiceType,
            title: 'Supply Drop',
            icon: <Package className="w-6 h-6 text-amber-400" />,
            badge: 'Emergency Salve',
            description: 'Open a battlefield apothecary chest to grant an instant healing salve to the most wounded ally.',
        },
        {
            id: 'tactical_boon' as RespiteChoiceType,
            title: 'Tactical Boon',
            icon: <Shield className="w-6 h-6 text-emerald-400" />,
            badge: 'Combat Buff',
            description: 'Prepare defenses or coordinate an ambush (+2 AC, +10ft speed, or First Strike Advantage).',
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#181a21] bg-[radial-gradient(ellipse_at_top,#1f232e_0%,#15171e_100%)] border-2 border-[#c5a059] rounded-xl shadow-2xl p-6 text-[#d1cdb8] scrollbar-thin scrollbar-thumb-[#c5a059]/30">
                {/* Header */}
                <div className="text-center border-b border-[#c5a059]/30 pb-4 mb-5">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c5a059]" />
                        <span className="text-xs text-[#c5a059] font-cinzel font-bold tracking-widest uppercase">
                            WAVE {run.current_wave} CLEARED
                        </span>
                        <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c5a059]" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-cinzel text-[#c5a059] tracking-wider">
                        INTER-WAVE RESPITE
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 font-lora italic mt-1 max-w-lg mx-auto">
                        Catch your breath, tend your wounds, and select one tactical boon before facing the next trial.
                    </p>
                </div>

                {/* Hero Vitals Bar */}
                <div className="mb-5 bg-[#0c0d12]/60 rounded-lg p-3 border border-slate-800">
                    <div className="text-[11px] font-cinzel uppercase font-semibold text-[#c5a059] mb-2">
                        Surviving Heroes Vitals:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {run.snapshot_heroes.map((hero) => {
                            const hpPercent = Math.max(0, Math.min(100, Math.round((hero.current_hp / hero.max_hp) * 100)));
                            return (
                                <div key={hero.id} className="p-2 bg-[#181a21] rounded border border-slate-700/60 text-xs font-lora">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white truncate">{hero.name}</span>
                                        <span className="text-[10px] text-slate-400 font-fira-sans">{hero.character_class} Lvl {hero.level}</span>
                                    </div>
                                    <div className="w-full bg-slate-900 rounded-full h-2 mb-1 overflow-hidden border border-slate-800">
                                        <div
                                            className={`h-full transition-all duration-300 ${
                                                hpPercent <= 25 ? 'bg-rose-500' : hpPercent <= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}
                                            style={{ width: `${hpPercent}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-fira-sans">
                                        <span>HP: <strong className="text-slate-200">{hero.current_hp} / {hero.max_hp}</strong></span>
                                        <span>Hit Dice: <strong className="text-amber-300">{hero.hit_dice_remaining}d</strong></span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Respite Choice Cards */}
                {!respiteApplied ? (
                    <div className="space-y-3 mb-6">
                        <div className="text-xs font-cinzel uppercase font-bold text-slate-200 mb-2">
                            Select 1 Respite Action:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {choices.map((c) => {
                                const isSelected = selectedChoice === c.id;
                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => setSelectedChoice(c.id)}
                                        className={`p-3.5 rounded-lg border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                            isSelected
                                                ? 'bg-amber-950/30 border-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.3)]'
                                                : 'bg-[#0c0d12]/70 border-slate-800 hover:border-slate-600'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    {c.icon}
                                                    <h3 className="font-cinzel font-bold text-sm text-white">{c.title}</h3>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-fira-sans">
                                                    {c.badge}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-300/90 font-lora leading-relaxed">
                                                {c.description}
                                            </p>
                                        </div>

                                        {/* Boon Type Selector */}
                                        {c.id === 'tactical_boon' && isSelected && (
                                            <div className="mt-3 pt-2 border-t border-slate-800/80">
                                                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                                                    Boon Specialty:
                                                </label>
                                                <select
                                                    value={boonKind}
                                                    onChange={(e) => setBoonKind(e.target.value as any)}
                                                    className="w-full bg-[#181a21] border border-[#c5a059]/50 rounded text-xs p-1.5 text-[#d1cdb8] focus:outline-none"
                                                >
                                                    <option value="ac_boost">Shield Wall (+2 AC in next wave)</option>
                                                    <option value="speed_boost">Windstride (+10 ft movement speed)</option>
                                                    <option value="advantage_first_strike">Ambush Instincts (Advantage on first strike)</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {error && (
                            <p className="text-xs text-rose-400 font-lora mt-2">{error}</p>
                        )}

                        <div className="pt-3 flex justify-end">
                            <button
                                disabled={!selectedChoice || applying}
                                onClick={handleApplyRespite}
                                className="px-5 py-2 rounded bg-[#c5a059] hover:bg-[#d6b16a] disabled:opacity-50 text-slate-950 font-cinzel font-bold text-xs tracking-wider transition-all cursor-pointer"
                            >
                                {applying ? 'Applying Boon...' : 'Confirm Respite Choice'}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Respite Confirmed - Next Wave Action */
                    <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-lg text-center mb-6 animate-in fade-in duration-300">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <h3 className="font-cinzel font-bold text-emerald-300 text-base mb-1">
                            Respite Prepared!
                        </h3>
                        <p className="text-xs text-slate-300 font-lora">
                            {respiteMessage || 'Party refreshed and tactical preparations complete.'}
                        </p>
                    </div>
                )}

                {/* Footer Controls / Summon Wave */}
                {respiteApplied && (
                    <div className="border-t border-[#c5a059]/30 pt-4 flex flex-wrap items-center justify-between gap-3">
                        {isWave10Victory ? (
                            <div className="w-full flex items-center justify-between gap-3">
                                <button
                                    onClick={onClaimVictory}
                                    className="px-5 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-cinzel font-bold text-xs tracking-wider transition-all"
                                >
                                    🏆 Claim Wave 10 Victory
                                </button>
                                <button
                                    onClick={onEnterEndless}
                                    className="px-5 py-2.5 rounded bg-purple-900 hover:bg-purple-800 border border-purple-400/50 text-purple-200 font-cinzel font-bold text-xs tracking-wider transition-all"
                                >
                                    ⚔️ Plunge into Endless Overtime
                                </button>
                            </div>
                        ) : (
                            <div className="w-full flex items-center justify-end">
                                <button
                                    disabled={summoning}
                                    onClick={handleSummonNextWave}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-sm tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
                                >
                                    <span>{summoning ? 'Summoning Wave...' : `Summon Wave ${run.current_wave + 1}`}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
