"use client";

import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dices, Shield, Swords, Search, Check, X, Sparkles, Crosshair, ChevronRight } from "lucide-react";
import api from "@/lib/api/client";
import type { CharacterFormData } from "../CharacterCreationWizard";
import {
    type WeaponItem,
    isWeaponProficient,
    hasShieldProficiency,
    getRecommendedWeapons,
    normalizeClassName,
} from "@/lib/data/weaponProficiencies";

interface EquipmentChoice {
    choice_number: number;
    description: string;
    options: {
        label: string;
        items?: { name: string; quantity: number }[];
        pack?: string;
        additional_choice?: {
            type: string;
            category: string;
            count?: number;
            prompt?: string;
        };
    }[];
}

interface EquipmentData {
    class_name: string;
    choices: EquipmentChoice[];
    default_items: { name: string; quantity: number }[];
    starting_gold: { min: number; max: number };
    available_packs: string[];
    pack_definitions?: Record<string, { cost: number; items: { name: string; quantity: number }[] }>;
}

interface EquipmentSelectionStepProps {
    formData: CharacterFormData;
    updateFormData: (updates: Partial<CharacterFormData>) => void;
    onNext: () => void;
    onBack: () => void;
    onRandomizeStep?: () => void;
    isRandomizingStep?: boolean;
}

export default function EquipmentSelectionStep({
    formData,
    updateFormData,
    onNext,
    onBack,
    onRandomizeStep,
    isRandomizingStep,
}: EquipmentSelectionStepProps) {
    const [equipmentData, setEquipmentData] = useState<EquipmentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [allWeapons, setAllWeapons] = useState<WeaponItem[]>([]);
    const [className, setClassName] = useState<string>("Fighter");

    // Weapon Picker Modal state
    const [pickerSlot, setPickerSlot] = useState<"primary" | "secondary" | null>(null);
    const [weaponFilter, setWeaponFilter] = useState<"all" | "melee" | "ranged" | "finesse">("all");
    const [weaponSearch, setWeaponSearch] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch class details
            let currentClassName = formData.character_class_name;
            if (!currentClassName && formData.character_class_id) {
                const classResponse = await api.get(`/character-classes/${formData.character_class_id}/`);
                currentClassName = classResponse.data.name;
            }
            if (currentClassName) {
                setClassName(currentClassName);
            }

            // 2. Fetch equipment choices and all weapons in parallel
            const [equipRes, weaponsRes] = await Promise.all([
                api.get(`/characters/starting_equipment_choices/?class_name=${currentClassName || 'fighter'}`),
                api.get('/weapons/'),
            ]);

            setEquipmentData(equipRes.data);
            const rawWeapons = weaponsRes.data?.results || weaponsRes.data || [];
            setAllWeapons(Array.isArray(rawWeapons) ? rawWeapons : []);

            // 3. Set default recommendations if no weapons currently selected
            if (!formData.primary_weapon && currentClassName) {
                const rec = getRecommendedWeapons(currentClassName);
                updateFormData({
                    primary_weapon: rec.primary,
                    secondary_weapon: rec.secondary,
                    include_shield: rec.includeShield && hasShieldProficiency(currentClassName),
                });
            }
        } catch (err: any) {
            console.error("Failed to load equipment choices or weapons:", err);
            setError(err.response?.data?.error || err.message || "Failed to load equipment options");
        } finally {
            setLoading(false);
        }
    };

    // Filter weapons proficient for current class
    const proficientWeapons = useMemo(() => {
        return allWeapons.filter((w) => isWeaponProficient(className, w));
    }, [allWeapons, className]);

    // Filter weapons according to active tab and search query
    const filteredWeapons = useMemo(() => {
        return proficientWeapons.filter((w) => {
            // Tab filter
            const wType = (w.weapon_type || "").toLowerCase();
            if (weaponFilter === "melee" && !wType.includes("melee")) return false;
            if (weaponFilter === "ranged" && !wType.includes("ranged") && !w.thrown) return false;
            if (weaponFilter === "finesse" && !w.finesse) return false;

            // Search filter
            if (weaponSearch.trim()) {
                const q = weaponSearch.toLowerCase().trim();
                const matchesName = w.name.toLowerCase().includes(q);
                const matchesDmg = (w.damage_dice || "").toLowerCase().includes(q);
                const matchesType = (w.damage_type || "").toLowerCase().includes(q);
                return matchesName || matchesDmg || matchesType;
            }

            return true;
        });
    }, [proficientWeapons, weaponFilter, weaponSearch]);

    // Selected weapon objects for display
    const selectedPrimaryObj = useMemo(() => {
        return allWeapons.find((w) => w.name.toLowerCase() === (formData.primary_weapon || "").toLowerCase());
    }, [allWeapons, formData.primary_weapon]);

    const selectedSecondaryObj = useMemo(() => {
        return allWeapons.find((w) => w.name.toLowerCase() === (formData.secondary_weapon || "").toLowerCase());
    }, [allWeapons, formData.secondary_weapon]);

    // Non-weapon equipment choices (e.g. Armor, Packs, Focus, Instruments)
    const nonWeaponChoices = useMemo(() => {
        if (!equipmentData?.choices) return [];
        return equipmentData.choices.filter((choice) => {
            const desc = choice.description.toLowerCase();
            // Filter out choices that are specifically about weapons
            return !desc.includes("weapon");
        });
    }, [equipmentData]);

    const handleChoiceChange = (choiceNumber: number, selectedOption: string) => {
        const newSelections = { ...formData.equipment_selections };

        // Remove old sub-selection keys
        Object.keys(newSelections).forEach((key) => {
            if (key.startsWith(`${choiceNumber}_sub_`)) {
                delete newSelections[key];
            }
        });

        updateFormData({
            equipment_selections: {
                ...newSelections,
                [choiceNumber.toString()]: selectedOption,
            },
        });
    };

    const handleSubSelection = (choiceNumber: number, index: number, value: string) => {
        updateFormData({
            equipment_selections: {
                ...formData.equipment_selections,
                [`${choiceNumber}_sub_${index}`]: value,
            },
        });
    };

    const handleSelectWeapon = (weaponName: string) => {
        if (pickerSlot === "primary") {
            updateFormData({ primary_weapon: weaponName });
        } else if (pickerSlot === "secondary") {
            updateFormData({ secondary_weapon: weaponName });
        }
        setPickerSlot(null);
        setWeaponSearch("");
    };

    // Validation checks
    const isPrimarySelected = Boolean(formData.primary_weapon);
    const areNonWeaponChoicesSelected = nonWeaponChoices.every((choice) => {
        const selectedLabel = formData.equipment_selections[choice.choice_number.toString()];
        if (!selectedLabel) return false;

        const option = choice.options.find((o) => o.label === selectedLabel);
        if (option && option.additional_choice) {
            const count = option.additional_choice.count || 1;
            for (let i = 0; i < count; i++) {
                if (!formData.equipment_selections[`${choice.choice_number}_sub_${i}`]) {
                    return false;
                }
            }
        }
        return true;
    });

    const isStepValid = isPrimarySelected && areNonWeaponChoicesSelected;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 space-y-3 font-lora">
                <div className="w-8 h-8 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[#d1cdb8]/70 italic">Gathering armory and starting gear...</p>
            </div>
        );
    }

    if (error && !equipmentData) {
        return (
            <div className="space-y-6">
                <div className="bg-rose-950/60 border border-rose-500/40 text-rose-300 p-4 rounded font-lora text-sm">
                    {error || "No equipment data available for this class"}
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
                        className="px-5 py-2 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_12px_rgba(197,160,89,0.3)] cursor-pointer font-lora"
                    >
                        Skip Equipment →
                    </button>
                </div>
            </div>
        );
    }

    const canUseShield = hasShieldProficiency(className);

    return (
        <div className="space-y-6 font-lora">
            {/* Header: Class Overview & Gold */}
            <div className="bg-[#12141a] p-4 rounded border border-[#c5a059]/25 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h3 className="font-cinzel-decorative text-base font-bold text-[#c5a059]">
                            {equipmentData?.class_name || className} Starting Gear & Arsenal
                        </h3>
                        <p className="text-xs text-[#d1cdb8]/80 mt-0.5">
                            Starting Wealth:{" "}
                            <span className="text-[#c5a059] font-bold font-fira-sans">
                                {equipmentData?.starting_gold.min || 10}-{equipmentData?.starting_gold.max || 100} gp
                            </span>
                        </p>
                    </div>
                    {canUseShield && (
                        <div className="flex items-center gap-2 bg-[#0c0d12]/70 border border-[#c5a059]/30 px-3 py-1.5 rounded-lg">
                            <input
                                type="checkbox"
                                id="include-shield-toggle"
                                checked={Boolean(formData.include_shield)}
                                onChange={(e) => updateFormData({ include_shield: e.target.checked })}
                                className="w-4 h-4 rounded border-[#c5a059]/60 text-[#c5a059] focus:ring-[#c5a059]/30 bg-[#181a21] cursor-pointer"
                            />
                            <label
                                htmlFor="include-shield-toggle"
                                className="text-xs text-[#d1cdb8] font-semibold cursor-pointer flex items-center gap-1.5"
                            >
                                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Equip Shield (+2 AC)</span>
                            </label>
                        </div>
                    )}
                </div>

                {equipmentData && equipmentData.default_items && equipmentData.default_items.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#c5a059]/15">
                        <p className="text-[10px] font-semibold text-[#c5a059] uppercase tracking-wider mb-1">
                            Class Provisions Automatically Included:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {equipmentData.default_items.map((item, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-[#181a21] border border-slate-700/60 text-[11px] text-[#d1cdb8]/90 font-medium"
                                >
                                    {item.name} {item.quantity > 1 && `(×${item.quantity})`}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* DEDICATED STARTING WEAPON SELECTION SECTION */}
            <div className="bg-[#12141a] border border-[#c5a059]/30 rounded-lg p-4 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#c5a059]/20">
                    <div className="flex items-center gap-2">
                        <Swords className="w-4 h-4 text-[#c5a059]" />
                        <h4 className="font-cinzel text-sm font-bold uppercase tracking-wider text-[#c5a059]">
                            Starting Weapons Arsenal
                        </h4>
                    </div>
                    <span className="text-[11px] text-slate-400">
                        {proficientWeapons.length} proficient weapons available
                    </span>
                </div>

                {/* Weapons Slots Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary Weapon Slot */}
                    <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#c5a059] font-cinzel uppercase tracking-wider">
                                Primary Weapon <span className="text-rose-400">*</span>
                            </span>
                            <span className="text-[10px] text-slate-400">Required</span>
                        </div>

                        {formData.primary_weapon ? (
                            <div className="relative p-3.5 rounded-lg border border-[#c5a059]/50 bg-[#161822] shadow-[0_0_15px_rgba(197,160,89,0.1)] flex flex-col justify-between group hover:border-[#c5a059] transition-all">
                                <div className="space-y-1.5">
                                    <div className="flex items-start justify-between">
                                        <h5 className="font-cinzel text-sm font-bold text-slate-100 flex items-center gap-1.5">
                                            <span>⚔️</span> {formData.primary_weapon}
                                        </h5>
                                        {selectedPrimaryObj?.damage_dice && (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold font-fira-sans bg-amber-950/40 border border-amber-500/40 text-amber-300">
                                                {selectedPrimaryObj.damage_dice} {selectedPrimaryObj.damage_type || ""}
                                            </span>
                                        )}
                                    </div>

                                    {/* Weapon attributes */}
                                    <div className="flex flex-wrap gap-1 text-[10px]">
                                        {selectedPrimaryObj?.weapon_type_display && (
                                            <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300">
                                                {selectedPrimaryObj.weapon_type_display}
                                            </span>
                                        )}
                                        {selectedPrimaryObj?.versatile_damage && (
                                            <span className="px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/40 text-indigo-300">
                                                Versatile ({selectedPrimaryObj.versatile_damage})
                                            </span>
                                        )}
                                        {selectedPrimaryObj?.finesse && (
                                            <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                                                Finesse
                                            </span>
                                        )}
                                        {selectedPrimaryObj?.reach && (
                                            <span className="px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300">
                                                Reach
                                            </span>
                                        )}
                                        {selectedPrimaryObj?.thrown && (
                                            <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
                                                Thrown ({selectedPrimaryObj.range_normal || 20}/{selectedPrimaryObj.range_long || 60})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setPickerSlot("primary");
                                        setWeaponFilter("all");
                                        setWeaponSearch("");
                                    }}
                                    className="mt-3 w-full py-1.5 px-3 rounded text-xs font-semibold font-lora border border-[#c5a059]/40 bg-[#c5a059]/10 text-[#c5a059] hover:bg-[#c5a059]/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <span>Change Primary Weapon</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setPickerSlot("primary");
                                    setWeaponFilter("all");
                                    setWeaponSearch("");
                                }}
                                className="w-full h-32 rounded-lg border-2 border-dashed border-[#c5a059]/40 hover:border-[#c5a059] bg-[#0c0d12]/60 hover:bg-[#c5a059]/5 flex flex-col items-center justify-center gap-2 text-[#c5a059] transition-all cursor-pointer group"
                            >
                                <Swords className="w-6 h-6 text-[#c5a059]/70 group-hover:scale-110 transition-transform" />
                                <span className="font-cinzel text-xs font-bold tracking-wider">
                                    + Choose Primary Weapon
                                </span>
                                <span className="text-[10px] text-slate-400">Click to browse proficient weapons</span>
                            </button>
                        )}
                    </div>

                    {/* Secondary Weapon Slot */}
                    <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#c5a059] font-cinzel uppercase tracking-wider">
                                Secondary / Ranged Weapon
                            </span>
                            <span className="text-[10px] text-slate-400">Optional</span>
                        </div>

                        {formData.secondary_weapon ? (
                            <div className="relative p-3.5 rounded-lg border border-[#c5a059]/40 bg-[#161822] shadow-[0_0_15px_rgba(197,160,89,0.08)] flex flex-col justify-between group hover:border-[#c5a059] transition-all">
                                <div className="space-y-1.5">
                                    <div className="flex items-start justify-between">
                                        <h5 className="font-cinzel text-sm font-bold text-slate-100 flex items-center gap-1.5">
                                            <span>🗡️</span> {formData.secondary_weapon}
                                        </h5>
                                        {selectedSecondaryObj?.damage_dice && (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold font-fira-sans bg-amber-950/40 border border-amber-500/40 text-amber-300">
                                                {selectedSecondaryObj.damage_dice} {selectedSecondaryObj.damage_type || ""}
                                            </span>
                                        )}
                                    </div>

                                    {/* Weapon attributes */}
                                    <div className="flex flex-wrap gap-1 text-[10px]">
                                        {selectedSecondaryObj?.weapon_type_display && (
                                            <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300">
                                                {selectedSecondaryObj.weapon_type_display}
                                            </span>
                                        )}
                                        {selectedSecondaryObj?.finesse && (
                                            <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                                                Finesse
                                            </span>
                                        )}
                                        {selectedSecondaryObj?.thrown && (
                                            <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
                                                Thrown ({selectedSecondaryObj.range_normal || 20}/{selectedSecondaryObj.range_long || 60})
                                            </span>
                                        )}
                                        {selectedSecondaryObj?.range_normal && selectedSecondaryObj.range_normal > 10 && !selectedSecondaryObj.thrown && (
                                            <span className="px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300">
                                                Range ({selectedSecondaryObj.range_normal}/{selectedSecondaryObj.range_long})
                                            </span>
                                        )}
                                    </div>

                                    {/* Auto ammo alert */}
                                    {/bow|crossbow|sling/i.test(formData.secondary_weapon) && (
                                        <p className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1 pt-1">
                                            <span>🏹</span> 20 Ammunition automatically supplied with this weapon
                                        </p>
                                    )}
                                </div>

                                <div className="mt-3 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPickerSlot("secondary");
                                            setWeaponFilter("all");
                                            setWeaponSearch("");
                                        }}
                                        className="flex-1 py-1.5 px-2 rounded text-xs font-semibold font-lora border border-[#c5a059]/40 bg-[#c5a059]/10 text-[#c5a059] hover:bg-[#c5a059]/20 transition-all cursor-pointer"
                                    >
                                        Change Weapon
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateFormData({ secondary_weapon: undefined })}
                                        className="py-1.5 px-2.5 rounded text-xs font-semibold font-lora border border-slate-700/60 text-slate-400 hover:text-rose-300 hover:border-rose-500/40 transition-all cursor-pointer"
                                        title="Remove secondary weapon"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setPickerSlot("secondary");
                                    setWeaponFilter("all");
                                    setWeaponSearch("");
                                }}
                                className="w-full h-32 rounded-lg border-2 border-dashed border-slate-700/60 hover:border-[#c5a059]/60 bg-[#0c0d12]/40 hover:bg-[#c5a059]/5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-[#c5a059] transition-all cursor-pointer group"
                            >
                                <Crosshair className="w-6 h-6 text-slate-500 group-hover:text-[#c5a059]/80 group-hover:scale-110 transition-transform" />
                                <span className="font-cinzel text-xs font-semibold">
                                    + Choose Secondary / Ranged
                                </span>
                                <span className="text-[10px] text-slate-500">Bow, crossbow, daggers, etc.</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* REMAINING NON-WEAPON EQUIPMENT CHOICES (Armor, Packs, Tools) */}
            {nonWeaponChoices.map((choice) => (
                <div key={choice.choice_number} className="bg-[#12141a] border border-[#c5a059]/25 rounded-lg p-4">
                    <Label className="text-xs font-semibold text-[#c5a059] uppercase tracking-wider mb-3 block">
                        Choice {choice.choice_number}: {choice.description}
                    </Label>
                    <RadioGroup
                        value={formData.equipment_selections[choice.choice_number.toString()] || ""}
                        onValueChange={(value) => handleChoiceChange(choice.choice_number, value)}
                    >
                        {choice.options.map((option, idx) => (
                            <div
                                key={idx}
                                className={`flex flex-col p-3 rounded-lg border transition-all ${
                                    formData.equipment_selections[choice.choice_number.toString()] === option.label
                                        ? "border-[#c5a059] bg-[#c5a059]/10 shadow-[0_0_12px_rgba(197,160,89,0.15)]"
                                        : "border-[#c5a059]/15 bg-[#0c0d12]/40 hover:border-[#c5a059]/35"
                                }`}
                            >
                                <div className="flex items-start space-x-3">
                                    <RadioGroupItem
                                        value={option.label}
                                        id={`choice-${choice.choice_number}-${idx}`}
                                        className="mt-1 text-[#c5a059] border-[#c5a059]/50"
                                    />
                                    <div className="flex-1">
                                        <label
                                            htmlFor={`choice-${choice.choice_number}-${idx}`}
                                            className="text-xs text-[#d1cdb8] font-semibold cursor-pointer block"
                                        >
                                            {option.label}
                                        </label>

                                        {option.items && option.items.length > 0 && (
                                            <ul className="text-xs text-[#d1cdb8]/70 mt-1 ml-4 list-disc space-y-0.5">
                                                {option.items.map((item, itemIdx) => (
                                                    <li key={itemIdx}>
                                                        {item.name} {item.quantity > 1 && `(×${item.quantity})`}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {option.pack && (
                                            <div className="mt-1">
                                                <p className="text-xs text-[#c5a059] font-medium">📦 {option.pack}</p>
                                                {equipmentData?.pack_definitions &&
                                                    equipmentData.pack_definitions[option.pack] && (
                                                        <div className="mt-1.5 text-xs text-[#d1cdb8]/70 bg-[#0c0d12] p-2.5 rounded border border-[#c5a059]/20">
                                                            <span className="font-semibold text-[#d1cdb8]/50 uppercase tracking-wider text-[10px]">
                                                                Contains:
                                                            </span>
                                                            <ul className="grid grid-cols-2 gap-x-2 mt-1 text-[11px]">
                                                                {equipmentData.pack_definitions[option.pack].items.map(
                                                                    (packItem, pIdx) => (
                                                                        <li key={pIdx}>
                                                                            {packItem.name}{" "}
                                                                            {packItem.quantity > 1 && (
                                                                                <span className="text-[#c5a059]">
                                                                                    ×{packItem.quantity}
                                                                                </span>
                                                                            )}
                                                                        </li>
                                                                    )
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sub-choices if any non-weapon choice requires one */}
                                {option.additional_choice &&
                                    formData.equipment_selections[choice.choice_number.toString()] === option.label && (
                                        <div className="mt-3 ml-7 space-y-2">
                                            {Array.from({ length: option.additional_choice.count || 1 }).map((_, subIdx) => (
                                                <div key={subIdx} className="bg-[#0c0d12] p-2.5 rounded border border-[#c5a059]/25">
                                                    <Label className="text-[10px] font-semibold text-[#c5a059] mb-1 block uppercase tracking-wider">
                                                        {option.additional_choice?.prompt || "Make a selection"}{" "}
                                                        {option.additional_choice!.count &&
                                                        option.additional_choice!.count > 1
                                                            ? `#${subIdx + 1}`
                                                            : ""}
                                                    </Label>
                                                    <select
                                                        className="w-full bg-[#12141a] border border-[#c5a059]/30 rounded px-2.5 py-1.5 text-xs text-[#d1cdb8] focus:border-[#c5a059] focus:outline-none font-lora"
                                                        value={
                                                            formData.equipment_selections[
                                                                `${choice.choice_number}_sub_${subIdx}`
                                                            ] || ""
                                                        }
                                                        onChange={(e) =>
                                                            handleSubSelection(choice.choice_number, subIdx, e.target.value)
                                                        }
                                                    >
                                                        <option value="">-- Make selection --</option>
                                                        {proficientWeapons.map((w) => (
                                                            <option key={w.id} value={w.name}>
                                                                {w.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            ))}

            {/* Validation Alert */}
            {!isStepValid && (
                <div className="bg-amber-950/40 border border-amber-500/40 text-amber-300 p-3 rounded-lg text-xs font-lora flex items-center gap-2">
                    <span>⚠️</span>
                    <span>
                        {!isPrimarySelected
                            ? "Please choose a Primary Weapon before proceeding."
                            : "Please make all equipment package choices before proceeding."}
                    </span>
                </div>
            )}

            {/* Navigation Actions */}
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
                    onClick={onNext}
                    disabled={!isStepValid}
                    className="px-6 py-2 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_15px_rgba(197,160,89,0.3)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-lora flex items-center gap-1.5"
                >
                    <span>Next: Spells / Review</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* INTERACTIVE WEAPON PICKER MODAL */}
            {pickerSlot && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
                    <div className="bg-[#0f1118] border-2 border-[#c5a059]/50 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.9)] max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-4 bg-[#141622] border-b border-[#c5a059]/30 flex items-center justify-between">
                            <div>
                                <h4 className="font-cinzel text-base font-bold text-[#c5a059] flex items-center gap-2">
                                    <Swords className="w-4 h-4 text-[#c5a059]" />
                                    <span>
                                        Select {pickerSlot === "primary" ? "Primary" : "Secondary / Ranged"} Weapon
                                    </span>
                                </h4>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Proficient choices for <strong className="text-slate-200">{className}</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPickerSlot(null)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="p-3 bg-[#11131c] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                            {/* Filter Tabs */}
                            <div className="flex items-center gap-1 bg-[#181a26] p-1 rounded-lg border border-slate-700/60">
                                {(["all", "melee", "ranged", "finesse"] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setWeaponFilter(tab)}
                                        className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-all cursor-pointer ${
                                            weaponFilter === tab
                                                ? "bg-[#c5a059] text-slate-950 shadow-md"
                                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                                        }`}
                                    >
                                        {tab === "all" ? `All (${proficientWeapons.length})` : tab}
                                    </button>
                                ))}
                            </div>

                            {/* Search Input */}
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search weapons by name, damage..."
                                    value={weaponSearch}
                                    onChange={(e) => setWeaponSearch(e.target.value)}
                                    className="w-full bg-[#181a26] border border-slate-700/70 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#c5a059] font-lora"
                                />
                                {weaponSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setWeaponSearch("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Weapons Grid */}
                        <div className="p-4 overflow-y-auto flex-1 min-h-[300px]">
                            {filteredWeapons.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <p className="text-sm">No weapons found matching your criteria.</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setWeaponFilter("all");
                                            setWeaponSearch("");
                                        }}
                                        className="mt-2 text-xs text-[#c5a059] hover:underline"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {filteredWeapons.map((weapon) => {
                                        const currentVal =
                                            pickerSlot === "primary"
                                                ? formData.primary_weapon
                                                : formData.secondary_weapon;
                                        const isSelected =
                                            currentVal?.toLowerCase() === weapon.name.toLowerCase();

                                        return (
                                            <div
                                                key={weapon.id}
                                                onClick={() => handleSelectWeapon(weapon.name)}
                                                className={`p-3 rounded-lg border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                                                    isSelected
                                                        ? "border-[#c5a059] bg-[#c5a059]/15 shadow-[0_0_15px_rgba(197,160,89,0.25)] ring-1 ring-[#c5a059]"
                                                        : "border-slate-800 bg-[#141622]/80 hover:border-[#c5a059]/50 hover:bg-[#181b2a]"
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between gap-1">
                                                        <span className="font-cinzel text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5">
                                                            {weapon.name}
                                                        </span>
                                                        {weapon.damage_dice && (
                                                            <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-bold font-fira-sans bg-amber-950/60 border border-amber-500/40 text-amber-300">
                                                                {weapon.damage_dice}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                                                        <span className="capitalize">
                                                            {weapon.weapon_type_display ||
                                                                weapon.weapon_type.replace("_", " ")}
                                                        </span>
                                                        {weapon.damage_type && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-slate-300 capitalize">
                                                                    {weapon.damage_type}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Properties */}
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {weapon.finesse && (
                                                            <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-[9px] text-emerald-300 font-semibold">
                                                                Finesse
                                                            </span>
                                                        )}
                                                        {weapon.versatile_damage && (
                                                            <span className="px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/40 text-[9px] text-indigo-300 font-semibold">
                                                                Versatile ({weapon.versatile_damage})
                                                            </span>
                                                        )}
                                                        {weapon.reach && (
                                                            <span className="px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-[9px] text-blue-300 font-semibold">
                                                                Reach
                                                            </span>
                                                        )}
                                                        {weapon.thrown && (
                                                            <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-[9px] text-amber-300 font-semibold">
                                                                Thrown ({weapon.range_normal || 20}/
                                                                {weapon.range_long || 60})
                                                            </span>
                                                        )}
                                                        {weapon.two_handed && (
                                                            <span className="px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-[9px] text-purple-300 font-semibold">
                                                                Two-Handed
                                                            </span>
                                                        )}
                                                        {weapon.light && (
                                                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-300">
                                                                Light
                                                            </span>
                                                        )}
                                                        {weapon.heavy && (
                                                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-300">
                                                                Heavy
                                                            </span>
                                                        )}
                                                        {weapon.range_normal &&
                                                            weapon.range_normal > 10 &&
                                                            !weapon.thrown && (
                                                                <span className="px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-[9px] text-blue-300 font-semibold">
                                                                    Range {weapon.range_normal}/{weapon.range_long}
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>

                                                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                                                    <span className="text-[10px] text-slate-500 font-fira-sans">
                                                        Weight: {weapon.weight || 1} lbs
                                                    </span>
                                                    <span
                                                        className={`text-xs font-cinzel font-bold flex items-center gap-1 ${
                                                            isSelected ? "text-[#c5a059]" : "text-slate-400"
                                                        }`}
                                                    >
                                                        {isSelected ? (
                                                            <>
                                                                <Check className="w-3.5 h-3.5 text-[#c5a059]" />
                                                                <span>Selected</span>
                                                            </>
                                                        ) : (
                                                            <span>Select →</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-3 bg-[#141622] border-t border-[#c5a059]/20 flex items-center justify-between">
                            {pickerSlot === "secondary" && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        updateFormData({ secondary_weapon: undefined });
                                        setPickerSlot(null);
                                    }}
                                    className="px-3 py-1.5 rounded text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-700/60 hover:border-slate-500"
                                >
                                    Set to None (No secondary weapon)
                                </button>
                            )}
                            <div className="ml-auto">
                                <button
                                    type="button"
                                    onClick={() => setPickerSlot(null)}
                                    className="px-4 py-1.5 rounded text-xs font-bold text-slate-950 bg-[#c5a059] hover:bg-[#d6b16a] transition-all cursor-pointer font-cinzel"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
