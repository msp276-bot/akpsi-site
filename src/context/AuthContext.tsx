"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { lookupMember, type MemberRole } from "@/lib/roles";

export interface ChapterUser {
  name: string;
  email: string;
  role: MemberRole;
}

export type AuthMode = "mock" | "supabase";

interface AuthState {
  user: ChapterUser | null;
  loading: boolean;
  /** "supabase" once NEXT_PUBLIC_SUPABASE_* are set; "mock" otherwise. */
  mode: AuthMode;
  /**
   * Real mode: kicks off the Google OAuth redirect (resolves as the browser
   * navigates away). Mock mode: signs in immediately as the given demo email.
   */
  signInWithGoogle: (
    email?: string,
    membership?: "active" | "pledge"
  ) => Promise<ChapterUser | void>;
  /**
   * Real mode: emails a one-time magic link and resolves { sent: true }.
   * Mock mode: signs in immediately and resolves { sent: false }.
   */
  requestMagicLink: (
    email: string,
    membership?: "active" | "pledge"
  ) => Promise<{ sent: boolean }>;
  signOut: () => void;
}

const STORAGE_KEY = "akpsi.ot.user";
const AuthContext = createContext<AuthState | null>(null);

const RUTGERS_DOMAIN = "@rutgers.edu";

function deriveName(email: string): string {
  const local = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return (
    local
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ") || "Chapter Member"
  );
}

function redirectTarget(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/portal/`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ChapterUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mode: AuthMode = isSupabaseConfigured ? "supabase" : "mock";
  const supabaseRef = useRef(getSupabase());

  // -------------------------------------------------------- SUPABASE MODE
  useEffect(() => {
    if (mode !== "supabase") return;
    const supabase = supabaseRef.current;
    if (!supabase) return;
    let cancelled = false;

    async function resolveSession(email?: string | null) {
      if (!email) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        const member = await lookupMember(email);
        if (cancelled) return;
        if (!member) {
          // Authenticated but not on the roster → revoke the session. The
          // signup trigger should prevent this, but we fail closed anyway.
          await supabaseRef.current?.auth.signOut();
          setUser(null);
        } else {
          setUser({ email: member.email, name: member.fullName || deriveName(member.email), role: member.role });
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      resolveSession(data.session?.user?.email);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveSession(session?.user?.email);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [mode]);

  // ------------------------------------------------------------ MOCK MODE
  useEffect(() => {
    if (mode !== "mock") return;
    let cancelled = false;
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          setUser(JSON.parse(raw) as ChapterUser);
        }
      } catch {
        /* ignore malformed storage */
      }
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const mockSignIn = useCallback(
    async (email?: string, _membership: "active" | "pledge" = "active") => {
      await new Promise((r) => setTimeout(r, 700));
      const address = (email ?? "member@rutgers.edu").trim().toLowerCase();
      if (!address.endsWith(RUTGERS_DOMAIN)) {
        throw new Error(
          "That account isn't a @rutgers.edu address. The member portal is limited to Rutgers accounts."
        );
      }
      // Allowlist: only emails on the roster (added by a president / tech /
      // admin) may sign in - this mirrors the server-side Supabase enforcement
      // so the preview behaves like production. Role also comes from the roster.
      const member = await lookupMember(address);
      if (!member) {
        throw new Error(
          "This email isn't on the chapter roster yet. A president, tech chair, or admin needs to add you before you can sign in."
        );
      }
      const nextUser: ChapterUser = {
        email: member.email,
        name: member.fullName || deriveName(member.email),
        role: member.role,
      };
      setUser(nextUser);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      } catch {
        /* storage may be unavailable */
      }
      return nextUser;
    },
    []
  );

  const signInWithGoogle = useCallback(
    async (email?: string, membership: "active" | "pledge" = "active") => {
      if (mode === "mock") return mockSignIn(email, membership);
      const supabase = supabaseRef.current;
      if (!supabase) throw new Error("Sign-in is unavailable right now.");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTarget(),
          // Restrict the Google account chooser to the Rutgers workspace.
          queryParams: { hd: "rutgers.edu", prompt: "select_account" },
        },
      });
      if (error) throw new Error(error.message);
      // Browser redirects to Google; nothing else resolves here.
    },
    [mode, mockSignIn]
  );

  const requestMagicLink = useCallback(
    async (email: string, membership: "active" | "pledge" = "active") => {
      const address = email.trim().toLowerCase();
      if (!address.endsWith(RUTGERS_DOMAIN)) {
        throw new Error("Enter your @rutgers.edu email.");
      }
      if (mode === "mock") {
        await mockSignIn(address, membership);
        return { sent: false };
      }
      const supabase = supabaseRef.current;
      if (!supabase) throw new Error("Sign-in is unavailable right now.");
      const { error } = await supabase.auth.signInWithOtp({
        email: address,
        options: { emailRedirectTo: redirectTarget() },
      });
      if (error) throw new Error(error.message);
      return { sent: true };
    },
    [mode, mockSignIn]
  );

  const signOut = useCallback(() => {
    if (mode === "supabase") {
      supabaseRef.current?.auth.signOut();
    }
    setUser(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [mode]);

  const value = useMemo(
    () => ({ user, loading, mode, signInWithGoogle, requestMagicLink, signOut }),
    [user, loading, mode, signInWithGoogle, requestMagicLink, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
