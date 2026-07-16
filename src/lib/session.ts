"use client";

// Demo-grade role sessions, stored per role+study in localStorage. This gives
// every portal a real login gate and per-user scoping (e.g. which investigator
// is signed in). Production swaps this for server-side auth (OTP/SSO + JWT);
// the Session shape is the contract.

export type Role = "dr" | "ops" | "admin" | "sponsor" | "client";

export interface Session {
  role: Role;
  studyId: string;
  userId: string; // investigatorId for doctors; email for staff roles
  name: string;
  signedInAt: string;
}

function key(role: Role, studyId: string) {
  return `dr-trial-session-${role}-${studyId}`;
}

export function getSession(role: Role, studyId: string): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(role, studyId));
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function signIn(session: Session) {
  window.localStorage.setItem(key(session.role, session.studyId), JSON.stringify(session));
}

export function signOut(role: Role, studyId: string) {
  window.localStorage.removeItem(key(role, studyId));
}

// Demo staff credentials, shown on each login screen.
export const DEMO_STAFF = {
  email: "demo@drtrial.in",
  password: "demo123",
};

export const DEMO_OTP = "123456";
