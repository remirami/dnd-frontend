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
                    <Button variant="outline" size="sm">
                        Manage HP
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manage Hit Points</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Current: <span className="text-white font-bold">{currentHP}</span> / {maxHP}
                        {tempHP > 0 && <span className="text-purple-400 font-bold ml-2">(+{tempHP} Temp)</span>}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="heal" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-800">
                        <TabsTrigger value="heal" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Heal</TabsTrigger>
                        <TabsTrigger value="damage" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">Damage</TabsTrigger>
                        <TabsTrigger value="temp" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Temp HP</TabsTrigger>
                    </TabsList>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white text-lg font-bold text-center"
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && handleAction()}
                            />
                        </div>

                        {message && (
                            <div className={`text-sm text-center p-2 rounded ${message.includes("Failed") ? "bg-red-900/50 text-red-200" : "bg-slate-800 text-green-400"
                                }`}>
                                {message}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleAction}
                            disabled={loading || !amount || parseInt(amount) <= 0}
                            className={`w-full ${activeTab === 'heal' ? 'bg-green-600 hover:bg-green-700' :
                                    activeTab === 'damage' ? 'bg-red-600 hover:bg-red-700' :
                                        'bg-purple-600 hover:bg-purple-700'
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
