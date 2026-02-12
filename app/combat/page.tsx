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
    const { user, isAuthenticated } = useAuthStore();
    const [sessions, setSessions] = useState<CombatSession[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog state for viewing completed combat details
    const [selectedSession, setSelectedSession] = useState<CombatSession | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [startOpen, setStartOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        loadSessions();
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

    const activeSessions = sessions.filter(s => s.is_active);
    const completedSessions = sessions.filter(s => !s.is_active);

    const handleViewSession = async (session: CombatSession) => {
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
                                            Round {session.round_number}
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
                                            {session.round_number} rounds
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
                <Dialog open={startOpen} onOpenChange={setStartOpen}>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Combat #{selectedSession?.id} Details</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Ended on {selectedSession?.ended_at ? new Date(selectedSession.ended_at).toLocaleString() : 'N/A'} • {selectedSession?.round_number} Rounds
                            </DialogDescription>
                        </DialogHeader>

                        {detailLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                            </div>
                        ) : selectedSession ? (
                            <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden min-h-0">
                                {/* Left Column: Participants & Stats */}
                                <div className="space-y-4 overflow-y-auto pr-2">
                                    <h3 className="text-lg font-semibold">Participants</h3>
                                    <div className="space-y-2">
                                        {selectedSession.participants?.map(p => (
                                            <div key={p.id} className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium text-white">{p.name}</div>
                                                    <div className="text-xs text-slate-400">{p.participant_type}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-sm ${p.current_hp > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {p.current_hp} / {p.max_hp} HP
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Column: Combat Log */}
                                <div className="flex flex-col h-full overflow-hidden">
                                    <h3 className="text-lg font-semibold mb-2">Combat Log</h3>
                                    <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                                        <CombatLog actions={selectedSession.actions || []} />
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
