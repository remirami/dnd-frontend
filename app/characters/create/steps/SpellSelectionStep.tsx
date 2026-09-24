"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dices } from "lucide-react";
import api from "@/lib/api/client";
import type { CharacterFormData } from "../CharacterCreationWizard";

interface SpellSelectionStepProps {
    formData: CharacterFormData;
    onUpdate: (data: Partial<CharacterFormData>) => void;
    onNext: () => void;
    onBack: () => void;
    onRandomizeStep?: () => void;
    isRandomizingStep?: boolean;
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
    onRandomizeStep,
    isRandomizingStep,
}: SpellSelectionStepProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [spellData, setSpellData] = useState<SpellSelectionData | null>(null);

    // Selected spell IDs
    const [selectedCantrips, setSelectedCantrips] = useState<number[]>(formData.cantrip_ids || []);
    const [selectedSpells, setSelectedSpells] = useState<number[]>(formData.spell_ids || []);

    useEffect(() => {
        setSelectedCantrips(formData.cantrip_ids || []);
    }, [formData.cantrip_ids]);

    useEffect(() => {
        setSelectedSpells(formData.spell_ids || []);
    }, [formData.spell_ids]);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [schoolFilter, setSchoolFilter] = useState<string>("all");
    const [showConcentrationOnly, setShowConcentrationOnly] = useState(false);
    const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);
    const [activeTab, setActiveTab] = useState<"cantrips" | "spells">("cantrips");

    // Expanded spell (for showing full description)
    const [expandedSpell, setExpandedSpell] = useState<number | null>(null);

    useEffect(() => {
        loadSpellOptions();
    }, []);

    const loadSpellOptions = async () => {
        if (!formData.character_class_id && !formData.character_class_name) {
            setError("No character class selected. Please go back to Step 1.");
            setLoading(false);
            return;
        }

        try {
            // Get class name from formData or API
            let className = formData.character_class_name;
            if (!className && formData.character_class_id) {
                const classResponse = await api.get(`/character-classes/${formData.character_class_id}/`);
                className = classResponse.data.name;
            }

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

            // Recommended filter
            if (showRecommendedOnly && !spell.recommended) {
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
            <div className="flex flex-col items-center justify-center py-12 space-y-3 font-lora">
                <div className="w-7 h-7 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[#d1cdb8]/70 italic">Divining spellbooks...</p>
            </div>
        );
    }

    if (error && !spellData) {
        return (
            <div className="space-y-4 font-lora">
                <div className="bg-rose-950/60 border border-rose-500/40 text-rose-300 p-4 rounded text-sm">
                    {error}
                </div>
                <button
                    type="button"
                    onClick={onBack}
                    className="px-4 py-2 border border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/10 font-lora font-semibold text-xs rounded transition-all cursor-pointer"
                >
                    ← Back
                </button>
            </div>
        );
    }

    if (!spellData) {
        return (
            <div className="space-y-4 font-lora">
                <p className="text-[#d1cdb8]/70 text-sm">This class does not gain spells at level 1.</p>
                <div className="flex justify-between pt-4 border-t border-[#c5a059]/20">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-4 py-2 border border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/10 text-xs rounded transition-all cursor-pointer font-semibold"
                    >
                        ← Back
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        className="px-6 py-2 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_15px_rgba(197,160,89,0.3)] cursor-pointer"
                    >
                        Next →
                    </button>
                </div>
            </div>
        );
    }

    // Check if this is a non-caster class (response contains message or missing rules)
    if ((spellData as any).message || !spellData.spells_info) {
        return (
            <div className="space-y-4 font-lora">
                <div className="bg-[#12141a] p-6 rounded border border-[#c5a059]/25 text-center">
                    <h3 className="font-cinzel-decorative text-lg font-bold text-[#c5a059] mb-2">No Spells Required</h3>
                    <p className="text-xs text-[#d1cdb8]/80 mb-2">
                        {(spellData as any).message || `${spellData.class_name || 'This class'} does not select spells at level 1.`}
                    </p>
                    <p className="text-[11px] text-[#d1cdb8]/50 italic">
                        (If you gain spells from your Race/Species, they are automatically granted)
                    </p>
                </div>
                <div className="flex justify-between pt-5 border-t border-[#c5a059]/20 mt-6">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-4 py-2 border border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/10 font-lora font-semibold text-xs rounded transition-all cursor-pointer"
                    >
                        ← Back
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        className="px-6 py-2 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_15px_rgba(197,160,89,0.3)] cursor-pointer font-lora"
                    >
                        Next →
                    </button>
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
        <div className="space-y-6 font-lora">
            {/* Instructions */}
            <div className="bg-[#12141a] border border-[#c5a059]/25 rounded p-4">
                <h3 className="font-cinzel-decorative text-base font-bold text-[#c5a059] mb-1">
                    Spell Selection - {spellData.class_name}
                </h3>
                <p className="text-[#d1cdb8]/80 text-xs mb-3 leading-relaxed">{spellData.description}</p>

                {/* Progress */}
                <div className="flex flex-wrap gap-4 text-xs font-semibold">
                    {cantripsToSelect > 0 && (
                        <div className={`flex items-center gap-1.5 ${cantripsComplete ? 'text-[#22c55e]' : 'text-[#c5a059]'}`}>
                            <span>Cantrips:</span>
                            <span className="font-fira-sans">{cantripsSelected} / {cantripsToSelect}</span>
                            {cantripsComplete && <span>✓</span>}
                        </div>
                    )}
                    {spellsToSelect > 0 && (
                        <div className={`flex items-center gap-1.5 ${spellsComplete ? 'text-[#22c55e]' : 'text-[#c5a059]'}`}>
                            <span>Spells:</span>
                            <span className="font-fira-sans">{spellsSelected} / {spellsToSelect}</span>
                            {spellsComplete && <span>✓</span>}
                        </div>
                    )}
                    {spellData.spells_info?.can_prepare_all && (
                        <div className="flex items-center gap-1.5 text-[#d1cdb8]/60">
                            <span>1st-Level Spells:</span>
                            <span className="text-[#d1cdb8]/80">All available (prepared daily)</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[#c5a059]/20">
                {cantripsToSelect > 0 && (
                    <button
                        onClick={() => setActiveTab("cantrips")}
                        className={`px-4 py-2 font-medium text-xs transition-colors cursor-pointer ${
                            activeTab === "cantrips"
                                ? "text-[#c5a059] border-b-2 border-[#c5a059] font-bold"
                                : "text-[#d1cdb8]/60 hover:text-[#d1cdb8]"
                        }`}
                    >
                        Cantrips ({cantripsSelected}/{cantripsToSelect})
                    </button>
                )}
                {spellsToSelect > 0 && (
                    <button
                        onClick={() => setActiveTab("spells")}
                        className={`px-4 py-2 font-medium text-xs transition-colors cursor-pointer ${
                            activeTab === "spells"
                                ? "text-[#c5a059] border-b-2 border-[#c5a059] font-bold"
                                : "text-[#d1cdb8]/60 hover:text-[#d1cdb8]"
                        }`}
                    >
                        1st Level Spells ({spellsSelected}/{spellsToSelect})
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2.5 items-center">
                <Input
                    type="text"
                    placeholder="Search spells..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs bg-[#0c0d12] border-[#c5a059]/30 text-slate-100 placeholder:text-slate-600 focus:border-[#c5a059] text-xs h-9 font-lora"
                />

                <select
                    value={schoolFilter}
                    onChange={(e) => setSchoolFilter(e.target.value)}
                    className="px-3 py-2 bg-[#0c0d12] border border-[#c5a059]/30 rounded text-[#d1cdb8] text-xs font-lora focus:border-[#c5a059] h-9"
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
                    type="button"
                    onClick={() => setShowConcentrationOnly(!showConcentrationOnly)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                        showConcentrationOnly
                            ? "bg-purple-800 text-purple-100 border border-purple-400"
                            : "bg-[#0c0d12] text-[#d1cdb8]/70 border border-[#c5a059]/30 hover:bg-[#c5a059]/10"
                    }`}
                >
                    ⚗️ Concentration Only
                </button>

                {/* Recommended Filter */}
                <button
                    type="button"
                    onClick={() => setShowRecommendedOnly(!showRecommendedOnly)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                        showRecommendedOnly
                            ? "bg-[#c5a059] text-[#0c0d12] font-bold shadow-[0_0_10px_rgba(197,160,89,0.3)]"
                            : "bg-[#0c0d12] text-[#c5a059] border border-[#c5a059]/40 hover:bg-[#c5a059]/10"
                    }`}
                >
                    ⭐ {showRecommendedOnly ? "Recommended Only" : "Filter Recommended"}
                </button>
            </div>

            {/* Selected Spells Summary (Persistent across filters) */}
            {(activeTab === "cantrips" ? selectedCantrips.length > 0 : selectedSpells.length > 0) && (
                <div className="bg-[#12141a] border border-[#c5a059]/20 rounded p-3">
                    <div className="text-xs font-semibold text-[#c5a059] uppercase tracking-wider mb-2 flex justify-between items-center">
                        <span>Selected {activeTab === "cantrips" ? "Cantrips" : "Spells"} ({activeTab === "cantrips" ? selectedCantrips.length : selectedSpells.length}/{activeTab === "cantrips" ? cantripsToSelect : spellsToSelect})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(activeTab === "cantrips" ? selectedCantrips : selectedSpells).map(id => {
                            const spell = (activeTab === "cantrips" ? spellData?.available_cantrips : spellData?.available_spells)?.find(s => s.id === id);
                            if (!spell) return null;
                            return (
                                <div
                                    key={id}
                                    className="bg-[#22c55e]/15 border border-[#22c55e]/50 rounded px-2.5 py-1 text-xs text-[#22c55e] flex items-center gap-1.5"
                                >
                                    <span>{spell.name}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSelection(id);
                                        }}
                                        className="hover:bg-[#22c55e]/30 rounded-full p-0.5 transition-colors cursor-pointer"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredSpells.map((spell) => {
                    const isSelected = selectedInTab.includes(spell.id);
                    const isExpanded = expandedSpell === spell.id;

                    return (
                        <div
                            key={spell.id}
                            className={`p-3.5 rounded cursor-pointer transition-all border ${
                                isSelected
                                    ? "bg-[#c5a059]/15 border-[#c5a059] ring-1 ring-[#c5a059]/50 shadow-[0_0_12px_rgba(197,160,89,0.2)]"
                                    : "bg-[#12141a] border-[#c5a059]/20 hover:border-[#c5a059]/40 hover:bg-[#c5a059]/5"
                            }`}
                            onClick={() => toggleSelection(spell.id)}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`font-cinzel-decorative font-semibold text-sm transition-colors ${
                                            isSelected ? "text-[#c5a059]" : "text-[#d1cdb8]"
                                        }`}>{spell.name}</h4>
                                        {spell.recommended && (
                                            <span className="bg-[#c5a059]/20 text-[#c5a059] text-[9px] px-1 py-0.2 rounded border border-[#c5a059]/40 flex items-center gap-0.5">
                                                ⭐
                                            </span>
                                        )}
                                        {isSelected && <span className="text-[#22c55e] text-xs font-bold">✓</span>}
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                        <span className={`px-1.5 py-0.5 rounded ${SCHOOL_COLORS[spell.school] || "bg-[#181a21]"} text-white font-medium`}>
                                            {spell.school.charAt(0).toUpperCase() + spell.school.slice(1)}
                                        </span>
                                        {spell.concentration && (
                                            <span className="text-purple-300 bg-purple-950/50 px-1 py-0.5 rounded border border-purple-500/30">⚗️ Conc</span>
                                        )}
                                        {spell.ritual && (
                                            <span className="text-cyan-300 bg-cyan-950/50 px-1 py-0.5 rounded border border-cyan-500/30">🎯 Ritual</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="text-[11px] text-[#d1cdb8]/60 space-y-0.5 mb-2 font-fira-sans">
                                <div>⏱️ {spell.casting_time} · 📍 {spell.range}</div>
                                <div>⏳ {spell.duration} · 🔤 {spell.components}</div>
                            </div>

                            <p className="text-xs text-[#d1cdb8]/80 line-clamp-3 leading-relaxed">
                                {spell.description}
                            </p>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedSpell(isExpanded ? null : spell.id);
                                }}
                                className="text-[11px] text-[#c5a059] mt-2 hover:underline cursor-pointer block"
                            >
                                {isExpanded ? "Show Less" : "Show More"}
                            </button>

                            {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-[#c5a059]/20 text-xs text-[#d1cdb8]/80 space-y-2">
                                    <p className="whitespace-pre-wrap leading-relaxed">{spell.description}</p>
                                    {spell.higher_level && (
                                        <div className="pt-2 border-t border-[#c5a059]/10">
                                            <span className="font-semibold text-[#c5a059]">At Higher Levels: </span>
                                            <span>{spell.higher_level}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredSpells.length === 0 && (
                <div className="text-center py-8 text-[#d1cdb8]/60 text-xs italic">
                    No spells match your filters.
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-rose-950/60 border border-rose-500/40 text-rose-300 p-3 rounded text-xs">
                    {error}
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center pt-5 border-t border-[#c5a059]/20 mt-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-4 py-2 border border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/10 font-lora font-semibold text-xs rounded transition-all cursor-pointer"
                >
                    ← Back
                </button>
                {onRandomizeStep && (
                    <button
                        type="button"
                        onClick={onRandomizeStep}
                        disabled={isRandomizingStep}
                        className="px-4 py-2 border border-[#c5a059]/40 hover:bg-[#c5a059]/10 text-[#c5a059] font-lora font-semibold text-xs rounded transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        <Dices className={`w-3.5 h-3.5 ${isRandomizingStep ? "animate-spin" : ""}`} />
                        <span>{isRandomizingStep ? "Rolling..." : "Randomize This Page"}</span>
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={!allComplete}
                    className="px-6 py-2 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_15px_rgba(197,160,89,0.3)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-lora"
                >
                    {allComplete ? "Next →" : `Select ${cantripsToSelect - cantripsSelected + spellsToSelect - spellsSelected} More`}
                </button>
            </div>
        </div>
    );
}
