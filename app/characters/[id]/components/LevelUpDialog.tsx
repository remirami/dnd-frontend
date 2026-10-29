import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { charactersApi } from "@/lib/api/characters";
import { Character, Feat, Subclass } from "@/lib/types/character";
import {
    Sparkles,
    Dices,
    Check,
    ChevronRight,
    ArrowRight,
    Heart,
    Shield,
    Swords,
    RefreshCw,
    Award,
    Zap,
    Search,
    Flame
} from "lucide-react";

interface LevelUpDialogProps {
    character: Character;
    onUpdate: () => void;
    className?: string;
    label?: string;
}

interface ClassInfo {
    id: number;
    name: string;
    hit_dice: string;
}

interface CurrentClassLevel {
    class_id: number;
    class_name: string;
    level: number;
    subclass?: string;
}

const ABILITIES = [
    { value: "strength", label: "Strength", short: "STR" },
    { value: "dexterity", label: "Dexterity", short: "DEX" },
    { value: "constitution", label: "Constitution", short: "CON" },
    { value: "intelligence", label: "Intelligence", short: "INT" },
    { value: "wisdom", label: "Wisdom", short: "WIS" },
    { value: "charisma", label: "Charisma", short: "CHA" },
];

export default function LevelUpDialog({ character, onUpdate, className, label }: LevelUpDialogProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Classes data
    const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([]);
    const [currentClasses, setCurrentClasses] = useState<CurrentClassLevel[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

    // HP state
    const [hpMode, setHpMode] = useState<'fixed' | 'rolled'>('fixed');
    const [rolledHP, setRolledHP] = useState<number | null>(null);
    const [isRolling, setIsRolling] = useState(false);

    // Milestone: Subclass state
    const [subclasses, setSubclasses] = useState<Subclass[]>([]);
    const [selectedSubclass, setSelectedSubclass] = useState<Subclass | null>(null);
    const [loadingSubclasses, setLoadingSubclasses] = useState(false);

    // Milestone: ASI / Feat state
    const [milestoneType, setMilestoneType] = useState<'none' | 'subclass' | 'asi_feat'>('none');
    const [asiChoiceType, setAsiChoiceType] = useState<'asi' | 'feat'>('asi');
    const [asiMode, setAsiMode] = useState<'single' | 'double'>('single');
    const [singleAbility, setSingleAbility] = useState("strength");
    const [ability1, setAbility1] = useState("strength");
    const [ability2, setAbility2] = useState("constitution");
    const [feats, setFeats] = useState<Feat[]>([]);
    const [selectedFeat, setSelectedFeat] = useState<Feat | null>(null);
    const [featSearch, setFeatSearch] = useState("");
    const [featCategory, setFeatCategory] = useState("all");
    const [loadingFeats, setLoadingFeats] = useState(false);

    // Ascend success celebration
    const [ascended, setAscended] = useState(false);
    const [ascendedTotalLevel, setAscendedTotalLevel] = useState<number | null>(null);
    const [ascendedClassLevel, setAscendedClassLevel] = useState<number | null>(null);

    useEffect(() => {
        if (open) {
            setStep(1);
            setAscended(false);
            setAscendedTotalLevel(null);
            setAscendedClassLevel(null);
            setError(null);
            fetchInitialData();
        }
    }, [open]);

    const fetchInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
            const classesRes = await charactersApi.getClasses();
            const classesList: ClassInfo[] = classesRes.data.results || classesRes.data || [];
            setAvailableClasses(classesList);

            let myClasses: CurrentClassLevel[] = [];
            try {
                const multiRes = await charactersApi.getMulticlassInfo(character.id);
                if (multiRes.data.class_levels && multiRes.data.class_levels.length > 0) {
                    myClasses = multiRes.data.class_levels;
                }
            } catch (err) {
                console.warn("Using fallback class level data");
            }

            if (myClasses.length === 0) {
                const primaryId = character.character_class?.id || (classesList.length > 0 ? classesList[0].id : 1);
                myClasses = [{
                    class_id: primaryId,
                    class_name: character.character_class?.name || "Fighter",
                    level: character.level || 1,
                    subclass: character.subclass || undefined
                }];
            }

            setCurrentClasses(myClasses);
            const defaultId = myClasses[0]?.class_id || (classesList[0]?.id ?? null);
            setSelectedClassId(defaultId);
        } catch (err) {
            console.error("Failed to fetch initial level up data:", err);
            setError("Failed to load level-up options");
        } finally {
            setLoading(false);
        }
    };

    // Selected class metadata
    const selectedClassObj = availableClasses.find(c => c.id === selectedClassId) ||
        (currentClasses.find(c => c.class_id === selectedClassId) ? {
            id: selectedClassId!,
            name: currentClasses.find(c => c.class_id === selectedClassId)!.class_name,
            hit_dice: "d8"
        } : null);

    const currentClassEntry = currentClasses.find(c => c.class_id === selectedClassId);
    const currentClassLevel = currentClassEntry ? currentClassEntry.level : 0;
    const nextClassLevel = currentClassLevel + 1;
    const nextTotalLevel = character.level + 1;
    const isMaxLevel = character.level >= 20;

    // Hit Die size
    const hitDieStr = selectedClassObj?.hit_dice || "d8";
    const dieMatch = hitDieStr.match(/d(\d+)/i);
    const dieSize = dieMatch ? parseInt(dieMatch[1], 10) : 8;

    // CON modifier
    const conScore = character.stats?.constitution ?? 10;
    const conMod = Math.floor((conScore - 10) / 2);

    // HP calculation
    const fixedBase = Math.floor(dieSize / 2) + 1;
    const rolledBase = rolledHP ?? fixedBase;
    const currentBase = hpMode === 'fixed' ? fixedBase : rolledBase;
    const hpGain = Math.max(1, currentBase + conMod);
    const currentMaxHP = character.stats?.max_hit_points ?? 10;
    const newMaxHP = currentMaxHP + hpGain;

    // Roll interactive dice (one-time gamble, no re-rolls)
    const handleRollDie = () => {
        if (rolledHP !== null || isRolling) return;
        setIsRolling(true);
        let rollCount = 0;
        const interval = setInterval(() => {
            const temp = Math.floor(Math.random() * dieSize) + 1;
            setRolledHP(temp);
            rollCount++;
            if (rollCount >= 8) {
                clearInterval(interval);
                const finalRoll = Math.floor(Math.random() * dieSize) + 1;
                setRolledHP(finalRoll);
                setIsRolling(false);
            }
        }, 60);
    };

    // Subclass trigger check
    const checkSubclassNeeded = (targetClass: string, targetLvl: number) => {
        if (currentClassEntry?.subclass || (currentClassEntry && currentClassEntry.class_name === character.character_class?.name && character.subclass)) {
            return false;
        }
        if (character.ruleset_version === '2024') {
            return targetLvl >= 3;
        }
        const levels2014: { [key: string]: number } = {
            'Cleric': 1,
            'Druid': 2,
            'Wizard': 2,
            'Sorcerer': 1,
            'Warlock': 1,
        };
        const trigger = levels2014[targetClass] ?? 3;
        return targetLvl >= trigger;
    };

    // ASI trigger check
    const checkASINeeded = (targetClass: string, targetLvl: number) => {
        const standardASI = [4, 8, 12, 16, 19];
        if (targetClass.toLowerCase() === 'fighter') {
            return standardASI.includes(targetLvl) || targetLvl === 6 || targetLvl === 14;
        }
        if (targetClass.toLowerCase() === 'rogue') {
            return standardASI.includes(targetLvl) || targetLvl === 10;
        }
        return standardASI.includes(targetLvl);
    };

    // Handle transition to Step 2
    const handleProceedToStep2 = async () => {
        if (!selectedClassId || !selectedClassObj) return;

        const targetClass = selectedClassObj.name;
        const needsSubclass = checkSubclassNeeded(targetClass, nextClassLevel);
        const needsASI = checkASINeeded(targetClass, nextClassLevel);

        if (needsSubclass) {
            setMilestoneType('subclass');
            setLoadingSubclasses(true);
            try {
                const subRes = await charactersApi.getEligibleSubclasses(character.id, targetClass);
                const available = subRes.data.available_subclasses || [];
                setSubclasses(available);
                if (available.length > 0 && !selectedSubclass) {
                    setSelectedSubclass(available[0]);
                }
            } catch (err) {
                console.error("Failed to load subclasses:", err);
            } finally {
                setLoadingSubclasses(false);
            }
        } else if (needsASI) {
            setMilestoneType('asi_feat');
            setLoadingFeats(true);
            try {
                const featRes = await charactersApi.getAvailableFeats(character.id);
                setFeats(featRes.data || []);
            } catch (err) {
                console.error("Failed to load feats:", err);
            } finally {
                setLoadingFeats(false);
            }
        } else {
            setMilestoneType('none');
        }

        setStep(2);
    };

    // Final Ascension
    const handleAscend = async () => {
        if (!selectedClassId) return;

        setLoading(true);
        setError(null);
        try {
            // 1. Call levelUp with hp_mode, roll, and subclass
            const levelUpPayload: {
                class_id: number;
                hp_mode: 'fixed' | 'rolled';
                roll?: number;
                subclass?: string;
            } = {
                class_id: selectedClassId,
                hp_mode: hpMode,
                roll: hpMode === 'rolled' && rolledHP ? rolledHP : undefined,
                subclass: milestoneType === 'subclass' && selectedSubclass ? selectedSubclass.name : undefined
            };

            await charactersApi.levelUp(character.id, levelUpPayload);

            // 2. If ASI or Feat was selected, apply it immediately
            if (milestoneType === 'asi_feat') {
                if (asiChoiceType === 'asi') {
                    const asi_choice: { [key: string]: number } = {};
                    if (asiMode === 'single') {
                        asi_choice[singleAbility] = 2;
                    } else {
                        asi_choice[ability1] = (asi_choice[ability1] || 0) + 1;
                        asi_choice[ability2] = (asi_choice[ability2] || 0) + 1;
                    }
                    await charactersApi.applyASI(character.id, {
                        level: nextClassLevel,
                        choice_type: 'asi',
                        asi_choice
                    });
                } else if (asiChoiceType === 'feat' && selectedFeat) {
                    await charactersApi.applyASI(character.id, {
                        level: nextClassLevel,
                        choice_type: 'feat',
                        feat_id: selectedFeat.id
                    });
                }
            }

            const finalTotalLevel = nextTotalLevel;
            setAscendedTotalLevel(finalTotalLevel);
            setAscendedClassLevel(nextClassLevel);
            setAscended(true);
            onUpdate();
        } catch (err: any) {
            console.error("Level up wizard error:", err);
            setError(err.response?.data?.error || err.message || "Failed to finalize level-up");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setStep(1);
        setAscended(false);
        setAscendedTotalLevel(null);
        setAscendedClassLevel(null);
        setRolledHP(null);
        setSelectedSubclass(null);
        setSelectedFeat(null);
        setError(null);
    };

    // Filter feats
    const filteredFeats = feats.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(featSearch.toLowerCase()) ||
            f.description.toLowerCase().includes(featSearch.toLowerCase());
        const matchesCategory = featCategory === 'all' || f.category === featCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                disabled={isMaxLevel}
                className={className || "bg-[#181a21] border border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/15 text-xs font-lora font-semibold px-3 py-1.5 h-auto rounded transition-colors shadow-sm"}
            >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-[#c5a059] animate-pulse" />
                {label || (isMaxLevel ? "Max Level (20)" : `Level Up (${character.level} → ${nextTotalLevel})`)}
            </Button>

            <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else setOpen(true); }}>
                <DialogContent className="sm:max-w-4xl w-[94vw] max-w-4xl bg-[#12141a] text-slate-100 border border-[#c5a059] shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-hidden flex flex-col p-0">
                    {/* Header */}
                    <DialogHeader className="p-6 pb-4 border-b border-[#c5a059]/20 bg-[#151821]/90 space-y-4">
                        {/* Title Row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-[#c5a059]/15 border border-[#c5a059]/35 text-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.25)]">
                                    <Swords className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <DialogTitle className="font-cinzel text-xl font-bold text-[#c5a059] tracking-wide whitespace-nowrap">
                                            Level-Up Wizard
                                        </DialogTitle>
                                        <Badge className="bg-[#c5a059]/20 text-[#c5a059] border-[#c5a059]/40 text-xs px-2.5 py-0.5 font-fira-sans font-bold">
                                            Level {character.level} → {nextTotalLevel}
                                        </Badge>
                                    </div>
                                    <DialogDescription className="font-lora text-xs text-[#d1cdb8]/75 mt-0.5">
                                        Channel your experience and advance your hero's destiny
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>

                        {/* Step Progress Row */}
                        {!ascended && (
                            <div className="grid grid-cols-3 gap-2 pt-1 font-cinzel text-xs">
                                <div className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                                    step === 1
                                        ? 'bg-[#c5a059] text-[#0c0d12] font-bold shadow-[0_0_15px_rgba(197,160,89,0.35)]'
                                        : step > 1
                                            ? 'bg-[#181a21] text-[#c5a059] border border-[#c5a059]/40'
                                            : 'bg-[#0f1117] text-[#d1cdb8]/40 border border-[#c5a059]/10'
                                }`}>
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-fira-sans font-bold ${
                                        step === 1 ? 'bg-[#0c0d12] text-[#c5a059]' : step > 1 ? 'bg-[#c5a059]/20 text-[#c5a059]' : 'bg-[#181a21] text-[#d1cdb8]/40'
                                    }`}>
                                        {step > 1 ? '✓' : '1'}
                                    </span>
                                    <span className="font-semibold tracking-wide">1. Class & HP</span>
                                </div>

                                <div className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                                    step === 2
                                        ? 'bg-[#c5a059] text-[#0c0d12] font-bold shadow-[0_0_15px_rgba(197,160,89,0.35)]'
                                        : step > 2
                                            ? 'bg-[#181a21] text-[#c5a059] border border-[#c5a059]/40'
                                            : 'bg-[#0f1117] text-[#d1cdb8]/40 border border-[#c5a059]/10'
                                }`}>
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-fira-sans font-bold ${
                                        step === 2 ? 'bg-[#0c0d12] text-[#c5a059]' : step > 2 ? 'bg-[#c5a059]/20 text-[#c5a059]' : 'bg-[#181a21] text-[#d1cdb8]/40'
                                    }`}>
                                        {step > 2 ? '✓' : '2'}
                                    </span>
                                    <span className="font-semibold tracking-wide">2. Milestones</span>
                                </div>

                                <div className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                                    step === 3
                                        ? 'bg-[#c5a059] text-[#0c0d12] font-bold shadow-[0_0_15px_rgba(197,160,89,0.35)]'
                                        : 'bg-[#0f1117] text-[#d1cdb8]/40 border border-[#c5a059]/10'
                                }`}>
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-fira-sans font-bold ${
                                        step === 3 ? 'bg-[#0c0d12] text-[#c5a059]' : 'bg-[#181a21] text-[#d1cdb8]/40'
                                    }`}>
                                        3
                                    </span>
                                    <span className="font-semibold tracking-wide">3. Review & Ascend</span>
                                </div>
                            </div>
                        )}
                    </DialogHeader>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 font-lora">
                        {error && (
                            <div className="bg-rose-950/60 border border-rose-800 text-rose-200 p-3 rounded text-xs flex items-center gap-2">
                                <Zap className="w-4 h-4 text-rose-400 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Celebratory Ascended State */}
                        {ascended ? (
                            <div className="py-8 text-center space-y-4">
                                <div className="inline-flex p-4 rounded-full bg-[#c5a059]/20 border-2 border-[#c5a059] text-[#c5a059] shadow-[0_0_30px_rgba(197,160,89,0.4)] animate-bounce">
                                    <Award className="w-12 h-12" />
                                </div>
                                <h3 className="text-2xl font-cinzel font-bold text-[#c5a059]">
                                    Ascension Complete!
                                </h3>
                                <p className="text-sm text-[#d1cdb8]/80 max-w-md mx-auto">
                                    {character.name} has advanced to <strong className="text-[#c5a059]">Level {ascendedTotalLevel ?? nextTotalLevel}</strong> in <strong className="text-slate-100">{selectedClassObj?.name}</strong>!
                                </p>
                                <div className="bg-[#181a21] border border-[#c5a059]/30 rounded-lg p-4 max-w-sm mx-auto text-xs space-y-2 text-left">
                                    <div className="flex justify-between items-center text-[#d1cdb8]/90">
                                        <span className="flex items-center gap-1.5">
                                            <Heart className="w-3.5 h-3.5 text-rose-400" /> Max HP Increase:
                                        </span>
                                        <span className="text-emerald-400 font-bold font-fira-sans">+{hpGain} HP ({newMaxHP} Total)</span>
                                    </div>
                                    {selectedSubclass && (
                                        <div className="flex justify-between items-center text-[#d1cdb8]/90">
                                            <span className="flex items-center gap-1.5">
                                                <Shield className="w-3.5 h-3.5 text-[#c5a059]" /> Chosen Subclass:
                                            </span>
                                            <span className="text-[#c5a059] font-bold">{selectedSubclass.name}</span>
                                        </div>
                                    )}
                                    {milestoneType === 'asi_feat' && (
                                        <div className="flex justify-between items-center text-[#d1cdb8]/90">
                                            <span className="flex items-center gap-1.5">
                                                <Zap className="w-3.5 h-3.5 text-amber-400" /> Milestone Gained:
                                            </span>
                                            <span className="text-[#c5a059] font-bold">
                                                {asiChoiceType === 'asi'
                                                    ? (asiMode === 'single' ? `+2 ${singleAbility.toUpperCase()}` : `+1 ${ability1.toUpperCase()}, +1 ${ability2.toUpperCase()}`)
                                                    : selectedFeat?.name
                                                }
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* STEP 1: CLASS SELECTION & HIT POINTS */}
                                {step === 1 && (
                                    <div className="space-y-6">
                                        {/* Class Choice */}
                                        <div>
                                            <label className="block text-xs font-cinzel font-bold text-[#c5a059] uppercase tracking-wider mb-2.5">
                                                1. Select Class to Advance
                                            </label>
                                            <div className={currentClasses.length === 1 ? "space-y-3" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
                                                {currentClasses.map((cls) => {
                                                    const isSelected = selectedClassId === cls.class_id;
                                                    return (
                                                        <Card
                                                            key={cls.class_id}
                                                            className={`p-4 cursor-pointer transition-all ${isSelected
                                                                ? "bg-[#181a21] border-2 border-[#c5a059] shadow-[0_0_20px_rgba(197,160,89,0.25)]"
                                                                : "bg-[#0c0d12] border border-[#c5a059]/25 hover:border-[#c5a059]/60 hover:bg-[#181a21]/50"
                                                                }`}
                                                            onClick={() => {
                                                                if (selectedClassId !== cls.class_id) {
                                                                    setSelectedClassId(cls.class_id);
                                                                    setRolledHP(null);
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2.5 rounded-lg bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30">
                                                                        <Shield className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-cinzel font-bold text-lg text-slate-100 capitalize flex items-center gap-2">
                                                                            {cls.class_name}
                                                                            <Badge className="bg-[#c5a059]/15 text-[#c5a059] border-[#c5a059]/30 text-xs px-2 py-0.5">
                                                                                Hit Die: {hitDieStr}
                                                                            </Badge>
                                                                        </div>
                                                                        {cls.subclass && (
                                                                            <div className="text-xs text-[#c5a059] mt-0.5 italic flex items-center gap-1">
                                                                                <span>Archetype:</span> <strong className="font-semibold">{cls.subclass}</strong>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="text-right">
                                                                        <div className="text-[11px] text-[#d1cdb8]/60 uppercase tracking-wider font-cinzel">Advancing</div>
                                                                        <div className="text-sm text-[#d1cdb8]/80 font-lora">
                                                                            Level {cls.level} <span className="text-[#c5a059] font-bold mx-1">──▶</span> <strong className="text-[#c5a059] text-base font-fira-sans font-bold">Level {cls.level + 1}</strong>
                                                                        </div>
                                                                    </div>
                                                                    {isSelected && (
                                                                        <div className="p-1.5 rounded-full bg-[#c5a059] text-[#0c0d12] shadow-[0_0_10px_rgba(197,160,89,0.5)]">
                                                                            <Check className="w-4 h-4 stroke-[3]" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    );
                                                })}
                                            </div>

                                            {/* Multiclass Dropdown Option */}
                                            {availableClasses.some(c => !currentClasses.some(cur => cur.class_id === c.id)) && (
                                                <div className="mt-3">
                                                    <span className="text-[11px] text-[#d1cdb8]/60 font-lora">Or Multiclass into a new class:</span>
                                                    <select
                                                        className="mt-1 w-full bg-[#181a21] border border-[#c5a059]/30 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-[#c5a059]"
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value);
                                                            if (selectedClassId !== val) {
                                                                setSelectedClassId(val);
                                                                setRolledHP(null);
                                                            }
                                                        }}
                                                        value={selectedClassId && !currentClasses.some(c => c.class_id === selectedClassId) ? selectedClassId : ""}
                                                    >
                                                        <option value="" disabled>Select a new class...</option>
                                                        {availableClasses
                                                            .filter(c => !currentClasses.some(cur => cur.class_id === c.id))
                                                            .map(c => (
                                                                <option key={c.id} value={c.id}>
                                                                    {c.name.charAt(0).toUpperCase() + c.name.slice(1)} (Hit Die: {c.hit_dice})
                                                                </option>
                                                            ))
                                                        }
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Hit Points Selection */}
                                        <div className="pt-2 border-t border-[#c5a059]/20">
                                            <div className="flex items-center justify-between mb-2.5">
                                                <label className="text-xs font-cinzel font-bold text-[#c5a059] uppercase tracking-wider flex items-center gap-1.5">
                                                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                                                    2. Hit Points Increase ({hitDieStr} + CON {conMod >= 0 ? `+${conMod}` : conMod})
                                                </label>
                                                <span className="text-[11px] text-[#d1cdb8]/70">
                                                    CON Mod: <strong className="text-slate-100 font-fira-sans">{conMod >= 0 ? `+${conMod}` : conMod}</strong> ({conScore} CON)
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* Option A: Fixed Average */}
                                                <Card
                                                    className={`p-4 cursor-pointer transition-all flex flex-col justify-between ${hpMode === 'fixed'
                                                        ? "bg-[#181a21] border-2 border-[#c5a059] shadow-[0_0_20px_rgba(197,160,89,0.25)]"
                                                        : "bg-[#0c0d12] border border-[#c5a059]/25 hover:border-[#c5a059]/60 hover:bg-[#181a21]/50"
                                                        }`}
                                                    onClick={() => setHpMode('fixed')}
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-cinzel font-bold text-sm text-slate-100">
                                                                    Take Fixed Average
                                                                </span>
                                                                <Badge className="bg-emerald-950/70 text-emerald-300 border-emerald-600/40 text-[10px] px-1.5 py-0">
                                                                    5e Standard
                                                                </Badge>
                                                            </div>
                                                            {hpMode === 'fixed' && (
                                                                <div className="p-1 rounded-full bg-[#c5a059] text-[#0c0d12]">
                                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-[#d1cdb8]/75 leading-relaxed">
                                                            Reliable health progression. Half hit die rounded up ({fixedBase}) + CON modifier ({conMod >= 0 ? `+${conMod}` : conMod}).
                                                        </p>
                                                    </div>

                                                    <div className="mt-4 pt-3 border-t border-[#c5a059]/15 flex items-center justify-between">
                                                        <span className="text-xs text-[#d1cdb8]/60">Guaranteed Gain:</span>
                                                        <span className="text-lg font-bold font-fira-sans text-emerald-400">
                                                            +{Math.max(1, fixedBase + conMod)} Max HP
                                                        </span>
                                                    </div>
                                                </Card>

                                                {/* Option B: Roll Hit Die */}
                                                <Card
                                                    className={`p-4 cursor-pointer transition-all flex flex-col justify-between ${hpMode === 'rolled'
                                                        ? "bg-[#181a21] border-2 border-[#c5a059] shadow-[0_0_20px_rgba(197,160,89,0.25)]"
                                                        : "bg-[#0c0d12] border border-[#c5a059]/25 hover:border-[#c5a059]/60 hover:bg-[#181a21]/50"
                                                        }`}
                                                    onClick={() => {
                                                        setHpMode('rolled');
                                                        if (rolledHP === null && !isRolling) handleRollDie();
                                                    }}
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Dices className="w-4 h-4 text-[#c5a059]" />
                                                                <span className="font-cinzel font-bold text-sm text-slate-100">
                                                                    Roll Hit Die ({hitDieStr})
                                                                </span>
                                                            </div>
                                                            {hpMode === 'rolled' && (
                                                                <div className="p-1 rounded-full bg-[#c5a059] text-[#0c0d12]">
                                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-[#d1cdb8]/75 leading-relaxed">
                                                            Test your fortune. Roll a physical {hitDieStr} die on the table + CON modifier ({conMod >= 0 ? `+${conMod}` : conMod}). One-time gamble (no re-rolls).
                                                        </p>
                                                    </div>

                                                    <div className="mt-4 pt-3 border-t border-[#c5a059]/15">
                                                        {hpMode === 'rolled' ? (
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-xs">
                                                                    {rolledHP !== null ? (
                                                                        <span className="font-fira-sans">
                                                                            Roll <strong className="text-[#c5a059] text-base">[{rolledHP}]</strong> + {conMod >= 0 ? `+${conMod}` : conMod} = <strong className="text-emerald-400 text-base font-bold">+{Math.max(1, rolledHP + conMod)} HP</strong>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[#d1cdb8]/60 italic">Click to roll {hitDieStr}...</span>
                                                                    )}
                                                                </div>
                                                                {rolledHP === null || isRolling ? (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (rolledHP === null && !isRolling) handleRollDie();
                                                                        }}
                                                                        disabled={isRolling}
                                                                        className="h-7 text-xs bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold px-3 py-0 flex items-center gap-1 shadow-sm"
                                                                    >
                                                                        {isRolling ? (
                                                                            <>
                                                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                                                Rolling...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Dices className="w-3.5 h-3.5" />
                                                                                Roll {hitDieStr}
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                ) : (
                                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#c5a059]/15 border border-[#c5a059]/40 text-[#c5a059] text-[11px] font-fira-sans font-bold shadow-xs">
                                                                        <span>🔒 Final Roll: [{rolledHP}]</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between text-xs text-[#d1cdb8]/50 italic">
                                                                <span>{rolledHP !== null ? `Rolled [${rolledHP}]:` : "Variable Range:"}</span>
                                                                <span className="font-fira-sans font-semibold text-slate-300">
                                                                    {rolledHP !== null
                                                                        ? `+${Math.max(1, rolledHP + conMod)} HP (Final)`
                                                                        : `+${Math.max(1, 1 + conMod)} to +${dieSize + conMod} HP`
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Card>
                                            </div>

                                            {/* Live Health Gauge & Preview Banner */}
                                            <div className="mt-4 bg-[#181a21] border border-[#c5a059]/35 rounded-xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Heart className="w-4 h-4 text-rose-400" />
                                                        <span className="text-xs text-[#d1cdb8]/80 font-cinzel font-semibold tracking-wide">
                                                            Maximum Hit Points
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs font-fira-sans">
                                                        <span className="text-[#d1cdb8]/70">
                                                            Current: <strong className="text-slate-100 font-bold">{currentMaxHP} HP</strong>
                                                        </span>
                                                        <span className="text-[#c5a059] font-bold">──▶</span>
                                                        <span className="text-emerald-400 font-bold">
                                                            +{hpGain} Gained
                                                        </span>
                                                        <span className="text-[#c5a059] font-bold">──▶</span>
                                                        <span className="text-emerald-300 font-bold text-sm bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/40">
                                                            New Max: {newMaxHP} HP
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Visual Health Gauge Bar */}
                                                <div className="w-full h-3 bg-[#0c0d12] rounded-full overflow-hidden border border-[#c5a059]/25 flex">
                                                    <div
                                                        style={{ width: `${Math.min(100, (currentMaxHP / newMaxHP) * 100)}%` }}
                                                        className="h-full bg-gradient-to-r from-rose-800 to-rose-600 transition-all duration-500"
                                                        title={`Current HP: ${currentMaxHP}`}
                                                    />
                                                    <div
                                                        style={{ width: `${Math.min(100, (hpGain / newMaxHP) * 100)}%` }}
                                                        className="h-full bg-gradient-to-r from-[#c5a059] to-emerald-400 transition-all duration-500 animate-pulse"
                                                        title={`Gained HP: +${hpGain}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: MILESTONES (SUBCLASS / ASI / FEAT / PROGRESSION) */}
                                {step === 2 && (
                                    <div className="space-y-6">
                                        {/* Subclass Selection Milestone */}
                                        {milestoneType === 'subclass' && (
                                            <div>
                                                <div className="mb-3">
                                                    <h4 className="font-cinzel font-bold text-sm tracking-wide text-[#c5a059] flex items-center gap-2">
                                                        <Shield className="w-4 h-4 text-[#c5a059]" />
                                                        Choose Subclass Archetype
                                                    </h4>
                                                    <p className="text-xs text-[#d1cdb8]/70 mt-0.5">
                                                        Reaching Level {nextClassLevel} in {selectedClassObj?.name} grants you a specialized subclass.
                                                    </p>
                                                </div>

                                                {loadingSubclasses ? (
                                                    <div className="py-8 text-center text-xs text-[#c5a059] flex items-center justify-center gap-2">
                                                        <RefreshCw className="w-4 h-4 animate-spin" /> Loading official subclasses...
                                                    </div>
                                                ) : subclasses.length === 0 ? (
                                                    <div className="p-4 bg-[#181a21] border border-[#c5a059]/30 rounded text-xs text-[#d1cdb8]/80">
                                                        No official subclasses found for {selectedClassObj?.name}.
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                                                        {subclasses.map((sub) => {
                                                            const isSelected = selectedSubclass?.name === sub.name;
                                                            return (
                                                                <Card
                                                                    key={sub.name}
                                                                    className={`p-3.5 cursor-pointer transition-all border-2 ${isSelected
                                                                        ? "bg-[#181a21] border-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.3)]"
                                                                        : "bg-[#0c0d12] border-[#c5a059]/25 hover:border-[#c5a059]/60 hover:bg-[#181a21]/50"
                                                                        }`}
                                                                    onClick={() => setSelectedSubclass(sub)}
                                                                >
                                                                    <div className="flex justify-between items-start mb-1.5">
                                                                        <div className="font-cinzel font-bold text-sm text-slate-100">
                                                                            {sub.name}
                                                                        </div>
                                                                        {isSelected && (
                                                                            <Badge className="bg-[#c5a059] text-[#0c0d12] font-bold text-[10px] px-1.5 py-0">
                                                                                Selected
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-[#d1cdb8]/70 line-clamp-3 leading-relaxed">
                                                                        {sub.description}
                                                                    </p>
                                                                </Card>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ASI / Feat Milestone */}
                                        {milestoneType === 'asi_feat' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="font-cinzel font-bold text-sm tracking-wide text-[#c5a059] flex items-center gap-2">
                                                        <Zap className="w-4 h-4 text-amber-400" />
                                                        Ability Score Improvement or Feat (Level {nextClassLevel})
                                                    </h4>
                                                    <p className="text-xs text-[#d1cdb8]/70 mt-0.5">
                                                        Strengthen your core abilities or adopt a specialized feat.
                                                    </p>
                                                </div>

                                                {/* Choice Tabs */}
                                                <div className="flex border-b border-[#c5a059]/30">
                                                    <button
                                                        onClick={() => setAsiChoiceType('asi')}
                                                        className={`pb-2.5 px-4 text-xs font-cinzel font-bold tracking-wider uppercase transition-colors ${asiChoiceType === 'asi'
                                                            ? 'text-[#c5a059] border-b-2 border-[#c5a059]'
                                                            : 'text-[#d1cdb8]/60 hover:text-slate-200'
                                                            }`}
                                                    >
                                                        Ability Score Improvement (ASI)
                                                    </button>
                                                    <button
                                                        onClick={() => setAsiChoiceType('feat')}
                                                        className={`pb-2.5 px-4 text-xs font-cinzel font-bold tracking-wider uppercase transition-colors ${asiChoiceType === 'feat'
                                                            ? 'text-[#c5a059] border-b-2 border-[#c5a059]'
                                                            : 'text-[#d1cdb8]/60 hover:text-slate-200'
                                                            }`}
                                                    >
                                                        Choose a Feat
                                                    </button>
                                                </div>

                                                {asiChoiceType === 'asi' ? (
                                                    <div className="space-y-4 pt-1">
                                                        {/* ASI Mode */}
                                                        <div className="flex gap-4 text-xs">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    checked={asiMode === 'single'}
                                                                    onChange={() => setAsiMode('single')}
                                                                    className="text-[#c5a059] focus:ring-[#c5a059]"
                                                                />
                                                                <span>+2 to one ability score</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    checked={asiMode === 'double'}
                                                                    onChange={() => setAsiMode('double')}
                                                                    className="text-[#c5a059] focus:ring-[#c5a059]"
                                                                />
                                                                <span>+1 to two different ability scores</span>
                                                            </label>
                                                        </div>

                                                        {asiMode === 'single' ? (
                                                            <div>
                                                                <label className="block text-xs text-[#d1cdb8]/80 mb-1">Select Ability (+2):</label>
                                                                <select
                                                                    className="w-full bg-[#181a21] border border-[#c5a059]/40 rounded p-2 text-xs text-slate-100"
                                                                    value={singleAbility}
                                                                    onChange={(e) => setSingleAbility(e.target.value)}
                                                                >
                                                                    {ABILITIES.map(ab => {
                                                                        const currentScore = (character.stats as any)?.[ab.value] ?? 10;
                                                                        return (
                                                                            <option key={ab.value} value={ab.value}>
                                                                                {ab.label} ({ab.short}) — Current: {currentScore} → New: {Math.min(20, currentScore + 2)}
                                                                            </option>
                                                                        );
                                                                    })}
                                                                </select>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="block text-xs text-[#d1cdb8]/80 mb-1">First Ability (+1):</label>
                                                                    <select
                                                                        className="w-full bg-[#181a21] border border-[#c5a059]/40 rounded p-2 text-xs text-slate-100"
                                                                        value={ability1}
                                                                        onChange={(e) => setAbility1(e.target.value)}
                                                                    >
                                                                        {ABILITIES.map(ab => (
                                                                            <option key={ab.value} value={ab.value} disabled={ab.value === ability2}>
                                                                                {ab.label} ({ab.short})
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs text-[#d1cdb8]/80 mb-1">Second Ability (+1):</label>
                                                                    <select
                                                                        className="w-full bg-[#181a21] border border-[#c5a059]/40 rounded p-2 text-xs text-slate-100"
                                                                        value={ability2}
                                                                        onChange={(e) => setAbility2(e.target.value)}
                                                                    >
                                                                        {ABILITIES.map(ab => (
                                                                            <option key={ab.value} value={ab.value} disabled={ab.value === ability1}>
                                                                                {ab.label} ({ab.short})
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3 pt-1">
                                                        <div className="flex gap-2">
                                                            <div className="relative flex-1">
                                                                <Search className="w-3.5 h-3.5 text-[#d1cdb8]/50 absolute left-2.5 top-2.5" />
                                                                <Input
                                                                    placeholder="Search feats..."
                                                                    value={featSearch}
                                                                    onChange={(e) => setFeatSearch(e.target.value)}
                                                                    className="bg-[#181a21] border-[#c5a059]/40 text-xs pl-8 h-8"
                                                                />
                                                            </div>
                                                        </div>

                                                        {loadingFeats ? (
                                                            <div className="py-8 text-center text-xs text-[#c5a059] flex items-center justify-center gap-2">
                                                                <RefreshCw className="w-4 h-4 animate-spin" /> Loading feats...
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                                                                {filteredFeats.map(feat => {
                                                                    const isSelected = selectedFeat?.id === feat.id;
                                                                    return (
                                                                        <Card
                                                                            key={feat.id}
                                                                            className={`p-3 cursor-pointer transition-all ${isSelected
                                                                                ? "bg-[#181a21] border-2 border-[#c5a059] shadow-[0_0_12px_rgba(197,160,89,0.25)]"
                                                                                : "bg-[#0c0d12] border border-[#c5a059]/20 hover:border-[#c5a059]/50"
                                                                                }`}
                                                                            onClick={() => setSelectedFeat(feat)}
                                                                        >
                                                                            <div className="flex justify-between items-start">
                                                                                <div className="font-cinzel font-bold text-xs tracking-wide text-slate-100 flex items-center gap-2">
                                                                                    {feat.name}
                                                                                    {feat.ability_score_increase && (
                                                                                        <Badge className="bg-[#c5a059]/15 text-[#c5a059] border-[#c5a059]/30 text-[10px] px-1 py-0">
                                                                                            +{feat.ability_score_increase}
                                                                                        </Badge>
                                                                                    )}
                                                                                </div>
                                                                                {isSelected && (
                                                                                    <Badge className="bg-[#c5a059] text-[#0c0d12] font-bold text-[10px] px-1.5 py-0">
                                                                                        Selected
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-[11px] text-[#d1cdb8]/75 mt-1 line-clamp-2 leading-relaxed">
                                                                                {feat.description}
                                                                            </p>
                                                                        </Card>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Standard Progression (no milestone needed at this level) */}
                                        {milestoneType === 'none' && (
                                            <div className="bg-[#181a21] border border-[#c5a059]/30 rounded-lg p-5 text-center space-y-3">
                                                <div className="inline-flex p-3 rounded-full bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30">
                                                    <Flame className="w-8 h-8" />
                                                </div>
                                                <h4 className="font-cinzel font-bold text-sm tracking-wide text-[#c5a059]">
                                                    Core Class Progression
                                                </h4>
                                                <p className="text-xs text-[#d1cdb8]/80 max-w-md mx-auto leading-relaxed">
                                                    Advancing to <strong className="text-slate-100">Level {nextClassLevel}</strong> unlocks your core class features, improves your proficiency, and expands your hero's capabilities.
                                                </p>
                                                <div className="pt-2 text-[11px] text-[#c5a059]/70 italic">
                                                    No additional archetype or feat selection is required for this level.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STEP 3: REVIEW & ASCEND */}
                                {step === 3 && (
                                    <div className="space-y-4">
                                        <div className="text-center pb-2">
                                            <h4 className="font-cinzel font-bold text-base tracking-wide text-[#c5a059]">
                                                Ascension Review
                                            </h4>
                                            <p className="text-xs text-[#d1cdb8]/70">
                                                Verify your level-up choices before finalizing
                                            </p>
                                        </div>

                                        <Card className="bg-[#181a21] border-2 border-[#c5a059]/40 p-4 space-y-3.5">
                                            {/* Level & Class */}
                                            <div className="flex items-center justify-between pb-2.5 border-b border-[#c5a059]/20">
                                                <span className="text-xs text-[#d1cdb8]/70">Character Advancement:</span>
                                                <span className="font-cinzel font-bold text-xs text-slate-100 flex items-center gap-1.5">
                                                    {selectedClassObj?.name} Level {nextClassLevel}
                                                    <Badge className="bg-[#c5a059] text-[#0c0d12] text-[10px] font-bold px-1.5 py-0">
                                                        Total Level {nextTotalLevel}
                                                    </Badge>
                                                </span>
                                            </div>

                                            {/* Hit Points */}
                                            <div className="flex items-center justify-between pb-2.5 border-b border-[#c5a059]/20">
                                                <span className="text-xs text-[#d1cdb8]/70 flex items-center gap-1.5">
                                                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                                                    Hit Points Gain:
                                                </span>
                                                <span className="font-fira-sans font-bold text-xs text-emerald-400">
                                                    +{hpGain} HP ({currentMaxHP} → {newMaxHP})
                                                    <span className="text-[#d1cdb8]/60 font-lora font-normal text-[11px] ml-1.5">
                                                        ({hpMode === 'fixed' ? 'Fixed Average' : `Rolled ${rolledHP}`})
                                                    </span>
                                                </span>
                                            </div>

                                            {/* Subclass if selected */}
                                            {milestoneType === 'subclass' && selectedSubclass && (
                                                <div className="flex items-center justify-between pb-2.5 border-b border-[#c5a059]/20">
                                                    <span className="text-xs text-[#d1cdb8]/70 flex items-center gap-1.5">
                                                        <Shield className="w-3.5 h-3.5 text-[#c5a059]" />
                                                        Chosen Subclass:
                                                    </span>
                                                    <span className="font-cinzel font-bold text-xs text-[#c5a059]">
                                                        {selectedSubclass.name}
                                                    </span>
                                                </div>
                                            )}

                                            {/* ASI or Feat if selected */}
                                            {milestoneType === 'asi_feat' && (
                                                <div className="flex items-center justify-between pb-2.5 border-b border-[#c5a059]/20">
                                                    <span className="text-xs text-[#d1cdb8]/70 flex items-center gap-1.5">
                                                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                                                        Chosen Milestone:
                                                    </span>
                                                    <span className="font-bold text-xs text-[#c5a059]">
                                                        {asiChoiceType === 'asi'
                                                            ? (asiMode === 'single' ? `+2 ${singleAbility.toUpperCase()}` : `+1 ${ability1.toUpperCase()}, +1 ${ability2.toUpperCase()}`)
                                                            : selectedFeat?.name
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            {/* Core Features */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-[#d1cdb8]/70 flex items-center gap-1.5">
                                                    <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
                                                    Class Features:
                                                </span>
                                                <span className="text-xs text-[#d1cdb8]/80 italic">
                                                    Standard {selectedClassObj?.name} features will be unlocked
                                                </span>
                                            </div>
                                        </Card>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <DialogFooter className="p-4 border-t border-[#c5a059]/20 bg-[#151821]/80 flex justify-between items-center">
                        {ascended ? (
                            <Button
                                onClick={handleClose}
                                className="w-full bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs shadow-[0_0_15px_rgba(197,160,89,0.4)]"
                            >
                                Close & View Character
                            </Button>
                        ) : (
                            <div className="w-full flex justify-between items-center">
                                <div>
                                    {step > 1 ? (
                                        <Button
                                            variant="ghost"
                                            onClick={() => setStep((step - 1) as 1 | 2)}
                                            className="text-[#d1cdb8]/70 hover:text-slate-100 hover:bg-[#c5a059]/10 text-xs"
                                        >
                                            Back
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            onClick={handleClose}
                                            className="text-[#d1cdb8]/70 hover:text-slate-100 hover:bg-[#c5a059]/10 text-xs"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>

                                <div>
                                    {step === 1 && (
                                        <Button
                                            onClick={handleProceedToStep2}
                                            disabled={!selectedClassId || loading || (hpMode === 'rolled' && (rolledHP === null || isRolling))}
                                            className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs shadow-[0_0_12px_rgba(197,160,89,0.3)] transition-all flex items-center gap-1.5"
                                        >
                                            Continue to Milestones
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </Button>
                                    )}

                                    {step === 2 && (
                                        <Button
                                            onClick={() => setStep(3)}
                                            disabled={
                                                (milestoneType === 'subclass' && !selectedSubclass) ||
                                                (milestoneType === 'asi_feat' && asiChoiceType === 'feat' && !selectedFeat) ||
                                                loading
                                            }
                                            className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs shadow-[0_0_12px_rgba(197,160,89,0.3)] transition-all flex items-center gap-1.5"
                                        >
                                            Review Ascension
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </Button>
                                    )}

                                    {step === 3 && (
                                        <Button
                                            onClick={handleAscend}
                                            disabled={loading}
                                            className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs shadow-[0_0_20px_rgba(197,160,89,0.5)] transition-all flex items-center gap-2 px-5 animate-pulse"
                                        >
                                            {loading ? (
                                                <>
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                    Ascending...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    Ascend to Level {nextTotalLevel}
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
