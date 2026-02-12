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
                <h2 className="text-2xl font-bold text-white">Choose Your Path</h2>
                <p className="text-slate-400">Select a subclass to specialize your character.</p>
            </div>

            {loading ? (
                <div className="text-white text-center">Loading options...</div>
            ) : error ? (
                <div className="text-red-400 text-center">{error}</div>
            ) : subclasses.length === 0 ? (
                <div className="text-yellow-400 text-center">
                    No subclasses available for this class at Level 1 in this ruleset.
                    <div className="mt-4">
                        <Button onClick={onNext}>Continue</Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subclasses.map((sc) => (
                        <Card
                            key={sc.id}
                            className={`p-4 cursor-pointer transition-all border ${currentSelection === sc.id
                                    ? "bg-blue-900/40 border-blue-500 ring-2 ring-blue-500/50"
                                    : "bg-slate-800 border-slate-700 hover:border-slate-500"
                                }`}
                            onClick={() => handleSelect(sc.id)}
                        >
                            <h3 className="text-lg font-semibold text-white mb-2">{sc.name}</h3>
                            <p className="text-sm text-slate-300">{sc.description}</p>
                        </Card>
                    ))}
                </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-700 mt-6">
                <Button onClick={onBack} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    ← Back
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!currentSelection && subclasses.length > 0}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    Next →
                </Button>
            </div>
        </div>
    );
}
