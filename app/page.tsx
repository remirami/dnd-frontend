"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useRouter } from "next/navigation";
import { CURRENT_VERSION } from "@/lib/data/changelog";

export default function Home() {
  const { user, isAuthenticated, logout, fetchCurrentUser } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering auth-dependent content after mount
  useEffect(() => {
    setMounted(true);
    if (isAuthenticated && !user) {
      fetchCurrentUser();
    }
  }, [isAuthenticated, user, fetchCurrentUser]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              5e Campaign Manager
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Character creation, tactical combat, and encounter management built on official 5e SRD rules.
            </p>
          </div>

          {/* Auth Status - only show after mount to prevent hydration mismatch */}
          {mounted && isAuthenticated && user && (
            <div className="text-green-400 text-lg">
              ✓ Logged in as <span className="font-semibold">{user.username}</span>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <a
              href="/characters"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/30"
            >
              <span>⚔️ Characters</span>
            </a>
            <a
              href="/combat"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/30"
            >
              <span>🎲 Combat Simulator</span>
            </a>
            <a
              href="/changelog"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg shadow-purple-900/30"
            >
              <span>📜 Updates</span>
              <span className="text-xs bg-purple-900/80 px-2 py-0.5 rounded-full border border-purple-400/40 text-purple-200">
                {CURRENT_VERSION}
              </span>
            </a>
            {/* Only render auth button after mount */}
            {mounted ? (
              isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Logout
                </button>
              ) : (
                <a
                  href="/login"
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Login
                </a>
              )
            ) : (
              // Placeholder during SSR to prevent layout shift
              <div className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold opacity-50">
                Loading...
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 max-w-5xl mx-auto">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 text-left">
              <h3 className="text-xl font-bold text-white mb-2">⚔️ Character Builder</h3>
              <p className="text-slate-400 text-sm">
                Create 5e characters with 12 classes, races, and randomized level 1 rolls.
              </p>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 text-left">
              <h3 className="text-xl font-bold text-white mb-2">🎲 Combat Simulation</h3>
              <p className="text-slate-400 text-sm">
                Track initiative, HP, and actions in real-time with participant filtering.
              </p>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 text-left">
              <h3 className="text-xl font-bold text-white mb-2">🏆 Gauntlet Mode</h3>
              <p className="text-slate-400 text-sm">
                Face sequential encounters with automated enemies and monster AI.
              </p>
            </div>

            <a
              href="/changelog"
              className="bg-gradient-to-br from-purple-950/60 to-slate-800 p-6 rounded-lg border border-purple-600/40 text-left hover:border-purple-500 transition-all group block cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                  📜 Changelog
                </h3>
                <span className="text-xs bg-purple-900/90 text-purple-300 border border-purple-600 px-2 py-0.5 rounded-full">
                  {CURRENT_VERSION}
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                Explore release history, combat mechanics fixes, and rule updates.
              </p>
            </a>
          </div>

          <div className="mt-12 text-slate-500 text-sm">
            <p>Full-stack 5e application</p>
            <p>Next.js 14 • TypeScript • Django REST API</p>
          </div>
        </div>
      </div>
    </div>
  );
}
