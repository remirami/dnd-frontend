import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { charactersApi } from "@/lib/api/characters";
import type { Character } from "@/lib/types/character";

interface EditCharacterDialogProps {
    character: Character;
    onUpdate: () => void;
}

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

export function EditCharacterDialog({ character, onUpdate }: EditCharacterDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState(character.name);
    const [alignment, setAlignment] = useState(character.alignment || "N");
    const [description, setDescription] = useState(character.description || "");
    const [backstory, setBackstory] = useState(character.backstory || "");
    const [bonds, setBonds] = useState(character.bonds || "");
    const [flaws, setFlaws] = useState(character.flaws || "");
    const [ideals, setIdeals] = useState(character.ideals || "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await charactersApi.update(character.id, {
                name,
                alignment,
                description,
                backstory,
                bonds,
                flaws,
                ideals,
            });
            setOpen(false);
            onUpdate();
        } catch (error) {
            console.error("Failed to update character:", error);
            alert("Failed to update character");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-[#181a21] border border-[#c5a059]/50 text-[#c5a059] hover:bg-[#c5a059]/15 text-xs font-lora font-semibold px-3 py-1.5 h-auto rounded transition-colors shadow-sm">
                    Edit Details
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12141a] text-slate-100 border border-[#c5a059] sm:max-w-[520px] max-h-[90vh] overflow-y-auto shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                <DialogHeader>
                    <DialogTitle className="font-cinzel-decorative text-lg text-[#c5a059] font-bold tracking-wide">
                        Edit Character Details
                    </DialogTitle>
                    <DialogDescription className="font-lora text-xs text-[#d1cdb8]/70">
                        Update your character's roleplay details and identity.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 font-lora">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs text-[#d1cdb8]">Character Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-[#181a21] border-[#c5a059]/40 text-slate-100 text-sm focus:border-[#c5a059]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="alignment" className="text-xs text-[#d1cdb8]">Alignment</Label>
                        <Select value={alignment} onValueChange={setAlignment}>
                            <SelectTrigger className="bg-[#181a21] border-[#c5a059]/40 text-slate-100 text-sm focus:border-[#c5a059]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#181a21] border-[#c5a059]/40 text-slate-100">
                                {ALIGNMENTS.map((a) => (
                                    <SelectItem key={a.value} value={a.value} className="focus:bg-[#c5a059]/15 focus:text-[#c5a059]">
                                        {a.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-xs text-[#d1cdb8]">Visual Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                            placeholder="Height, weight, hair color, distinct features..."
                            className="bg-[#181a21] border-[#c5a059]/40 text-slate-100 min-h-[70px] text-sm focus:border-[#c5a059]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="backstory" className="text-xs text-[#d1cdb8]">Backstory</Label>
                        <Textarea
                            id="backstory"
                            value={backstory}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBackstory(e.target.value)}
                            placeholder="Where did they come from? Why are they adventuring?"
                            className="bg-[#181a21] border-[#c5a059]/40 text-slate-100 min-h-[90px] text-sm focus:border-[#c5a059]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="bonds" className="text-xs text-[#d1cdb8]">Bonds</Label>
                        <Textarea
                            id="bonds"
                            value={bonds}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBonds(e.target.value)}
                            placeholder="What connections do you have to people, places, or events?"
                            className="bg-[#181a21] border-[#c5a059]/40 text-slate-100 min-h-[50px] text-sm focus:border-[#c5a059]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="flaws" className="text-xs text-[#d1cdb8]">Flaws</Label>
                        <Textarea
                            id="flaws"
                            value={flaws}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFlaws(e.target.value)}
                            placeholder="What are your character's weaknesses or vices?"
                            className="bg-[#181a21] border-[#c5a059]/40 text-slate-100 min-h-[50px] text-sm focus:border-[#c5a059]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="ideals" className="text-xs text-[#d1cdb8]">Ideals</Label>
                        <Textarea
                            id="ideals"
                            value={ideals}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIdeals(e.target.value)}
                            placeholder="What beliefs or principles drive your character?"
                            className="bg-[#181a21] border-[#c5a059]/40 text-slate-100 min-h-[50px] text-sm focus:border-[#c5a059]"
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-[#d1cdb8]/70 hover:text-[#d1cdb8] hover:bg-[#c5a059]/10 text-xs">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs shadow-[0_0_12px_rgba(197,160,89,0.3)] transition-all">
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
