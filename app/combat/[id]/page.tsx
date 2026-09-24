"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { combatApi } from "@/lib/api/combat";
import { enemiesApi } from "@/lib/api/enemies";
import { gauntletApi } from "@/lib/api/gauntlet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CombatLog } from "./CombatLog";
import { MonsterStatblockModal } from "@/components/monsters/MonsterStatblockModal";
import { ConditionBadge } from "@/components/combat/ConditionBadge";
import { GauntletArenaHud } from "@/components/gauntlet/GauntletArenaHud";
import { RespiteModal } from "@/components/gauntlet/RespiteModal";
import { VictoryDefeatModal } from "@/components/gauntlet/VictoryDefeatModal";
import { InitiativeRibbon } from "@/components/combat/InitiativeRibbon";
import { BattlefieldArena, type AttackFeedback } from "@/components/combat/BattlefieldArena";
import { ActionDock } from "@/components/combat/ActionDock";
import { SpellCastModal } from "@/components/combat/SpellCastModal";
import { CombatLogDrawer } from "@/components/combat/CombatLogDrawer";
import { ParticipantInspectorDrawer } from "@/components/combat/ParticipantInspectorDrawer";
import { isIncapacitating } from "@/lib/data/conditions";
import type { CombatSession, CombatParticipant, CombatAction, CharacterSpell, AoETargetingConfig } from "@/lib/types/combat";
import type { Enemy, Attack } from "@/lib/types/enemy";
import type { GauntletRun } from "@/lib/types/gauntlet";

export default function CombatPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = Number(params.id);
    const gauntletRunId = searchParams?.get('gauntletRunId') ? Number(searchParams.get('gauntletRunId')) : null;
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
    const [statblockParticipant, setStatblockParticipant] = useState<CombatParticipant | null>(null);
    const [isAttacking, setIsAttacking] = useState(false);
    const [lastAttackFeedback, setLastAttackFeedback] = useState<AttackFeedback | null>(null);
    const [selectedSpellForCast, setSelectedSpellForCast] = useState<CharacterSpell | null>(null);
    const [isCastingSpell, setIsCastingSpell] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [isMovementOperating, setIsMovementOperating] = useState(false);
    const [aoeTargeting, setAoeTargeting] = useState<AoETargetingConfig | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "duel">("grid");

    const [activeTab, setActiveTab] = useState<'attack' | 'damage'>('attack');
    const [aiActionBanner, setAiActionBanner] = useState<{ message: string; isHit: boolean } | null>(null);
    const [gauntletRun, setGauntletRun] = useState<GauntletRun | null>(null);
    const [isRespiteOpen, setIsRespiteOpen] = useState(false);
    const [gauntletModalType, setGauntletModalType] = useState<'victory' | 'defeat' | null>(null);
    const logRef = useRef<HTMLDivElement>(null);
    const sessionRef = useRef<CombatSession | null>(null);
    const isAiRunningRef = useRef(false);
    const hasSyncedWaveRef = useRef(false);

    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    // In Gauntlet, automatically trigger autonomous enemy turns when it is an enemy's turn
    useEffect(() => {
        if (!session || !gauntletRunId || isAiRunningRef.current) return;
        if (session.status === 'ended' || combatOutcome) return;

        const current = getCurrentParticipant();
        if (current && current.participant_type === 'enemy' && current.current_hp > 0 && current.is_active) {
            const timer = setTimeout(() => {
                if (!isAiRunningRef.current) {
                    stepByStepEnemyTurns();
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [session?.current_turn_index, session?.current_round, session?.id, gauntletRunId, combatOutcome, session?.participants]);

    const formatAiActionSummary = (aiActions: any[]) => {
        if (!aiActions || aiActions.length === 0) return null;

        // Trigger floating combat text for AI attack against player
        const attackAction = aiActions.find((a: any) => a.hit !== undefined || a.type === 'attack');
        if (attackAction && sessionRef.current?.participants) {
            const targetP = sessionRef.current.participants.find(p => p.name === attackAction.target);
            if (targetP) {
                setLastAttackFeedback({
                    targetId: targetP.id,
                    hit: !!attackAction.hit,
                    critical: !!attackAction.critical,
                    damage: attackAction.damage || 0,
                    timestamp: Date.now(),
                });
            }
        }

        const messages = aiActions.map((a: any) => {
            if (a.type === 'special_action' || a.type === 'skip') return a.message;
            if (a.message) return a.message;
            const pt = a.pack_tactics ? ' [Pack Tactics (Advantage)]' : a.is_advantage ? ' [Advantage]' : a.is_disadvantage ? ' [Disadvantage]' : '';
            if (a.fumble) return `⚠️ ${a.attacker} fumbled attack with ${a.attack_name}!`;
            if (a.hit) {
                const crit = a.critical ? ' CRITICAL HIT' : ' hit';
                const condName = typeof a.condition_applied === 'string' ? a.condition_applied : a.condition_applied?.name;
                const cond = condName ? ` (Inflicted ${condName}!)` : '';
                return `💥 ${a.attacker}${crit} ${a.target} with ${a.attack_name}${pt} for ${a.damage} damage!${cond}`;
            }
            return `🛡️ ${a.attacker} attacked ${a.target} with ${a.attack_name}${pt} but missed (rolled ${a.attack_total} vs AC ${a.target_ac}).`;
        });
        const hasHit = aiActions.some((a: any) => a.hit || a.type === 'special_action');
        return { message: messages.join(' • '), isHit: hasHit };
    };

    useEffect(() => {
        if (gauntletRunId) {
            gauntletApi.getRun(gauntletRunId)
                .then(res => {
                    setGauntletRun(res.data);
                    if (res.data.status === 'respite') {
                        setIsRespiteOpen(true);
                    }
                })
                .catch(err => console.error("Failed to load gauntlet run:", err));
        }
    }, [gauntletRunId, sessionId]);

    const handleGauntletNextWave = (nextSessionId: number) => {
        hasSyncedWaveRef.current = false;
        setCombatOutcome(null);
        setIsRespiteOpen(false);
        router.push(`/combat/${nextSessionId}?gauntletRunId=${gauntletRunId}`);
    };

    const handleGauntletClaimVictory = async () => {
        if (!gauntletRunId) return;
        try {
            const resp = await gauntletApi.claimVictory(gauntletRunId);
            setGauntletRun(resp.data.run);
            setIsRespiteOpen(false);
            setGauntletModalType('victory');
        } catch (err) {
            console.error("Failed to claim gauntlet victory:", err);
        }
    };

    const handleGauntletEnterEndless = async () => {
        if (!gauntletRunId) return;
        try {
            const resp = await gauntletApi.enterEndless(gauntletRunId);
            setGauntletRun(resp.data.run);
        } catch (err) {
            console.error("Failed to enter endless overtime:", err);
        }
    };

    // Check for combat victory or defeat
    const checkCombatOutcome = (participants: CombatParticipant[]): boolean => {
        const players = participants.filter(p => p.participant_type === 'character');
        const enemies = participants.filter(p => p.participant_type === 'enemy');
        const allPlayersDead = players.length > 0 && players.every(p => p.current_hp <= 0);
        const allEnemiesDead = enemies.length > 0 && enemies.every(p => p.current_hp <= 0);

        if (gauntletRunId) {
            if (allEnemiesDead) {
                setCombatOutcome('victory');
                if (!hasSyncedWaveRef.current) {
                    hasSyncedWaveRef.current = true;
                    gauntletApi.syncWave(gauntletRunId)
                        .then(syncResp => {
                            setGauntletRun(syncResp.data.run);
                            setIsRespiteOpen(true);
                        })
                        .catch(e => console.error("Failed to sync gauntlet wave:", e));
                }
                return true;
            } else if (allPlayersDead) {
                setCombatOutcome('defeat');
                setGauntletModalType('defeat');
                if (!hasSyncedWaveRef.current) {
                    hasSyncedWaveRef.current = true;
                    gauntletApi.syncWave(gauntletRunId)
                        .then(syncResp => {
                            setGauntletRun(syncResp.data.run);
                        })
                        .catch(e => console.error("Failed to sync gauntlet defeat:", e));
                }
                return true;
            }
        }

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
        const current = (session as any).current_participant;
        if (current && current.is_active && current.current_hp > 0) {
            return current;
        }
        return participants.find(p => p.is_active && p.current_hp > 0);
    };

    // Reset view mode back to tactical grid whenever a character's turn ends or turn advances
    useEffect(() => {
        setViewMode("grid");
    }, [session?.current_participant?.id, session?.current_round, session?.current_turn_index]);

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
        if (isAiRunningRef.current) return;
        isAiRunningRef.current = true;
        setAiProcessing(true);

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        try {
            // Keep resolving as long as the current participant is an enemy
            let safetyLimit = 25; // prevent infinite loops
            while (safetyLimit-- > 0) {
                const currentSession = sessionRef.current;
                if (!currentSession || currentSession.status === 'ended' || combatOutcome) break;

                const active = currentSession.current_participant || (currentSession.participants || []).find(p => p.is_active && p.current_hp > 0);
                if (!active || active.participant_type !== 'enemy' || active.current_hp <= 0) break;

                try {
                    const res = await combatApi.aiTurn(sessionId);
                    const updatedSession = res.data.session;

                    // Display actionable summary banner
                    const summary = formatAiActionSummary(res.data.actions);
                    if (summary) {
                        setAiActionBanner(summary);
                        setTimeout(() => setAiActionBanner(null), 4000);
                    }

                    // Collect IDs of participants that took damage this turn
                    const hitTargetIds = new Set<number>(
                        res.data.actions
                            .filter(a => a.hit && a.damage && a.damage > 0 && a.target_id != null)
                            .map(a => a.target_id as number)
                    );

                    // Show lingering state: updated HP & conditions, but the attacking enemy remains the active participant
                    const lingeringSession: CombatSession = {
                        ...currentSession,
                        participants: updatedSession.participants,
                        actions: updatedSession.actions,
                    };
                    setSession(lingeringSession);
                    sessionRef.current = lingeringSession;

                    // Flash red on damaged participants
                    if (hitTargetIds.size > 0) {
                        setDamagedParticipantIds(hitTargetIds);
                        setTimeout(() => setDamagedParticipantIds(new Set()), 1000);
                    }

                    // Linger for 1.2s so player can see who attacked, the roll, floating text, and damage
                    await sleep(1200);

                    // Advance to the new turn
                    sessionRef.current = updatedSession;
                    setSession(updatedSession);

                    if (updatedSession.participants) {
                        if (checkCombatOutcome(updatedSession.participants)) break;
                    }

                    // Check if the next participant is still an enemy; if not, stop
                    const next = updatedSession.current_participant;
                    if (!next || next.participant_type !== 'enemy' || next.current_hp <= 0) break;

                    // Brief pause before next enemy strikes
                    await sleep(400);
                } catch (err: any) {
                    console.error('Step-by-step AI turn failed:', err);
                    await loadSession();
                    break;
                }
            }
        } finally {
            isAiRunningRef.current = false;
            setAiProcessing(false);
        }
    };

    const handleNextTurn = async () => {
        if (aiProcessing || isAiRunningRef.current) return;
        setViewMode("grid");
        try {
            const response = await combatApi.nextTurn(sessionId);
            const updatedSession = response.data.session;
            sessionRef.current = updatedSession;
            setSession(updatedSession);
            if (updatedSession.participants) checkCombatOutcome(updatedSession.participants);

            // Auto-resolve enemy turns step-by-step so HP bars update live
            const nextParticipant = updatedSession.current_participant;
            if (nextParticipant && nextParticipant.participant_type === 'enemy' && nextParticipant.current_hp > 0) {
                await stepByStepEnemyTurns();
            }
        } catch (error: any) {
            alert(`Failed to advance turn: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleAiTurn = async () => {
        if (aiProcessing || isAiRunningRef.current) return;
        await stepByStepEnemyTurns();
    };

    const handleAutoEnemyTurns = async () => {
        await stepByStepEnemyTurns();
    };

    const handleAttack = async (
        attackName: string,
        attackBonus: number,
        options?: { advantage?: boolean; disadvantage?: boolean; dm_override?: boolean; inspiration?: boolean; is_ranged?: boolean }
    ) => {
        const current = getCurrentParticipant();
        if (!current || !targetId) {
            alert("Please select a target for the attack");
            return;
        }
        if (currentIsIncapacitated) {
            alert(`${current.name} is ${incapacitatingName} and cannot take actions or reactions. Please end your turn.`);
            return;
        }
        if (current.attacks_remaining <= 0) {
            alert(`${current.name} has no attacks remaining this turn. Please end your turn or take a different action.`);
            return;
        }
        if (isAttacking) return;
        setIsAttacking(true);
        try {
            const res = await combatApi.attack(sessionId, {
                attacker_id: current.id,
                target_id: parseInt(targetId),
                attack_name: attackName,
                attack_bonus: attackBonus,
                advantage: options?.advantage,
                disadvantage: options?.disadvantage,
                dm_override: options?.dm_override,
                inspiration: options?.inspiration,
                is_ranged: options?.is_ranged,
            });
            if (res.data) {
                const dmgAmount = res.data.damage_amount || res.data.damage || 0;
                const isHit = !!res.data.hit;
                const tid = parseInt(targetId);

                setLastAttackFeedback({
                    targetId: tid,
                    hit: isHit,
                    critical: !!res.data.critical,
                    damage: dmgAmount,
                    timestamp: Date.now(),
                });

                if (isHit && dmgAmount > 0) {
                    setDamagedParticipantIds(prev => new Set([...prev, tid]));
                    setTimeout(() => {
                        setDamagedParticipantIds(prev => {
                            const next = new Set(prev);
                            next.delete(tid);
                            return next;
                        });
                    }, 1200);
                }

                if (res.data.session) {
                    const freshSession = { ...res.data.session };
                    const newTargetHp = res.data.target_hp;
                    if (newTargetHp !== undefined && freshSession.participants) {
                        freshSession.participants = freshSession.participants.map((p: CombatParticipant) => 
                            p.id === tid ? { ...p, current_hp: newTargetHp as number } : p
                        );
                    }
                    const newAttacksRemaining = res.data.attacks_remaining;
                    if (newAttacksRemaining !== undefined && freshSession.participants) {
                        freshSession.participants = freshSession.participants.map((p: CombatParticipant) => 
                            p.id === current.id ? { ...p, attacks_remaining: newAttacksRemaining as number } : p
                        );
                    }
                    sessionRef.current = freshSession;
                    setSession(freshSession);
                    if (freshSession.participants) {
                        checkCombatOutcome(freshSession.participants);
                    }
                } else if (res.data.target_hp !== undefined) {
                    setSession(prev => {
                        if (!prev) return prev;
                        const nextSession = {
                            ...prev,
                            participants: prev.participants.map(p => {
                                if (p.id === tid) return { ...p, current_hp: res.data.target_hp };
                                if (p.id === current.id && res.data.attacks_remaining !== undefined) {
                                    return { ...p, attacks_remaining: res.data.attacks_remaining };
                                }
                                return p;
                            })
                        };
                        sessionRef.current = nextSession;
                        return nextSession;
                    });
                }
            }
            if (!res.data?.session) {
                await loadSession();
            }
        } catch (error: any) {
            const errMsg = error.response?.data?.error || 
                (typeof error.response?.data === 'string' ? error.response.data : null) ||
                (error.response?.data && typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : null) ||
                error.message;
            alert(`Attack failed: ${errMsg}`);
        } finally {
            setIsAttacking(false);
        }
    };

    const handleCastSpell = async (data: {
        casterId: number;
        targetId: number | null;
        targetIds?: number[];
        spellName: string;
        spellLevel: number;
        saveType?: string;
        saveDc?: number;
        damageString?: string;
        isHealing?: boolean;
        isRitual?: boolean;
        requiresConcentration?: boolean;
        isBonusAction?: boolean;
        castingTime?: string;
        halfOnSave?: boolean;
    }) => {
        const current = getCurrentParticipant();
        if (!current) return;
        if (current.is_active && current.conditions?.some((c: any) => isIncapacitating(c))) {
            alert(`${current.name} is ${incapacitatingName} and cannot take actions.`);
            return;
        }
        if (data.isBonusAction) {
            if (current.bonus_action_used) {
                alert(`${current.name} has already used their bonus action this turn.`);
                return;
            }
        } else {
            if (current.attacks_remaining <= 0 || current.action_used) {
                alert(`${current.name} has no actions remaining this turn. Please end your turn.`);
                return;
            }
        }
        if (isCastingSpell) return;
        setIsCastingSpell(true);
        try {
            const res = await combatApi.castSpell(sessionId, {
                caster_id: data.casterId,
                target_id: data.targetId,
                target_ids: data.targetIds,
                spell_name: data.spellName,
                spell_level: data.spellLevel,
                save_type: data.saveType,
                save_dc: data.saveDc,
                damage_string: data.damageString,
                is_healing: data.isHealing,
                is_ritual: data.isRitual,
                requires_concentration: data.requiresConcentration,
                is_bonus_action: data.isBonusAction,
                casting_time: data.castingTime,
                half_on_save: data.halfOnSave,
            });

            if (res.data) {
                const targetResults = res.data.target_results || [];
                const resolvedTargetId = res.data.target_id || data.targetId;

                // Handle feedback for single or primary target
                if (resolvedTargetId) {
                    setLastAttackFeedback({
                        targetId: resolvedTargetId,
                        hit: res.data.is_healing ? true : (res.data.save_success === false || !res.data.save_type),
                        damage: res.data.damage || 0,
                        timestamp: Date.now(),
                        spellName: res.data.spell_name,
                        isSpell: true,
                        isHealing: !!res.data.is_healing,
                        healingAmount: res.data.healing_amount || 0,
                        saveSuccess: res.data.save_success,
                        conditionApplied: res.data.condition_applied,
                    });
                }

                // Handle damage flashes for all affected targets
                const newlyDamagedIds: number[] = [];
                if (targetResults.length > 0) {
                    for (const tr of targetResults) {
                        if (tr.damage > 0) newlyDamagedIds.push(tr.target_id);
                    }
                } else if (res.data.damage && res.data.damage > 0 && resolvedTargetId) {
                    newlyDamagedIds.push(resolvedTargetId);
                }

                if (newlyDamagedIds.length > 0) {
                    setDamagedParticipantIds(prev => new Set([...prev, ...newlyDamagedIds]));
                    setTimeout(() => {
                        setDamagedParticipantIds(prev => {
                            const next = new Set(prev);
                            for (const id of newlyDamagedIds) next.delete(id);
                            return next;
                        });
                    }, 1200);
                }

                if (res.data.session) {
                    const freshSession = { ...res.data.session };
                    if (freshSession.participants) {
                        if (targetResults.length > 0) {
                            const hpMap = new Map(targetResults.map(tr => [tr.target_id, tr.target_hp]));
                            freshSession.participants = freshSession.participants.map((p: CombatParticipant) =>
                                hpMap.has(p.id) ? { ...p, current_hp: hpMap.get(p.id)! } : p
                            );
                        } else if (res.data.target_hp !== undefined && data.targetId) {
                            freshSession.participants = freshSession.participants.map((p: CombatParticipant) =>
                                p.id === data.targetId ? { ...p, current_hp: res.data.target_hp as number } : p
                            );
                        }
                    }
                    sessionRef.current = freshSession;
                    setSession(freshSession);
                    if (freshSession.participants) {
                        checkCombatOutcome(freshSession.participants);
                    }
                }
            }
            if (!res.data?.session) {
                await loadSession();
            }
            setSelectedSpellForCast(null);
        } catch (error: any) {
            const errMsg = error.response?.data?.error ||
                (typeof error.response?.data === 'string' ? error.response.data : null) ||
                (error.response?.data && typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : null) ||
                error.message;
            alert(`Spellcasting failed: ${errMsg}`);
        } finally {
            setIsCastingSpell(false);
        }
    };

    // FIX: damage/healing now use targetId, not the initiative-selected participant
    const handleApplyDamage = async () => {
        if (!targetId || !damageAmount) return;
        try {
            const current = getCurrentParticipant();
            const tid = parseInt(targetId);
            const res = await combatApi.applyDamage(tid, {
                amount: parseInt(damageAmount),
                source_id: current?.id
            });
            setDamageAmount("");
            if (res.data?.participant) {
                setDamagedParticipantIds(prev => new Set([...prev, tid]));
                setTimeout(() => {
                    setDamagedParticipantIds(prev => {
                        const next = new Set(prev);
                        next.delete(tid);
                        return next;
                    });
                }, 1000);
                setSession(prev => {
                    if (!prev) return prev;
                    const nextSession = {
                        ...prev,
                        participants: prev.participants.map(p => p.id === tid ? { ...p, current_hp: res.data.current_hp } : p)
                    };
                    sessionRef.current = nextSession;
                    return nextSession;
                });
            }
            await loadSession();
        } catch (error) {
            console.error("Failed to apply damage:", error);
        }
    };

    const handleApplyHealing = async () => {
        if (!targetId || !healAmount) return;
        const target = participants.find(p => p.id === parseInt(targetId));
        if (target?.participant_type === 'enemy' && target.current_hp <= 0) {
            alert("Cannot heal a defeated enemy!");
            return;
        }
        try {
            const current = getCurrentParticipant();
            const tid = parseInt(targetId);
            const res = await combatApi.applyHealing(tid, {
                amount: parseInt(healAmount),
                source_id: current?.id
            });
            setHealAmount("");
            if (res.data?.participant) {
                setSession(prev => {
                    if (!prev) return prev;
                    const nextSession = {
                        ...prev,
                        participants: prev.participants.map(p => p.id === tid ? { ...p, current_hp: res.data.current_hp } : p)
                    };
                    sessionRef.current = nextSession;
                    return nextSession;
                });
            }
            await loadSession();
        } catch (error: any) {
            console.error("Failed to apply healing:", error);
            alert(error.response?.data?.error || "Failed to apply healing.");
        }
    };

    const handleUseItem = async (itemName: string, customTargetId?: number) => {
        const current = getCurrentParticipant();
        if (!current) return;
        const target = customTargetId || current.id;
        try {
            const res = await combatApi.useItem(sessionId, {
                participant_id: current.id,
                target_id: target,
                item_name: itemName,
            });
            const actualHealed = res.data.actual_healed ?? res.data.heal_amount;
            setDamagedParticipantIds(prev => new Set(prev).add(target));
            setTimeout(() => {
                setDamagedParticipantIds(prev => {
                    const next = new Set(prev);
                    next.delete(target);
                    return next;
                });
            }, 1200);
            setLastAttackFeedback({
                targetId: target,
                hit: true,
                isHealing: true,
                healingAmount: actualHealed,
                spellName: itemName,
                timestamp: Date.now(),
            });
            await loadSession();
        } catch (error: any) {
            console.error("Failed to use item:", error);
            alert(error.response?.data?.error || "Failed to use item.");
        }
    };

    const handleUseFeature = async (
        featureName: string,
        amount?: number,
        customTargetId?: number,
        curePoison?: boolean,
        extraData?: Record<string, any>
    ) => {
        const current = getCurrentParticipant();
        if (!current) return;
        const target = customTargetId || current.id;
        try {
            const res = await combatApi.useFeature(sessionId, {
                participant_id: current.id,
                target_id: target,
                feature_name: featureName,
                amount: amount,
                cure_poison: curePoison,
                ...extraData,
            });
            const actualHealed = res.data.actual_healed ?? (amount || 0);
            const fnLower = featureName.toLowerCase();
            const isHealing = actualHealed > 0 || (fnLower.includes('lay on hands') && !curePoison) || fnLower.includes('second wind');

            setDamagedParticipantIds(prev => new Set(prev).add(target));
            setTimeout(() => {
                setDamagedParticipantIds(prev => {
                    const next = new Set(prev);
                    next.delete(target);
                    return next;
                });
            }, 1200);

            setLastAttackFeedback({
                targetId: target,
                hit: true,
                isHealing: isHealing,
                isFeature: !isHealing,
                healingAmount: isHealing ? actualHealed : undefined,
                spellName: featureName,
                timestamp: Date.now(),
            });
            await loadSession();
        } catch (error: any) {
            console.error("Failed to use feature:", error);
            alert(error.response?.data?.error || "Failed to use class feature.");
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

    // 5E Tactical Movement Handlers
    const handleMove = async (targetX: number, targetY: number) => {
        const current = getCurrentParticipant();
        if (!current || !sessionId) return;
        setIsMoving(true);

        // Instant optimistic update on local state so the token moves with 0ms latency
        setSession(prev => {
            if (!prev) return prev;
            const updatedParticipants = prev.participants.map(p =>
                p.id === current.id ? { ...p, position_x: targetX, position_y: targetY } : p
            );
            const updatedCurrent = prev.current_participant?.id === current.id
                ? { ...prev.current_participant, position_x: targetX, position_y: targetY }
                : prev.current_participant;
            return {
                ...prev,
                participants: updatedParticipants,
                current_participant: updatedCurrent,
            };
        });

        try {
            const resp = await combatApi.move(sessionId, {
                participant_id: current.id,
                target_x: targetX,
                target_y: targetY,
            });
            if (resp.data.session) {
                const freshSession = { ...resp.data.session };
                if (resp.data.participant) {
                    freshSession.participants = freshSession.participants.map(p =>
                        p.id === resp.data.participant.id ? { ...p, ...resp.data.participant } : p
                    );
                    if (freshSession.current_participant?.id === resp.data.participant.id) {
                        freshSession.current_participant = { ...freshSession.current_participant, ...resp.data.participant };
                    }
                }
                setSession(freshSession);
                checkCombatOutcome(freshSession.participants);
            } else {
                await loadSession();
            }

            // Check if opportunity attacks were triggered
            if (resp.data.opportunity_attacks && resp.data.opportunity_attacks.length > 0) {
                for (const oa of resp.data.opportunity_attacks) {
                    setLastAttackFeedback({
                        targetId: current.id,
                        hit: oa.hit,
                        damage: oa.damage,
                        timestamp: Date.now(),
                    });
                }
                setAiActionBanner({
                    message: resp.data.message,
                    isHit: resp.data.opportunity_attacks.some(oa => oa.hit),
                });
            }
        } catch (err: any) {
            console.error("Failed to move:", err);
            await loadSession();
            alert(err.response?.data?.error || "Movement failed.");
            throw err;
        } finally {
            setIsMoving(false);
        }
    };

    const handleDash = async (bonusAction: boolean = false) => {
        const current = getCurrentParticipant();
        if (!current || !sessionId) return;
        setIsMovementOperating(true);
        try {
            const resp = await combatApi.dash(sessionId, {
                participant_id: current.id,
                bonus_action: bonusAction,
            });
            if (resp.data.session) {
                setSession(resp.data.session);
            } else {
                await loadSession();
            }
        } catch (err: any) {
            console.error("Failed to dash:", err);
            alert(err.response?.data?.error || "Dash failed.");
            throw err;
        } finally {
            setIsMovementOperating(false);
        }
    };

    const handleDisengage = async (bonusAction: boolean = false) => {
        const current = getCurrentParticipant();
        if (!current || !sessionId) return;
        setIsMovementOperating(true);
        try {
            const resp = await combatApi.disengage(sessionId, {
                participant_id: current.id,
                bonus_action: bonusAction,
            });
            if (resp.data.session) {
                setSession(resp.data.session);
            } else {
                await loadSession();
            }
        } catch (err: any) {
            console.error("Failed to disengage:", err);
            alert(err.response?.data?.error || "Disengage failed.");
        } finally {
            setIsMovementOperating(false);
        }
    };

    const handleDodge = async (bonusAction: boolean = false) => {
        const current = getCurrentParticipant();
        if (!current || !sessionId) return;
        setIsMovementOperating(true);
        try {
            const resp = await combatApi.dodge(sessionId, {
                participant_id: current.id,
                bonus_action: bonusAction,
            });
            if (resp.data.session) {
                setSession(resp.data.session);
            } else {
                await loadSession();
            }
        } catch (err: any) {
            console.error("Failed to dodge:", err);
            alert(err.response?.data?.error || "Dodge failed.");
        } finally {
            setIsMovementOperating(false);
        }
    };

    // 5E Spatial AoE Spell Targeting Handlers
    const handleStartAoETargeting = (config: AoETargetingConfig) => {
        setSelectedSpellForCast(null);
        setAoeTargeting(config);
    };

    const handleConfirmAoECast = async (data: { targetIds: number[] }) => {
        const current = getCurrentParticipant();
        if (!aoeTargeting || !current) return;
        const config = aoeTargeting;
        setAoeTargeting(null);
        await handleCastSpell({
            casterId: current.id,
            targetId: data.targetIds[0] || null,
            targetIds: data.targetIds,
            spellName: config.spell.name,
            spellLevel: config.spellLevel,
            saveType: config.saveType,
            saveDc: config.saveDc,
            damageString: config.damageFormula,
            isHealing: config.isHealing,
            requiresConcentration: config.requiresConcentration,
            isBonusAction: config.isBonusAction,
            castingTime: config.castingTime,
            halfOnSave: config.halfOnSave ?? true,
        });
    };

    const handleCancelAoETargeting = () => {
        setAoeTargeting(null);
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
    const currentParticipant = getCurrentParticipant() || null;
    const sortedParticipants = [...participants].sort((a, b) => b.initiative - a.initiative);
    const isEnemyTurn = currentParticipant?.participant_type === 'enemy';
    const currentIsIncapacitated = currentParticipant?.conditions?.some((c: any) => isIncapacitating(c)) ?? false;
    const currentIncapacitatingCond = currentParticipant?.conditions?.find((c: any) => isIncapacitating(c));
    const incapacitatingName = currentIncapacitatingCond ? (typeof currentIncapacitatingCond === 'string' ? currentIncapacitatingCond : (currentIncapacitatingCond.name || 'Incapacitated')) : 'Incapacitated';
    const actions = session.actions || [];

    // Get the target participant object for display
    const targetParticipant = targetId ? (participants.find(p => p.id === parseInt(targetId)) || null) : null;

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
                    const isFinesse = item.finesse || /dagger|rapier|scimitar|shortsword|dart/i.test(item.name || '');
                    const isThrown = item.thrown || /javelin|spear|handaxe|dart|dagger|trident|light hammer/i.test(item.name || '');
                    const isRanged = item.weapon_type?.toLowerCase().includes('ranged') ||
                        (item.range_normal && item.range_normal > 5) ||
                        /bow|crossbow|dart|sling|blowgun/i.test(item.name || '');

                    // 5e Ability modifier rules:
                    // - Finesse weapons (dagger, rapier, scimitar, dart) use max(STR, DEX)
                    // - Pure ranged weapons (bow, crossbow, sling) use DEX
                    // - Thrown melee weapons (javelin, spear, handaxe, trident) use STR
                    // - Standard melee weapons use STR
                    let abilityMod = stats?.strength_modifier || 0;
                    if (isFinesse) {
                        abilityMod = Math.max(stats?.strength_modifier || 0, stats?.dexterity_modifier || 0);
                    } else if (isRanged && !isThrown) {
                        abilityMod = stats?.dexterity_modifier || 0;
                    } else {
                        abilityMod = stats?.strength_modifier || 0;
                    }

                    const rangeNormal = item.range_normal || (/javelin/i.test(item.name) ? 30 : /shortbow|crossbow/i.test(item.name) ? 80 : /longbow/i.test(item.name) ? 150 : isThrown ? 20 : isRanged ? 60 : 5);
                    const rangeLong = item.range_long || (/javelin/i.test(item.name) ? 120 : /shortbow/i.test(item.name) ? 320 : /longbow/i.test(item.name) ? 600 : isThrown ? 60 : isRanged ? 180 : 5);

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
                            isThrown && 'Thrown',
                            item.versatile_damage && `Versatile (${item.versatile_damage})`,
                        ].filter(Boolean) as string[],
                        abilityMod,
                        isEquipped: ci.is_equipped || ci.equipment_slot !== 'inventory',
                        isRanged,
                        isThrown,
                        rangeNormal,
                        rangeLong,
                    };
                });
            if (weapons.length > 0) return weapons;
        }

        // Fallback: use the equipped_items computed field from the backend
        if (currentParticipant?.equipped_items?.weapon) {
            const weapon = currentParticipant.equipped_items.weapon;
            const isFinesse = (weapon as any).finesse || /dagger|rapier|scimitar|shortsword|dart/i.test(weapon.name || '');
            const isThrown = (weapon as any).thrown || /javelin|spear|handaxe|dart|dagger|trident|light hammer/i.test(weapon.name || '');
            const isRanged = (weapon as any).weapon_type?.toLowerCase().includes('ranged') || /bow|crossbow|dart|sling|blowgun/i.test(weapon.name || '');
            let abilityMod = stats?.strength_modifier || 0;
            if (isFinesse) {
                abilityMod = Math.max(stats?.strength_modifier || 0, stats?.dexterity_modifier || 0);
            } else if (isRanged && !isThrown) {
                abilityMod = stats?.dexterity_modifier || 0;
            } else {
                abilityMod = stats?.strength_modifier || 0;
            }
            return [{
                name: weapon.name,
                bonus: profBonus + abilityMod,
                damage: weapon.damage_dice,
                damageType: '',
                properties: [
                    isFinesse && 'Finesse',
                    isRanged && 'Ranged',
                    isThrown && 'Thrown',
                ].filter(Boolean) as string[],
                abilityMod,
                isEquipped: true,
                isRanged,
                isThrown,
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

    return (
        <div className="h-[100dvh] w-full bg-[#0c0d12] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,#181a24_0%,#0c0d12_70%)] text-slate-100 flex flex-col justify-between overflow-hidden relative font-lora selection:bg-[#c5a059]/30">
            {/* Victory/Defeat Modal (Practice Mode) */}
            {combatOutcome && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in font-lora">
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
                                className="flex-1 bg-[#181a21] hover:bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/40 h-11 text-xs font-semibold rounded cursor-pointer"
                            >
                                Back to Arena
                            </Button>
                            <Button
                                onClick={async () => {
                                    await combatApi.end(sessionId);
                                    router.push('/combat');
                                }}
                                className={`flex-1 h-11 font-bold text-xs uppercase tracking-wider rounded cursor-pointer ${combatOutcome === 'victory'
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

            {/* Gauntlet Respite & Victory/Defeat Modals */}
            {isRespiteOpen && gauntletRun && (
                <RespiteModal
                    run={gauntletRun}
                    onWaveStarted={handleGauntletNextWave}
                    onClaimVictory={handleGauntletClaimVictory}
                    onEnterEndless={handleGauntletEnterEndless}
                />
            )}

            {gauntletModalType && gauntletRun && (
                <VictoryDefeatModal
                    run={gauntletRun}
                    type={gauntletModalType}
                />
            )}

            {/* 1. Compact Header Bar */}
            <div className="border-b border-[#181a21] bg-[#0c0d12]/95 backdrop-blur-md z-30 font-lora flex-shrink-0">
                <div className="max-w-[1800px] mx-auto px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <h1 className="font-cinzel-decorative text-sm sm:text-base font-bold tracking-wider text-[#c5a059] drop-shadow-[0_2px_8px_rgba(197,160,89,0.3)] flex items-center gap-1.5">
                            <span>⚔</span> COMBAT ARENA
                        </h1>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold font-fira-sans border border-[#c5a059]/40 bg-[#181a21] text-[#c5a059]">
                            Round {session.current_round}
                        </span>
                        {gauntletRun ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-cinzel border border-amber-600/40 bg-amber-950/40 text-amber-300">
                                🏆 Gauntlet: Wave {gauntletRun.current_wave}/10
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider font-lora border border-[#c5a059]/25 bg-[#12141a] text-[#d1cdb8]/80">
                                {session.status || (session.is_active ? 'Active' : 'Ended')}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => router.push(gauntletRunId ? "/gauntlet" : "/combat")}
                            variant="ghost"
                            className="text-[#d1cdb8]/70 hover:text-[#c5a059] hover:bg-[#c5a059]/10 text-xs h-7 px-2.5 font-medium border border-transparent hover:border-[#c5a059]/30 rounded transition-all cursor-pointer"
                        >
                            ← Exit
                        </Button>
                        <Button
                            onClick={handleEndCombat}
                            className="bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-100 border border-red-500/50 text-xs h-7 font-semibold rounded px-3 py-1 transition-all shadow-[0_0_12px_rgba(239,68,68,0.2)] cursor-pointer"
                        >
                            End Combat
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. Top Initiative Ribbon */}
            <InitiativeRibbon
                participants={sortedParticipants}
                currentParticipant={currentParticipant}
                viewingParticipantId={viewingParticipantId}
                targetId={targetId}
                onSelectTarget={(id) => setTargetId(id)}
                onInspectParticipant={(p) => setViewingParticipantId(p.id)}
                damagedParticipantIds={damagedParticipantIds}
                isEnemyTurn={isEnemyTurn}
                gauntletRunId={gauntletRunId}
                aiProcessing={aiProcessing}
                onAiTurn={handleAiTurn}
                onAutoEnemyTurns={handleAutoEnemyTurns}
                onNextTurn={handleNextTurn}
                currentRound={session.current_round}
            />

            {/* 3. Central Battlefield Clash Arena */}
            <BattlefieldArena
                sessionId={Number(sessionId)}
                currentParticipant={currentParticipant}
                targetParticipant={targetParticipant}
                allParticipants={participants}
                targetId={targetId}
                onSelectTarget={(id) => setTargetId(id)}
                onInspectParticipant={(p) => setViewingParticipantId(p.id)}
                damagedParticipantIds={damagedParticipantIds}
                aiActionBanner={aiActionBanner}
                onDismissAiBanner={() => setAiActionBanner(null)}
                gauntletRun={gauntletRun}
                gauntletRunId={gauntletRunId}
                isEnemyTurn={isEnemyTurn}
                onOpenRespite={() => setIsRespiteOpen(true)}
                lastAttackFeedback={lastAttackFeedback}
                onMove={handleMove}
                onDash={handleDash}
                onDisengage={handleDisengage}
                onDodge={handleDodge}
                isMoving={isMoving}
                isOperating={isMovementOperating}
                aoeTargeting={aoeTargeting}
                onConfirmAoECast={handleConfirmAoECast}
                onCancelAoETargeting={handleCancelAoETargeting}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {/* 4. Bottom Tactical Action Dock */}
            <ActionDock
                currentParticipant={currentParticipant}
                targetId={targetId}
                isEnemyTurn={isEnemyTurn}
                gauntletRunId={gauntletRunId}
                isAttacking={isAttacking}
                currentIsIncapacitated={currentIsIncapacitated}
                onAttack={handleAttack}
                characterWeapons={characterWeapons}
                characterSpells={characterSpells}
                charData={charData}
                getSpellSlots={getSpellSlots}
                onSelectSpell={(spell) => setSelectedSpellForCast(spell)}
                onStartAoETargeting={handleStartAoETargeting}
                enemyAttacks={enemyAttacks}
                damageAmount={damageAmount}
                setDamageAmount={setDamageAmount}
                healAmount={healAmount}
                setHealAmount={setHealAmount}
                onApplyDamage={handleApplyDamage}
                onApplyHealing={handleApplyHealing}
                allParticipants={participants}
                onUseItem={handleUseItem}
                onUseFeature={handleUseFeature}
                onForceAiTurn={handleAiTurn}
                onNextTurn={handleNextTurn}
                onDash={handleDash}
                onDisengage={handleDisengage}
                onDodge={handleDodge}
            />

            {/* 5. Collapsible Bottom-Left Combat Log Drawer */}
            <CombatLogDrawer
                actions={actions}
                participants={participants}
                selectedParticipant={viewingParticipant}
                onClearFilter={() => setViewingParticipantId(null)}
            />

            {/* 6. Slideover Participant Inspector Drawer */}
            <ParticipantInspectorDrawer
                participant={viewingParticipant}
                onClose={() => setViewingParticipantId(null)}
                onOpenStatblock={(p) => setStatblockParticipant(p)}
            />

            {/* Monster Stat Block Modal */}
            <MonsterStatblockModal
                participant={statblockParticipant}
                onClose={() => setStatblockParticipant(null)}
            />

            {/* Dedicated Spellcasting Action Modal */}
            {selectedSpellForCast && currentParticipant && (
                <SpellCastModal
                    isOpen={!!selectedSpellForCast}
                    onClose={() => setSelectedSpellForCast(null)}
                    spell={selectedSpellForCast}
                    caster={currentParticipant}
                    allParticipants={participants}
                    initialTargetId={targetId}
                    getSpellSlots={getSpellSlots}
                    isCasting={isCastingSpell}
                    onCast={handleCastSpell}
                    onStartAoETargeting={handleStartAoETargeting}
                />
            )}
        </div>
    );
}
