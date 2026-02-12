"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import api from "@/lib/api/client";
import type { CharacterFormData } from "../CharacterCreationWizard";

interface SpellSelectionStepProps {
    formData: CharacterFormData;
    onUpdate: (data: Partial<CharacterFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

interface Spell {
    id: number;
    name: string;
    level: number;
    school: string;
    casting_time: string;
    range: string;
    components: string;
    duration: string;
    concentration: boolean;
    ritual: boolean;
    description: string;
    higher_level?: string;
    recommended?: boolean;
}

interface SpellSelectionData {
    class_name: string;
    cantrips_count: number;
    spells_info: {
        type: string;
        count: number;
        description?: string;
        is_spellbook?: boolean;
        can_prepare_all?: boolean;
    };
    description: string;
    available_cantrips: Spell[];
    available_spells: Spell[];
}

const SCHOOL_COLORS: Record<string, string> = {
    abjuration: "bg-blue-600",
    conjuration: "bg-purple-600",
    divination: "bg-cyan-600",
    enchantment: "bg-pink-600",
    evocation: "bg-red-600",
    illusion: "bg-indigo-600",
    necromancy: "bg-gray-700",
    transmutation: "bg-green-600",
};

export default function SpellSelectionStep({
    formData,
    onUpdate,
    onNext,
    onBack,
}: SpellSelectionStepProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [spellData, setSpellData] = useState<SpellSelectionData | null>(null);

    // Selected spell IDs
    const [selectedCantrips, setSelectedCantrips] = useState<number[]>(formData.cantrip_ids || []);
    const [selectedSpells, setSelectedSpells] = useState<number[]>(formData.spell_ids || []);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [schoolFilter, setSchoolFilter] = useState<string>("all");
    const [showConcentrationOnly, setShowConcentrationOnly] = useState(false);
    const [activeTab, setActiveTab] = useState<"cantrips" | "spells">("cantrips");

    // Expanded spell (for showing full description)
    const [expandedSpell, setExpandedSpell] = useState<number | null>(null);

    useEffect(() => {
        loadSpellOptions();
    }, []);

    const loadSpellOptions = async () => {
        try {
            // Get class name from formData
            const classResponse = await api.get(`/character-classes/${formData.character_class_id}/`);
            const className = classResponse.data.name;

            // Fetch spell options
            const response = await api.get(`/characters/starting_spell_choices/?class_name=${className}&ruleset=${formData.ruleset_version || '2014'}`);
            setSpellData(response.data);

            // If no cantrips, default to spells tab
            if (response.data.cantrips_count === 0) {
                setActiveTab("spells");
            }
        } catch (err: any) {
            console.error("Failed to load spell options:", err);
            setError(err.response?.data?.error || err.message || "Failed to load spell options");
        } finally {
            setLoading(false);
        }
    };

    const filterSpells = (spells: Spell[]) => {
        return spells.filter((spell) => {
            // Search filter
            if (searchTerm && !spell.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            // School filter
            if (schoolFilter !== "all" && spell.school !== schoolFilter) {
                return false;
            }

            // Concentration filter
            if (showConcentrationOnly && !spell.concentration) {
                return false;
            }

            return true;
        });
    };

    const toggleCantripSelection = (spellId: number) => {
        const newSelection = selectedCantrips.includes(spellId)
            ? selectedCantrips.filter(id => id !== spellId)
            : [...selectedCantrips, spellId];
        setSelectedCantrips(newSelection);
        onUpdate({ cantrip_ids: newSelection });
    };

    const toggleSpellSelection = (spellId: number) => {
        const newSelection = selectedSpells.includes(spellId)
            ? selectedSpells.filter(id => id !== spellId)
            : [...selectedSpells, spellId];
        setSelectedSpells(newSelection);
        onUpdate({ spell_ids: newSelection });
    };

    const handleNext = () => {
        // Validate selections
        if (spellData) {
            if (selectedCantrips.length !== spellData.cantrips_count) {
                setError(`Please select exactly ${spellData.cantrips_count} cantrips`);
                return;
            }

            const expectedSpells = spellData.spells_info.count || 0;
            if (expectedSpells > 0 && selectedSpells.length !== expectedSpells) {
                setError(`Please select exactly ${expectedSpells} spells`);
                return;
            }
        }

        onNext();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-white">Loading spell options...</div>
            </div>
        );
    }

    if (error && !spellData) {
        return (
            <div className="space-y-4">
                <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-md">
                    {error}
                </div>
                <Button onClick={onBack} variant="outline">
                    ← Back
                </Button>
            </div>
        );
    }

    if (!spellData) {
        return (
            <div className="space-y-4">
                <p className="text-slate-400">This class does not gain spells at level 1.</p>
                <div className="flex justify-between">
                    <Button onClick={onBack} variant="outline">← Back</Button>
                    <Button onClick={onNext}>Next →</Button>
                </div>
            </div>
        );
    }

    // Check if this is a non-caster class (response contains message or missing rules)
    if ((spellData as any).message || !spellData.spells_info) {
        return (
            <div className="space-y-4">
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 text-center">
                    <h3 className="text-xl font-semibold text-white mb-2">No Spells Required</h3>
                    <p className="text-slate-400 mb-4">
                        {(spellData as any).message || `${spellData.class_name || 'This class'} does not select spells at level 1.`}
                    </p>
                    <p className="text-sm text-slate-500">
                        (If you gain spells from your Race, they are currently handled automatically)
                    </p>
                </div>
                <div className="flex justify-between pt-4">
                    <Button onClick={onBack} variant="outline">← Back</Button>
                    <Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700">Next →</Button>
                </div>
            </div>
        );
    }

    const cantripsToSelect = spellData.cantrips_count;
    const spellsToSelect = spellData.spells_info.count || 0;
    const cantripsSelected = selectedCantrips.length;
    const spellsSelected = selectedSpells.length;

    const cantripsComplete = cantripsSelected === cantripsToSelect;
    const spellsComplete = spellsToSelect === 0 || spellsSelected === spellsToSelect;
    const allComplete = cantripsComplete && spellsComplete;

    const activeSpells = activeTab === "cantrips" ? spellData.available_cantrips : spellData.available_spells;
    const filteredSpells = filterSpells(activeSpells).sort((a, b) => {
        // Recommended first
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return 0; // Keep original order (usually alphabetical)
    });
    const selectedInTab = activeTab === "cantrips" ? selectedCantrips : selectedSpells;
    const toggleSelection = activeTab === "cantrips" ? toggleCantripSelection : toggleSpellSelection;

    return (
        <div className="space-y-6">
            {/* Instructions */}
            <Card className="bg-slate-800 border-slate-700 p-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                    Spell Selection - {spellData.class_name}
                </h3>
                <p className="text-slate-300 text-sm mb-3">{spellData.description}</p>

                {/* Progress */}
                <div className="flex gap-4 text-sm">
                    {cantripsToSelect > 0 && (
                        <div className={`flex items-center gap-2 ${cantripsComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                            <span className="font-semibold">Cantrips:</span>
                            <span>{cantripsSelected} / {cantripsToSelect}</span>
                            {cantripsComplete && <span>✓</span>}
                        </div>
                    )}
                    {spellsToSelect > 0 && (
                        <div className={`flex items-center gap-2 ${spellsComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                            <span className="font-semibold">Spells:</span>
                            <span>{spellsSelected} / {spellsToSelect}</span>
                            {spellsComplete && <span>✓</span>}
                        </div>
                    )}
                </div>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700">
                {cantripsToSelect > 0 && (
                    <button
                        onClick={() => setActiveTab("cantrips")}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === "cantrips"
                            ? "text-white border-b-2 border-blue-500"
                            : "text-slate-400 hover:text-slate-300"
                            }`}
                    >
                        Cantrips ({cantripsSelected}/{cantripsToSelect})
                    </button>
                )}
                {spellsToSelect > 0 && (
                    <button
                        onClick={() => setActiveTab("spells")}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === "spells"
                            ? "text-white border-b-2 border-blue-500"
                            : "text-slate-400 hover:text-slate-300"
                            }`}
                    >
                        1st Level Spells ({spellsSelected}/{spellsToSelect})
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <Input
                    type="text"
                    placeholder="Search spells..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs bg-slate-800 border-slate-700 text-white"
                />

                <select
                    value={schoolFilter}
                    onChange={(e) => setSchoolFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
                >
                    <option value="all">All Schools</option>
                    <option value="abjuration">Abjuration</option>
                    <option value="conjuration">Conjuration</option>
                    <option value="divination">Divination</option>
                    <option value="enchantment">Enchantment</option>
                    <option value="evocation">Evocation</option>
                    <option value="illusion">Illusion</option>
                    <option value="necromancy">Necromancy</option>
                    <option value="transmutation">Transmutation</option>
                </select>

                <button
                    onClick={() => setShowConcentrationOnly(!showConcentrationOnly)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${showConcentrationOnly
                        ? "bg-purple-600 text-white"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                >
                    ⚗️ Concentration Only
                </button>

                {/* Recommended Filter - Always available if recommendations exist */}
                <button
                    onClick={() => {
                        // Toggle logic: if we are filtering by recommended, turn it off.
                        // Wait, I need a state for this. Let's assume I add one or just rely on visual badges.
                        // Let's add a visual toggle for now, effectively a "sort" or "filter".
                        // Use a new state variable or just add it to the filter list.
                    }}
                    className="px-3 py-2 rounded-md text-sm font-medium bg-amber-900/40 text-amber-200 border border-amber-500/50 cursor-default"
                >
                    ⭐ Recommended Spells Highlighted
                </button>
            </div>

            {/* Selected Spells Summary (Persistent across filters) */}
            {(activeTab === "cantrips" ? selectedCantrips.length > 0 : selectedSpells.length > 0) && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                    <div className="text-xs font-semibold text-slate-400 mb-2 flex justify-between items-center">
                        <span>Selected {activeTab === "cantrips" ? "Cantrips" : "Spells"} ({activeTab === "cantrips" ? selectedCantrips.length : selectedSpells.length}/{activeTab === "cantrips" ? cantripsToSelect : spellsToSelect})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(activeTab === "cantrips" ? selectedCantrips : selectedSpells).map(id => {
                            const spell = (activeTab === "cantrips" ? spellData?.available_cantrips : spellData?.available_spells)?.find(s => s.id === id);
                            if (!spell) return null;
                            return (
                                <div
                                    key={id}
                                    className="bg-green-900/30 border border-green-500/50 rounded px-2 py-1 text-sm text-green-100 flex items-center gap-2"
                                >
                                    <span>{spell.name}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSelection(id);
                                        }}
                                        className="hover:bg-green-800/50 rounded-full p-0.5 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Spell Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
                {filteredSpells.map((spell) => {
                    const isSelected = selectedInTab.includes(spell.id);
                    const isExpanded = expandedSpell === spell.id;

                    return (
                        <Card
                            key={spell.id}
                            className={`p-4 cursor-pointer transition-all ${isSelected
                                ? "bg-blue-900/40 border-blue-500"
                                : "bg-slate-800 border-slate-700 hover:border-slate-600"
                                }`}
                            onClick={() => toggleSelection(spell.id)}
                        >
                            <div className="flex items-start justify-between MB-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-white">{spell.name}</h4>
                                        {spell.recommended && (
                                            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/50 flex items-center gap-0.5">
                                                ⭐ Recommended
                                            </span>
                                        )}
                                        {isSelected && <span className="text-green-400">✓</span>}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs px-2 py-0.5 rounded ${SCHOOL_COLORS[spell.school]} text-white`}>
                                            {spell.school.charAt(0).toUpperCase() + spell.school.slice(1)}
                                        </span>
                                        {spell.concentration && (
                                            <span className="text-xs text-purple-400">⚗️ Concentration</span>
                                        )}
                                        {spell.ritual && (
                                            <span className="text-xs text-cyan-400">🎯 Ritual</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs text-slate-400 space-y-1 mb-2">
                                <div>⏱️ {spell.casting_time}</div>
                                <div>📍 {spell.range}</div>
                                <div>⏳ {spell.duration}</div>
                                <div>🔤 {spell.components}</div>
                            </div>

                            <p className="text-sm text-slate-300 line-clamp-3">
                                {spell.description}
                            </p>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedSpell(isExpanded ? null : spell.id);
                                }}
                                className="text-xs text-blue-400 mt-2 hover:text-blue-300"
                            >
                                {isExpanded ? "Show Less" : "Show More"}
                            </button>

                            {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-slate-700 text-sm text-slate-300">
                                    <p className="whitespace-pre-wrap">{spell.description}</p>
                                    {spell.higher_level && (
                                        <div className="mt-2">
                                            <span className="font-semibold text-white">At Higher Levels: </span>
                                            <span>{spell.higher_level}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            {filteredSpells.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                    No spells match your filters.
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-3 rounded-md text-sm">
                    {error}
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t border-slate-700">
                <Button
                    onClick={onBack}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                    ← Back
                </Button>
                <Button
                    onClick={handleNext}
                    disabled={!allComplete}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500"
                >
                    {allComplete ? "Next →" : `Select ${cantripsToSelect - cantripsSelected + spellsToSelect - spellsSelected} More`}
                </Button>
            </div>
        </div>
    );
}
