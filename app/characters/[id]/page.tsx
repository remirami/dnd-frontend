"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { charactersApi } from "@/lib/api/characters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Character } from "@/lib/types/character";
import { getAbilityModifier, formatModifier } from "@/lib/utils";

import { InventoryTab } from "./components/InventoryTab";
import { SpellsTab } from "./components/SpellsTab";
import { EditCharacterDialog } from "./components/EditCharacterDialog";
import { AddExperienceDialog } from "./components/AddExperienceDialog";
import { ASIFeatDialog } from "./components/ASIFeatDialog";
import { SubclassSelectionDialog } from "./components/SubclassSelectionDialog";
import LevelUpDialog from "./components/LevelUpDialog";
import LanguageSelectionDialog from "./components/LanguageSelectionDialog";
import { HPManagementDialog } from "./components/HPManagementDialog";
import { LevelUpSpellSelectionDialog } from "./components/LevelUpSpellSelectionDialog";
import { ShortRestDialog } from "./components/ShortRestDialog";
import { FeatureSelectionDialog } from "./components/FeatureSelectionDialog";
import { SkillsAndSaves } from "./components/SkillsAndSaves";
import { DiceRoller } from "@/components/DiceRoller";
import { Edit } from "lucide-react";

// D&D 5e XP thresholds
const XP_THRESHOLDS: Record<number, number> = {
    2: 300,
    3: 900,
    4: 2700,
    5: 6500,
    6: 14000,
    7: 23000,
    8: 34000,
    9: 48000,
    10: 64000,
    11: 85000,
    12: 100000,
    13: 120000,
    14: 140000,
    15: 165000,
    16: 195000,
    17: 225000,
    18: 265000,
    19: 305000,
    20: 355000,
};

const getXPForNextLevel = (currentLevel: number): number => {
    if (currentLevel >= 20) return 0; // Max level
    return XP_THRESHOLDS[currentLevel + 1] || 0;
};

const getXPProgress = (currentXP: number, currentLevel: number): number => {
    if (currentLevel >= 20) return 100;
    const currentLevelXP = XP_THRESHOLDS[currentLevel] || 0;
    const nextLevelXP = getXPForNextLevel(currentLevel);
    if (nextLevelXP === 0) return 100;
    const xpIntoLevel = currentXP - currentLevelXP;
    const xpNeededForLevel = nextLevelXP - currentLevelXP;
    return Math.min(100, Math.max(0, (xpIntoLevel / xpNeededForLevel) * 100));
};


export default function CharacterDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [character, setCharacter] = useState<Character | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'spells'>('overview');
    const [selectedFeature, setSelectedFeature] = useState<any>(null); // Type 'any' or CharacterFeature logic
    const [isEditingStats, setIsEditingStats] = useState(false);
    const [editedStats, setEditedStats] = useState({
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
    });

    // Use params.id directly
    const characterId = Number(params.id);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        if (characterId) {
            loadCharacter(characterId);
        }
    }, [isAuthenticated, characterId, router]);

    const loadCharacter = async (id: number) => {
        try {
            const response = await charactersApi.getById(id);
            setCharacter(response.data);
        } catch (err) {
            console.error("Failed to load character:", err);
            setError("Failed to load character details");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this character? This cannot be undone.")) {
            return;
        }

        try {
            await charactersApi.delete(characterId);
            router.push("/characters");
        } catch (err) {
            console.error("Failed to delete character:", err);
            alert("Failed to delete character");
        }
    };

    const handleEditStats = () => {
        if (character?.stats) {
            setEditedStats({
                strength: character.stats.strength || 10,
                dexterity: character.stats.dexterity || 10,
                constitution: character.stats.constitution || 10,
                intelligence: character.stats.intelligence || 10,
                wisdom: character.stats.wisdom || 10,
                charisma: character.stats.charisma || 10,
            });
        }
        setIsEditingStats(true);
    };

    const handleSaveStats = async () => {
        try {
            await charactersApi.updateStats(characterId, editedStats);
            setIsEditingStats(false);
            // Force page reload to show updated stats
            window.location.reload();
        } catch (err) {
            console.error("Failed to update stats:", err);
            alert("Failed to update stats");
        }
    };

    const handleCancelEditStats = () => {
        setIsEditingStats(false);
    };

    const handleLevelUp = async () => {
        if (!character) {
            console.error('Character data not loaded');
            return;
        }
        if (!confirm(`Level up ${character.name} to level ${character.level + 1}?`)) {
            return;
        }

        try {
            await charactersApi.levelUp(characterId);
            window.location.reload();
        } catch (err) {
            console.error("Failed to level up:", err);
            alert("Failed to level up character");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center text-white">
                Loading...
            </div>
        );
    }

    if (error || !character) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center text-white">
                {error || "Character not found"}
            </div>
        );
    }

    const stats = character.stats;
    const abilityScores = [
        { name: "STR", score: stats?.strength ?? 10, mod: stats?.strength ? getAbilityModifier(stats.strength) : 0 },
        { name: "DEX", score: stats?.dexterity ?? 10, mod: stats?.dexterity ? getAbilityModifier(stats.dexterity) : 0 },
        { name: "CON", score: stats?.constitution ?? 10, mod: stats?.constitution ? getAbilityModifier(stats.constitution) : 0 },
        { name: "INT", score: stats?.intelligence ?? 10, mod: stats?.intelligence ? getAbilityModifier(stats.intelligence) : 0 },
        { name: "WIS", score: stats?.wisdom ?? 10, mod: stats?.wisdom ? getAbilityModifier(stats.wisdom) : 0 },
        { name: "CHA", score: stats?.charisma ?? 10, mod: stats?.charisma ? getAbilityModifier(stats.charisma) : 0 },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Breadcrumb */}
                <div className="mb-2">
                    <Button
                        variant="ghost"
                        className="text-slate-400 hover:text-white p-0 h-auto font-normal"
                        onClick={() => router.push("/characters")}
                    >
                        ← Back to Characters
                    </Button>
                </div>

                {/* Header Section */}
                <div className="flex justify-between items-start gap-8">
                    <div className="flex-1">
                        <h1 className="text-4xl font-bold">{character.name}</h1>
                        <p className="text-xl text-slate-400 mt-2">
                            Level {character.level} {character.race?.name_display || character.race?.name}{" "}
                            {character.class_levels && character.class_levels.length > 0 ? (
                                <>
                                    {character.class_levels
                                        .map((cl) => {
                                            const displayName = cl.class_name.charAt(0).toUpperCase() + cl.class_name.slice(1);
                                            // If subclass exists for this class, prepend it
                                            if (cl.subclass) {
                                                const subName = cl.subclass.charAt(0).toUpperCase() + cl.subclass.slice(1);
                                                return `${subName} ${displayName} ${cl.level}`;
                                            }
                                            return `${displayName} ${cl.level}`;
                                        })
                                        .join(" / ")}
                                </>
                            ) : (
                                <>
                                    {character.character_class?.name_display || character.character_class?.name}
                                    {character.subclass && <span className="text-slate-300"> ({character.subclass})</span>}
                                </>
                            )}
                        </p>
                        <p className="text-slate-500">
                            Background: {character.background?.name || "None"} | Alignment: {character.alignment || "N"}
                        </p>

                        {/* XP Progress Bar */}
                        <div className="mt-4 space-y-1">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Experience Points</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-300">
                                        {character.experience_points?.toLocaleString() || 0} / {getXPForNextLevel(character.level).toLocaleString()} XP
                                    </span>
                                    <AddExperienceDialog
                                        character={character}
                                        onUpdate={() => loadCharacter(characterId)}
                                    />
                                </div>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700 relative">
                                <div
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-500 ease-out"
                                    style={{ width: `${getXPProgress(character.experience_points || 0, character.level)}%` }}
                                />
                            </div>
                            {(() => {
                                const nextLevelXP = getXPForNextLevel(character.level);
                                const currentXP = character.experience_points || 0;
                                const canLevelUp = currentXP >= nextLevelXP && character.level < 20;

                                return (
                                    <>
                                        {canLevelUp ? (
                                            <div className="mt-2 text-center">
                                                <LevelUpDialog
                                                    character={character}
                                                    onUpdate={() => loadCharacter(characterId)}
                                                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.5)] transform hover:scale-[1.02] transition-all"
                                                    label={`✨ Level Up Available! (${character.level} → ${character.level + 1})`}
                                                />
                                            </div>
                                        ) : (
                                            character.level < 20 && (
                                                <p className="text-xs text-slate-500">
                                                    {(nextLevelXP - currentXP).toLocaleString()} XP to level {character.level + 1}
                                                </p>
                                            )
                                        )}
                                        {character.level >= 20 && (
                                            <p className="text-xs text-amber-400">
                                                Maximum Level Reached!
                                            </p>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Prominent Dice Roller */}
                    <div className="flex flex-col items-center justify-start pt-2">
                        <DiceRoller className="scale-110" />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={() => router.push("/characters")}
                            className="bg-slate-100 text-slate-900 hover:bg-white border-0 font-semibold"
                        >
                            Back to Characters
                        </Button>


                        {/* Rest Actions */}
                        <div className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
                            <ShortRestDialog
                                character={character}
                                onUpdate={() => loadCharacter(characterId)}
                            >
                                <Button size="sm" variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-700 h-8">
                                    Short Rest
                                </Button>
                            </ShortRestDialog>
                            <div className="w-px bg-slate-700 my-1"></div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-slate-300 hover:text-white hover:bg-slate-700 h-8"
                                onClick={async () => {
                                    if (confirm("Take a Long Rest? This will restore HP, Hit Dice, and Spell Slots.")) {
                                        try {
                                            await charactersApi.longRest(characterId);
                                            loadCharacter(characterId);
                                            // Maybe show toast?
                                        } catch (e) {
                                            console.error("Long rest failed", e);
                                            alert("Long rest failed");
                                        }
                                    }
                                }}
                            >
                                Long Rest
                            </Button>
                        </div>

                        <EditCharacterDialog
                            character={character}
                            onUpdate={() => loadCharacter(characterId)}
                        />
                        {character.pending_asi_levels && character.pending_asi_levels.length > 0 && (
                            <ASIFeatDialog
                                character={character}
                                onUpdate={() => loadCharacter(characterId)}
                            />
                        )}
                        {character.pending_subclass_selection && (
                            <SubclassSelectionDialog
                                character={character}
                                onUpdate={() => loadCharacter(characterId)}
                            />
                        )}
                        {(character.pending_language_choices ?? 0) > 0 && (
                            <LanguageSelectionDialog
                                character={character}
                                onUpdate={() => loadCharacter(characterId)}
                            />
                        )}
                        <LevelUpSpellSelectionDialog
                            character={character}
                            onUpdate={() => loadCharacter(characterId)}
                        />
                        <LevelUpDialog
                            character={character}
                            onUpdate={() => loadCharacter(characterId)}
                        />
                        <Button
                            onClick={handleDelete}
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete Character
                        </Button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-700 space-x-4 mb-6">
                    <button
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'overview'
                            ? 'border-white text-white'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'inventory'
                            ? 'border-white text-white'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        Inventory
                    </button>
                    <button
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'spells'
                            ? 'border-white text-white'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        onClick={() => setActiveTab('spells')}
                    >
                        Spells
                    </button>
                </div>

                {activeTab === 'overview' && (
                    <>
                        {/* Main Stats Grid */}
                        <div className="grid grid-cols-4 gap-4">
                            <Card className="bg-slate-800 border-slate-700 text-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">Armor Class</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stats?.armor_class ?? 10}</div>
                                </CardContent>
                            </Card>
                            <HPManagementDialog character={character} onUpdate={() => loadCharacter(characterId)}>
                                <Card className="bg-slate-800 border-slate-700 text-white cursor-pointer hover:bg-slate-700/50 transition-colors">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-400">Hit Points</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-green-500 flex items-center gap-2">
                                            {stats?.hit_points ?? 0} <span className="text-lg text-slate-500">/</span> {stats?.max_hit_points ?? 0}
                                        </div>
                                        {stats?.temporary_hit_points ? (
                                            <div className="text-sm font-bold text-purple-400 mt-1">
                                                +{stats.temporary_hit_points} Temp HP
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400 mt-1">
                                                Max HP: {stats?.max_hit_points ?? 0}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </HPManagementDialog>
                            <Card className="bg-slate-800 border-slate-700 text-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">Initiative</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{formatModifier(stats?.initiative ?? 0)}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-800 border-slate-700 text-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">Speed</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stats?.speed ?? 30} ft.</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-800 border-slate-700 text-white col-span-4 md:col-span-1">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">Attack</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold text-blue-400">
                                        {(() => {
                                            const pb = Math.ceil(1 + (character.level / 4));
                                            const strMod = stats?.strength ? getAbilityModifier(stats.strength) : 0;
                                            const dexMod = stats?.dexterity ? getAbilityModifier(stats.dexterity) : 0;

                                            // Find equipped weapon
                                            const weapon = character.character_items?.find(i => i.is_equipped && i.equipment_slot === 'main_hand');

                                            let mod = strMod;
                                            let damageDice = "1"; // Unarmed default

                                            if (weapon) {
                                                const props = weapon.item_details.properties_display || [];
                                                // Check for Finesse or Ranged
                                                const isFinesse = weapon.item_details.properties?.some((p: any) => p.name === 'Finesse');

                                                if (weapon.item_details.weapon_type_display?.includes('Ranged')) {
                                                    mod = dexMod;
                                                } else if (isFinesse && dexMod > strMod) {
                                                    mod = dexMod;
                                                }
                                                damageDice = weapon.item_details.damage_dice || "1d4";
                                            }

                                            const toHit = formatModifier(mod + pb);
                                            const damageMod = mod >= 0 ? `+${mod}` : `${mod}`;

                                            return (
                                                <div className="flex flex-col">
                                                    <span>{toHit} To Hit</span>
                                                    <span className="text-sm text-slate-300 font-normal">
                                                        {damageDice} {mod !== 0 && damageMod} Dmg
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        {(() => {
                                            const weapon = character.character_items?.find(i => i.is_equipped && i.equipment_slot === 'main_hand');
                                            return weapon ? weapon.item_details.name : 'Unarmed Strike';
                                        })()}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Ability Scores */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Ability Scores</h3>
                                {!isEditingStats ? (
                                    <Button
                                        onClick={handleEditStats}
                                        variant="outline"
                                        size="sm"
                                        className="border-blue-500 text-blue-400 hover:bg-blue-950 hover:text-blue-300"
                                    >
                                        Edit Stats
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleSaveStats}
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            onClick={handleCancelEditStats}
                                            variant="outline"
                                            size="sm"
                                            className="border-slate-600"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                            </div>
                            {isEditingStats && (
                                <div className="mb-3 p-2 bg-blue-900/20 border border-blue-700/30 rounded text-sm text-blue-200">
                                    💡 <strong>Note:</strong> These are your final ability scores (including racial bonuses and other modifiers). Changes will directly update these values.
                                </div>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                {abilityScores.map((ability) => {
                                    // Map abbreviated names to full stat names
                                    const statNameMap: Record<string, keyof typeof editedStats> = {
                                        'str': 'strength',
                                        'dex': 'dexterity',
                                        'con': 'constitution',
                                        'int': 'intelligence',
                                        'wis': 'wisdom',
                                        'cha': 'charisma'
                                    };
                                    const statKey = statNameMap[ability.name.toLowerCase()];
                                    const displayScore = isEditingStats ? editedStats[statKey] : ability.score;
                                    const displayMod = getAbilityModifier(displayScore);

                                    return (
                                        <div key={ability.name} className="bg-slate-800 rounded-lg p-4 text-center border border-slate-700">
                                            <div className="text-sm font-bold text-slate-400 mb-1">{ability.name}</div>
                                            {isEditingStats ? (
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="30"
                                                    value={editedStats[statKey] || 10}
                                                    onChange={(e) => setEditedStats({
                                                        ...editedStats,
                                                        [statKey]: parseInt(e.target.value) || 10
                                                    })}
                                                    className="text-2xl font-bold text-center bg-slate-700 border-slate-600 mb-1 h-12"
                                                />
                                            ) : (
                                                <div className="text-2xl font-bold mb-1">{displayScore}</div>
                                            )}
                                            <div className="text-sm bg-slate-700 rounded px-2 py-1 inline-block">
                                                {formatModifier(displayMod)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mb-6">
                            <SkillsAndSaves character={character} />
                        </div>

                        {/* Proficiencies & Features Grid (Roleplay & Features) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Roleplay & Languages */}
                            <Card className="bg-slate-800 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Roleplay & Languages</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">

                                    {character.description && (
                                        <div>
                                            <h3 className="text-slate-400 font-semibold mb-2">Visual Description</h3>
                                            <p className="text-slate-300 text-sm whitespace-pre-wrap break-words">{character.description}</p>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-slate-400 font-semibold mb-2">Languages</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {character.proficiencies?.filter(p => p.proficiency_type === 'language').map(p => (
                                                <span key={p.id} className="px-2 py-1 bg-slate-700 rounded text-sm text-slate-200">
                                                    {p.language?.name || "Unknown Language"}
                                                </span>
                                            ))}
                                            {(!character.proficiencies?.some(p => p.proficiency_type === 'language')) && (
                                                <p className="text-slate-500 italic text-sm">Common</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bonds */}
                                    {character.bonds && (
                                        <div>
                                            <h3 className="text-slate-400 font-semibold mb-2">Bonds</h3>
                                            <p className="text-slate-300 text-sm break-words">{character.bonds}</p>
                                        </div>
                                    )}

                                    {/* Flaws */}
                                    {character.flaws && (
                                        <div>
                                            <h3 className="text-slate-400 font-semibold mb-2">Flaws</h3>
                                            <p className="text-slate-300 text-sm break-words">{character.flaws}</p>
                                        </div>
                                    )}

                                    {/* Ideals */}
                                    {character.ideals && (
                                        <div>
                                            <h3 className="text-slate-400 font-semibold mb-2">Ideals</h3>
                                            <p className="text-slate-300 text-sm break-words">{character.ideals}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Features & Traits */}
                            <Card className="bg-slate-800 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Features & Traits</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {character.features && character.features.length > 0 ? (
                                        <div className="space-y-3">
                                            {(() => {
                                                // Group features by base name
                                                const featureGroups: Record<string, typeof character.features> = {};

                                                character.features.forEach(f => {
                                                    // Normalize name: "Skilled (2)" -> "Skilled"
                                                    const baseName = f.name.replace(/\s\(\d+\)$/, "");
                                                    if (!featureGroups[baseName]) {
                                                        featureGroups[baseName] = [];
                                                    }
                                                    featureGroups[baseName].push(f);
                                                });

                                                return Object.entries(featureGroups).map(([baseName, group]) => {
                                                    // Use the first feature for description/metadata
                                                    const firstFeature = group[0];
                                                    const isStacked = group.length > 1;

                                                    return (
                                                        <div key={baseName} className="border-b border-slate-700 last:border-0 pb-3 last:pb-0">
                                                            <div className="flex justify-between items-baseline mb-1">
                                                                <h4 className="font-bold text-slate-100">
                                                                    {baseName} {isStacked && <span className="text-xs text-slate-400 font-normal ml-2">x{group.length}</span>}
                                                                </h4>
                                                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 uppercase tracking-wider">
                                                                    {firstFeature.feature_type === 'racial' ? 'Race' : firstFeature.feature_type}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-300">{firstFeature.description}</p>

                                                            {/* Render Choices for each instance in the group */}
                                                            {group.map((f, idx) => (
                                                                f.options && f.options.length > 0 && (
                                                                    <div key={f.id} className="mt-2 pl-2 border-l-2 border-slate-700">
                                                                        {isStacked && <div className="text-xs text-slate-500 mb-1">Selection {idx + 1}</div>}
                                                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                                                            {f.selection && f.selection.length > 0 && (
                                                                                f.selection.map((sel: string, i: number) => (
                                                                                    <span key={i} className="bg-blue-900/50 text-blue-200 border border-blue-800 text-xs px-2 py-1 rounded">
                                                                                        {sel}
                                                                                    </span>
                                                                                ))
                                                                            )}
                                                                        </div>
                                                                        <Button
                                                                            variant={(f.selection?.length || 0) < (f.choice_limit || 1) ? "default" : "secondary"}
                                                                            size="sm"
                                                                            className={`mt-1 h-7 text-xs ${(f.selection?.length || 0) < (f.choice_limit || 1) ? "bg-blue-600 hover:bg-blue-500" : "bg-slate-700 hover:bg-slate-600 text-slate-200"}`}
                                                                            onClick={() => setSelectedFeature(f)}
                                                                        >
                                                                            <Edit className="w-3 h-3 mr-1.5" />
                                                                            {(f.selection?.length || 0) < (f.choice_limit || 1)
                                                                                ? "Make Choices"
                                                                                : "Edit Choices"}
                                                                        </Button>
                                                                    </div>
                                                                )
                                                            ))}
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 italic">No features or traits recorded.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Additional Details Placeholder */}
                        <Card className="bg-slate-800 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Character Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-slate-400 font-semibold">Experience</h3>
                                        <p>{character.experience_points} XP</p>
                                    </div>
                                    <div>
                                        <h3 className="text-slate-400 font-semibold">Proficiency Bonus</h3>
                                        <p>+{Math.ceil(1 + (character.level / 4))}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-slate-400 font-semibold">Race</h3>
                                        <p>{character.race?.name_display || character.race?.name}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-slate-400 font-semibold">Class</h3>
                                        <p>{character.character_class?.name_display || character.character_class?.name}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-slate-400 font-semibold">Alignment</h3>
                                        <p>{character.alignment}</p>
                                    </div>
                                </div>

                                {(character.backstory) && (
                                    <>
                                        <div className="pt-4 border-t border-slate-700">
                                            <h3 className="text-slate-400 font-semibold mb-1">Backstory</h3>
                                            <p className="text-slate-200 whitespace-pre-wrap break-words">{character.backstory}</p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}

                {activeTab === 'inventory' && (
                    <InventoryTab
                        character={character}
                        onUpdate={() => loadCharacter(characterId)}
                    />
                )}

                {activeTab === 'spells' && (
                    <SpellsTab
                        character={character}
                        onUpdate={() => loadCharacter(characterId)}
                    />
                )}

                {selectedFeature && (
                    <FeatureSelectionDialog
                        character={character}
                        feature={selectedFeature}
                        open={!!selectedFeature}
                        onOpenChange={(open) => !open && setSelectedFeature(null)}
                        onUpdate={() => loadCharacter(characterId)}
                        excludedOptions={(() => {
                            // Find all siblings in the same group (same base name) excluding self
                            if (!character.features) return [];
                            const baseName = selectedFeature.name.replace(/\s\(\d+\)$/, "");
                            const siblings = character.features.filter(f =>
                                f.id !== selectedFeature.id &&
                                f.name.replace(/\s\(\d+\)$/, "") === baseName
                            );
                            // Collect selections
                            const excluded: string[] = [];
                            siblings.forEach(s => {
                                if (s.selection) excluded.push(...s.selection);
                            });
                            return excluded;
                        })()}
                    />
                )}
            </div>
        </div>
    );
}
