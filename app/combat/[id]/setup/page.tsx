"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { combatApi } from "@/lib/api/combat";
import { charactersApi } from "@/lib/api/characters";
import { enemiesApi } from "@/lib/api/enemies";
import FantasyCard from "@/components/ui/FantasyCard";
import Navbar from "@/components/layout/Navbar";
import { Swords, Skull, Users, Search, X, Play, Trash2, Shuffle, ChevronDown } from "lucide-react";
import type { Character } from "@/lib/types/character";
import type { Enemy } from "@/lib/types/enemy";
import type { CombatSession, CombatParticipant } from "@/lib/types/combat";

const MAX_TOTAL_PARTICIPANTS = 16;
const MAX_PARTY_PARTICIPANTS = 6;
const MAX_ENEMY_PARTICIPANTS = 10;

export default function CombatSetupPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [session, setSession] = useState<CombatSession | null>(null);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCr, setFilterCr] = useState("");
    const [filterType, setFilterType] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isAddingRandom, setIsAddingRandom] = useState(false);
    const [initiativeValues, setInitiativeValues] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    const sessionId = Number(params.id);

    const partyParticipants = session?.participants?.filter(p => p.participant_type === 'character') || [];
    const enemyParticipants = session?.participants?.filter(p => p.participant_type === 'enemy') || [];
    const partyCount = partyParticipants.length;
    const enemyCount = enemyParticipants.length;
    const totalCount = partyCount + enemyCount;
    const isPartyFull = partyCount >= MAX_PARTY_PARTICIPANTS;
    const isEnemyFull = enemyCount >= MAX_ENEMY_PARTICIPANTS;
    const isTotalFull = totalCount >= MAX_TOTAL_PARTICIPANTS;

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        loadSessionAndCharacters();
    }, [isAuthenticated, sessionId, router]);

    // Search + filter effect — fires whenever search text, CR, or type changes
    useEffect(() => {
        const fetchEnemies = async () => {
            const hasQuery = searchQuery.trim().length > 0;
            const hasFilter = filterCr !== "" || filterType !== "";

            if (!hasQuery && !hasFilter) {
                setEnemies([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await enemiesApi.filter({
                    search: searchQuery.trim() || undefined,
                    cr: filterCr || undefined,
                    type: filterType || undefined,
                });
                const results = Array.isArray(response.data) ? response.data : (response.data as any).results || [];
                setEnemies(results);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(fetchEnemies, 350);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, filterCr, filterType]);

    const handleRandomEnemy = async () => {
        if (isEnemyFull || isTotalFull) return;
        setIsAddingRandom(true);
        try {
            const response = await enemiesApi.random({
                cr: filterCr || undefined,
                type: filterType || undefined,
            });
            const enemy = response.data;
            if (!enemy?.id) throw new Error("No enemy returned");
            await handleAddEnemy(enemy.id);
        } catch (error: any) {
            const msg = error?.response?.data?.error || "No enemies found with those filters.";
            alert(msg);
        } finally {
            setIsAddingRandom(false);
        }
    };

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
        const existingParticipant = session?.participants?.find(
            p => (p.participant_type === 'character' && p.character?.id === characterId) || p.name === characterName
        );

        if (existingParticipant) {
            // De-select character (always permitted)
            try {
                await combatApi.removeParticipant(sessionId, {
                    participant_id: existingParticipant.id,
                    character_id: characterId,
                });
                setInitiativeValues(prev => {
                    const copy = { ...prev };
                    delete copy[existingParticipant.id];
                    return copy;
                });
                const response = await combatApi.getById(sessionId);
                setSession(response.data);
            } catch (error: any) {
                console.error("Failed to remove character:", error);
                alert(`Failed to remove character: ${error.response?.data?.error || error.message}`);
            }
            return;
        }

        // Limit checks before adding
        if (isPartyFull) {
            alert(`Party roster is full (maximum ${MAX_PARTY_PARTICIPANTS} characters). De-select a hero first.`);
            return;
        }
        if (isTotalFull) {
            alert(`Encounter is at maximum capacity (${MAX_TOTAL_PARTICIPANTS} participants). Remove a participant first.`);
            return;
        }

        // Add character
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

    const handleRemoveParticipant = async (participantId: number) => {
        try {
            await combatApi.removeParticipant(sessionId, {
                participant_id: participantId,
            });
            setInitiativeValues(prev => {
                const copy = { ...prev };
                delete copy[participantId];
                return copy;
            });
            const response = await combatApi.getById(sessionId);
            setSession(response.data);
        } catch (error: any) {
            console.error("Failed to remove participant:", error);
            alert(`Failed to remove participant: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleAddEnemy = async (enemyId: number) => {
        if (!enemyId) return;

        if (isEnemyFull) {
            alert(`Enemy roster is full (maximum ${MAX_ENEMY_PARTICIPANTS} enemies). Remove an enemy first.`);
            return;
        }
        if (isTotalFull) {
            alert(`Encounter is at maximum capacity (${MAX_TOTAL_PARTICIPANTS} participants). Remove a participant first.`);
            return;
        }

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
        } catch (error: any) {
            console.error("Failed to add enemy:", error);
            alert(`Failed to add enemy: ${error.response?.data?.error || error.message}`);
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

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await combatApi.delete(sessionId);
        } catch (error) {
            console.error("Failed to delete cancelled combat session:", error);
        } finally {
            router.push("/combat");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0c0d12] flex flex-col">
                <Navbar showActions={true} />
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-24">
                    <div className="w-9 h-9 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
                    <p className="font-lora text-sm text-[#d1cdb8]/70 italic">Summoning the arena...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-[#0c0d12] flex flex-col">
                <Navbar showActions={true} />
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
                    <p className="font-lora text-[#d1cdb8]/60 italic">Combat session not found.</p>
                    <button
                        onClick={() => router.push("/combat")}
                        className="text-xs text-[#c5a059] border border-[#c5a059]/40 hover:border-[#c5a059] px-4 py-2 rounded transition-colors font-lora"
                    >
                        ← Return to Arena
                    </button>
                </div>
            </div>
        );
    }

    const heroParticipants  = session.participants?.filter(p => p.participant_type === "character") || [];
    const enemyParticipantsInRoster = session.participants?.filter(p => p.participant_type === "enemy") || [];

    return (
        <div className="min-h-screen bg-[#0c0d12] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,#1a1d29_0%,#0c0d12_70%)] text-slate-100 flex flex-col">
            <Navbar showActions={true} />

            <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 space-y-6">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="font-cinzel-decorative text-2xl md:text-3xl font-bold text-[#c5a059] tracking-wide">
                                Encounter #{session.id} — Setup
                            </h1>
                            <span className={`font-fira-sans text-xs px-2.5 py-1 rounded border font-semibold ${
                                isTotalFull
                                    ? "bg-[#a63a3a]/20 border-[#a63a3a]/60 text-[#e57373]"
                                    : "bg-[#c5a059]/10 border-[#c5a059]/30 text-[#c5a059]"
                            }`}>
                                Total: {totalCount}/{MAX_TOTAL_PARTICIPANTS}
                            </span>
                        </div>
                        <p className="font-lora text-sm text-[#d1cdb8]/60 mt-1">
                            Add participants and configure initiative before the battle begins.
                        </p>
                    </div>

                    <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="px-4 py-2 text-xs font-lora font-semibold text-[#d1cdb8]/70 border border-[#d1cdb8]/20 hover:border-[#a63a3a]/60 hover:text-[#e57373] bg-[#181a21] hover:bg-[#a63a3a]/10 rounded transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                        <X className="w-3.5 h-3.5" />
                        {cancelling ? "Cancelling..." : "Cancel & Discard"}
                    </button>
                </div>

                {/* Filigree divider */}
                <div className="flex items-center gap-3 opacity-60">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c5a059]/40" />
                    <span className="text-[10px] text-[#c5a059]">✦</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c5a059]/40" />
                </div>

                {/* ── HERO ROSTER ── */}
                <FantasyCard className="p-0 overflow-hidden">
                    {/* Section header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#c5a059]/20 bg-[radial-gradient(ellipse_at_top_left,#1a1d29_0%,#181a21_100%)]">
                        <div className="flex items-center gap-2.5">
                            <Users className="w-4 h-4 text-[#c5a059]" />
                            <div>
                                <h2 className="font-cinzel-decorative text-sm font-bold text-[#c5a059] tracking-wide">
                                    Your Characters
                                </h2>
                                <p className="font-lora text-[10px] text-[#d1cdb8]/50 mt-0.5">
                                    Select heroes to join this combat encounter
                                </p>
                            </div>
                        </div>
                        <span className={`font-fira-sans text-xs px-2.5 py-1 rounded border font-semibold ${
                            isPartyFull
                                ? "bg-[#a63a3a]/20 border-[#a63a3a]/60 text-[#e57373]"
                                : "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]"
                        }`}>
                            Party: {partyCount}/{MAX_PARTY_PARTICIPANTS}{isPartyFull ? " · Full" : ""}
                        </span>
                    </div>

                    {/* Character list */}
                    <div className="divide-y divide-[#c5a059]/10">
                        {characters.length === 0 ? (
                            <p className="font-lora text-sm text-[#d1cdb8]/50 italic px-5 py-6">
                                No characters found. Create a character first!
                            </p>
                        ) : (
                            characters.map((char) => {
                                const isAdded = session?.participants?.some(
                                    p => (p.participant_type === "character" && p.character?.id === char.id) || p.name === char.name
                                );
                                const cannotAdd = !isAdded && (isPartyFull || isTotalFull);

                                return (
                                    <div
                                        key={char.id}
                                        onClick={() => {
                                            if (cannotAdd) {
                                                if (isPartyFull) alert(`Party roster is full (maximum ${MAX_PARTY_PARTICIPANTS} characters). De-select a hero first.`);
                                                else alert(`Encounter is at maximum capacity (${MAX_TOTAL_PARTICIPANTS} participants).`);
                                                return;
                                            }
                                            handleToggleCharacter(char.id, char.name);
                                        }}
                                        title={
                                            isAdded ? "Click to de-select character"
                                            : cannotAdd ? (isPartyFull ? "Party roster full (max 6)" : "Encounter limit reached (max 16)")
                                            : "Click to add to combat"
                                        }
                                        className={`flex items-center gap-4 px-5 py-3.5 transition-all select-none group ${
                                            isAdded
                                                ? "bg-[#22c55e]/8 border-l-2 border-[#22c55e]/60 hover:bg-[#22c55e]/12 cursor-pointer"
                                                : cannotAdd
                                                ? "opacity-45 cursor-not-allowed border-l-2 border-transparent"
                                                : "hover:bg-[#c5a059]/5 border-l-2 border-transparent hover:border-[#c5a059]/30 cursor-pointer"
                                        }`}
                                    >
                                        {/* Checkbox indicator */}
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                            isAdded
                                                ? "bg-[#22c55e] border-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.4)]"
                                                : cannotAdd
                                                ? "border-[#d1cdb8]/20"
                                                : "border-[#c5a059]/40 group-hover:border-[#c5a059]"
                                        }`}>
                                            {isAdded && <span className="text-[#0c0d12] text-[9px] font-black">✓</span>}
                                        </div>

                                        {/* Name + subtitle */}
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-lora text-sm font-semibold truncate transition-colors ${
                                                isAdded ? "text-[#22c55e]"
                                                : cannotAdd ? "text-[#d1cdb8]/40"
                                                : "text-[#d1cdb8] group-hover:text-[#c5a059]"
                                            }`}>
                                                {char.name}
                                            </div>
                                            <div className="font-fira-sans text-xs text-[#d1cdb8]/45 mt-0.5">
                                                Level {char.level} {char.race?.name_display} {char.character_class?.name_display}
                                            </div>
                                        </div>

                                        {/* Right action indicator */}
                                        {isAdded ? (
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="font-lora text-[11px] text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/30 px-2 py-0.5 rounded">
                                                    Selected ✓
                                                </span>
                                                <span className="font-lora text-[11px] text-[#e57373]/70 hover:text-[#e57373] transition-colors">
                                                    Remove
                                                </span>
                                            </div>
                                        ) : cannotAdd ? (
                                            <span className="font-fira-sans text-[10px] text-[#c5a059]/50 bg-[#c5a059]/8 border border-[#c5a059]/20 px-2 py-0.5 rounded shrink-0">
                                                {isPartyFull ? "Party Full" : "At Limit"}
                                            </span>
                                        ) : (
                                            <span className="font-lora text-xs text-[#d1cdb8]/35 group-hover:text-[#c5a059] transition-colors shrink-0">
                                                + Select
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </FantasyCard>

                {/* ── ENEMY BESTIARY ── */}
                <FantasyCard className="p-0 overflow-hidden">
                    {/* Section header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#c5a059]/20 bg-[radial-gradient(ellipse_at_top_left,#1a1d29_0%,#181a21_100%)]">
                        <div className="flex items-center gap-2.5">
                            <Skull className="w-4 h-4 text-[#c5a059]" />
                            <div>
                                <h2 className="font-cinzel-decorative text-sm font-bold text-[#c5a059] tracking-wide">
                                    Bestiary — Add Enemies
                                </h2>
                                <p className="font-lora text-[10px] text-[#d1cdb8]/50 mt-0.5">
                                    Search, filter by CR or type, or draw a random foe
                                </p>
                            </div>
                        </div>
                        <span className={`font-fira-sans text-xs px-2.5 py-1 rounded border font-semibold ${
                            isEnemyFull
                                ? "bg-[#a63a3a]/20 border-[#a63a3a]/60 text-[#e57373]"
                                : "bg-[#a63a3a]/10 border-[#a63a3a]/40 text-[#e57373]"
                        }`}>
                            Enemies: {enemyCount}/{MAX_ENEMY_PARTICIPANTS}{isEnemyFull ? " · Full" : ""}
                        </span>
                    </div>

                    <div className="px-5 py-4 space-y-3">
                        {/* ── Filter row: CR chips + Type dropdown + Random button ── */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* CR filter chips */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-lora text-[10px] text-[#c5a059]/60 uppercase tracking-wider mr-0.5">CR:</span>
                                {["", "0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "10", "15", "20"].map((cr) => (
                                    <button
                                        key={cr}
                                        type="button"
                                        onClick={() => setFilterCr(prev => prev === cr ? "" : cr)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-fira-sans font-medium border transition-all ${
                                            filterCr === cr && cr !== ""
                                                ? "bg-[#c5a059] text-[#0c0d12] border-[#c5a059] shadow-[0_0_6px_rgba(197,160,89,0.4)]"
                                                : cr === "" && filterCr === ""
                                                ? "bg-[#c5a059]/15 text-[#c5a059] border-[#c5a059]/40"
                                                : "bg-[#181a21] text-[#d1cdb8]/55 border-[#c5a059]/20 hover:border-[#c5a059]/50 hover:text-[#c5a059]"
                                        }`}
                                    >
                                        {cr === "" ? "Any" : cr}
                                    </button>
                                ))}
                            </div>

                            {/* Creature type dropdown */}
                            <div className="relative ml-auto">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="appearance-none pl-3 pr-7 py-1.5 bg-[#0e1017] border border-[#c5a059]/25 hover:border-[#c5a059]/50 focus:border-[#c5a059]/60 text-[#d1cdb8] font-lora text-xs rounded outline-none transition-colors cursor-pointer"
                                >
                                    <option value="">All Types</option>
                                    {["aberration","beast","celestial","construct","dragon","elemental","fey","fiend","giant","humanoid","monstrosity","ooze","plant","undead"].map(t => (
                                        <option key={t} value={t} className="capitalize bg-[#181a21]">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#c5a059]/50 pointer-events-none" />
                            </div>

                            {/* Random Enemy button */}
                            <button
                                type="button"
                                onClick={handleRandomEnemy}
                                disabled={isEnemyFull || isTotalFull || isAddingRandom}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-lora font-semibold transition-all bg-[#c5a059]/10 border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/20 hover:border-[#c5a059]/70 hover:shadow-[0_0_10px_rgba(197,160,89,0.2)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                title="Draw a random enemy matching the active CR and type filters"
                            >
                                {isAddingRandom ? (
                                    <span className="w-3 h-3 border border-[#c5a059] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Shuffle className="w-3.5 h-3.5" />
                                )}
                                <span>{isAddingRandom ? "Drawing..." : "Random Foe"}</span>
                            </button>

                            {/* Clear filters */}
                            {(filterCr !== "" || filterType !== "") && (
                                <button
                                    type="button"
                                    onClick={() => { setFilterCr(""); setFilterType(""); }}
                                    className="flex items-center gap-1 text-[10px] font-lora text-[#d1cdb8]/40 hover:text-[#e57373] transition-colors cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                    Clear filters
                                </button>
                            )}
                        </div>

                        {/* ── Search bar ── */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#c5a059]/50" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={
                                    isEnemyFull
                                        ? `Enemy limit reached (${MAX_ENEMY_PARTICIPANTS}/${MAX_ENEMY_PARTICIPANTS})`
                                        : isTotalFull
                                        ? `Encounter capacity reached (${MAX_TOTAL_PARTICIPANTS}/${MAX_TOTAL_PARTICIPANTS})`
                                        : filterCr || filterType
                                        ? "Search by name within filtered results..."
                                        : "Search monsters — Goblin, Dragon, Beholder..."
                                }
                                disabled={isEnemyFull || isTotalFull}
                                className="w-full pl-9 pr-4 py-2.5 bg-[#0e1017] border border-[#c5a059]/25 hover:border-[#c5a059]/50 focus:border-[#c5a059]/70 text-[#d1cdb8] placeholder-[#d1cdb8]/30 rounded text-sm font-lora outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <span className="animate-spin block w-3.5 h-3.5 border-2 border-[#c5a059]/40 border-t-[#c5a059] rounded-full" />
                                </div>
                            )}
                        </div>

                        {/* Capacity warning */}
                        {(isEnemyFull || isTotalFull) && (
                            <div className="text-xs font-lora text-[#c5a059] bg-[#c5a059]/8 border border-[#c5a059]/25 rounded px-3 py-2 flex items-center gap-2">
                                <span>⚠</span>
                                <span>
                                    {isEnemyFull
                                        ? `Enemy roster is full (max ${MAX_ENEMY_PARTICIPANTS}). Remove an enemy below to add another.`
                                        : `Total encounter capacity reached (${MAX_TOTAL_PARTICIPANTS} max). Remove a participant to add more.`}
                                </span>
                            </div>
                        )}

                        {/* ── Search / filter results ── */}
                        {(searchQuery.length > 0 || filterCr !== "" || filterType !== "") && (
                            <div className="border border-[#c5a059]/25 rounded overflow-hidden">
                                {enemies.length === 0 && !isSearching ? (
                                    <div className="px-4 py-3 font-lora text-sm text-[#d1cdb8]/50 italic bg-[#0e1017]">
                                        No monsters found matching those filters.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[#c5a059]/10 max-h-64 overflow-y-auto bg-[#0e1017]">
                                        {enemies.map((enemy) => {
                                            const cannotAddEnemy = isEnemyFull || isTotalFull;
                                            return (
                                                <div
                                                    key={enemy.id}
                                                    onClick={() => { if (!cannotAddEnemy) handleAddEnemy(enemy.id); }}
                                                    className={`px-4 py-3 flex justify-between items-center group transition-colors ${
                                                        cannotAddEnemy
                                                            ? "opacity-40 cursor-not-allowed"
                                                            : "hover:bg-[#c5a059]/5 cursor-pointer"
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="font-lora text-sm font-semibold text-[#d1cdb8] group-hover:text-[#c5a059] transition-colors">
                                                            {enemy.name}
                                                        </div>
                                                        <div className="font-fira-sans text-xs text-[#d1cdb8]/40 mt-0.5 flex items-center gap-2">
                                                            <span className="text-[#c5a059]/60">CR {enemy.challenge_rating}</span>
                                                            <span className="text-[#d1cdb8]/25">·</span>
                                                            <span className="capitalize">{enemy.type}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`font-lora text-xs px-2.5 py-1 rounded border transition-all ${
                                                        cannotAddEnemy
                                                            ? "text-[#d1cdb8]/30 border-[#d1cdb8]/10"
                                                            : "text-[#c5a059] border-[#c5a059]/30 bg-[#c5a059]/8 group-hover:bg-[#c5a059]/15 group-hover:border-[#c5a059]/60"
                                                    }`}>
                                                        {cannotAddEnemy ? "Full" : "+ Add"}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {searchQuery.length === 0 && filterCr === "" && filterType === "" && !isEnemyFull && !isTotalFull && (
                            <p className="font-lora text-xs text-[#d1cdb8]/35 italic py-1">
                                Select CR or type filters above, or type a monster name to browse the SRD bestiary.
                            </p>
                        )}
                    </div>
                </FantasyCard>


                {/* ── CURRENT ROSTER ── */}
                <FantasyCard className="p-0 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#c5a059]/20 bg-[radial-gradient(ellipse_at_top_left,#1a1d29_0%,#181a21_100%)]">
                        <div className="flex items-center gap-2.5">
                            <Swords className="w-4 h-4 text-[#c5a059]" />
                            <div>
                                <h2 className="font-cinzel-decorative text-sm font-bold text-[#c5a059] tracking-wide">
                                    Encounter Roster
                                </h2>
                                <p className="font-lora text-[10px] text-[#d1cdb8]/50 mt-0.5">
                                    Set initiative values or leave blank to auto-roll
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-fira-sans text-[10px] text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/25 px-2 py-0.5 rounded">
                                Party: {partyCount}/{MAX_PARTY_PARTICIPANTS}
                            </span>
                            <span className="font-fira-sans text-[10px] text-[#e57373] bg-[#a63a3a]/10 border border-[#a63a3a]/25 px-2 py-0.5 rounded">
                                Enemies: {enemyCount}/{MAX_ENEMY_PARTICIPANTS}
                            </span>
                        </div>
                    </div>

                    <div className="px-5 py-4">
                        {(!session.participants || session.participants.length === 0) ? (
                            <p className="font-lora text-sm text-[#d1cdb8]/40 italic py-4 text-center">
                                No participants yet. Add characters or enemies above.
                            </p>
                        ) : (
                            <div className="space-y-5">
                                {/* Heroes */}
                                {heroParticipants.length > 0 && (
                                    <div>
                                        <h3 className="font-lora text-xs font-bold text-[#22c55e]/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                                            Your Party ({heroParticipants.length}/{MAX_PARTY_PARTICIPANTS})
                                        </h3>
                                        <div className="space-y-2">
                                            {heroParticipants.map((participant) => (
                                                <div key={participant.id} className="flex items-center gap-3 px-4 py-3 rounded bg-[#22c55e]/5 border border-[#22c55e]/20">
                                                    <div className="w-1 h-10 bg-[#22c55e]/50 rounded-full shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-lora text-sm font-semibold text-[#d1cdb8] truncate">
                                                            {participant.name}
                                                        </div>
                                                        <div className="font-fira-sans text-xs text-[#d1cdb8]/45 mt-0.5">
                                                            HP: {participant.current_hp}/{participant.max_hp} · AC: {participant.armor_class}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="font-lora text-[10px] text-[#d1cdb8]/40">Initiative:</span>
                                                        <input
                                                            type="number"
                                                            value={initiativeValues[participant.id] ?? participant.initiative ?? ""}
                                                            onChange={(e) => handleInitiativeChange(participant.id, e.target.value)}
                                                            placeholder="Auto"
                                                            className="w-16 text-center bg-[#0e1017] border border-[#c5a059]/25 hover:border-[#c5a059]/50 focus:border-[#c5a059]/70 text-[#d1cdb8] font-fira-sans text-sm rounded py-1.5 outline-none transition-colors"
                                                        />
                                                        <button
                                                            onClick={() => handleRemoveParticipant(participant.id)}
                                                            className="w-7 h-7 flex items-center justify-center text-[#d1cdb8]/30 hover:text-[#e57373] hover:bg-[#a63a3a]/15 rounded transition-colors cursor-pointer"
                                                            title="Remove from combat"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Enemies */}
                                {enemyParticipantsInRoster.length > 0 && (
                                    <div>
                                        <h3 className="font-lora text-xs font-bold text-[#e57373]/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#e57373]" />
                                            Enemies ({enemyParticipantsInRoster.length}/{MAX_ENEMY_PARTICIPANTS})
                                        </h3>
                                        <div className="space-y-2">
                                            {enemyParticipantsInRoster.map((participant) => (
                                                <div key={participant.id} className="flex items-center gap-3 px-4 py-3 rounded bg-[#a63a3a]/8 border border-[#a63a3a]/25">
                                                    <div className="w-1 h-10 bg-[#a63a3a]/60 rounded-full shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-lora text-sm font-semibold text-[#d1cdb8] truncate">
                                                            {participant.name}
                                                        </div>
                                                        <div className="font-fira-sans text-xs text-[#d1cdb8]/45 mt-0.5">
                                                            HP: {participant.current_hp}/{participant.max_hp} · AC: {participant.armor_class}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="font-lora text-[10px] text-[#d1cdb8]/40">Initiative:</span>
                                                        <input
                                                            type="number"
                                                            value={initiativeValues[participant.id] ?? participant.initiative ?? ""}
                                                            onChange={(e) => handleInitiativeChange(participant.id, e.target.value)}
                                                            placeholder="Auto"
                                                            className="w-16 text-center bg-[#0e1017] border border-[#a63a3a]/30 hover:border-[#a63a3a]/60 focus:border-[#a63a3a]/80 text-[#d1cdb8] font-fira-sans text-sm rounded py-1.5 outline-none transition-colors"
                                                        />
                                                        <button
                                                            onClick={() => handleRemoveParticipant(participant.id)}
                                                            className="w-7 h-7 flex items-center justify-center text-[#d1cdb8]/30 hover:text-[#e57373] hover:bg-[#a63a3a]/15 rounded transition-colors cursor-pointer"
                                                            title="Remove from combat"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </FantasyCard>

                {/* ── BEGIN COMBAT CTA ── */}
                <div className="pt-2 pb-8">
                    <button
                        onClick={handleStartCombat}
                        disabled={session.participants.length === 0 || totalCount > MAX_TOTAL_PARTICIPANTS}
                        className="w-full py-4 bg-[#c5a059] hover:bg-[#d6b16a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0c0d12] font-cinzel-decorative font-bold text-base tracking-widest rounded transition-all shadow-[0_0_30px_rgba(197,160,89,0.3)] hover:shadow-[0_0_50px_rgba(197,160,89,0.5)] flex items-center justify-center gap-3 cursor-pointer"
                    >
                        <Play className="w-5 h-5 fill-current" />
                        BEGIN COMBAT
                    </button>
                    {session.participants.length === 0 && (
                        <p className="font-lora text-center text-xs text-[#d1cdb8]/40 italic mt-2">
                            Add at least one hero and one enemy to begin.
                        </p>
                    )}
                </div>

            </main>
        </div>
    );
}
