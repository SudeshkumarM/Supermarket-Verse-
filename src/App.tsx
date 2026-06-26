import React, { useState, useEffect } from "react";
import PublicWebsite from "./components/PublicWebsite";
import LoginPortal from "./components/LoginPortal";
import AdminPortal from "./components/AdminPortal";
import { User, DBState, Settings } from "./types";
import { RefreshCw } from "lucide-react";
import { apiFetch } from "./clientDb";

type ViewMode = "PUBLIC" | "LOGIN" | "ADMIN_PORTAL";

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("PUBLIC");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dbState, setDbState] = useState<DBState | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const loadDBState = async () => {
    try {
      const res = await apiFetch("/api/db");
      if (res.ok) {
        const data = await res.json();
        setDbState(data);
      } else {
        setErrorMsg("Failed to synchronize with server database.");
      }
    } catch (e) {
      setErrorMsg("Unable to establish a connection with the server.");
    }
  };

  useEffect(() => {
    loadDBState();
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setViewMode("ADMIN_PORTAL");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setViewMode("PUBLIC");
    loadDBState(); // Refresh database state to capture any updates
  };

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center space-y-4">
        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl max-w-sm space-y-3">
          <p className="text-sm font-bold text-rose-400">Database Connection Error</p>
          <p className="text-xs text-slate-400 leading-relaxed">{errorMsg}</p>
          <p className="text-xs text-slate-500 font-mono">Ensure Node Express server is initialized and bound to port 3000.</p>
        </div>
        <button
          onClick={() => {
            setErrorMsg("");
            loadDBState();
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-emerald-500/15 cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!dbState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <RefreshCw className="w-10 h-10 animate-spin text-emerald-500" />
        <div className="text-center">
          <h3 className="font-display font-extrabold text-lg">SK SuperMarket Verse</h3>
          <p className="text-xs text-slate-500 mt-1 font-mono">Establishing server database synchronization...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {viewMode === "PUBLIC" && (
        <PublicWebsite
          products={dbState.products}
          categories={dbState.categories}
          settings={dbState.settings}
          onEnterPortal={() => setViewMode("LOGIN")}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {viewMode === "LOGIN" && (
        <LoginPortal
          onLoginSuccess={handleLoginSuccess}
          onBackToPublic={() => setViewMode("PUBLIC")}
          storeName={dbState.settings.storeName}
        />
      )}

      {viewMode === "ADMIN_PORTAL" && currentUser && (
        <AdminPortal
          currentUser={currentUser}
          onLogout={handleLogout}
          appSettings={dbState.settings}
        />
      )}
    </>
  );
}
