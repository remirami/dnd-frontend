"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { combatApi } from "@/lib/api/combat";
import { enemiesApi } from "@/lib/api/enemies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { CombatSession, CombatParticipant, CombatAction, CharacterSpell } from "@/lib/types/combat";
import type { Enemy, Attack } from "@/lib/types/enemy";

export default function CombatPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [session, setSession] = useState<CombatSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [damageAmount, setDamageAmount] = useState("");
    const [healAmount, setHealAmount] = useState("");
    // Target is the participant who will receive damage/healing/attacks
    const [targetId, setTargetId] = useState<string>("");
    // Selected is the participant whose details are shown in the info panel (for viewing only)
    const [viewingParticipantId, setViewingParticipantId] = useState<number | null>(null);
    const [selectedEnemy, setSelectedEnemy] = useState<Enemy | null>(null);
    const [combatOutcome, setCombatOutcome] = useState<'victory' | 'defeat' | null>(null);
    const [aiProcessing, setAiProcessing] = useState(false);
    // IDs of participants whose HP bar should flash red (took damage this step)
    const [damagedParticipantIds, setDamagedParticipantIds] = useState<Set<number>>(new Set());

    const [activeTab, setActiveTab] = useState<'attack' | 'damage'>('attack');
    const logRef = useRef<HTMLDivElement>(null);

    const sessionId = Number(params.id);

    // Check for combat victory or defeat
    const checkCombatOutcome = (participants: CombatParticipant[]) => {
        const players = participants.filter(p => p.participant_type === 'character');
        const enemies = participants.filter(p => p.participant_type === 'enemy');
        const allPlayersDead = players.length > 0 && players.every(p => p.current_hp <= 0);
        const allEnemiesDead = enemies.length > 0 && enemies.every(p => p.current_hp <= 0);

        if (allEnemiesDead) {
            setCombatOutcome('victory');
            return true;
        } else if (allPlayersDead) {
            setCombatOutcome('defeat');
            return true;
        }
        return false;
    };

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
        if (sessionId) loadSession();
    }, [isAuthenticated, sessionId, router]);

    // Auto-scroll combat log
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [session?.actions]);

    // Auto-set target when turn changes
    useEffect(() => {
        if (!session) return;
        const participants = session.participants || [];
        const current = getCurrentParticipant();
        if (!current) return;

        // Player turn → default target to first living enemy
        // Enemy turn → default target to first living player
        const oppositeType = current.participant_type === 'character' ? 'enemy' : 'character';
        const defaultTarget = participants.find(
            p => p.participant_type === oppositeType && p.current_hp > 0 && p.is_active
        );
        if (defaultTarget) {
            setTargetId(defaultTarget.id.toString());
        }

        // Also set viewing to current participant
        setViewingParticipantId(current.id);

        // Load enemy data if current is an enemy
        if (current.participant_type === 'enemy') {
            loadEnemyData(current);
        } else {
            setSelectedEnemy(null);
        }
    }, [session?.current_turn_index, session?.current_round]);

    const loadSession = async () => {
        try {
            const response = await combatApi.getById(sessionId);
            setSession(response.data);
            if (response.data.participants) {
                checkCombatOutcome(response.data.participants);
            }
        } catch (error) {
            console.error("Failed to load combat session:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadEnemyData = async (participant: CombatParticipant) => {
        if (participant.participant_type === 'enemy' && participant.encounter_enemy?.enemy) {
            try {
                const response = await enemiesApi.getById(participant.encounter_enemy.enemy);
                setSelectedEnemy(response.data);
            } catch {
                setSelectedEnemy(null);
            }
        } else {
            setSelectedEnemy(null);
        }
    };

    const getCurrentParticipant = (): CombatParticipant | undefined => {
        if (!session) return undefined;
        const participants = session.participants || [];
        return (session as any).current_participant || participants.find(p => p.is_active);
    };

    const handleViewParticipant = (participantId: number) => {
        setViewingParticipantId(participantId);
        const participant = session?.participants.find(p => p.id === participantId);
        if (participant) loadEnemyData(participant);
    };

    /**
     * Resolves enemy turns one-by-one so the UI updates after each attack,
     * flashing the HP bar of any participant that took damage.
     */
    const stepByStepEnemyTurns = async () => {
        const DELAY_MS = 900; // pause between each enemy turn
        const FLASH_MS = 600; // how long the red flash lasts

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // Keep resolving as long as the current participant is an enemy
        let safetyLimit = 20; // prevent infinite loops
        while (safetyLimit-- > 0) {
            // Peek at current session state to decide if we should continue
            let currentSession: CombatSession | null = null;
            setSession(prev => { currentSession = prev; return prev; });
            // Give React a tick to flush
            await sleep(0);

            const active = (currentSession as CombatSession | null)?.current_participant ||
                (currentSession as CombatSession | null)?.participants?.find((p: CombatParticipant) => p.is_active);

            if (!active || active.participant_type !== 'enemy') break;

            try {
                const res = await combatApi.aiTurn(sessionId);
                const updatedSession = res.data.session;

                // Collect IDs of participants that took damage this turn
                const hitTargetIds = new Set<number>(
                    res.data.actions
                        .filter(a => a.hit && a.damage && a.damage > 0 && a.target_id != null)
                        .map(a => a.target_id as number)
                );

                // Update session — HP bars will animate via CSS transition
                setSession(updatedSession);

                // Flash red on damaged participants
                if (hitTargetIds.size > 0) {
                    setDamagedParticipantIds(hitTargetIds);
                    await sleep(FLASH_MS);
                    setDamagedParticipantIds(new Set());
                }

                if (updatedSession.participants) {
                    if (checkCombatOutcome(updatedSession.participants)) break;
                }

                // Check if the next participant is still an enemy; if not, stop
                const next = updatedSession.current_participant ||
                    updatedSession.participants?.find((p: CombatParticipant) => p.is_active);
                if (!next || next.participant_type !== 'enemy') break;

                await sleep(DELAY_MS);
            } catch (err: any) {
                console.error('Step-by-step AI turn failed:', err);
                break;
            }
        }
    };

    const handleNextTurn = async () => {
        try {
            const response = await combatApi.nextTurn(sessionId);
            const updatedSession = response.data.session;
            setSession(updatedSession);
            if (updatedSession.participants) checkCombatOutcome(updatedSession.participants);

            // Auto-resolve enemy turns step-by-step so HP bars update live
            const nextParticipant = updatedSession.current_participant ||
                updatedSession.participants?.find((p: CombatParticipant) => p.is_active);
            if (nextParticipant && nextParticipant.participant_type === 'enemy') {
                setAiProcessing(true);
                try {
                    await stepByStepEnemyTurns();
                } finally {
                    setAiProcessing(false);
                }
            }
        } catch (error: any) {
            alert(`Failed to advance turn: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleAiTurn = async () => {
        setAiProcessing(true);
        try {
            const response = await combatApi.aiTurn(sessionId);
            // Flash any hit targets
            const hitTargetIds = new Set<number>(
                response.data.actions
                    .filter(a => a.hit && a.damage && a.damage > 0 && a.target_id != null)
                    .map(a => a.target_id as number)
            );
            setSession(response.data.session);
            if (hitTargetIds.size > 0) {
                setDamagedParticipantIds(hitTargetIds);
                setTimeout(() => setDamagedParticipantIds(new Set()), 600);
            }
            if (response.data.session.participants) {
                checkCombatOutcome(response.data.session.participants);
            }
        } catch (error: any) {
            alert(`AI turn failed: ${error.response?.data?.error || error.message}`);
        } finally {
            setAiProcessing(false);
        }
    };

    const handleAutoEnemyTurns = async () => {
        setAiProcessing(true);
        try {
            await stepByStepEnemyTurns();
        } finally {
            setAiProcessing(false);
        }
    };

    const handleAttack = async (attackName: string, attackBonus: number) => {
        const current = getCurrentParticipant();
        if (!current || !targetId) {
            alert("Please select a target for the attack");
            return;
        }
        try {
            await combatApi.attack(sessionId, {
                attacker_id: current.id,
                target_id: parseInt(targetId),
                attack_name: attackName,
                attack_bonus: attackBonus,
            });
            await loadSession();
        } catch (error: any) {
            alert(`Attack failed: ${error.response?.data?.error || error.message}`);
        }
    };

    // FIX: damage/healing now use targetId, not the initiative-selected participant
    const handleApplyDamage = async () => {
        if (!targetId || !damageAmount) return;
        try {
            const current = getCurrentParticipant();
            await combatApi.applyDamage(parseInt(targetId), {
                amount: parseInt(damageAmount),
                source_id: current?.id
            });
            setDamageAmount("");
            await loadSession();
        } catch (error) {
            console.error("Failed to apply damage:", error);
        }
    };

    const handleApplyHealing = async () => {
        if (!targetId || !healAmount) return;
        try {
            const current = getCurrentParticipant();
            await combatApi.applyHealing(parseInt(targetId), {
                amount: parseInt(healAmount),
                source_id: current?.id
            });
            setHealAmount("");
            await loadSession();
        } catch (error) {
            console.error("Failed to apply healing:", error);
        }
    };

    const handleEndCombat = async () => {
        if (!confirm("Are you sure you want to end this combat?")) return;
        try {
            await combatApi.end(sessionId);
            router.push("/combat");
        } catch (error) {
            console.error("Failed to end combat:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400">Loading combat...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center text-white">
                Combat session not found
            </div>
        );
    }

    const participants = session.participants || [];
    const currentParticipant = getCurrentParticipant();
    const sortedParticipants = [...participants].sort((a, b) => b.initiative - a.initiative);
    const isEnemyTurn = currentParticipant?.participant_type === 'enemy';
    const actions = session.actions || [];

    // Get the target participant object for display
    const targetParticipant = targetId ? participants.find(p => p.id === parseInt(targetId)) : null;

    // Get character data from the current participant
    const charData = currentParticipant?.participant_type === 'character' ? currentParticipant.character : null;


    // Get weapons from character inventory (all weapons, equipped first)
    const getCharacterWeapons = () => {
        const stats = charData?.stats;
        const profBonus = charData?.proficiency_bonus || 0;

        // Get all weapons from character_items
        if (charData?.character_items) {
            const weapons = charData.character_items
                .filter(ci => ci.item_details?.weapon_type)
                .sort((a, b) => {
                    // Equipped items first
                    const aEquip = a.is_equipped || a.equipment_slot !== 'inventory' ? 1 : 0;
                    const bEquip = b.is_equipped || b.equipment_slot !== 'inventory' ? 1 : 0;
                    return bEquip - aEquip;
                })
                .map(ci => {
                    const item = ci.item_details!;
                    const isFinesse = item.finesse || false;
                    const isRanged = item.weapon_type?.includes('ranged') || false;
                    let abilityMod = stats?.strength_modifier || 0;
                    if (isRanged) {
                        abilityMod = stats?.dexterity_modifier || 0;
                    } else if (isFinesse) {
                        abilityMod = Math.max(stats?.strength_modifier || 0, stats?.dexterity_modifier || 0);
                    }
                    return {
                        name: item.name,
                        bonus: profBonus + abilityMod,
                        damage: item.damage_dice || '?',
                        damageType: item.damage_type || '',
                        properties: [
                            isFinesse && 'Finesse',
                            isRanged && 'Ranged',
                            item.two_handed && 'Two-Handed',
                            item.light && 'Light',
                            item.heavy && 'Heavy',
                            item.reach && 'Reach',
                            item.thrown && 'Thrown',
                            item.versatile_damage && `Versatile (${item.versatile_damage})`,
                        ].filter(Boolean) as string[],
                        abilityMod,
                        isEquipped: ci.is_equipped || ci.equipment_slot !== 'inventory',
                    };
                });
            if (weapons.length > 0) return weapons;
        }

        // Fallback: use the equipped_items computed field from the backend
        if (currentParticipant?.equipped_items?.weapon) {
            const weapon = currentParticipant.equipped_items.weapon;
            const abilityMod = stats?.strength_modifier || 0;
            return [{
                name: weapon.name,
                bonus: profBonus + abilityMod,
                damage: weapon.damage_dice,
                damageType: '',
                properties: [] as string[],
                abilityMod,
                isEquipped: true,
            }];
        }

        return [];
    };

    // Get prepared spells grouped by level
    const getCharacterSpells = () => {
        if (!charData?.spells) return new Map<number, CharacterSpell[]>();
        const prepared = charData.spells.filter(s => s.level === 0 || s.is_prepared);
        const grouped = new Map<number, CharacterSpell[]>();
        for (const spell of prepared) {
            const lvl = spell.level;
            if (!grouped.has(lvl)) grouped.set(lvl, []);
            grouped.get(lvl)!.push(spell);
        }
        return grouped;
    };

    // Spell slot helpers
    const getSpellSlots = (level: number) => {
        const total = charData?.stats?.spell_slots?.[String(level)] || 0;
        const used = charData?.stats?.expended_spell_slots?.[String(level)] || 0;
        return { total, used, remaining: total - used };
    };

    // Get available attacks for the current participant (enemy path)
    const getEnemyAttacks = (): { name: string; bonus: number; damage: string }[] => {
        if (!currentParticipant || currentParticipant.participant_type !== 'enemy') return [];
        // Use enemy_attacks from the serializer data (includes stat block attacks)
        if (currentParticipant.enemy_attacks && currentParticipant.enemy_attacks.length > 0) {
            return currentParticipant.enemy_attacks;
        }
        // Fallback to separate API data
        if (selectedEnemy?.attacks) {
            return selectedEnemy.attacks.map(a => ({
                name: a.name, bonus: a.bonus, damage: a.damage,
            }));
        }
        return [];
    };

    const characterWeapons = getCharacterWeapons();
    const characterSpells = getCharacterSpells();
    const enemyAttacks = getEnemyAttacks();

    // HP helpers
    const hpGradient = (current: number, max: number) => {
        const pct = max > 0 ? current / max : 0;
        if (pct > 0.6) return 'from-emerald-500 to-emerald-400';
        if (pct > 0.3) return 'from-amber-500 to-amber-400';
        if (pct > 0) return 'from-red-600 to-red-400';
        return 'from-slate-700 to-slate-600';
    };

    // Target selector - shared between Attack and Damage tabs
    const TargetSelector = () => (
        <div>
            <Label className="text-slate-400 text-sm mb-2 block">Target</Label>
            <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger className="bg-slate-900/60 border-slate-700 text-white h-11">
                    <SelectValue placeholder="Choose a target..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                    {participants
                        .filter(p => p.current_hp > 0 && p.is_active)
                        .map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()} className="text-white">
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${p.participant_type === 'character' ? 'bg-blue-400' : 'bg-red-400'
                                        }`} />
                                    <span>{p.name}</span>
                                    <span className="text-slate-500 text-xs ml-auto">
                                        HP {p.current_hp}/{p.max_hp} • AC {p.armor_class}
                                    </span>
                                </div>
                            </SelectItem>
                        ))}
                </SelectContent>
            </Select>
            {targetParticipant && (
                <div className={`mt-2 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${targetParticipant.participant_type === 'character'
                    ? 'bg-blue-900/20 border border-blue-800/30 text-blue-300'
                    : 'bg-red-900/20 border border-red-800/30 text-red-300'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${targetParticipant.participant_type === 'character' ? 'bg-blue-400' : 'bg-red-400'
                        }`} />
                    Targeting: <strong>{targetParticipant.name}</strong>
                    <span className="text-slate-500 ml-auto">
                        HP {targetParticipant.current_hp}/{targetParticipant.max_hp} • AC {targetParticipant.armor_class}
                    </span>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
            {/* Victory/Defeat Modal */}
            {combatOutcome && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className={`max-w-md w-full mx-4 rounded-2xl border-2 p-8 text-center space-y-6 shadow-2xl ${combatOutcome === 'victory'
                        ? 'bg-gradient-to-b from-emerald-900/90 to-slate-900 border-emerald-500/50'
                        : 'bg-gradient-to-b from-red-900/90 to-slate-900 border-red-500/50'
                        }`}>
                        <div className="text-6xl">
                            {combatOutcome === 'victory' ? '⚔️' : '💀'}
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight">
                            {combatOutcome === 'victory' ? 'Victory!' : 'Defeat'}
                        </h2>
                        <p className="text-slate-300 text-lg">
                            {combatOutcome === 'victory'
                                ? 'All enemies have been slain!'
                                : 'The party has fallen...'}
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => router.push('/combat')}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 h-11"
                            >
                                Back to Combats
                            </Button>
                            <Button
                                onClick={async () => {
                                    await combatApi.end(sessionId);
                                    router.push('/combat');
                                }}
                                className={`flex-1 h-11 font-semibold ${combatOutcome === 'victory'
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                End Combat
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <div className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold tracking-tight">
                            <span className="text-amber-400">⚔</span> Combat Tracker
                        </h1>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-sm px-3 py-1">
                            Round {session.current_round}
                        </Badge>
                        <Badge className="bg-slate-700/60 text-slate-300 border-slate-600/30 text-sm px-3 py-1">
                            {session.status || (session.is_active ? 'Active' : 'Ended')}
                        </Badge>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => router.push("/combat")}
                            variant="ghost"
                            className="text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            ← Back
                        </Button>
                        <Button
                            onClick={handleEndCombat}
                            className="bg-red-600/80 hover:bg-red-600 text-white"
                            size="sm"
                        >
                            End Combat
                        </Button>
                    </div>
                </div>
            </div>

            {/* Active Turn Banner */}
            {currentParticipant && (
                <div className={`border-b ${isEnemyTurn
                    ? 'bg-gradient-to-r from-red-900/30 via-red-900/20 to-transparent border-red-800/40'
                    : 'bg-gradient-to-r from-blue-900/30 via-blue-900/20 to-transparent border-blue-800/40'
                    }`}>
                    <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full animate-pulse ${isEnemyTurn ? 'bg-red-400' : 'bg-blue-400'
                                }`} />
                            <div>
                                <p className="text-sm text-slate-400 uppercase tracking-wide font-medium">Current Turn</p>
                                <h2 className={`text-2xl font-bold ${isEnemyTurn ? 'text-red-300' : 'text-blue-300'
                                    }`}>
                                    {currentParticipant.name}
                                </h2>
                            </div>
                            <div className="flex gap-6 ml-8">
                                <div className="text-center">
                                    <p className="text-xs text-slate-500 uppercase">HP</p>
                                    <p className="text-lg font-bold font-mono">
                                        {currentParticipant.current_hp}<span className="text-slate-500">/{currentParticipant.max_hp}</span>
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-slate-500 uppercase">AC</p>
                                    <p className="text-lg font-bold font-mono">{currentParticipant.armor_class}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-slate-500 uppercase">Init</p>
                                    <p className="text-lg font-bold font-mono">{currentParticipant.initiative}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-slate-500 uppercase">Attacks</p>
                                    <p className={`text-lg font-bold font-mono ${currentParticipant.attacks_remaining > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                                        {currentParticipant.attacks_remaining}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {isEnemyTurn && (
                                <>
                                    <Button
                                        onClick={handleAiTurn}
                                        disabled={aiProcessing}
                                        className="bg-red-600 hover:bg-red-700 text-white font-semibold h-10 px-5"
                                    >
                                        {aiProcessing ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </span>
                                        ) : '🤖 AI Turn'}
                                    </Button>
                                    <Button
                                        onClick={handleAutoEnemyTurns}
                                        disabled={aiProcessing}
                                        className="bg-red-800/80 hover:bg-red-800 text-white font-semibold h-10 px-5"
                                    >
                                        ⚡ Auto All Enemies
                                    </Button>
                                </>
                            )}
                            <Button
                                onClick={handleNextTurn}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold h-10 px-6"
                            >
                                End Turn →
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Two-Column Layout */}
            <div className="max-w-[1800px] mx-auto px-6 py-5">
                <div className="grid grid-cols-12 gap-5" style={{ height: 'calc(100vh - 200px)' }}>

                    {/* Left Column: Initiative + Combat Log */}
                    <div className="col-span-4 flex flex-col gap-5 h-full overflow-hidden">
                        {/* Initiative Tracker */}
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 flex-shrink-0 overflow-hidden"
                            style={{ maxHeight: '50%' }}>
                            <div className="px-4 py-3 border-b border-slate-700/50 flex justify-between items-center">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-400">Initiative Order</h3>
                                <span className="text-xs text-slate-500">{sortedParticipants.length} combatants</span>
                            </div>
                            <div className="overflow-y-auto p-2 space-y-1" style={{ maxHeight: 'calc(100% - 44px)' }}>
                                {sortedParticipants.map((p) => {
                                    const isCurrent = currentParticipant?.id === p.id;
                                    const isDead = p.current_hp <= 0;
                                    const isPlayer = p.participant_type === 'character';
                                    const isViewing = viewingParticipantId === p.id;

                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => handleViewParticipant(p.id)}
                                            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${isCurrent
                                                ? isPlayer
                                                    ? 'bg-blue-900/40 ring-1 ring-blue-500/50'
                                                    : 'bg-red-900/40 ring-1 ring-red-500/50'
                                                : isDead
                                                    ? 'bg-slate-900/30 opacity-50'
                                                    : isViewing
                                                        ? 'bg-slate-700/60 ring-1 ring-slate-500/50'
                                                        : 'bg-slate-900/20 hover:bg-slate-700/40'
                                                }`}
                                        >
                                            {/* Initiative Badge */}
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${isPlayer ? 'bg-blue-600/30 text-blue-300' : 'bg-red-600/30 text-red-300'
                                                }`}>
                                                {p.initiative}
                                            </div>

                                            {/* Name + HP */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-medium text-sm truncate ${isDead ? 'line-through text-slate-500' : 'text-slate-200'
                                                        }`}>
                                                        {p.name}
                                                    </span>
                                                    {isDead && <span className="text-xs">💀</span>}
                                                    {isCurrent && (
                                                        <span className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${isPlayer ? 'bg-blue-400' : 'bg-red-400'
                                                            }`} />
                                                    )}
                                                </div>

                                                {/* HP Bar */}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                                                                damagedParticipantIds.has(p.id)
                                                                    ? 'from-red-500 to-red-400'
                                                                    : hpGradient(p.current_hp, p.max_hp)
                                                            }`}
                                                            style={{ width: `${Math.max(0, (p.current_hp / p.max_hp) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-[10px] font-mono flex-shrink-0 transition-colors duration-300 ${
                                                        damagedParticipantIds.has(p.id) ? 'text-red-400 font-bold' : 'text-slate-500'
                                                    }`}>
                                                        {p.current_hp}/{p.max_hp}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* AC */}
                                            <div className="text-xs text-slate-500 flex-shrink-0">
                                                🛡 {p.armor_class}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Combat Log */}
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 flex-1 overflow-hidden flex flex-col min-h-0">
                            <div className="px-4 py-3 border-b border-slate-700/50 flex justify-between items-center flex-shrink-0">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-400">Combat Log</h3>
                                <Badge variant="outline" className="text-slate-500 border-slate-700 text-xs">
                                    {actions.length} entries
                                </Badge>
                            </div>
                            <div ref={logRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                                {actions.length === 0 ? (
                                    <p className="text-center text-slate-600 italic pt-8 text-sm">
                                        No actions yet...
                                    </p>
                                ) : (
                                    <>
                                        {actions.map((action) => (
                                            <div key={action.id} className={`text-sm border-b pb-2 ${action.is_ai ? 'border-red-900/20 pl-2 border-l-2 border-l-red-600/40' : 'border-slate-800/40'}`}>
                                                {action.action_type === 'attack' ? (
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            {action.is_ai && (
                                                                <span className="text-[10px] bg-red-900/40 text-red-300 px-1.5 py-0 rounded">AI</span>
                                                            )}
                                                            <span className={`font-medium ${action.is_ai ? 'text-red-300' : 'text-slate-300'}`}>{action.actor_name}</span>
                                                            <span className="text-slate-600">→</span>
                                                            <span className="text-slate-300">{action.target_name}</span>
                                                            {action.critical ? (
                                                                <Badge className="bg-yellow-600/80 text-yellow-100 text-[10px] px-1.5 py-0">CRIT!</Badge>
                                                            ) : action.hit ? (
                                                                <Badge className="bg-emerald-700/60 text-emerald-200 text-[10px] px-1.5 py-0">HIT</Badge>
                                                            ) : (
                                                                <Badge className="bg-slate-700/60 text-slate-400 text-[10px] px-1.5 py-0">MISS</Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                            {action.attack_name} • {action.attack_roll}+{action.attack_modifier}={action.attack_total} vs AC
                                                            {action.hit && action.damage_amount !== undefined && (
                                                                <span className="text-red-400 font-medium ml-1">
                                                                    • {action.damage_amount} dmg
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-slate-400">
                                                        <span className="font-medium text-slate-300">{action.actor_name}</span>{' '}
                                                        {action.description || action.action_type_display}
                                                    </div>
                                                )}
                                            </div>
                                        ))}


                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Action Panel */}
                    <div className="col-span-8 h-full overflow-y-auto">
                        <div className="space-y-5">
                            {/* Action Panel Tabs */}
                            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                                {/* Tab Headers */}
                                <div className="flex border-b border-slate-700/50">
                                    <button
                                        onClick={() => setActiveTab('attack')}
                                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'attack'
                                            ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-800/30'
                                            : 'text-slate-400 hover:text-slate-300'
                                            }`}
                                    >
                                        ⚔️ Attack
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('damage')}
                                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'damage'
                                            ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-800/30'
                                            : 'text-slate-400 hover:text-slate-300'
                                            }`}
                                    >
                                        💊 Damage & Healing
                                    </button>
                                </div>

                                <div className="p-5">
                                    {activeTab === 'attack' ? (
                                        <div className="space-y-5">
                                            {/* Actor indicator */}
                                            {currentParticipant && (
                                                <div className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${isEnemyTurn
                                                    ? 'bg-red-900/20 border border-red-800/30 text-red-300'
                                                    : 'bg-blue-900/20 border border-blue-800/30 text-blue-300'
                                                    }`}>
                                                    <span className={`w-2 h-2 rounded-full ${isEnemyTurn ? 'bg-red-400' : 'bg-blue-400'}`} />
                                                    Attacker: <strong>{currentParticipant.name}</strong>
                                                </div>
                                            )}

                                            {/* Target Selection */}
                                            <TargetSelector />

                                            {/* Attack Options */}
                                            {isEnemyTurn ? (
                                                /* Enemy Attacks */
                                                enemyAttacks.length > 0 ? (
                                                    <div>
                                                        <Label className="text-slate-400 text-sm mb-3 block">Enemy Attacks</Label>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {enemyAttacks.map((attack, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => handleAttack(attack.name, attack.bonus)}
                                                                    disabled={!targetId}
                                                                    className={`text-left p-4 rounded-lg border transition-all duration-150 ${!targetId
                                                                        ? 'bg-slate-900/30 border-slate-800 opacity-50 cursor-not-allowed'
                                                                        : 'bg-slate-900/50 border-slate-700 hover:border-amber-500/50 hover:bg-amber-950/20 cursor-pointer'
                                                                        }`}
                                                                >
                                                                    <p className="font-semibold text-sm text-slate-200">{attack.name}</p>
                                                                    <div className="flex items-center gap-3 mt-1.5">
                                                                        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                                                                            +{attack.bonus} to hit
                                                                        </span>
                                                                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">
                                                                            {attack.damage}
                                                                        </span>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-slate-500 text-sm text-center py-4">No attack data available</p>
                                                )
                                            ) : (
                                                /* Player Character Attacks — Weapons + Spells */
                                                <div className="space-y-5">
                                                    {/* === WEAPONS === */}
                                                    <div>
                                                        <Label className="text-slate-400 text-sm mb-3 block flex items-center gap-2">
                                                            <span>⚔️ Weapons</span>
                                                            {characterWeapons.length > 0 && (
                                                                <Badge className="bg-slate-700/50 text-slate-400 border-slate-600/30 text-[10px] font-normal">
                                                                    {characterWeapons.length}
                                                                </Badge>
                                                            )}
                                                        </Label>
                                                        {characterWeapons.length > 0 ? (
                                                            <div className="grid grid-cols-2 gap-3">
                                                                {characterWeapons.map((weapon, idx) => (
                                                                    <button
                                                                        key={idx}
                                                                        onClick={() => handleAttack(weapon.name, weapon.bonus)}
                                                                        disabled={!targetId}
                                                                        className={`text-left p-4 rounded-lg border transition-all duration-150 ${!targetId
                                                                            ? 'bg-slate-900/30 border-slate-800 opacity-50 cursor-not-allowed'
                                                                            : 'bg-slate-900/50 border-slate-700 hover:border-amber-500/50 hover:bg-amber-950/20 cursor-pointer'
                                                                            }`}
                                                                    >
                                                                        <p className="font-semibold text-sm text-slate-200">{weapon.name}</p>
                                                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                                            <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                                                                                +{weapon.bonus} to hit
                                                                            </span>
                                                                            <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">
                                                                                {weapon.damage} + {weapon.abilityMod}
                                                                            </span>
                                                                            {weapon.damageType && (
                                                                                <span className="text-xs text-slate-500">{weapon.damageType}</span>
                                                                            )}
                                                                        </div>
                                                                        {weapon.properties.length > 0 && (
                                                                            <div className="flex gap-1 mt-2 flex-wrap">
                                                                                {weapon.properties.map((prop, i) => (
                                                                                    <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                                                                        {prop}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-4 bg-slate-900/30 rounded-lg border border-dashed border-slate-700">
                                                                <p className="text-slate-500 text-sm">No weapons in inventory</p>
                                                                <p className="text-slate-600 text-xs mt-1">Add weapons from the character sheet</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* === SPELLS === */}
                                                    {charData?.spells && charData.spells.length > 0 && (
                                                        <div>
                                                            <Label className="text-slate-400 text-sm mb-3 block flex items-center gap-2">
                                                                <span>✨ Spells</span>
                                                                {charData.stats?.spell_save_dc && (
                                                                    <span className="text-[10px] bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded">
                                                                        Save DC {charData.stats.spell_save_dc}
                                                                    </span>
                                                                )}
                                                                {charData.stats?.spell_attack_bonus != null && (
                                                                    <span className="text-[10px] bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded">
                                                                        +{charData.stats.spell_attack_bonus} spell attack
                                                                    </span>
                                                                )}
                                                            </Label>
                                                            <div className="space-y-3">
                                                                {Array.from(characterSpells.entries())
                                                                    .sort(([a], [b]) => a - b)
                                                                    .map(([level, spells]) => {
                                                                        const slots = level > 0 ? getSpellSlots(level) : null;
                                                                        return (
                                                                            <div key={level} className="bg-slate-900/30 rounded-lg border border-slate-800 p-3">
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                                                                                        {level === 0 ? 'Cantrips' : `Level ${level}`}
                                                                                    </span>
                                                                                    {slots && slots.total > 0 && (
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <span className="text-[10px] text-slate-500">Slots:</span>
                                                                                            <div className="flex gap-1">
                                                                                                {Array.from({ length: slots.total }).map((_, i) => (
                                                                                                    <div
                                                                                                        key={i}
                                                                                                        className={`w-3 h-3 rounded-full border ${i < slots.remaining
                                                                                                            ? 'bg-purple-500 border-purple-400'
                                                                                                            : 'bg-slate-800 border-slate-600'
                                                                                                            }`}
                                                                                                    />
                                                                                                ))}
                                                                                            </div>
                                                                                            <span className="text-[10px] text-slate-500 ml-1">
                                                                                                {slots.remaining}/{slots.total}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {spells.map((spell) => (
                                                                                        <button
                                                                                            key={spell.id}
                                                                                            onClick={() => {
                                                                                                if (!targetId) { alert('Select a target first'); return; }
                                                                                                handleAttack(
                                                                                                    spell.name,
                                                                                                    charData.stats?.spell_attack_bonus || 0
                                                                                                );
                                                                                            }}
                                                                                            disabled={!targetId || (slots !== null && slots.remaining <= 0)}
                                                                                            className={`text-left px-3 py-2 rounded-lg border text-sm transition-all duration-150 ${(!targetId || (slots !== null && slots.remaining <= 0))
                                                                                                ? 'bg-slate-900/30 border-slate-800 opacity-40 cursor-not-allowed'
                                                                                                : 'bg-slate-900/50 border-slate-700 hover:border-purple-500/50 hover:bg-purple-950/20 cursor-pointer'
                                                                                                }`}
                                                                                        >
                                                                                            <span className="text-slate-200">{spell.name}</span>
                                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                                {spell.spell_details?.school_display && (
                                                                                                    <span className="text-[10px] text-purple-400">{spell.spell_details.school_display}</span>
                                                                                                )}
                                                                                                {spell.spell_details?.concentration && (
                                                                                                    <span className="text-[10px] bg-yellow-900/30 text-yellow-300 px-1 rounded">C</span>
                                                                                                )}
                                                                                                {spell.spell_details?.ritual && (
                                                                                                    <span className="text-[10px] bg-blue-900/30 text-blue-300 px-1 rounded">R</span>
                                                                                                )}
                                                                                                {spell.spell_details?.range && (
                                                                                                    <span className="text-[10px] text-slate-500">{spell.spell_details.range}</span>
                                                                                                )}
                                                                                            </div>
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* Damage & Healing Tab */
                                        <div className="space-y-5">
                                            {/* Target Selection - shared */}
                                            <TargetSelector />

                                            <div className="grid grid-cols-2 gap-6">
                                                {/* Damage */}
                                                <div className="space-y-3">
                                                    <h4 className="font-semibold text-sm text-red-400 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                                                        Apply Damage
                                                    </h4>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="number"
                                                            value={damageAmount}
                                                            onChange={(e) => setDamageAmount(e.target.value)}
                                                            placeholder="Amount"
                                                            className="bg-slate-900/60 border-slate-700 text-white h-11"
                                                        />
                                                        <Button
                                                            onClick={handleApplyDamage}
                                                            disabled={!damageAmount || !targetId}
                                                            className="bg-red-600/80 hover:bg-red-600 h-11 px-6"
                                                        >
                                                            Damage
                                                        </Button>
                                                    </div>
                                                    {!targetId && (
                                                        <p className="text-xs text-slate-600">Select a target above first</p>
                                                    )}
                                                </div>

                                                {/* Healing */}
                                                <div className="space-y-3">
                                                    <h4 className="font-semibold text-sm text-emerald-400 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                                        Apply Healing
                                                    </h4>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="number"
                                                            value={healAmount}
                                                            onChange={(e) => setHealAmount(e.target.value)}
                                                            placeholder="Amount"
                                                            className="bg-slate-900/60 border-slate-700 text-white h-11"
                                                        />
                                                        <Button
                                                            onClick={handleApplyHealing}
                                                            disabled={!healAmount || !targetId}
                                                            className="bg-emerald-600/80 hover:bg-emerald-600 h-11 px-6"
                                                        >
                                                            Heal
                                                        </Button>
                                                    </div>
                                                    {!targetId && (
                                                        <p className="text-xs text-slate-600">Select a target above first</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Viewed Participant Details */}
                            {viewingParticipantId && (() => {
                                const viewed = participants.find(p => p.id === viewingParticipantId);
                                if (!viewed) return null;
                                const hpPct = viewed.max_hp > 0 ? (viewed.current_hp / viewed.max_hp) * 100 : 0;

                                return (
                                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-100">{viewed.name}</h3>
                                                <p className="text-sm text-slate-500">
                                                    {viewed.participant_type === 'character' ? 'Player Character' : 'Enemy'}
                                                </p>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-500 uppercase">AC</p>
                                                    <p className="text-xl font-bold font-mono text-slate-200">{viewed.armor_class}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-500 uppercase">Init</p>
                                                    <p className="text-xl font-bold font-mono text-slate-200">{viewed.initiative}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Full-width HP bar */}
                                        <div>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="text-slate-400">Hit Points</span>
                                                <span className="font-mono font-bold">
                                                    {viewed.current_hp} <span className="text-slate-500">/ {viewed.max_hp}</span>
                                                </span>
                                            </div>
                                            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${hpGradient(viewed.current_hp, viewed.max_hp)}`}
                                                    style={{ width: `${Math.max(0, hpPct)}%` }}
                                                />
                                            </div>
                                        </div>
                                        {/* Equipped Items */}
                                        {viewed.equipped_items && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {viewed.equipped_items.weapon && (
                                                    <Badge className="bg-amber-600/20 text-amber-300 border-amber-500/30 text-xs">
                                                        ⚔️ {viewed.equipped_items.weapon.name} ({viewed.equipped_items.weapon.damage_dice})
                                                    </Badge>
                                                )}
                                                {viewed.equipped_items.armor && (
                                                    <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30 text-xs">
                                                        🛡 {viewed.equipped_items.armor.name}
                                                    </Badge>
                                                )}
                                                {viewed.equipped_items.shield && (
                                                    <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30 text-xs">
                                                        🛡 {viewed.equipped_items.shield.name}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* Enemy Stat Block */}
                                        {viewed.participant_type === 'enemy' && viewed.enemy_stats && (
                                            <div className="mt-4 space-y-3">
                                                {/* Ability Scores Grid */}
                                                <div>
                                                    <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Ability Scores</h4>
                                                    <div className="grid grid-cols-6 gap-2">
                                                        {Object.entries(viewed.enemy_stats.ability_scores).map(([ability, data]) => (
                                                            <div key={ability} className="bg-slate-900/60 rounded-lg border border-slate-700/50 text-center p-2">
                                                                <p className="text-[10px] font-semibold text-slate-400 uppercase">{ability.slice(0, 3)}</p>
                                                                <p className="text-lg font-bold text-slate-200">{data.score}</p>
                                                                <p className={`text-xs font-mono ${data.modifier >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                    {data.modifier >= 0 ? '+' : ''}{data.modifier}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Speed & Proficiency */}
                                                <div className="flex flex-wrap gap-2">
                                                    {viewed.enemy_stats.speed && (
                                                        <Badge className="bg-cyan-600/20 text-cyan-300 border-cyan-500/30 text-xs">
                                                            🏃 {viewed.enemy_stats.speed}
                                                        </Badge>
                                                    )}
                                                    {viewed.enemy_stats.proficiency_bonus && (
                                                        <Badge className="bg-violet-600/20 text-violet-300 border-violet-500/30 text-xs">
                                                            Prof +{viewed.enemy_stats.proficiency_bonus}
                                                        </Badge>
                                                    )}
                                                    {viewed.enemy_stats.senses?.darkvision && (
                                                        <Badge className="bg-slate-600/20 text-slate-300 border-slate-500/30 text-xs">
                                                            👁 Darkvision {viewed.enemy_stats.senses.darkvision}
                                                        </Badge>
                                                    )}
                                                    {viewed.enemy_stats.senses?.passive_perception && (
                                                        <Badge className="bg-slate-600/20 text-slate-300 border-slate-500/30 text-xs">
                                                            PP {viewed.enemy_stats.senses.passive_perception}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Saving Throws */}
                                                {Object.values(viewed.enemy_stats.saving_throws).some(v => v !== null) && (
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Saving Throws</h4>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {Object.entries(viewed.enemy_stats.saving_throws)
                                                                .filter(([, val]) => val !== null)
                                                                .map(([ability, val]) => (
                                                                    <Badge key={ability} className="bg-indigo-600/20 text-indigo-300 border-indigo-500/30 text-xs">
                                                                        {ability.toUpperCase()} +{val}
                                                                    </Badge>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Enemy Attacks */}
                                                {viewed.enemy_attacks && viewed.enemy_attacks.length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Attacks</h4>
                                                        <div className="space-y-1.5">
                                                            {viewed.enemy_attacks.map((atk, i) => (
                                                                <div key={i} className="flex items-center gap-3 bg-slate-900/40 rounded-lg px-3 py-2 border border-slate-800/50">
                                                                    <span className="text-sm font-medium text-slate-200">{atk.name}</span>
                                                                    <span className="text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                                                                        +{atk.bonus}
                                                                    </span>
                                                                    <span className="text-xs bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">
                                                                        {atk.damage}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Abilities */}
                                                {viewed.enemy_abilities && viewed.enemy_abilities.length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">Abilities</h4>
                                                        <div className="space-y-1.5">
                                                            {viewed.enemy_abilities.map((ab, i) => (
                                                                <div key={i} className="bg-slate-900/40 rounded-lg px-3 py-2 border border-slate-800/50">
                                                                    <p className="text-sm font-medium text-slate-200">{ab.name}</p>
                                                                    <p className="text-xs text-slate-400 mt-0.5">{ab.description}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Resistances/Immunities */}
                                                {viewed.enemy_resistances && viewed.enemy_resistances.length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Resistances & Immunities</h4>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {viewed.enemy_resistances.map((r, i) => (
                                                                <Badge key={i} className={`text-xs ${r.type === 'immunity' ? 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30' :
                                                                    r.type === 'vulnerability' ? 'bg-red-600/20 text-red-300 border-red-500/30' :
                                                                        'bg-slate-600/20 text-slate-300 border-slate-500/30'
                                                                    }`}>
                                                                    {r.type === 'immunity' ? '🛡' : r.type === 'vulnerability' ? '⚠' : '↓'} {r.damage_type}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {/* Conditions */}
                                        {viewed.conditions && viewed.conditions.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {viewed.conditions.map((cond, i) => (
                                                    <Badge key={i} className="bg-purple-600/30 text-purple-300 border-purple-500/30 text-xs">
                                                        {cond}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in > div {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
