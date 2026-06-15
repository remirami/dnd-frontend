"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { combatApi } from "@/lib/api/combat";
import { charactersApi } from "@/lib/api/characters";
import { enemiesApi } from "@/lib/api/enemies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Character } from "@/lib/types/character";
import type { Enemy } from "@/lib/types/enemy";
import type { CombatSession, CombatParticipant } from "@/lib/types/combat";

export default function CombatSetupPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [session, setSession] = useState<CombatSession | null>(null);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [initiativeValues, setInitiativeValues] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);

    const sessionId = Number(params.id);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        loadSessionAndCharacters();
    }, [isAuthenticated, sessionId, router]);

    // Search effect
    useEffect(() => {
        const searchEnemies = async () => {
            if (searchQuery.trim().length === 0) {
                setEnemies([]);
                return;
            }

            setIsSearching(true);
            try {
                console.log("Searching for:", searchQuery);
                const response = await enemiesApi.search(searchQuery);
                const results = Array.isArray(response.data) ? response.data : (response.data as any).results || [];
                setEnemies(results);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(searchEnemies, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const loadSessionAndCharacters = async () => {
        try {
            const [sessionRes, charactersRes] = await Promise.all([
                combatApi.getById(sessionId),
                charactersApi.getAll(),
            ]);

            setSession(sessionRes.data);
            const charData = charactersRes.data.results || [];
            setCharacters(charData);
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleCharacter = async (characterId: number, characterName: string) => {
        // ... (keep existing logic)
        const alreadyAdded = session?.participants?.some(
            p => (p.participant_type === 'character' && p.character === characterId) || p.name === characterName
        );

        if (alreadyAdded) {
            alert("Character already in combat. To remove, you'll need to create a new combat session.");
            return;
        }

        try {
            await combatApi.addParticipant(sessionId, {
                participant_type: 'character',
                character_id: characterId,
            });

            // Reload session
            const response = await combatApi.getById(sessionId);
            setSession(response.data);
        } catch (error: any) {
            console.error("Failed to add character:", error);
            alert(`Failed to add character: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleAddEnemy = async (enemyId: number) => {
        if (!enemyId) return;

        try {
            await combatApi.addParticipant(sessionId, {
                participant_type: 'enemy',
                enemy_id: enemyId,
            });

            // Reload session
            const response = await combatApi.getById(sessionId);
            setSession(response.data);
            // Optional: clear search after adding
            // setSearchQuery(""); 
        } catch (error) {
            console.error("Failed to add enemy:", error);
            alert("Failed to add enemy to combat");
        }
    };

    const handleInitiativeChange = (participantId: number, value: string) => {
        const numValue = parseInt(value) || 0;
        setInitiativeValues(prev => ({ ...prev, [participantId]: numValue }));
    };

    const handleStartCombat = async () => {
        const participants = session?.participants || [];
        if (!session || participants.length === 0) {
            alert("Add at least one participant before starting combat");
            return;
        }

        const hasEnemy = participants.some(p => p.participant_type === 'enemy');
        if (!hasEnemy) {
            alert("Add at least one enemy before starting combat");
            return;
        }

        try {
            // Pass manual initiative values as overrides;
            // the backend will auto-roll for any participants still at 0
            await combatApi.rollInitiative(sessionId, initiativeValues);
            await combatApi.start(sessionId);
            router.push(`/combat/${sessionId}`);
        } catch (error) {
            console.error("Failed to start combat:", error);
            alert("Failed to start combat");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center text-white">
                Loading...
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Setup Combat #{session.id}</h1>
                        <p className="text-slate-400">Add participants and set initiative</p>
                    </div>
                    <Button
                        onClick={() => router.push("/combat")}
                        className="bg-slate-700 hover:bg-slate-600"
                    >
                        Cancel
                    </Button>
                </div>

                {/* Add Characters */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Your Characters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {characters.length === 0 ? (
                            <p className="text-slate-400">No characters available. Create a character first!</p>
                        ) : (
                            <div className="space-y-2">
                                {characters.map((char) => {
                                    const isAdded = session?.participants?.some(
                                        p => (p.participant_type === 'character' && p.character === char.id) || p.name === char.name
                                    );
                                    return (
                                        <div
                                            key={char.id}
                                            className={`flex items-center gap-3 p-3 rounded transition-colors ${isAdded
                                                ? 'bg-green-900/30 border-2 border-green-600 cursor-not-allowed'
                                                : 'bg-slate-900 hover:bg-slate-700 cursor-pointer'
                                                }`}
                                            onClick={() => !isAdded && handleToggleCharacter(char.id, char.name)}
                                            title={isAdded ? "Already added to combat" : "Click to add to combat"}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isAdded || false}
                                                onChange={() => { }}
                                                className="w-4 h-4"
                                                disabled={isAdded}
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold text-white">{char.name}</div>
                                                <div className="text-sm text-slate-400">
                                                    Level {char.level} {char.race?.name_display} {char.character_class?.name_display}
                                                </div>
                                            </div>
                                            {isAdded && (
                                                <span className="text-xs text-green-400 font-semibold">Added ✓</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Add Enemies */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Add Enemies</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search monsters (e.g. Goblin, Dragon)..."
                                        className="bg-slate-900 border-slate-700 text-white w-full"
                                    />
                                    {isSearching && (
                                        <div className="absolute right-3 top-2.5">
                                            <span className="animate-spin block w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full"></span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Search Results */}
                            {searchQuery.length > 0 && (
                                <div className="border border-slate-700 rounded-md bg-slate-900 max-h-60 overflow-y-auto">
                                    {enemies.length === 0 ? (
                                        <div className="p-3 text-slate-400 text-sm">No monsters found.</div>
                                    ) : (
                                        <div className="divide-y divide-slate-800">
                                            {enemies.map((enemy) => (
                                                <div
                                                    key={enemy.id}
                                                    className="p-3 hover:bg-slate-800 cursor-pointer flex justify-between items-center group"
                                                    onClick={() => handleAddEnemy(enemy.id)}
                                                >
                                                    <div>
                                                        <div className="font-medium text-white">{enemy.name}</div>
                                                        <div className="text-xs text-slate-400">CR {enemy.challenge_rating} • {enemy.type}</div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="bg-red-900/50 hover:bg-red-800 text-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        Add
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {searchQuery.length === 0 && (
                                <p className="text-slate-500 text-sm">Type to search the bestiary.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Current Participants */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Participants ({session.participants?.length || 0})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(!session.participants || session.participants.length === 0) ? (
                            <p className="text-slate-400">No participants yet. Add characters or enemies above.</p>
                        ) : (
                            <div className="space-y-6">
                                {/* Your Party */}
                                {session.participants.filter(p => p.participant_type === 'character').length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <span>⚔️</span>
                                            Your Party ({session.participants.filter(p => p.participant_type === 'character').length})
                                        </h3>
                                        <div className="space-y-2">
                                            {session.participants.filter(p => p.participant_type === 'character').map((participant) => (
                                                <div key={participant.id} className="flex items-center gap-4 p-3 rounded bg-slate-900 border-l-3 border-emerald-500/50">
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-white">{participant.name}</div>
                                                        <div className="text-sm text-slate-400">
                                                            HP: {participant.current_hp}/{participant.max_hp} | AC: {participant.armor_class}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-slate-400 text-sm">Initiative:</Label>
                                                        <Input
                                                            type="number"
                                                            value={initiativeValues[participant.id] || participant.initiative}
                                                            onChange={(e) => handleInitiativeChange(participant.id, e.target.value)}
                                                            className="w-20 bg-slate-950 border-slate-700 text-white text-center"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Enemies */}
                                {session.participants.filter(p => p.participant_type === 'enemy').length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <span>💀</span>
                                            Enemies ({session.participants.filter(p => p.participant_type === 'enemy').length})
                                        </h3>
                                        <div className="space-y-2">
                                            {session.participants.filter(p => p.participant_type === 'enemy').map((participant) => (
                                                <div key={participant.id} className="flex items-center gap-4 p-3 rounded bg-red-950/30 border-l-3 border-red-500/50">
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-red-200">{participant.name}</div>
                                                        <div className="text-sm text-red-300/60">
                                                            HP: {participant.current_hp}/{participant.max_hp} | AC: {participant.armor_class}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-slate-400 text-sm">Initiative:</Label>
                                                        <Input
                                                            type="number"
                                                            value={initiativeValues[participant.id] || participant.initiative}
                                                            onChange={(e) => handleInitiativeChange(participant.id, e.target.value)}
                                                            className="w-20 bg-slate-950 border-red-900/50 text-white text-center"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Start Combat */}
                <Button
                    onClick={handleStartCombat}
                    disabled={session.participants.length === 0}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-lg font-bold"
                >
                    Start Combat
                </Button>
            </div>
        </div>
    );
}
