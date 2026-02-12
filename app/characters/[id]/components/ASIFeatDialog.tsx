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
                <Button className="bg-amber-600 hover:bg-amber-700">
                    ⚡ Choose ASI/Feat (Level {pendingLevel})
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 text-white border-slate-700 max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Ability Score Improvement / Feat Selection</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Level {pendingLevel} - Choose to improve your ability scores or take a feat
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                        <TabsTrigger value="asi" className="data-[state=active]:bg-slate-700">Ability Score Improvement</TabsTrigger>
                        <TabsTrigger value="feat" className="data-[state=active]:bg-slate-700">Feat</TabsTrigger>
                    </TabsList>

                    <TabsContent value="asi" className="space-y-4 mt-4">
                        <div className="space-y-4">
                            <Label>Choose one:</Label>

                            {/* +2 to one ability */}
                            <div className="flex items-start gap-3">
                                <input
                                    type="radio"
                                    name="asiMode"
                                    checked={asiMode === "single"}
                                    onChange={() => setAsiMode("single")}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <Label className="text-base">+2 to one ability score</Label>
                                    {asiMode === "single" && (
                                        <Select value={singleAbility} onValueChange={setSingleAbility}>
                                            <SelectTrigger className="mt-2 bg-slate-800 border-slate-600">
                                                <SelectValue placeholder="Select ability" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-600 text-white">
                                                {ABILITIES.map(ability => (
                                                    <SelectItem key={ability.value} value={ability.value}>
                                                        {ability.label} ({ability.short})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>

                            {/* +1 to two abilities */}
                            <div className="flex items-start gap-3">
                                <input
                                    type="radio"
                                    name="asiMode"
                                    checked={asiMode === "double"}
                                    onChange={() => setAsiMode("double")}
                                    className="mt-1"
                                />
                                <div className="flex-1 space-y-2">
                                    <Label className="text-base">+1 to two different ability scores</Label>
                                    {asiMode === "double" && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-sm text-slate-400">First Ability</Label>
                                                <Select value={ability1} onValueChange={setAbility1}>
                                                    <SelectTrigger className="bg-slate-800 border-slate-600">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-800 border-slate-600 text-white">
                                                        {ABILITIES.map(ability => (
                                                            <SelectItem key={ability.value} value={ability.value}>
                                                                {ability.short}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-slate-400">Second Ability</Label>
                                                <Select value={ability2} onValueChange={setAbility2}>
                                                    <SelectTrigger className="bg-slate-800 border-slate-600">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-800 border-slate-600 text-white">
                                                        {ABILITIES.map(ability => (
                                                            <SelectItem key={ability.value} value={ability.value}>
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

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-slate-400">
                                Cancel
                            </Button>
                            <Button onClick={handleApplyASI} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
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
                                className="bg-slate-800 border-slate-600"
                            />

                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {filteredFeats.map(feat => (
                                    <Card
                                        key={feat.id}
                                        className={`cursor-pointer transition-colors ${selectedFeat?.id === feat.id
                                                ? "bg-blue-900/50 border-blue-600"
                                                : feat.is_eligible
                                                    ? "bg-slate-800 border-slate-700 hover:bg-slate-700"
                                                    : "bg-slate-800/50 border-slate-700/50 opacity-60"
                                            }`}
                                        onClick={() => feat.is_eligible && setSelectedFeat(feat)}
                                    >
                                        <CardHeader className="p-3">
                                            <CardTitle className="text-base flex items-center justify-between">
                                                <span>{feat.name}</span>
                                                {!feat.is_eligible && (
                                                    <span className="text-xs text-red-400">🔒 {feat.reason_if_not}</span>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="text-xs text-slate-400">
                                                {feat.description}
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-slate-400">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleApplyFeat}
                                disabled={loading || !selectedFeat}
                                className="bg-purple-600 hover:bg-purple-700"
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
