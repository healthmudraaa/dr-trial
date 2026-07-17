# DR Trial — Clinical Research Platform (demo)

Health Mudraa's clinical-research product demo. We act as the Research Organisation (CRO) controlling the tech; investigators (doctors) enroll patients and capture prescriptions; ops runs QC and payouts; sponsors/clients view progress.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- **No backend** — all data lives in a client-side persistent store (`src/lib/store.ts`, localStorage-backed). Auth is demo-grade (`src/lib/session.ts`).
- Fonts: Geist. Deployed via Vercel (`vercel.json`).

## Commands

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — eslint

## Structure

Five role portals, each keyed by `[studyId]` with its own login page:

| Route | Role |
|---|---|
| `/dr/[studyId]` | Investigator (doctor): onboarding, patient enrollment, Rx capture wizard, support tickets |
| `/ops/[studyId]` | Operations: verification queue, QC gate, payouts, queries, reminders, investigator roster, audit |
| `/admin/[studyId]` | Admin: study config, copy per-role links |
| `/client/[studyId]` | Client/CRO view: overview, patients, investigators, spend, exports |
| `/sponsor/[studyId]` | Sponsor read-only view |

- Studies are defined in `src/studies/` (`tolerate-hf.ts`, `diabetes-poc.ts`).
- Core flow: Rx capture (AI extraction) → doctor verification → ops QC gate → payout release. Logic in `src/lib/` (`store.ts`, `payouts.ts`, `status.ts`, `analytics.ts`, `inbox.ts`, `csv.ts`).
- Shared UI in `src/components/` (`PortalShell`, `RxCaptureWizard`, `LoginScreens`, `StudyAnalytics`, ui primitives).

## Conventions / gotchas

- Store reads must use fresh references so lists update instantly after actions (see commit 76f060b).
- UI style: glass sticky headers, gradient buttons, ambient login screens — keep new UI consistent with this.

## Project history & past conversations

Full transcripts of the Claude Code sessions that built this are in `chat-history/`:

- `chat-1-2026-07-15.md` — original product brief ("Clinical research product from scratch") and first build
- `chat-2-2026-07-16.md` — main build session: Rx pipeline, 5 portals, auth, analytics, exports, UI pass, UX fixes
- `chat-3-2026-07-17.md` — chat-history recovery session

**Read these transcripts instead of re-deriving product decisions.** The repo previously lived at `C:\Users\dines\OneDrive\Documents\GitHub\dr-trial`; it now lives at `C:\Users\dines\OneDrive\Desktop\dr-trial`. Raw session files (resumable with `claude --resume` from `C:\Users\dines`) are in `C:\Users\dines\.claude\projects\C--Users-dines\`.
