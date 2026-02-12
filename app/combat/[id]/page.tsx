"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { combatApi } from "@/lib/api/combat";
import { enemiesApi } from "@/lib/api/enemies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CombatLog } from "./CombatLog";
import type { CombatSession, CombatParticipant, CombatAction } from "@/lib/types/combat";
import type { Enemy, Attack } from "@/lib/types/enemy";

export default function CombatPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [session, setSession] = useState<CombatSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [damageAmount, setDamageAmount] = useState("");
    const [healAmount, setHealAmount] = useState("");
    const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);
    const [selectedEnemy, setSelectedEnemy] = useState<Enemy | null>(null);
    const [targetId, setTargetId] = useState<string>("");
    const [combatOutcome, setCombatOutcome] = useState<'victory' | 'defeat' | null>(null);

    const sessionId = Number(params.id);

    // Check for combat victory or defeat
    const checkCombatOutcome = (participants: CombatParticipant[]) => {
        // Filter by participant_type instead of is_player
        const players = participants.filter(p => p.participant_type === 'character');
        const enemies = participants.filter(p => p.participant_type === 'enemy');

        console.log("Checking combat outcome...");
        console.log("Players:", players.map(p => ({ name: p.name, hp: p.current_hp, type: p.participant_type })));
        console.log("Enemies:", enemies.map(p => ({ name: p.name, hp: p.current_hp, type: p.participant_type })));

        const allPlayersDead = players.length > 0 && players.every(p => p.current_hp <= 0);
        const allEnemiesDead = enemies.length > 0 && enemies.every(p => p.current_hp <= 0);

        console.log("All players dead:", allPlayersDead);
        console.log("All enemies dead:", allEnemiesDead);

        if (allEnemiesDead) {
            console.log("VICTORY!");
            setCombatOutcome('victory');
            return true;
        } else if (allPlayersDead) {
            console.log("DEFEAT!");
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

        if (sessionId) {
            loadSession();
        }
    }, [isAuthenticated, sessionId, router]);

    const loadSession = async () => {
        try {
            const response = await combatApi.getById(sessionId);
            setSession(response.data);

            // Check if combat has ended
            if (response.data.participants) {
                checkCombatOutcome(response.data.participants);
            }
        } catch (error) {
            console.error("Failed to load combat session:", error);
        } finally {
            setLoading(false);
        }
    };

    // Load enemy data when an enemy participant is selected
    const loadEnemyData = async (participant: CombatParticipant) => {
        if (participant.participant_type === 'enemy' && participant.encounter_enemy?.enemy) {
            try {
                const response = await enemiesApi.getById(participant.encounter_enemy.enemy);
                setSelectedEnemy(response.data);
            } catch (error) {
                console.error("Failed to load enemy data:", error);
                setSelectedEnemy(null);
            }
        } else {
            setSelectedEnemy(null);
        }
    };

    // Handle participant selection
    const handleSelectParticipant = (participantId: number) => {
        setSelectedParticipant(participantId);
        const participant = session?.participants.find(p => p.id === participantId);
        if (participant) {
            loadEnemyData(participant);
        }
    };

    const handleNextTurn = async () => {
        try {
            console.log("Advancing turn for session:", sessionId);
            const response = await combatApi.nextTurn(sessionId);
            console.log("Next turn response:", response.data);

            // Backend returns { message, session }, extract the session
            // Backend returns { message, session }
            const updatedSession = response.data.session;
            console.log("Updated session:", updatedSession);
            console.log("Participants after next turn:", updatedSession.participants);
            setSession(updatedSession);
        } catch (error: any) {
            console.error("Failed to advance turn:", error);
            console.error("Error response:", error.response?.data);
            alert(`Failed to advance turn: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleAttack = async (attack: Attack) => {
        if (!selectedParticipant || !targetId) {
            alert("Please select a target for the attack");
            return;
        }

        try {
            await combatApi.attack(sessionId, {
                attacker_id: selectedParticipant,
                target_id: parseInt(targetId),
                attack_name: attack.name,
                attack_bonus: attack.bonus,
            });

            // Reload session to get updated HP and combat log
            await loadSession();
            setTargetId("");

            // Clear target selection if attack was successful
            // Keep selected participant active
        } catch (error) {
            console.error("Failed to execute attack:", error);
            // Alert removed to rely on combat log
        }
    };

    const handleApplyDamage = async () => {
        if (!selectedParticipant || !damageAmount) return;

        try {
            // Attribute manually applied damage to current participant if one exists
            // This allows the log to show "Goblin 1 deals 5 damage to Player" instead of generic message
            // If selecting themselves, it's self-inflicted (source=target)
            const sourceId = currentParticipant?.id;

            await combatApi.applyDamage(selectedParticipant, {
                amount: parseInt(damageAmount),
                source_id: sourceId
            });
            setDamageAmount("");
            // Reload session to get updated participant data
            await loadSession();
        } catch (error) {
            console.error("Failed to apply damage:", error);
        }
    };

    const handleApplyHealing = async () => {
        if (!selectedParticipant || !healAmount) return;

        try {
            const sourceId = currentParticipant?.id;

            await combatApi.applyHealing(selectedParticipant, {
                amount: parseInt(healAmount),
                source_id: sourceId
            });
            setHealAmount("");
            // Reload session to get updated participant data
            loadSession();
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
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center text-white">
                Loading combat...
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

    // Safety check for participants array
    const participants = session.participants || [];

    // Use the backend's current_participant if available, otherwise find by is_active
    const currentParticipant = (session as any).current_participant || participants.find(p => p.is_active);

    const sortedParticipants = [...participants].sort((a, b) => b.initiative - a.initiative);

    // Debug logging
    console.log("Session current_participant:", (session as any).current_participant);
    console.log("All participants:", participants.map(p => ({ name: p.name, is_active: p.is_active })));
    console.log("Current participant:", currentParticipant?.name);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Combat Tracker</h1>
                        <p className="text-slate-400">Round {session.round_number}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => router.push("/combat")}
                            className="bg-slate-700 hover:bg-slate-600 text-white"
                        >
                            Back to Combats
                        </Button>
                        <Button
                            onClick={handleEndCombat}
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700"
                        >
                            End Combat
                        </Button>
                    </div>
                </div>

                {/* Victory/Defeat Modal */}
                {combatOutcome && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                        <Card className={`max-w-md w-full ${combatOutcome === 'victory' ? 'bg-green-900 border-green-600' : 'bg-red-900 border-red-600'}`}>
                            <CardHeader>
                                <CardTitle className="text-center text-3xl font-bold text-white">
                                    {combatOutcome === 'victory' ? '🎉 Victory!' : '💀 Defeat!'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-center text-white text-lg">
                                    {combatOutcome === 'victory'
                                        ? 'All enemies have been defeated!'
                                        : 'All party members have fallen...'}
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => router.push('/combat')}
                                        className="flex-1 bg-slate-700 hover:bg-slate-600"
                                    >
                                        Back to Combats
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            await combatApi.end(sessionId);
                                            router.push('/combat');
                                        }}
                                        className="flex-1 bg-amber-600 hover:bg-amber-700"
                                    >
                                        End Combat
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
                    {/* Initiative Tracker - Left Sidebar */}
                    <div className="col-span-3 h-full overflow-y-auto pr-2">
                        <Card className="bg-slate-800 border-slate-700 h-full">
                            <CardHeader>
                                <CardTitle className="text-white">Initiative Order</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {sortedParticipants.map((participant) => (
                                    <div
                                        key={participant.id}
                                        onClick={() => handleSelectParticipant(participant.id)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all ${participant.is_active
                                            ? "bg-amber-600 border-2 border-amber-400"
                                            : selectedParticipant === participant.id
                                                ? "bg-slate-700 border-2 border-slate-500"
                                                : "bg-slate-900 hover:bg-slate-700"
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold">{participant.name}</span>
                                            <span className="text-sm bg-slate-950 px-2 py-1 rounded">
                                                {participant.initiative}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs text-slate-400">
                                                <span>HP</span>
                                                <span>{participant.current_hp}/{participant.max_hp}</span>
                                            </div>
                                            <div className="w-full bg-slate-950 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${participant.current_hp / participant.max_hp > 0.5
                                                        ? "bg-green-500"
                                                        : participant.current_hp / participant.max_hp > 0.25
                                                            ? "bg-yellow-500"
                                                            : "bg-red-500"
                                                        }`}
                                                    style={{
                                                        width: `${Math.max(0, (participant.current_hp / participant.max_hp) * 100)}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Combat Area */}
                    <div className="col-span-6 space-y-6 h-full overflow-y-auto pr-2">
                        <Card className="bg-slate-800 border-slate-700 mb-6">
                            <CardHeader>
                                <CardTitle className="text-white">Current Turn</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {currentParticipant ? (
                                    <div className="space-y-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-amber-400">{currentParticipant.name}</h2>
                                            <p className="text-slate-400">
                                                {currentParticipant.is_player ? "Player Character" : "Enemy"}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-sm text-slate-400">HP</p>
                                                <p className="text-xl font-bold">
                                                    {currentParticipant.current_hp}/{currentParticipant.max_hp}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-400">AC</p>
                                                <p className="text-xl font-bold">{currentParticipant.armor_class}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-400">Initiative</p>
                                                <p className="text-xl font-bold">{currentParticipant.initiative}</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleNextTurn}
                                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                                            size="lg"
                                        >
                                            End Turn
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-slate-400">No active participant</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Sidebar - Actions */}
                    <div className="col-span-3">
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white">Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {selectedParticipant && (
                                    <>
                                        {/* Enemy Attacks */}
                                        {selectedEnemy && selectedEnemy.attacks && selectedEnemy.attacks.length > 0 && (
                                            <div className="space-y-3">
                                                <Label className="text-white font-semibold">⚔️ Attacks</Label>

                                                {/* Target Selection */}
                                                <div className="space-y-2">
                                                    <Label className="text-slate-400 text-sm">Target:</Label>
                                                    <Select value={targetId} onValueChange={setTargetId}>
                                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                                            <SelectValue placeholder="Select target" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-900 border-slate-700">
                                                            {participants
                                                                .filter(p => p.id !== selectedParticipant)
                                                                .map((p) => (
                                                                    <SelectItem key={p.id} value={p.id.toString()} className="text-white">
                                                                        {p.name} ({p.current_hp}/{p.max_hp} HP)
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Attack Buttons */}
                                                {selectedEnemy.attacks.map((attack) => (
                                                    <Button
                                                        key={attack.id}
                                                        onClick={() => handleAttack(attack)}
                                                        disabled={!targetId}
                                                        className="w-full bg-red-600 hover:bg-red-700 text-left justify-start"
                                                    >
                                                        <div className="flex flex-col items-start">
                                                            <span className="font-semibold">{attack.name}</span>
                                                            <span className="text-xs text-slate-300">
                                                                +{attack.bonus} | {attack.damage}
                                                            </span>
                                                        </div>
                                                    </Button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Manual Damage/Healing (fallback or for characters) */}
                                        <div className="border-t border-slate-700 pt-4 space-y-3">
                                            <Label className="text-white font-semibold">💊 Manual Actions</Label>

                                            <div className="space-y-2">
                                                <Label htmlFor="damage" className="text-slate-400 text-sm">Apply Damage</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="damage"
                                                        type="number"
                                                        value={damageAmount}
                                                        onChange={(e) => setDamageAmount(e.target.value)}
                                                        placeholder="Amount"
                                                        className="bg-slate-900 border-slate-700 text-white"
                                                    />
                                                    <Button
                                                        onClick={handleApplyDamage}
                                                        className="bg-red-600 hover:bg-red-700"
                                                    >
                                                        Apply
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="healing" className="text-slate-400 text-sm">Apply Healing</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="healing"
                                                        type="number"
                                                        value={healAmount}
                                                        onChange={(e) => setHealAmount(e.target.value)}
                                                        placeholder="Amount"
                                                        className="bg-slate-900 border-slate-700 text-white"
                                                    />
                                                    <Button
                                                        onClick={handleApplyHealing}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        Apply
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                                {!selectedParticipant && (
                                    <p className="text-slate-400 text-sm">Select a participant to view actions</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Combat Log - Right Sidebar */}
                    <div className="col-span-3 h-full">
                        <CombatLog actions={session.actions || []} />
                    </div>
                </div>
            </div>
        </div >
    );
}
