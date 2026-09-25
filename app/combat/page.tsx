"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { combatApi } from "@/lib/api/combat";
import Navbar from "@/components/layout/Navbar";
import FantasyCard from "@/components/ui/FantasyCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CombatLog } from "./[id]/CombatLog";
import { Swords, Plus, Trash2, ExternalLink, ShieldAlert, History, Play, Trophy, FileText, Sparkles } from "lucide-react";
import type { CombatSession } from "@/lib/types/combat";

export default function CombatListPage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchCurrentUser } = useAuthStore();
  const [sessions, setSessions] = useState<CombatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'all'>('active');

  // Dialog state for viewing completed combat details
  const [selectedSession, setSelectedSession] = useState<CombatSession | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null);

  // Dialog state for battle limit confirmation prompt
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitModalInfo, setLimitModalInfo] = useState({ title: "", description: "" });

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
      const data: CombatSession[] = Array.isArray(response.data)
        ? response.data
        : (response.data as any).results || [];
      // Clean up / filter out any ghost preparing sessions with 0 participants
      const validSessions = data.filter(
        (s) => !(s.status === "preparing" && (!s.participants || s.participants.length === 0))
      );
      setSessions(validSessions);
    } catch (error) {
      console.error("Failed to load combat sessions:", error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const activeSessions = sessions.filter(
    (s) => (s.is_active || s.status === "active" || s.status === "preparing") &&
           !(s.status === "preparing" && (!s.participants || s.participants.length === 0))
  );
  const completedSessions = sessions.filter((s) => s.status === "ended");
  const activeLimitReached = activeSessions.length >= 2;
  const totalLimitReached = sessions.length >= 10;
  const cannotCreateCombat = activeLimitReached || totalLimitReached;
  const createDisabledReason = activeLimitReached
    ? "Active combat limit reached (2/2). Finish or delete an ongoing battle before starting a new encounter."
    : totalLimitReached
    ? "Total combat limit reached (10/10). Delete an older session from your history before starting a new encounter."
    : "";

  const handleCreateSession = async (autoDelete: boolean = false) => {
    if (!autoDelete && cannotCreateCombat) {
      const title = activeLimitReached
        ? "Active Combat Limit Reached (2 / 2)"
        : "Combat Archive Limit Reached (10 / 10)";
      const description = activeLimitReached
        ? "You have reached the maximum number of active skirmishes (2 / 2). Finish or delete an ongoing battle, or click below to start a new encounter right now (deleting the oldest active combat)."
        : "Your war archives have reached the limit of 10 total sessions. Delete an older battle from your history, or click below to start a new encounter right now (deleting the oldest combat).";
      setLimitModalInfo({ title, description });
      setLimitModalOpen(true);
      return;
    }

    setLimitModalOpen(false);

    try {
      const response = await combatApi.create({ auto_delete_oldest: autoDelete });
      router.push(`/combat/${response.data.id}/setup`);
    } catch (error: any) {
      console.error("Failed to create combat session:", error);
      const code = error?.response?.data?.code;
      const errorMsg =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        "Failed to create combat session";
      if (code === "ACTIVE_LIMIT_REACHED" || code === "TOTAL_LIMIT_REACHED") {
        setLimitModalInfo({
          title: "Battle Limit Reached",
          description: errorMsg.includes("delete")
            ? errorMsg
            : `${errorMsg} Would you like to delete the oldest combat and start now?`,
        });
        setLimitModalOpen(true);
      } else {
        alert(errorMsg);
      }
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

  const handleViewSession = async (session: CombatSession) => {
    setSelectedParticipantId(null);
    setDetailLoading(true);
    setStartOpen(true);
    try {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0d12] text-slate-100 flex flex-col">
        <Navbar showActions={true} />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-24">
          <div className="w-9 h-9 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
          <p className="font-lora text-sm text-[#d1cdb8]/80 italic">
            Summoning the battlefield...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0d12] text-slate-100 flex flex-col">
      {/* Universal 5E Navbar */}
      <Navbar showActions={true} />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        {/* Title Header with Filigree Divider */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="font-cinzel-decorative text-3xl md:text-5xl font-bold tracking-widest text-[#c5a059] drop-shadow-[0_2px_12px_rgba(197,160,89,0.3)]">
            COMBAT ARENA
          </h1>
          <p className="font-lora text-sm text-[#d1cdb8]/80 mt-2 max-w-2xl mx-auto leading-relaxed">
            Manage turn-based tactical skirmishes, track initiative order, and execute martial actions.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4 opacity-80">
            <div className="h-[1px] w-16 sm:w-28 bg-gradient-to-r from-transparent to-[#c5a059]" />
            <span className="text-xs text-[#c5a059]">✦</span>
            <div className="h-[1px] w-16 sm:w-28 bg-gradient-to-l from-transparent to-[#c5a059]" />
          </div>

          {/* Combat Limits Counter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-lora border transition-all ${
                activeLimitReached
                  ? "bg-amber-950/40 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "bg-[#12141a] border-[#c5a059]/40 text-[#c5a059]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="font-semibold">Active: {activeSessions.length} / 2</span>
              {activeLimitReached && (
                <span className="text-[10px] uppercase font-bold text-amber-400">(Max)</span>
              )}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-lora border transition-all ${
                totalLimitReached
                  ? "bg-amber-950/40 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "bg-[#12141a] border-[#c5a059]/40 text-[#c5a059]"
              }`}
            >
              <History className="w-3.5 h-3.5 text-[#c5a059]" />
              <span className="font-semibold">Archive: {sessions.length} / 10</span>
              {totalLimitReached && (
                <span className="text-[10px] uppercase font-bold text-amber-400">(Full)</span>
              )}
            </span>
          </div>

          {/* Limit Warning Banner */}
          {cannotCreateCombat && (
            <div className="mt-5 max-w-2xl mx-auto p-4 rounded bg-[#181a21] border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 text-sm font-lora shadow-[0_0_15px_rgba(245,158,11,0.15)] text-left">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-300">
                    {activeLimitReached
                      ? "Active Combat Limit Reached (2 / 2)"
                      : "Combat Archive Limit Reached (10 / 10)"}
                  </p>
                  <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">
                    {activeLimitReached
                      ? "You have 2 active or preparing skirmishes in progress. Finish or delete an ongoing battle, or replace the oldest combat to start now."
                      : "Your war archives have reached the limit of 10 total sessions. Delete an older battle from your history, or replace the oldest combat to start now."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCreateSession(true)}
                className="shrink-0 px-3.5 py-1.5 rounded bg-gradient-to-r from-[#c5a059] to-[#d6b16a] text-[#0c0d12] font-bold text-xs hover:brightness-110 shadow-[0_0_12px_rgba(197,160,89,0.3)] transition-all cursor-pointer whitespace-nowrap self-end sm:self-center"
              >
                Replace Oldest & Start
              </button>
            </div>
          )}
        </div>

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 font-lora">
          <div>
            <span className="text-xs text-[#d1cdb8]/70 uppercase tracking-wider font-semibold">
              Commander:
            </span>{" "}
            <strong className="text-[#c5a059] font-bold">
              {user?.username ? user.username.toUpperCase() : "ADVENTURER"}
            </strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleCreateSession(false)}
              title={cannotCreateCombat ? "Battle limit reached — click to replace oldest or delete an existing battle" : "Start a new tactical skirmish"}
              className="px-5 py-2.5 font-bold text-xs rounded transition-all flex items-center gap-2 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] shadow-[0_0_20px_rgba(197,160,89,0.3)] cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>New Encounter</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 border-b border-[#c5a059]/20 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg font-cinzel text-xs sm:text-sm font-bold tracking-wider transition-all cursor-pointer ${
              activeTab === "active"
                ? "bg-gradient-to-r from-[#c5a059]/25 to-[#e0bc75]/25 text-[#c5a059] border border-[#c5a059]/60 shadow-[0_0_15px_rgba(197,160,89,0.2)]"
                : "text-[#d1cdb8]/60 hover:text-[#d1cdb8] hover:bg-[#181a24]/50 border border-transparent"
            }`}
          >
            <Swords className="w-4 h-4 text-[#c5a059]" />
            <span>Active Skirmishes</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-fira-sans ${
                activeTab === "active"
                  ? "bg-[#c5a059] text-[#0c0d12] font-bold"
                  : "bg-[#181a24] text-[#d1cdb8]/70"
              }`}
            >
              {activeSessions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg font-cinzel text-xs sm:text-sm font-bold tracking-wider transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-gradient-to-r from-[#c5a059]/25 to-[#e0bc75]/25 text-[#c5a059] border border-[#c5a059]/60 shadow-[0_0_15px_rgba(197,160,89,0.2)]"
                : "text-[#d1cdb8]/60 hover:text-[#d1cdb8] hover:bg-[#181a24]/50 border border-transparent"
            }`}
          >
            <History className="w-4 h-4 text-[#c5a059]" />
            <span>War Archives</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-fira-sans ${
                activeTab === "history"
                  ? "bg-[#c5a059] text-[#0c0d12] font-bold"
                  : "bg-[#181a24] text-[#d1cdb8]/70"
              }`}
            >
              {completedSessions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg font-cinzel text-xs sm:text-sm font-bold tracking-wider transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-gradient-to-r from-[#c5a059]/25 to-[#e0bc75]/25 text-[#c5a059] border border-[#c5a059]/60 shadow-[0_0_15px_rgba(197,160,89,0.2)]"
                : "text-[#d1cdb8]/60 hover:text-[#d1cdb8] hover:bg-[#181a24]/50 border border-transparent"
            }`}
          >
            <span>All Encounters</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-fira-sans ${
                activeTab === "all"
                  ? "bg-[#c5a059] text-[#0c0d12] font-bold"
                  : "bg-[#181a24] text-[#d1cdb8]/70"
              }`}
            >
              {sessions.length}
            </span>
          </button>
        </div>

        {/* ACTIVE TAB CONTENT */}
        {activeTab === "active" && (
          <div>
            {activeSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {activeSessions.map((session) => {
                  const isGauntlet = !!session.gauntlet_run;
                  const gauntletInfo = session.gauntlet_run;
                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        if (isGauntlet && gauntletInfo) {
                          router.push(`/combat/${session.id}?gauntletRunId=${gauntletInfo.id}`);
                        } else if (session.status === "preparing") {
                          router.push(`/combat/${session.id}/setup`);
                        } else {
                          router.push(`/combat/${session.id}`);
                        }
                      }}
                      className="cursor-pointer group"
                    >
                      <FantasyCard className="p-6 transition-all duration-300 group-hover:border-[#e0bc75] group-hover:shadow-[0_0_30px_rgba(197,160,89,0.3)]">
                        <div className="flex justify-between items-start mb-3 pb-3 border-b border-[#c5a059]/20">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-fira-sans text-lg font-bold text-[#c5a059]">
                                Encounter #{session.id}
                              </span>
                            </div>
                            <span className="font-lora text-xs text-[#d1cdb8]/70 capitalize">
                              {session.status === "preparing" ? "In Preparation" : "Battle Active"}
                            </span>
                            {isGauntlet && gauntletInfo && (
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  <Trophy className="w-3 h-3 text-[#c5a059]" />
                                  Gauntlet • Wave {gauntletInfo.current_wave}
                                </span>
                              </div>
                            )}
                          </div>

                          <Badge className="bg-[#a63a3a]/20 text-[#a63a3a] border-[#a63a3a] font-fira-sans text-xs">
                            Round {session.current_round}
                          </Badge>
                        </div>

                        <div className="space-y-2 font-lora text-xs text-[#d1cdb8]">
                          {isGauntlet && gauntletInfo && (
                            <div className="flex justify-between text-amber-200/90 pb-1 border-b border-[#c5a059]/10">
                              <span className="text-[#d1cdb8]/70">Trial:</span>
                              <span className="font-semibold text-amber-300">
                                {gauntletInfo.name} ({gauntletInfo.theme})
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span className="text-[#d1cdb8]/70">Combatants:</span>
                            <span className="font-fira-sans font-bold text-white">
                              {session.participants?.length || 0}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-[#d1cdb8]/70">Commenced:</span>
                            <span className="font-fira-sans text-[#d1cdb8]">
                              {session.started_at
                                ? new Date(session.started_at).toLocaleTimeString()
                                : "Preparing"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-[#c5a059]/15 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-[#c5a059] group-hover:underline flex items-center gap-1">
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>
                              {isGauntlet && gauntletInfo
                                ? `Resume Gauntlet Wave ${gauntletInfo.current_wave}`
                                : session.status === "preparing"
                                ? "Configure Encounter"
                                : "Resume Battle"}
                            </span>
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="text-[#d1cdb8]/50 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                            title="Delete Session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </FantasyCard>
                    </div>
                  );
                })}
              </div>
            ) : (
              <FantasyCard className="max-w-xl mx-auto p-8 md:p-10 text-center space-y-5">
                <div className="w-12 h-12 mx-auto rounded-full border border-[#c5a059]/50 flex items-center justify-center text-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.15)]">
                  <Swords className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-cinzel-decorative text-lg md:text-xl font-bold text-[#c5a059]">
                    No Active Skirmishes
                  </h3>
                  <p className="font-lora text-xs sm:text-sm text-[#d1cdb8]/75 mt-1 leading-relaxed">
                    You have no tactical skirmishes currently underway. Start a new encounter below or review concluded battles in your War Archives.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => handleCreateSession(false)}
                    className="px-5 py-2 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_15px_rgba(197,160,89,0.3)] inline-flex items-center gap-2 cursor-pointer font-lora"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Start New Encounter</span>
                  </button>
                  {completedSessions.length > 0 && (
                    <button
                      onClick={() => setActiveTab("history")}
                      className="px-4 py-2 bg-[#181a24] hover:bg-[#202330] text-[#c5a059] border border-[#c5a059]/40 font-bold text-xs rounded transition-all inline-flex items-center gap-2 cursor-pointer font-lora"
                    >
                      <History className="w-4 h-4" />
                      <span>View War Archives ({completedSessions.length})</span>
                    </button>
                  )}
                </div>
              </FantasyCard>
            )}
          </div>
        )}

        {/* HISTORY / PAST COMBATS TAB CONTENT */}
        {activeTab === "history" && (
          <div>
            {completedSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {completedSessions.map((session) => {
                  const isGauntlet = !!session.gauntlet_run;
                  const gauntletInfo = session.gauntlet_run;
                  return (
                    <div
                      key={session.id}
                      onClick={() => handleViewSession(session)}
                      className="cursor-pointer group"
                    >
                      <FantasyCard className="p-5 opacity-90 hover:opacity-100 transition-all duration-300 group-hover:border-[#c5a059]/60 group-hover:shadow-[0_0_25px_rgba(197,160,89,0.2)]">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-fira-sans text-base font-bold text-[#d1cdb8] group-hover:text-[#c5a059] transition-colors flex items-center gap-2">
                              <span>Encounter #{session.id}</span>
                            </h3>
                            {isGauntlet && gauntletInfo && (
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 mt-1">
                                <Trophy className="w-3 h-3 text-[#c5a059]" />
                                Gauntlet • Wave {gauntletInfo.current_wave}
                              </span>
                            )}
                          </div>
                          <Badge className="bg-[#181a21] text-[#d1cdb8]/70 border-slate-700 font-fira-sans text-[10px]">
                            Concluded
                          </Badge>
                        </div>

                        <div className="my-3 space-y-1.5 font-lora text-xs text-[#d1cdb8]/80">
                          {isGauntlet && gauntletInfo && (
                            <div className="flex justify-between text-amber-200/90 pb-1 border-b border-[#c5a059]/10">
                              <span className="text-[#d1cdb8]/60">Trial:</span>
                              <span className="font-semibold text-amber-300">
                                {gauntletInfo.name} ({gauntletInfo.theme})
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span className="text-[#d1cdb8]/60">Duration:</span>
                            <span className="font-fira-sans text-white">
                              Endured {session.current_round} round{session.current_round === 1 ? "" : "s"}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-[#d1cdb8]/60">Combatants:</span>
                            <span className="font-fira-sans text-white">
                              {session.participants?.length || 0} participants
                            </span>
                          </div>

                          {isGauntlet && gauntletInfo && (
                            <div className="flex justify-between text-amber-300">
                              <span className="text-amber-300/70">Trial Score:</span>
                              <span className="font-fira-sans font-bold">
                                {gauntletInfo.score?.toLocaleString()} pts
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] font-fira-sans">
                          <span className="text-[#d1cdb8]/60">
                            {session.ended_at
                              ? new Date(session.ended_at).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Archived"}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-[#c5a059] group-hover:underline flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              <span>Report</span>
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSession(session.id);
                              }}
                              className="text-[#d1cdb8]/40 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                              title="Delete Session"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </FantasyCard>
                    </div>
                  );
                })}
              </div>
            ) : (
              <FantasyCard className="max-w-xl mx-auto p-8 md:p-10 text-center space-y-5">
                <div className="w-12 h-12 mx-auto rounded-full border border-[#c5a059]/50 flex items-center justify-center text-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.15)]">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-cinzel-decorative text-lg md:text-xl font-bold text-[#c5a059]">
                    War Archives Empty
                  </h3>
                  <p className="font-lora text-xs sm:text-sm text-[#d1cdb8]/75 mt-1 leading-relaxed">
                    No archived battles recorded yet. Once an encounter or Gauntlet wave finishes in victory or defeat, its full turn logs, damage rolls, and combatant telemetry will be cataloged here.
                  </p>
                </div>
              </FantasyCard>
            )}
          </div>
        )}

        {/* ALL ENCOUNTERS TAB CONTENT */}
        {activeTab === "all" && (
          <div>
            {sessions.length > 0 ? (
              <div className="space-y-10">
                {activeSessions.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <h2 className="font-cinzel-decorative text-lg font-bold text-[#c5a059]">
                        Active Skirmishes ({activeSessions.length})
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                      {activeSessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => {
                            if (session.gauntlet_run) {
                              router.push(`/combat/${session.id}?gauntletRunId=${session.gauntlet_run.id}`);
                            } else if (session.status === "preparing") {
                              router.push(`/combat/${session.id}/setup`);
                            } else {
                              router.push(`/combat/${session.id}`);
                            }
                          }}
                          className="cursor-pointer group"
                        >
                          <FantasyCard className="p-6 transition-all duration-300 group-hover:border-[#e0bc75]">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-fira-sans font-bold text-[#c5a059]">
                                  Encounter #{session.id}
                                </span>
                                {session.gauntlet_run && (
                                  <div className="text-[10px] uppercase font-bold text-amber-300">
                                    Gauntlet Wave {session.gauntlet_run.current_wave}
                                  </div>
                                )}
                              </div>
                              <Badge className="bg-[#a63a3a]/20 text-[#a63a3a] border-[#a63a3a] text-xs">
                                Round {session.current_round}
                              </Badge>
                            </div>
                            <div className="mt-4 pt-3 border-t border-[#c5a059]/15 flex items-center justify-between text-xs text-[#c5a059]">
                              <span className="flex items-center gap-1 font-semibold group-hover:underline">
                                <Play className="w-3.5 h-3.5 fill-current" />
                                {session.gauntlet_run ? "Resume Wave" : "Resume Battle"}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSession(session.id);
                                }}
                                className="text-[#d1cdb8]/50 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </FantasyCard>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {completedSessions.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <History className="w-4 h-4 text-[#c5a059]" />
                      <h2 className="font-cinzel-decorative text-lg font-bold text-[#c5a059]">
                        War Archives ({completedSessions.length})
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                      {completedSessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => handleViewSession(session)}
                          className="cursor-pointer group"
                        >
                          <FantasyCard className="p-5 opacity-85 hover:opacity-100">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-fira-sans font-bold text-[#d1cdb8] group-hover:text-[#c5a059]">
                                  Encounter #{session.id}
                                </span>
                                {session.gauntlet_run && (
                                  <div className="text-[10px] uppercase font-bold text-amber-300">
                                    Gauntlet Wave {session.gauntlet_run.current_wave}
                                  </div>
                                )}
                              </div>
                              <Badge className="bg-[#181a21] text-[#d1cdb8]/70 border-slate-700 text-[10px]">
                                Concluded
                              </Badge>
                            </div>
                            <p className="font-lora text-xs text-[#d1cdb8]/70 mb-3">
                              Endured {session.current_round} round{session.current_round === 1 ? "" : "s"}
                            </p>
                            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                              <span className="text-[#c5a059] flex items-center gap-1 group-hover:underline">
                                <FileText className="w-3 h-3" /> Report
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSession(session.id);
                                }}
                                className="text-[#d1cdb8]/40 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </FantasyCard>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <FantasyCard className="max-w-xl mx-auto p-8 md:p-10 text-center space-y-6">
                <div className="w-14 h-14 mx-auto rounded-full border border-[#c5a059] flex items-center justify-center text-[#c5a059]">
                  <Swords className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="font-cinzel-decorative text-xl md:text-2xl font-bold text-[#c5a059]">
                    The Arena is Quiet
                  </h2>
                  <p className="font-lora text-sm text-[#d1cdb8]/80 mt-2">
                    No encounters found. Create your first skirmish to configure initiative and engage in tactical battle.
                  </p>
                </div>
                <button
                  onClick={() => handleCreateSession(false)}
                  className="px-6 py-2.5 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all inline-flex items-center gap-2 cursor-pointer font-lora"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Combat</span>
                </button>
              </FantasyCard>
            )}
          </div>
        )}

        {/* Battle Detail Modal */}
        <Dialog
          open={startOpen}
          onOpenChange={(open) => {
            setStartOpen(open);
            if (!open) setSelectedParticipantId(null);
          }}
        >
          <DialogContent className="bg-[#0e1017] border border-[#c5a059]/60 text-slate-100 w-[96vw] max-w-[96vw] sm:max-w-none md:max-w-5xl lg:max-w-6xl xl:max-w-7xl h-[90vh] max-h-[940px] flex flex-col p-0 overflow-hidden shadow-[0_0_80px_rgba(197,160,89,0.15)]">
            {/* Golden Header */}
            <div className="shrink-0 px-6 py-5 border-b border-[#c5a059]/30 bg-[radial-gradient(ellipse_at_top,#1a1d29_0%,#0e1017_100%)]">
              <DialogTitle className="font-cinzel-decorative text-xl sm:text-2xl font-bold text-[#c5a059] tracking-wide drop-shadow-[0_1px_6px_rgba(197,160,89,0.4)]">
                Encounter #{selectedSession?.id} — After-Action Report
              </DialogTitle>
              <DialogDescription className="font-lora text-[#d1cdb8]/70 text-xs sm:text-sm mt-1">
                Concluded on{" "}
                {selectedSession?.ended_at
                  ? new Date(selectedSession.ended_at).toLocaleString()
                  : "N/A"}{" "}
                • {selectedSession?.current_round} Round{selectedSession?.current_round === 1 ? "" : "s"} Completed
              </DialogDescription>

              {/* Participant Filter Chips */}
              {!detailLoading && selectedSession?.participants && selectedSession.participants.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-widest text-[#c5a059]/60 font-semibold mb-2 font-lora">
                    Filter by Combatant
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {/* "All" chip */}
                    <button
                      type="button"
                      onClick={() => setSelectedParticipantId(null)}
                      className={`px-3 py-1 rounded text-xs font-medium font-lora transition-all border ${
                        selectedParticipantId === null
                          ? "bg-[#c5a059] text-[#0c0d12] border-[#c5a059] shadow-[0_0_10px_rgba(197,160,89,0.4)]"
                          : "bg-[#181a21] text-[#d1cdb8]/70 border-[#c5a059]/30 hover:border-[#c5a059]/60 hover:text-[#c5a059]"
                      }`}
                    >
                      All Actions
                    </button>
                    {/* Per-participant chips */}
                    {selectedSession.participants.map((p) => {
                      const isHero = p.participant_type === "character";
                      const isSelected = selectedParticipantId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedParticipantId(isSelected ? null : p.id)}
                          className={`px-3 py-1 rounded text-xs font-medium font-lora transition-all border flex items-center gap-1.5 ${
                            isSelected
                              ? isHero
                                ? "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/60 shadow-[0_0_8px_rgba(34,197,94,0.2)]"
                                : "bg-[#a63a3a]/20 text-[#e57373] border-[#a63a3a]/60 shadow-[0_0_8px_rgba(166,58,58,0.2)]"
                              : "bg-[#181a21] text-[#d1cdb8]/70 border-[#c5a059]/25 hover:border-[#c5a059]/50 hover:text-[#d1cdb8]"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isHero ? "bg-[#22c55e]" : "bg-[#e57373]"}`} />
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Log Body */}
            <div className="flex-1 overflow-hidden min-h-0">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="w-9 h-9 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
                  <p className="font-lora text-sm text-[#d1cdb8]/70 italic">
                    Deciphering battle logs...
                  </p>
                </div>
              ) : selectedSession ? (
                <CombatLog
                  actions={selectedSession.actions || []}
                  selectedParticipant={
                    selectedSession.participants?.find(
                      (p) => p.id === selectedParticipantId
                    ) || null
                  }
                  onClearFilter={() => setSelectedParticipantId(null)}
                />
              ) : null}
            </div>
          </DialogContent>
        </Dialog>

        {/* Battle Limit Confirmation Modal */}
        <Dialog open={limitModalOpen} onOpenChange={setLimitModalOpen}>
          <DialogContent className="max-w-md bg-[#10121a] border border-[#c5a059]/40 text-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.8)] p-6">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-3 text-amber-400">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <DialogTitle className="font-cinzel-decorative text-xl text-[#c5a059]">
                  {limitModalInfo.title || "Battle Limit Reached"}
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
                onClick={() => setLimitModalOpen(false)}
                className="w-full sm:w-auto bg-[#181a24] border-[#c5a059]/40 text-[#d1cdb8] hover:bg-[#202330] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleCreateSession(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-[#c5a059] to-[#d6b16a] text-[#0c0d12] hover:brightness-110 font-bold shadow-[0_0_15px_rgba(197,160,89,0.3)]"
              >
                Delete Oldest & Start
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
