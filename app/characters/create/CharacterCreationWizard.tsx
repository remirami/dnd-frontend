"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import FantasyCard from "@/components/ui/FantasyCard";
import { Sparkles, ShieldAlert, Dices } from "lucide-react";
import api from "@/lib/api/client";

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

import { charactersApi } from "@/lib/api/characters";

export default function CharacterCreationWizard() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isRandomizing, setIsRandomizing] = useState(false);
    const [isRandomizingStep, setIsRandomizingStep] = useState(false);
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

    const [characterCount, setCharacterCount] = useState<number | null>(null);

    useEffect(() => {
        const checkLimit = async () => {
            try {
                const res = await charactersApi.getAll();
                const total = res.data?.results?.length ?? (Array.isArray(res.data) ? res.data.length : 0);
                setCharacterCount(total);
            } catch (err) {
                console.error("Failed to check character count:", err);
            }
        };
        checkLimit();
    }, []);

    const updateFormData = (updates: Partial<CharacterFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const isLimitReached = characterCount !== null && characterCount >= 20;

    const handleRandomizeAll = async () => {
        if (isLimitReached) {
            alert("Hero limit reached (20/20). Please delete an existing character before creating a new one.");
            return;
        }
        setIsRandomizing(true);
        try {
            const res = await charactersApi.generateRandom({
                preview: true,
                ruleset_version: formData.ruleset_version
            });
            const data = res.data;
            setFormData({
                name: data.name || "",
                ruleset_version: data.ruleset_version || "2014",
                race_id: data.race_id || null,
                character_class_id: data.character_class_id || null,
                character_class_name: data.character_class_name,
                subclass: data.subclass || null,
                background_id: data.background_id || null,
                background_asi_selection: {},
                alignment: data.alignment || "N",
                bonds: data.bonds || "",
                flaws: data.flaws || "",
                ideals: data.ideals || "",
                strength: data.strength ?? 10,
                dexterity: data.dexterity ?? 10,
                constitution: data.constitution ?? 10,
                intelligence: data.intelligence ?? 10,
                wisdom: data.wisdom ?? 10,
                charisma: data.charisma ?? 10,
                hp_method: data.hp_method || "fixed",
                equipment_selections: data.equipment_selections || {},
                cantrip_ids: data.cantrip_ids || [],
                spell_ids: data.spell_ids || [],
                language_ids: data.language_ids || [],
            });
            // Jump directly to Review step so user can review the whole character or tweak!
            setCurrentStep(7);
        } catch (err) {
            console.error("Failed to randomize character:", err);
            alert("Failed to roll random character. Please try again.");
        } finally {
            setIsRandomizing(false);
        }
    };

    const handleRandomizeCurrentStep = async () => {
        if (isLimitReached) {
            alert("Hero limit reached (20/20). Please delete an existing character before creating a new one.");
            return;
        }
        setIsRandomizingStep(true);
        try {
            switch (currentStep) {
                case 1: {
                    // Step 1: Basic Info (Name, Race, Class, Background, Languages)
                    const res = await charactersApi.generateRandom({
                        preview: true,
                        ruleset_version: formData.ruleset_version,
                    });
                    const d = res.data;
                    updateFormData({
                        name: d.name || "",
                        race_id: d.race_id || null,
                        character_class_id: d.character_class_id || null,
                        character_class_name: d.character_class_name,
                        background_id: d.background_id || null,
                        language_ids: d.language_ids || [],
                        subclass: null,
                        equipment_selections: {},
                        cantrip_ids: [],
                        spell_ids: [],
                    });
                    break;
                }
                case 2: {
                    // Step 2: Subclass Selection
                    if (!formData.character_class_id) {
                        alert("Please select a character class first.");
                        break;
                    }
                    const subRes = await api.get(
                        `/character-classes/${formData.character_class_id}/subclasses/?ruleset=${formData.ruleset_version || '2014'}`
                    );
                    const subList = Array.isArray(subRes.data) ? subRes.data : [];
                    if (subList.length > 0) {
                        const randomSub = subList[Math.floor(Math.random() * subList.length)];
                        updateFormData({ subclass: randomSub.name || randomSub.id });
                    }
                    break;
                }
                case 3: {
                    // Step 3: Personality (Alignment, Bonds, Flaws, Ideals)
                    const alignments = ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"];
                    const ideals = [
                        "Freedom. Chains are made to be broken, as are those who would forge them.",
                        "Honor. If I give my word, I will keep it until my final breath.",
                        "Knowledge. The path to power and self-improvement is paved with wisdom.",
                        "Community. We have a sacred duty to protect those who cannot protect themselves.",
                        "Respect. All folk deserve to be treated with dignity and fairness.",
                        "Glory. My deeds will echo in song and legend long after I am gone.",
                        "Discovery. The world is vast and full of forgotten wonders waiting to be uncovered.",
                        "Balance. Nature and power must remain in equilibrium.",
                        "Loyalty. Never turn your back on those who bleed beside you in battle."
                    ];
                    const bonds = [
                        "I will do whatever it takes to protect the companions who stand beside me.",
                        "I seek to prove myself worthy of my ancestors' noble legacy.",
                        "An ancient heirloom or unanswered debt drives me out into the wider world.",
                        "My loyalty to my allies is unwavering, no matter the danger.",
                        "I swore an oath to avenge my fallen mentor and restore their honor.",
                        "I fight for those who cannot fight for themselves."
                    ];
                    const flaws = [
                        "I have a hard time resisting a boastful wager or a physical challenge.",
                        "I am overly suspicious of anyone who claims to act out of pure altruism.",
                        "I speak my mind bluntly before thinking about the consequences.",
                        "I am slow to trust strangers, even when they offer aid.",
                        "I harbor a dark secret that I fear my friends will discover.",
                        "I cannot resist a mystery, even when it is obviously dangerous."
                    ];

                    updateFormData({
                        alignment: alignments[Math.floor(Math.random() * alignments.length)],
                        ideals: ideals[Math.floor(Math.random() * ideals.length)],
                        bonds: bonds[Math.floor(Math.random() * bonds.length)],
                        flaws: flaws[Math.floor(Math.random() * flaws.length)],
                    });
                    break;
                }
                case 4: {
                    // Step 4: Ability Scores & HP Method
                    const roll = () => {
                        const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
                        dice.sort((a, b) => a - b);
                        return dice.slice(1).reduce((a, b) => a + b, 0);
                    };
                    const rolls = Array.from({ length: 6 }, roll).sort((a, b) => b - a);

                    const statPriorities: Record<string, string[]> = {
                        barbarian: ['strength', 'constitution', 'dexterity', 'wisdom', 'charisma', 'intelligence'],
                        bard: ['charisma', 'dexterity', 'constitution', 'wisdom', 'intelligence', 'strength'],
                        cleric: ['wisdom', 'constitution', 'strength', 'dexterity', 'charisma', 'intelligence'],
                        druid: ['wisdom', 'constitution', 'dexterity', 'intelligence', 'charisma', 'strength'],
                        fighter: ['strength', 'constitution', 'dexterity', 'wisdom', 'intelligence', 'charisma'],
                        monk: ['dexterity', 'wisdom', 'constitution', 'strength', 'charisma', 'intelligence'],
                        paladin: ['strength', 'charisma', 'constitution', 'wisdom', 'dexterity', 'intelligence'],
                        ranger: ['dexterity', 'wisdom', 'constitution', 'strength', 'intelligence', 'charisma'],
                        rogue: ['dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma', 'strength'],
                        sorcerer: ['charisma', 'constitution', 'dexterity', 'wisdom', 'intelligence', 'strength'],
                        warlock: ['charisma', 'constitution', 'dexterity', 'wisdom', 'intelligence', 'strength'],
                        wizard: ['intelligence', 'constitution', 'dexterity', 'wisdom', 'charisma', 'strength'],
                    };

                    const cls = (formData.character_class_name || '').toLowerCase().split('(')[0].trim();
                    const priority = statPriorities[cls] || ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

                    const newScores: Record<string, number> = {};
                    priority.forEach((stat, idx) => {
                        newScores[stat] = rolls[idx];
                    });

                    let bgASI: Record<string, number> = {};
                    if (formData.ruleset_version === '2024' && formData.background_id) {
                        try {
                            const bgRes = await api.get(`/character-backgrounds/${formData.background_id}/`);
                            const bg = bgRes.data;
                            const options: string[] = (bg.ability_score_options || '').split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
                            if (options.length >= 2) {
                                const matching = priority.filter(p => options.includes(p));
                                if (matching.length >= 2) {
                                    bgASI[matching[0]] = 2;
                                    bgASI[matching[1]] = 1;
                                } else {
                                    bgASI[options[0]] = 2;
                                    bgASI[options[1]] = 1;
                                }
                            }
                        } catch (e) {
                            console.error("Failed to load background for ASI", e);
                        }
                    }

                    const hpMethods = ["fixed", "average", "manual"];
                    const hp_method = hpMethods[Math.floor(Math.random() * hpMethods.length)];

                    updateFormData({
                        strength: newScores.strength ?? 10,
                        dexterity: newScores.dexterity ?? 10,
                        constitution: newScores.constitution ?? 10,
                        intelligence: newScores.intelligence ?? 10,
                        wisdom: newScores.wisdom ?? 10,
                        charisma: newScores.charisma ?? 10,
                        hp_method,
                        background_asi_selection: bgASI,
                    });
                    break;
                }
                case 5: {
                    // Step 5: Equipment Selection
                    let clsName = formData.character_class_name;
                    if (!clsName && formData.character_class_id) {
                        const classResponse = await api.get(`/character-classes/${formData.character_class_id}/`);
                        clsName = classResponse.data.name;
                    }
                    if (!clsName) {
                        alert("Please select a character class first.");
                        break;
                    }

                    const [equipRes, simpleWpRes, martialWpRes] = await Promise.all([
                        api.get(`/characters/starting_equipment_choices/?class_name=${clsName}`),
                        api.get('/weapons/?category=simple'),
                        api.get('/weapons/?category=martial'),
                    ]);

                    const choices = equipRes.data?.choices || [];
                    const simpleWps = simpleWpRes.data?.results || simpleWpRes.data || [];
                    const martialWps = martialWpRes.data?.results || martialWpRes.data || [];

                    const newSelections: Record<string, string> = {};
                    for (const choice of choices) {
                        const options = choice.options || [];
                        if (options.length > 0) {
                            const randOpt = options[Math.floor(Math.random() * options.length)];
                            const choiceNum = choice.choice_number.toString();
                            newSelections[choiceNum] = randOpt.label;

                            if (randOpt.additional_choice) {
                                const count = randOpt.additional_choice.count || 1;
                                const category = randOpt.additional_choice.category || 'simple';
                                const pool = category === 'martial' ? martialWps : simpleWps;
                                for (let i = 0; i < count; i++) {
                                    if (pool.length > 0) {
                                        const w = pool[Math.floor(Math.random() * pool.length)];
                                        newSelections[`${choiceNum}_sub_${i}`] = w.name;
                                    }
                                }
                            }
                        }
                    }

                    updateFormData({ equipment_selections: newSelections });
                    break;
                }
                case 6: {
                    // Step 6: Spells Selection
                    let clsName = formData.character_class_name;
                    if (!clsName && formData.character_class_id) {
                        const classResponse = await api.get(`/character-classes/${formData.character_class_id}/`);
                        clsName = classResponse.data.name;
                    }
                    if (!clsName) {
                        alert("Please select a character class first.");
                        break;
                    }

                    const res = await api.get(
                        `/characters/starting_spell_choices/?class_name=${clsName}&ruleset=${formData.ruleset_version || '2014'}`
                    );
                    const spellData = res.data;

                    if (spellData && !spellData.message && spellData.spells_info) {
                        const cantripCount = spellData.cantrips_count || 0;
                        const spellCount = spellData.spells_info.count || 0;

                        const shuffle = <T,>(arr: T[]): T[] => {
                            const c = [...arr];
                            for (let i = c.length - 1; i > 0; i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [c[i], c[j]] = [c[j], c[i]];
                            }
                            return c;
                        };

                        const availCantrips: any[] = spellData.available_cantrips || [];
                        const availSpells: any[] = spellData.available_spells || [];

                        const pickedCantripIds = shuffle(availCantrips).slice(0, cantripCount).map(c => c.id);
                        const pickedSpellIds = shuffle(availSpells).slice(0, spellCount).map(s => s.id);

                        updateFormData({
                            cantrip_ids: pickedCantripIds,
                            spell_ids: pickedSpellIds,
                        });
                    }
                    break;
                }
                case 7: {
                    // Step 7: Review Step
                    await handleRandomizeAll();
                    break;
                }
            }
        } catch (err) {
            console.error("Failed to randomize step:", err);
            alert("Failed to randomize this page. Please try again.");
        } finally {
            setIsRandomizingStep(false);
        }
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
                        onRandomizeStep={handleRandomizeCurrentStep}
                        isRandomizingStep={isRandomizingStep}
                    />
                );
            case 2:
                return (
                    <SubclassSelectionStep
                        formData={formData}
                        updateFormData={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                        onRandomizeStep={handleRandomizeCurrentStep}
                        isRandomizingStep={isRandomizingStep}
                    />
                );
            case 3:
                return (
                    <PersonalityStep
                        formData={formData}
                        updateFormData={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                        onRandomizeStep={handleRandomizeCurrentStep}
                        isRandomizingStep={isRandomizingStep}
                    />
                );
            case 4:
                return (
                    <AbilityScoresStep
                        formData={formData}
                        updateFormData={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                        onRandomizeStep={handleRandomizeCurrentStep}
                        isRandomizingStep={isRandomizingStep}
                    />
                );
            case 5:
                return (
                    <EquipmentSelectionStep
                        formData={formData}
                        updateFormData={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                        onRandomizeStep={handleRandomizeCurrentStep}
                        isRandomizingStep={isRandomizingStep}
                    />
                );
            case 6:
                return (
                    <SpellSelectionStep
                        formData={formData}
                        onUpdate={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                        onRandomizeStep={handleRandomizeCurrentStep}
                        isRandomizingStep={isRandomizingStep}
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
                        onRandomizeAll={handleRandomizeAll}
                        isRandomizing={isRandomizing}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#0c0d12] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,#1a1d29_0%,#0c0d12_70%)] text-slate-100 flex flex-col">
            {/* Universal 5E Navbar with Quick Random action */}
            <Navbar
                showActions={true}
                onQuickRandom={handleRandomizeAll}
                disableCreate={isLimitReached}
                createDisabledTooltip="Hero roster limit reached (20/20). Delete a hero to forge a new one."
                disableQuickRandom={isLimitReached || isRandomizing}
                quickRandomDisabledTooltip="Hero roster limit reached (20/20). Delete a hero to roll a new one."
            />

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 space-y-6">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs font-lora text-[#d1cdb8]/60">
                    <Link href="/" className="hover:text-[#c5a059] transition-colors">Home</Link>
                    <span className="text-[#c5a059]/40">/</span>
                    <Link href="/characters" className="hover:text-[#c5a059] transition-colors">Characters</Link>
                    <span className="text-[#c5a059]/40">/</span>
                    <span className="text-[#c5a059] font-medium">Create</span>
                </div>

                {/* Hero Limit Warning Banner if Roster Full */}
                {isLimitReached && (
                    <div className="p-4 rounded bg-[#181a21] border border-amber-500/50 flex items-start gap-3 text-amber-200 text-sm font-lora shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-left">
                            <p className="font-bold text-amber-300">Hero Limit Reached (20 / 20)</p>
                            <p className="text-xs text-amber-200/80 leading-relaxed">
                                Your account has reached the limit of 20 characters. You cannot persist a new hero to your roster until you delete an existing character.
                            </p>
                            <Link
                                href="/characters"
                                className="inline-block mt-2 text-xs font-semibold text-[#c5a059] underline hover:text-[#e0bc75] transition-colors"
                            >
                                ← Return to My Characters to manage heroes
                            </Link>
                        </div>
                    </div>
                )}

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="font-cinzel-decorative text-2xl md:text-3xl font-bold tracking-wide text-[#c5a059] drop-shadow-[0_2px_12px_rgba(197,160,89,0.3)]">
                            CREATE CHARACTER
                        </h1>
                        <p className="font-lora text-xs sm:text-sm text-[#d1cdb8]/70 mt-1">
                            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name} — {STEPS[currentStep - 1].description}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <button
                            type="button"
                            onClick={handleRandomizeCurrentStep}
                            disabled={isRandomizingStep || isRandomizing || isLimitReached}
                            title={`Randomize ${STEPS[currentStep - 1]?.name || 'this page'}`}
                            className="px-3.5 py-2 bg-[#181a21] hover:bg-[#c5a059]/15 text-[#c5a059] hover:text-[#e0bc75] font-lora font-semibold text-xs sm:text-sm rounded border border-[#c5a059]/60 shadow-[0_0_15px_rgba(197,160,89,0.15)] hover:shadow-[0_0_20px_rgba(197,160,89,0.3)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Dices className={`w-4 h-4 text-[#c5a059] ${isRandomizingStep ? "animate-spin" : ""}`} />
                            <span>{isRandomizingStep ? "Rolling..." : "Randomize This Page"}</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleRandomizeAll}
                            disabled={isRandomizing || isRandomizingStep || isLimitReached}
                            title={isLimitReached ? "Hero roster limit reached (20/20)" : "Randomize character"}
                            className="px-3.5 py-2 bg-[#181a21] hover:bg-[#c5a059]/15 text-[#c5a059] hover:text-[#e0bc75] font-lora font-semibold text-xs sm:text-sm rounded border border-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.2)] hover:shadow-[0_0_20px_rgba(197,160,89,0.35)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Sparkles className="w-4 h-4 text-[#c5a059]" />
                            <span>{isRandomizing ? "Rolling..." : "Randomize Character"}</span>
                        </button>
                        <div className="text-right pl-3 border-l border-[#c5a059]/20 hidden sm:block">
                            <div className="text-[10px] uppercase font-lora text-[#d1cdb8]/60 tracking-wider">Progress</div>
                            <div className="text-xl font-bold font-fira-sans text-[#c5a059]">{Math.round(progress)}%</div>
                        </div>
                    </div>
                </div>

                {/* Filigree Divider */}
                <div className="flex items-center gap-3 opacity-60">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c5a059]/40" />
                    <span className="text-[10px] text-[#c5a059]">✦</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c5a059]/40" />
                </div>

                {/* Wizard Container Card */}
                <FantasyCard className="p-6 md:p-8 font-lora">
                    {/* Progress Bar */}
                    <div className="w-full bg-[#12141a] h-2 rounded-full overflow-hidden border border-[#c5a059]/20 mb-6">
                        <div
                            className="bg-gradient-to-r from-[#9b7b39] via-[#c5a059] to-[#e0bc75] h-full transition-all duration-300 shadow-[0_0_10px_rgba(197,160,89,0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Step Indicators */}
                    <div className="flex justify-between mb-8 gap-1">
                        {STEPS.map((step) => {
                            const isClickable = !!(formData.name && formData.race_id && formData.character_class_id) || step.number <= currentStep;
                            const isCompleted = step.number < currentStep;
                            const isCurrent = step.number === currentStep;

                            return (
                                <div
                                    key={step.number}
                                    onClick={() => {
                                        if (isClickable) {
                                            if (step.number === 2 && !shouldShowSubclassStep(formData)) return;
                                            setCurrentStep(step.number);
                                        }
                                    }}
                                    className={`flex flex-col items-center flex-1 transition-all ${
                                        isClickable ? "cursor-pointer group" : "cursor-not-allowed opacity-40"
                                    }`}
                                >
                                    <div
                                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all font-fira-sans ${
                                            isCurrent
                                                ? "bg-[#c5a059] text-[#0c0d12] shadow-[0_0_15px_rgba(197,160,89,0.5)] border border-[#e0bc75] scale-110"
                                                : isCompleted
                                                    ? "bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/60 group-hover:bg-[#22c55e]/25"
                                                    : "bg-[#12141a] text-[#d1cdb8]/40 border border-[#c5a059]/20 group-hover:border-[#c5a059]/50"
                                        }`}
                                    >
                                        {isCompleted ? "✓" : step.number}
                                    </div>
                                    <div
                                        className={`text-[11px] text-center hidden sm:block font-lora tracking-wide transition-colors ${
                                            isCurrent
                                                ? "font-bold text-[#c5a059]"
                                                : isCompleted
                                                    ? "text-[#d1cdb8]/80"
                                                    : "text-[#d1cdb8]/40"
                                        }`}
                                    >
                                        {step.name}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Step Content */}
                    <div className="pt-2 text-slate-100">
                        {renderStep()}
                    </div>
                </FantasyCard>
            </main>
        </div>
    );
}
