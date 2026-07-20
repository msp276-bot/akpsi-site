"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface ChapterUser {
  name: string;
  email: string;
  role: "board" | "active" | "pledge";
}

interface AuthState {
  user: ChapterUser | null;
  loading: boolean;
  /**
   * Mock Google OAuth. Resolves on success; rejects with a human-readable
   * message when the email is not an @rutgers.edu address.
   */
  signInWithGoogle: (
    email?: string,
    membership?: "active" | "pledge"
  ) => Promise<ChapterUser>;
  signOut: () => void;
}

const STORAGE_KEY = "akpsi.ot.user";
const AuthContext = createContext<AuthState | null>(null);

const RUTGERS_DOMAIN = "@rutgers.edu";
const BOARD_EMAILS = new Set(["president@rutgers.edu", "tech@rutgers.edu"]);

function deriveName(email: string): string {
  const local = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return local
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ") || "Chapter Member";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ChapterUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Omit<ChapterUser, "role"> & { role?: string };
        // Preserve mock sessions created before the portal split.
        setUser({
          ...stored,
          role: stored.role === "member" ? "active" : (stored.role as ChapterUser["role"]),
        });
      }
    } catch {
      /* ignore malformed storage */
    }
    setLoading(false);
  }, []);

  const signInWithGoogle = useCallback(async (
    email?: string,
    membership: "active" | "pledge" = "active"
  ) => {
    // Simulate the Google popup round-trip. In production this is where the
    // real OAuth flow would run; the @rutgers.edu check mirrors a hosted-domain
    // (hd) restriction on the OAuth client.
    await new Promise((r) => setTimeout(r, 900));

    const address = (email ?? "member@rutgers.edu").trim().toLowerCase();

    if (!address.endsWith(RUTGERS_DOMAIN)) {
      throw new Error(
        "That account isn't a @rutgers.edu address. The member portal is limited to Rutgers accounts — reach out to the tech committee if you need help."
      );
    }

    const nextUser: ChapterUser = {
      email: address,
      name: deriveName(address),
      role: BOARD_EMAILS.has(address) ? "board" : membership,
    };

    setUser(nextUser);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch {
      /* storage may be unavailable */
    }
    return nextUser;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, signOut }),
    [user, loading, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
