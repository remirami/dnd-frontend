import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CombatAction } from '@/lib/types/combat';

interface CombatLogProps {
    actions: CombatAction[];
}

export function CombatLog({ actions }: CombatLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new actions are added
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [actions]);

    const formatAction = (action: CombatAction) => {
        if (action.action_type === 'attack') {
            return (
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-200">
                            {action.actor_name} <span className="text-slate-500 text-sm font-normal">attacks</span> {action.target_name}
                        </span>
                        {action.critical ? (
                            <Badge variant="destructive" className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold">CRITICAL!</Badge>
                        ) : action.hit ? (
                            <Badge variant="default" className="bg-green-700 hover:bg-green-800">HIT</Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-slate-700 text-slate-300">MISS</Badge>
                        )}
                    </div>

                    <div className="text-sm text-slate-400 flex items-center gap-2">
                        <span>{action.attack_name}</span>
                        <span className="text-slate-600">•</span>
                        <span>Roll: <span className={action.critical ? "text-yellow-500 font-bold" : "text-white"}>{action.attack_total}</span></span>
                        <span className="text-xs text-slate-600">({action.description.split('|')[0].trim()})</span>
                    </div>

                    {action.hit && action.damage_total !== undefined && (
                        <div className="text-rose-400 font-semibold mt-1">
                            {action.damage_total} damage
                            {action.damage_type && <span className="text-slate-500 text-xs font-normal ml-1">({action.damage_type})</span>}
                        </div>
                    )}
                </div>
            );
        }

        // Handle other action types or fallback
        return (
            <div className="text-slate-300">
                <span className="font-semibold">{action.actor_name}</span> used {action.action_type_display}
                {action.description && <div className="text-sm text-slate-400">{action.description}</div>}
            </div>
        );
    };

    return (
        <Card className="bg-slate-900 border-slate-700 h-[600px] flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-slate-200 text-lg flex justify-between items-center">
                    Combat Log
                    <Badge variant="outline" className="text-slate-500 border-slate-700 font-normal">
                        Round {actions.length > 0 ? actions[actions.length - 1].round_number : 1}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <div
                    ref={scrollRef}
                    className="absolute inset-0 overflow-y-auto p-4 space-y-4"
                >
                    {actions.length === 0 ? (
                        <div className="text-center text-slate-500 italic mt-10">
                            No actions recorded yet...
                        </div>
                    ) : (
                        actions.map((action) => (
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
