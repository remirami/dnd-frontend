"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { charactersApi } from "@/lib/api/characters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Character } from "@/lib/types/character";

export default function CharactersPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        loadCharacters();
    }, [isAuthenticated, router]);

    const loadCharacters = async () => {
        try {
            const response = await charactersApi.getAll();
            console.log("Characters API response:", response.data);
            // Django REST Framework pagination - data is in 'results'
            const data = response.data.results || [];
            setCharacters(data);
        } catch (error) {
            console.error("Failed to load characters:", error);
            setCharacters([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
                <p className="text-white text-xl">Loading characters...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white">My Characters</h1>
                        <p className="text-slate-400 mt-2">
                            Welcome back, {user?.username}!
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => router.push("/")}
                            className="bg-slate-700 hover:bg-slate-600 text-white"
                        >
                            Home
                        </Button>
                        <Button
                            onClick={() => router.push("/characters/create")}
                            size="lg"
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Create Character
                        </Button>
                    </div>
                </div>

                {/* Characters Grid */}
                {characters.length === 0 ? (
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>No Characters Yet</CardTitle>
                            <CardDescription>
                                Create your first 5e character to get started!
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={() => router.push("/characters/create")}
                                className="w-full"
                            >
                                Create Your First Character
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {characters.map((character) => (
                            <Card
                                key={character.id}
                                className="cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => router.push(`/characters/${character.id}`)}
                            >
                                <CardHeader>
                                    <CardTitle>{character.name}</CardTitle>
                                    <CardDescription>
                                        Level {character.level} {character.race?.name_display || character.race?.name || 'Unknown'} {character.character_class?.name_display || character.character_class?.name || 'Unknown'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">HP:</span>
                                            <span className="font-semibold">
                                                {character.stats?.hit_points ?? '-'}/{character.stats?.max_hit_points ?? '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">AC:</span>
                                            <span className="font-semibold">{character.stats?.armor_class ?? '-'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">XP:</span>
                                            <span className="font-semibold">
                                                {character.experience_points?.toLocaleString() ?? '0'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
