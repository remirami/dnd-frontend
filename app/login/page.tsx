"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { authApi } from "@/lib/api/auth";
import FantasyCard from "@/components/ui/FantasyCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, User, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const resetSuccess = searchParams.get("reset");

  const { login } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authApi.login(username, password);
      const { access } = response.data;
      const user = response.data.user || { id: 0, username, email: "" };

      // Store access token in memory / client state. Refresh token is held safely in HttpOnly cookie.
      login(access, user);
      router.push("/characters");
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError("Too many login attempts. Please wait 60 seconds before trying again.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Invalid credentials. Please verify your username and password."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link
          href="/"
          className="font-cinzel-decorative text-2xl md:text-3xl font-bold tracking-widest text-[#c5a059] hover:text-[#e0bc75] transition-colors drop-shadow-[0_2px_10px_rgba(197,160,89,0.3)] inline-block"
        >
          5E PORTAL
        </Link>
      </div>

      <FantasyCard className="p-8 font-lora shadow-2xl">
        {/* Header & Filigree */}
        <div className="text-center mb-6">
          <h1 className="font-cinzel-decorative text-2xl font-bold tracking-wider text-[#c5a059]">
            SIGN IN
          </h1>
          <p className="text-xs text-[#d1cdb8]/80 mt-1">
            Enter the realm to manage your heroes and campaign
          </p>

          <div className="flex items-center justify-center gap-2 mt-3 opacity-70">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c5a059]" />
            <span className="text-[9px] text-[#c5a059]">✦</span>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c5a059]" />
          </div>
        </div>

        {/* Notifications */}
        {registered && (
          <div className="mb-4 p-3 text-xs flex items-center gap-2 text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Account forged! You may now sign in with your credentials.</span>
          </div>
        )}

        {resetSuccess && (
          <div className="mb-4 p-3 text-xs flex items-center gap-2 text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Your password has been successfully restored. Sign in below.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 text-xs flex items-center gap-2 text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded animate-shake">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="login-username"
              className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider"
            >
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                id="login-username"
                type="text"
                placeholder="LordNeverember"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="pl-9 bg-[#0c0d12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-[#c5a059] focus:ring-[#c5a059]/20 h-10 text-xs transition-colors font-lora"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="login-password"
                className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider"
              >
                Password
              </Label>
              <Link
                href="/forgot-password"
                id="link-forgot-password"
                className="text-xs text-[#c5a059]/90 hover:text-[#c5a059] hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9 pr-10 bg-[#0c0d12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-[#c5a059] focus:ring-[#c5a059]/20 h-10 text-xs transition-colors font-lora"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="login-submit"
            disabled={loading}
            className="w-full mt-2 h-10 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_20px_rgba(197,160,89,0.3)] cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              "Authenticating..."
            ) : (
              <>
                <span>Enter the Realm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-[#d1cdb8]/70 pt-2">
            New adventurer?{" "}
            <Link
              href="/register"
              id="link-register"
              className="text-[#c5a059] hover:text-[#e0bc75] font-semibold hover:underline"
            >
              Forge an Account
            </Link>
          </p>
        </form>
      </FantasyCard>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0c0d12] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#c5a059]/5 rounded-full blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="font-lora text-sm text-[#d1cdb8]/80 italic">
            Preparing the tavern...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
