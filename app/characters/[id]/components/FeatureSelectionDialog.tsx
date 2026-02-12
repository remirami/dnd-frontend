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
import { AlertCircle } from "lucide-react";
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
            <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                    <DialogTitle>Select Options: {feature.name}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Please select {limit} option{limit !== 1 ? 's' : ''} from the list below.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="flex justify-between items-center text-sm font-medium mb-2">
                        <span>Available Options</span>
                        <span className={`${isFull ? 'text-green-400' : 'text-slate-400'}`}>
                            {currentCount} / {limit} Selected
                        </span>
                    </div>

                    <div className="border border-slate-700 rounded-lg p-1 max-h-[300px] overflow-y-auto bg-slate-800/50">
                        {feature.options && feature.options.length > 0 ? (
                            <div className="space-y-1">
                                {feature.options.map((option) => {
                                    const isSelected = selectedOptions.includes(option);
                                    const isExcluded = excludedOptions.includes(option) && !isSelected; // Valid only if not currently selected (legacy data protection)

                                    // Disable unselected items if limit is reached OR if excluded
                                    const isDisabled = (!isSelected && isFull) || isExcluded;

                                    return (
                                        <div
                                            key={option}
                                            className={`flex items-start space-x-3 p-2 rounded hover:bg-slate-800 transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                            onClick={() => !isDisabled && handleToggle(option)}
                                        >
                                            <Checkbox
                                                id={`opt-${option}`}
                                                checked={isSelected}
                                                onCheckedChange={() => !isDisabled && handleToggle(option)}
                                                className="mt-0.5 border-slate-600 data-[state=checked]:bg-blue-600"
                                                disabled={isDisabled}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <Label
                                                    htmlFor={`opt-${option}`}
                                                    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    {option}
                                                    {isExcluded && <span className="ml-2 text-xs text-red-400 italic">(Already selected elsewhere)</span>}
                                                </Label>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-slate-500 italic">
                                No options available.
                            </div>
                        )}
                    </div>

                    {/* Quick validation warning if saving with < limit */}
                    {/* Only warn if choice_limit > 1 and we have > 0 selections but < limit */}
                    {/* Does 2024 allow partial selection? Usually yes, but better to finish */}
                    {currentCount > 0 && currentCount < limit && (
                        <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-950/30 p-2 rounded border border-amber-900/50">
                            <AlertCircle className="w-4 h-4" />
                            <span>You can still select {limit - currentCount} more option{limit - currentCount !== 1 ? 's' : ''}.</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {loading ? "Saving..." : "Save Selection"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
