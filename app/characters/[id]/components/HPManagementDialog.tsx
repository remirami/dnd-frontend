import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { charactersApi } from "@/lib/api/characters";
import type { Character } from "@/lib/types/character";

interface HPManagementDialogProps {
    character: Character;
    onUpdate: () => void;
    children?: React.ReactNode;
}

export function HPManagementDialog({ character, onUpdate, children }: HPManagementDialogProps) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("heal");
    const [message, setMessage] = useState<string | null>(null);

    const stats = character.stats;
    if (!stats) return null;

    const currentHP = stats.hit_points;
    const maxHP = stats.max_hit_points;
    const tempHP = stats.temporary_hit_points || 0;

    const handleAction = async () => {
        const val = parseInt(amount);
        if (isNaN(val) || val < 0) return;

        setLoading(true);
        try {
            const response = await charactersApi.updateHP(character.id, {
                action: activeTab as 'heal' | 'damage' | 'temp',
                amount: val
            });
            setMessage(response.data.message);
            setAmount("");
            onUpdate();

            // Auto close after short delay if successful
            setTimeout(() => {
                setOpen(false);
                setMessage(null);
            }, 1500);
        } catch (error: any) {
            console.error("Failed to update HP:", error);
            setMessage(error.response?.data?.error || "Failed to update HP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm" className="bg-[#181a21] border border-[#c5a059]/50 text-[#c5a059] hover:bg-[#c5a059]/15 text-xs font-lora">
                        Manage HP
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-[#12141a] border border-[#c5a059] text-slate-100 sm:max-w-[425px] shadow-[0_0_25px_rgba(0,0,0,0.8)]">
                <DialogHeader>
                    <DialogTitle className="font-cinzel-decorative text-lg text-[#c5a059] font-bold tracking-wide">
                        Manage Hit Points
                    </DialogTitle>
                    <DialogDescription className="font-lora text-xs text-[#d1cdb8]/70">
                        Current: <span className="text-emerald-400 font-bold font-fira-sans">{currentHP}</span> / <span className="font-fira-sans">{maxHP}</span>
                        {tempHP > 0 && <span className="text-amber-300 font-bold font-fira-sans ml-2">(+{tempHP} Temp)</span>}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="heal" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-[#181a21] border border-[#c5a059]/30 p-1">
                        <TabsTrigger value="heal" className="text-xs font-lora data-[state=active]:bg-emerald-700 data-[state=active]:text-white">Heal</TabsTrigger>
                        <TabsTrigger value="damage" className="text-xs font-lora data-[state=active]:bg-rose-900 data-[state=active]:text-white">Damage</TabsTrigger>
                        <TabsTrigger value="temp" className="text-xs font-lora data-[state=active]:bg-[#c5a059] data-[state=active]:text-[#0c0d12] data-[state=active]:font-bold">Temp HP</TabsTrigger>
                    </TabsList>

                    <div className="py-4 space-y-4 font-lora">
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-xs text-[#d1cdb8]">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-[#181a21] border-[#c5a059]/40 text-slate-100 text-lg font-bold text-center font-fira-sans"
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && handleAction()}
                            />
                        </div>

                        {message && (
                            <div className={`text-xs text-center p-2 rounded ${message.includes("Failed") ? "bg-rose-950/60 text-rose-200 border border-rose-800" : "bg-[#181a21] text-[#c5a059] border border-[#c5a059]/30"
                                }`}>
                                {message}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleAction}
                            disabled={loading || !amount || parseInt(amount) <= 0}
                            className={`w-full text-xs font-bold transition-all shadow-md ${activeTab === 'heal' ? 'bg-emerald-700 hover:bg-emerald-600 text-white' :
                                    activeTab === 'damage' ? 'bg-rose-900 hover:bg-rose-800 text-rose-100' :
                                        'bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12]'
                                }`}
                        >
                            {loading ? "Updating..." :
                                activeTab === 'heal' ? "Heal" :
                                    activeTab === 'damage' ? "Apply Damage" :
                                        "Set Temp HP"}
                        </Button>
                    </DialogFooter>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
