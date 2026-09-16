"use client";

import { useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import FantasyCard from "@/components/ui/FantasyCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle2, ShieldAlert, ArrowLeft, ArrowRight } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authApi.requestPasswordReset(email);
      setSubmitted(true);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError("Too many reset attempts. Please wait a minute before trying again.");
      } else {
        // Fallback gracefully
        setSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0d12] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#c5a059]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link
            href="/"
            className="font-cinzel-decorative text-2xl md:text-3xl font-bold tracking-widest text-[#c5a059] hover:text-[#e0bc75] transition-colors drop-shadow-[0_2px_10px_rgba(197,160,89,0.3)] inline-block"
          >
            5E DASHBOARD
          </Link>
        </div>

        <FantasyCard className="p-8 font-lora shadow-2xl">
          {/* Header & Filigree */}
          <div className="text-center mb-6">
            <h1 className="font-cinzel-decorative text-2xl font-bold tracking-wider text-[#c5a059]">
              RECOVER ACCOUNT
            </h1>
            <p className="text-xs text-[#d1cdb8]/80 mt-1">
              Dispatch a secure restoration scroll to your email address
            </p>

            <div className="flex items-center justify-center gap-2 mt-3 opacity-70">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c5a059]" />
              <span className="text-[9px] text-[#c5a059]">✦</span>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c5a059]" />
            </div>
          </div>

          {submitted ? (
            <div className="space-y-5 text-center">
              <div className="p-4 rounded bg-[#0c0d12] border border-emerald-500/40 text-emerald-300 text-xs space-y-2 font-lora">
                <div className="flex justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="font-semibold text-emerald-200 text-sm">Restoration Scroll Dispatched!</p>
                <p className="text-xs text-[#d1cdb8]/90 leading-relaxed">
                  If an account exists for <span className="text-[#c5a059] font-mono">{email}</span>, a secure password reset link valid for 15 minutes has been dispatched.
                </p>
                <p className="text-[11px] text-[#d1cdb8]/60 italic pt-1">
                  (In local development, inspect your backend terminal output for the direct link)
                </p>
              </div>

              <Link href="/login" className="block w-full">
                <button
                  id="forgot-return-login"
                  className="w-full h-10 bg-transparent border border-[#c5a059]/60 hover:bg-[#c5a059]/10 text-[#c5a059] font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs flex items-center gap-2 text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded animate-shake">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label
                  htmlFor="forgot-email"
                  className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider"
                >
                  Registered Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="adventurer@realm.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 bg-[#0c0d12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-[#c5a059] focus:ring-[#c5a059]/20 h-10 text-xs transition-colors font-lora"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="forgot-submit"
                disabled={loading}
                className="w-full mt-2 h-10 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_20px_rgba(197,160,89,0.3)] cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  "Dispatching..."
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[#d1cdb8]/70 pt-2">
                Remember your password?{" "}
                <Link
                  href="/login"
                  id="link-forgot-back-login"
                  className="text-[#c5a059] hover:text-[#e0bc75] font-semibold hover:underline"
                >
                  Back to Sign In
                </Link>
              </p>
            </form>
          )}
        </FantasyCard>
      </div>
    </div>
  );
}
