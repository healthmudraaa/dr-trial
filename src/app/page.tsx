import Link from "next/link";

// Public product landing page. Portal access is per-role via /studies links.
export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <p className="text-sm font-bold tracking-wide text-teal-400 uppercase">DR Trial</p>
        <Link
          href="/studies"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500"
        >
          Open live demo
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 text-center">
        <p className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-teal-800 bg-teal-950/60 px-3 py-1 text-xs font-semibold text-teal-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
            <span className="relative h-2 w-2 rounded-full bg-teal-400" />
          </span>
          Real-time clinical study delivery
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Run clinical studies you can <span className="text-teal-400">watch happen live</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">
          DR Trial is a schema-driven clinical research platform: AI-assisted prescription capture at the point of
          care, doctor-verified data, QC-gated payments, and live sponsor dashboards — replacing month-old PDF
          reports with a study that streams in as it happens.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/studies" className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold hover:bg-teal-500">
            Explore the live demo
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-2xl">{f.icon}</p>
            <p className="mt-2 text-sm font-semibold text-slate-100">{f.title}</p>
            <p className="mt-1 text-sm text-slate-400">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-center text-2xl font-bold">One platform, five purpose-built portals</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ROLES.map((r) => (
              <div key={r.name} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                <p className="text-xl">{r.icon}</p>
                <p className="mt-1 text-sm font-semibold">{r.name}</p>
                <p className="mt-1 text-xs text-slate-400">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs text-slate-500">
        DR Trial — clinical research platform demo. Illustrative data only; no real patients.
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: "📷",
    title: "AI prescription capture",
    body: "Doctors photograph the prescription; AI digitises it into the study CRF; the doctor verifies every value before it counts.",
  },
  {
    icon: "🧬",
    title: "Schema-driven studies",
    body: "Visits, fields, validation ranges, currency, and compliance rules are configuration — onboard a new study without new code.",
  },
  {
    icon: "🛡️",
    title: "QC-gated payments",
    body: "Every submission passes the CRO QC desk. Honoraria become payable only after approval — with a full query lifecycle.",
  },
  {
    icon: "📈",
    title: "Live sponsor analytics",
    body: "Enrolment trajectory with projection, retention funnel, classification mix, and site performance — de-identified by design.",
  },
  {
    icon: "🔐",
    title: "Role-isolated portals",
    body: "Doctors, Ops, QC, Admin, Sponsor, and Client each get their own link and login. Sponsors never see PII or spend.",
  },
  {
    icon: "📋",
    title: "Audit trail everywhere",
    body: "Every action — capture, sign-off, QC decision, payout — lands in a timestamped audit log built for inspection.",
  },
];

const ROLES = [
  { icon: "🩺", name: "Investigator", body: "Enrol, capture, verify AI, track honoraria" },
  { icon: "🗂️", name: "Ops / CRO", body: "Roster, QC desk, queries, reminders, payouts" },
  { icon: "⚙️", name: "Study Admin", body: "Rates, locales, compliance, CRF schema" },
  { icon: "🏛️", name: "Sponsor", body: "De-identified live study health" },
  { icon: "🤝", name: "Client", body: "Full detail, spend, and exports" },
];
