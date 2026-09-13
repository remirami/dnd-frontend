"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { combatApi } from "@/lib/api/combat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CombatLog } from "./[id]/CombatLog";
import type { CombatSession } from "@/lib/types/combat";

export default function CombatListPage() {
    const router = useRouter();
    const { user, isAuthenticated, fetchCurrentUser } = useAuthStore();
    const [sessions, setSessions] = useState<CombatSession[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog state for viewing completed combat details
    const [selectedSession, setSelectedSession] = useState<CombatSession | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [startOpen, setStartOpen] = useState(false);
    const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        if (!user) {
            fetchCurrentUser();
        }

        loadSessions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, router]);

    const loadSessions = async () => {
        try {
            const response = await combatApi.getAll();
            // Handle both paginated and non-paginated responses
            const data = Array.isArray(response.data) ? response.data : (response.data as any).results || [];
            setSessions(data);
        } catch (error) {
            console.error("Failed to load combat sessions:", error);
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = async () => {
        try {
            const response = await combatApi.create({});
            // Redirect to setup page instead of starting immediately
            router.push(`/combat/${response.data.id}/setup`);
        } catch (error) {
            console.error("Failed to create combat session:", error);
            alert("Failed to create combat session");
        }
    };

    const handleDeleteSession = async (id: number) => {
        if (!confirm("Are you sure you want to delete this combat session?")) return;

        try {
            await combatApi.delete(id);
            loadSessions();
        } catch (error) {
            console.error("Failed to delete session:", error);
            alert("Failed to delete combat session");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center text-white">
                Loading combat sessions...
            </div>
        );
    }

    const activeSessions = sessions.filter(s => s.is_active || s.status === 'active');
    const completedSessions = sessions.filter(s => s.status === 'ended');

    const handleViewSession = async (session: CombatSession) => {
        setSelectedParticipantId(null);
        setDetailLoading(true);
        setStartOpen(true);
        try {
            // Fetch full session details including actions
            const response = await combatApi.getById(session.id);
            setSelectedSession(response.data);
        } catch (error) {
            console.error("Failed to load session details:", error);
            alert("Failed to load session details");
            setStartOpen(false);
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold">Combat Sessions</h1>
                        <p className="text-slate-400 mt-2">Welcome back, {user?.username}!</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => router.push("/")}
                            className="bg-slate-700 hover:bg-slate-600 text-white"
                        >
                            Home
                        </Button>
                        <Button
                            onClick={() => router.push("/changelog")}
                            variant="outline"
                            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                        >
                            📜 Updates
                        </Button>
                        <Button
                            onClick={handleCreateSession}
                            size="lg"
                            className="bg-red-600 hover:bg-red-700"
                        >
                            New Combat
                        </Button>
                    </div>
                </div>

                {/* Active Sessions */}
                {activeSessions.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">Active Combats</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeSessions.map((session) => (
                                <Card
                                    key={session.id}
                                    className="bg-slate-800 border-slate-700 hover:border-amber-500 transition-all cursor-pointer"
                                    onClick={() => router.push(`/combat/${session.id}`)}
                                >
                                    <CardHeader>
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            Combat #{session.id}
                                        </CardTitle>
                                        <CardDescription className="text-slate-400">
                                            Round {session.current_round}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-400">Participants:</span>
                                                <span className="font-semibold text-white">
                                                    {session.participants?.length || 0}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-400">Started:</span>
                                                <span className="text-white">
                                                    {session.started_at
                                                        ? new Date(session.started_at).toLocaleTimeString()
                                                        : "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Completed Sessions */}
                {completedSessions.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Completed Combats</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {completedSessions.map((session) => (
                                <Card
                                    key={session.id}
                                    className="bg-slate-800 border-slate-700 opacity-75 hover:opacity-100 hover:border-slate-500 transition-all cursor-pointer"
                                    onClick={() => handleViewSession(session)}
                                >
                                    <CardHeader>
                                        <CardTitle className="text-white flex justify-between items-center">
                                            <span>Combat #{session.id}</span>
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSession(session.id);
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                            >
                                                Delete
                                            </Button>
                                        </CardTitle>
                                        <CardDescription className="text-slate-400">
                                            {session.current_round} rounds
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm text-slate-400">
                                            Ended: {session.ended_at
                                                ? new Date(session.ended_at).toLocaleString()
                                                : "N/A"}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {sessions.length === 0 && (
                    <Card className="max-w-2xl mx-auto bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white">No Combat Sessions Yet</CardTitle>
                            <CardDescription className="text-slate-400">
                                Create your first combat session to start tracking initiative and managing encounters!
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handleCreateSession}
                                className="w-full bg-red-600 hover:bg-red-700"
                                size="lg"
                            >
                                Create Your First Combat
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Combat Detail Modal */}
                <Dialog open={startOpen} onOpenChange={(open) => {
                    setStartOpen(open);
                    if (!open) setSelectedParticipantId(null);
                }}>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white w-[96vw] max-w-[96vw] sm:max-w-none md:max-w-5xl lg:max-w-6xl xl:max-w-7xl h-[88vh] max-h-[920px] flex flex-col p-4 sm:p-6 overflow-hidden">
                        <DialogHeader className="shrink-0 pb-1 sm:pb-2">
                            <DialogTitle className="text-xl sm:text-2xl font-bold">Combat #{selectedSession?.id} Details</DialogTitle>
                            <DialogDescription className="text-slate-400 text-xs sm:text-sm">
                                Ended on {selectedSession?.ended_at ? new Date(selectedSession.ended_at).toLocaleString() : 'N/A'} • {selectedSession?.current_round} Rounds
                            </DialogDescription>
                        </DialogHeader>

                        {detailLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                            </div>
                        ) : selectedSession ? (
                            <div className="flex-1 flex flex-col md:flex-row gap-4 lg:gap-6 overflow-hidden min-h-0 pt-2">
                                {/* Left Column: Participants */}
                                <div className="w-full md:w-[320px] lg:w-[360px] xl:w-[400px] shrink-0 flex flex-col min-h-0 overflow-hidden">
                                    <div className="flex items-center justify-between shrink-0 mb-2">
                                        <h3 className="text-base sm:text-lg font-semibold text-slate-200">Participants</h3>
                                        {selectedParticipantId !== null && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedParticipantId(null)}
                                                className="text-xs text-slate-400 hover:text-white h-7 px-2"
                                            >
                                                Show All
                                            </Button>
                                        )}
                                    </div>

                                    {/* All Participants Filter Option */}
                                    <div
                                        onClick={() => setSelectedParticipantId(null)}
                                        className={`p-2.5 sm:p-3 rounded border text-sm cursor-pointer transition-all flex items-center justify-between shrink-0 mb-2.5 ${
                                            selectedParticipantId === null
                                                ? "bg-slate-800 border-amber-500/80 text-white font-medium ring-1 ring-amber-500/40 shadow-sm"
                                                : "bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">All Participants</span>
                                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                                ({selectedSession.actions?.length || 0} total actions)
                                            </span>
                                        </div>
                                        {selectedParticipantId === null && (
                                            <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-medium">
                                                Active
                                            </span>
                                        )}
                                    </div>

                                    {/* Scrollable list of participants */}
                                    <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 pr-1.5 min-h-0">
                                        {selectedSession.participants?.map(p => {
                                            const isSelected = selectedParticipantId === p.id;
                                            const participantActions = selectedSession.actions?.filter(
                                                a => a.actor === p.id || a.target === p.id ||
                                                     (!!a.actor_name && !!p.name && a.actor_name.trim().toLowerCase() === p.name.trim().toLowerCase()) ||
                                                     (!!a.target_name && !!p.name && a.target_name.trim().toLowerCase() === p.name.trim().toLowerCase())
                                            ) || [];
                                            const outgoingActions = selectedSession.actions?.filter(
                                                a => a.actor === p.id || (!!a.actor_name && !!p.name && a.actor_name.trim().toLowerCase() === p.name.trim().toLowerCase())
                                            ) || [];
                                            const incomingActions = selectedSession.actions?.filter(
                                                a => a.target === p.id || (!!a.target_name && !!p.name && a.target_name.trim().toLowerCase() === p.name.trim().toLowerCase())
                                            ) || [];

                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => setSelectedParticipantId(isSelected ? null : p.id)}
                                                    className={`p-2.5 sm:p-3 rounded border transition-all cursor-pointer flex justify-between items-center gap-3 ${
                                                        isSelected
                                                            ? "bg-slate-800 border-amber-500 ring-2 ring-amber-500/50 shadow-md"
                                                            : "bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600"
                                                    }`}
                                                >
                                                    <div className="min-w-0 flex-1 space-y-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-white truncate">{p.name}</span>
                                                            <span className="text-[11px] text-slate-400 capitalize shrink-0">({p.participant_type})</span>
                                                        </div>
                                                        <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-slate-300 font-medium whitespace-nowrap">{participantActions.length} actions</span>
                                                            <span className="text-slate-600">•</span>
                                                            <span className="text-emerald-400/90 whitespace-nowrap">{outgoingActions.length} taken</span>
                                                            <span className="text-slate-600">•</span>
                                                            <span className="text-rose-400/90 whitespace-nowrap">{incomingActions.length} received</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className={`text-sm font-medium whitespace-nowrap ${p.current_hp > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                            {p.current_hp} / {p.max_hp} HP
                                                        </div>
                                                        {isSelected && (
                                                            <div className="text-[11px] text-amber-400 font-medium mt-0.5 whitespace-nowrap">
                                                                Filtering Log
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right Column: Combat Log */}
                                <div className="flex-1 flex flex-col min-h-0 min-w-0 h-full overflow-hidden">
                                    <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden min-h-0 flex flex-col">
                                        <CombatLog
                                            actions={selectedSession.actions || []}
                                            selectedParticipant={selectedSession.participants?.find(p => p.id === selectedParticipantId) || null}
                                            onClearFilter={() => setSelectedParticipantId(null)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
