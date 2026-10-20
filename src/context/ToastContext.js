"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, Info, Loader2, X } from "lucide-react";

const ToastContext = createContext(null);

// Global dispatcher refs to enable standalone `toast.*` method calls
let globalAddToast = null;
let globalRemoveToast = null;

export const toast = {
  success: (msg, opts) => (globalAddToast ? globalAddToast(msg, "success", opts) : null),
  error: (msg, opts) => (globalAddToast ? globalAddToast(msg, "error", opts) : null),
  loading: (msg, opts) => (globalAddToast ? globalAddToast(msg, "loading", opts) : null),
  info: (msg, opts) => (globalAddToast ? globalAddToast(msg, "info", opts) : null),
  dismiss: (id) => (globalRemoveToast ? globalRemoveToast(id) : null),
  promise: async (
    promise,
    { loading = "Processing...", success = "Completed successfully", error = "Operation failed" } = {}
  ) => {
    const id = toast.loading(loading);
    try {
      const result = await promise;
      const successMsg = typeof success === "function" ? success(result) : success;
      toast.success(successMsg, { id });
      return result;
    } catch (err) {
      const errorMsg = typeof error === "function" ? error(err) : (err?.message || error);
      toast.error(errorMsg, { id });
      throw err;
    }
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const recentToasts = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = "success", options = {}) => {
    if (!message) return null;
    const msgStr = typeof message === "string" ? message : String(message);

    // Prevent duplicate toasts within 1500ms unless an explicit ID is provided for updating
    const now = Date.now();
    const dedupKey = `${type}:${msgStr}`;
    if (!options.id && recentToasts.current.has(dedupKey)) {
      const lastTime = recentToasts.current.get(dedupKey);
      if (now - lastTime < 1500) {
        return null;
      }
    }
    recentToasts.current.set(dedupKey, now);

    const id = options.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    // Loading toasts persist until dismissed or updated with an explicit duration
    const duration =
      options.duration !== undefined
        ? options.duration
        : type === "loading"
        ? 0
        : type === "error"
        ? 5500
        : 3800;

    setToasts((prev) => {
      const existingIndex = prev.findIndex((t) => t.id === id);
      const newToast = { id, message: msgStr, type, duration };
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = newToast;
        return next;
      }
      return [...prev, newToast];
    });

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    globalRemoveToast = removeToast;
    return () => {
      globalAddToast = null;
      globalRemoveToast = null;
    };
  }, [addToast, removeToast]);

  const contextValue = {
    addToast,
    removeToast,
    toast: {
      success: (msg, opts) => addToast(msg, "success", opts),
      error: (msg, opts) => addToast(msg, "error", opts),
      loading: (msg, opts) => addToast(msg, "loading", opts),
      info: (msg, opts) => addToast(msg, "info", opts),
      dismiss: removeToast,
      promise: toast.promise,
    },
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast container with live region for accessibility */}
      <div
        role="region"
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role={item.type === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
              item.type === "success"
                ? "bg-stone-900/95 dark:bg-stone-900/95 text-stone-100 border-emerald-500/40 border-l-4 border-l-emerald-500 shadow-emerald-950/20"
                : item.type === "error"
                ? "bg-stone-900/95 dark:bg-stone-900/95 text-stone-100 border-rose-500/40 border-l-4 border-l-rose-500 shadow-rose-950/20"
                : item.type === "loading"
                ? "bg-stone-900/95 dark:bg-stone-900/95 text-stone-100 border-orange-500/50 border-l-4 border-l-orange-500 shadow-orange-950/20"
                : "bg-stone-900/95 dark:bg-stone-900/95 text-stone-100 border-amber-500/40 border-l-4 border-l-amber-500 shadow-amber-950/20"
            }`}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="shrink-0 mt-0.5">
                {item.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {item.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {item.type === "loading" && <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />}
                {item.type === "info" && <Info className="w-5 h-5 text-amber-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                  {item.type === "success"
                    ? "Success"
                    : item.type === "error"
                    ? "Error"
                    : item.type === "loading"
                    ? "Processing"
                    : "Notice"}
                </p>
                <p className="text-xs sm:text-sm font-medium leading-snug break-words text-stone-100">
                  {item.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
