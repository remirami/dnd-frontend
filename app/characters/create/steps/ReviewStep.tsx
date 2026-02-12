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
        return <div className="text-white text-center py-8">Loading review details...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Basic Info Summary */}
            <Card className="bg-slate-800 border-slate-700 p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span className="text-slate-400">Name:</span>
                        <span className="text-white ml-2 font-medium">{formData.name}</span>
                    </div>
                    <div>
                        <span className="text-slate-400">{formData.ruleset_version === '2024' ? 'Species' : 'Race'}:</span>
                        <span className="text-white ml-2 font-medium">{selectedRace?.name || "Unknown"}</span>
                    </div>
                    <div>
                        <span className="text-slate-400">Class:</span>
                        <span className="text-white ml-2 font-medium">{selectedClass?.name || "Unknown"}</span>
                    </div>
                    <div>
                        <span className="text-slate-400">Alignment:</span>
                        <span className="text-white ml-2">{formData.alignment}</span>
                    </div>
                    {selectedBackground && (
                        <div className="col-span-2">
                            <span className="text-slate-400">Background:</span>
                            <span className="text-white ml-2">{selectedBackground.name}</span>
                        </div>
                    )}
                    {formData.language_ids && formData.language_ids.length > 0 && (
                        <div className="col-span-2 mt-1">
                            <span className="text-slate-400">Extra Languages:</span>
                            <span className="text-white ml-2 text-xs bg-slate-700 px-2 py-0.5 rounded">
                                {formData.language_ids.length} Selected
                            </span>
                        </div>
                    )}
                </div>
            </Card>

            {/* Ability Scores */}
            <Card className="bg-slate-800 border-slate-700 p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Ability Scores</h3>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { name: "STR", value: formData.strength },
                        { name: "DEX", value: formData.dexterity },
                        { name: "CON", value: formData.constitution },
                        { name: "INT", value: formData.intelligence },
                        { name: "WIS", value: formData.wisdom },
                        { name: "CHA", value: formData.charisma },
                    ].map((stat) => (
                        <div key={stat.name} className="flex items-center justify-between bg-slate-900 p-2 rounded">
                            <span className="text-slate-400 text-sm">{stat.name}</span>
                            <span className="text-white font-bold">{stat.value}</span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Equipment Summary */}
            <Card className="bg-slate-800 border-slate-700 p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Equipment</h3>
                {selectedEquipmentCount > 0 ? (
                    <div className="space-y-2">
                        {Object.entries(formData.equipment_selections).map(([choiceNum, selection]) => (
                            <div key={choiceNum} className="text-sm">
                                <span className="text-slate-400">Choice {choiceNum}:</span>
                                <span className="text-white ml-2">{selection}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 text-sm">No equipment selected</p>
                )}
            </Card>

            {/* Spells Summary */}
            {(formData.cantrip_ids.length > 0 || formData.spell_ids.length > 0) && (
                <Card className="bg-slate-800 border-slate-700 p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Spells</h3>
                    {formData.cantrip_ids.length > 0 && (
                        <div className="mb-3">
                            <h4 className="text-sm font-medium text-slate-400 mb-1">Cantrips:</h4>
                            <p className="text-white text-sm">{formData.cantrip_ids.length} cantrips selected</p>
                        </div>
                    )}
                    {formData.spell_ids.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-400 mb-1">1st Level Spells:</h4>
                            <p className="text-white text-sm">{formData.spell_ids.length} spells selected</p>
                        </div>
                    )}
                </Card>
            )}

            {/* Personality (if filled) */}
            {(formData.bonds || formData.flaws || formData.ideals) && (
                <Card className="bg-slate-800 border-slate-700 p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Personality</h3>
                    <div className="space-y-2 text-sm">
                        {formData.bonds && (
                            <div>
                                <span className="text-slate-400 font-medium">Bonds:</span>
                                <p className="text-white mt-1">{formData.bonds}</p>
                            </div>
                        )}
                        {formData.flaws && (
                            <div>
                                <span className="text-slate-400 font-medium">Flaws:</span>
                                <p className="text-white mt-1">{formData.flaws}</p>
                            </div>
                        )}
                        {formData.ideals && (
                            <div>
                                <span className="text-slate-400 font-medium">Ideals:</span>
                                <p className="text-white mt-1">{formData.ideals}</p>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Error Display */}
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
                    disabled={loading}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                    ← Back
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                >
                    {loading ? "Creating Character..." : "Create Character 🎲"}
                </Button>
            </div>
        </div>
    );
}
