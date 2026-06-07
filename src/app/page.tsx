import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 48 }}>
        <div style={{ width: 52, height: 52, borderRadius: 15, background: "linear-gradient(150deg,#E0C572,var(--gold),var(--gold-dim))", position: "relative", boxShadow: "0 10px 24px -10px rgba(156,126,43,.6)", flexShrink: 0 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 15, border: "1px solid rgba(255,255,255,.4)" }} />
          <svg style={{ position: "absolute", inset: 0, margin: "auto" }} width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M3 14l2-5.5A2 2 0 0 1 6.9 7h10.2a2 2 0 0 1 1.9 1.5L21 14M3 14h18M3 14v4h2m16-4v4h-2M6.5 17.5h11" stroke="#0C0D0F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="7" cy="14" r="1.4" fill="#0C0D0F" />
            <circle cx="17" cy="14" r="1.4" fill="#0C0D0F" />
          </svg>
        </div>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 34, letterSpacing: ".2px", margin: 0, lineHeight: 1, color: "var(--ink)" }}>
            VTW <span style={{ color: "var(--gold-dim)" }}>App</span>
          </h1>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 5, fontWeight: 400 }}>
            Staff Transport Operations Platform &middot; Vuyo&apos;s Trans World
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted-2)", fontWeight: 600, marginBottom: 24 }}>
        Select interface
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center" }}>
        <RoleCard
          href="/admin"
          icon={
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 17l5-5-5-5M11 19h9M11 12h9M11 5h9" />
            </svg>
          }
          title="Admin Console"
          desc="Trip planning, rosters, member allocation & publishing"
          role="Admin"
        />
        <RoleCard
          href="/driver"
          icon={
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 16l1.5-5A2 2 0 0 1 8.4 9.6h7.2A2 2 0 0 1 17.5 11L19 16M5 16h14M5 16v3h2m12-3v3h-2" />
              <circle cx="7.5" cy="16" r="1" />
              <circle cx="16.5" cy="16" r="1" />
            </svg>
          }
          title="Driver App"
          desc="Pickup flow, PIN verification, stop-by-stop navigation"
          role="Driver"
        />
        <RoleCard
          href="/member"
          icon={
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20a8 8 0 0 1 16 0" />
            </svg>
          }
          title="Member App"
          desc="Live driver tracking, pickup PIN, trip management"
          role="Member"
        />
      </div>

      <div style={{ marginTop: 48, fontSize: 11, color: "var(--muted-2)", letterSpacing: ".06em" }}>
        VTW · Vuyo&apos;s Trans World · Staff Transport Operations
      </div>
    </div>
  );
}

function RoleCard({ href, icon, title, desc, role }: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  role: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          width: 260,
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r)",
          padding: "28px 24px",
          boxShadow: "var(--shadow)",
          cursor: "pointer",
          transition: ".18s",
        }}
      >
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--bg2)", display: "grid", placeItems: "center", marginBottom: 16, color: "var(--gold-dim)" }}>
          {icon}
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 22, color: "var(--ink)", lineHeight: 1.1, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55 }}>{desc}</div>
        <div style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--gold-dim)", background: "var(--gold-soft)", border: "1px solid var(--gold-bdr)", padding: "5px 12px", borderRadius: 999 }}>
          {role} view →
        </div>
      </div>
    </Link>
  );
}
