'use client';

import React from 'react';
import { CombatParticipant } from '@/lib/types/combat';

interface MonsterStatblockModalProps {
    participant?: CombatParticipant | null;
    onClose: () => void;
}

export function MonsterStatblockModal({ participant, onClose }: MonsterStatblockModalProps) {
    if (!participant) return null;

    const stats = participant.enemy_stats;
    const actions = participant.enemy_actions || [];
    const traits = participant.enemy_traits || [];
    const multiattack = participant.multiattack;
    const rechargeState = participant.recharge_state || {};
    const resistances = participant.enemy_resistances || [];

    const formatModifier = (score: number = 10) => {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Backdrop click */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Modal Card */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#181a21] border-2 border-[#c5a059] rounded-xl shadow-2xl p-6 text-[#d1cdb8] z-10 scrollbar-thin scrollbar-thumb-[#c5a059]/30">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-[#c5a059] text-xl font-bold p-1 transition-colors"
                    aria-label="Close"
                >
                    ✕
                </button>

                {/* Header */}
                <div className="border-b border-[#c5a059]/40 pb-3 mb-3">
                    <h2 className="text-2xl sm:text-3xl font-bold font-cinzel text-[#c5a059] tracking-wide">
                        {participant.name}
                    </h2>
                    <p className="text-xs sm:text-sm italic text-slate-400 font-lora">
                        Challenge Rating: <span className="text-[#c5a059] font-semibold">{participant.character?.level || '—'}</span>
                    </p>
                </div>

                {/* Top Vitals */}
                <div className="space-y-1.5 text-sm font-lora pb-3 border-b border-[#a63a3a]/40 mb-4">
                    <div>
                        <strong className="text-white">Armor Class:</strong>{' '}
                        <span className="text-[#c5a059] font-bold font-fira-sans">{participant.armor_class}</span>
                        {participant.effective_ac && participant.effective_ac !== participant.armor_class && (
                            <span className="text-xs text-slate-400 ml-1.5">(Effective: {participant.effective_ac})</span>
                        )}
                    </div>
                    <div>
                        <strong className="text-white">Hit Points:</strong>{' '}
                        <span className="text-emerald-400 font-bold font-fira-sans">
                            {participant.current_hp} / {participant.max_hp}
                        </span>
                    </div>
                    {stats?.speed && (
                        <div>
                            <strong className="text-white">Speed:</strong> <span>{stats.speed}</span>
                        </div>
                    )}
                </div>

                {/* Ability Scores Table */}
                {stats?.ability_scores && (
                    <div className="mb-4 bg-[#0c0d12]/60 rounded-lg p-3 border border-[#c5a059]/20">
                        <div className="grid grid-cols-6 gap-2 text-center">
                            {[
                                { label: 'STR', val: stats.ability_scores.strength },
                                { label: 'DEX', val: stats.ability_scores.dexterity },
                                { label: 'CON', val: stats.ability_scores.constitution },
                                { label: 'INT', val: stats.ability_scores.intelligence },
                                { label: 'WIS', val: stats.ability_scores.wisdom },
                                { label: 'CHA', val: stats.ability_scores.charisma },
                            ].map(({ label, val }) => (
                                <div key={label} className="p-1.5 bg-[#181a21]/80 rounded border border-slate-700/50">
                                    <div className="text-[11px] font-bold text-[#c5a059] tracking-wider">{label}</div>
                                    <div className="text-base font-bold font-fira-sans text-white">{val?.score ?? 10}</div>
                                    <div className="text-xs text-slate-400 font-fira-sans">
                                        ({val?.modifier !== undefined ? (val.modifier >= 0 ? `+${val.modifier}` : `${val.modifier}`) : formatModifier(10)})
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Saving Throws, Senses, Resistances */}
                <div className="space-y-1.5 text-xs sm:text-sm font-lora border-b border-[#a63a3a]/40 pb-3 mb-4">
                    {stats?.saving_throws && (
                        <div>
                            <strong className="text-white">Saving Throws:</strong>{' '}
                            <span className="text-slate-300">
                                {Object.entries(stats.saving_throws)
                                    .filter(([_, bonus]) => bonus !== null && bonus !== undefined)
                                    .map(([ab, bonus]) => `${ab.toUpperCase()} ${bonus! >= 0 ? `+${bonus}` : bonus}`)
                                    .join(', ') || 'Standard ability modifiers'}
                            </span>
                        </div>
                    )}
                    {resistances.length > 0 && (
                        <div>
                            <strong className="text-white">Resistances & Immunities:</strong>{' '}
                            <span className="text-amber-300/80">
                                {resistances.map(r => `${r.type}: ${r.damage_type}`).join('; ')}
                            </span>
                        </div>
                    )}
                    {stats?.senses && (
                        <div>
                            <strong className="text-white">Senses:</strong>{' '}
                            <span className="text-slate-300">
                                {[
                                    stats.senses.darkvision ? `Darkvision ${stats.senses.darkvision}` : null,
                                    stats.senses.blindsight ? `Blindsight ${stats.senses.blindsight}` : null,
                                    stats.senses.passive_perception ? `Passive Perception ${stats.senses.passive_perception}` : null,
                                ].filter(Boolean).join(', ') || 'Normal'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Traits Section */}
                {traits.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-[#c5a059] border-b border-[#c5a059]/20 pb-1 mb-2 font-cinzel">
                            Special Traits
                        </h3>
                        <div className="space-y-2 text-xs sm:text-sm font-lora">
                            {traits.map((t, idx) => (
                                <div key={idx} className="bg-[#0c0d12]/40 p-2 rounded border border-slate-800">
                                    <strong className="text-[#c5a059] italic">{t.name}.</strong>{' '}
                                    <span className="text-slate-300">{t.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions Section */}
                <div>
                    <h3 className="text-xs uppercase tracking-widest font-bold text-[#c5a059] border-b border-[#c5a059]/20 pb-1 mb-2 font-cinzel">
                        Actions
                    </h3>

                    {/* Multiattack Display */}
                    {multiattack && (
                        <div className="mb-3 p-2.5 bg-amber-950/20 border border-[#c5a059]/30 rounded-lg text-xs sm:text-sm font-lora">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40 rounded text-[11px] font-bold">
                                    Multiattack ({multiattack.action_count} Attacks)
                                </span>
                            </div>
                            <p className="text-slate-300">{multiattack.description || 'The creature makes multiple attacks on its turn.'}</p>
                        </div>
                    )}

                    {/* Action Cards */}
                    <div className="space-y-2.5">
                        {actions.length > 0 ? (
                            actions.map((act) => {
                                const isReady = act.has_recharge ? (rechargeState[act.name] !== false) : true;
                                return (
                                    <div
                                        key={act.id}
                                        className={`p-3 rounded-lg border transition-all ${
                                            act.has_recharge
                                                ? isReady
                                                    ? 'bg-amber-950/20 border-amber-600/40'
                                                    : 'bg-slate-900/30 border-slate-800 opacity-60'
                                                : 'bg-[#0c0d12]/50 border-slate-800 hover:border-[#c5a059]/40'
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-sm sm:text-base font-cinzel">
                                                    {act.name}
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                                    {act.attack_type_display || act.attack_type}
                                                </span>
                                            </div>

                                            {/* Recharge Pill */}
                                            {act.has_recharge && (
                                                <span
                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                        isReady
                                                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                                                            : 'bg-red-950/80 text-red-300 border border-red-500/50'
                                                    }`}
                                                >
                                                    {isReady ? '✦ Ready' : `Recharging (${act.recharge_min_roll}-6)`}
                                                </span>
                                            )}
                                        </div>

                                        {/* Action Metrics */}
                                        <div className="flex flex-wrap gap-3 text-xs text-slate-400 font-fira-sans mb-1.5">
                                            {act.attack_bonus !== null && act.attack_bonus !== undefined && (
                                                <div>
                                                    <span className="text-slate-500">Hit:</span>{' '}
                                                    <span className="text-[#c5a059] font-bold">
                                                        {act.attack_bonus >= 0 ? `+${act.attack_bonus}` : act.attack_bonus}
                                                    </span>
                                                </div>
                                            )}
                                            {act.reach_or_range && (
                                                <div>
                                                    <span className="text-slate-500">Range:</span>{' '}
                                                    <span className="text-slate-300">{act.reach_or_range}</span>
                                                </div>
                                            )}
                                            {act.saving_throw_dc && (
                                                <div>
                                                    <span className="text-slate-500">Save:</span>{' '}
                                                    <span className="text-amber-400 font-bold">
                                                        DC {act.saving_throw_dc} {act.saving_throw_ability}
                                                    </span>
                                                    {act.half_damage_on_save && (
                                                        <span className="text-[10px] text-slate-400 ml-1">(half on save)</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Damage formulas */}
                                        {act.damage_rolls && act.damage_rolls.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 my-1.5">
                                                {act.damage_rolls.map((dmg: any, dIdx: number) => (
                                                    <span
                                                        key={dIdx}
                                                        className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-xs font-fira-sans text-amber-200"
                                                    >
                                                        {dmg.formula}
                                                        {dmg.is_secondary && <span className="text-slate-400 text-[10px] ml-1">(rider)</span>}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Conditions */}
                                        {((act.conditions_inflicted_names && act.conditions_inflicted_names.length > 0) || ((act as any).conditions_inflicted && (act as any).conditions_inflicted.length > 0)) && (
                                            <div className="text-xs text-red-400/90 font-lora mt-1">
                                                <span>Inflicts condition: </span>
                                                <strong>
                                                    {((act.conditions_inflicted_names || (act as any).conditions_inflicted) || [])
                                                        .map((c: any) => typeof c === 'string' ? c : c?.name || '')
                                                        .filter(Boolean)
                                                        .join(', ')}
                                                </strong>
                                            </div>
                                        )}

                                        {act.description && (
                                            <p className="text-xs text-slate-300/90 font-lora mt-1.5 leading-relaxed">
                                                {act.description}
                                            </p>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            /* Fallback to enemy_attacks if actions not populated */
                            participant.enemy_attacks?.map((atk, idx) => (
                                <div key={idx} className="p-2.5 bg-[#0c0d12]/50 rounded-lg border border-slate-800 flex justify-between items-center">
                                    <span className="font-bold text-white font-cinzel text-sm">{atk.name}</span>
                                    <div className="text-xs font-fira-sans">
                                        <span className="text-[#c5a059] font-bold mr-2">+{atk.bonus} to hit</span>
                                        <span className="text-slate-300">{atk.damage}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
