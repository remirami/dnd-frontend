import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { charactersApi } from "@/lib/api/characters";
import { spellsApi } from "@/lib/api/spells";
import type { Character, CharacterSpell } from "@/lib/types/character";
import { ShortRestDialog } from "./ShortRestDialog";
import { 
    Sparkles, 
    BookOpen, 
    Moon, 
    Coffee, 
    Search, 
    Plus, 
    Minus, 
    Shield, 
    Zap, 
    Check, 
    Flame, 
    Clock, 
    Compass, 
    Eye, 
    Trash2, 
    Layers, 
    Sparkle, 
    Filter,
    ChevronDown,
    ChevronUp
} from "lucide-react";

interface SpellsTabProps {
    character: Character;
    onUpdate: () => void;
}

export function SpellsTab({ character, onUpdate }: SpellsTabProps) {
    // --- State Management ---
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [addingSpellId, setAddingSpellId] = useState<number | null>(null);
    const [selectedSpell, setSelectedSpell] = useState<CharacterSpell | null>(null);
    const [prepStatus, setPrepStatus] = useState<{ limit: number; current: number; remaining: number } | null>(null);
    const [isResting, setIsResting] = useState(false);
    const [isSlotOperating, setIsSlotOperating] = useState(false);

    // Filter Chips: 'all' | 'prepared' | 'rituals' | 'bonus' | 'reactions' | 'concentration'
    const [activeFilter, setActiveFilter] = useState<'all' | 'prepared' | 'rituals' | 'bonus' | 'reactions' | 'concentration'>('all');
    const [schoolFilter, setSchoolFilter] = useState<string>('all');

    // Quick Cast Upcast dialog
    const [castSpellPrompt, setCastSpellPrompt] = useState<CharacterSpell | null>(null);

    // Class Identification
    const classNameLower = (character.character_class?.name || "").toLowerCase();
    const isWarlock = classNameLower === 'warlock' || character.class_levels?.some((cl: any) => cl.class_name?.toLowerCase() === 'warlock');
    const isPreparedCaster = ['cleric', 'druid', 'wizard', 'paladin'].includes(classNameLower);

    // --- Spellcasting Stats Computation (5E Canonical) ---
    const stats = character.stats;

    // Spellcasting ability score modifier
    const { spellcastingAbilityName, spellcastingMod } = useMemo(() => {
        if (["cleric", "druid", "ranger"].includes(classNameLower)) {
            const score = stats?.wisdom ?? 10;
            const mod = stats?.wisdom_modifier ?? Math.floor((score - 10) / 2);
            return { spellcastingAbilityName: "WIS", spellcastingMod: mod };
        }
        if (["bard", "sorcerer", "warlock", "paladin"].includes(classNameLower)) {
            const score = stats?.charisma ?? 10;
            const mod = stats?.charisma_modifier ?? Math.floor((score - 10) / 2);
            return { spellcastingAbilityName: "CHA", spellcastingMod: mod };
        }
        // Default: Wizard, Artificer, Arcane Trickster, Eldritch Knight
        const score = stats?.intelligence ?? 10;
        const mod = stats?.intelligence_modifier ?? Math.floor((score - 10) / 2);
        return { spellcastingAbilityName: "INT", spellcastingMod: mod };
    }, [classNameLower, stats]);

    const proficiencyBonus = character.proficiency_bonus ?? Math.floor((character.level - 1) / 4) + 2;
    const spellSaveDc = stats?.spell_save_dc ?? (8 + proficiencyBonus + spellcastingMod);
    const spellAttackBonus = stats?.spell_attack_bonus ?? (proficiencyBonus + spellcastingMod);

    // Fetch preparation limit if prepared caster
    useEffect(() => {
        if (isPreparedCaster) {
            fetchPrepStatus();
        }
    }, [character.id, character.spells]);

    const fetchPrepStatus = async () => {
        try {
            const response = await charactersApi.getPreparationStatus(character.id);
            setPrepStatus(response.data);
        } catch (error) {
            console.error("Failed to fetch preparation status", error);
        }
    };

    // Search query with debounce
    useEffect(() => {
        const searchSpells = async () => {
            if (!searchTerm.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const className = character.character_class?.name || "";
                const response = await spellsApi.search(searchTerm, { classes: className });
                setSearchResults(response.data.results || response.data || []);
            } catch (error) {
                console.error("Failed to search spells:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(searchSpells, 450);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Handle adding spell
    const handleAddSpell = async (spell: any) => {
        setAddingSpellId(spell.id);

        try {
            if (isPreparedCaster) {
                await charactersApi.prepareSpell(character.id, {
                    spell_id: spell.id,
                    prepare: true
                });
                toast.success(`Prepared ${spell.name}`);
            } else {
                const payload = {
                    spell_id: spell.id,
                    spell_name: spell.name,
                    spell_level: spell.level,
                    school: spell.school,
                    description: spell.description,
                    is_ritual: spell.ritual
                };

                if (classNameLower === 'wizard') {
                    await charactersApi.addToSpellbook(character.id, payload);
                    toast.success(`Added ${spell.name} to Spellbook`);
                } else {
                    await charactersApi.learnSpell(character.id, payload);
                    toast.success(`Learned ${spell.name}`);
                }
            }

            setSearchTerm("");
            setIsSearchOpen(false);
            onUpdate();
        } catch (error: any) {
            console.error("Failed to add spell:", error);
            const msg = error.response?.data?.error || "Failed to add spell";
            toast.error(msg);
        } finally {
            setAddingSpellId(null);
        }
    };

    // Handle prepare toggle
    const handlePrepareToggle = async (spell: CharacterSpell) => {
        try {
            const newStatus = !spell.is_prepared;
            await charactersApi.prepareSpell(character.id, {
                spell_id: spell.id,
                prepare: newStatus
            });
            onUpdate();
            toast.success(newStatus ? `Prepared ${spell.name}` : `Unprepared ${spell.name}`);
        } catch (error: any) {
            console.error("Failed to prepare spell:", error);
            const msg = error.response?.data?.error || "Failed to update prepared status";
            toast.error(msg);
        }
    };

    // Handle removing spell
    const handleRemoveSpell = async (spell: CharacterSpell) => {
        if (!confirm(`Remove ${spell.name} from your spell list?`)) {
            return;
        }

        try {
            await charactersApi.removeSpell(character.id, spell.id);
            onUpdate();
            toast.success(`Removed ${spell.name}`);
        } catch (error: any) {
            console.error("Failed to remove spell:", error);
            toast.error("Failed to remove spell");
        }
    };

    // Handle Long Rest
    const handleLongRest = async () => {
        if (!confirm("Take a Long Rest? This will restore all HP, Hit Dice, and Spell Slots to maximum.")) {
            return;
        }
        setIsResting(true);
        try {
            await charactersApi.longRest(character.id);
            toast.success("Long rest completed! All spell slots replenished.");
            onUpdate();
        } catch (error) {
            console.error("Long rest failed:", error);
            toast.error("Failed to complete long rest");
        } finally {
            setIsResting(false);
        }
    };

    // Handle expending 1 spell slot
    const handleExpendSlot = async (level: number) => {
        if (isSlotOperating) return;
        setIsSlotOperating(true);
        try {
            await charactersApi.expendSpellSlot(character.id, level);
            onUpdate();
            toast.info(`Expended 1 Level ${level} slot.`);
        } catch (error: any) {
            console.error("Failed to expend slot:", error);
            toast.error(error.response?.data?.error || "Failed to expend slot");
        } finally {
            setIsSlotOperating(false);
        }
    };

    // Handle restoring 1 spell slot
    const handleRestoreSlot = async (level: number) => {
        if (isSlotOperating) return;
        setIsSlotOperating(true);
        try {
            await charactersApi.restoreSpellSlot(character.id, level);
            onUpdate();
            toast.success(`Restored 1 Level ${level} slot.`);
        } catch (error: any) {
            console.error("Failed to restore slot:", error);
            toast.error(error.response?.data?.error || "Failed to restore slot");
        } finally {
            setIsSlotOperating(false);
        }
    };

    // Handle casting a spell
    const handleCastSpell = (spell: CharacterSpell) => {
        const spellLevel = spell.level || spell.spell_details?.level || 0;
        if (spellLevel === 0) {
            toast.success(`Cast ${spell.name} (Cantrip — At-Will)`);
            return;
        }

        // Leveled spell: check if slot of base level is available
        const maxBaseSlots = stats?.spell_slots?.[spellLevel.toString()] || 0;
        const usedBaseSlots = stats?.expended_spell_slots?.[spellLevel.toString()] || 0;
        const baseRemaining = maxBaseSlots - usedBaseSlots;

        // Check if higher slots are available for upcasting
        const availableSlotsHigher = Object.entries(stats?.spell_slots || {}).filter(([lvlStr, max]) => {
            const lvl = Number(lvlStr);
            if (lvl < spellLevel) return false;
            const used = stats?.expended_spell_slots?.[lvlStr] || 0;
            return (max - used) > 0;
        });

        if (availableSlotsHigher.length > 1 || (baseRemaining <= 0 && availableSlotsHigher.length > 0)) {
            // Multiple options or only higher slots available -> open upcast selector
            setCastSpellPrompt(spell);
        } else if (baseRemaining > 0) {
            // Direct cast at base level
            handleExpendSlot(spellLevel);
            toast.success(`Cast ${spell.name} using Level ${spellLevel} spell slot.`);
        } else {
            toast.error(`No spell slots of level ${spellLevel} or higher available to cast ${spell.name}.`);
        }
    };

    // --- Spell Slots Calculation ---
    const allSlotLevels = useMemo(() => {
        if (!stats?.spell_slots) return [];
        return Object.keys(stats.spell_slots)
            .map(Number)
            .filter(n => n > 0 && (stats.spell_slots?.[n.toString()] || 0) > 0)
            .sort((a, b) => a - b);
    }, [stats?.spell_slots]);

    // Group character spells by level
    const spellsByLevel = useMemo(() => {
        return (character.spells || []).reduce((acc, spell) => {
            const level = spell.level || spell.spell_details?.level || 0;
            if (!acc[level]) acc[level] = [];
            acc[level].push(spell);
            return acc;
        }, {} as Record<number, CharacterSpell[]>);
    }, [character.spells]);

    // Available schools in grimoire
    const allSchools = useMemo(() => {
        const schools = new Set<string>();
        (character.spells || []).forEach(s => {
            const school = s.spell_details?.school || s.school;
            if (school) schools.add(school);
        });
        return Array.from(schools).sort();
    }, [character.spells]);

    // Counts for filter chips
    const filterCounts = useMemo(() => {
        const spells = character.spells || [];
        return {
            all: spells.length,
            prepared: spells.filter(s => s.is_prepared).length,
            rituals: spells.filter(s => s.is_ritual || s.spell_details?.ritual).length,
            bonus: spells.filter(s => (s.spell_details?.casting_time || "").toLowerCase().includes("bonus")).length,
            reactions: spells.filter(s => (s.spell_details?.casting_time || "").toLowerCase().includes("reaction")).length,
            concentration: spells.filter(s => s.spell_details?.concentration).length,
        };
    }, [character.spells]);

    // Filter spells
    const filterSpell = (spell: CharacterSpell) => {
        // Search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const nameMatch = spell.name.toLowerCase().includes(term);
            const schoolMatch = (spell.spell_details?.school || spell.school || "").toLowerCase().includes(term);
            const descMatch = (spell.description || spell.spell_details?.description || "").toLowerCase().includes(term);
            if (!nameMatch && !schoolMatch && !descMatch) return false;
        }

        // School filter
        if (schoolFilter !== 'all') {
            const sSchool = (spell.spell_details?.school || spell.school || "").toLowerCase();
            if (sSchool !== schoolFilter.toLowerCase()) return false;
        }

        // Chip filter
        if (activeFilter === 'prepared' && !spell.is_prepared) return false;
        if (activeFilter === 'rituals' && !(spell.is_ritual || spell.spell_details?.ritual)) return false;
        if (activeFilter === 'bonus' && !(spell.spell_details?.casting_time || "").toLowerCase().includes("bonus")) return false;
        if (activeFilter === 'reactions' && !(spell.spell_details?.casting_time || "").toLowerCase().includes("reaction")) return false;
        if (activeFilter === 'concentration' && !spell.spell_details?.concentration) return false;

        return true;
    };

    return (
        <div className="space-y-6">
            {/* ========================================================================= */}
            {/* TIER 1: CASTER CREST & REST DECK BANNER                                   */}
            {/* ========================================================================= */}
            <div className="bg-[#12141a] border border-[#c5a059]/30 rounded-sm shadow-md overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c5a059]/15 bg-gradient-to-r from-[#181a21] via-[#12141a] to-[#181a21]">
                    {/* Left: Title & Spellcasting Stats */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                        <div className="flex items-center gap-2.5">
                            <span className="p-2 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                                <BookOpen className="w-5 h-5 text-purple-300" />
                            </span>
                            <div>
                                <h2 className="font-cinzel-decorative text-xl sm:text-2xl font-bold text-[#c5a059] flex items-center gap-2">
                                    Spellcasting & Grimoire
                                </h2>
                                <p className="font-lora text-xs text-[#d1cdb8]/60 italic">
                                    {character.character_class?.name || "Spellcaster"} • Level {character.level}
                                </p>
                            </div>
                        </div>

                        {/* Stat Pills */}
                        <div className="flex items-center gap-2 flex-wrap text-xs font-fira-sans">
                            {/* Primary Ability Modifier */}
                            <div className="bg-[#181a21] px-3 py-1.5 rounded-sm border border-[#c5a059]/30 flex items-center gap-1.5 shadow-sm">
                                <span className="font-cinzel font-bold text-[#c5a059]">{spellcastingAbilityName}:</span>
                                <span className="font-bold text-white">
                                    {spellcastingMod >= 0 ? `+${spellcastingMod}` : spellcastingMod}
                                </span>
                            </div>

                            {/* Spell Save DC */}
                            <div className="bg-purple-950/60 px-3 py-1.5 rounded-sm border border-purple-500/40 flex items-center gap-1.5 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.2)]">
                                <Shield className="w-3.5 h-3.5 text-purple-400" />
                                <span className="font-cinzel text-purple-300">Save DC:</span>
                                <span className="font-bold text-white">{spellSaveDc}</span>
                            </div>

                            {/* Spell Attack Bonus */}
                            <div className="bg-[#181a21] px-3 py-1.5 rounded-sm border border-[#c5a059]/30 flex items-center gap-1.5 shadow-sm">
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                <span className="font-cinzel text-[#c5a059]/80">Attack:</span>
                                <span className="font-bold text-white">
                                    {spellAttackBonus >= 0 ? `+${spellAttackBonus}` : spellAttackBonus}
                                </span>
                            </div>

                            {/* Prepared Counter (if prepared caster) */}
                            {isPreparedCaster && prepStatus && (
                                <div className="bg-[#181a21] px-3 py-1.5 rounded-sm border border-[#c5a059]/40 flex items-center gap-1.5 shadow-sm">
                                    <span className="font-cinzel text-[#d1cdb8]/70">Prepared:</span>
                                    <span className={`font-bold ${prepStatus.remaining === 0 ? 'text-green-400' : 'text-[#c5a059]'}`}>
                                        {prepStatus.current}
                                    </span>
                                    <span className="text-[#c5a059]/40">/</span>
                                    <span className="text-[#d1cdb8]/80">{prepStatus.limit}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Quick Rest Shortcuts */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <ShortRestDialog character={character} onUpdate={onUpdate}>
                            <Button 
                                size="sm" 
                                variant="outline"
                                className="bg-[#181a21] border-[#c5a059]/40 hover:bg-[#c5a059]/15 text-[#c5a059] font-cinzel text-xs h-8 px-3 rounded-sm shadow-sm cursor-pointer flex items-center gap-1.5"
                            >
                                <Coffee className="w-3.5 h-3.5 text-[#c5a059]" />
                                <span>Short Rest</span>
                            </Button>
                        </ShortRestDialog>

                        <Button 
                            size="sm" 
                            variant="outline"
                            onClick={handleLongRest}
                            disabled={isResting}
                            className="bg-[#181a21] border-[#c5a059]/40 hover:bg-[#c5a059]/15 text-[#c5a059] font-cinzel text-xs h-8 px-3 rounded-sm shadow-sm cursor-pointer flex items-center gap-1.5"
                        >
                            <Moon className="w-3.5 h-3.5 text-amber-300" />
                            <span>Long Rest</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* TIER 2: INTERACTIVE VISUAL SPELL SLOT MATRIX (DASHBOARD)                   */}
            {/* ========================================================================= */}
            <div className="bg-[#12141a] border border-[#c5a059]/30 rounded-sm shadow-md p-4 sm:p-5">
                <div className="flex items-center justify-between border-b border-[#c5a059]/20 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#c5a059]" />
                        <h3 className="font-cinzel-decorative text-sm sm:text-base font-bold text-[#c5a059] tracking-wider uppercase">
                            Spell Slot Reservoir
                        </h3>
                    </div>
                    <span className="text-[11px] font-lora italic text-[#d1cdb8]/60 hidden sm:inline">
                        Click pips or use steppers to expend/restore spell slots
                    </span>
                </div>

                {allSlotLevels.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {allSlotLevels.map((lvl) => {
                            const maxSlots = stats?.spell_slots?.[lvl.toString()] || 0;
                            const usedSlots = stats?.expended_spell_slots?.[lvl.toString()] || 0;
                            const remaining = Math.max(0, maxSlots - usedSlots);
                            const isExhausted = remaining === 0;
                            const isFull = remaining === maxSlots;
                            const isPactSlot = isWarlock;

                            return (
                                <div
                                    key={lvl}
                                    className={`p-3 rounded-sm border transition-all duration-200 flex flex-col justify-between ${
                                        isExhausted
                                            ? 'bg-[#101217] border-slate-800/80 opacity-70'
                                            : isPactSlot
                                            ? 'bg-[#161220] border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                                            : 'bg-[#181a21] border-[#c5a059]/30 shadow-sm hover:border-[#c5a059]/60'
                                    }`}
                                >
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`font-cinzel text-xs font-bold uppercase tracking-wider ${
                                            isPactSlot ? 'text-purple-300' : 'text-[#c5a059]'
                                        }`}>
                                            {isPactSlot ? `Pact Magic Lvl ${lvl}` : `Level ${lvl}`}
                                        </span>
                                        <span className={`text-[10px] font-fira-sans font-bold px-1.5 py-0.5 rounded-sm ${
                                            isExhausted
                                                ? 'bg-rose-950/70 text-rose-300 border border-rose-800/50'
                                                : isFull
                                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50'
                                                : 'bg-[#0c0d12] text-amber-300 border border-[#c5a059]/40'
                                        }`}>
                                            {remaining} / {maxSlots}
                                        </span>
                                    </div>

                                    {/* Slot Pips / Crystals Display */}
                                    <div className="py-2.5 flex items-center justify-center gap-2 flex-wrap min-h-[36px] bg-[#0c0d12]/60 rounded-sm border border-[#c5a059]/10 px-2 my-1">
                                        {Array.from({ length: maxSlots }).map((_, i) => {
                                            const isAvailable = i < remaining;
                                            return (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    disabled={isSlotOperating}
                                                    onClick={() => {
                                                        if (isAvailable) {
                                                            handleExpendSlot(lvl);
                                                        } else {
                                                            handleRestoreSlot(lvl);
                                                        }
                                                    }}
                                                    title={isAvailable ? `Click to expend Level ${lvl} slot` : `Click to restore Level ${lvl} slot`}
                                                    className={`w-4 h-4 rounded-full border transition-all duration-150 cursor-pointer ${
                                                        isAvailable
                                                            ? isPactSlot
                                                                ? 'bg-purple-500 border-purple-300 hover:bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.7)] hover:scale-115 active:scale-95'
                                                                : 'bg-[#c5a059] border-[#e0bc75] hover:bg-[#d6b16a] shadow-[0_0_8px_rgba(197,160,89,0.7)] hover:scale-115 active:scale-95'
                                                            : 'bg-[#0c0d12] border-[#c5a059]/30 hover:border-[#c5a059]/80 hover:scale-110 active:scale-95'
                                                    }`}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Stepper Controls */}
                                    <div className="flex items-center justify-between gap-1.5 mt-2 pt-2 border-t border-[#c5a059]/15">
                                        <button
                                            type="button"
                                            onClick={() => handleExpendSlot(lvl)}
                                            disabled={isExhausted || isSlotOperating}
                                            title="Expend 1 slot (-)"
                                            className="flex-1 py-1 px-2 rounded-sm bg-[#12141a] hover:bg-[#1f222d] border border-[#c5a059]/30 hover:border-[#c5a059] text-xs font-bold text-[#c5a059] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-colors"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRestoreSlot(lvl)}
                                            disabled={isFull || isSlotOperating}
                                            title="Restore 1 slot (+)"
                                            className="flex-1 py-1 px-2 rounded-sm bg-[#12141a] hover:bg-[#1f222d] border border-[#c5a059]/30 hover:border-[#c5a059] text-xs font-bold text-[#c5a059] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-6 text-center bg-[#0c0d12]/60 rounded-sm border border-dashed border-[#c5a059]/20">
                        <p className="font-cinzel text-xs text-[#c5a059]/70 uppercase tracking-wider">
                            No leveled spell slots configured
                        </p>
                        <p className="font-lora text-xs text-[#d1cdb8]/50 mt-1 italic">
                            Cantrips and innate spells can still be cast at-will below.
                        </p>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* TIER 3: GRIMOIRE SEARCH, FILTERS & WORKSPACE                               */}
            {/* ========================================================================= */}
            <div className="space-y-4">
                {/* Search & Actions Bar */}
                <div className="bg-[#12141a] border border-[#c5a059]/30 rounded-sm p-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 text-[#c5a059]/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Input
                            placeholder="Search grimoire spells..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-[#181a21] border-[#c5a059]/40 text-[#d1cdb8] placeholder:text-[#d1cdb8]/40 focus:border-[#c5a059] h-9 text-xs rounded-sm"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#d1cdb8]/50 hover:text-white cursor-pointer"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Filter Dropdown & Add Spell Button */}
                    <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
                        {allSchools.length > 0 && (
                            <select
                                value={schoolFilter}
                                onChange={(e) => setSchoolFilter(e.target.value)}
                                className="bg-[#181a21] border border-[#c5a059]/40 text-xs text-[#c5a059] rounded-sm px-2.5 py-1.5 focus:border-[#c5a059] focus:outline-none cursor-pointer h-9 font-cinzel"
                            >
                                <option value="all">All Schools</option>
                                {allSchools.map(school => (
                                    <option key={school} value={school}>{school}</option>
                                ))}
                            </select>
                        )}

                        <Button
                            size="sm"
                            onClick={() => setIsSearchOpen(prev => !prev)}
                            className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-cinzel font-bold text-xs h-9 px-3.5 rounded-sm shadow-sm cursor-pointer flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{isSearchOpen ? "Close Add Drawer" : "Learn / Add Spell"}</span>
                        </Button>
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                    <button
                        type="button"
                        onClick={() => setActiveFilter('all')}
                        className={`px-3 py-1.5 rounded-sm font-cinzel font-bold transition-all cursor-pointer border flex items-center gap-1.5 flex-shrink-0 ${
                            activeFilter === 'all'
                                ? 'bg-[#c5a059] text-[#0c0d12] border-[#c5a059] shadow-sm'
                                : 'bg-[#181a21] border-[#c5a059]/25 text-[#d1cdb8]/80 hover:text-white hover:border-[#c5a059]/60'
                        }`}
                    >
                        <span>All Spells</span>
                        <span className="text-[10px] opacity-75 font-fira-sans">({filterCounts.all})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveFilter('prepared')}
                        className={`px-3 py-1.5 rounded-sm font-cinzel font-bold transition-all cursor-pointer border flex items-center gap-1.5 flex-shrink-0 ${
                            activeFilter === 'prepared'
                                ? 'bg-[#c5a059] text-[#0c0d12] border-[#c5a059] shadow-sm'
                                : 'bg-[#181a21] border-[#c5a059]/25 text-[#d1cdb8]/80 hover:text-white hover:border-[#c5a059]/60'
                        }`}
                    >
                        <span>⭐ Prepared</span>
                        <span className="text-[10px] opacity-75 font-fira-sans">({filterCounts.prepared})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveFilter('rituals')}
                        className={`px-3 py-1.5 rounded-sm font-cinzel font-bold transition-all cursor-pointer border flex items-center gap-1.5 flex-shrink-0 ${
                            activeFilter === 'rituals'
                                ? 'bg-[#c5a059] text-[#0c0d12] border-[#c5a059] shadow-sm'
                                : 'bg-[#181a21] border-[#c5a059]/25 text-[#d1cdb8]/80 hover:text-white hover:border-[#c5a059]/60'
                        }`}
                    >
                        <span>📜 Rituals</span>
                        <span className="text-[10px] opacity-75 font-fira-sans">({filterCounts.rituals})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveFilter('bonus')}
                        className={`px-3 py-1.5 rounded-sm font-cinzel font-bold transition-all cursor-pointer border flex items-center gap-1.5 flex-shrink-0 ${
                            activeFilter === 'bonus'
                                ? 'bg-[#c5a059] text-[#0c0d12] border-[#c5a059] shadow-sm'
                                : 'bg-[#181a21] border-[#c5a059]/25 text-[#d1cdb8]/80 hover:text-white hover:border-[#c5a059]/60'
                        }`}
                    >
                        <span>⚡ Bonus Action</span>
                        <span className="text-[10px] opacity-75 font-fira-sans">({filterCounts.bonus})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveFilter('reactions')}
                        className={`px-3 py-1.5 rounded-sm font-cinzel font-bold transition-all cursor-pointer border flex items-center gap-1.5 flex-shrink-0 ${
                            activeFilter === 'reactions'
                                ? 'bg-[#c5a059] text-[#0c0d12] border-[#c5a059] shadow-sm'
                                : 'bg-[#181a21] border-[#c5a059]/25 text-[#d1cdb8]/80 hover:text-white hover:border-[#c5a059]/60'
                        }`}
                    >
                        <span>🛡️ Reactions</span>
                        <span className="text-[10px] opacity-75 font-fira-sans">({filterCounts.reactions})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveFilter('concentration')}
                        className={`px-3 py-1.5 rounded-sm font-cinzel font-bold transition-all cursor-pointer border flex items-center gap-1.5 flex-shrink-0 ${
                            activeFilter === 'concentration'
                                ? 'bg-[#c5a059] text-[#0c0d12] border-[#c5a059] shadow-sm'
                                : 'bg-[#181a21] border-[#c5a059]/25 text-[#d1cdb8]/80 hover:text-white hover:border-[#c5a059]/60'
                        }`}
                    >
                        <span>Concentration</span>
                        <span className="text-[10px] opacity-75 font-fira-sans">({filterCounts.concentration})</span>
                    </button>
                </div>

                {/* Collapsible Add Spell Drawer */}
                {isSearchOpen && (
                    <Card className="bg-[#12141a] border border-[#c5a059]/40 rounded-sm shadow-md animate-in fade-in duration-200">
                        <CardHeader className="pb-2 border-b border-[#c5a059]/15">
                            <CardTitle className="font-cinzel-decorative text-base font-bold text-[#c5a059] flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-[#c5a059]" />
                                <span>Learn / Add Spell from SRD Compendium</span>
                            </CardTitle>
                            <CardDescription className="font-lora text-xs text-[#d1cdb8]/70">
                                Type a spell name to search the compendium for {character.character_class?.name || "your class"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-3">
                            <div className="relative">
                                <Input
                                    placeholder="Type spell name to search compendium..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-[#181a21] border-[#c5a059]/40 text-[#d1cdb8] placeholder:text-[#d1cdb8]/40 focus:border-[#c5a059] rounded-sm"
                                />
                                {searchResults.length > 0 && (
                                    <div className="mt-2 bg-[#181a21] border border-[#c5a059]/50 rounded-sm shadow-2xl max-h-64 overflow-y-auto divide-y divide-[#c5a059]/10">
                                        {searchResults.map((spell) => (
                                            <div
                                                key={spell.id}
                                                className="p-2.5 hover:bg-[#202430] cursor-pointer flex justify-between items-center transition-colors"
                                                onClick={() => handleAddSpell(spell)}
                                            >
                                                <div>
                                                    <div className="font-cinzel-decorative font-semibold text-white text-sm">
                                                        {spell.name}
                                                    </div>
                                                    <div className="text-xs font-lora text-[#c5a059]/80">
                                                        {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`} • {spell.school}
                                                    </div>
                                                </div>
                                                {addingSpellId === spell.id ? (
                                                    <span className="text-xs font-fira-sans text-[#e0bc75]">Adding...</span>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        className="h-7 text-xs bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-cinzel font-bold px-3 rounded-sm"
                                                    >
                                                        + Add
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {searchTerm && searchResults.length === 0 && !isSearching && (
                                    <div className="mt-2 bg-[#181a21] border border-[#c5a059]/30 rounded-sm p-3 text-[#d1cdb8]/70 text-xs font-lora italic text-center">
                                        No matching compendium spells found for &quot;{searchTerm}&quot;.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ========================================================================= */}
                {/* SPELLS LIST GROUPED BY LEVEL                                              */}
                {/* ========================================================================= */}
                <div className="space-y-6">
                    {Object.keys(spellsByLevel).sort((a, b) => Number(a) - Number(b)).map((levelStr) => {
                        const level = Number(levelStr);
                        const allLevelSpells = spellsByLevel[level] || [];
                        const filteredSpells = allLevelSpells.filter(filterSpell);

                        // If filter is active and no spells match this level, skip level section
                        if (filteredSpells.length === 0 && (searchTerm || activeFilter !== 'all' || schoolFilter !== 'all')) {
                            return null;
                        }

                        // Slot info for this level
                        const maxSlots = stats?.spell_slots?.[level.toString()] || 0;
                        const usedSlots = stats?.expended_spell_slots?.[level.toString()] || 0;
                        const remaining = Math.max(0, maxSlots - usedSlots);

                        return (
                            <div key={level} className="space-y-3">
                                {/* Level Header with Slot Status Pill */}
                                <div className="flex justify-between items-center border-b border-[#c5a059]/25 pb-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-cinzel-decorative text-lg sm:text-xl font-bold text-[#c5a059]">
                                            {level === 0 ? "Cantrips (At-Will)" : `Level ${level} Spells`}
                                        </h3>
                                        <span className="text-xs font-lora text-[#d1cdb8]/60 italic">
                                            ({allLevelSpells.length} {allLevelSpells.length === 1 ? 'spell' : 'spells'})
                                        </span>
                                    </div>

                                    {/* Slot counter indicator for leveled tiers */}
                                    {level > 0 && maxSlots > 0 && (
                                        <div className="flex items-center gap-2 bg-[#181a21] px-3 py-1 rounded-sm border border-[#c5a059]/30 text-xs font-fira-sans">
                                            <span className="font-cinzel text-[11px] text-[#c5a059]/80 uppercase tracking-widest font-bold">
                                                Slots:
                                            </span>
                                            <span className={`font-bold ${remaining === 0 ? 'text-rose-400' : 'text-amber-300'}`}>
                                                {remaining} / {maxSlots}
                                            </span>
                                            {/* Micro-stepper */}
                                            <div className="flex items-center gap-1 ml-1 border-l border-[#c5a059]/20 pl-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleExpendSlot(level)}
                                                    disabled={remaining === 0 || isSlotOperating}
                                                    title="Expend slot"
                                                    className="w-4 h-4 rounded bg-[#12141a] hover:bg-[#202430] border border-[#c5a059]/30 text-[10px] text-[#c5a059] flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRestoreSlot(level)}
                                                    disabled={remaining === maxSlots || isSlotOperating}
                                                    title="Restore slot"
                                                    className="w-4 h-4 rounded bg-[#12141a] hover:bg-[#202430] border border-[#c5a059]/30 text-[10px] text-[#c5a059] flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Spells Grid / Cards */}
                                <div className="grid gap-2.5">
                                    {filteredSpells.map((spell) => {
                                        const castingTime = spell.spell_details?.casting_time || "1 Action";
                                        const range = spell.spell_details?.range || "Touch";
                                        const isReaction = castingTime.toLowerCase().includes("reaction");
                                        const isBonus = castingTime.toLowerCase().includes("bonus");
                                        const isRitual = spell.is_ritual || spell.spell_details?.ritual;
                                        const isConc = spell.spell_details?.concentration;

                                        return (
                                            <Card
                                                key={spell.id}
                                                onClick={() => setSelectedSpell(spell)}
                                                className={`transition-all duration-200 cursor-pointer rounded-sm border ${
                                                    spell.is_prepared
                                                        ? 'bg-[#181a21] border-[#c5a059]/60 hover:border-[#c5a059] shadow-[0_0_12px_rgba(197,160,89,0.15)]'
                                                        : 'bg-[#12141a] border-[#c5a059]/20 hover:border-[#c5a059]/50'
                                                }`}
                                            >
                                                <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    {/* Left: Info */}
                                                    <div className="flex-1 pr-2 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <h4 className="font-cinzel-decorative font-bold text-white text-base">
                                                                {spell.name}
                                                            </h4>

                                                            {/* Micro-Chips */}
                                                            {spell.is_prepared && (
                                                                <span className="text-[10px] font-cinzel font-bold bg-[#c5a059] text-[#0c0d12] px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-sm flex items-center gap-1">
                                                                    <Check className="w-2.5 h-2.5" />
                                                                    <span>Prepared</span>
                                                                </span>
                                                            )}
                                                            {isRitual && (
                                                                <span className="text-[10px] font-cinzel bg-[#0c0d12] border border-[#c5a059]/40 text-[#c5a059] px-1.5 py-0.5 rounded-sm">
                                                                    Ritual
                                                                </span>
                                                            )}
                                                            {isConc && (
                                                                <span className="text-[10px] font-cinzel bg-amber-950/60 border border-amber-600/40 text-amber-300 px-1.5 py-0.5 rounded-sm">
                                                                    Conc
                                                                </span>
                                                            )}
                                                            {isReaction && (
                                                                <span className="text-[10px] font-cinzel bg-blue-950/60 border border-blue-500/40 text-blue-300 px-1.5 py-0.5 rounded-sm">
                                                                    Reaction
                                                                </span>
                                                            )}
                                                            {isBonus && (
                                                                <span className="text-[10px] font-cinzel bg-purple-950/60 border border-purple-500/40 text-purple-300 px-1.5 py-0.5 rounded-sm">
                                                                    Bonus Action
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Metadata row */}
                                                        <div className="text-xs font-lora text-[#c5a059]/80 flex items-center gap-2 flex-wrap">
                                                            <span>{spell.spell_details?.school || spell.school || "Magic"}</span>
                                                            <span>•</span>
                                                            <span>{castingTime}</span>
                                                            <span>•</span>
                                                            <span>{range}</span>
                                                            {spell.spell_details?.components && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="font-fira-sans text-[#d1cdb8]/60">[{spell.spell_details.components}]</span>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Snippet */}
                                                        <p className="text-xs font-lora text-[#d1cdb8]/70 mt-1 line-clamp-1">
                                                            {spell.description || spell.spell_details?.description || "No description provided."}
                                                        </p>
                                                    </div>

                                                    {/* Right: Actions */}
                                                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                                                        {/* Quick Cast Button */}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCastSpell(spell);
                                                            }}
                                                            className="border-[#c5a059]/50 bg-[#181a21] hover:bg-[#c5a059] hover:text-[#0c0d12] text-[#c5a059] font-cinzel font-bold text-xs h-8 px-3 rounded-sm shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                                                        >
                                                            <Zap className="w-3.5 h-3.5" />
                                                            <span>Cast</span>
                                                        </Button>

                                                        {/* Prepare Toggle (for prepared casters on leveled spells) */}
                                                        {level > 0 && isPreparedCaster && (
                                                            <Button
                                                                size="sm"
                                                                variant={spell.is_prepared ? "outline" : "secondary"}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePrepareToggle(spell);
                                                                }}
                                                                className={spell.is_prepared
                                                                    ? "border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/15 font-cinzel text-xs h-8 rounded-sm cursor-pointer"
                                                                    : "bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-cinzel font-bold text-xs h-8 rounded-sm shadow-sm cursor-pointer"
                                                                }
                                                            >
                                                                {spell.is_prepared ? "Unprepare" : "Prepare"}
                                                            </Button>
                                                        )}

                                                        {/* Delete / Remove Spell */}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveSpell(spell);
                                                            }}
                                                            className="text-red-400 hover:text-red-200 hover:bg-red-950/40 h-8 w-8 p-0 rounded-sm cursor-pointer"
                                                            title="Remove spell"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {(!character.spells || character.spells.length === 0) && (
                        <div className="text-center py-12 font-cinzel text-sm text-[#c5a059]/70 border border-dashed border-[#c5a059]/30 rounded-sm bg-[#12141a]">
                            <BookOpen className="w-8 h-8 text-[#c5a059]/40 mx-auto mb-2" />
                            <p>No spells known or prepared in your grimoire.</p>
                            <Button
                                size="sm"
                                onClick={() => setIsSearchOpen(true)}
                                className="mt-3 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-cinzel font-bold text-xs rounded-sm"
                            >
                                + Learn First Spell
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* SPELL DETAIL MODAL                                                        */}
            {/* ========================================================================= */}
            <Dialog open={!!selectedSpell} onOpenChange={(open) => !open && setSelectedSpell(null)}>
                <DialogContent className="bg-[#12141a] border border-[#c5a059] max-w-2xl rounded-sm shadow-2xl text-[#d1cdb8]">
                    {selectedSpell && (
                        <>
                            <DialogHeader className="border-b border-[#c5a059]/20 pb-3">
                                <DialogTitle className="font-cinzel-decorative text-xl sm:text-2xl font-bold text-[#c5a059] flex items-center gap-2">
                                    {selectedSpell.name}
                                    {selectedSpell.is_ritual && (
                                        <span className="text-[10px] font-cinzel bg-[#0c0d12] border border-[#c5a059]/30 text-[#c5a059] px-2 py-0.5 rounded-sm">
                                            Ritual
                                        </span>
                                    )}
                                    {selectedSpell.is_prepared && (
                                        <span className="text-[10px] font-cinzel font-bold bg-[#c5a059] text-[#0c0d12] px-2 py-0.5 rounded-sm uppercase tracking-wider">
                                            Prepared
                                        </span>
                                    )}
                                </DialogTitle>
                                <DialogDescription className="font-cinzel text-xs uppercase tracking-wider text-[#c5a059]/80">
                                    Level {selectedSpell.level || 0} {selectedSpell.spell_details?.school || selectedSpell.school || "Magic"}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 mt-3">
                                {/* Description */}
                                <div>
                                    <h4 className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-2">Description</h4>
                                    <p className="font-lora text-sm text-[#d1cdb8] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto pr-1">
                                        {selectedSpell.description || selectedSpell.spell_details?.description || "No description available."}
                                    </p>
                                </div>

                                {/* Spell Details Grid */}
                                <div className="grid grid-cols-2 gap-4 border-t border-[#c5a059]/20 pt-3">
                                    <div>
                                        <h4 className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-2">Casting</h4>
                                        <div className="space-y-1.5 text-xs font-lora">
                                            <div className="flex justify-between">
                                                <span className="text-[#d1cdb8]/70">Casting Time:</span>
                                                <span className="font-fira-sans font-bold text-[#c5a059]">{selectedSpell.spell_details?.casting_time || "1 Action"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#d1cdb8]/70">Range:</span>
                                                <span className="font-fira-sans font-bold text-[#c5a059]">{selectedSpell.spell_details?.range || "Touch"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#d1cdb8]/70">Duration:</span>
                                                <span className="font-fira-sans font-bold text-[#c5a059]">{selectedSpell.spell_details?.duration || "Instantaneous"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#d1cdb8]/70">Components:</span>
                                                <span className="font-fira-sans font-bold text-[#c5a059]">{selectedSpell.spell_details?.components || "V, S"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-2">Properties</h4>
                                        <div className="space-y-1.5 text-xs font-lora">
                                            <div className="flex justify-between">
                                                <span className="text-[#d1cdb8]/70">School:</span>
                                                <span className="font-lora text-white">{selectedSpell.spell_details?.school || selectedSpell.school || "—"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#d1cdb8]/70">Level:</span>
                                                <span className="font-fira-sans font-bold text-[#c5a059]">{selectedSpell.level === 0 ? "Cantrip" : `Level ${selectedSpell.level}`}</span>
                                            </div>
                                            {selectedSpell.is_ritual && (
                                                <div className="flex justify-between">
                                                    <span className="text-[#d1cdb8]/70">Ritual:</span>
                                                    <span className="font-fira-sans font-bold text-[#e0bc75]">Yes</span>
                                                </div>
                                            )}
                                            {selectedSpell.spell_details?.concentration && (
                                                <div className="flex justify-between">
                                                    <span className="text-[#d1cdb8]/70">Concentration:</span>
                                                    <span className="font-fira-sans font-bold text-[#e0bc75]">Required</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Actions */}
                                <div className="border-t border-[#c5a059]/20 pt-3 flex justify-end gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            handleCastSpell(selectedSpell);
                                            setSelectedSpell(null);
                                        }}
                                        className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-cinzel font-bold text-xs h-8 px-4 rounded-sm"
                                    >
                                        <Zap className="w-3.5 h-3.5 mr-1" />
                                        <span>Cast Spell</span>
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* UPCAST / SELECT SLOT LEVEL MODAL                                          */}
            {/* ========================================================================= */}
            <Dialog open={!!castSpellPrompt} onOpenChange={(open) => !open && setCastSpellPrompt(null)}>
                <DialogContent className="bg-[#12141a] border border-[#c5a059] max-w-md rounded-sm shadow-2xl text-[#d1cdb8]">
                    {castSpellPrompt && (
                        <>
                            <DialogHeader className="border-b border-[#c5a059]/20 pb-2">
                                <DialogTitle className="font-cinzel-decorative text-lg font-bold text-[#c5a059]">
                                    Cast {castSpellPrompt.name}
                                </DialogTitle>
                                <DialogDescription className="font-lora text-xs text-[#d1cdb8]/70">
                                    Base Level {castSpellPrompt.level}. Select which spell slot to expend:
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-2 py-3">
                                {allSlotLevels
                                    .filter(lvl => lvl >= (castSpellPrompt.level || 1))
                                    .map(lvl => {
                                        const maxSlots = stats?.spell_slots?.[lvl.toString()] || 0;
                                        const usedSlots = stats?.expended_spell_slots?.[lvl.toString()] || 0;
                                        const remaining = Math.max(0, maxSlots - usedSlots);
                                        const isAvailable = remaining > 0;

                                        return (
                                            <button
                                                key={lvl}
                                                type="button"
                                                disabled={!isAvailable}
                                                onClick={() => {
                                                    handleExpendSlot(lvl);
                                                    setCastSpellPrompt(null);
                                                }}
                                                className={`w-full p-2.5 rounded-sm border flex items-center justify-between text-left transition-colors cursor-pointer ${
                                                    isAvailable
                                                        ? 'bg-[#181a21] border-[#c5a059]/40 hover:border-[#c5a059] hover:bg-[#222533]'
                                                        : 'bg-[#101217] border-slate-800 opacity-40 cursor-not-allowed'
                                                }`}
                                            >
                                                <div>
                                                    <span className="font-cinzel font-bold text-xs text-white">
                                                        Level {lvl} Slot {lvl > (castSpellPrompt.level || 1) && "(Upcast)"}
                                                    </span>
                                                    <p className="text-[11px] font-lora text-[#c5a059]/80">
                                                        {remaining} of {maxSlots} slots remaining
                                                    </p>
                                                </div>
                                                <span className={`text-xs font-fira-sans font-bold px-2 py-1 rounded-sm ${
                                                    isAvailable ? 'bg-[#c5a059] text-[#0c0d12]' : 'bg-slate-800 text-slate-500'
                                                }`}>
                                                    {isAvailable ? "Expend Slot" : "Empty"}
                                                </span>
                                            </button>
                                        );
                                    })}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
