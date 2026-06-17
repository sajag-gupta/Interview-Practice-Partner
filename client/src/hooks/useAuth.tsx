import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { FeedbackData } from "@shared/schema";

const SESSION_KEY = "interviewproai_auth_session";
const ACCOUNTS_KEY = "interviewproai_auth_accounts";
const LAST_FEEDBACK_KEY = "interviewproai_last_feedback";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type StoredAccount = AuthUser & {
  passwordHash: string;
};

type AuthInput = {
  name?: string;
  email: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (input: AuthInput) => Promise<AuthUser>;
  signUp: (input: Required<Pick<AuthInput, "name" | "email" | "password">>) => Promise<AuthUser>;
  signOut: () => void;
  lastFeedback: FeedbackData | null;
  saveLastFeedback: (feedback: FeedbackData) => void;
  clearLastFeedback: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadAccounts(): Record<string, StoredAccount> {
  return safeParse<Record<string, StoredAccount>>(localStorage.getItem(ACCOUNTS_KEY), {});
}

function saveAccounts(accounts: Record<string, StoredAccount>) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

async function hashSecret(secret: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret.trim());
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeName(name: string) {
  return name.trim();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() =>
    safeParse<AuthUser | null>(localStorage.getItem(SESSION_KEY), null),
  );
  const [lastFeedback, setLastFeedback] = useState<FeedbackData | null>(() =>
    safeParse<FeedbackData | null>(localStorage.getItem(LAST_FEEDBACK_KEY), null),
  );

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (lastFeedback) {
      localStorage.setItem(LAST_FEEDBACK_KEY, JSON.stringify(lastFeedback));
    } else {
      localStorage.removeItem(LAST_FEEDBACK_KEY);
    }
  }, [lastFeedback]);

  const signUp = async (input: Required<Pick<AuthInput, "name" | "email" | "password">>) => {
    const email = normalizeEmail(input.email);
    const name = normalizeName(input.name);

    if (!email || !name || !input.password.trim()) {
      throw new Error("Please enter your name, email, and passcode.");
    }

    const accounts = loadAccounts();
    const passwordHash = await hashSecret(input.password);
    const existing = accounts[email];

    if (existing && existing.passwordHash !== passwordHash) {
      throw new Error("An account already exists for this email. Use the matching passcode or sign in.");
    }

    const account =
      existing || {
        id: crypto.randomUUID(),
        name,
        email,
        createdAt: new Date().toISOString(),
        passwordHash,
      };

    accounts[email] = account;
    saveAccounts(accounts);

    const sessionUser: AuthUser = {
      id: account.id,
      name: account.name,
      email: account.email,
      createdAt: account.createdAt,
    };

    setUser(sessionUser);
    return sessionUser;
  };

  const signIn = async (input: AuthInput) => {
    const email = normalizeEmail(input.email);
    const accounts = loadAccounts();
    const existing = accounts[email];

    if (!existing) {
      throw new Error("No workspace found for this email. Create an account first.");
    }

    const passwordHash = await hashSecret(input.password);

    if (existing.passwordHash !== passwordHash) {
      throw new Error("Passcode does not match this workspace.");
    }

    const sessionUser: AuthUser = {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      createdAt: existing.createdAt,
    };

    setUser(sessionUser);
    return sessionUser;
  };

  const signOut = () => {
    setUser(null);
    setLastFeedback(null);
  };

  const saveLastFeedback = (feedback: FeedbackData) => {
    setLastFeedback(feedback);
  };

  const clearLastFeedback = () => {
    setLastFeedback(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        signIn,
        signUp,
        signOut,
        lastFeedback,
        saveLastFeedback,
        clearLastFeedback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
