"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "akpsi.pwa.install-dismissed";

/**
 * Dismissible "install the app" card for the portal. On Android/Chrome it wires
 * the native install prompt; on iOS Safari (which has no prompt API) it shows
 * the Share -> Add to Home Screen instructions. Hidden once installed/dismissed.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari exposes navigator.standalone
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;

    const ios = /ipad|iphone|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(ios);
    setVisible(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }

  if (!visible) return null;

  return (
    <div className="relative mb-6 rounded-2xl border border-gold/30 bg-gradient-to-br from-navy to-[#131d33] p-5 text-white">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-white/50 hover:text-white"
      >
        <X size={16} />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
          <Download size={18} />
        </span>
        <div>
          <p className="font-semibold">Install the AKΨ app</p>
          {isIOS ? (
            <p className="mt-1 text-sm text-white/70">
              Tap the Share icon{" "}
              <Share size={13} className="inline align-text-bottom" /> in Safari, then{" "}
              <span className="font-medium text-white">Add to Home Screen</span> for a full-screen,
              app-like experience.
            </p>
          ) : (
            <p className="mt-1 text-sm text-white/70">
              Add it to your home screen for a full-screen, app-like experience and quick access.
            </p>
          )}
          {!isIOS && deferred && (
            <button
              onClick={install}
              className="mt-3 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy transition-opacity hover:opacity-90"
            >
              Add to Home Screen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
