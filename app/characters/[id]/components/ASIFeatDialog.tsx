import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { charactersApi } from "@/lib/api/characters";
import type { Character, Feat } from "@/lib/types/character";

interface ASIFeatDialogProps {
    character: Character;
    onUpdate: () => void;
}

const ABILITIES = [
    { value: "strength", label: "Strength", short: "STR" },
    { value: "dexterity", label: "Dexterity", short: "DEX" },
    { value: "constitution", label: "Constitution", short: "CON" },
    { value: "intelligence", label: "Intelligence", short: "INT" },
    { value: "wisdom", label: "Wisdom", short: "WIS" },
    { value: "charisma", label: "Charisma", short: "CHA" },
];

export function ASIFeatDialog({ character, onUpdate }: ASIFeatDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("asi");

    // ASI state
    const [asiMode, setAsiMode] = useState<"single" | "double">("single");
    const [singleAbility, setSingleAbility] = useState("");
    const [ability1, setAbility1] = useState("");
    const [ability2, setAbility2] = useState("");

    // Feat state
    const [feats, setFeats] = useState<Feat[]>([]);
    const [selectedFeat, setSelectedFeat] = useState<Feat | null>(null);
    const [featSearch, setFeatSearch] = useState("");

    const pendingLevel = character.pending_asi_levels?.[0];

    useEffect(() => {
        if (open && activeTab === "feat") {
            loadFeats();
        }
    }, [open, activeTab]);

    const loadFeats = async () => {
        try {
            const response = await charactersApi.getAvailableFeats(character.id);
            setFeats(response.data);
        } catch (error) {
            console.error("Failed to load feats:", error);
        }
    };

    const handleApplyASI = async () => {
        if (!pendingLevel) return;

        setLoading(true);
        try {
            const asi_choice: { [key: string]: number } = {};

            if (asiMode === "single") {
                if (!singleAbility) {
                    alert("Please select an ability");
                    setLoading(false);
                    return;
                }
                asi_choice[singleAbility] = 2;
            } else {
                if (!ability1 || !ability2) {
                    alert("Please select two abilities");
                    setLoading(false);
                    return;
                }
                if (ability1 === ability2) {
                    alert("Must select two different abilities");
                    setLoading(false);
                    return;
                }
                asi_choice[ability1] = 1;
                asi_choice[ability2] = 1;
            }

            await charactersApi.applyASI(character.id, {
                level: pendingLevel,
                choice_type: "asi",
                asi_choice
            });

            setOpen(false);
            onUpdate();
        } catch (error) {
            console.error("Failed to apply ASI:", error);
            alert("Failed to apply ASI");
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFeat = async () => {
        if (!pendingLevel || !selectedFeat) return;

        setLoading(true);
        try {
            await charactersApi.applyASI(character.id, {
                level: pendingLevel,
                choice_type: "feat",
                feat_id: selectedFeat.id
            });

            setOpen(false);
            onUpdate();
        } catch (error: any) {
            console.error("Failed to apply feat:", error);
            alert(error.response?.data?.error || "Failed to apply feat");
        } finally {
            setLoading(false);
        }
    };

    const filteredFeats = feats.filter(feat =>
        feat.name.toLowerCase().includes(featSearch.toLowerCase())
    );

    if (!pendingLevel) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-cinzel font-bold uppercase tracking-wider shadow-[0_0_14px_rgba(197,160,89,0.35)]">
                    ⚡ Choose ASI/Feat (Level {pendingLevel})
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#10121a]/98 text-slate-100 border border-[#c5a059]/60 shadow-[0_8px_36px_rgba(0,0,0,0.85)] backdrop-blur-xl font-lora max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader className="border-b border-[#c5a059]/20 pb-3">
                    <DialogTitle className="font-cinzel text-lg font-bold text-[#c5a059] tracking-wide">
                        Ability Score Improvement / Feat Selection
                    </DialogTitle>
                    <DialogDescription className="font-lora text-xs text-[#d1cdb8]/70 mt-1">
                        Level {pendingLevel} — Choose to improve your ability scores or take a powerful feat
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-[#0c0d12]/80 border border-[#c5a059]/25 p-1 rounded-lg">
                        <TabsTrigger
                            value="asi"
                            className="font-cinzel text-xs font-semibold tracking-wider data-[state=active]:bg-[#181a24] data-[state=active]:text-[#e0bc75] data-[state=active]:border data-[state=active]:border-[#c5a059]/50 text-slate-400"
                        >
                            Ability Score Improvement
                        </TabsTrigger>
                        <TabsTrigger
                            value="feat"
                            className="font-cinzel text-xs font-semibold tracking-wider data-[state=active]:bg-[#181a24] data-[state=active]:text-[#e0bc75] data-[state=active]:border data-[state=active]:border-[#c5a059]/50 text-slate-400"
                        >
                            Feat
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="asi" className="space-y-4 mt-4">
                        <div className="space-y-4 p-4 rounded-lg bg-[#0c0d12]/60 border border-[#c5a059]/25">
                            <Label className="font-cinzel font-semibold text-[#e0bc75] text-xs uppercase tracking-wide">Choose one:</Label>

                            {/* +2 to one ability */}
                            <div className="flex items-start gap-3 p-3 rounded-md bg-[#12141a]/40 border border-[#c5a059]/20">
                                <input
                                    type="radio"
                                    name="asiMode"
                                    checked={asiMode === "single"}
                                    onChange={() => setAsiMode("single")}
                                    className="mt-1 accent-[#c5a059] cursor-pointer"
                                />
                                <div className="flex-1">
                                    <Label className="text-sm font-semibold text-slate-200 cursor-pointer" onClick={() => setAsiMode("single")}>
                                        +2 to one ability score
                                    </Label>
                                    {asiMode === "single" && (
                                        <Select value={singleAbility} onValueChange={setSingleAbility}>
                                            <SelectTrigger className="mt-2 bg-[#0c0d12]/90 border-[#c5a059]/40 text-slate-100">
                                                <SelectValue placeholder="Select ability" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#10121a] border-[#c5a059]/50 text-slate-200 font-lora">
                                                {ABILITIES.map(ability => (
                                                    <SelectItem key={ability.value} value={ability.value} className="focus:bg-[#181a24] focus:text-[#e0bc75]">
                                                        {ability.label} ({ability.short})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>

                            {/* +1 to two abilities */}
                            <div className="flex items-start gap-3 p-3 rounded-md bg-[#12141a]/40 border border-[#c5a059]/20">
                                <input
                                    type="radio"
                                    name="asiMode"
                                    checked={asiMode === "double"}
                                    onChange={() => setAsiMode("double")}
                                    className="mt-1 accent-[#c5a059] cursor-pointer"
                                />
                                <div className="flex-1 space-y-2">
                                    <Label className="text-sm font-semibold text-slate-200 cursor-pointer" onClick={() => setAsiMode("double")}>
                                        +1 to two different ability scores
                                    </Label>
                                    {asiMode === "double" && (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div>
                                                <Label className="text-xs text-[#d1cdb8]/70">First Ability</Label>
                                                <Select value={ability1} onValueChange={setAbility1}>
                                                    <SelectTrigger className="bg-[#0c0d12]/90 border-[#c5a059]/40 text-slate-100">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#10121a] border-[#c5a059]/50 text-slate-200 font-lora">
                                                        {ABILITIES.map(ability => (
                                                            <SelectItem key={ability.value} value={ability.value} className="focus:bg-[#181a24] focus:text-[#e0bc75]">
                                                                {ability.short}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-[#d1cdb8]/70">Second Ability</Label>
                                                <Select value={ability2} onValueChange={setAbility2}>
                                                    <SelectTrigger className="bg-[#0c0d12]/90 border-[#c5a059]/40 text-slate-100">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#10121a] border-[#c5a059]/50 text-slate-200 font-lora">
                                                        {ABILITIES.map(ability => (
                                                            <SelectItem key={ability.value} value={ability.value} className="focus:bg-[#181a24] focus:text-[#e0bc75]">
                                                                {ability.short}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="border-t border-[#c5a059]/20 pt-3 flex items-center justify-between gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="text-[#d1cdb8]/70 hover:text-white hover:bg-[#c5a059]/10 border border-[#c5a059]/20 font-lora text-xs h-8 px-3"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleApplyASI}
                                disabled={loading}
                                className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-cinzel font-bold text-xs uppercase tracking-wider h-8 px-4 shadow-[0_0_14px_rgba(197,160,89,0.35)]"
                            >
                                {loading ? "Applying..." : "Apply ASI"}
                            </Button>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="feat" className="space-y-4 mt-4">
                        <div className="space-y-3">
                            <Input
                                placeholder="Search feats..."
                                value={featSearch}
                                onChange={(e) => setFeatSearch(e.target.value)}
                                className="bg-[#0c0d12]/80 border-[#c5a059]/40 text-slate-100 placeholder:text-slate-500 font-lora text-sm focus:border-[#c5a059]"
                            />

                            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                                {filteredFeats.map(feat => (
                                    <Card
                                        key={feat.id}
                                        className={`cursor-pointer transition-all duration-150 border ${
                                            selectedFeat?.id === feat.id
                                                ? "bg-[#181a24] border-[#c5a059] shadow-[0_0_12px_rgba(197,160,89,0.25)]"
                                                : feat.is_eligible
                                                    ? "bg-[#12141a]/60 border-[#c5a059]/25 hover:border-[#c5a059]/60 hover:bg-[#181a24]/60"
                                                    : "bg-[#0c0d12]/40 border-slate-800/60 opacity-50 cursor-not-allowed"
                                        }`}
                                        onClick={() => feat.is_eligible && setSelectedFeat(feat)}
                                    >
                                        <CardHeader className="p-3">
                                            <CardTitle className="text-sm font-cinzel font-bold flex items-center justify-between">
                                                <span className={selectedFeat?.id === feat.id ? "text-[#e0bc75]" : "text-slate-100"}>
                                                    {feat.name}
                                                </span>
                                                {!feat.is_eligible && (
                                                    <span className="text-xs text-rose-400 font-lora font-normal">🔒 {feat.reason_if_not}</span>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="text-xs font-lora text-[#d1cdb8]/75 mt-1 leading-relaxed">
                                                {feat.description}
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="border-t border-[#c5a059]/20 pt-3 flex items-center justify-between gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="text-[#d1cdb8]/70 hover:text-white hover:bg-[#c5a059]/10 border border-[#c5a059]/20 font-lora text-xs h-8 px-3"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleApplyFeat}
                                disabled={loading || !selectedFeat}
                                className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-cinzel font-bold text-xs uppercase tracking-wider h-8 px-4 shadow-[0_0_14px_rgba(197,160,89,0.35)] disabled:opacity-50"
                            >
                                {loading ? "Applying..." : "Take Feat"}
                            </Button>
                        </DialogFooter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
