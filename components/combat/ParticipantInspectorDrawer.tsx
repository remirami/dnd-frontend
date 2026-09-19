"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ConditionBadge } from "@/components/combat/ConditionBadge";
import type { CombatParticipant } from "@/lib/types/combat";

interface ParticipantInspectorDrawerProps {
    participant?: CombatParticipant | null;
    onClose: () => void;
    onOpenStatblock: (p: CombatParticipant) => void;
}

const hpGrad = (cur: number, max: number) => {
    if (max <= 0) return 'from-slate-600 to-slate-500';
    const pct = (cur / max) * 100;
    if (pct > 50) return 'from-emerald-500 to-emerald-400';
    if (pct > 20) return 'from-amber-500 to-amber-400';
    return 'from-rose-600 to-rose-400';
};

export function ParticipantInspectorDrawer({
    participant,
    onClose,
    onOpenStatblock,
}: ParticipantInspectorDrawerProps) {
    if (!participant) return null;

    const hpPct = participant.max_hp > 0 ? (participant.current_hp / participant.max_hp) * 100 : 0;
    const isPlayer = participant.participant_type === 'character';

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#10121a]/98 border-l border-[#c5a059]/40 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250 font-lora">
            {/* Header */}
            <div className="px-5 py-4 bg-[#151722] border-b border-[#c5a059]/20 flex items-center justify-between">
                <div>
                    <h3 className="font-cinzel text-lg font-bold text-[#c5a059] tracking-wide">
                        {participant.name}
                    </h3>
                    <p className="text-xs text-[#d1cdb8]/60 mt-0.5 font-lora">
                        {isPlayer ? 'Player Character' : 'Enemy Hostile'}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white text-sm p-1.5 rounded hover:bg-slate-800 font-bold cursor-pointer transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Vitals & HP */}
                <div className="space-y-2 bg-[#181a24] p-4 rounded-lg border border-[#c5a059]/20">
                    <div className="flex justify-between text-xs font-fira-sans mb-1 text-[#d1cdb8]/80">
                        <span className="font-lora">Hit Points</span>
                        <span className="font-bold text-slate-100">
                            {participant.current_hp} <span className="text-[#d1cdb8]/50">/ {participant.max_hp}</span>
                        </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#0c0d12] rounded-full overflow-hidden border border-[#c5a059]/20">
                        <div
                            className={`h-full transition-all duration-300 bg-gradient-to-r ${hpGrad(participant.current_hp, participant.max_hp)}`}
                            style={{ width: `${Math.max(0, Math.min(100, hpPct))}%` }}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                        <div className="p-2 rounded bg-[#0c0d12]/60 border border-slate-800">
                            <span className="text-[10px] uppercase text-slate-400 block font-lora">Armor Class</span>
                            <span className="font-fira-sans font-bold text-base text-[#e0bc75]">🛡 {participant.armor_class}</span>
                        </div>
                        <div className="p-2 rounded bg-[#0c0d12]/60 border border-slate-800">
                            <span className="text-[10px] uppercase text-slate-400 block font-lora">Initiative</span>
                            <span className="font-fira-sans font-bold text-base text-[#e0bc75]">{participant.initiative}</span>
                        </div>
                        <div className="p-2 rounded bg-[#0c0d12]/60 border border-slate-800">
                            <span className="text-[10px] uppercase text-slate-400 block font-lora">Attacks</span>
                            <span className="font-fira-sans font-bold text-base text-emerald-400">{participant.attacks_remaining}</span>
                        </div>
                    </div>
                </div>

                {/* Active Conditions */}
                {participant.conditions && participant.conditions.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#c5a059]">
                            Active Conditions
                        </h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {participant.conditions.map((c: any, i: number) => (
                                <ConditionBadge key={i} condition={c} size="md" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Ability Scores Grid */}
                {participant.enemy_stats?.ability_scores && (
                    <div className="space-y-2">
                        <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#c5a059]">
                            Ability Scores
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(participant.enemy_stats.ability_scores).map(([ability, data]: [string, any]) => (
                                <div key={ability} className="bg-[#181a24] rounded border border-[#c5a059]/20 text-center p-2">
                                    <p className="text-[10px] font-bold text-[#d1cdb8]/60 uppercase">{ability.slice(0, 3)}</p>
                                    <p className="text-base font-bold font-fira-sans text-[#c5a059]">{data.score}</p>
                                    <p className={`text-xs font-fira-sans font-bold ${data.modifier >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {data.modifier >= 0 ? '+' : ''}{data.modifier}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Equipped Items (if player character) */}
                {participant.equipped_items && (
                    <div className="space-y-2">
                        <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#c5a059]">
                            Equipped Gear
                        </h4>
                        <div className="flex flex-col gap-1.5">
                            {participant.equipped_items.weapon && (
                                <div className="px-3 py-2 rounded bg-[#181a24] border border-[#c5a059]/20 text-xs flex items-center justify-between">
                                    <span className="text-[#e0bc75] font-semibold">⚔️ {participant.equipped_items.weapon.name}</span>
                                    <span className="text-slate-400 font-fira-sans">{participant.equipped_items.weapon.damage_dice}</span>
                                </div>
                            )}
                            {participant.equipped_items.armor && (
                                <div className="px-3 py-2 rounded bg-[#181a24] border border-[#c5a059]/20 text-xs flex items-center justify-between">
                                    <span className="text-slate-200">🛡 {participant.equipped_items.armor.name}</span>
                                </div>
                            )}
                            {participant.equipped_items.shield && (
                                <div className="px-3 py-2 rounded bg-[#181a24] border border-[#c5a059]/20 text-xs flex items-center justify-between">
                                    <span className="text-slate-200">🛡 {participant.equipped_items.shield.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Monster Statblock Button */}
                {!isPlayer && (
                    <div className="pt-2">
                        <Button
                            onClick={() => onOpenStatblock(participant)}
                            className="w-full bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#e0bc75] border border-[#c5a059]/50 font-cinzel text-xs font-bold py-2 h-10 shadow-[0_0_15px_rgba(197,160,89,0.15)]"
                        >
                            📜 View Full 5e Stat Block
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
