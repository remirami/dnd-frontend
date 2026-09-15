"use client";

import { useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Mail, CheckCircle2, ShieldAlert, ArrowLeft, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md border-amber-500/20 bg-slate-900/85 backdrop-blur-xl shadow-[0_0_60px_-15px_rgba(245,158,11,0.2)] text-slate-100 rounded-2xl overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

        <CardHeader className="space-y-2 text-center pt-8 pb-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <KeyRound className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-b from-amber-100 to-amber-300/80 bg-clip-text text-transparent">
            Recover Your Account
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            Dispatch a secure restoration scroll to your email address
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-8">
          {submitted ? (
            <div className="space-y-5 text-center">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-sm space-y-2">
                <div className="flex justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="font-semibold text-emerald-200">Restoration Scroll Sent!</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  If an account exists for <span className="text-amber-300 font-mono">{email}</span>, a secure password reset link valid for 15 minutes has been dispatched.
                </p>
                <p className="text-[11px] text-slate-400 italic pt-1">
                  (In local development, inspect your backend terminal output for the direct link)
                </p>
              </div>

              <Link href="/login" className="block w-full">
                <Button
                  id="forgot-return-login"
                  className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold border border-slate-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Return to Tavern
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs flex items-center gap-2 text-rose-300 bg-rose-950/50 border border-rose-500/30 rounded-lg">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                    className="pl-9 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20 h-10 transition-colors"
                  />
                </div>
              </div>

              <Button
                type="submit"
                id="forgot-submit"
                disabled={loading}
                className="w-full mt-2 h-11 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold shadow-md shadow-amber-600/25 transition-all duration-200"
              >
                {loading ? "Dispatching..." : (
                  <span className="flex items-center justify-center gap-2">
                    Send Reset Link <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <p className="text-center text-xs text-slate-400 pt-2">
                Remember your password?{" "}
                <Link href="/login" id="link-forgot-back-login" className="text-amber-400 hover:text-amber-300 font-semibold hover:underline">
                  Back to Login
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
