"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dices, Sparkles } from "lucide-react";
import { racesApi, classesApi, backgroundsApi } from "@/lib/api/gamedata";
import api from "@/lib/api/client";
import type { CharacterFormData } from "../CharacterCreationWizard";

interface BasicInfoStepProps {
    formData: CharacterFormData;
    updateFormData: (updates: Partial<CharacterFormData>) => void;
    onNext: () => void;
    onRandomizeStep?: () => void;
    isRandomizingStep?: boolean;
}

export default function BasicInfoStep({
    formData,
    updateFormData,
    onNext,
    onRandomizeStep,
    isRandomizingStep
}: BasicInfoStepProps) {
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
            const params = { ruleset: formData.ruleset_version || '2024' };
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
                <Label className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider">Ruleset Version</Label>
                <div className="flex space-x-3">
                    <button
                        type="button"
                        onClick={() => updateFormData({ ruleset_version: '2024', race_id: null, background_id: null, character_class_id: null })}
                        className={`px-4 py-2 text-xs font-lora font-bold rounded transition-all cursor-pointer ${
                            formData.ruleset_version === '2024'
                                ? "bg-[#c5a059] text-[#0c0d12] shadow-[0_0_12px_rgba(197,160,89,0.35)] border border-[#e0bc75]"
                                : "bg-[#12141a] text-[#d1cdb8]/70 border border-[#c5a059]/25 hover:bg-[#c5a059]/10 hover:text-[#d1cdb8]"
                        }`}
                    >
                        2024 (Standard)
                    </button>
                    <button
                        type="button"
                        onClick={() => updateFormData({ ruleset_version: '2014', race_id: null, background_id: null, character_class_id: null })}
                        className={`px-4 py-2 text-xs font-lora font-bold rounded transition-all cursor-pointer ${
                            formData.ruleset_version === '2014'
                                ? "bg-[#c5a059] text-[#0c0d12] shadow-[0_0_12px_rgba(197,160,89,0.35)] border border-[#e0bc75]"
                                : "bg-[#12141a] text-[#d1cdb8]/70 border border-[#c5a059]/25 hover:bg-[#c5a059]/10 hover:text-[#d1cdb8]"
                        }`}
                    >
                        2014 (Legacy)
                    </button>
                </div>
                <p className="text-xs text-[#d1cdb8]/60 font-lora italic">
                    {is2024
                        ? "Using 2024 SRD 5.2 rules. Species do not provide Ability Score Increases; Backgrounds do."
                        : "Using 2014 SRD 5.1 rules. Races provide Ability Score Increases."}
                </p>
            </div>

            {/* Character Name */}
            <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider">Character Name *</Label>
                <Input
                    id="name"
                    placeholder="Enter character name"
                    value={formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    className="bg-[#0c0d12] border-[#c5a059]/30 text-slate-100 placeholder:text-slate-600 focus:border-[#c5a059] focus:ring-[#c5a059]/20 font-lora text-sm h-10"
                />
            </div>

            {/* Race / Species */}
            <div className="space-y-2">
                <Label htmlFor="race" className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider">{raceLabel} *</Label>
                <Select
                    value={formData.race_id?.toString() || ""}
                    onValueChange={(value) => {
                        updateFormData({
                            race_id: parseInt(value),
                            language_ids: [] // Reset languages when race changes
                        });
                    }}
                >
                    <SelectTrigger className="bg-[#0c0d12] border-[#c5a059]/30 text-slate-100 focus:border-[#c5a059] font-lora text-sm h-10">
                        <SelectValue placeholder={`Select a ${raceLabel.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181a21] border border-[#c5a059]/40 text-[#d1cdb8] font-lora">
                        {[...races].sort((a, b) => (a.name_display || a.name || '').localeCompare(b.name_display || b.name || '')).map((r) => (
                            <SelectItem key={r.id} value={r.id.toString()}>
                                {r.name_display || r.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedRace && (
                    <div className="mt-2.5 p-4 bg-[#12141a]/90 rounded-lg border border-[#c5a059]/30 text-sm font-lora shadow-inner space-y-3">
                        {/* Flavor Description */}
                        {selectedRace.description && (
                            <p className="text-[#d1cdb8]/90 italic leading-relaxed text-xs sm:text-sm">
                                {selectedRace.description}
                            </p>
                        )}

                        {/* Species / Race Quick Badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#c5a059]/20 text-[11px]">
                            {/* Speed */}
                            {selectedRace.speed && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0c0d12] border border-[#c5a059]/30 text-[#d1cdb8]">
                                    <span className="text-[#c5a059] font-bold uppercase tracking-wider text-[10px]">Speed:</span>
                                    <span>{selectedRace.speed} ft.</span>
                                </span>
                            )}
                            {/* Size */}
                            {(selectedRace.size_display || selectedRace.size) && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0c0d12] border border-[#c5a059]/30 text-[#d1cdb8]">
                                    <span className="text-[#c5a059] font-bold uppercase tracking-wider text-[10px]">Size:</span>
                                    <span>{selectedRace.size_display || (selectedRace.size === 'S' ? 'Small' : selectedRace.size === 'M' ? 'Medium' : selectedRace.size)}</span>
                                </span>
                            )}
                            {/* Skill Proficiencies */}
                            {selectedRace.skill_proficiencies && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0c0d12] border border-[#c5a059]/30 text-[#d1cdb8]">
                                    <span className="text-[#c5a059] font-bold uppercase tracking-wider text-[10px]">Skills:</span>
                                    <span>{selectedRace.skill_proficiencies}</span>
                                </span>
                            )}
                            {/* ASI for 2014 */}
                            {!is2024 && selectedRace.ability_score_increases && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#c5a059]/15 border border-[#c5a059]/40 text-[#f5ecd5]">
                                    <span className="text-[#e0bc75] font-bold uppercase tracking-wider text-[10px]">ASI:</span>
                                    <span>{selectedRace.ability_score_increases}</span>
                                </span>
                            )}
                            {/* ASI Note for 2024 */}
                            {is2024 && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#c5a059]/10 border border-[#c5a059]/20 text-[#d1cdb8]/80 text-[10px]">
                                    <span className="text-[#c5a059] font-bold uppercase tracking-wider text-[10px]">ASI:</span>
                                    <span>Chosen via Background (Step 3)</span>
                                </span>
                            )}
                        </div>

                        {/* Traits & Bonuses List */}
                        {(() => {
                            const traitsList: any[] = Array.isArray(selectedRace.traits)
                                ? selectedRace.traits
                                : typeof selectedRace.traits === 'string'
                                    ? JSON.parse(selectedRace.traits || '[]')
                                    : [];

                            if (traitsList.length === 0) return null;

                            return (
                                <div className="pt-2 border-t border-[#c5a059]/20 space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#c5a059] uppercase tracking-wider">
                                        <Sparkles className="w-3.5 h-3.5 text-[#e0bc75]" />
                                        <span>{is2024 ? "Species Traits & Powers" : "Racial Traits & Feats"}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {traitsList.map((trait: any, idx: number) => (
                                            <div
                                                key={trait.name || idx}
                                                className="p-2.5 rounded bg-[#0c0d12]/70 border border-[#c5a059]/20 hover:border-[#c5a059]/40 transition-colors"
                                            >
                                                <div className="text-xs font-bold text-[#e0bc75] mb-1">
                                                    {trait.name}
                                                </div>
                                                <div className="text-[11px] text-[#d1cdb8]/80 leading-relaxed font-sans">
                                                    {trait.description}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Extra Language Selection (Legacy) */}
                        {needsExtraLanguage && (
                            <div className="mt-3 pt-3 border-t border-[#c5a059]/20">
                                <Label className="text-[#c5a059] text-xs uppercase tracking-wider font-semibold mb-2 block">Extra Language (Racial Trait)</Label>
                                <Select
                                    value={formData.language_ids && formData.language_ids.length > 0 ? formData.language_ids[0].toString() : ""}
                                    onValueChange={(value) => updateFormData({ language_ids: [parseInt(value)] })}
                                >
                                    <SelectTrigger className="bg-[#0c0d12] border-[#c5a059]/30 text-slate-100 font-lora text-xs h-9">
                                        <SelectValue placeholder="Select a language" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#181a21] border border-[#c5a059]/40 text-[#d1cdb8] font-lora">
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
                <Label htmlFor="class" className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider">Class *</Label>
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
                    <SelectTrigger className="bg-[#0c0d12] border-[#c5a059]/30 text-slate-100 focus:border-[#c5a059] font-lora text-sm h-10">
                        <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181a21] border border-[#c5a059]/40 text-[#d1cdb8] font-lora">
                        {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name_display || c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedClass && (
                    <div className="mt-2 p-3.5 bg-[#12141a] rounded border border-[#c5a059]/25 text-sm font-lora">
                        <p className="text-[#d1cdb8]/90 italic">{selectedClass.description}</p>
                        <div className="mt-2 text-xs">
                            <span className="font-semibold text-[#c5a059]">Hit Dice: </span>
                            <span className="text-[#d1cdb8]/70">{selectedClass.hit_dice}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Background */}
            <div className="space-y-2">
                <Label htmlFor="background" className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider">Background (Optional)</Label>
                <Select
                    value={formData.background_id?.toString() || ""}
                    onValueChange={(value) => updateFormData({ background_id: parseInt(value) })}
                >
                    <SelectTrigger className="bg-[#0c0d12] border-[#c5a059]/30 text-slate-100 focus:border-[#c5a059] font-lora text-sm h-10">
                        <SelectValue placeholder="Select a background" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181a21] border border-[#c5a059]/40 text-[#d1cdb8] font-lora">
                        <SelectItem value="none">None</SelectItem>
                        {backgrounds.map((bg) => (
                            <SelectItem key={bg.id} value={bg.id.toString()}>
                                {bg.name_display || bg.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedBackground && (
                    <div className="mt-2 p-3.5 bg-[#12141a] rounded border border-[#c5a059]/25 text-sm font-lora">
                        <p className="text-[#d1cdb8]/90 italic">{selectedBackground.description}</p>

                        {/* 2024 Rules: Origin Feat */}
                        {is2024 && selectedBackground.ability_score_options?.feat && (
                            <div className="mt-2 text-[#d1cdb8] text-xs">
                                <span className="font-semibold text-[#c5a059]">Origin Feat: </span>
                                {selectedBackground.ability_score_options.feat}
                            </div>
                        )}

                        {selectedBackground.feature_name && (
                            <div className="mt-2 text-xs">
                                <span className="font-semibold text-[#c5a059]">Feature: {selectedBackground.feature_name}</span>
                                <p className="text-xs text-[#d1cdb8]/70 mt-1">{selectedBackground.feature_description}</p>
                            </div>
                        )}

                        {selectedBackground.skill_proficiencies && (
                            <div className="mt-2 text-xs">
                                <span className="font-semibold text-[#c5a059]">Skills: </span>
                                <span className="text-[#d1cdb8]/70">{selectedBackground.skill_proficiencies}</span>
                            </div>
                        )}

                        {/* 2024 Background ASI Info */}
                        {is2024 && selectedBackground.ability_score_options && (
                            <div className="mt-2 text-[#d1cdb8] text-xs">
                                <span className="font-semibold text-[#c5a059]">Attributes: </span>
                                Boosts available for {selectedBackground.ability_score_options.stats?.join(", ")}.
                                (You will select details in Step 3)
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-5 border-t border-[#c5a059]/20 mt-6">
                {onRandomizeStep ? (
                    <button
                        type="button"
                        onClick={onRandomizeStep}
                        disabled={isRandomizingStep}
                        className="px-4 py-2 border border-[#c5a059]/40 hover:bg-[#c5a059]/10 text-[#c5a059] font-lora font-semibold text-xs rounded transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        <Dices className={`w-3.5 h-3.5 ${isRandomizingStep ? "animate-spin" : ""}`} />
                        <span>{isRandomizingStep ? "Rolling..." : "Randomize This Page"}</span>
                    </button>
                ) : <div />}
                <button
                    type="button"
                    onClick={onNext}
                    disabled={!canProceed}
                    className="px-6 py-2.5 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_15px_rgba(197,160,89,0.3)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 font-lora"
                >
                    <span>Next: Personality</span>
                    <span>→</span>
                </button>
            </div>
        </div>
    );
}
