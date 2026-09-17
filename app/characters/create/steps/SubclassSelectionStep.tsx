"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import api from "@/lib/api/client";
import type { CharacterFormData } from "../CharacterCreationWizard";

interface SubclassSelectionStepProps {
    formData: CharacterFormData;
    updateFormData: (updates: Partial<CharacterFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

interface SubclassOption {
    id: string;
    name: string;
    description: string;
}

export default function SubclassSelectionStep({ formData, updateFormData, onNext, onBack }: SubclassSelectionStepProps) {
    const [subclasses, setSubclasses] = useState<SubclassOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (formData.character_class_id) {
            fetchSubclasses();
        }
    }, [formData.character_class_id, formData.ruleset_version]);

    const fetchSubclasses = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get(`/character-classes/${formData.character_class_id}/subclasses/?ruleset=${formData.ruleset_version || '2014'}`);
            setSubclasses(response.data);

            // Auto-skip if no subclasses available? 
            // Better to let parent handle skipping, but if we are here and there are none, show message.
        } catch (err) {
            console.error("Failed to fetch subclasses", err);
            setError("Failed to load subclass options.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (subclassId: string) => {
        // In 2014, subclass is stored as text (e.g. "Life Domain")
        // In Model: character.subclass = 'Life Domain'
        updateFormData({ subclass: subclassId });
    };

    const currentSelection = formData.subclass;

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="font-cinzel-decorative text-xl font-bold text-[#c5a059]">Choose Your Path</h2>
                <p className="font-lora text-xs text-[#d1cdb8]/70 mt-1">Select a subclass to specialize your character.</p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                    <div className="w-6 h-6 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
                    <p className="font-lora text-xs text-[#d1cdb8]/70 italic">Consulting the archives...</p>
                </div>
            ) : error ? (
                <div className="text-rose-400 text-center font-lora text-sm">{error}</div>
            ) : subclasses.length === 0 ? (
                <div className="text-[#c5a059] text-center font-lora text-sm p-4 bg-[#12141a] rounded border border-[#c5a059]/20">
                    No subclasses available for this class at Level 1 in this ruleset.
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={onNext}
                            className="px-4 py-2 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_12px_rgba(197,160,89,0.3)] cursor-pointer"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subclasses.map((sc) => (
                        <div
                            key={sc.id}
                            className={`p-4 rounded cursor-pointer transition-all border ${
                                currentSelection === sc.id
                                    ? "bg-[#c5a059]/15 border-[#c5a059] ring-1 ring-[#c5a059]/50 shadow-[0_0_15px_rgba(197,160,89,0.25)]"
                                    : "bg-[#12141a] border-[#c5a059]/20 hover:border-[#c5a059]/50 hover:bg-[#c5a059]/5"
                            }`}
                            onClick={() => handleSelect(sc.id)}
                        >
                            <h3 className={`text-base font-semibold mb-2 font-cinzel-decorative transition-colors ${
                                currentSelection === sc.id ? "text-[#c5a059]" : "text-[#d1cdb8]"
                            }`}>
                                {sc.name}
                            </h3>
                            <p className="text-xs text-[#d1cdb8]/75 font-lora leading-relaxed">{sc.description}</p>
                        </div>
                    ))}
                </div>
            )}

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
                    disabled={!currentSelection && subclasses.length > 0}
                    className="px-6 py-2 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_15px_rgba(197,160,89,0.3)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-lora"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
