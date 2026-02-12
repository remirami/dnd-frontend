"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { CharacterFormData } from "../CharacterCreationWizard";

const ALIGNMENTS = [
    { value: "LG", label: "Lawful Good" },
    { value: "NG", label: "Neutral Good" },
    { value: "CG", label: "Chaotic Good" },
    { value: "LN", label: "Lawful Neutral" },
    { value: "N", label: "True Neutral" },
    { value: "CN", label: "Chaotic Neutral" },
    { value: "LE", label: "Lawful Evil" },
    { value: "NE", label: "Neutral Evil" },
    { value: "CE", label: "Chaotic Evil" },
];

interface PersonalityStepProps {
    formData: CharacterFormData;
    updateFormData: (updates: Partial<CharacterFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function PersonalityStep({ formData, updateFormData, onNext, onBack }: PersonalityStepProps) {
    return (
        <div className="space-y-6">
            {/* Alignment */}
            <div className="space-y-2">
                <Label htmlFor="alignment" className="text-white">Alignment</Label>
                <Select
                    value={formData.alignment}
                    onValueChange={(value) => updateFormData({ alignment: value })}
                >
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue placeholder="Select alignment" />
                    </SelectTrigger>
                    <SelectContent>
                        {ALIGNMENTS.map((a) => (
                            <SelectItem key={a.value} value={a.value}>
                                {a.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">How your character views law, chaos, good, and evil.</p>
            </div>

            {/* Bonds */}
            <div className="space-y-2">
                <Label htmlFor="bonds" className="text-white">
                    Bonds <span className="text-slate-500 text-xs">(optional)</span>
                </Label>
                <Textarea
                    id="bonds"
                    value={formData.bonds}
                    onChange={(e) => updateFormData({ bonds: e.target.value })}
                    placeholder="What connections do you have to people, places, or events?"
                    className="min-h-[80px] bg-slate-900 border-slate-700 text-white"
                />
            </div>

            {/* Flaws */}
            <div className="space-y-2">
                <Label htmlFor="flaws" className="text-white">
                    Flaws <span className="text-slate-500 text-xs">(optional)</span>
                </Label>
                <Textarea
                    id="flaws"
                    value={formData.flaws}
                    onChange={(e) => updateFormData({ flaws: e.target.value })}
                    placeholder="What are your character's weaknesses or vices?"
                    className="min-h-[80px] bg-slate-900 border-slate-700 text-white"
                />
            </div>

            {/* Ideals */}
            <div className="space-y-2">
                <Label htmlFor="ideals" className="text-white">
                    Ideals <span className="text-slate-500 text-xs">(optional)</span>
                </Label>
                <Textarea
                    id="ideals"
                    value={formData.ideals}
                    onChange={(e) => updateFormData({ ideals: e.target.value })}
                    placeholder="What beliefs or principles drive your character?"
                    className="min-h-[80px] bg-slate-900 border-slate-700 text-white"
                />
            </div>

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
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    Next: Ability Scores →
                </Button>
            </div>
        </div>
    );
}
