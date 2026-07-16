"use client";

// Demo-grade login screens. Doctor login mirrors FR-01/doctor-web-login (mobile +
// OTP); staff roles use email/password. Real deployments replace the checks with
// a server auth service — the screens and session shape stay.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DEMO_OTP, DEMO_STAFF, signIn, type Role } from "@/lib/session";
import { getStudy } from "@/lib/studies";
import { useDb } from "@/lib/store";

function LoginFrame({ studyId, roleLabel, children }: { studyId: string; roleLabel: string; children: React.ReactNode }) {
  const study = getStudy(studyId);
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 dark:bg-slate-950">
      {/* ambient gradient glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-teal-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-teal-600/10 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-base font-bold text-white shadow-lg shadow-teal-700/25">
            DR
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">{study?.name}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{roleLabel} sign in</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_48px_-16px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          {children}
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Secure access — activity is audit-logged. Demo environment: no real patient data.
        </p>
      </div>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950";

export function DoctorLogin({ studyId }: { studyId: string }) {
  const db = useDb();
  const router = useRouter();
  const investigators = useMemo(
    () => db.investigators.filter((i) => i.studyId === studyId),
    [db.investigators, studyId]
  );
  const [selectedId, setSelectedId] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const selected = investigators.find((i) => i.id === selectedId);

  function verify() {
    if (!selected) return;
    if (otp !== DEMO_OTP) {
      setError(`Incorrect OTP. (Demo hint: ${DEMO_OTP})`);
      return;
    }
    signIn({
      role: "dr",
      studyId,
      userId: selected.id,
      name: selected.name,
      signedInAt: new Date().toISOString(),
    });
    router.replace(`/dr/${studyId}/dashboard`);
  }

  return (
    <LoginFrame studyId={studyId} roleLabel="Investigator">
      {!otpSent ? (
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Registered investigator</span>
            <select className={inputClass} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">Select your name…</option>
              {investigators.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name} — {inv.siteCode}, {inv.city}
                </option>
              ))}
            </select>
          </label>
          {selected && (
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Registered mobile</span>
              <input className={inputClass} value={selected.mobile} readOnly />
            </label>
          )}
          <Button className="w-full" disabled={!selected} onClick={() => setOtpSent(true)}>
            Send OTP
          </Button>
          <p className="text-xs text-slate-400">
            In production this list is replaced by direct mobile-number entry; only invited, registered numbers can
            proceed (FR-01).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            An OTP was sent to <span className="font-semibold">{selected?.mobile}</span>.
          </p>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">6-digit OTP</span>
            <input
              className={inputClass}
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                setError("");
              }}
              placeholder={`Demo OTP: ${DEMO_OTP}`}
            />
          </label>
          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
          <Button className="w-full" onClick={verify}>
            Verify & continue
          </Button>
          <button className="w-full text-xs text-slate-400 hover:underline" onClick={() => setOtpSent(false)}>
            ‹ Change investigator
          </button>
        </div>
      )}
    </LoginFrame>
  );
}

export function StaffLogin({ studyId, role, roleLabel }: { studyId: string; role: Role; roleLabel: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (email.trim().toLowerCase() !== DEMO_STAFF.email || password !== DEMO_STAFF.password) {
      setError(`Invalid credentials. (Demo: ${DEMO_STAFF.email} / ${DEMO_STAFF.password})`);
      return;
    }
    signIn({
      role,
      studyId,
      userId: email.trim().toLowerCase(),
      name: `${roleLabel} (demo)`,
      signedInAt: new Date().toISOString(),
    });
    router.replace(`/${role}/${studyId}`);
  }

  return (
    <LoginFrame studyId={studyId} roleLabel={roleLabel}>
      <div className="space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Work email</span>
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder={DEMO_STAFF.email}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Password</span>
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </label>
        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        <Button className="w-full" onClick={submit}>
          Sign in
        </Button>
        <p className="text-xs text-slate-400">
          Demo credentials: {DEMO_STAFF.email} / {DEMO_STAFF.password}
        </p>
      </div>
    </LoginFrame>
  );
}
