"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { charactersApi } from "@/lib/api/characters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import FantasyCard from "@/components/ui/FantasyCard";
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
import { Edit, ArrowLeft } from "lucide-react";

// 5e SRD XP thresholds
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
            <div className="min-h-screen bg-[#0c0d12] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,#1a1d29_0%,#0c0d12_70%)] text-slate-100 flex flex-col">
                <Navbar showActions={true} />
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <div className="w-8 h-8 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
                    <p className="font-lora text-sm text-[#d1cdb8]/80 italic">
                        Summoning character dossier...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !character) {
        return (
            <div className="min-h-screen bg-[#0c0d12] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,#1a1d29_0%,#0c0d12_70%)] text-slate-100 flex flex-col">
                <Navbar showActions={true} />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <p className="font-cinzel-decorative text-xl text-[#c5a059] font-bold">
                        {error || "Character not found"}
                    </p>
                    <Button
                        onClick={() => router.push("/characters")}
                        className="bg-[#181a21] border border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/15 text-xs font-lora"
                    >
                        Back to Characters
                    </Button>
                </div>
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
        <div className="min-h-screen bg-[#0c0d12] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,#1a1d29_0%,#0c0d12_70%)] text-slate-100 flex flex-col">
            {/* Universal 5E Navbar */}
            <Navbar showActions={true} />

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10 space-y-6">
                {/* Breadcrumb */}
                <div className="mb-2">
                    <Link
                        href="/characters"
                        className="inline-flex items-center gap-1.5 text-xs font-lora text-[#c5a059]/80 hover:text-[#c5a059] transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Characters</span>
                    </Link>
                </div>

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start gap-6 border-b border-[#c5a059]/20 pb-6">
                    <div className="flex-1">
                        <h1 className="font-cinzel-decorative text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide text-[#c5a059] drop-shadow-[0_2px_10px_rgba(197,160,89,0.3)]">
                            {character.name}
                        </h1>
                        <p className="font-lora text-base sm:text-lg text-[#d1cdb8] font-medium mt-1">
                            Level {character.level} {character.race?.name_display || character.race?.name}{" "}
                            {character.class_levels && character.class_levels.length > 0 ? (
                                <>
                                    {character.class_levels
                                        .map((cl) => {
                                            const displayName = cl.class_name.charAt(0).toUpperCase() + cl.class_name.slice(1);
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
                                    {character.subclass && <span className="text-[#c5a059]/90 italic"> ({character.subclass})</span>}
                                </>
                            )}
                        </p>
                        <p className="font-lora text-xs sm:text-sm text-[#d1cdb8]/60 mt-0.5">
                            Background: {character.background?.name || "None"} | Alignment: {character.alignment || "N"}
                        </p>

                        {/* XP Progress Bar */}
                        <div className="mt-4 space-y-1.5 max-w-md">
                            <div className="flex justify-between items-center text-xs font-lora">
                                <span className="text-[#d1cdb8]/70 uppercase tracking-wider text-[11px]">Experience Points</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-fira-sans font-semibold text-[#c5a059]">
                                        {character.experience_points?.toLocaleString() || 0} / {getXPForNextLevel(character.level).toLocaleString()} XP
                                    </span>
                                    <AddExperienceDialog
                                        character={character}
                                        onUpdate={() => loadCharacter(characterId)}
                                    />
                                </div>
                            </div>
                            <div className="w-full bg-[#12141a] rounded-full h-2.5 overflow-hidden border border-[#c5a059]/30 relative">
                                <div
                                    className="bg-gradient-to-r from-[#9b7b39] via-[#c5a059] to-[#e0bc75] h-full shadow-[0_0_8px_rgba(197,160,89,0.4)] transition-all duration-500 ease-out"
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
                                                    className="w-full bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold animate-pulse shadow-[0_0_15px_rgba(197,160,89,0.5)] transform hover:scale-[1.02] transition-all text-xs"
                                                    label={`✦ Level Up Available! (${character.level} → ${character.level + 1})`}
                                                />
                                            </div>
                                        ) : (
                                            character.level < 20 && (
                                                <p className="text-[11px] font-lora text-[#d1cdb8]/50 italic">
                                                    {(nextLevelXP - currentXP).toLocaleString()} XP to level {character.level + 1}
                                                </p>
                                            )
                                        )}
                                        {character.level >= 20 && (
                                            <p className="text-[11px] font-lora text-[#c5a059] font-semibold">
                                                Maximum Level Reached
                                            </p>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Prominent Dice Roller */}
                    <div className="flex flex-col items-center justify-start self-center lg:self-start">
                        <DiceRoller className="scale-100 sm:scale-105" />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 items-center justify-start lg:justify-end">
                        <Button
                            onClick={() => router.push("/characters")}
                            className="bg-[#181a21] border border-[#c5a059]/50 text-[#c5a059] hover:bg-[#c5a059]/15 text-xs font-lora font-semibold px-3 py-1.5 h-auto rounded transition-colors shadow-sm"
                        >
                            Back to Characters
                        </Button>

                        {/* Rest Actions */}
                        <div className="flex items-center bg-[#12141a] p-1 rounded border border-[#c5a059]/30">
                            <ShortRestDialog
                                character={character}
                                onUpdate={() => loadCharacter(characterId)}
                            >
                                <Button size="sm" variant="ghost" className="text-xs text-[#d1cdb8] hover:text-[#c5a059] hover:bg-[#c5a059]/10 h-7 px-2.5 font-lora transition-colors">
                                    Short Rest
                                </Button>
                            </ShortRestDialog>
                            <div className="w-px h-4 bg-[#c5a059]/30 my-auto"></div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs text-[#d1cdb8] hover:text-[#c5a059] hover:bg-[#c5a059]/10 h-7 px-2.5 font-lora transition-colors"
                                onClick={async () => {
                                    if (confirm("Take a Long Rest? This will restore HP, Hit Dice, and Spell Slots.")) {
                                        try {
                                            await charactersApi.longRest(characterId);
                                            loadCharacter(characterId);
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
                        {character.pending_spell_choices && (
                            <LevelUpSpellSelectionDialog
                                character={character}
                                onUpdate={() => loadCharacter(characterId)}
                            />
                        )}
                        <LevelUpDialog
                            character={character}
                            onUpdate={() => loadCharacter(characterId)}
                        />
                        <Button
                            onClick={handleDelete}
                            variant="destructive"
                            className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-600/40 text-rose-300 hover:text-rose-100 text-xs font-lora font-semibold px-3 py-1.5 h-auto rounded transition-colors shadow-sm"
                        >
                            Delete Character
                        </Button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-[#c5a059]/30 space-x-6 font-cinzel-decorative tracking-wider text-sm sm:text-base">
                    <button
                        className={`pb-3 font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === 'overview'
                            ? 'border-[#c5a059] text-[#c5a059]'
                            : 'border-transparent text-[#d1cdb8]/60 hover:text-[#c5a059]'
                            }`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`pb-3 font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === 'inventory'
                            ? 'border-[#c5a059] text-[#c5a059]'
                            : 'border-transparent text-[#d1cdb8]/60 hover:text-[#c5a059]'
                            }`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        Inventory
                    </button>
                    <button
                        className={`pb-3 font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === 'spells'
                            ? 'border-[#c5a059] text-[#c5a059]'
                            : 'border-transparent text-[#d1cdb8]/60 hover:text-[#c5a059]'
                            }`}
                        onClick={() => setActiveTab('spells')}
                    >
                        Spells
                    </button>
                </div>

                {activeTab === 'overview' && (
                    <>
                        {/* Main Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            <FantasyCard glowOnHover={false} className="p-4 text-center flex flex-col justify-between">
                                <div className="font-cinzel-decorative text-xs font-semibold text-[#d1cdb8]/70 tracking-widest uppercase">
                                    Armor Class
                                </div>
                                <div className="text-3xl sm:text-4xl font-bold font-fira-sans text-[#c5a059] my-2">
                                    {stats?.armor_class ?? 10}
                                </div>
                                <div className="text-[11px] font-lora text-[#d1cdb8]/50">
                                    Base Defense
                                </div>
                            </FantasyCard>

                            <HPManagementDialog character={character} onUpdate={() => loadCharacter(characterId)}>
                                <div className="cursor-pointer">
                                    <FantasyCard glowOnHover={true} className="p-4 text-center flex flex-col justify-between group">
                                        <div className="font-cinzel-decorative text-xs font-semibold text-[#d1cdb8]/70 tracking-widest uppercase group-hover:text-[#c5a059] transition-colors">
                                            Hit Points
                                        </div>
                                        <div className="text-3xl sm:text-4xl font-bold font-fira-sans text-emerald-400 my-2 flex items-center justify-center gap-2">
                                            <span>{stats?.hit_points ?? 0}</span>
                                            <span className="text-lg text-[#d1cdb8]/40">/</span>
                                            <span className="text-2xl text-emerald-500/80">{stats?.max_hit_points ?? 0}</span>
                                        </div>
                                        {stats?.temporary_hit_points ? (
                                            <div className="text-xs font-bold font-fira-sans text-amber-300">
                                                +{stats.temporary_hit_points} Temp HP
                                            </div>
                                        ) : (
                                            <div className="text-[11px] font-lora text-[#d1cdb8]/50">
                                                Max HP: {stats?.max_hit_points ?? 0}
                                            </div>
                                        )}
                                    </FantasyCard>
                                </div>
                            </HPManagementDialog>

                            <FantasyCard glowOnHover={false} className="p-4 text-center flex flex-col justify-between">
                                <div className="font-cinzel-decorative text-xs font-semibold text-[#d1cdb8]/70 tracking-widest uppercase">
                                    Initiative
                                </div>
                                <div className="text-3xl sm:text-4xl font-bold font-fira-sans text-[#c5a059] my-2">
                                    {formatModifier(stats?.initiative ?? 0)}
                                </div>
                                <div className="text-[11px] font-lora text-[#d1cdb8]/50">
                                    Dexterity Mod
                                </div>
                            </FantasyCard>

                            <FantasyCard glowOnHover={false} className="p-4 text-center flex flex-col justify-between">
                                <div className="font-cinzel-decorative text-xs font-semibold text-[#d1cdb8]/70 tracking-widest uppercase">
                                    Speed
                                </div>
                                <div className="text-3xl sm:text-4xl font-bold font-fira-sans text-[#c5a059] my-2">
                                    {stats?.speed ?? 30} <span className="text-sm font-normal font-lora text-[#d1cdb8]/70">ft.</span>
                                </div>
                                <div className="text-[11px] font-lora text-[#d1cdb8]/50">
                                    Combat Move
                                </div>
                            </FantasyCard>

                            <FantasyCard glowOnHover={false} className="p-4 text-center col-span-2 md:col-span-4 lg:col-span-1 flex flex-col justify-between">
                                <div className="font-cinzel-decorative text-xs font-semibold text-[#d1cdb8]/70 tracking-widest uppercase">
                                    Attack
                                </div>
                                <div className="my-2">
                                    {(() => {
                                        const pb = Math.ceil(1 + (character.level / 4));
                                        const strMod = stats?.strength ? getAbilityModifier(stats.strength) : 0;
                                        const dexMod = stats?.dexterity ? getAbilityModifier(stats.dexterity) : 0;

                                        const weapon = character.character_items?.find(i => i.is_equipped && i.equipment_slot === 'main_hand');
                                        let mod = strMod;
                                        let damageDice = "1";

                                        if (weapon) {
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
                                            <div className="flex flex-col items-center">
                                                <div className="text-2xl sm:text-3xl font-bold font-fira-sans text-[#c5a059]">
                                                    {toHit} <span className="text-xs font-lora font-normal text-[#d1cdb8]/70">To Hit</span>
                                                </div>
                                                <div className="text-xs font-lora text-[#d1cdb8] mt-0.5">
                                                    {damageDice} {mod !== 0 && damageMod} Dmg
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="text-[11px] font-lora text-[#c5a059]/80 truncate">
                                    {(() => {
                                        const weapon = character.character_items?.find(i => i.is_equipped && i.equipment_slot === 'main_hand');
                                        return weapon ? weapon.item_details.name : 'Unarmed Strike';
                                    })()}
                                </div>
                            </FantasyCard>
                        </div>

                        {/* Ability Scores */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-cinzel-decorative text-base sm:text-lg font-bold text-[#c5a059] tracking-wider">
                                    Ability Scores
                                </h3>
                                {!isEditingStats ? (
                                    <Button
                                        onClick={handleEditStats}
                                        variant="outline"
                                        size="sm"
                                        className="bg-[#181a21] border border-[#c5a059]/50 text-[#c5a059] hover:bg-[#c5a059]/15 text-xs font-lora"
                                    >
                                        Edit Stats
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleSaveStats}
                                            size="sm"
                                            className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs"
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            onClick={handleCancelEditStats}
                                            variant="outline"
                                            size="sm"
                                            className="bg-[#181a21] border border-[#c5a059]/40 text-[#d1cdb8] text-xs font-lora"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                            </div>
                            {isEditingStats && (
                                <div className="mb-3 p-2.5 bg-[#181a21] border border-[#c5a059]/30 rounded text-xs font-lora text-[#d1cdb8]">
                                    💡 <strong>Note:</strong> These are your final ability scores (including racial bonuses and other modifiers). Changes will directly update these values.
                                </div>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
                                {abilityScores.map((ability) => {
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
                                        <div key={ability.name} className="bg-[#12141a] rounded-sm p-3.5 text-center border border-[#c5a059]/30 shadow-md flex flex-col items-center justify-between">
                                            <div className="font-cinzel-decorative text-xs font-bold text-[#c5a059] tracking-wider mb-1">
                                                {ability.name}
                                            </div>
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
                                                    className="text-2xl font-bold text-center bg-[#181a21] border-[#c5a059]/40 text-[#c5a059] mb-1.5 h-12 font-fira-sans"
                                                />
                                            ) : (
                                                <div className="text-2xl sm:text-3xl font-bold font-fira-sans text-slate-100 mb-1.5">
                                                    {displayScore}
                                                </div>
                                            )}
                                            <div className="text-xs font-bold font-fira-sans px-2.5 py-0.5 rounded-full bg-[#181a21] border border-[#c5a059]/40 text-[#c5a059] shadow-[0_0_8px_rgba(197,160,89,0.15)]">
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
                            <FantasyCard glowOnHover={false} className="p-5 text-slate-100">
                                <h3 className="font-cinzel-decorative text-base font-bold text-[#c5a059] tracking-wider border-b border-[#c5a059]/20 pb-2 mb-4">
                                    Roleplay & Languages
                                </h3>
                                <div className="space-y-4 font-lora">
                                    {character.description && (
                                        <div>
                                            <h4 className="font-cinzel-decorative text-xs font-bold text-[#c5a059] tracking-wider mb-1">Visual Description</h4>
                                            <p className="text-[#d1cdb8]/90 text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">{character.description}</p>
                                        </div>
                                    )}

                                    <div>
                                        <h4 className="font-cinzel-decorative text-xs font-bold text-[#c5a059] tracking-wider mb-1.5">Languages</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {character.proficiencies?.filter(p => p.proficiency_type === 'language').map(p => (
                                                <span key={p.id} className="px-2.5 py-1 bg-[#181a21] border border-[#c5a059]/30 rounded text-xs text-[#d1cdb8]">
                                                    {p.language?.name || "Unknown Language"}
                                                </span>
                                            ))}
                                            {(!character.proficiencies?.some(p => p.proficiency_type === 'language')) && (
                                                <p className="text-[#d1cdb8]/50 italic text-xs">Common</p>
                                            )}
                                        </div>
                                    </div>

                                    {character.bonds && (
                                        <div>
                                            <h4 className="font-cinzel-decorative text-xs font-bold text-[#c5a059] tracking-wider mb-1">Bonds</h4>
                                            <p className="text-[#d1cdb8]/90 text-xs sm:text-sm break-words leading-relaxed">{character.bonds}</p>
                                        </div>
                                    )}

                                    {character.flaws && (
                                        <div>
                                            <h4 className="font-cinzel-decorative text-xs font-bold text-[#c5a059] tracking-wider mb-1">Flaws</h4>
                                            <p className="text-[#d1cdb8]/90 text-xs sm:text-sm break-words leading-relaxed">{character.flaws}</p>
                                        </div>
                                    )}

                                    {character.ideals && (
                                        <div>
                                            <h4 className="font-cinzel-decorative text-xs font-bold text-[#c5a059] tracking-wider mb-1">Ideals</h4>
                                            <p className="text-[#d1cdb8]/90 text-xs sm:text-sm break-words leading-relaxed">{character.ideals}</p>
                                        </div>
                                    )}
                                </div>
                            </FantasyCard>

                            {/* Features & Traits */}
                            <FantasyCard glowOnHover={false} className="p-5 text-slate-100">
                                <h3 className="font-cinzel-decorative text-base font-bold text-[#c5a059] tracking-wider border-b border-[#c5a059]/20 pb-2 mb-4">
                                    Features & Traits
                                </h3>
                                <div className="space-y-4 font-lora">
                                    {character.features && character.features.length > 0 ? (
                                        <div className="space-y-3">
                                            {(() => {
                                                const featureGroups: Record<string, typeof character.features> = {};
                                                character.features.forEach(f => {
                                                    const baseName = f.name.replace(/\s\(\d+\)$/, "");
                                                    if (!featureGroups[baseName]) {
                                                        featureGroups[baseName] = [];
                                                    }
                                                    featureGroups[baseName].push(f);
                                                });

                                                return Object.entries(featureGroups).map(([baseName, group]) => {
                                                    const firstFeature = group[0];
                                                    const isStacked = group.length > 1;

                                                    return (
                                                        <div key={baseName} className="border-b border-[#c5a059]/15 last:border-0 pb-3 last:pb-0">
                                                            <div className="flex justify-between items-baseline mb-1">
                                                                <h4 className="font-cinzel-decorative font-bold text-sm text-[#d1cdb8]">
                                                                    {baseName} {isStacked && <span className="text-xs text-[#c5a059]/70 font-normal ml-2">x{group.length}</span>}
                                                                </h4>
                                                                <span className="text-[10px] px-2 py-0.5 rounded bg-[#181a21] border border-[#c5a059]/30 text-[#c5a059] uppercase tracking-wider">
                                                                    {firstFeature.feature_type === 'racial' ? 'Race' : firstFeature.feature_type}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs sm:text-sm text-[#d1cdb8]/80 leading-relaxed">{firstFeature.description}</p>

                                                            {group.map((f, idx) => (
                                                                f.options && f.options.length > 0 && (
                                                                    <div key={f.id} className="mt-2 pl-2 border-l-2 border-[#c5a059]/30">
                                                                        {isStacked && <div className="text-xs text-[#d1cdb8]/50 mb-1">Selection {idx + 1}</div>}
                                                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                                                            {f.selection && f.selection.length > 0 && (
                                                                                f.selection.map((sel: string, i: number) => (
                                                                                    <span key={i} className="bg-[#181a21] text-[#c5a059] border border-[#c5a059]/40 text-xs px-2 py-0.5 rounded font-lora">
                                                                                        {sel}
                                                                                    </span>
                                                                                ))
                                                                            )}
                                                                        </div>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="mt-1 h-7 text-xs bg-[#181a21] border border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/15"
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
                                        <p className="text-[#d1cdb8]/50 italic text-xs">No features or traits recorded.</p>
                                    )}
                                </div>
                            </FantasyCard>
                        </div>

                        {/* Character Details Card */}
                        <FantasyCard glowOnHover={false} className="p-5 text-slate-100">
                            <h3 className="font-cinzel-decorative text-base font-bold text-[#c5a059] tracking-wider border-b border-[#c5a059]/20 pb-2 mb-4">
                                Character Details
                            </h3>
                            <div className="space-y-4 font-lora">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                    <div>
                                        <h4 className="font-cinzel-decorative text-xs font-bold text-[#c5a059] tracking-wider mb-1">Experience</h4>
                                        <p className="text-sm font-fira-sans text-[#d1cdb8]">{character.experience_points} XP</p>
                                    </div>
                                    <div>
                                        <h4 className="font-cinzel-decorative text-xs font-bold text-[#c5a059] tracking-wider mb-1">Proficiency Bonus</h4>
                                        <p className="text-sm font-fira-sans text-[#c5a059] font-bold">+{Math.ceil(1 + (character.level / 4))}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-cinzel-decorative text-xs font-bold text-[#c5a059] tracking-wider mb-1">Race</h4>
                                        <p className="text-sm text-[#d1cdb8]">{character.race?.name_display || character.race?.name}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-cinzel-decorative text-xs font-bold text-[#c5a059] tracking-wider mb-1">Class</h4>
                                        <p className="text-sm text-[#d1cdb8]">{character.character_class?.name_display || character.character_class?.name}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-cinzel-decorative text-xs font-bold text-[#c5a059] tracking-wider mb-1">Alignment</h4>
                                        <p className="text-sm text-[#d1cdb8]">{character.alignment}</p>
                                    </div>
                                </div>

                                {character.backstory && (
                                    <div className="pt-4 border-t border-[#c5a059]/20">
                                        <h4 className="font-cinzel-decorative text-xs font-bold text-[#c5a059] tracking-wider mb-1.5">Backstory</h4>
                                        <p className="text-[#d1cdb8]/90 text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">{character.backstory}</p>
                                    </div>
                                )}
                            </div>
                        </FantasyCard>
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
                            if (!character.features) return [];
                            const baseName = selectedFeature.name.replace(/\s\(\d+\)$/, "");
                            const siblings = character.features.filter(f =>
                                f.id !== selectedFeature.id &&
                                f.name.replace(/\s\(\d+\)$/, "") === baseName
                            );
                            const excluded: string[] = [];
                            siblings.forEach(s => {
                                if (s.selection) excluded.push(...s.selection);
                            });
                            return excluded;
                        })()}
                    />
                )}
            </main>
        </div>
    );
}
