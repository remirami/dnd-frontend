"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
}

export default function EquipmentSelectionStep({ formData, updateFormData, onNext, onBack }: EquipmentSelectionStepProps) {
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
                <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-md">
                    {error || "No equipment data available for this class"}
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-700">
                    <Button
                        onClick={onBack}
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                        ← Back
                    </Button>
                    <Button
                        onClick={onNext}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Skip Equipment →
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Class Info */}
            <div className="bg-slate-700/30 p-4 rounded-md border border-slate-600">
                <h3 className="text-lg font-semibold text-white mb-2">{equipmentData.class_name} Starting Equipment</h3>
                <p className="text-sm text-slate-300">
                    Starting Gold: {equipmentData.starting_gold.min}-{equipmentData.starting_gold.max} gp
                </p>
                {equipmentData.default_items.length > 0 && (
                    <div className="mt-2">
                        <p className="text-sm font-semibold text-slate-200">Automatically Included:</p>
                        <ul className="list-disc list-inside text-sm text-slate-400">
                            {equipmentData.default_items.map((item, idx) => (
                                <li key={idx}>{item.name} {item.quantity > 1 && `(×${item.quantity})`}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Equipment Choices */}
            {equipmentData.choices.map((choice) => (
                <Card key={choice.choice_number} className="bg-slate-800 border-slate-700 p-4">
                    <Label className="text-white font-semibold mb-3 block">
                        Choice {choice.choice_number}: {choice.description}
                    </Label>
                    <RadioGroup
                        value={formData.equipment_selections[choice.choice_number.toString()] || ""}
                        onValueChange={(value) => handleChoiceChange(choice.choice_number, value)}
                    >
                        {choice.options.map((option, idx) => (
                            <div
                                key={idx}
                                className={`flex flex-col p-3 rounded-md border transition-colors ${formData.equipment_selections[choice.choice_number.toString()] === option.label
                                    ? "border-blue-500 bg-blue-900/20"
                                    : "border-slate-600 hover:border-slate-500"
                                    }`}
                            >
                                <div className="flex items-start space-x-3">
                                    <RadioGroupItem value={option.label} id={`choice-${choice.choice_number}-${idx}`} className="mt-1" />
                                    <div className="flex-1">
                                        <label
                                            htmlFor={`choice-${choice.choice_number}-${idx}`}
                                            className="text-white cursor-pointer font-medium block"
                                        >
                                            {option.label}
                                        </label>

                                        {option.items && (
                                            <ul className="text-sm text-slate-400 mt-1 ml-4 list-disc">
                                                {option.items.map((item, itemIdx) => (
                                                    <li key={itemIdx}>
                                                        {item.name} {item.quantity > 1 && `(×${item.quantity})`}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {option.pack && (
                                            <div className="mt-1">
                                                <p className="text-sm text-green-400 font-medium">📦 {option.pack}</p>

                                                {/* Show pack contents if available */}
                                                {equipmentData.pack_definitions && equipmentData.pack_definitions[option.pack] && (
                                                    <div className="mt-1 ml-2 text-xs text-slate-400 bg-slate-900/30 p-2 rounded border border-slate-700/50">
                                                        <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Contains:</span>
                                                        <ul className="grid grid-cols-2 gap-x-2 mt-1">
                                                            {equipmentData.pack_definitions[option.pack].items.map((packItem, pIdx) => (
                                                                <li key={pIdx}>
                                                                    {packItem.name} {packItem.quantity > 1 && <span className="text-slate-500">x{packItem.quantity}</span>}
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
                                    <div className="mt-3 ml-8 space-y-2">
                                        {Array.from({ length: option.additional_choice.count || 1 }).map((_, subIdx) => (
                                            <div key={subIdx} className="bg-slate-900/50 p-2 rounded border border-slate-700">
                                                <Label className="text-xs font-semibold text-blue-400 mb-1 block uppercase tracking-wider">
                                                    {option.additional_choice?.prompt || "Make a selection"} {option.additional_choice!.count && option.additional_choice!.count > 1 ? `#${subIdx + 1}` : ''}
                                                </Label>
                                                <select
                                                    className="w-full bg-slate-800 border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:ring-2 focus:ring-blue-500"
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
                </Card>
            ))}

            {/* Validation Warning */}
            {!allChoicesSelected && (
                <div className="bg-yellow-900/20 border border-yellow-500/50 text-yellow-200 p-3 rounded-md text-sm">
                    ⚠️ Please make all equipment selections before proceeding
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
                    onClick={onNext}
                    disabled={!allChoicesSelected}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    Next: Review →
                </Button>
            </div>
        </div>
    );
}
