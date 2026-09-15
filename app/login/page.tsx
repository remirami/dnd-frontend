"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Sparkles, User, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";

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
        setError(err.response?.data?.detail || "Invalid credentials. Please verify your username and password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-amber-500/20 bg-slate-900/85 backdrop-blur-xl shadow-[0_0_60px_-15px_rgba(245,158,11,0.2)] text-slate-100 rounded-2xl overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
      
      <CardHeader className="space-y-2 text-center pt-8 pb-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
          <Sparkles className="w-6 h-6" />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-b from-amber-100 to-amber-300/80 bg-clip-text text-transparent">
          Welcome Adventurer
        </CardTitle>
        <CardDescription className="text-slate-400 text-sm">
          Enter the realm to manage your heroes and campaign
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 px-6 pb-8">
        {registered && (
          <div className="p-3 text-xs flex items-center gap-2 text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Account forged! You may now sign in with your credentials.</span>
          </div>
        )}

        {resetSuccess && (
          <div className="p-3 text-xs flex items-center gap-2 text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Your password has been successfully restored. Sign in below.</span>
          </div>
        )}

        {error && (
          <div className="p-3 text-xs flex items-center gap-2 text-rose-300 bg-rose-950/50 border border-rose-500/30 rounded-lg animate-shake">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-username" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                className="pl-9 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20 h-10 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </Label>
              <Link
                href="/forgot-password"
                id="link-forgot-password"
                className="text-xs text-amber-400/90 hover:text-amber-300 hover:underline transition-colors"
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
                className="pl-9 pr-10 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20 h-10 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            id="login-submit"
            disabled={loading}
            className="w-full mt-2 h-11 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold shadow-md shadow-amber-600/25 transition-all duration-200"
          >
            {loading ? "Authenticating..." : (
              <span className="flex items-center justify-center gap-2">
                Enter the Realm <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>

          <p className="text-center text-xs text-slate-400 pt-2">
            New adventurer?{" "}
            <Link href="/register" id="link-register" className="text-amber-400 hover:text-amber-300 font-semibold hover:underline">
              Forge an Account
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      <Suspense fallback={<div className="text-slate-400">Loading tavern...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
