"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dices } from "lucide-react";
import api from "@/lib/api/client";
import type { CharacterFormData } from "../CharacterCreationWizard";

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
        }
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
    isRandomizingStep
}: EquipmentSelectionStepProps) {
    const [equipmentData, setEquipmentData] = useState<EquipmentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [simpleWeapons, setSimpleWeapons] = useState<{ id: number; name: string }[]>([]);
    const [martialWeapons, setMartialWeapons] = useState<{ id: number; name: string }[]>([]);

    useEffect(() => {
        loadEquipmentChoices();
        loadWeapons();
    }, []);

    const loadWeapons = async () => {
        try {
            const [simpleRes, martialRes] = await Promise.all([
                api.get('/weapons/?category=simple'),
                api.get('/weapons/?category=martial')
            ]);
            setSimpleWeapons(simpleRes.data.results || simpleRes.data);
            setMartialWeapons(martialRes.data.results || martialRes.data);
        } catch (err) {
            console.error("Failed to load weapons", err);
        }
    };

    const loadEquipmentChoices = async () => {
        try {
            // We need to get the class name from formData
            // First, fetch the class details
            const classResponse = await api.get(`/character-classes/${formData.character_class_id}/`);
            const className = classResponse.data.name;

            // Fetch equipment choices for this class
            const response = await api.get(`/characters/starting_equipment_choices/?class_name=${className}`);
            setEquipmentData(response.data);
        } catch (err: any) {
            console.error("Failed to load equipment choices:", err);
            setError(err.response?.data?.error || err.message || "Failed to load equipment options");
        } finally {
            setLoading(false);
        }
    };

    const handleChoiceChange = (choiceNumber: number, selectedOption: string) => {
        // Clear sub-selection for this choice if changing option
        const newSelections = { ...formData.equipment_selections };

        // Remove old sub-selection keys -> e.g. "1_sub_0", "1_sub_1"
        Object.keys(newSelections).forEach(key => {
            if (key.startsWith(`${choiceNumber}_sub_`)) {
                delete newSelections[key];
            }
        });

        updateFormData({
            equipment_selections: {
                ...newSelections,
                [choiceNumber.toString()]: selectedOption
            }
        });
    };

    const handleSubSelection = (choiceNumber: number, index: number, value: string) => {
        updateFormData({
            equipment_selections: {
                ...formData.equipment_selections,
                [`${choiceNumber}_sub_${index}`]: value
            }
        });
    };

    const allChoicesSelected = equipmentData
        ? equipmentData.choices.every(choice => {
            const selectedLabel = formData.equipment_selections[choice.choice_number.toString()];
            if (!selectedLabel) return false;

            // Check if selected option has additional choice
            const option = choice.options.find(o => o.label === selectedLabel);
            if (option && option.additional_choice) {
                const count = option.additional_choice.count || 1;
                for (let i = 0; i < count; i++) {
                    if (!formData.equipment_selections[`${choice.choice_number}_sub_${i}`]) {
                        return false;
                    }
                }
            }
            return true;
        })
        : false;

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !equipmentData) {
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

    return (
        <div className="space-y-6">
            {/* Class Info */}
            <div className="bg-[#12141a] p-4 rounded border border-[#c5a059]/25 font-lora">
                <h3 className="font-cinzel-decorative text-base font-bold text-[#c5a059] mb-1">{equipmentData.class_name} Starting Equipment</h3>
                <p className="text-xs text-[#d1cdb8]/80">
                    Starting Gold: <span className="text-[#c5a059] font-bold font-fira-sans">{equipmentData.starting_gold.min}-{equipmentData.starting_gold.max} gp</span>
                </p>
                {equipmentData.default_items.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-[#c5a059]/15">
                        <p className="text-xs font-semibold text-[#d1cdb8] uppercase tracking-wider mb-1">Automatically Included:</p>
                        <ul className="list-disc list-inside text-xs text-[#d1cdb8]/70 space-y-0.5">
                            {equipmentData.default_items.map((item, idx) => (
                                <li key={idx}>{item.name} {item.quantity > 1 && `(×${item.quantity})`}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Equipment Choices */}
            {equipmentData.choices.map((choice) => (
                <div key={choice.choice_number} className="bg-[#12141a] border border-[#c5a059]/25 rounded p-4 font-lora">
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
                                className={`flex flex-col p-3 rounded border transition-all ${
                                    formData.equipment_selections[choice.choice_number.toString()] === option.label
                                        ? "border-[#c5a059] bg-[#c5a059]/10 shadow-[0_0_12px_rgba(197,160,89,0.15)]"
                                        : "border-[#c5a059]/15 bg-[#0c0d12]/40 hover:border-[#c5a059]/35"
                                }`}
                            >
                                <div className="flex items-start space-x-3">
                                    <RadioGroupItem value={option.label} id={`choice-${choice.choice_number}-${idx}`} className="mt-1 text-[#c5a059] border-[#c5a059]/50" />
                                    <div className="flex-1">
                                        <label
                                            htmlFor={`choice-${choice.choice_number}-${idx}`}
                                            className="text-xs text-[#d1cdb8] font-semibold cursor-pointer block"
                                        >
                                            {option.label}
                                        </label>

                                        {option.items && (
                                            <ul className="text-xs text-[#d1cdb8]/70 mt-1 ml-4 list-disc">
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

                                                {/* Show pack contents if available */}
                                                {equipmentData.pack_definitions && equipmentData.pack_definitions[option.pack] && (
                                                    <div className="mt-1.5 text-xs text-[#d1cdb8]/70 bg-[#0c0d12] p-2.5 rounded border border-[#c5a059]/20">
                                                        <span className="font-semibold text-[#d1cdb8]/50 uppercase tracking-wider text-[10px]">Contains:</span>
                                                        <ul className="grid grid-cols-2 gap-x-2 mt-1 text-[11px]">
                                                            {equipmentData.pack_definitions[option.pack].items.map((packItem, pIdx) => (
                                                                <li key={pIdx}>
                                                                    {packItem.name} {packItem.quantity > 1 && <span className="text-[#c5a059]">×{packItem.quantity}</span>}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sub-choice Dropdowns */}
                                {option.additional_choice && formData.equipment_selections[choice.choice_number.toString()] === option.label && (
                                    <div className="mt-3 ml-7 space-y-2">
                                        {Array.from({ length: option.additional_choice.count || 1 }).map((_, subIdx) => (
                                            <div key={subIdx} className="bg-[#0c0d12] p-2.5 rounded border border-[#c5a059]/25">
                                                <Label className="text-[10px] font-semibold text-[#c5a059] mb-1 block uppercase tracking-wider">
                                                    {option.additional_choice?.prompt || "Make a selection"} {option.additional_choice!.count && option.additional_choice!.count > 1 ? `#${subIdx + 1}` : ''}
                                                </Label>
                                                <select
                                                    className="w-full bg-[#12141a] border border-[#c5a059]/30 rounded px-2.5 py-1.5 text-xs text-[#d1cdb8] focus:border-[#c5a059] focus:outline-none font-lora"
                                                    value={formData.equipment_selections[`${choice.choice_number}_sub_${subIdx}`] || ""}
                                                    onChange={(e) => handleSubSelection(choice.choice_number, subIdx, e.target.value)}
                                                >
                                                    <option value="">-- Select Weapon --</option>
                                                    {(option.additional_choice?.category === 'simple' ? simpleWeapons : martialWeapons).map(w => (
                                                        <option key={w.id} value={w.name}>{w.name}</option>
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

            {/* Validation Warning */}
            {!allChoicesSelected && (
                <div className="bg-amber-950/40 border border-amber-500/40 text-amber-300 p-3 rounded text-xs font-lora">
                    ⚠️ Please make all equipment selections before proceeding
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
                    onClick={onNext}
                    disabled={!allChoicesSelected}
                    className="px-6 py-2 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_15px_rgba(197,160,89,0.3)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-lora"
                >
                    Next: Review →
                </button>
            </div>
        </div>
    );
}
