"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CharacterFormData } from "../CharacterCreationWizard";

const HP_METHODS = [
    { value: "fixed", label: "Fixed (Max Roll)", description: "Always get maximum HP on level up" },
    { value: "average", label: "Average", description: "Get average HP on level up (rounded up)" },
    { value: "manual", label: "Dice Roll", description: "Roll for HP each level" },
];

interface AbilityScoresStepProps {
    formData: CharacterFormData;
    updateFormData: (updates: Partial<CharacterFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

import { backgroundsApi } from "@/lib/api/gamedata";

export default function AbilityScoresStep({ formData, updateFormData, onNext, onBack }: AbilityScoresStepProps) {
    const [method, setMethod] = useState("manual");
    const [pointBuyRemaining, setPointBuyRemaining] = useState(27);
    const [selectedBackground, setSelectedBackground] = useState<any>(null);

    // 2024 Logic
    const is2024 = formData.ruleset_version === '2024';

    useEffect(() => {
        if (is2024 && formData.background_id) {
            backgroundsApi.getAll({ ruleset: '2024' }).then(res => {
                const bgs = res.data?.results || res.data || [];
                const bg = bgs.find((b: any) => b.id === formData.background_id);
                setSelectedBackground(bg);
            });
        }
    }, [formData.background_id, is2024]);

    const getAbilityModifier = (score: number) => Math.floor((score - 10) / 2);
    const formatModifier = (mod: number) => mod >= 0 ? `+${mod}` : `${mod}`;

    // Calculate Total Score (Base + Background ASI)
    const getTotalScore = (stat: string, baseValue: number) => {
        if (!is2024) return baseValue; // 2014 applies bonuses on backend
        const bonus = formData.background_asi_selection?.[stat.toLowerCase()] || 0;
        return baseValue + bonus;
    };

    const getPointCost = (val: number) => {
        if (val < 8) return 0;
        if (val > 15) return 9;
        const costs: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
        return costs[val] || 0;
    };

    useEffect(() => {
        if (method === "point_buy") {
            const used = getPointCost(formData.strength) + getPointCost(formData.dexterity) +
                getPointCost(formData.constitution) + getPointCost(formData.intelligence) +
                getPointCost(formData.wisdom) + getPointCost(formData.charisma);
            setPointBuyRemaining(27 - used);
        }
    }, [formData.strength, formData.dexterity, formData.constitution, formData.intelligence, formData.wisdom, formData.charisma, method]);

    const handleRoll = () => {
        const roll = () => {
            const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
            dice.sort((a, b) => a - b);
            return dice.slice(1).reduce((a, b) => a + b, 0);
        };
        const stats = Array.from({ length: 6 }, roll);
        updateFormData({
            strength: stats[0],
            dexterity: stats[1],
            constitution: stats[2],
            intelligence: stats[3],
            wisdom: stats[4],
            charisma: stats[5],
        });
    };

    const handleASIChange = (stat: string, value: number) => {
        const currentASI = { ...formData.background_asi_selection };

        // Simple logic: If selecting +2, clear any other +2. If selecting +1, allow up to however many.
        // Actually, for MVP, let's just update the value. Validation can happen on "Next".
        currentASI[stat.toLowerCase()] = value;
        updateFormData({ background_asi_selection: currentASI });
    };

    const renderAbilityScore = (name: string, value: number, onChange: (val: number) => void) => {
        const total = getTotalScore(name, value);
        const bonus = is2024 ? (formData.background_asi_selection?.[name.toLowerCase()] || 0) : 0;

        return (
            <div className="space-y-2">
                <Label className="text-white">{name}</Label>
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        min={method === "point_buy" ? "8" : "3"}
                        max={method === "point_buy" ? "15" : "20"}
                        value={value}
                        onChange={(e) => onChange(parseInt(e.target.value) || 8)}
                        className="flex-1 bg-slate-900 border-slate-700 text-white"
                    />

                    {/* ASI Selector for 2024 */}
                    {is2024 && selectedBackground && (
                        <Select
                            value={bonus.toString()}
                            onValueChange={(v) => handleASIChange(name, parseInt(v))}
                        >
                            <SelectTrigger className={`w-20 ${bonus > 0 ? "bg-purple-900/50 border-purple-500" : "bg-slate-800 border-slate-700"} text-xs h-10`}>
                                <SelectValue placeholder="+0" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">+0</SelectItem>
                                <SelectItem value="1">+1</SelectItem>
                                <SelectItem value="2">+2</SelectItem>
                            </SelectContent>
                        </Select>
                    )}

                    <div className="w-16 text-center text-sm font-bold bg-slate-700 text-white rounded p-2 border border-slate-600">
                        {formatModifier(getAbilityModifier(total))}
                    </div>
                </div>
                {is2024 && bonus > 0 && <div className="text-xs text-purple-400 text-right">Total: {total}</div>}
            </div>
        );
    };

    // Validate point buy: ensure points are not negative or all stats are valid
    const canProceed = method === "point_buy" ? pointBuyRemaining >= 0 && pointBuyRemaining <= 27 : true;

    return (
        <div className="space-y-6">
            {/* 2024 ASI Instructions */}
            {is2024 && selectedBackground && (
                <div className="bg-purple-900/20 border border-purple-500/50 p-3 rounded-md mb-4">
                    <h4 className="text-purple-300 font-bold text-sm mb-1">Background Bonuses</h4>
                    <p className="text-slate-300 text-xs">
                        Your background grants ability score increases. Distribute them below (e.g., one +2 and one +1, or three +1s).
                    </p>
                </div>
            )}

            {/* Method Selection */}
            <div className="flex justify-between items-center">
                <Label className="text-white">Generation Method</Label>
                <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="w-[200px] bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="manual">Manual / Standard Array</SelectItem>
                        <SelectItem value="point_buy">Point Buy</SelectItem>
                        <SelectItem value="rolling">Roll (4d6 drop lowest)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {method === "point_buy" && (
                <div className="bg-slate-700/30 p-3 rounded-md border border-slate-600 text-sm flex justify-between items-center">
                    <span className="text-slate-300">Use 27 points to buy scores (8-15). Cost varies.</span>
                    <span className={`font-bold ${pointBuyRemaining < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        Points: {pointBuyRemaining}/27
                    </span>
                </div>
            )}

            {method === "rolling" && (
                <div className="bg-slate-700/30 p-3 rounded-md border border-slate-600">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-300">Roll 4d6, drop lowest for each score</span>
                        <Button type="button" size="sm" onClick={handleRoll} variant="secondary">
                            Roll Dice 🎲
                        </Button>
                    </div>
                </div>
            )}

            {/* Ability Scores Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderAbilityScore("Strength", formData.strength, (val) => updateFormData({ strength: val }))}
                {renderAbilityScore("Dexterity", formData.dexterity, (val) => updateFormData({ dexterity: val }))}
                {renderAbilityScore("Constitution", formData.constitution, (val) => updateFormData({ constitution: val }))}
                {renderAbilityScore("Intelligence", formData.intelligence, (val) => updateFormData({ intelligence: val }))}
                {renderAbilityScore("Wisdom", formData.wisdom, (val) => updateFormData({ wisdom: val }))}
                {renderAbilityScore("Charisma", formData.charisma, (val) => updateFormData({ charisma: val }))}
            </div>

            {/* HP Method */}
            <div className="space-y-2 pt-4 border-t border-slate-700">
                <Label className="text-white">HP Calculation Method</Label>
                <Select value={formData.hp_method} onValueChange={(value) => updateFormData({ hp_method: value })}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {HP_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                                {method.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">
                    {HP_METHODS.find(m => m.value === formData.hp_method)?.description}
                </p>
            </div>

            {/* Validation Warning for Point Buy */}
            {method === "point_buy" && pointBuyRemaining < 0 && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-3 rounded-md text-sm">
                    ⚠️ You've exceeded your point budget! Reduce some ability scores.
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
                    disabled={!canProceed}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    Next: Equipment →
                </Button>
            </div>
        </div>
    );
}
