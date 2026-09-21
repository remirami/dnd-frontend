import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle, Sparkles } from "lucide-react";
import { CharacterFeature, Character } from "@/lib/types/character";
import { charactersApi } from "@/lib/api/characters";
import { useToast } from "@/components/ui/use-toast";

interface FeatureSelectionDialogProps {
    character: Character;
    feature: CharacterFeature;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
    excludedOptions?: string[];
}

export function FeatureSelectionDialog({
    character,
    feature,
    open,
    onOpenChange,
    onUpdate,
    excludedOptions = []
}: FeatureSelectionDialogProps) {
    const { toast } = useToast();
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        if (open && feature) {
            setSelectedOptions(feature.selection || []);
        }
    }, [open, feature]);

    const handleToggle = (option: string) => {
        setSelectedOptions(prev => {
            if (prev.includes(option)) {
                return prev.filter(item => item !== option);
            } else {
                // Check limit
                if (feature.choice_limit && prev.length >= feature.choice_limit) {
                    return prev; // Do nothing if limit reached
                }
                return [...prev, option];
            }
        });
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await charactersApi.updateFeature(character.id, feature.id, {
                selection: selectedOptions
            });

            toast({
                title: "Feature Updated",
                description: `Successfully updated selections for ${feature.name}.`,
            });
            onUpdate();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to update feature:", error);
            toast({
                title: "Error",
                description: "Failed to save selections. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const limit = feature.choice_limit || 1;
    const currentCount = selectedOptions.length;
    const isFull = currentCount >= limit;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-[#10121a]/98 text-slate-100 border border-[#c5a059]/60 shadow-[0_8px_36px_rgba(0,0,0,0.85)] backdrop-blur-xl font-lora">
                <DialogHeader className="border-b border-[#c5a059]/20 pb-3">
                    <DialogTitle className="font-cinzel text-lg font-bold text-[#c5a059] tracking-wide flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#c5a059]/80" />
                        <span>Select Options: {feature.name}</span>
                    </DialogTitle>
                    <DialogDescription className="font-lora text-xs text-[#d1cdb8]/70 mt-1">
                        Please select {limit} option{limit !== 1 ? 's' : ''} from the list below.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-3 space-y-3">
                    <div className="flex justify-between items-center text-xs font-medium px-0.5">
                        <span className="font-cinzel font-semibold text-[#e0bc75] tracking-wide uppercase text-[11px]">
                            Available Options
                        </span>
                        <span
                            className={`font-fira-sans font-bold px-2 py-0.5 rounded text-xs border ${
                                isFull
                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                                    : 'bg-[#181a24] text-[#c5a059] border-[#c5a059]/30'
                            }`}
                        >
                            {currentCount} / {limit} Selected
                        </span>
                    </div>

                    <div className="border border-[#c5a059]/25 rounded-lg p-1.5 max-h-[300px] overflow-y-auto bg-[#0c0d12]/80 divide-y divide-[#c5a059]/10">
                        {feature.options && feature.options.length > 0 ? (
                            <div className="space-y-1">
                                {feature.options.map((option) => {
                                    const isSelected = selectedOptions.includes(option);
                                    const isExcluded = excludedOptions.includes(option) && !isSelected;

                                    // Disable unselected items if limit is reached OR if excluded
                                    const isDisabled = (!isSelected && isFull) || isExcluded;

                                    return (
                                        <div
                                            key={option}
                                            className={`flex items-start space-x-3 p-2.5 rounded-md transition-all duration-150 border ${
                                                isSelected
                                                    ? 'bg-[#181a24] border-[#c5a059]/50 shadow-[0_0_10px_rgba(197,160,89,0.15)] text-[#e0bc75]'
                                                    : 'bg-[#12141a]/40 border-transparent hover:border-[#c5a059]/30 hover:bg-[#181a24]/60 text-slate-200'
                                            } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                            onClick={() => !isDisabled && handleToggle(option)}
                                        >
                                            <Checkbox
                                                id={`opt-${option}`}
                                                checked={isSelected}
                                                onCheckedChange={() => !isDisabled && handleToggle(option)}
                                                className="mt-0.5 border-[#c5a059]/60 data-[state=checked]:bg-[#c5a059] data-[state=checked]:text-[#0c0d12] data-[state=checked]:border-[#c5a059]"
                                                disabled={isDisabled}
                                            />
                                            <div className="grid gap-1 leading-none">
                                                <Label
                                                    htmlFor={`opt-${option}`}
                                                    className={`text-sm font-lora leading-none ${
                                                        isSelected ? 'text-[#e0bc75] font-semibold' : 'text-slate-200'
                                                    } ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    {option}
                                                    {isExcluded && (
                                                        <span className="ml-2 text-xs text-rose-400 italic">
                                                            (Already selected elsewhere)
                                                        </span>
                                                    )}
                                                </Label>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-slate-500 italic font-lora text-xs">
                                No options available.
                            </div>
                        )}
                    </div>

                    {/* Quick validation reminder if choice_limit > 1 and partial selection */}
                    {currentCount > 0 && currentCount < limit && (
                        <div className="flex items-center gap-2 text-amber-300 text-xs bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/35 font-lora">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                            <span>You can still select {limit - currentCount} more option{limit - currentCount !== 1 ? 's' : ''}.</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t border-[#c5a059]/20 pt-3 flex items-center justify-between gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-[#d1cdb8]/70 hover:text-white hover:bg-[#c5a059]/10 border border-[#c5a059]/20 font-lora text-xs h-8 px-3 transition-colors cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-cinzel font-bold text-xs uppercase tracking-wider h-8 px-4 shadow-[0_0_14px_rgba(197,160,89,0.35)] transition-all cursor-pointer disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save Selection"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
