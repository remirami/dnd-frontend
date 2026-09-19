import React, { useEffect, useRef, useState, useMemo } from 'react';
import { CombatAction, CombatParticipant } from '@/lib/types/combat';
import { X, ArrowUpRight, ArrowDownLeft, Swords } from 'lucide-react';

interface CombatLogProps {
    actions: CombatAction[];
    selectedParticipant?: CombatParticipant | null;
    onClearFilter?: () => void;
}

export function CombatLog({ actions, selectedParticipant, onClearFilter }: CombatLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [subFilter, setSubFilter] = useState<'all' | 'outgoing' | 'incoming'>('all');

    // Reset subFilter when selected participant changes
    useEffect(() => {
        setSubFilter('all');
    }, [selectedParticipant?.id]);

    // Check if participant is the actor
    const isActor = (action: CombatAction, participant: CombatParticipant) => {
        return action.actor === participant.id ||
            (!!action.actor_name && !!participant.name && action.actor_name.trim().toLowerCase() === participant.name.trim().toLowerCase());
    };

    // Check if participant is the target
    const isTarget = (action: CombatAction, participant: CombatParticipant) => {
        if (action.target === participant.id) return true;
        if (!!action.target_name && !!participant.name && action.target_name.trim().toLowerCase() === participant.name.trim().toLowerCase()) return true;
        // Also include AoE actions where participant is mentioned in the description
        if (!action.target && participant.name && action.description && action.description.toLowerCase().includes(participant.name.toLowerCase())) return true;
        return false;
    };

    // Filter calculations
    const participantActions = useMemo(() => {
        if (!selectedParticipant) return actions;
        return actions.filter(action => isActor(action, selectedParticipant) || isTarget(action, selectedParticipant));
    }, [actions, selectedParticipant]);

    const outgoingCount = useMemo(() => {
        if (!selectedParticipant) return 0;
        return actions.filter(action => isActor(action, selectedParticipant)).length;
    }, [actions, selectedParticipant]);

    const incomingCount = useMemo(() => {
        if (!selectedParticipant) return 0;
        return actions.filter(action => isTarget(action, selectedParticipant)).length;
    }, [actions, selectedParticipant]);

    const filteredActions = useMemo(() => {
        if (!selectedParticipant) return actions;
        if (subFilter === 'outgoing') {
            return actions.filter(action => isActor(action, selectedParticipant));
        }
        if (subFilter === 'incoming') {
            return actions.filter(action => isTarget(action, selectedParticipant));
        }
        return participantActions;
    }, [actions, selectedParticipant, subFilter, participantActions]);

    // Auto-scroll to bottom when new actions are added
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [filteredActions]);

    const formatAction = (action: CombatAction) => {
        const actorMatch = selectedParticipant ? isActor(action, selectedParticipant) : false;
        const targetMatch = selectedParticipant ? isTarget(action, selectedParticipant) : false;

        const parseAdvantageRoll = (desc: string) => {
            if (!desc) return null;
            const match = desc.match(/d20\s*\((advantage|disadvantage)\):\s*(\d+),\s*(\d+)\s*→\s*(\d+)/i);
            if (!match) return null;
            return {
                type: match[1].toLowerCase() as 'advantage' | 'disadvantage',
                die1: parseInt(match[2], 10),
                die2: parseInt(match[3], 10),
                chosen: parseInt(match[4], 10),
            };
        };

        const parsedAdv = parseAdvantageRoll(action.description);
        const isAdvantage = Boolean(
            action.is_advantage ||
            parsedAdv?.type === 'advantage' ||
            (action.description && /advantage/i.test(action.description) && !/disadvantage/i.test(action.description)) ||
            (action.description && /pack tactics/i.test(action.description))
        );
        const isDisadvantage = Boolean(
            action.is_disadvantage ||
            parsedAdv?.type === 'disadvantage' ||
            (action.description && /disadvantage/i.test(action.description))
        );

        if (action.action_type === 'attack') {
            return (
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Actor / Target names */}
                            <span className="font-lora text-sm font-semibold text-[#d1cdb8]">
                                <span className="text-[#c5a059] font-bold">{action.actor_name}</span>
                                <span className="text-[#d1cdb8]/50 text-xs font-normal mx-1.5">attacks</span>
                                <span className="font-bold">{action.target_name}</span>
                            </span>
                            {/* Action direction badge (when filtered) */}
                            {selectedParticipant && (
                                actorMatch ? (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-sm font-semibold font-lora bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 uppercase tracking-wider">
                                        <ArrowUpRight className="w-2.5 h-2.5" /> Took Action
                                    </span>
                                ) : targetMatch ? (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-sm font-semibold font-lora bg-[#a63a3a]/15 text-[#e57373] border border-[#a63a3a]/30 uppercase tracking-wider">
                                        <ArrowDownLeft className="w-2.5 h-2.5" /> Received
                                    </span>
                                ) : null
                            )}
                        </div>

                        {/* Round + Advantage/Disadvantage + Outcome badges */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                            <span className="text-[10px] font-fira-sans text-[#c5a059]/60 border border-[#c5a059]/20 px-1.5 py-0.5 rounded-sm bg-[#c5a059]/5 whitespace-nowrap">
                                Round {action.round_number}
                            </span>
                            {isAdvantage && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold font-fira-sans px-1.5 py-0.5 rounded-sm bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.35)] tracking-wider whitespace-nowrap">
                                    <span>🎲</span> ADV
                                </span>
                            )}
                            {isDisadvantage && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold font-fira-sans px-1.5 py-0.5 rounded-sm bg-purple-950/90 text-purple-300 border border-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.35)] tracking-wider whitespace-nowrap">
                                    <span>⚠️</span> DISADV
                                </span>
                            )}
                            {action.critical ? (
                                <span className="text-[10px] font-bold font-fira-sans px-2 py-0.5 rounded-sm bg-[#c5a059] text-[#0c0d12] shadow-[0_0_8px_rgba(197,160,89,0.5)]">
                                    CRITICAL!
                                </span>
                            ) : action.hit ? (
                                <span className="text-[10px] font-bold font-fira-sans px-2 py-0.5 rounded-sm bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40">
                                    HIT
                                </span>
                            ) : (
                                <span className="text-[10px] font-fira-sans px-2 py-0.5 rounded-sm bg-[#181a21] text-[#d1cdb8]/40 border border-[#d1cdb8]/15">
                                    MISS
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Attack details row */}
                    <div className="text-xs font-fira-sans text-[#d1cdb8]/75 flex items-center gap-2 flex-wrap">
                        {action.attack_name && <span className="text-[#d1cdb8] font-medium">{action.attack_name}</span>}
                        <span className="text-[#c5a059]/40">•</span>
                        <span>
                            Total:{" "}
                            <span className={action.critical ? "text-[#c5a059] font-bold" : "text-white font-semibold"}>
                                {action.attack_total}
                            </span>
                        </span>

                        {/* Detailed Roll breakdown */}
                        {parsedAdv ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#12141e] border border-[#c5a059]/25 text-[11px] font-mono">
                                <span className={parsedAdv.type === 'advantage' ? 'text-emerald-400 font-bold' : 'text-purple-400 font-bold'}>
                                    {parsedAdv.type === 'advantage' ? 'Advantage' : 'Disadvantage'}:
                                </span>
                                <span className="text-stone-400">[</span>
                                <span
                                    title={parsedAdv.die1 === parsedAdv.chosen ? "Chosen roll" : "Dropped roll"}
                                    className={parsedAdv.die1 === parsedAdv.chosen ? (parsedAdv.type === 'advantage' ? 'text-emerald-300 font-bold underline' : 'text-purple-300 font-bold underline') : 'text-stone-500 line-through'}
                                >
                                    {parsedAdv.die1}
                                </span>
                                <span className="text-stone-500">,</span>
                                <span
                                    title={(parsedAdv.die1 !== parsedAdv.chosen || parsedAdv.die1 === parsedAdv.die2) && parsedAdv.die2 === parsedAdv.chosen ? "Chosen roll" : "Dropped roll"}
                                    className={(parsedAdv.die1 !== parsedAdv.chosen || parsedAdv.die1 === parsedAdv.die2) && parsedAdv.die2 === parsedAdv.chosen ? (parsedAdv.type === 'advantage' ? 'text-emerald-300 font-bold underline' : 'text-purple-300 font-bold underline') : 'text-stone-500 line-through'}
                                >
                                    {parsedAdv.die2}
                                </span>
                                <span className="text-stone-400">]</span>
                                <span className="text-[#c5a059]">→</span>
                                <span className={parsedAdv.type === 'advantage' ? 'text-emerald-300 font-bold' : 'text-purple-300 font-bold'}>
                                    {parsedAdv.chosen}
                                </span>
                                {action.description.includes('|') && (
                                    <span className="text-[#d1cdb8]/60 ml-1">
                                        ({action.description.split('|')[1].trim()})
                                    </span>
                                )}
                            </div>
                        ) : action.description ? (
                            action.description.includes('|') ? (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#12141e] border border-[#c5a059]/20 text-[11px] font-mono text-[#d1cdb8]/85">
                                    <span>{action.description.split('|')[0].trim()}</span>
                                    <span className="text-[#d1cdb8]/50">
                                        ({action.description.split('|')[1].trim()})
                                    </span>
                                </div>
                            ) : (
                                <span className="text-[#d1cdb8]/75 text-[11px] font-lora">
                                    {action.description}
                                </span>
                            )
                        ) : null}
                    </div>

                    {/* Damage line */}
                    {action.hit && action.damage_amount !== undefined && (
                        <div className="font-fira-sans font-bold text-sm text-[#a63a3a]">
                            {action.damage_amount} damage
                            {action.damage_type && (
                                <span className="text-[#d1cdb8]/40 text-xs font-normal ml-1.5">
                                    ({action.damage_type})
                                </span>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        // Handle other action types
        return (
            <div className="flex justify-between items-start gap-2">
                <div>
                    <div className="flex items-center gap-2 flex-wrap font-lora text-sm">
                        <span className="text-[#c5a059] font-bold">{action.actor_name}</span>
                        <span className="text-[#d1cdb8]/50 text-xs">used {action.action_type_display || action.action_type}</span>
                        {action.target_name && (
                            <span className="text-[#d1cdb8]/50 text-xs">
                                on <span className="text-[#d1cdb8] font-medium">{action.target_name}</span>
                            </span>
                        )}
                        {selectedParticipant && (
                            actorMatch ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-sm font-semibold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 uppercase tracking-wider">
                                    <ArrowUpRight className="w-2.5 h-2.5" /> Took Action
                                </span>
                            ) : targetMatch ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-sm font-semibold bg-[#a63a3a]/15 text-[#e57373] border border-[#a63a3a]/30 uppercase tracking-wider">
                                    <ArrowDownLeft className="w-2.5 h-2.5" /> Received
                                </span>
                            ) : null
                        )}
                    </div>
                    {action.description && (
                        <div className="text-xs text-[#d1cdb8]/80 font-lora mt-1 bg-[#12141e] px-2 py-0.5 rounded border border-[#c5a059]/15 inline-block">
                            {action.description}
                        </div>
                    )}
                </div>
                <span className="text-[10px] font-fira-sans text-[#c5a059]/60 border border-[#c5a059]/20 px-1.5 py-0.5 rounded-sm bg-[#c5a059]/5 whitespace-nowrap shrink-0">
                    Round {action.round_number}
                </span>
            </div>
        );
    };

    const maxRound = actions.length > 0 ? Math.max(...actions.map(a => a.round_number || 1)) : 1;

    return (
        <div className="h-full flex flex-col min-h-0 bg-[#0c0d12]">
            {/* Log Header */}
            <div className="shrink-0 px-5 py-3 border-b border-[#c5a059]/20 bg-[#0e1017]">
                <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Swords className="w-4 h-4 text-[#c5a059]/70 shrink-0" />
                        <span className="font-cinzel-decorative text-sm font-bold text-[#c5a059] whitespace-nowrap tracking-wide">
                            Combat Log
                        </span>
                        {selectedParticipant && (
                            <span className="font-lora text-xs text-[#d1cdb8] bg-[#c5a059]/15 border border-[#c5a059]/30 px-2 py-0.5 rounded truncate max-w-[180px]">
                                {selectedParticipant.name}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {selectedParticipant && onClearFilter && (
                            <button
                                type="button"
                                onClick={onClearFilter}
                                className="text-xs text-[#d1cdb8]/60 hover:text-[#c5a059] flex items-center gap-1 bg-[#181a21] hover:bg-[#c5a059]/10 border border-[#c5a059]/20 hover:border-[#c5a059]/40 px-2.5 py-1 rounded transition-colors whitespace-nowrap font-lora cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                                <span>Clear Filter</span>
                            </button>
                        )}
                        <span className="text-[10px] font-fira-sans text-[#c5a059]/60 border border-[#c5a059]/20 px-2 py-0.5 rounded-sm bg-[#c5a059]/5 whitespace-nowrap">
                            {filteredActions.length} action{filteredActions.length === 1 ? '' : 's'}
                        </span>
                        <span className="text-[10px] font-fira-sans text-[#d1cdb8]/40 border border-[#d1cdb8]/10 px-2 py-0.5 rounded-sm whitespace-nowrap">
                            Max Round {maxRound}
                        </span>
                    </div>
                </div>

                {/* Sub-filter tabs when a participant is selected */}
                {selectedParticipant && (
                    <div className="flex items-center gap-1.5 pt-2.5 overflow-x-auto pb-0.5">
                        <button
                            type="button"
                            onClick={() => setSubFilter('all')}
                            className={`px-3 py-1 rounded text-xs font-medium font-lora transition-colors whitespace-nowrap border ${
                                subFilter === 'all'
                                    ? 'bg-[#c5a059] text-[#0c0d12] border-[#c5a059] shadow-[0_0_8px_rgba(197,160,89,0.3)]'
                                    : 'bg-[#181a21] text-[#d1cdb8]/60 border-[#c5a059]/25 hover:text-[#c5a059] hover:border-[#c5a059]/50'
                            }`}
                        >
                            All ({participantActions.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSubFilter('outgoing')}
                            className={`px-3 py-1 rounded text-xs font-medium font-lora transition-colors flex items-center gap-1 whitespace-nowrap border ${
                                subFilter === 'outgoing'
                                    ? 'bg-[#22c55e]/15 border-[#22c55e]/50 text-[#22c55e]'
                                    : 'bg-[#181a21] text-[#d1cdb8]/60 border-[#c5a059]/25 hover:text-[#22c55e] hover:border-[#22c55e]/30'
                            }`}
                        >
                            <ArrowUpRight className="w-3 h-3" />
                            Actions Taken ({outgoingCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSubFilter('incoming')}
                            className={`px-3 py-1 rounded text-xs font-medium font-lora transition-colors flex items-center gap-1 whitespace-nowrap border ${
                                subFilter === 'incoming'
                                    ? 'bg-[#a63a3a]/15 border-[#a63a3a]/50 text-[#e57373]'
                                    : 'bg-[#181a21] text-[#d1cdb8]/60 border-[#c5a059]/25 hover:text-[#e57373] hover:border-[#a63a3a]/30'
                            }`}
                        >
                            <ArrowDownLeft className="w-3 h-3" />
                            Received ({incomingCount})
                        </button>
                    </div>
                )}
            </div>

            {/* Scrollable Action List */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-0 min-h-0"
            >
                {filteredActions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-16 space-y-3">
                        <Swords className="w-10 h-10 text-[#c5a059]/20" />
                        <div className="font-lora text-sm font-medium text-[#d1cdb8]/50">
                            {selectedParticipant
                                ? `No ${subFilter === 'outgoing' ? 'actions taken' : subFilter === 'incoming' ? 'incoming actions' : 'actions'} recorded for ${selectedParticipant.name}`
                                : 'No actions recorded yet...'}
                        </div>
                        {selectedParticipant && (
                            <p className="text-xs text-[#d1cdb8]/30 font-lora italic">
                                Try switching sub-filters or click "Clear Filter" to view all actions.
                            </p>
                        )}
                    </div>
                ) : (
                    filteredActions.map((action, idx) => (
                        <div
                            key={action.id}
                            className={`py-3.5 ${
                                idx < filteredActions.length - 1
                                    ? 'border-b border-[#c5a059]/10'
                                    : ''
                            }`}
                        >
                            {formatAction(action)}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
