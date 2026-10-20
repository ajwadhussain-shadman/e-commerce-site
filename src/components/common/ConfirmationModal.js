"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, AlertCircle, ShieldAlert, ShieldCheck, Loader2, X } from "lucide-react";

/**
 * Reusable ConfirmationModal component matching Importora's orange, black, and white design.
 * Accessible dialog with focus trap, Esc-to-close, loading state, error display, and variant styles.
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  details = null,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default", // 'default' | 'danger' | 'warning' | 'role'
  confirmDisabled = false,
  isLoading = false,
}) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const dialogRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Reset state during render when modal opens (official React pattern)
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setErrorMessage("");
      setInternalLoading(false);
    }
  }

  const processing = isLoading || internalLoading;

  // Handle side-effects (body scroll and focus) when open
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;

      // Disable background scrolling
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Focus the cancel button after opening (safer for destructive actions)
      const timer = setTimeout(() => {
        if (cancelBtnRef.current) {
          cancelBtnRef.current.focus();
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
        if (previousActiveElement.current && typeof previousActiveElement.current.focus === "function") {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen]);

  // Trap focus and handle Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (!processing) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      if (e.key === "Tab") {
        if (!dialogRef.current) return;
        const focusableElements = dialogRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, processing, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async (e) => {
    e?.preventDefault();
    if (processing || confirmDisabled) return;

    setErrorMessage("");
    setInternalLoading(true);
    try {
      if (onConfirm) {
        await onConfirm();
      }
      onClose();
    } catch (err) {
      setErrorMessage(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setInternalLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !processing) {
      onClose();
    }
  };

  // Determine icon & button styling based on variant
  let iconComponent = null;
  let confirmBtnClass = "bg-stone-900 text-white hover:bg-stone-800 focus:ring-stone-500";

  if (variant === "danger") {
    iconComponent = (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
        <AlertTriangle className="h-5 w-5" />
      </div>
    );
    confirmBtnClass = "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-400 shadow-sm shadow-rose-600/30";
  } else if (variant === "role") {
    iconComponent = (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
        <ShieldCheck className="h-5 w-5" />
      </div>
    );
    confirmBtnClass = "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-400 shadow-sm shadow-orange-600/30";
  } else if (variant === "warning") {
    iconComponent = (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
        <AlertCircle className="h-5 w-5" />
      </div>
    );
    confirmBtnClass = "bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-400 shadow-sm shadow-amber-600/30";
  } else {
    iconComponent = (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
        <AlertCircle className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      aria-hidden={!isOpen}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-description"
        className="relative w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900 sm:p-7 animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          aria-label="Close dialog"
          className="absolute right-5 top-5 rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-40 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          {iconComponent}

          <div className="flex-1 min-w-0 pr-6">
            <h2
              id="confirmation-dialog-title"
              className="text-lg font-serif font-bold text-stone-950 dark:text-stone-100 leading-snug"
            >
              {title}
            </h2>

            <div
              id="confirmation-dialog-description"
              className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed"
            >
              {message}
            </div>
          </div>
        </div>

        {/* Optional details slot (e.g. user info, affected items, warnings) */}
        {details && <div className="mt-4">{details}</div>}

        {/* Error message if action failed */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-2xl bg-rose-50 p-3.5 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold block">Operation failed:</span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={processing}
            className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing || confirmDisabled}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 disabled:opacity-50 transition-all ${confirmBtnClass}`}
          >
            {processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
