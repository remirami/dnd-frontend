"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { racesApi, classesApi, backgroundsApi } from "@/lib/api/gamedata";
import api from "@/lib/api/client";
import type { CharacterFormData } from "../CharacterCreationWizard";

interface BasicInfoStepProps {
    formData: CharacterFormData;
    updateFormData: (updates: Partial<CharacterFormData>) => void;
    onNext: () => void;
}

export default function BasicInfoStep({ formData, updateFormData, onNext }: BasicInfoStepProps) {
    const [races, setRaces] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [backgrounds, setBackgrounds] = useState<any[]>([]);
    const [languages, setLanguages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Reload data when Ruleset Version changes
    useEffect(() => {
        loadGameData();
    }, [formData.ruleset_version]);

    const loadGameData = async () => {
        setLoading(true);
        try {
            const params = { ruleset: formData.ruleset_version || '2014' };
            const [racesRes, classesRes, backgroundsRes, languagesRes] = await Promise.all([
                racesApi.getAll(params),
                classesApi.getAll(params),
                backgroundsApi.getAll(params),
                api.get('/languages/')
            ]);

            const racesData = racesRes.data?.results || racesRes.data || [];
            const classesData = classesRes.data?.results || classesRes.data || [];
            const backgroundsData = backgroundsRes.data?.results || backgroundsRes.data || [];
            const languagesData = languagesRes.data?.results || languagesRes.data || [];

            setRaces(Array.isArray(racesData) ? racesData : []);
            setClasses(Array.isArray(classesData) ? classesData : []);
            setBackgrounds(Array.isArray(backgroundsData) ? backgroundsData : []);
            setLanguages(Array.isArray(languagesData) ? languagesData : []);
        } catch (error) {
            console.error("Failed to load game data:", error);
        } finally {
            setLoading(false);
        }
    };

    const selectedRace = races.find(r => r.id === formData.race_id);
    const selectedClass = classes.find(c => c.id === formData.character_class_id);
    const selectedBackground = backgrounds.find(b => b.id === formData.background_id);

    // 2024 Logic Checks
    const is2024 = formData.ruleset_version === '2024';
    const raceLabel = is2024 ? "Species" : "Race";

    // Determine if extra language choice is needed
    // Humans and Half-Elves typically get an extra language choice in 5e (2014)
    // In 2024, this might differ, but for now keeping it safe.
    const needsExtraLanguage = !is2024 && selectedRace && (
        selectedRace.name.toLowerCase() === 'human' ||
        selectedRace.name.toLowerCase() === 'half-elf'
    );

    const canProceed = formData.name && formData.race_id && formData.character_class_id &&
        (!needsExtraLanguage || (formData.language_ids && formData.language_ids.length > 0));

    return (
        <div className="space-y-6">
            {/* Ruleset Toggle */}
            <div className="space-y-2">
                <Label className="text-white">Ruleset Version</Label>
                <div className="flex space-x-4">
                    <Button
                        variant={formData.ruleset_version === '2014' ? 'default' : 'secondary'}
                        onClick={() => updateFormData({ ruleset_version: '2014', race_id: null, background_id: null, character_class_id: null })}
                        className={formData.ruleset_version === '2014' ? "bg-blue-600" : "bg-slate-700 text-slate-300"}
                    >
                        2014 (Legacy)
                    </Button>
                    <Button
                        variant={formData.ruleset_version === '2024' ? 'default' : 'secondary'}
                        onClick={() => updateFormData({ ruleset_version: '2024', race_id: null, background_id: null, character_class_id: null })}
                        className={formData.ruleset_version === '2024' ? "bg-purple-600" : "bg-slate-700 text-slate-300"}
                    >
                        2024 (Standard)
                    </Button>
                </div>
                <p className="text-xs text-slate-400">
                    {is2024
                        ? "Using 2024 SRD 5.2 rules. Species do not provide Ability Score Increases; Backgrounds do."
                        : "Using 2014 SRD 5.1 rules. Races provide Ability Score Increases."}
                </p>
            </div>

            {/* Character Name */}
            <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Character Name *</Label>
                <Input
                    id="name"
                    placeholder="Enter character name"
                    value={formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                />
            </div>

            {/* Race / Species */}
            <div className="space-y-2">
                <Label htmlFor="race" className="text-white">{raceLabel} *</Label>
                <Select
                    value={formData.race_id?.toString() || ""}
                    onValueChange={(value) => {
                        updateFormData({
                            race_id: parseInt(value),
                            language_ids: [] // Reset languages when race changes
                        });
                    }}
                >
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue placeholder={`Select a ${raceLabel.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                        {races.map((r) => (
                            <SelectItem key={r.id} value={r.id.toString()}>
                                {r.name_display || r.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedRace && (
                    <div className="mt-2 p-3 bg-slate-900/50 rounded-md border border-slate-800 text-sm">
                        <p className="text-slate-300 italic">{selectedRace.description}</p>

                        {/* Only show Racial ASI for 2014 */}
                        {!is2024 && selectedRace.ability_score_increases && (
                            <div className="mt-2">
                                <span className="font-semibold text-slate-200">ASI: </span>
                                <span className="text-slate-400">{selectedRace.ability_score_increases}</span>
                            </div>
                        )}

                        {/* Extra Language Selection (Legacy) */}
                        {needsExtraLanguage && (
                            <div className="mt-3 pt-3 border-t border-slate-800">
                                <Label className="text-yellow-400 mb-2 block">Extra Language (Racial Trait)</Label>
                                <Select
                                    value={formData.language_ids && formData.language_ids.length > 0 ? formData.language_ids[0].toString() : ""}
                                    onValueChange={(value) => updateFormData({ language_ids: [parseInt(value)] })}
                                >
                                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                        <SelectValue placeholder="Select a language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {languages
                                            .filter(l => l.name !== 'Common')
                                            .map((l) => (
                                                <SelectItem key={l.id} value={l.id.toString()}>
                                                    {l.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Class */}
            <div className="space-y-2">
                <Label htmlFor="class" className="text-white">Class *</Label>
                <Select
                    value={formData.character_class_id?.toString() || ""}
                    onValueChange={(value) => {
                        const id = parseInt(value);
                        const cls = classes.find(c => c.id === id);
                        updateFormData({
                            character_class_id: id,
                            character_class_name: cls?.name
                        });
                    }}
                >
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                        {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name_display || c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedClass && (
                    <div className="mt-2 p-3 bg-slate-900/50 rounded-md border border-slate-800 text-sm">
                        <p className="text-slate-300 italic">{selectedClass.description}</p>
                        <div className="mt-2">
                            <span className="font-semibold text-slate-200">Hit Dice: </span>
                            <span className="text-slate-400">{selectedClass.hit_dice}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Background */}
            <div className="space-y-2">
                <Label htmlFor="background" className="text-white">Background (Optional)</Label>
                <Select
                    value={formData.background_id?.toString() || ""}
                    onValueChange={(value) => updateFormData({ background_id: parseInt(value) })}
                >
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue placeholder="Select a background" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {backgrounds.map((bg) => (
                            <SelectItem key={bg.id} value={bg.id.toString()}>
                                {bg.name_display || bg.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedBackground && (
                    <div className="mt-2 p-3 bg-slate-900/50 rounded-md border border-slate-800 text-sm">
                        <p className="text-slate-300 italic">{selectedBackground.description}</p>

                        {/* 2024 Rules: Origin Feat */}
                        {is2024 && selectedBackground.ability_score_options?.feat && (
                            <div className="mt-2 text-purple-200">
                                <span className="font-semibold text-purple-400">Origin Feat: </span>
                                {selectedBackground.ability_score_options.feat}
                            </div>
                        )}

                        {selectedBackground.feature_name && (
                            <div className="mt-2">
                                <span className="font-semibold text-slate-200">Feature: {selectedBackground.feature_name}</span>
                                <p className="text-xs text-slate-400 mt-1">{selectedBackground.feature_description}</p>
                            </div>
                        )}

                        {selectedBackground.skill_proficiencies && (
                            <div className="mt-2">
                                <span className="font-semibold text-slate-200">Skills: </span>
                                <span className="text-slate-400">{selectedBackground.skill_proficiencies}</span>
                            </div>
                        )}

                        {/* 2024 Background ASI Info */}
                        {is2024 && selectedBackground.ability_score_options && (
                            <div className="mt-2 text-purple-300">
                                <span className="font-semibold">Attributes: </span>
                                Boosts available for {selectedBackground.ability_score_options.stats?.join(", ")}.
                                (You will select details in Step 3)
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex justify-end pt-4 border-t border-slate-700">
                <Button
                    onClick={onNext}
                    disabled={!canProceed}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    Next: Personality →
                </Button>
            </div>
        </div>
    );
}
