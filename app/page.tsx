"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useRouter } from "next/navigation";

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
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold text-white mb-4">
            5e Campaign Manager
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Create characters, track combat, and run epic gauntlet campaigns
          </p>

          {/* Auth Status - only show after mount to prevent hydration mismatch */}
          {mounted && isAuthenticated && user && (
            <div className="text-green-400 text-lg">
              ✓ Logged in as <span className="font-semibold">{user.username}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <a
              href="/characters"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              My Characters
            </a>
            <a
              href="/combat"
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors"
            >
              Combat Simulation
            </a>
            <a
              href="/changelog"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg shadow-purple-900/30"
            >
              <span>📜 Updates</span>
              <span className="text-xs bg-purple-900/80 px-2 py-0.5 rounded-full border border-purple-400/40 text-purple-200">
                v1.6.0
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
                  v1.6.0
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
    </main>
  );
}
