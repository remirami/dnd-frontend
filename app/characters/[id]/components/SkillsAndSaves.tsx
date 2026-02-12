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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Saving Throws */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h3 className="text-lg font-bold text-slate-100 mb-3 border-b border-slate-700 pb-2">Saving Throws</h3>
                <div className="space-y-1">
                    {saveList.map(([ability, data]) => (
                        <div key={ability} className="flex items-center justify-between p-1 hover:bg-slate-700/50 rounded group">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full border ${data.proficient ? 'bg-amber-500 border-amber-500' : 'border-slate-500'}`} />
                                <span className="capitalize text-slate-300 font-medium">{ability}</span>
                            </div>
                            <span className={`font-bold font-mono ${data.proficient ? 'text-amber-400' : 'text-slate-400'}`}>
                                {formatModifier(data.bonus)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Skills */}
            <div className="lg:col-span-2 bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h3 className="text-lg font-bold text-slate-100 mb-3 border-b border-slate-700 pb-2">Skills</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                    {skillList.map(([name, data]) => (
                        <div key={name} className="flex items-center justify-between p-1 hover:bg-slate-700/50 rounded group">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full border flex items-center justify-center
                                    ${data.expertise
                                        ? 'bg-purple-600 border-purple-600'
                                        : data.proficient
                                            ? 'bg-amber-500 border-amber-500'
                                            : 'border-slate-500'
                                    }`}
                                    title={data.expertise ? "Expertise" : data.proficient ? "Proficient" : "Not Proficient"}
                                >
                                    {data.expertise && <span className="text-[8px] text-white">E</span>}
                                </div>
                                <span className="text-slate-300">
                                    {name} <span className="text-xs text-slate-500">({data.ability.substring(0, 3)})</span>
                                </span>
                            </div>
                            <span className={`font-bold font-mono ${data.proficient ? 'text-white' : 'text-slate-400'}`}>
                                {formatModifier(data.bonus)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
