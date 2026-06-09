import React, { useState } from "react";
import { Layers, ArrowLeft, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { ActiveScreen } from "../types";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

interface AuthPageProps {
  onNavigate: (screen: ActiveScreen) => void;
  onAuthed: () => void;
}

export default function AuthPage({ onNavigate, onAuthed }: AuthPageProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shared fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  // Sign-up only
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        await login(identifier.trim(), password);
      } else {
        await register({
          email: identifier.trim(),
          password,
          name: name.trim(),
          businessName: businessName.trim() || undefined,
          phone: phone.trim() || undefined,
        });
      }
      onAuthed();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const field =
    "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition placeholder:text-slate-600";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-6 font-sans selection:bg-indigo-500/30">
      <button
        onClick={() => onNavigate("landing")}
        className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="font-display font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-amber-100">
            SmartPay
          </span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h1 className="text-xl font-display font-semibold text-white text-center">
            {mode === "signin" ? "Sign in to your console" : "Create your merchant account"}
          </h1>
          <p className="text-xs text-slate-400 text-center mt-1.5">
            {mode === "signin"
              ? "Use your email or phone and password."
              : "Set up a SmartPay merchant account in seconds."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
            {mode === "signup" && (
              <input className={field} required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <input
              className={field}
              required
              type="text"
              placeholder={mode === "signin" ? "Email or phone" : "Email address"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            {mode === "signup" && (
              <>
                <input className={field} placeholder="Phone number (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <input className={field} placeholder="Business name (optional)" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </>
            )}
            <input
              className={field}
              required
              type="password"
              placeholder={mode === "signin" ? "Password" : "Password (min 8 characters)"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/40 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>{mode === "signin" ? "Sign in" : "Create account"}</span>
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            {mode === "signin" ? (
              <>
                New to SmartPay?{" "}
                <button onClick={() => { setMode("signup"); setError(null); }} className="text-indigo-400 font-semibold hover:underline cursor-pointer">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => { setMode("signin"); setError(null); }} className="text-indigo-400 font-semibold hover:underline cursor-pointer">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Secured by SmartPay · 256-bit encryption</span>
        </div>
      </div>
    </div>
  );
}
