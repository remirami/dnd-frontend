import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CombatAction, CombatParticipant } from '@/lib/types/combat';
import { X, ArrowUpRight, ArrowDownLeft } from "lucide-react";

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
        return action.target === participant.id ||
            (!!action.target_name && !!participant.name && action.target_name.trim().toLowerCase() === participant.name.trim().toLowerCase());
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

        if (action.action_type === 'attack') {
            return (
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-200">
                                {action.actor_name} <span className="text-slate-500 text-sm font-normal">attacks</span> {action.target_name}
                            </span>
                            {selectedParticipant && (
                                actorMatch ? (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                                        <ArrowUpRight className="w-2.5 h-2.5" /> Action Taken
                                    </span>
                                ) : targetMatch ? (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium bg-rose-950/80 text-rose-400 border border-rose-800/60">
                                        <ArrowDownLeft className="w-2.5 h-2.5" /> Received
                                    </span>
                                ) : null
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700/80 py-0 px-1.5 font-normal">
                                Round {action.round_number}
                            </Badge>
                            {action.critical ? (
                                <Badge variant="destructive" className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold text-xs py-0">CRITICAL!</Badge>
                            ) : action.hit ? (
                                <Badge variant="default" className="bg-green-700 hover:bg-green-800 text-xs py-0">HIT</Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs py-0">MISS</Badge>
                            )}
                        </div>
                    </div>

                    <div className="text-sm text-slate-400 flex items-center gap-2">
                        <span>{action.attack_name}</span>
                        <span className="text-slate-600">•</span>
                        <span>Roll: <span className={action.critical ? "text-yellow-500 font-bold" : "text-white"}>{action.attack_total}</span></span>
                        {action.description && (
                            <span className="text-xs text-slate-600">({action.description.split('|')[0].trim()})</span>
                        )}
                    </div>

                    {action.hit && action.damage_amount !== undefined && (
                        <div className="text-rose-400 font-semibold text-sm mt-0.5">
                            {action.damage_amount} damage
                            {action.damage_type && <span className="text-slate-500 text-xs font-normal ml-1">({action.damage_type})</span>}
                        </div>
                    )}
                </div>
            );
        }

        // Handle other action types
        return (
            <div className="flex justify-between items-start gap-2">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-200">{action.actor_name}</span>
                        <span className="text-slate-400 text-sm">used {action.action_type_display || action.action_type}</span>
                        {action.target_name && (
                            <span className="text-slate-400 text-sm">on <span className="text-slate-200 font-medium">{action.target_name}</span></span>
                        )}
                        {selectedParticipant && (
                            actorMatch ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                                    <ArrowUpRight className="w-2.5 h-2.5" /> Action Taken
                                </span>
                            ) : targetMatch ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium bg-rose-950/80 text-rose-400 border border-rose-800/60">
                                    <ArrowDownLeft className="w-2.5 h-2.5" /> Received
                                </span>
                            ) : null
                        )}
                    </div>
                    {action.description && <div className="text-sm text-slate-400 mt-1">{action.description}</div>}
                </div>
                <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700/80 py-0 px-1.5 font-normal shrink-0">
                    Round {action.round_number}
                </Badge>
            </div>
        );
    };

    const maxRound = actions.length > 0 ? Math.max(...actions.map(a => a.round_number || 1)) : 1;

    return (
        <Card className="bg-slate-900 border-slate-700 h-[600px] flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-slate-200 text-lg flex items-center gap-2">
                        <span>Combat Log</span>
                        {selectedParticipant && (
                            <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-normal">
                                {selectedParticipant.name}
                            </Badge>
                        )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {selectedParticipant && onClearFilter && (
                            <button
                                type="button"
                                onClick={onClearFilter}
                                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                            >
                                <X className="w-3 h-3" />
                                <span>Clear Filter</span>
                            </button>
                        )}
                        <Badge variant="outline" className="text-slate-400 border-slate-700 font-normal text-xs">
                            {filteredActions.length} action{filteredActions.length === 1 ? '' : 's'}
                        </Badge>
                        <Badge variant="outline" className="text-slate-500 border-slate-800 font-normal text-xs">
                            Max Round {maxRound}
                        </Badge>
                    </div>
                </div>

                {/* Sub-filter tabs when a participant is selected */}
                {selectedParticipant && (
                    <div className="flex items-center gap-1.5 pt-1">
                        <button
                            type="button"
                            onClick={() => setSubFilter('all')}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                subFilter === 'all'
                                    ? 'bg-slate-700 text-white shadow-sm'
                                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                        >
                            All ({participantActions.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSubFilter('outgoing')}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                                subFilter === 'outgoing'
                                    ? 'bg-emerald-900/60 border border-emerald-600/60 text-emerald-200 shadow-sm'
                                    : 'bg-slate-800/60 text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
                            }`}
                        >
                            <ArrowUpRight className="w-3 h-3" />
                            Actions Taken ({outgoingCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSubFilter('incoming')}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                                subFilter === 'incoming'
                                    ? 'bg-rose-900/60 border border-rose-600/60 text-rose-200 shadow-sm'
                                    : 'bg-slate-800/60 text-slate-400 hover:text-rose-300 hover:bg-slate-800'
                            }`}
                        >
                            <ArrowDownLeft className="w-3 h-3" />
                            Received ({incomingCount})
                        </button>
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <div
                    ref={scrollRef}
                    className="absolute inset-0 overflow-y-auto p-4 space-y-4"
                >
                    {filteredActions.length === 0 ? (
                        <div className="text-center text-slate-500 italic mt-12 px-4 space-y-2">
                            <div className="text-base font-medium text-slate-400">
                                {selectedParticipant
                                    ? `No ${subFilter === 'outgoing' ? 'actions taken' : subFilter === 'incoming' ? 'incoming actions' : 'actions'} recorded for ${selectedParticipant.name}`
                                    : "No actions recorded yet..."}
                            </div>
                            {selectedParticipant && (
                                <p className="text-xs text-slate-500">
                                    Try switching sub-filters or click "Clear Filter" to view all actions.
                                </p>
                            )}
                        </div>
                    ) : (
                        filteredActions.map((action) => (
                            <div key={action.id} className="pb-4 border-b border-slate-800/50 last:border-0 last:pb-0">
                                {formatAction(action)}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
