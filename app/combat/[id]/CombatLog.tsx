import React, { useEffect, useRef, useState, useMemo } from 'react';
import { CombatAction, CombatParticipant } from '@/lib/types/combat';
import { ArrowUpRight, ArrowDownLeft, Swords, Search, RefreshCw } from 'lucide-react';

interface CombatLogProps {
    actions: CombatAction[];
    participants?: CombatParticipant[];
    selectedParticipant?: CombatParticipant | null;
    onClearFilter?: () => void;
}

interface ParticipantOption {
    key: string;
    id?: number;
    name: string;
    type: 'character' | 'enemy' | 'other';
    currentHp?: number;
    maxHp?: number;
    isDefeated?: boolean;
    className?: string;
}

export function CombatLog({
    actions,
    participants = [],
    selectedParticipant,
    onClearFilter,
}: CombatLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Filter states
    const [selectedKey, setSelectedKey] = useState<string>('all');
    const [subFilter, setSubFilter] = useState<'all' | 'outgoing' | 'incoming'>('all');
    const [actionTypeFilter, setActionTypeFilter] = useState<'all' | 'attack' | 'spell' | 'damage_heal'>('all');
    const [roundFilter, setRoundFilter] = useState<'all' | number>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Sync external selectedParticipant when provided or changed
    useEffect(() => {
        if (selectedParticipant?.name) {
            setSelectedKey(selectedParticipant.name.toLowerCase().trim());
            setSubFilter('all');
        }
    }, [selectedParticipant?.id, selectedParticipant?.name]);

    // Build unique participant list combining live participants and action history
    const allParticipantsList = useMemo<ParticipantOption[]>(() => {
        const map = new Map<string, ParticipantOption>();

        // 1. Live participants
        for (const p of participants) {
            const key = p.name.toLowerCase().trim();
            map.set(key, {
                key,
                id: p.id,
                name: p.name,
                type: p.participant_type,
                currentHp: p.current_hp,
                maxHp: p.max_hp,
                isDefeated: p.current_hp <= 0,
                className: p.character?.class_name || p.character?.character_class?.name,
            });
        }

        // 2. Scan actions for any participant not currently active (e.g. defeated in past waves)
        for (const act of actions) {
            if (act.actor_name) {
                const key = act.actor_name.toLowerCase().trim();
                if (!map.has(key)) {
                    map.set(key, {
                        key,
                        id: act.actor,
                        name: act.actor_name,
                        type: act.is_ai ? 'enemy' : 'character',
                    });
                }
            }
            if (act.target_name) {
                const key = act.target_name.toLowerCase().trim();
                if (!map.has(key)) {
                    map.set(key, {
                        key,
                        id: act.target,
                        name: act.target_name,
                        type: 'other',
                    });
                }
            }
        }

        return Array.from(map.values());
    }, [participants, actions]);

    const heroOptions = useMemo(
        () => allParticipantsList.filter(p => p.type === 'character'),
        [allParticipantsList]
    );

    const enemyOptions = useMemo(
        () => allParticipantsList.filter(p => p.type === 'enemy'),
        [allParticipantsList]
    );

    const activeParticipant = useMemo<ParticipantOption | null>(() => {
        if (selectedKey === 'all' || selectedKey === 'heroes' || selectedKey === 'enemies') return null;
        return allParticipantsList.find(p => p.key === selectedKey) || {
            key: selectedKey,
            name: selectedKey,
            type: 'other',
        };
    }, [selectedKey, allParticipantsList]);

    // Matcher functions
    const isActorMatch = (action: CombatAction, targetKey: string) => {
        if (!action.actor_name) return false;
        return action.actor_name.toLowerCase().trim() === targetKey;
    };

    const isTargetMatch = (action: CombatAction, targetKey: string) => {
        if (action.target_name && action.target_name.toLowerCase().trim() === targetKey) return true;
        if (action.description && action.description.toLowerCase().includes(targetKey)) return true;
        return false;
    };

    const isHeroAction = (action: CombatAction) => {
        const heroNames = new Set(heroOptions.map(h => h.key));
        const actorIsHero = action.actor_name ? heroNames.has(action.actor_name.toLowerCase().trim()) : false;
        const targetIsHero = action.target_name ? heroNames.has(action.target_name.toLowerCase().trim()) : false;
        return actorIsHero || targetIsHero;
    };

    const isEnemyAction = (action: CombatAction) => {
        const enemyNames = new Set(enemyOptions.map(e => e.key));
        const actorIsEnemy = action.actor_name ? enemyNames.has(action.actor_name.toLowerCase().trim()) : false;
        const targetIsEnemy = action.target_name ? enemyNames.has(action.target_name.toLowerCase().trim()) : false;
        return actorIsEnemy || targetIsEnemy;
    };

    // Calculate Dossier metrics when an individual participant is selected
    const dossierMetrics = useMemo(() => {
        if (!activeParticipant) return null;
        const key = activeParticipant.key;

        let totalEvents = 0;
        let actionsTaken = 0;
        let attacksRolled = 0;
        let attacksHit = 0;
        let crits = 0;
        let damageDealt = 0;

        let eventsReceived = 0;
        let attacksAgainst = 0;
        let hitsReceived = 0;
        let damageTaken = 0;
        let healingReceived = 0;
        let healingGiven = 0;

        for (const act of actions) {
            const actor = isActorMatch(act, key);
            const target = isTargetMatch(act, key);

            if (!actor && !target) continue;
            totalEvents++;

            if (actor) {
                actionsTaken++;
                if (act.action_type === 'attack') {
                    attacksRolled++;
                    if (act.hit) attacksHit++;
                    if (act.critical) crits++;
                }
                if (act.hit && act.damage_amount) {
                    damageDealt += act.damage_amount;
                } else if (act.action_type === 'damage' && act.damage_amount) {
                    damageDealt += act.damage_amount;
                }
                if (act.action_type === 'healing' && act.damage_amount) {
                    healingGiven += act.damage_amount;
                }
            }

            if (target) {
                eventsReceived++;
                if (act.action_type === 'attack') {
                    attacksAgainst++;
                    if (act.hit) hitsReceived++;
                }
                if (act.hit && act.damage_amount) {
                    damageTaken += act.damage_amount;
                } else if (act.action_type === 'damage' && act.damage_amount) {
                    damageTaken += act.damage_amount;
                }
                if (act.action_type === 'healing' && act.damage_amount) {
                    healingReceived += act.damage_amount;
                }
            }
        }

        return {
            totalEvents,
            actionsTaken,
            attacksRolled,
            attacksHit,
            crits,
            damageDealt,
            eventsReceived,
            attacksAgainst,
            hitsReceived,
            damageTaken,
            healingReceived,
            healingGiven,
        };
    }, [activeParticipant, actions]);

    const roundList = useMemo(() => {
        const rounds = new Set<number>();
        for (const a of actions) {
            if (a.round_number) rounds.add(a.round_number);
        }
        return Array.from(rounds).sort((a, b) => a - b);
    }, [actions]);

    // Main filtered actions
    const filteredActions = useMemo(() => {
        return actions.filter(action => {
            // 1. Participant Filter
            if (selectedKey === 'heroes') {
                if (!isHeroAction(action)) return false;
            } else if (selectedKey === 'enemies') {
                if (!isEnemyAction(action)) return false;
            } else if (selectedKey !== 'all') {
                const actor = isActorMatch(action, selectedKey);
                const target = isTargetMatch(action, selectedKey);

                if (!actor && !target) return false;

                // Sub-filter: Outgoing vs Incoming
                if (subFilter === 'outgoing' && !actor) return false;
                if (subFilter === 'incoming' && !target) return false;
            }

            // 2. Action Type Filter
            if (actionTypeFilter === 'attack' && action.action_type !== 'attack') return false;
            if (actionTypeFilter === 'spell' && action.action_type !== 'spell') return false;
            if (actionTypeFilter === 'damage_heal' && action.action_type !== 'damage' && action.action_type !== 'healing') return false;

            // 3. Round Filter
            if (roundFilter !== 'all' && action.round_number !== roundFilter) return false;

            // 4. Free-text Search Query
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const matchDesc = action.description && action.description.toLowerCase().includes(query);
                const matchActor = action.actor_name && action.actor_name.toLowerCase().includes(query);
                const matchTarget = action.target_name && action.target_name.toLowerCase().includes(query);
                const matchAttack = action.attack_name && action.attack_name.toLowerCase().includes(query);
                const matchType = action.action_type && action.action_type.toLowerCase().includes(query);
                if (!matchDesc && !matchActor && !matchTarget && !matchAttack && !matchType) return false;
            }

            return true;
        });
    }, [actions, selectedKey, subFilter, actionTypeFilter, roundFilter, searchQuery, heroOptions, enemyOptions]);

    // Auto-scroll to bottom when new actions are added
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [filteredActions.length]);

    const handleClearAllFilters = () => {
        setSelectedKey('all');
        setSubFilter('all');
        setActionTypeFilter('all');
        setRoundFilter('all');
        setSearchQuery('');
        if (onClearFilter) onClearFilter();
    };

    const handleSelectParticipant = (name: string) => {
        setSelectedKey(name.toLowerCase().trim());
        setSubFilter('all');
    };

    // Damage type helper
    const getDamageTypeName = (dt: any): string | null => {
        if (!dt) return null;
        if (typeof dt === 'string') return dt;
        if (typeof dt === 'object' && dt.name) return String(dt.name);
        return null;
    };

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

    const formatAction = (action: CombatAction) => {
        const actorMatch = activeParticipant ? isActorMatch(action, activeParticipant.key) : false;
        const targetMatch = activeParticipant ? isTargetMatch(action, activeParticipant.key) : false;

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

        const damageTypeName = getDamageTypeName(action.damage_type) || (typeof action.damage_type_name === 'string' ? action.damage_type_name : null);

        if (action.action_type === 'attack') {
            return (
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Actor / Target names with interactive click-to-filter */}
                            <span className="font-lora text-sm font-semibold text-[#d1cdb8] flex items-center gap-1.5 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => handleSelectParticipant(action.actor_name)}
                                    title={`Filter log to ${action.actor_name}`}
                                    className="text-[#c5a059] font-bold hover:underline hover:text-[#e0bc75] transition-colors cursor-pointer"
                                >
                                    {action.actor_name}
                                </button>
                                <span className="text-[#d1cdb8]/50 text-xs font-normal">attacks</span>
                                {action.target_name ? (
                                    <button
                                        type="button"
                                        onClick={() => handleSelectParticipant(action.target_name!)}
                                        title={`Filter log to ${action.target_name}`}
                                        className="font-bold hover:underline hover:text-[#e0bc75] text-slate-200 transition-colors cursor-pointer"
                                    >
                                        {action.target_name}
                                    </button>
                                ) : (
                                    <span className="font-bold text-slate-400">target</span>
                                )}
                            </span>

                            {/* Perspective Badge when a single participant is selected */}
                            {activeParticipant && (
                                actorMatch ? (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-semibold font-lora bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                                        <ArrowUpRight className="w-2.5 h-2.5" /> Actions Taken
                                    </span>
                                ) : targetMatch ? (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-semibold font-lora bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                                        <ArrowDownLeft className="w-2.5 h-2.5" /> Suffered
                                    </span>
                                ) : null
                            )}
                        </div>

                        {/* Round + Advantage/Disadvantage + Outcome badges */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                            <span className="text-[10px] font-fira-sans text-[#c5a059]/60 border border-[#c5a059]/20 px-1.5 py-0.5 rounded-sm bg-[#c5a059]/5 whitespace-nowrap">
                                R{action.round_number}
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
                        <div className="font-fira-sans font-bold text-sm text-[#e06666]">
                            💥 {action.damage_amount} damage
                            {damageTypeName && (
                                <span className="text-[#d1cdb8]/50 text-xs font-normal ml-1.5">
                                    ({damageTypeName})
                                </span>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        // Other action types (spell, damage, healing, skill, etc.)
        return (
            <div className="flex justify-between items-start gap-2">
                <div>
                    <div className="flex items-center gap-2 flex-wrap font-lora text-sm">
                        <button
                            type="button"
                            onClick={() => handleSelectParticipant(action.actor_name)}
                            title={`Filter log to ${action.actor_name}`}
                            className="text-[#c5a059] font-bold hover:underline hover:text-[#e0bc75] transition-colors cursor-pointer"
                        >
                            {action.actor_name}
                        </button>
                        <span className="text-[#d1cdb8]/50 text-xs">
                            {action.action_type === 'spell' ? 'cast spell' : `used ${action.action_type_display || action.action_type}`}
                        </span>
                        {action.target_name && (
                            <span className="text-[#d1cdb8]/50 text-xs flex items-center gap-1">
                                on{" "}
                                <button
                                    type="button"
                                    onClick={() => handleSelectParticipant(action.target_name!)}
                                    title={`Filter log to ${action.target_name}`}
                                    className="text-[#d1cdb8] font-medium hover:underline hover:text-[#e0bc75] transition-colors cursor-pointer"
                                >
                                    {action.target_name}
                                </button>
                            </span>
                        )}
                        {activeParticipant && (
                            actorMatch ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                                    <ArrowUpRight className="w-2.5 h-2.5" /> Actions Taken
                                </span>
                            ) : targetMatch ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                                    <ArrowDownLeft className="w-2.5 h-2.5" /> Suffered
                                </span>
                            ) : null
                        )}
                    </div>

                    {/* Description & outcome */}
                    {action.description && (
                        <div className="text-xs text-[#d1cdb8]/80 font-lora mt-1 bg-[#12141e] px-2 py-0.5 rounded border border-[#c5a059]/15 inline-block">
                            {action.description}
                        </div>
                    )}

                    {/* Damage or Heal numeric pill */}
                    {action.damage_amount != null && (
                        <div className={`mt-1 font-fira-sans font-bold text-xs ${action.action_type === 'healing' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {action.action_type === 'healing' ? `💚 +${action.damage_amount} HP` : `💥 ${action.damage_amount} damage`}
                            {damageTypeName && (
                                <span className="text-[#d1cdb8]/50 font-normal ml-1">({damageTypeName})</span>
                            )}
                        </div>
                    )}
                </div>
                <span className="text-[10px] font-fira-sans text-[#c5a059]/60 border border-[#c5a059]/20 px-1.5 py-0.5 rounded-sm bg-[#c5a059]/5 whitespace-nowrap shrink-0">
                    R{action.round_number}
                </span>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col min-h-0 bg-[#0c0d12]">
            {/* Top Toolbar: Filters & Participant Selector */}
            <div className="shrink-0 p-3 sm:p-3.5 border-b border-[#c5a059]/20 bg-[#0e1017] space-y-2.5">
                {/* Row 1: Participant Dropdown + Search + Quick Clear */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Participant Selector */}
                    <div className="relative flex-1 min-w-[190px]">
                        <select
                            value={selectedKey}
                            onChange={(e) => {
                                setSelectedKey(e.target.value);
                                setSubFilter('all');
                            }}
                            className="w-full bg-[#151722] hover:bg-[#1a1d2c] border border-[#c5a059]/40 hover:border-[#c5a059] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-lora focus:outline-none focus:ring-1 focus:ring-[#c5a059] transition-colors cursor-pointer"
                        >
                            <option value="all">🌟 All Combatants ({actions.length} events)</option>
                            <option value="heroes">🛡️ All Party Heroes ({heroOptions.length})</option>
                            <option value="enemies">💀 All Hostiles / Enemies ({enemyOptions.length})</option>

                            {heroOptions.length > 0 && (
                                <optgroup label="── Party Heroes ──">
                                    {heroOptions.map(h => (
                                        <option key={h.key} value={h.key}>
                                            🛡️ {h.name} {h.currentHp != null ? `(${h.currentHp}/${h.maxHp} HP)` : ''} {h.isDefeated ? '• Slain' : ''}
                                        </option>
                                    ))}
                                </optgroup>
                            )}

                            {enemyOptions.length > 0 && (
                                <optgroup label="── Enemies & Monsters ──">
                                    {enemyOptions.map(e => (
                                        <option key={e.key} value={e.key}>
                                            💀 {e.name} {e.currentHp != null ? `(${e.currentHp}/${e.maxHp} HP)` : ''} {e.isDefeated ? '• Defeated' : ''}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[140px]">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search log..."
                            className="w-full bg-[#151722] border border-[#c5a059]/30 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 font-lora focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Clear Button if any filter active */}
                    {(selectedKey !== 'all' || actionTypeFilter !== 'all' || roundFilter !== 'all' || searchQuery) && (
                        <button
                            type="button"
                            onClick={handleClearAllFilters}
                            title="Reset all filters to default"
                            className="text-xs text-[#c5a059] hover:text-[#e0bc75] bg-[#181a24] hover:bg-[#c5a059]/15 border border-[#c5a059]/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-lora transition-colors cursor-pointer shrink-0"
                        >
                            <RefreshCw className="w-3 h-3" />
                            <span>Reset</span>
                        </button>
                    )}
                </div>

                {/* Row 2: Secondary Filter Chips (Action Type & Round) */}
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs pt-1 border-t border-[#c5a059]/10">
                    {/* Action Type Filter */}
                    <div className="flex items-center gap-1">
                        {(['all', 'attack', 'spell', 'damage_heal'] as const).map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setActionTypeFilter(type)}
                                className={`px-2 py-0.5 rounded text-[11px] font-fira-sans transition-colors cursor-pointer border ${
                                    actionTypeFilter === type
                                        ? 'bg-[#c5a059]/25 text-[#e0bc75] border-[#c5a059]'
                                        : 'bg-[#151722] text-slate-400 border-slate-800 hover:text-slate-200 hover:border-[#c5a059]/30'
                                }`}
                            >
                                {type === 'all' ? 'All Types' : type === 'attack' ? '⚔️ Attacks' : type === 'spell' ? '✨ Spells' : '💥 Dmg/Heals'}
                            </button>
                        ))}
                    </div>

                    {/* Round Filter Dropdown */}
                    {roundList.length > 1 && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 font-fira-sans uppercase tracking-wider">Round:</span>
                            <select
                                value={roundFilter}
                                onChange={(e) => setRoundFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="bg-[#151722] border border-slate-700 hover:border-[#c5a059]/40 rounded px-1.5 py-0.5 text-[11px] text-slate-300 font-fira-sans focus:outline-none"
                            >
                                <option value="all">All Rounds</option>
                                {roundList.map(r => (
                                    <option key={r} value={r}>Round {r}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Participant Combat Impact Dossier (when an individual is selected) */}
                {activeParticipant && dossierMetrics && (
                    <div className="mt-2 bg-[#141622] border border-[#c5a059]/35 rounded-lg p-2.5 shadow-inner space-y-2 animate-in fade-in-50 duration-150">
                        {/* Header: Name, HP & Type */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm shrink-0">
                                    {activeParticipant.type === 'character' ? '🛡️' : '💀'}
                                </span>
                                <span className="font-cinzel font-bold text-sm text-[#e0bc75] truncate">
                                    {activeParticipant.name}
                                </span>
                                {activeParticipant.className && (
                                    <span className="text-[10px] font-lora px-1.5 py-0.2 rounded bg-[#c5a059]/10 text-[#d1cdb8]/70 border border-[#c5a059]/20">
                                        {activeParticipant.className}
                                    </span>
                                )}
                            </div>

                            {/* Vitals */}
                            <div className="flex items-center gap-2 text-xs font-fira-sans">
                                {activeParticipant.currentHp != null ? (
                                    <span className={`px-2 py-0.5 rounded font-bold border ${
                                        activeParticipant.currentHp <= 0
                                            ? 'bg-rose-950/60 text-rose-300 border-rose-500/50'
                                            : activeParticipant.currentHp / (activeParticipant.maxHp || 1) < 0.35
                                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                                            : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                                    }`}>
                                        ❤️ {activeParticipant.currentHp}/{activeParticipant.maxHp} HP
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-slate-400 font-lora">Combatant</span>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats Grid ("What happened to them?") */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-fira-sans">
                            {/* Damage Dealt */}
                            <div className="bg-[#181a27] p-1.5 rounded border border-slate-800">
                                <div className="text-slate-400 text-[10px]">💥 Dmg Dealt</div>
                                <div className="text-amber-300 font-bold">
                                    {dossierMetrics.damageDealt} pts
                                </div>
                                <div className="text-[9px] text-slate-500">
                                    {dossierMetrics.attacksHit}/{dossierMetrics.attacksRolled} hits {dossierMetrics.crits > 0 ? `(${dossierMetrics.crits} crit)` : ''}
                                </div>
                            </div>

                            {/* Damage Taken */}
                            <div className="bg-[#181a27] p-1.5 rounded border border-slate-800">
                                <div className="text-slate-400 text-[10px]">🛡️ Dmg Suffered</div>
                                <div className="text-rose-400 font-bold">
                                    {dossierMetrics.damageTaken} pts
                                </div>
                                <div className="text-[9px] text-slate-500">
                                    {dossierMetrics.hitsReceived}/{dossierMetrics.attacksAgainst} attacks hit
                                </div>
                            </div>

                            {/* Actions Initiated */}
                            <div className="bg-[#181a27] p-1.5 rounded border border-slate-800">
                                <div className="text-slate-400 text-[10px]">⚡ Actions Taken</div>
                                <div className="text-emerald-400 font-bold">
                                    {dossierMetrics.actionsTaken}
                                </div>
                                <div className="text-[9px] text-slate-500">
                                    out of {dossierMetrics.totalEvents} events
                                </div>
                            </div>

                            {/* Healing Status */}
                            <div className="bg-[#181a27] p-1.5 rounded border border-slate-800">
                                <div className="text-slate-400 text-[10px]">💚 Healing</div>
                                <div className="text-emerald-300 font-bold">
                                    +{dossierMetrics.healingReceived} HP
                                </div>
                                <div className="text-[9px] text-slate-500">
                                    {dossierMetrics.healingGiven > 0 ? `Given: +${dossierMetrics.healingGiven}` : 'received'}
                                </div>
                            </div>
                        </div>

                        {/* Perspective Sub-Filter Buttons */}
                        <div className="flex items-center gap-1 pt-1 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setSubFilter('all')}
                                className={`px-2.5 py-1 rounded text-xs font-medium font-lora transition-colors whitespace-nowrap border ${
                                    subFilter === 'all'
                                        ? 'bg-[#c5a059] text-[#0c0d12] border-[#c5a059] font-bold shadow-[0_0_8px_rgba(197,160,89,0.3)]'
                                        : 'bg-[#181a21] text-[#d1cdb8]/60 border-[#c5a059]/25 hover:text-[#c5a059]'
                                }`}
                            >
                                All Events ({dossierMetrics.totalEvents})
                            </button>
                            <button
                                type="button"
                                onClick={() => setSubFilter('outgoing')}
                                className={`px-2.5 py-1 rounded text-xs font-medium font-lora transition-colors flex items-center gap-1 whitespace-nowrap border ${
                                    subFilter === 'outgoing'
                                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                                        : 'bg-[#181a21] text-[#d1cdb8]/60 border-[#c5a059]/25 hover:text-emerald-400'
                                }`}
                            >
                                <ArrowUpRight className="w-3 h-3" />
                                Actions Taken ({dossierMetrics.actionsTaken})
                            </button>
                            <button
                                type="button"
                                onClick={() => setSubFilter('incoming')}
                                className={`px-2.5 py-1 rounded text-xs font-medium font-lora transition-colors flex items-center gap-1 whitespace-nowrap border ${
                                    subFilter === 'incoming'
                                        ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 font-bold'
                                        : 'bg-[#181a21] text-[#d1cdb8]/60 border-[#c5a059]/25 hover:text-rose-400'
                                }`}
                            >
                                <ArrowDownLeft className="w-3 h-3" />
                                Suffered / Received ({dossierMetrics.eventsReceived})
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Scrollable Action List */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-4 space-y-0 min-h-0 divide-y divide-[#c5a059]/10"
            >
                {filteredActions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-16 space-y-3">
                        <Swords className="w-10 h-10 text-[#c5a059]/20" />
                        <div className="font-lora text-sm font-medium text-[#d1cdb8]/60">
                            {selectedKey !== 'all'
                                ? `No matching combat events found for "${activeParticipant?.name || selectedKey}".`
                                : searchQuery
                                ? `No actions matching "${searchQuery}".`
                                : 'No combat actions recorded yet.'}
                        </div>
                        <button
                            type="button"
                            onClick={handleClearAllFilters}
                            className="text-xs text-[#c5a059] hover:underline font-lora cursor-pointer"
                        >
                            Reset filters to view all {actions.length} events
                        </button>
                    </div>
                ) : (
                    filteredActions.map((action) => (
                        <div
                            key={action.id}
                            className="py-3 px-1 hover:bg-[#141620]/60 rounded transition-colors"
                        >
                            {formatAction(action)}
                        </div>
                    ))
                )}
            </div>

            {/* Bottom Status Ribbon */}
            <div className="shrink-0 px-4 py-1.5 bg-[#0e1017] border-t border-[#c5a059]/20 flex items-center justify-between text-[10px] font-fira-sans text-slate-400">
                <div className="flex items-center gap-1.5">
                    <span>Showing</span>
                    <span className="text-[#e0bc75] font-bold">{filteredActions.length}</span>
                    <span>of {actions.length} events</span>
                </div>
                <div className="text-slate-500">
                    💡 Click any hero or enemy name in the log to filter
                </div>
            </div>
        </div>
    );
}
