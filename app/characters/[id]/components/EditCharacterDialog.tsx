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
                <Button variant="default" className="bg-slate-700 hover:bg-slate-600 text-white font-semibold">
                    Edit Details
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 text-white border-slate-700 sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Character Details</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Update your character's roleplay details.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Character Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-slate-800 border-slate-600 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="alignment">Alignment</Label>
                        <Select value={alignment} onValueChange={setAlignment}>
                            <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600 text-white">
                                {ALIGNMENTS.map((a) => (
                                    <SelectItem key={a.value} value={a.value}>
                                        {a.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Visual Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                            placeholder="Height, weight, hair color, distinct features..."
                            className="bg-slate-800 border-slate-600 text-white min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="backstory">Backstory</Label>
                        <Textarea
                            id="backstory"
                            value={backstory}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBackstory(e.target.value)}
                            placeholder="Where did they come from? Why are they adventuring?"
                            className="bg-slate-800 border-slate-600 text-white min-h-[120px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bonds">Bonds</Label>
                        <Textarea
                            id="bonds"
                            value={bonds}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBonds(e.target.value)}
                            placeholder="What connections do you have to people, places, or events?"
                            className="bg-slate-800 border-slate-600 text-white min-h-[60px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="flaws">Flaws</Label>
                        <Textarea
                            id="flaws"
                            value={flaws}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFlaws(e.target.value)}
                            placeholder="What are your character's weaknesses or vices?"
                            className="bg-slate-800 border-slate-600 text-white min-h-[60px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ideals">Ideals</Label>
                        <Textarea
                            id="ideals"
                            value={ideals}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIdeals(e.target.value)}
                            placeholder="What beliefs or principles drive your character?"
                            className="bg-slate-800 border-slate-600 text-white min-h-[60px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
