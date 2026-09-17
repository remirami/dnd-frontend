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
                <Label htmlFor="alignment" className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider">Alignment</Label>
                <Select
                    value={formData.alignment}
                    onValueChange={(value) => updateFormData({ alignment: value })}
                >
                    <SelectTrigger className="bg-[#0c0d12] border-[#c5a059]/30 text-slate-100 focus:border-[#c5a059] font-lora text-sm h-10">
                        <SelectValue placeholder="Select alignment" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181a21] border border-[#c5a059]/40 text-[#d1cdb8] font-lora">
                        {ALIGNMENTS.map((a) => (
                            <SelectItem key={a.value} value={a.value}>
                                {a.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-[#d1cdb8]/60 font-lora italic">How your character views law, chaos, good, and evil.</p>
            </div>

            {/* Bonds */}
            <div className="space-y-2">
                <Label htmlFor="bonds" className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider">
                    Bonds <span className="text-[#d1cdb8]/40 lowercase text-[10px]">(optional)</span>
                </Label>
                <Textarea
                    id="bonds"
                    value={formData.bonds}
                    onChange={(e) => updateFormData({ bonds: e.target.value })}
                    placeholder="What connections do you have to people, places, or events?"
                    className="min-h-[80px] bg-[#0c0d12] border-[#c5a059]/30 text-slate-100 placeholder:text-slate-600 focus:border-[#c5a059] focus:ring-[#c5a059]/20 font-lora text-sm"
                />
            </div>

            {/* Flaws */}
            <div className="space-y-2">
                <Label htmlFor="flaws" className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider">
                    Flaws <span className="text-[#d1cdb8]/40 lowercase text-[10px]">(optional)</span>
                </Label>
                <Textarea
                    id="flaws"
                    value={formData.flaws}
                    onChange={(e) => updateFormData({ flaws: e.target.value })}
                    placeholder="What are your character's weaknesses or vices?"
                    className="min-h-[80px] bg-[#0c0d12] border-[#c5a059]/30 text-slate-100 placeholder:text-slate-600 focus:border-[#c5a059] focus:ring-[#c5a059]/20 font-lora text-sm"
                />
            </div>

            {/* Ideals */}
            <div className="space-y-2">
                <Label htmlFor="ideals" className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider">
                    Ideals <span className="text-[#d1cdb8]/40 lowercase text-[10px]">(optional)</span>
                </Label>
                <Textarea
                    id="ideals"
                    value={formData.ideals}
                    onChange={(e) => updateFormData({ ideals: e.target.value })}
                    placeholder="What beliefs or principles drive your character?"
                    className="min-h-[80px] bg-[#0c0d12] border-[#c5a059]/30 text-slate-100 placeholder:text-slate-600 focus:border-[#c5a059] focus:ring-[#c5a059]/20 font-lora text-sm"
                />
            </div>

            {/* Navigation */}
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
                    className="px-6 py-2 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_15px_rgba(197,160,89,0.3)] cursor-pointer font-lora"
                >
                    Next: Ability Scores →
                </button>
            </div>
        </div>
    );
}
