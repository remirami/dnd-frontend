"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { charactersApi } from "@/lib/api/characters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import type { Character } from "@/lib/types/character";

function getModifierString(score: number): string {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default function CharactersPage() {
    const router = useRouter();
    const { user, isAuthenticated, fetchCurrentUser } = useAuthStore();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [rolling, setRolling] = useState(false);
    const [saving, setSaving] = useState(false);
    const [previewHero, setPreviewHero] = useState<any | null>(null);
    const [savedHero, setSavedHero] = useState<any | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        if (!user) {
            fetchCurrentUser();
        }

        loadCharacters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, router]);

    const loadCharacters = async () => {
        try {
            const response = await charactersApi.getAll();
            const data = response.data.results || [];
            setCharacters(data);
        } catch (error) {
            console.error("Failed to load characters:", error);
            setCharacters([]);
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Roll preview data without adding to database
    const handleQuickRoll = async () => {
        setRolling(true);
        setIsConfirmed(false);
        setSavedHero(null);
        try {
            const res = await charactersApi.generateRandom({ preview: true });
            setPreviewHero(res.data);
            setModalOpen(true);
        } catch (err) {
            console.error("Failed to roll random character preview:", err);
            alert("Could not roll random character preview. Please try again.");
        } finally {
            setRolling(false);
        }
    };

    // Step 2: Confirm character and persist to database
    const handleConfirmHero = async () => {
        if (!previewHero) return;
        setSaving(true);
        try {
            const res = await charactersApi.generateRandom({
                preview: false,
                character_data: previewHero
            });
            const createdChar = res.data;
            setSavedHero(createdChar);
            setIsConfirmed(true);
            await loadCharacters();
        } catch (err) {
            console.error("Failed to confirm character:", err);
            alert("Could not save character. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
                <p className="text-white text-xl">Loading characters...</p>
            </div>
        );
    }

    const currentHero = isConfirmed ? savedHero : previewHero;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">My Characters</h1>
                        <p className="text-slate-400 mt-2">
                            Welcome back, {user?.username}!
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            onClick={() => router.push("/")}
                            className="bg-slate-700 hover:bg-slate-600 text-white"
                        >
                            Home
                        </Button>
                        <Button
                            onClick={handleQuickRoll}
                            disabled={rolling}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-purple-900/30 transition-all active:scale-95"
                        >
                            {rolling ? "🎲 Rolling..." : "🎲 Quick Random"}
                        </Button>
                        <Button
                            onClick={() => router.push("/characters/create")}
                            className="bg-red-600 hover:bg-red-700 font-semibold"
                        >
                            Create Character
                        </Button>
                    </div>
                </div>

                {/* Characters Grid */}
                {characters.length === 0 ? (
                    <Card className="max-w-2xl mx-auto bg-slate-800/80 border-slate-700 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-white">No Characters Yet</CardTitle>
                            <CardDescription className="text-slate-400">
                                Create your first 5e character to get started, or preview and roll a randomized level 1 hero instantly!
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={() => router.push("/characters/create")}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Create Your First Character
                                </Button>
                                <Button
                                    onClick={handleQuickRoll}
                                    disabled={rolling}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                                >
                                    {rolling ? "🎲 Rolling..." : "🎲 Quick Random Character"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {characters.map((character) => (
                            <Card
                                key={character.id}
                                className="cursor-pointer hover:shadow-xl hover:border-slate-500 transition-all bg-slate-800/90 border-slate-700 group"
                                onClick={() => router.push(`/characters/${character.id}`)}
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-white group-hover:text-amber-400 transition-colors">
                                            {character.name}
                                        </CardTitle>
                                        <Badge variant="outline" className="text-slate-300 border-slate-600 text-xs">
                                            Lvl {character.level}
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-slate-400">
                                        {character.race?.name_display || character.race?.name || 'Unknown'} {character.character_class?.name_display || character.character_class?.name || 'Unknown'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Hit Points:</span>
                                            <span className="font-semibold text-emerald-400">
                                                {character.stats?.hit_points ?? '-'}/{character.stats?.max_hit_points ?? '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Armor Class:</span>
                                            <span className="font-semibold text-blue-400">{character.stats?.armor_class ?? '-'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Wealth:</span>
                                            <span className="font-semibold text-amber-300">
                                                {character.gold_pieces ?? 0} gp
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Quick Roll Result Modal (Preview & Confirm) */}
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-xl">
                        <DialogHeader>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">🎲</span>
                                <Badge
                                    className={
                                        isConfirmed
                                            ? "bg-emerald-900/60 text-emerald-300 border-emerald-600 font-medium"
                                            : "bg-purple-900/60 text-purple-300 border-purple-600 font-medium"
                                    }
                                >
                                    {isConfirmed ? "✓ Character Added to List" : "Preview: Level 1 Character"}
                                </Badge>
                            </div>
                            <DialogTitle className="text-2xl font-bold text-white tracking-wide">
                                {currentHero?.name}
                            </DialogTitle>
                            <DialogDescription className="text-slate-300 text-sm">
                                Level {currentHero?.level || 1} {currentHero?.race?.name || currentHero?.race_name || ""} {currentHero?.character_class?.name || currentHero?.character_class_name || ""}
                                {currentHero?.subclass ? ` (${currentHero.subclass})` : ""}
                                {currentHero?.background?.name || currentHero?.background_name ? ` • ${currentHero.background?.name || currentHero.background_name}` : ""}
                                {currentHero?.alignment ? ` • ${currentHero.alignment}` : ""}
                            </DialogDescription>
                        </DialogHeader>

                        {currentHero && (
                            <div className="space-y-4 py-2">
                                {/* HP, AC, Gold summary */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-800/80 rounded-lg p-3 text-center border border-slate-700">
                                        <div className="text-xs text-slate-400 uppercase font-semibold">Hit Points</div>
                                        <div className="text-xl font-bold text-emerald-400 mt-1">
                                            {currentHero.stats?.hit_points ?? currentHero.hit_points ?? "-"}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/80 rounded-lg p-3 text-center border border-slate-700">
                                        <div className="text-xs text-slate-400 uppercase font-semibold">Armor Class</div>
                                        <div className="text-xl font-bold text-blue-400 mt-1">
                                            {currentHero.stats?.armor_class ?? currentHero.armor_class ?? "-"}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/80 rounded-lg p-3 text-center border border-slate-700">
                                        <div className="text-xs text-slate-400 uppercase font-semibold">Starting Gold</div>
                                        <div className="text-xl font-bold text-amber-300 mt-1">
                                            {currentHero.gold_pieces ?? 0} gp
                                        </div>
                                    </div>
                                </div>

                                {/* Rolled Ability Scores */}
                                <div>
                                    <div className="text-xs font-semibold uppercase text-slate-400 mb-2">Rolled Ability Scores (4d6 Drop Lowest)</div>
                                    <div className="grid grid-cols-6 gap-2">
                                        {[
                                            { label: 'STR', val: currentHero.stats?.strength ?? currentHero.strength ?? 10 },
                                            { label: 'DEX', val: currentHero.stats?.dexterity ?? currentHero.dexterity ?? 10 },
                                            { label: 'CON', val: currentHero.stats?.constitution ?? currentHero.constitution ?? 10 },
                                            { label: 'INT', val: currentHero.stats?.intelligence ?? currentHero.intelligence ?? 10 },
                                            { label: 'WIS', val: currentHero.stats?.wisdom ?? currentHero.wisdom ?? 10 },
                                            { label: 'CHA', val: currentHero.stats?.charisma ?? currentHero.charisma ?? 10 },
                                        ].map((stat) => (
                                            <div
                                                key={stat.label}
                                                className="bg-slate-800/90 border border-slate-700 rounded-md p-2 text-center"
                                            >
                                                <div className="text-[11px] font-bold text-slate-400">{stat.label}</div>
                                                <div className="text-base font-extrabold text-white mt-0.5">{stat.val}</div>
                                                <div className="text-[11px] text-purple-300 font-medium">{getModifierString(stat.val)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Starting Spells if present */}
                                {(currentHero.cantrip_names?.length > 0 || currentHero.spell_names?.length > 0) && (
                                    <div className="bg-slate-800/60 rounded-md p-3 border border-slate-700/60">
                                        <div className="text-xs font-semibold text-purple-300 uppercase mb-1.5">Starting Spells:</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {currentHero.cantrip_names?.map((c: string) => (
                                                <span key={c} className="bg-purple-950/80 text-purple-200 border border-purple-800 px-2 py-0.5 rounded text-xs">
                                                    ✨ {c} (Cantrip)
                                                </span>
                                            ))}
                                            {currentHero.spell_names?.map((s: string) => (
                                                <span key={s} className="bg-indigo-950/80 text-indigo-200 border border-indigo-800 px-2 py-0.5 rounded text-xs">
                                                    🔮 {s} (Lvl 1)
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Ideals / Personality snippet if available */}
                                {currentHero.ideals && (
                                    <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/60 text-xs text-slate-300 italic">
                                        &ldquo;{currentHero.ideals}&rdquo;
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                            {!isConfirmed ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setModalOpen(false)}
                                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleQuickRoll}
                                        disabled={rolling || saving}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        {rolling ? "Rolling..." : "🎲 Re-roll"}
                                    </Button>
                                    <Button
                                        onClick={handleConfirmHero}
                                        disabled={saving}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-900/30"
                                    >
                                        {saving ? "Creating..." : "Confirm & Add to List"}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setModalOpen(false)}
                                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        onClick={handleQuickRoll}
                                        disabled={rolling}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        {rolling ? "Rolling..." : "🎲 Roll Another"}
                                    </Button>
                                    <Button
                                        onClick={() => router.push(`/characters/${savedHero?.id}`)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                    >
                                        Open Character Sheet →
                                    </Button>
                                </>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
