"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { charactersApi } from "@/lib/api/characters";
import { racesApi, classesApi, backgroundsApi } from "@/lib/api/gamedata";
import api from "@/lib/api/client";
import type { CharacterFormData } from "../CharacterCreationWizard";

interface ReviewStepProps {
    formData: CharacterFormData;
    onBack: () => void;
    onSubmit: () => void;
}

export default function ReviewStep({ formData, onBack }: ReviewStepProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState("");
    const [races, setRaces] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [backgrounds, setBackgrounds] = useState<any[]>([]);

    useEffect(() => {
        loadGameData();
    }, []);

    const loadGameData = async () => {
        try {
            const [racesRes, classesRes, backgroundsRes] = await Promise.all([
                racesApi.getAll({ ruleset: formData.ruleset_version }),
                classesApi.getAll({ ruleset: formData.ruleset_version }),
                backgroundsApi.getAll({ ruleset: formData.ruleset_version })
            ]);

            const racesData = racesRes.data?.results || racesRes.data || [];
            const classesData = classesRes.data?.results || classesRes.data || [];
            const backgroundsData = backgroundsRes.data?.results || backgroundsRes.data || [];

            setRaces(Array.isArray(racesData) ? racesData : []);
            setClasses(Array.isArray(classesData) ? classesData : []);
            setBackgrounds(Array.isArray(backgroundsData) ? backgroundsData : []);
        } catch (error) {
            console.error("Failed to load game data:", error);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");

        try {
            // 1. Create the character
            // Calculate final stats for 2024 (Base + Background ASI)
            // For 2014, backend handles racial bonuses, so we send base stats.
            const getFinalScore = (stat: string, base: number) => {
                if (formData.ruleset_version !== '2024') return base;
                const bonus = formData.background_asi_selection?.[stat.toLowerCase()] || 0;
                return base + bonus;
            };

            const characterPayload = {
                name: formData.name,
                ruleset_version: formData.ruleset_version,
                race_id: formData.race_id!,
                character_class_id: formData.character_class_id!,
                background_id: formData.background_id || undefined,
                alignment: formData.alignment,
                bonds: formData.bonds || undefined,
                flaws: formData.flaws || undefined,
                ideals: formData.ideals || undefined,
                hp_method: formData.hp_method,
                strength: getFinalScore('strength', formData.strength),
                dexterity: getFinalScore('dexterity', formData.dexterity),
                constitution: getFinalScore('constitution', formData.constitution),
                intelligence: getFinalScore('intelligence', formData.intelligence),
                wisdom: getFinalScore('wisdom', formData.wisdom),
                charisma: getFinalScore('charisma', formData.charisma),
                language_ids: formData.language_ids, // Add languages
            };

            const createResponse = await charactersApi.create(characterPayload);
            const characterId = createResponse.data.id;

            // 2. Apply starting equipment
            if (Object.keys(formData.equipment_selections).length > 0) {
                try {
                    await api.post(`/characters/${characterId}/apply_starting_equipment/`, {
                        selections: formData.equipment_selections
                    });
                } catch (equipErr: any) {
                    console.error("Equipment application failed:", equipErr);
                    console.error("Equipment error response:", equipErr.response);
                    // Character is created, but equipment failed - still proceed
                }
            }

            // 3. Apply starting spells
            if (formData.cantrip_ids.length > 0 || formData.spell_ids.length > 0) {
                try {
                    await api.post(`/characters/${characterId}/apply_starting_spells/`, {
                        cantrip_ids: formData.cantrip_ids,
                        spell_ids: formData.spell_ids
                    });
                } catch (spellErr: any) {
                    console.error("Spell application failed:", spellErr);
                    console.error("Spell error response:", spellErr.response);
                    // Character is created, but spells failed - still proceed
                }
            }

            // 4. Navigate to character sheet
            router.push(`/characters/${characterId}`);
        } catch (err: any) {
            console.error("Character creation error:", err);
            const errorData = err.response?.data;
            if (typeof errorData === 'object' && errorData !== null) {
                const firstError = Object.entries(errorData)[0];
                if (firstError) {
                    const [field, messages] = firstError;
                    const message = Array.isArray(messages) ? messages[0] : messages;
                    setError(`${field}: ${message}`);
                } else {
                    setError("Failed to create character");
                }
            } else {
                setError(err.response?.data?.detail || "Failed to create character");
            }
            setLoading(false);
        }
    };

    const selectedRace = races.find(r => r.id === formData.race_id);
    const selectedClass = classes.find(c => c.id === formData.character_class_id);
    const selectedBackground = backgrounds.find(b => b.id === formData.background_id);
    const selectedEquipmentCount = Object.keys(formData.equipment_selections).length;

    if (initialLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-3 font-lora">
                <div className="w-7 h-7 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[#d1cdb8]/70 italic">Gathering character chronicle...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-lora">
            {/* Basic Info Summary */}
            <div className="bg-[#12141a] border border-[#c5a059]/25 rounded p-4">
                <h3 className="font-cinzel-decorative text-base font-bold text-[#c5a059] mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <span className="text-[#d1cdb8]/60 uppercase tracking-wider text-[10px] font-semibold block">Name</span>
                        <span className="text-slate-100 font-bold text-sm">{formData.name}</span>
                    </div>
                    <div>
                        <span className="text-[#d1cdb8]/60 uppercase tracking-wider text-[10px] font-semibold block">{formData.ruleset_version === '2024' ? 'Species' : 'Race'}</span>
                        <span className="text-[#c5a059] font-medium">{selectedRace?.name || "Unknown"}</span>
                    </div>
                    <div>
                        <span className="text-[#d1cdb8]/60 uppercase tracking-wider text-[10px] font-semibold block">Class</span>
                        <span className="text-[#c5a059] font-medium">{selectedClass?.name || "Unknown"}</span>
                    </div>
                    <div>
                        <span className="text-[#d1cdb8]/60 uppercase tracking-wider text-[10px] font-semibold block">Alignment</span>
                        <span className="text-slate-200">{formData.alignment}</span>
                    </div>
                    {selectedBackground && (
                        <div className="col-span-2 pt-1 border-t border-[#c5a059]/15">
                            <span className="text-[#d1cdb8]/60 uppercase tracking-wider text-[10px] font-semibold block">Background</span>
                            <span className="text-slate-200">{selectedBackground.name}</span>
                        </div>
                    )}
                    {formData.language_ids && formData.language_ids.length > 0 && (
                        <div className="col-span-2 mt-1">
                            <span className="text-[#d1cdb8]/60 uppercase tracking-wider text-[10px] font-semibold mr-2">Extra Languages:</span>
                            <span className="text-[#c5a059] text-xs bg-[#c5a059]/10 border border-[#c5a059]/30 px-2 py-0.5 rounded">
                                {formData.language_ids.length} Selected
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Ability Scores */}
            <div className="bg-[#12141a] border border-[#c5a059]/25 rounded p-4">
                <h3 className="font-cinzel-decorative text-base font-bold text-[#c5a059] mb-3">Ability Scores</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {[
                        { name: "STR", value: formData.strength },
                        { name: "DEX", value: formData.dexterity },
                        { name: "CON", value: formData.constitution },
                        { name: "INT", value: formData.intelligence },
                        { name: "WIS", value: formData.wisdom },
                        { name: "CHA", value: formData.charisma },
                    ].map((stat) => (
                        <div key={stat.name} className="flex flex-col items-center justify-center bg-[#0c0d12] border border-[#c5a059]/20 p-2.5 rounded">
                            <span className="text-[#d1cdb8]/50 text-[10px] uppercase font-semibold">{stat.name}</span>
                            <span className="text-[#c5a059] font-bold font-fira-sans text-lg">{stat.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Equipment Summary */}
            <div className="bg-[#12141a] border border-[#c5a059]/25 rounded p-4">
                <h3 className="font-cinzel-decorative text-base font-bold text-[#c5a059] mb-3">Equipment</h3>
                {selectedEquipmentCount > 0 ? (
                    <div className="space-y-1.5">
                        {Object.entries(formData.equipment_selections).map(([choiceNum, selection]) => (
                            <div key={choiceNum} className="text-xs">
                                <span className="text-[#d1cdb8]/60">Choice {choiceNum}:</span>
                                <span className="text-[#d1cdb8] ml-2 font-medium">{selection}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[#d1cdb8]/50 text-xs italic">No equipment selected</p>
                )}
            </div>

            {/* Spells Summary */}
            {(formData.cantrip_ids.length > 0 || formData.spell_ids.length > 0) && (
                <div className="bg-[#12141a] border border-[#c5a059]/25 rounded p-4">
                    <h3 className="font-cinzel-decorative text-base font-bold text-[#c5a059] mb-3">Spells</h3>
                    {formData.cantrip_ids.length > 0 && (
                        <div className="mb-2">
                            <span className="text-[10px] uppercase font-semibold text-[#d1cdb8]/60 tracking-wider">Cantrips:</span>
                            <p className="text-[#22c55e] text-xs font-semibold mt-0.5">{formData.cantrip_ids.length} cantrips selected</p>
                        </div>
                    )}
                    {formData.spell_ids.length > 0 && (
                        <div>
                            <span className="text-[10px] uppercase font-semibold text-[#d1cdb8]/60 tracking-wider">1st Level Spells:</span>
                            <p className="text-[#22c55e] text-xs font-semibold mt-0.5">{formData.spell_ids.length} spells selected</p>
                        </div>
                    )}
                </div>
            )}

            {/* Personality (if filled) */}
            {(formData.bonds || formData.flaws || formData.ideals) && (
                <div className="bg-[#12141a] border border-[#c5a059]/25 rounded p-4">
                    <h3 className="font-cinzel-decorative text-base font-bold text-[#c5a059] mb-3">Personality</h3>
                    <div className="space-y-2 text-xs">
                        {formData.bonds && (
                            <div>
                                <span className="text-[#d1cdb8]/60 uppercase tracking-wider text-[10px] font-semibold block">Bonds</span>
                                <p className="text-[#d1cdb8] mt-0.5 leading-relaxed">{formData.bonds}</p>
                            </div>
                        )}
                        {formData.flaws && (
                            <div>
                                <span className="text-[#d1cdb8]/60 uppercase tracking-wider text-[10px] font-semibold block">Flaws</span>
                                <p className="text-[#d1cdb8] mt-0.5 leading-relaxed">{formData.flaws}</p>
                            </div>
                        )}
                        {formData.ideals && (
                            <div>
                                <span className="text-[#d1cdb8]/60 uppercase tracking-wider text-[10px] font-semibold block">Ideals</span>
                                <p className="text-[#d1cdb8] mt-0.5 leading-relaxed">{formData.ideals}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-rose-950/60 border border-rose-500/40 text-rose-300 p-3 rounded text-xs">
                    {error}
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-5 border-t border-[#c5a059]/20 mt-6">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={loading}
                    className="px-4 py-2 border border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/10 font-lora font-semibold text-xs rounded transition-all cursor-pointer disabled:opacity-50"
                >
                    ← Back
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-7 py-2.5 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_20px_rgba(197,160,89,0.4)] cursor-pointer disabled:opacity-50 font-lora"
                >
                    {loading ? "Creating Character..." : "Create Character 🎲"}
                </button>
            </div>
        </div>
    );
}
