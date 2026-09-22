'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/authStore';
import { charactersApi } from '@/lib/api/characters';
import { gauntletApi } from '@/lib/api/gauntlet';
import { combatApi } from '@/lib/api/combat';
import { Character } from '@/lib/types/character';
import { GauntletRun, GauntletTheme } from '@/lib/types/gauntlet';
import { CombatSession } from '@/lib/types/combat';
import Navbar from '@/components/layout/Navbar';
import FancyHeaderLogo from '@/components/ui/FancyHeaderLogo';
import FantasyCard from '@/components/ui/FantasyCard';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Trophy, Swords, Shield, Skull, Flame, TreePine, Castle, Users, Play, Award, Check, ShieldAlert } from 'lucide-react';

interface ThemeOption {
    id: GauntletTheme;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

export default function GauntletLobbyPage() {
    const router = useRouter();
    const { isAuthenticated, user, fetchCurrentUser } = useAuthStore();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedCharIds, setSelectedCharIds] = useState<number[]>([]);
    const [selectedTheme, setSelectedTheme] = useState<GauntletTheme>('colosseum');
    const [runName, setRunName] = useState('Colosseum Trial');
    const [loading, setLoading] = useState(true);
    const [launching, setLaunching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Combat limits state
    const [combatSessions, setCombatSessions] = useState<CombatSession[]>([]);
    const [limitModalOpen, setLimitModalOpen] = useState(false);
    const [limitModalInfo, setLimitModalInfo] = useState({ title: '', description: '' });

    // Leaderboard state
    const [leaderboard, setLeaderboard] = useState<GauntletRun[]>([]);
    const [activeTab, setActiveTab] = useState<'lobby' | 'leaderboard'>('lobby');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (!user) {
            fetchCurrentUser();
        }

        loadData();
    }, [isAuthenticated, router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [charsResp, lbResp, sessionsResp] = await Promise.all([
                charactersApi.getAll(),
                gauntletApi.getLeaderboard(),
                combatApi.getAll().catch(() => ({ data: [] as CombatSession[] })),
            ]);

            const charList: Character[] = Array.isArray(charsResp.data)
                ? charsResp.data
                : (charsResp.data as any).results || [];
            setCharacters(charList);
            // Default select up to 4 characters
            if (charList.length > 0) {
                setSelectedCharIds(charList.slice(0, 4).map(c => c.id));
            }

            setLeaderboard(Array.isArray(lbResp.data) ? lbResp.data : []);

            const rawSessions: CombatSession[] = Array.isArray(sessionsResp.data)
                ? sessionsResp.data
                : (sessionsResp.data as any)?.results || [];
            setCombatSessions(rawSessions.filter(
                s => !(s.status === 'preparing' && (!s.participants || s.participants.length === 0))
            ));
        } catch (err) {
            console.error('Failed to load gauntlet staging data:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleCharacter = (charId: number) => {
        setSelectedCharIds(prev => {
            if (prev.includes(charId)) {
                return prev.filter(id => id !== charId);
            }
            if (prev.length >= 6) return prev; // max 6
            return [...prev, charId];
        });
    };

    const selectedHeroes = characters.filter(c => selectedCharIds.includes(c.id));
    const avgPartyLevel = selectedHeroes.length > 0
        ? Math.max(1, Math.round(selectedHeroes.reduce((acc, c) => acc + (c.level || 1), 0) / selectedHeroes.length))
        : 1;

    const activeCombatCount = combatSessions.filter(
        s => (s.is_active || s.status === 'active' || s.status === 'preparing') &&
             !(s.status === 'preparing' && (!s.participants || s.participants.length === 0))
    ).length;
    const totalCombatCount = combatSessions.length;
    const isAtActiveLimit = activeCombatCount >= 2;
    const isAtTotalLimit = totalCombatCount >= 10;
    const isAtCombatLimit = isAtActiveLimit || isAtTotalLimit;

    const handleStartGauntlet = async (autoDelete: boolean = false) => {
        if (selectedCharIds.length === 0) {
            setError('Please select at least 1 hero for the Gauntlet.');
            return;
        }

        if (!autoDelete && isAtCombatLimit) {
            let title = 'Battle Limit Reached';
            let description = '';
            if (isAtActiveLimit && isAtTotalLimit) {
                description = 'You have reached both your active skirmish limit (2 / 2) and war archives capacity (10 / 10). Please delete a battle from your history, or click below to start this new trial right now (which will delete the oldest combat).';
            } else if (isAtActiveLimit) {
                description = 'You have reached the maximum number of active skirmishes (2 / 2). Please delete an ongoing battle, or click below to start this new trial right now (which will remove the oldest active combat).';
            } else {
                description = 'Your war archives have reached the limit of 10 total battles. Please delete an older battle from your history, or click below to start this new trial right now (which will delete the oldest combat).';
            }
            setLimitModalInfo({ title, description });
            setLimitModalOpen(true);
            return;
        }

        setLaunching(true);
        setError(null);
        setLimitModalOpen(false);

        try {
            const resp = await gauntletApi.createRun({
                name: runName || `${selectedTheme.toUpperCase()} Trial`,
                theme: selectedTheme,
                character_ids: selectedCharIds,
                auto_delete_oldest: autoDelete,
            });

            const run = resp.data;
            if (run.current_combat_session_id) {
                router.push(`/combat/${run.current_combat_session_id}?gauntletRunId=${run.id}`);
            } else {
                router.push('/combat');
            }
        } catch (err: any) {
            const data = err?.response?.data;
            const code = data?.code;

            // Extract specific error details if DRF returned field-level or object validation errors
            let errorMsg = data?.error || data?.detail;
            if (!errorMsg && data && typeof data === 'object') {
                const messages = Object.entries(data)
                    .filter(([k]) => k !== 'code' && k !== 'limit_type')
                    .map(([k, v]) => `${k !== 'non_field_errors' ? `${k}: ` : ''}${Array.isArray(v) ? v.join(', ') : v}`);
                if (messages.length > 0) {
                    errorMsg = messages.join(' | ');
                }
            }
            if (!errorMsg) {
                errorMsg = 'Failed to initialize Gauntlet run.';
            }

            if (code === 'ACTIVE_LIMIT_REACHED' || code === 'TOTAL_LIMIT_REACHED') {
                setLimitModalInfo({
                    title: 'Battle Limit Reached',
                    description: errorMsg.includes('delete') ? errorMsg : `${errorMsg} Would you like to delete the oldest combat and start now?`
                });
                setLimitModalOpen(true);
            } else {
                setError(errorMsg);
            }
            setLaunching(false);
        }
    };

    const themes: ThemeOption[] = [
        {
            id: 'colosseum',
            name: 'Colosseum of Blades',
            description: 'Gladiators, trained beasts, ogres, and martial champions fight under the roar of the arena.',
            icon: <Swords className="w-5 h-5 text-amber-400" />,
            color: 'border-amber-500/50 bg-amber-950/20',
        },
        {
            id: 'crypt',
            name: 'Crypt of the Undead',
            description: 'Chilling catacombs haunted by skeletons, flesh-eating ghouls, wights, and dread wraiths.',
            icon: <Skull className="w-5 h-5 text-indigo-400" />,
            color: 'border-indigo-500/50 bg-indigo-950/20',
        },
        {
            id: 'inferno',
            name: 'Infernal Pit',
            description: 'Molten caverns teeming with hell hounds, magma elementals, cult fanatics, and fiery drakes.',
            icon: <Flame className="w-5 h-5 text-rose-400" />,
            color: 'border-rose-500/50 bg-rose-950/20',
        },
        {
            id: 'wilds',
            name: 'Savage Wilds',
            description: 'Dense primeval wilderness stalked by pack wolves, giant spiders, owlbears, and manticores.',
            icon: <TreePine className="w-5 h-5 text-emerald-400" />,
            color: 'border-emerald-500/50 bg-emerald-950/20',
        },
        {
            id: 'dungeon',
            name: 'Sunken Dungeon',
            description: 'Ancient subterranean labyrinth crawling with kobold traps, troglodytes, oozes, and aberrations.',
            icon: <Castle className="w-5 h-5 text-cyan-400" />,
            color: 'border-cyan-500/50 bg-cyan-950/20',
        },
    ];

    return (
        <div className="min-h-screen bg-[#0c0d12] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#1a1d29_0%,#0e1017_45%,#07080b_100%)] text-slate-100 flex flex-col p-4 md:p-8">
            <Navbar />

            <div className="w-full max-w-6xl mx-auto space-y-6 pt-4 pb-12">
                {/* Header */}
                <div className="text-center space-y-2">
                    <FancyHeaderLogo
                        title="THE GAUNTLET"
                        subtitle="PROCEDURAL WAVE SURVIVAL ARENA"
                        className="mx-auto"
                    />
                    <p className="text-xs sm:text-sm text-slate-300 font-lora italic max-w-2xl mx-auto">
                        Stage your heroes into snapshot instances for high-intensity arcade wave combat.
                        Expended resources and damage are localized strictly to the arena—heroes return unharmed!
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex justify-center border-b border-slate-800 pb-2">
                    <div className="flex gap-2 p-1 bg-[#181a21] rounded-lg border border-[#c5a059]/30">
                        <button
                            onClick={() => setActiveTab('lobby')}
                            className={`px-4 py-1.5 rounded text-xs font-cinzel font-bold tracking-wider transition-all ${
                                activeTab === 'lobby'
                                    ? 'bg-[#c5a059] text-slate-950 shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                                    : 'text-slate-300 hover:text-white'
                            }`}
                        >
                            ⚔️ Arena Staging
                        </button>
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`px-4 py-1.5 rounded text-xs font-cinzel font-bold tracking-wider transition-all ${
                                activeTab === 'leaderboard'
                                    ? 'bg-[#c5a059] text-slate-950 shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                                    : 'text-slate-300 hover:text-white'
                            }`}
                        >
                            🏆 High Scores
                        </button>
                    </div>
                </div>

                {activeTab === 'lobby' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* Left Column (2 Cols): Party Staging & Theme */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* 1. Hero Selection */}
                            <FantasyCard className="p-5">
                                <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/30 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-[#c5a059]" />
                                        <h2 className="font-cinzel text-lg font-bold text-[#c5a059]">
                                            Assemble Your Party (1–6 Heroes)
                                        </h2>
                                    </div>
                                    <span className="text-xs font-fira-sans px-2 py-0.5 rounded bg-slate-800 text-amber-200 border border-slate-700">
                                        Selected: {selectedCharIds.length} / 6
                                    </span>
                                </div>

                                {loading ? (
                                    <div className="text-center py-8 text-xs text-slate-400 font-lora">
                                        Gathering heroes from the roster...
                                    </div>
                                ) : characters.length === 0 ? (
                                    <div className="text-center py-8 space-y-3">
                                        <p className="text-xs text-slate-400 font-lora">No heroes found in your roster.</p>
                                        <Link
                                            href="/characters/create"
                                            className="inline-block px-4 py-2 rounded bg-[#c5a059] text-slate-950 font-bold text-xs font-cinzel"
                                        >
                                            Create a Character
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {characters.map((char) => {
                                            const isSelected = selectedCharIds.includes(char.id);
                                            const hp = (char as any).stats?.hit_points || (char as any).max_hp || 10;
                                            const maxHp = (char as any).stats?.max_hit_points || (char as any).max_hp || 10;

                                            return (
                                                <div
                                                    key={char.id}
                                                    onClick={() => toggleCharacter(char.id)}
                                                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-between ${
                                                        isSelected
                                                            ? 'bg-amber-950/30 border-[#c5a059] shadow-[0_0_12px_rgba(197,160,89,0.25)]'
                                                            : 'bg-[#0c0d12]/60 border-slate-800 hover:border-slate-700'
                                                    }`}
                                                >
                                                    <div className="space-y-1">
                                                        <div className="font-bold text-sm font-cinzel text-white flex items-center gap-1.5">
                                                            <span>{char.name}</span>
                                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-fira-sans font-normal">
                                                                Lvl {char.level || 1}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-slate-400 font-lora">
                                                            {(char as any).character_class?.name || 'Adventurer'}
                                                        </div>
                                                        <div className="text-[11px] text-emerald-400 font-fira-sans">
                                                            HP: {hp} / {maxHp}
                                                        </div>
                                                    </div>

                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                        isSelected ? 'bg-[#c5a059] border-[#c5a059] text-slate-950' : 'border-slate-700'
                                                    }`}>
                                                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </FantasyCard>

                            {/* 2. Arena Theme Selection */}
                            <FantasyCard className="p-5">
                                <div className="flex items-center gap-2 pb-3 border-b border-[#c5a059]/30 mb-4">
                                    <Shield className="w-5 h-5 text-[#c5a059]" />
                                    <h2 className="font-cinzel text-lg font-bold text-[#c5a059]">
                                        Select Arena Theme
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {themes.map((th) => {
                                        const isSelected = selectedTheme === th.id;
                                        return (
                                            <div
                                                key={th.id}
                                                onClick={() => {
                                                    setSelectedTheme(th.id);
                                                    setRunName(`${th.name} Trial`);
                                                }}
                                                className={`p-3.5 rounded-lg border-2 transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'border-[#c5a059] bg-amber-950/30 shadow-[0_0_12px_rgba(197,160,89,0.25)]'
                                                        : 'border-slate-800 bg-[#0c0d12]/60 hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    {th.icon}
                                                    <h3 className="font-cinzel font-bold text-sm text-white">{th.name}</h3>
                                                </div>
                                                <p className="text-xs text-slate-400 font-lora leading-relaxed">
                                                    {th.description}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </FantasyCard>
                        </div>

                        {/* Right Column (1 Col): Trial Preview & Action */}
                        <div className="space-y-4">
                            <FantasyCard className="p-5 sticky top-6">
                                <div className="border-b border-[#c5a059]/30 pb-3 mb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Trophy className="w-4 h-4 text-[#c5a059]" />
                                        <h3 className="font-cinzel text-sm font-bold text-[#c5a059] uppercase tracking-wider">
                                            Trial Specifications
                                        </h3>
                                    </div>
                                    <input
                                        type="text"
                                        value={runName}
                                        onChange={(e) => setRunName(e.target.value)}
                                        className="w-full bg-[#181a21] border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 font-cinzel focus:outline-none focus:border-[#c5a059]"
                                        placeholder="Run Title"
                                    />
                                </div>

                                <div className="space-y-3 text-xs font-lora pb-4 border-b border-slate-800">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Party Size:</span>
                                        <span className="font-bold text-white font-fira-sans">{selectedCharIds.length} Heroes</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Average Party Level:</span>
                                        <span className="font-bold text-[#c5a059] font-fira-sans">Level {avgPartyLevel}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Escalation Arc:</span>
                                        <span className="font-semibold text-slate-200">Waves 1–10 + Endless</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Mini-Boss Climax:</span>
                                        <span className="font-semibold text-rose-300">Wave 5</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Apex Boss Climax:</span>
                                        <span className="font-semibold text-amber-300">Wave 10</span>
                                    </div>
                                </div>

                                {/* Snapshot Safety Box */}
                                <div className="my-4 p-3 rounded bg-[#181a21]/90 border border-emerald-500/30 text-[11px] text-emerald-300 font-lora leading-relaxed">
                                    🛡️ <strong>Zero-Risk Sandbox:</strong> All heroes enter as isolated snapshots. Deaths, spell slot usage, and HP loss do not affect your character sheets!
                                </div>

                                {error && (
                                    <p className="text-xs text-rose-400 font-lora mb-3">{error}</p>
                                )}

                                <button
                                    disabled={selectedCharIds.length === 0 || launching}
                                    onClick={() => handleStartGauntlet(false)}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-cinzel font-bold text-sm tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    <span>{launching ? 'Summoning Wave 1...' : 'Enter The Gauntlet'}</span>
                                </button>
                            </FantasyCard>
                        </div>
                    </div>
                ) : (
                    /* Leaderboard Tab */
                    <FantasyCard className="p-6">
                        <div className="flex items-center gap-2 pb-4 border-b border-[#c5a059]/30 mb-6">
                            <Award className="w-6 h-6 text-[#c5a059]" />
                            <div>
                                <h2 className="font-cinzel text-xl font-bold text-[#c5a059]">
                                    Hall of Champions
                                </h2>
                                <p className="text-xs text-slate-400 font-lora">
                                    Greatest trials recorded in the Gauntlet arena.
                                </p>
                            </div>
                        </div>

                        {leaderboard.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-xs font-lora">
                                No completed Gauntlet trials recorded yet. Be the first to conquer the arena!
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {leaderboard.map((r, idx) => (
                                    <div
                                        key={r.id}
                                        className="p-3.5 rounded-lg bg-[#0c0d12]/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-lora"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold font-fira-sans text-sm ${
                                                idx === 0 ? 'bg-[#c5a059] text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-800 text-white' : 'bg-slate-800 text-slate-400'
                                            }`}>
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <div className="font-bold text-white font-cinzel text-sm">{r.name}</div>
                                                <div className="text-slate-400 capitalize">{r.theme} Arena • Party Level {r.party_level}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <div className="text-[10px] text-slate-400 font-cinzel uppercase">Waves</div>
                                                <div className="font-bold font-fira-sans text-white text-sm">
                                                    {r.is_endless ? `Endless ${r.current_wave}` : `${r.current_wave} / 10`}
                                                </div>
                                            </div>

                                            <div className="text-center">
                                                <div className="text-[10px] text-slate-400 font-cinzel uppercase">Kills</div>
                                                <div className="font-bold font-fira-sans text-emerald-400 text-sm">
                                                    {r.enemies_killed}
                                                </div>
                                            </div>

                                            <div className="text-center">
                                                <div className="text-[10px] text-slate-400 font-cinzel uppercase">Score</div>
                                                <div className="font-bold font-fira-sans text-[#c5a059] text-base">
                                                    {r.score.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </FantasyCard>
                )}

                {/* Battle Limit Confirmation Modal */}
                <Dialog open={limitModalOpen} onOpenChange={setLimitModalOpen}>
                    <DialogContent className="max-w-md bg-[#10121a] border border-[#c5a059]/40 text-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.8)] p-6">
                        <DialogHeader className="space-y-2">
                            <div className="flex items-center gap-3 text-amber-400">
                                <ShieldAlert className="w-6 h-6 shrink-0" />
                                <DialogTitle className="font-cinzel-decorative text-xl text-[#c5a059]">
                                    {limitModalInfo.title || 'Battle Limit Reached'}
                                </DialogTitle>
                            </div>
                            <DialogDescription className="font-lora text-sm text-[#d1cdb8]/85 leading-relaxed pt-2">
                                {limitModalInfo.description}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-6 pt-4 border-t border-[#c5a059]/20 font-lora">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setLimitModalOpen(false);
                                    router.push('/combat');
                                }}
                                className="w-full sm:w-auto bg-[#181a24] border-[#c5a059]/40 text-[#d1cdb8] hover:bg-[#202330] hover:text-white"
                            >
                                Review War Archives
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleStartGauntlet(true)}
                                disabled={launching}
                                className="w-full sm:w-auto bg-gradient-to-r from-[#c5a059] to-[#d6b16a] text-[#0c0d12] hover:brightness-110 font-bold shadow-[0_0_15px_rgba(197,160,89,0.3)]"
                            >
                                {launching ? 'Deploying...' : 'Delete Oldest & Start'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
