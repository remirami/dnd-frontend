"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Import step components (we'll create these)
import BasicInfoStep from "./steps/BasicInfoStep";
import SubclassSelectionStep from "./steps/SubclassSelectionStep";
import PersonalityStep from "./steps/PersonalityStep";
import AbilityScoresStep from "./steps/AbilityScoresStep";
import EquipmentSelectionStep from "./steps/EquipmentSelectionStep";
import SpellSelectionStep from "./steps/SpellSelectionStep";
import ReviewStep from "./steps/ReviewStep";

export interface CharacterFormData {
    // Basic Info
    name: string;
    ruleset_version: string; // '2014' or '2024'
    race_id: number | null;
    character_class_id: number | null;
    character_class_name: string | undefined; // Added for skip logic
    subclass: string | null; // Added for subclass choice
    background_id: number | null;
    background_asi_selection: { [key: string]: number }; // e.g. { strength: 2, constitution: 1 }

    // Personality
    alignment: string;
    bonds: string;
    flaws: string;
    ideals: string;

    // Ability Scores
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    hp_method: string;

    // Equipment Selections
    equipment_selections: { [key: string]: string };

    // Spell Selections
    cantrip_ids: number[];
    spell_ids: number[];

    // Extra Choices
    language_ids: number[];
}

const STEPS = [
    { number: 1, name: "Basic Info", description: "Name, race, class, background" },
    { number: 2, name: "Subclass", description: "Choose your specialization" },
    { number: 3, name: "Personality", description: "Alignment, bonds, flaws, ideals" },
    { number: 4, name: "Ability Scores", description: "Strength, dexterity, etc." },
    { number: 5, name: "Equipment", description: "Starting gear" },
    { number: 6, name: "Spells", description: "Select starting spells" },
    { number: 7, name: "Review", description: "Confirm your character" },
];

export default function CharacterCreationWizard() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<CharacterFormData>({
        name: "",
        ruleset_version: "2014",
        race_id: null,
        character_class_id: null,
        character_class_name: undefined,
        subclass: null,
        background_id: null,
        background_asi_selection: {},
        alignment: "N",
        bonds: "",
        flaws: "",
        ideals: "",
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hp_method: "fixed",
        equipment_selections: {},
        cantrip_ids: [],
        spell_ids: [],
        language_ids: [],
    });

    const updateFormData = (updates: Partial<CharacterFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const shouldShowSubclassStep = (data: CharacterFormData) => {
        // Only show for 2014 Cleric, Sorcerer, Warlock (Level 1)
        if (data.ruleset_version === '2014' && data.character_class_name) {
            const cls = data.character_class_name.toLowerCase();
            return ['cleric', 'sorcerer', 'warlock'].includes(cls);
        }
        return false;
    };

    const handleNext = () => {
        if (currentStep < STEPS.length) {
            let nextStep = currentStep + 1;
            // Skip Subclass step (Index 2) if not needed
            if (nextStep === 2 && !shouldShowSubclassStep(formData)) {
                nextStep = 3;
            }
            setCurrentStep(nextStep);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            let prevStep = currentStep - 1;
            // Skip Subclass step (Index 2) if not needed
            if (prevStep === 2 && !shouldShowSubclassStep(formData)) {
                prevStep = 1;
            }
            setCurrentStep(prevStep);
        }
    };

    const progress = (currentStep / STEPS.length) * 100;

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <BasicInfoStep
                        formData={formData}
                        updateFormData={updateFormData}
                        onNext={handleNext}
                    />
                );
            case 2:
                // If we are rendering step 2 but it should be skipped, effect?
                // No, the parent router handles the numbering. We just render the component.
                // But check just in case? No, trust handleNext/Back.
                return (
                    <SubclassSelectionStep
                        formData={formData}
                        updateFormData={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                );
            case 3:
                return (
                    <PersonalityStep
                        formData={formData}
                        updateFormData={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                );
            case 4:
                return (
                    <AbilityScoresStep
                        formData={formData}
                        updateFormData={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                );
            case 5:
                return (
                    <EquipmentSelectionStep
                        formData={formData}
                        updateFormData={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                );
            case 6:
                return (
                    <SpellSelectionStep
                        formData={formData}
                        onUpdate={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                );
            case 7:
                return (
                    <ReviewStep
                        formData={formData}
                        onBack={handleBack}
                        onSubmit={() => {
                            // We'll implement submission in ReviewStep
                        }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Breadcrumb */}
                <div className="mb -4 flex gap-2 text-sm">
                    <Button
                        variant="ghost"
                        className="text-slate-400 hover:text-white p-0 h-auto font-normal"
                        onClick={() => router.push("/")}
                    >
                        Home
                    </Button>
                    <span className="text-slate-600">/</span>
                    <Button
                        variant="ghost"
                        className="text-slate-400 hover:text-white p-0 h-auto font-normal"
                        onClick={() => router.push("/characters")}
                    >
                        Characters
                    </Button>
                    <span className="text-slate-600">/</span>
                    <span className="text-white">Create</span>
                </div>

                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <CardTitle className="text-3xl text-white">Create Character</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
                                </CardDescription>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-400 mb-1">Progress</div>
                                <div className="text-2xl font-bold text-green-400">{Math.round(progress)}%</div>
                            </div>
                        </div>
                        <Progress value={progress} className="h-2" />

                        {/* Step Indicators */}
                        <div className="flex justify-between mt-6">
                            {STEPS.map((step) => (
                                <div
                                    key={step.number}
                                    className={`flex flex-col items-center flex-1 ${step.number < currentStep
                                        ? "text-green-400"
                                        : step.number === currentStep
                                            ? "text-white"
                                            : "text-slate-500"
                                        }`}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${step.number < currentStep
                                            ? "bg-green-600"
                                            : step.number === currentStep
                                                ? "bg-blue-600"
                                                : "bg-slate-700"
                                            }`}
                                    >
                                        {step.number < currentStep ? "✓" : step.number}
                                    </div>
                                    <div className="text-xs text-center hidden sm:block">{step.name}</div>
                                </div>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="text-white">
                        {renderStep()}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
