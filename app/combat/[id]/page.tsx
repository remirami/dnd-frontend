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
import { CombatLog } from "./CombatLog";
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
            if (response.data.status === 'preparing') {
                router.replace(`/combat/${sessionId}/setup`);
                return;
            }
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
            <div className="min-h-screen bg-[#0c0d12] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
                    <p className="font-lora text-sm text-[#d1cdb8]/80 italic">Summoning the battlefield...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-[#0c0d12] flex items-center justify-center text-[#d1cdb8] font-lora">
                <div className="text-center space-y-4 p-8 bg-[#12141a] border border-[#c5a059]/30 rounded-lg shadow-2xl">
                    <p className="font-cinzel-decorative text-2xl text-[#c5a059]">Combat Session Not Found</p>
                    <p className="text-sm text-[#d1cdb8]/70">The tactical skirmish you sought could not be retrieved from the archives.</p>
                    <Button onClick={() => router.push("/combat")} className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs font-lora px-5 py-2.5 rounded">
                        Return to Combat Arena
                    </Button>
                </div>
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

    // Get the viewed participant object for combat log and bottom inspector panel
    const viewingParticipant = viewingParticipantId ? participants.find(p => p.id === viewingParticipantId) : null;

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
        if (pct > 0.5) return 'from-emerald-600 to-emerald-400';
        if (pct > 0.25) return 'from-[#c5a059] to-[#e0bc75]';
        if (pct > 0) return 'from-red-600 to-red-400';
        return 'from-stone-800 to-stone-700';
    };

    // Target selector - shared between Attack and Damage tabs
    const TargetSelector = () => (
        <div className="font-lora">
            <Label className="text-[#c5a059] text-xs font-semibold uppercase tracking-wider mb-2 block">
                Target Combatant
            </Label>
            <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger className="bg-[#0c0d12] border border-[#c5a059]/40 text-slate-100 hover:border-[#c5a059] h-11 transition-all rounded">
                    <SelectValue placeholder="Choose a target..." />
                </SelectTrigger>
                <SelectContent className="bg-[#12141a] border border-[#c5a059]/40 text-slate-100 shadow-2xl">
                    {participants
                        .filter(p => p.current_hp > 0 && p.is_active)
                        .map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()} className="text-slate-200 focus:bg-[#c5a059]/15 focus:text-[#e0bc75] cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${p.participant_type === 'character' ? 'bg-[#c5a059]' : 'bg-red-400'
                                        }`} />
                                    <span className="font-semibold">{p.name}</span>
                                    <span className="text-[#d1cdb8]/60 text-xs ml-auto font-fira-sans">
                                        HP {p.current_hp}/{p.max_hp} • AC {p.armor_class}
                                    </span>
                                </div>
                            </SelectItem>
                        ))}
                </SelectContent>
            </Select>
            {targetParticipant && (
                <div className={`mt-2.5 px-3.5 py-2 rounded border text-sm flex items-center gap-2 font-lora transition-all ${targetParticipant.participant_type === 'character'
                    ? 'bg-[#181a21] border-[#c5a059]/40 text-[#c5a059]'
                    : 'bg-[#241315] border-red-800/60 text-red-300'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${targetParticipant.participant_type === 'character' ? 'bg-[#c5a059]' : 'bg-red-400'
                        }`} />
                    <span>Targeting: <strong className="font-bold">{targetParticipant.name}</strong></span>
                    <span className="text-[#d1cdb8]/70 ml-auto text-xs font-fira-sans">
                        HP {targetParticipant.current_hp}/{targetParticipant.max_hp} • AC {targetParticipant.armor_class}
                    </span>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0c0d12] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,#1a1d29_0%,#0c0d12_70%)] text-slate-100 flex flex-col font-lora">
            {/* Victory/Defeat Modal */}
            {combatOutcome && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in font-lora">
                    <div className={`max-w-md w-full mx-4 rounded-xl border-2 p-8 text-center space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] ${combatOutcome === 'victory'
                        ? 'bg-[#12141a] border-[#c5a059] shadow-[0_0_30px_rgba(197,160,89,0.3)]'
                        : 'bg-[#181315] border-red-700/70 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                        }`}>
                        <div className="text-6xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                            {combatOutcome === 'victory' ? '⚔️' : '💀'}
                        </div>
                        <h2 className={`font-cinzel-decorative text-3xl font-bold tracking-wider ${combatOutcome === 'victory' ? 'text-[#c5a059] drop-shadow-[0_2px_12px_rgba(197,160,89,0.5)]' : 'text-red-400'
                            }`}>
                            {combatOutcome === 'victory' ? 'Victory Achieved!' : 'Party Defeated'}
                        </h2>
                        <p className="text-[#d1cdb8]/80 text-sm leading-relaxed">
                            {combatOutcome === 'victory'
                                ? 'All opposing hostiles have fallen. The field belongs to your heroes!'
                                : 'The party has succumbed to the perils of combat...'}
                        </p>
                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={() => router.push('/combat')}
                                className="flex-1 bg-[#181a21] hover:bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/40 h-11 text-xs font-semibold rounded"
                            >
                                Back to Arena
                            </Button>
                            <Button
                                onClick={async () => {
                                    await combatApi.end(sessionId);
                                    router.push('/combat');
                                }}
                                className={`flex-1 h-11 font-bold text-xs uppercase tracking-wider rounded ${combatOutcome === 'victory'
                                    ? 'bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] shadow-[0_0_15px_rgba(197,160,89,0.4)]'
                                    : 'bg-red-800 hover:bg-red-700 text-white'
                                    }`}
                            >
                                Conclude Combat
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <div className="border-b border-[#181a21] bg-[#0c0d12]/95 backdrop-blur-md sticky top-0 z-30 font-lora">
                <div className="max-w-[1800px] mx-auto px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                        <h1 className="font-cinzel-decorative text-lg md:text-xl font-bold tracking-wider text-[#c5a059] drop-shadow-[0_2px_8px_rgba(197,160,89,0.3)] flex items-center gap-2">
                            <span>⚔</span> COMBAT SIMULATION
                        </h1>
                        <span className="inline-flex items-center px-3 py-0.5 rounded-sm text-xs font-semibold font-fira-sans border border-[#c5a059]/40 bg-[#181a21] text-[#c5a059] shadow-[0_0_10px_rgba(197,160,89,0.15)]">
                            Round {session.current_round}
                        </span>
                        <span className="inline-flex items-center px-3 py-0.5 rounded-sm text-[11px] font-semibold uppercase tracking-wider font-lora border border-[#c5a059]/25 bg-[#12141a] text-[#d1cdb8]/80">
                            {session.status || (session.is_active ? 'Active' : 'Ended')}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => router.push("/combat")}
                            variant="ghost"
                            className="text-[#d1cdb8]/70 hover:text-[#c5a059] hover:bg-[#c5a059]/10 text-xs font-medium border border-transparent hover:border-[#c5a059]/30 rounded transition-all"
                        >
                            ← Back
                        </Button>
                        <Button
                            onClick={handleEndCombat}
                            className="bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-100 border border-red-500/50 text-xs font-semibold rounded px-4 py-2 transition-all shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                            size="sm"
                        >
                            End Combat
                        </Button>
                    </div>
                </div>
            </div>

            {/* Active Turn Banner */}
            {currentParticipant && (
                <div className={`border-b transition-all duration-300 ${isEnemyTurn
                    ? 'bg-gradient-to-r from-[#241315] via-[#1a1216] to-[#0c0d12] border-red-900/50'
                    : 'bg-gradient-to-r from-[#1c1810] via-[#161722] to-[#0c0d12] border-[#c5a059]/30'
                    }`}>
                    <div className="max-w-[1800px] mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className={`w-3 h-3 rounded-full animate-pulse shadow-md ${isEnemyTurn ? 'bg-red-400 shadow-red-500/50' : 'bg-[#c5a059] shadow-[0_0_8px_rgba(197,160,89,0.8)]'
                                }`} />
                            <div>
                                <p className="text-[10px] text-[#d1cdb8]/60 uppercase tracking-widest font-semibold font-lora">Current Turn</p>
                                <h2 className={`font-cinzel-decorative text-xl sm:text-2xl md:text-3xl font-bold tracking-wide ${isEnemyTurn ? 'text-red-300 drop-shadow-[0_2px_8px_rgba(239,68,68,0.3)]' : 'text-[#c5a059] drop-shadow-[0_2px_8px_rgba(197,160,89,0.3)]'
                                    }`}>
                                    {currentParticipant.name}
                                </h2>
                            </div>
                            <div className="flex gap-4 sm:gap-6 ml-0 md:ml-8 font-lora">
                                <div className="text-center px-3 py-1 bg-[#0c0d12]/50 border border-[#c5a059]/20 rounded">
                                    <p className="text-[10px] text-[#d1cdb8]/60 uppercase font-semibold">HP</p>
                                    <p className="text-base sm:text-lg font-bold font-fira-sans text-slate-100">
                                        {currentParticipant.current_hp}<span className="text-[#d1cdb8]/40">/{currentParticipant.max_hp}</span>
                                    </p>
                                </div>
                                <div className="text-center px-3 py-1 bg-[#0c0d12]/50 border border-[#c5a059]/20 rounded">
                                    <p className="text-[10px] text-[#d1cdb8]/60 uppercase font-semibold">AC</p>
                                    <p className="text-base sm:text-lg font-bold font-fira-sans text-[#e0bc75]">{currentParticipant.armor_class}</p>
                                </div>
                                <div className="text-center px-3 py-1 bg-[#0c0d12]/50 border border-[#c5a059]/20 rounded">
                                    <p className="text-[10px] text-[#d1cdb8]/60 uppercase font-semibold">Init</p>
                                    <p className="text-base sm:text-lg font-bold font-fira-sans text-[#e0bc75]">{currentParticipant.initiative}</p>
                                </div>
                                <div className="text-center px-3 py-1 bg-[#0c0d12]/50 border border-[#c5a059]/20 rounded">
                                    <p className="text-[10px] text-[#d1cdb8]/60 uppercase font-semibold">Attacks</p>
                                    <p className={`text-base sm:text-lg font-bold font-fira-sans ${currentParticipant.attacks_remaining > 0 ? 'text-[#c5a059]' : 'text-slate-600'}`}>
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
                                        className="bg-red-950/50 hover:bg-red-900/70 border border-red-500/50 text-red-200 font-lora text-xs font-semibold h-10 px-4 rounded shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                                    >
                                        {aiProcessing ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-3.5 h-3.5 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin" />
                                                Processing...
                                            </span>
                                        ) : '🤖 AI Turn'}
                                    </Button>
                                    <Button
                                        onClick={handleAutoEnemyTurns}
                                        disabled={aiProcessing}
                                        className="bg-[#181a21] hover:bg-red-950/40 border border-red-500/40 text-red-300 font-lora text-xs font-semibold h-10 px-4 rounded"
                                    >
                                        ⚡ Auto All Enemies
                                    </Button>
                                </>
                            )}
                            <Button
                                onClick={handleNextTurn}
                                className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs uppercase tracking-wider h-10 px-6 rounded shadow-[0_0_20px_rgba(197,160,89,0.35)] hover:shadow-[0_0_25px_rgba(197,160,89,0.5)] transition-all cursor-pointer"
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
                        <div className="bg-[#12141a] rounded-lg border border-[#c5a059]/25 shadow-[0_4px_20px_rgba(0,0,0,0.35)] flex-shrink-0 overflow-hidden"
                            style={{ maxHeight: '50%' }}>
                            <div className="px-4 py-3 border-b border-[#c5a059]/20 bg-[#151722] flex justify-between items-center">
                                <h3 className="font-cinzel-decorative font-bold text-xs uppercase tracking-wider text-[#c5a059]">Initiative Order</h3>
                                <span className="font-lora text-xs text-[#d1cdb8]/60">{sortedParticipants.length} combatants</span>
                            </div>
                            <div className="overflow-y-auto p-2 space-y-1.5" style={{ maxHeight: 'calc(100% - 44px)' }}>
                                {sortedParticipants.map((p) => {
                                    const isCurrent = currentParticipant?.id === p.id;
                                    const isDead = p.current_hp <= 0;
                                    const isPlayer = p.participant_type === 'character';
                                    const isViewing = viewingParticipantId === p.id;

                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => handleViewParticipant(p.id)}
                                            className={`relative flex items-center gap-3 px-3 py-2.5 rounded border cursor-pointer transition-all duration-150 ${isCurrent
                                                ? isPlayer
                                                    ? 'bg-[#1e2230] border-[#c5a059] shadow-[0_0_12px_rgba(197,160,89,0.25)]'
                                                    : 'bg-[#281518] border-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                                                : isDead
                                                    ? 'bg-[#0c0d12]/40 border-stone-800 opacity-45'
                                                    : isViewing
                                                        ? 'bg-[#181a21] border-[#c5a059]/50'
                                                        : 'bg-[#181a21]/60 border-transparent hover:border-[#c5a059]/30 hover:bg-[#181a21]'
                                                }`}
                                        >
                                            {/* Initiative Badge */}
                                            <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold font-fira-sans flex-shrink-0 border ${isPlayer
                                                ? 'bg-[#c5a059]/20 text-[#c5a059] border-[#c5a059]/40'
                                                : 'bg-red-950/40 text-red-300 border-red-700/40'
                                                }`}>
                                                {p.initiative}
                                            </div>

                                            {/* Name + HP */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-lora font-semibold text-sm truncate ${isDead ? 'line-through text-slate-500' : 'text-slate-100'
                                                        }`}>
                                                        {p.name}
                                                    </span>
                                                    {isDead && <span className="text-xs">💀</span>}
                                                    {isCurrent && (
                                                        <span className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${isPlayer ? 'bg-[#c5a059]' : 'bg-red-400'
                                                            }`} />
                                                    )}
                                                </div>

                                                {/* HP Bar */}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex-1 h-1.5 bg-[#0c0d12] border border-[#c5a059]/15 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${damagedParticipantIds.has(p.id)
                                                                    ? 'from-red-600 to-red-400'
                                                                    : hpGradient(p.current_hp, p.max_hp)
                                                                }`}
                                                            style={{ width: `${Math.max(0, (p.current_hp / p.max_hp) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-[10px] font-fira-sans flex-shrink-0 transition-colors duration-300 ${damagedParticipantIds.has(p.id) ? 'text-red-400 font-bold' : 'text-[#d1cdb8]/60'
                                                        }`}>
                                                        {p.current_hp}/{p.max_hp}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* AC */}
                                            <div className="text-xs font-fira-sans text-[#c5a059]/80 flex-shrink-0 flex items-center gap-1">
                                                <span className="text-[10px] text-[#c5a059]">🛡</span> {p.armor_class}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Combat Log */}
                        <div className="bg-[#12141a] rounded-lg border border-[#c5a059]/25 flex-1 overflow-hidden flex flex-col min-h-0 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
                            <CombatLog
                                actions={actions}
                                selectedParticipant={viewingParticipant}
                                onClearFilter={() => setViewingParticipantId(null)}
                            />
                        </div>
                    </div>

                    {/* Right Column: Action Panel */}
                    <div className="col-span-8 h-full overflow-y-auto">
                        <div className="space-y-5">
                            {/* Action Panel Tabs */}
                            <div className="bg-[#12141a] rounded-lg border border-[#c5a059]/25 shadow-[0_4px_20px_rgba(0,0,0,0.35)] overflow-hidden">
                                {/* Tab Headers */}
                                <div className="flex border-b border-[#c5a059]/20 bg-[#151722] font-lora">
                                    <button
                                        onClick={() => setActiveTab('attack')}
                                        className={`flex-1 px-4 py-3 text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${activeTab === 'attack'
                                            ? 'text-[#c5a059] border-b-2 border-[#c5a059] bg-[#181a21]'
                                            : 'text-[#d1cdb8]/60 hover:text-[#d1cdb8] hover:bg-[#181a21]/50'
                                            }`}
                                    >
                                        ⚔️ Attack
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('damage')}
                                        className={`flex-1 px-4 py-3 text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${activeTab === 'damage'
                                            ? 'text-[#c5a059] border-b-2 border-[#c5a059] bg-[#181a21]'
                                            : 'text-[#d1cdb8]/60 hover:text-[#d1cdb8] hover:bg-[#181a21]/50'
                                            }`}
                                    >
                                        💊 Damage & Healing
                                    </button>
                                </div>

                                <div className="p-5 font-lora">
                                    {activeTab === 'attack' ? (
                                        <div className="space-y-5">
                                            {/* Actor indicator */}
                                            {currentParticipant && (
                                                <div className={`px-3.5 py-2.5 rounded border text-sm flex items-center gap-2 font-lora ${isEnemyTurn
                                                    ? 'bg-[#241315] border-red-800/40 text-red-300'
                                                    : 'bg-[#181a21] border-[#c5a059]/30 text-[#c5a059]'
                                                    }`}>
                                                    <span className={`w-2 h-2 rounded-full ${isEnemyTurn ? 'bg-red-400' : 'bg-[#c5a059]'}`} />
                                                    <span>Attacker: <strong className="font-bold">{currentParticipant.name}</strong></span>
                                                </div>
                                            )}

                                            {/* Target Selection */}
                                            <TargetSelector />

                                            {/* Attack Options */}
                                            {isEnemyTurn ? (
                                                /* Enemy Attacks */
                                                enemyAttacks.length > 0 ? (
                                                    <div>
                                                        <Label className="text-[#c5a059] font-cinzel-decorative text-xs font-bold uppercase tracking-wider mb-3 block">
                                                            Enemy Martial Attacks
                                                        </Label>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {enemyAttacks.map((attack, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => handleAttack(attack.name, attack.bonus)}
                                                                    disabled={!targetId}
                                                                    className={`text-left p-4 rounded border transition-all duration-150 ${!targetId
                                                                        ? 'bg-[#181a21]/40 border-stone-800 opacity-50 cursor-not-allowed'
                                                                        : 'bg-[#181a21] border-red-900/40 hover:border-red-500/70 hover:bg-[#241315] cursor-pointer'
                                                                        }`}
                                                                >
                                                                    <p className="font-cinzel-decorative font-bold text-sm text-red-200">{attack.name}</p>
                                                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                                        <span className="text-xs bg-red-950/40 text-red-300 border border-red-800/40 px-2 py-0.5 rounded font-fira-sans font-bold">
                                                                            +{attack.bonus} to hit
                                                                        </span>
                                                                        <span className="text-xs bg-[#12141a] text-[#d1cdb8]/80 border border-stone-700 px-2 py-0.5 rounded font-fira-sans">
                                                                            {attack.damage}
                                                                        </span>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-[#d1cdb8]/50 text-sm text-center py-4 italic">No enemy attack data available</p>
                                                )
                                            ) : (
                                                /* Player Character Attacks — Weapons + Spells */
                                                <div className="space-y-5">
                                                    {/* === WEAPONS === */}
                                                    <div>
                                                        <Label className="text-[#c5a059] font-cinzel-decorative text-xs font-bold uppercase tracking-wider mb-3 block flex items-center gap-2">
                                                            <span>⚔️ Weapons</span>
                                                            {characterWeapons.length > 0 && (
                                                                <Badge className="bg-[#181a21] text-[#c5a059] border-[#c5a059]/30 text-[10px] font-normal">
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
                                                                        className={`text-left p-4 rounded border transition-all duration-150 ${!targetId
                                                                            ? 'bg-[#181a21]/40 border-[#c5a059]/10 opacity-50 cursor-not-allowed'
                                                                            : 'bg-[#181a21] border-[#c5a059]/30 hover:border-[#c5a059] hover:shadow-[0_0_15px_rgba(197,160,89,0.2)] hover:bg-[#1a1d29] cursor-pointer'
                                                                            }`}
                                                                    >
                                                                        <p className="font-cinzel-decorative font-bold text-sm text-[#e0bc75]">{weapon.name}</p>
                                                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                                            <span className="text-xs bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30 px-2 py-0.5 rounded font-fira-sans font-bold">
                                                                                +{weapon.bonus} to hit
                                                                            </span>
                                                                            <span className="text-xs bg-red-950/40 text-red-300 border border-red-800/40 px-2 py-0.5 rounded font-fira-sans font-bold">
                                                                                {weapon.damage} + {weapon.abilityMod}
                                                                            </span>
                                                                            {weapon.damageType && (
                                                                                <span className="text-xs text-[#d1cdb8]/60 font-lora italic">{weapon.damageType}</span>
                                                                            )}
                                                                        </div>
                                                                        {weapon.properties.length > 0 && (
                                                                            <div className="flex gap-1 mt-2 flex-wrap">
                                                                                {weapon.properties.map((prop, i) => (
                                                                                    <span key={i} className="text-[10px] bg-[#12141a] text-[#d1cdb8]/60 border border-[#c5a059]/20 px-1.5 py-0.5 rounded font-lora">
                                                                                        {prop}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-5 bg-[#181a21]/40 rounded border border-dashed border-[#c5a059]/25 font-lora">
                                                                <p className="text-[#d1cdb8]/60 text-sm">No weapons in inventory</p>
                                                                <p className="text-[#d1cdb8]/40 text-xs mt-1">Equip weapons from the character sheet</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* === SPELLS === */}
                                                    {charData?.spells && charData.spells.length > 0 && (
                                                        <div>
                                                            <Label className="text-[#c5a059] font-cinzel-decorative text-xs font-bold uppercase tracking-wider mb-3 block flex items-center gap-2">
                                                                <span>✨ Spells</span>
                                                                {charData.stats?.spell_save_dc && (
                                                                    <span className="text-[10px] bg-purple-950/40 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded font-fira-sans font-medium">
                                                                        Save DC {charData.stats.spell_save_dc}
                                                                    </span>
                                                                )}
                                                                {charData.stats?.spell_attack_bonus != null && (
                                                                    <span className="text-[10px] bg-purple-950/40 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded font-fira-sans font-medium">
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
                                                                            <div key={level} className="bg-[#181a21] rounded border border-[#c5a059]/25 p-3.5 font-lora">
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <span className="text-xs font-cinzel-decorative font-bold text-[#e0bc75] uppercase tracking-wider">
                                                                                        {level === 0 ? 'Cantrips' : `Level ${level}`}
                                                                                    </span>
                                                                                    {slots && slots.total > 0 && (
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <span className="text-[10px] text-[#d1cdb8]/60">Slots:</span>
                                                                                            <div className="flex gap-1">
                                                                                                {Array.from({ length: slots.total }).map((_, i) => (
                                                                                                    <div
                                                                                                        key={i}
                                                                                                        className={`w-3 h-3 rounded-full border ${i < slots.remaining
                                                                                                            ? 'bg-[#c5a059] border-[#e0bc75]'
                                                                                                            : 'bg-[#12141a] border-stone-700'
                                                                                                            }`}
                                                                                                    />
                                                                                                ))}
                                                                                            </div>
                                                                                            <span className="text-[10px] font-fira-sans text-[#c5a059] ml-1">
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
                                                                                            className={`text-left px-3 py-2 rounded border text-xs transition-all duration-150 ${(!targetId || (slots !== null && slots.remaining <= 0))
                                                                                                ? 'bg-[#12141a]/40 border-[#c5a059]/15 opacity-40 cursor-not-allowed'
                                                                                                : 'bg-[#12141a] border-[#c5a059]/30 hover:border-[#c5a059] hover:bg-[#c5a059]/10 text-slate-100 hover:text-[#e0bc75] cursor-pointer'
                                                                                                }`}
                                                                                        >
                                                                                            <span className="font-semibold">{spell.name}</span>
                                                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                                                {spell.spell_details?.school_display && (
                                                                                                    <span className="text-[10px] text-[#c5a059]/70">{spell.spell_details.school_display}</span>
                                                                                                )}
                                                                                                {spell.spell_details?.concentration && (
                                                                                                    <span className="text-[10px] bg-amber-950/40 text-amber-300 border border-amber-800/40 px-1 rounded">C</span>
                                                                                                )}
                                                                                                {spell.spell_details?.ritual && (
                                                                                                    <span className="text-[10px] bg-blue-950/40 text-blue-300 border border-blue-800/40 px-1 rounded">R</span>
                                                                                                )}
                                                                                                {spell.spell_details?.range && (
                                                                                                    <span className="text-[10px] text-[#d1cdb8]/50">{spell.spell_details.range}</span>
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
                                        <div className="space-y-5 font-lora">
                                            {/* Target Selection - shared */}
                                            <TargetSelector />

                                            <div className="grid grid-cols-2 gap-6">
                                                {/* Damage */}
                                                <div className="space-y-3">
                                                    <h4 className="font-cinzel-decorative font-bold text-xs uppercase tracking-wider text-red-400 flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-red-400 rounded-full" />
                                                        Apply Martial Damage
                                                    </h4>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="number"
                                                            value={damageAmount}
                                                            onChange={(e) => setDamageAmount(e.target.value)}
                                                            placeholder="Damage amount"
                                                            className="bg-[#0c0d12] border border-[#c5a059]/40 focus:border-[#c5a059] text-slate-100 placeholder-[#d1cdb8]/30 rounded h-11 font-fira-sans"
                                                        />
                                                        <Button
                                                            onClick={handleApplyDamage}
                                                            disabled={!damageAmount || !targetId}
                                                            className="bg-red-950/60 hover:bg-red-900 border border-red-500/50 text-red-200 font-lora font-bold text-xs uppercase tracking-wider h-11 px-5 rounded shadow-[0_0_12px_rgba(239,68,68,0.2)] cursor-pointer"
                                                        >
                                                            Damage
                                                        </Button>
                                                    </div>
                                                    {!targetId && (
                                                        <p className="text-xs text-[#d1cdb8]/50 italic">Select a target above first</p>
                                                    )}
                                                </div>

                                                {/* Healing */}
                                                <div className="space-y-3">
                                                    <h4 className="font-cinzel-decorative font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                                                        Apply Restoration
                                                    </h4>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="number"
                                                            value={healAmount}
                                                            onChange={(e) => setHealAmount(e.target.value)}
                                                            placeholder="Healing amount"
                                                            className="bg-[#0c0d12] border border-[#c5a059]/40 focus:border-[#c5a059] text-slate-100 placeholder-[#d1cdb8]/30 rounded h-11 font-fira-sans"
                                                        />
                                                        <Button
                                                            onClick={handleApplyHealing}
                                                            disabled={!healAmount || !targetId}
                                                            className="bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 font-lora font-bold text-xs uppercase tracking-wider h-11 px-5 rounded shadow-[0_0_12px_rgba(34,197,94,0.2)] cursor-pointer"
                                                        >
                                                            Heal
                                                        </Button>
                                                    </div>
                                                    {!targetId && (
                                                        <p className="text-xs text-[#d1cdb8]/50 italic">Select a target above first</p>
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
                                    <div className="bg-[#12141a] rounded-lg border border-[#c5a059]/25 p-5 font-lora shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-cinzel-decorative text-xl font-bold text-[#c5a059] tracking-wide">{viewed.name}</h3>
                                                <p className="text-xs text-[#d1cdb8]/60 mt-0.5 font-lora">
                                                    {viewed.participant_type === 'character' ? 'Player Character' : 'Enemy Hostile'}
                                                </p>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="text-center px-3 py-1 bg-[#181a21] border border-[#c5a059]/20 rounded">
                                                    <p className="text-[10px] text-[#d1cdb8]/60 uppercase font-semibold">AC</p>
                                                    <p className="text-lg font-bold font-fira-sans text-[#e0bc75]">{viewed.armor_class}</p>
                                                </div>
                                                <div className="text-center px-3 py-1 bg-[#181a21] border border-[#c5a059]/20 rounded">
                                                    <p className="text-[10px] text-[#d1cdb8]/60 uppercase font-semibold">Init</p>
                                                    <p className="text-lg font-bold font-fira-sans text-[#e0bc75]">{viewed.initiative}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Full-width HP bar */}
                                        <div>
                                            <div className="flex justify-between text-xs mb-1.5 font-lora">
                                                <span className="text-[#d1cdb8]/70">Hit Points</span>
                                                <span className="font-fira-sans font-bold text-slate-100">
                                                    {viewed.current_hp} <span className="text-[#d1cdb8]/40">/ {viewed.max_hp}</span>
                                                </span>
                                            </div>
                                            <div className="w-full h-2.5 bg-[#0c0d12] border border-[#c5a059]/20 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${hpGradient(viewed.current_hp, viewed.max_hp)}`}
                                                    style={{ width: `${Math.max(0, hpPct)}%` }}
                                                />
                                            </div>
                                        </div>
                                        {/* Equipped Items */}
                                        {viewed.equipped_items && (
                                            <div className="mt-3.5 flex flex-wrap gap-2">
                                                {viewed.equipped_items.weapon && (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-[#181a21] text-[#c5a059] border border-[#c5a059]/30 px-2.5 py-1 rounded">
                                                        ⚔️ {viewed.equipped_items.weapon.name} ({viewed.equipped_items.weapon.damage_dice})
                                                    </span>
                                                )}
                                                {viewed.equipped_items.armor && (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-[#181a21] text-[#e0bc75] border border-[#c5a059]/30 px-2.5 py-1 rounded">
                                                        🛡 {viewed.equipped_items.armor.name}
                                                    </span>
                                                )}
                                                {viewed.equipped_items.shield && (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-[#181a21] text-[#e0bc75] border border-[#c5a059]/30 px-2.5 py-1 rounded">
                                                        🛡 {viewed.equipped_items.shield.name}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Enemy Stat Block */}
                                        {viewed.participant_type === 'enemy' && viewed.enemy_stats && (
                                            <div className="mt-4 space-y-3 font-lora">
                                                {/* Ability Scores Grid */}
                                                <div>
                                                    <h4 className="text-xs font-cinzel-decorative font-bold text-[#c5a059] uppercase tracking-wider mb-2">Ability Scores</h4>
                                                    <div className="grid grid-cols-6 gap-2">
                                                        {Object.entries(viewed.enemy_stats.ability_scores).map(([ability, data]) => (
                                                            <div key={ability} className="bg-[#181a21] rounded border border-[#c5a059]/25 text-center p-2">
                                                                <p className="text-[10px] font-semibold text-[#d1cdb8]/60 uppercase">{ability.slice(0, 3)}</p>
                                                                <p className="text-base font-bold font-fira-sans text-[#c5a059]">{data.score}</p>
                                                                <p className={`text-xs font-fira-sans font-bold ${data.modifier >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                    {data.modifier >= 0 ? '+' : ''}{data.modifier}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Speed & Proficiency */}
                                                <div className="flex flex-wrap gap-2">
                                                    {viewed.enemy_stats.speed && (
                                                        <span className="text-xs bg-[#181a21] text-[#d1cdb8] border border-[#c5a059]/25 px-2 py-0.5 rounded">
                                                            🏃 {viewed.enemy_stats.speed}
                                                        </span>
                                                    )}
                                                    {viewed.enemy_stats.proficiency_bonus && (
                                                        <span className="text-xs bg-[#181a21] text-[#c5a059] border border-[#c5a059]/30 px-2 py-0.5 rounded font-fira-sans">
                                                            Prof +{viewed.enemy_stats.proficiency_bonus}
                                                        </span>
                                                    )}
                                                    {viewed.enemy_stats.senses?.darkvision && (
                                                        <span className="text-xs bg-[#181a21] text-[#d1cdb8]/80 border border-stone-700 px-2 py-0.5 rounded">
                                                            👁 Darkvision {viewed.enemy_stats.senses.darkvision}
                                                        </span>
                                                    )}
                                                    {viewed.enemy_stats.senses?.passive_perception && (
                                                        <span className="text-xs bg-[#181a21] text-[#d1cdb8]/80 border border-stone-700 px-2 py-0.5 rounded font-fira-sans">
                                                            PP {viewed.enemy_stats.senses.passive_perception}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Saving Throws */}
                                                {Object.values(viewed.enemy_stats.saving_throws).some(v => v !== null) && (
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-[#d1cdb8]/70 uppercase tracking-wider mb-1">Saving Throws</h4>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {Object.entries(viewed.enemy_stats.saving_throws)
                                                                .filter(([, val]) => val !== null)
                                                                .map(([ability, val]) => (
                                                                    <span key={ability} className="text-xs bg-[#181a21] text-[#e0bc75] border border-[#c5a059]/20 px-2 py-0.5 rounded font-fira-sans">
                                                                        {ability.toUpperCase()} +{val}
                                                                    </span>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Enemy Attacks */}
                                                {viewed.enemy_attacks && viewed.enemy_attacks.length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-cinzel-decorative font-bold text-red-400 uppercase tracking-wider mb-2">Martial Attacks</h4>
                                                        <div className="space-y-1.5">
                                                            {viewed.enemy_attacks.map((atk, i) => (
                                                                <div key={i} className="flex items-center gap-3 bg-[#181a21] rounded px-3 py-2 border border-[#c5a059]/20">
                                                                    <span className="text-sm font-semibold text-slate-200">{atk.name}</span>
                                                                    <span className="text-xs bg-red-950/40 text-red-300 border border-red-800/40 px-1.5 py-0.5 rounded font-fira-sans font-bold">
                                                                        +{atk.bonus}
                                                                    </span>
                                                                    <span className="text-xs bg-[#12141a] text-[#d1cdb8]/80 border border-stone-700 px-1.5 py-0.5 rounded font-fira-sans">
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
                                                        <h4 className="text-xs font-cinzel-decorative font-bold text-[#c5a059] uppercase tracking-wider mb-2">Special Abilities</h4>
                                                        <div className="space-y-1.5">
                                                            {viewed.enemy_abilities.map((ab, i) => (
                                                                <div key={i} className="bg-[#181a21] rounded px-3 py-2 border border-[#c5a059]/20">
                                                                    <p className="text-sm font-semibold text-[#e0bc75]">{ab.name}</p>
                                                                    <p className="text-xs text-[#d1cdb8]/70 mt-0.5 leading-relaxed">{ab.description}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Resistances/Immunities */}
                                                {viewed.enemy_resistances && viewed.enemy_resistances.length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-[#d1cdb8]/70 uppercase tracking-wider mb-1">Resistances & Immunities</h4>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {viewed.enemy_resistances.map((r, i) => (
                                                                <span key={i} className={`text-xs px-2 py-0.5 rounded border ${r.type === 'immunity' ? 'bg-[#c5a059]/15 text-[#c5a059] border-[#c5a059]/30' :
                                                                    r.type === 'vulnerability' ? 'bg-red-950/40 text-red-300 border-red-800/40' :
                                                                        'bg-[#181a21] text-[#d1cdb8]/70 border-stone-700'
                                                                    }`}>
                                                                    {r.type === 'immunity' ? '🛡' : r.type === 'vulnerability' ? '⚠' : '↓'} {r.damage_type}
                                                                </span>
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
                                                    <span key={i} className="bg-purple-950/40 text-purple-300 border border-purple-800/40 text-xs px-2 py-0.5 rounded font-fira-sans">
                                                        {cond}
                                                    </span>
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
