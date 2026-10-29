import { Character } from "@/lib/types/character";
import { formatModifier } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SkillsAndSavesProps {
    character: Character;
}

export function SkillsAndSaves({ character }: SkillsAndSavesProps) {
    const skills = character.skills || {};
    const saves = character.saving_throws || {};

    const skillList = Object.entries(skills).sort((a, b) => a[0].localeCompare(b[0]));
    const saveList = Object.entries(saves).sort((a, b) => {
        const order = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        return order.indexOf(a[0]) - order.indexOf(b[0]);
    });

    const exhaustionLevel = character.stats?.exhaustion_level || 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Saving Throws */}
            <div className="bg-[#12141a] rounded-sm p-4 border border-[#c5a059]/30 shadow-md">
                <div className="flex items-center justify-between border-b border-[#c5a059]/20 pb-2 mb-3">
                    <h3 className="font-cinzel-decorative text-sm sm:text-base font-bold text-[#c5a059] tracking-wider">
                        Saving Throws
                    </h3>
                    {exhaustionLevel > 0 && (
                        <span className="text-[10px] font-fira-sans font-bold px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/50 text-amber-300" title={`Exhaustion subtracts -${exhaustionLevel} from all saving throw rolls`}>
                            -{exhaustionLevel} Exh.
                        </span>
                    )}
                </div>
                <div className="space-y-1">
                    {saveList.map(([ability, data]) => {
                        const effectiveBonus = data.bonus - exhaustionLevel;
                        return (
                            <div key={ability} className="flex items-center justify-between p-1.5 hover:bg-[#c5a059]/10 rounded transition-colors group">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full border transition-all ${data.proficient ? 'bg-[#c5a059] border-[#c5a059] shadow-[0_0_6px_rgba(197,160,89,0.5)]' : 'border-[#c5a059]/30 bg-transparent'}`} />
                                    <span className="capitalize font-lora text-xs sm:text-sm text-[#d1cdb8] font-medium">{ability}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {exhaustionLevel > 0 && (
                                        <span className="text-[10px] text-[#d1cdb8]/40 line-through font-mono">
                                            {formatModifier(data.bonus)}
                                        </span>
                                    )}
                                    <span className={`font-bold font-fira-sans text-xs sm:text-sm ${data.proficient ? 'text-[#c5a059]' : 'text-[#d1cdb8]/60'} ${exhaustionLevel > 0 ? 'text-amber-300' : ''}`}>
                                        {formatModifier(effectiveBonus)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Skills */}
            <div className="lg:col-span-2 bg-[#12141a] rounded-sm p-4 border border-[#c5a059]/30 shadow-md">
                <div className="flex items-center justify-between border-b border-[#c5a059]/20 pb-2 mb-3">
                    <h3 className="font-cinzel-decorative text-sm sm:text-base font-bold text-[#c5a059] tracking-wider">
                        Skills
                    </h3>
                    {exhaustionLevel > 0 && (
                        <span className="text-[10px] font-fira-sans font-bold px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/50 text-amber-300" title={`Exhaustion subtracts -${exhaustionLevel} from all ability checks`}>
                            -{exhaustionLevel} Exh.
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                    {skillList.map(([name, data]) => {
                        const effectiveBonus = data.bonus - exhaustionLevel;
                        return (
                            <div key={name} className="flex items-center justify-between p-1.5 hover:bg-[#c5a059]/10 rounded transition-colors group">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center transition-all
                                        ${data.expertise
                                            ? 'bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                            : data.proficient
                                                ? 'bg-[#c5a059] border-[#c5a059] shadow-[0_0_6px_rgba(197,160,89,0.5)]'
                                                : 'border-[#c5a059]/30 bg-transparent'
                                        }`}
                                        title={data.expertise ? "Expertise" : data.proficient ? "Proficient" : "Not Proficient"}
                                    >
                                        {data.expertise && <span className="text-[7px] text-[#0c0d12] font-black">E</span>}
                                    </div>
                                    <span className="font-lora text-xs sm:text-sm text-[#d1cdb8]">
                                        {name} <span className="text-[11px] text-[#d1cdb8]/50">({data.ability.substring(0, 3)})</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {exhaustionLevel > 0 && (
                                        <span className="text-[10px] text-[#d1cdb8]/40 line-through font-mono">
                                            {formatModifier(data.bonus)}
                                        </span>
                                    )}
                                    <span className={`font-bold font-fira-sans text-xs sm:text-sm ${data.proficient ? 'text-[#c5a059]' : 'text-[#d1cdb8]/60'} ${exhaustionLevel > 0 ? 'text-amber-300' : ''}`}>
                                        {formatModifier(effectiveBonus)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
