import React, { useState } from "react";
import { motion } from "motion/react";
import { Store, ShieldCheck, Mail, Lock, ArrowLeft, Info, HelpCircle } from "lucide-react";
import { User } from "../types";
import { apiFetch } from "../clientDb";

interface LoginPortalProps {
  onLoginSuccess: (user: User) => void;
  onBackToPublic: () => void;
  storeName: string;
}

export default function LoginPortal({ onLoginSuccess, onBackToPublic, storeName }: LoginPortalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await apiFetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const result = await res.json();
      
      if (res.ok && result.success) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.message || "Invalid email or password.");
      }
    } catch (err) {
      setErrorMsg("Unable to connect to the login service.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper shortcut pre-filler for live testing roles
  const handleQuickPrefill = (emailVal: string, passVal: string) => {
    setEmail(emailVal);
    setPassword(passVal);
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden bg-cover bg-center bg-no-repeat" 
      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=1920&auto=format&fit=crop')` }}
      id="login_portal_root"
    >
      {/* Dark overlay for ambient background to keep text highly legible (high contrast) */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs pointer-events-none z-0"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Navigation Return Link */}
        <button
          onClick={onBackToPublic}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 px-4 py-2 rounded-xl self-start cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Storefront</span>
        </button>

        {/* Brand Card Logo */}
        <div className="text-center space-y-2">
          <div className="bg-emerald-600 inline-flex p-3 rounded-2xl shadow-xl shadow-emerald-500/10 text-white justify-center items-center">
            <Store className="w-7 h-7" />
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
            {storeName} Portal
          </h2>
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">
            Internal Staff Register Terminal
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800/60">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-bold text-slate-300">Role-Based Access Verification</span>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Work Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@supermarket.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Session Key / Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs tracking-wider transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/10 uppercase"
            >
              {isSubmitting ? "Authenticating Clearance..." : "Open Lane Session"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
