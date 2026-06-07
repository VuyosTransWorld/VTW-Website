"use client";
import { useState, useEffect, useRef } from "react";
import { myTripsData, MyTrip } from "@/lib/data";
import Toast, { useToast } from "./Toast";

export default function MemberApp() {
  const { msg, key: toastKey, toast, hide } = useToast();
  const [activeTab, setActiveTab] = useState<"today" | "trips">("today");
  const [trips, setTrips] = useState<MyTrip[]>(myTripsData.map((t) => ({ ...t })));

  // Car animation
  const [carPos, setCarPos] = useState({ x: 300, y: 58 });
  const [eta, setEta] = useState("2 min");
  const progRef = useRef(0);
  const frameRef = useRef<number>(0);

  const carPath = useRef([[300, 58], [250, 88], [200, 118], [150, 170], [120, 225], [110, 235]]).current;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const animate = () => {
      progRef.current += 0.004;
      if (progRef.current > 1) progRef.current = 0;
      const p = progRef.current;
      const i = Math.min(carPath.length - 2, Math.floor(p * (carPath.length - 1)));
      const f = p * (carPath.length - 1) - i;
      const x = carPath[i][0] + (carPath[i + 1][0] - carPath[i][0]) * f;
      const y = carPath[i][1] + (carPath[i + 1][1] - carPath[i][1]) * f;
      setCarPos({ x, y });
      setEta(`${Math.max(1, Math.ceil((1 - p) * 4))} min`);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const cancelTrip = (i: number) => {
    const updated = [...trips];
    const oldDay = updated[i].day.replace("Today · ", "");
    updated[i] = { ...updated[i], status: "cancelled" };
    setTrips(updated);
    toast(`Cancelled ${oldDay} — VTW & driver notified`);
  };

  const restoreTrip = (i: number) => {
    const updated = [...trips];
    updated[i] = { ...updated[i], status: "scheduled" };
    setTrips(updated);
    toast("Trip restored");
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
      <div style={{ width: 392, maxWidth: "100%", background: "#000", borderRadius: 42, padding: 13, boxShadow: "var(--shadow-lg), 0 0 0 1px rgba(0,0,0,.1)", position: "relative" }}>
        <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", width: 120, height: 26, background: "#000", borderRadius: "0 0 16px 16px", zIndex: 6 }} />
        <div style={{ background: "var(--bg)", borderRadius: 31, overflow: "hidden", height: 768, position: "relative", color: "var(--ink)", fontSize: 15 }}>
          <div style={{ height: "100%", overflowY: "auto" }} className="scrollable">
            {/* Header */}
            <div style={{ padding: "44px 18px 0", background: "var(--black)", color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 22 }}>
                    <span style={{ display: "block", fontFamily: "Poppins", fontWeight: 400, fontSize: 11.5, color: "rgba(255,255,255,.6)" }}>Welcome back</span>
                    Thandi
                  </div>
                </div>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,.12)", display: "grid", placeItems: "center", fontWeight: 600, fontSize: 13 }}>TN</div>
              </div>
              <div style={{ display: "flex", gap: 5, marginTop: 16, background: "rgba(255,255,255,.09)", padding: 4, borderRadius: 12 }}>
                {(["today", "trips"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{ flex: 1, fontFamily: "Poppins", fontWeight: activeTab === tab ? 600 : 500, fontSize: 13, color: activeTab === tab ? "var(--black)" : "rgba(255,255,255,.62)", background: activeTab === tab ? "#fff" : "none", border: 0, padding: 9, borderRadius: 9, cursor: "pointer" }}
                  >
                    {tab === "today" ? "Today" : "My trips"}
                  </button>
                ))}
              </div>
            </div>

            {/* Today pane */}
            {activeTab === "today" && (
              <div>
                {/* Map */}
                <div style={{ height: 286, position: "relative", background: "var(--bg2)", overflow: "hidden" }}>
                  <svg viewBox="0 0 392 286" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
                    <rect width="392" height="286" fill="#F5F5F2" />
                    <path d="M0 70 Q120 60 200 100 T392 90" stroke="rgba(12,13,15,.07)" strokeWidth="14" fill="none" />
                    <path d="M0 190 Q140 200 240 160 T392 200" stroke="rgba(12,13,15,.07)" strokeWidth="14" fill="none" />
                    <path d="M90 0 Q110 120 70 286" stroke="rgba(12,13,15,.07)" strokeWidth="12" fill="none" />
                    <path d="M280 0 Q300 140 320 286" stroke="rgba(12,13,15,.07)" strokeWidth="12" fill="none" />
                    <ellipse cx="320" cy="66" rx="55" ry="32" fill="#E3E6E2" />
                    <path d="M300 58 C250 88 200 118 150 170 S120 225 110 235" stroke="#9C7E2B" strokeWidth="4" fill="none" strokeDasharray="3 9" strokeLinecap="round" opacity=".9" />
                    <g transform="translate(110,235)">
                      <circle r="13" fill="#fff" stroke="#C9A84C" strokeWidth="3" />
                      <circle r="5" fill="#C9A84C" />
                    </g>
                    <text x="110" y="266" textAnchor="middle" fontFamily="Poppins" fontSize="11" fontWeight="600" fill="#111315">You</text>
                    <g transform={`translate(${carPos.x},${carPos.y})`}>
                      <circle r="16" fill="#0C0D0F" />
                      <path d="M-7 1l1.4-4.2A1.6 1.6 0 0 1-4 -4.4h8a1.6 1.6 0 0 1 1.6 1.2L7 1M-7 1h14M-7 1v2.4h1.6M7 1v2.4H5.4" stroke="#C9A84C" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  </svg>
                  {/* Status overlay */}
                  <div style={{ position: "absolute", top: 16, left: 18, right: 18, background: "rgba(255,255,255,.97)", borderRadius: 16, padding: "13px 16px", boxShadow: "var(--shadow-md)", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--gold)", position: "relative", flexShrink: 0 }}>
                      <span style={{ position: "absolute", inset: -6, borderRadius: "50%", border: "2px solid var(--gold)", animation: "pulse 1.8s var(--d) infinite", display: "block" }} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 20, color: "var(--ink)", lineHeight: 1 }}>Driver is on the way</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Approaching your pickup</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 24, color: "var(--gold-dim)", lineHeight: 1 }}>{eta}</div>
                      <div style={{ fontSize: 10, color: "var(--muted-2)" }}>away</div>
                    </div>
                  </div>
                </div>

                {/* Bottom sheet */}
                <div style={{ background: "var(--card)", borderRadius: "26px 26px 0 0", marginTop: -26, position: "relative", padding: "22px 20px 26px", boxShadow: "0 -12px 30px -20px rgba(12,13,15,.18)" }}>
                  <div style={{ width: 42, height: 5, borderRadius: 3, background: "var(--line)", margin: "0 auto 18px" }} />
                  {/* Driver */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--ink)", display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>SM</div>
                    <div>
                      <div style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 24, color: "var(--ink)", lineHeight: 1 }}>Sipho Mbeki</div>
                      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>VTW partner driver</div>
                      <div style={{ color: "var(--gold-dim)", fontSize: 12, marginTop: 4, letterSpacing: 1 }}>★★★★★ <span style={{ color: "var(--muted-2)" }}>4.9</span></div>
                    </div>
                  </div>
                  {/* Vehicle card */}
                  <div style={{ marginTop: 18, background: "var(--bg2)", borderRadius: 16, padding: 15, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 13, background: "var(--card)", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "var(--shadow)" }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.8"><path d="M5 16l1.5-5A2 2 0 0 1 8.4 9.6h7.2A2 2 0 0 1 17.5 11L19 16M5 16h14M5 16v3h2m12-3v3h-2" /><circle cx="7.5" cy="16" r="1" /><circle cx="16.5" cy="16" r="1" /></svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>Toyota Rumion · White</div>
                      <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>Arriving for your morning shift</div>
                    </div>
                    <div style={{ marginLeft: "auto", fontWeight: 700, fontSize: 14, background: "var(--black)", color: "#fff", padding: "8px 12px", borderRadius: 9, letterSpacing: ".08em" }}>CA 314-872</div>
                  </div>
                  {/* PIN box */}
                  <div style={{ marginTop: 18, background: "var(--black)", color: "#fff", borderRadius: 18, padding: 19, textAlign: "center", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: -20, bottom: -30, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,.22),transparent 70%)" }} />
                    <div style={{ fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", fontWeight: 600 }}>Your pickup PIN</div>
                    <div style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 50, letterSpacing: ".22em", margin: "6px 0 4px", paddingLeft: ".22em", color: "var(--gold)" }}>4 2 9 1</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)" }}>Give this to the driver to confirm it&apos;s you</div>
                  </div>
                  {/* Ready row */}
                  <div style={{ marginTop: 16, background: "var(--gold-soft)", border: "1px solid var(--gold-bdr)", borderRadius: 14, padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dim)" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--gold-dim)" }}>Be ready by 06:40</div>
                      <div style={{ fontSize: 12, color: "#9b8650" }}>Wait at your gate · the driver will call on arrival</div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginTop: 18 }}>
                    <button onClick={() => toast("Calling driver…")} style={{ border: 0, borderRadius: 15, padding: 15, fontFamily: "Poppins", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "var(--safe-soft)", color: "var(--safe)" }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
                      Call driver
                    </button>
                    <button onClick={() => toast("Opening WhatsApp…")} style={{ border: 0, borderRadius: 15, padding: 15, fontFamily: "Poppins", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "var(--info-soft)", color: "var(--info)" }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16v12H7l-3 3z" /></svg>
                      Message
                    </button>
                  </div>
                  {/* Privacy */}
                  <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12, color: "var(--muted)", lineHeight: 1.5, padding: "0 2px" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dim)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
                    <div>This trip is private to you. You can&apos;t see other passengers&apos; names, addresses or stops — and they can&apos;t see yours.</div>
                  </div>
                </div>
              </div>
            )}

            {/* My trips pane */}
            {activeTab === "trips" && (
              <div style={{ padding: 18 }}>
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 24, color: "var(--ink)", margin: "4px 2px 4px" }}>My trips</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 2px 16px" }}>Tap cancel if you&apos;re not working — it frees your seat and tells VTW.</div>
                {trips.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      border: t.status === "live" ? "1px solid var(--gold)" : "1px solid var(--line)",
                      borderRadius: 18, padding: 16, marginBottom: 13, background: "var(--card)",
                      boxShadow: t.status === "live" ? "0 0 0 1px var(--gold), var(--shadow)" : "var(--shadow)",
                      opacity: t.status === "cancelled" ? 0.6 : 1,
                      transition: ".2s",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
                      {t.day}
                      {t.status === "live" && <span style={{ fontSize: 9.5, letterSpacing: ".1em", background: "var(--gold)", color: "var(--black)", padding: "2px 7px", borderRadius: 6, fontWeight: 700 }}>TODAY</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 13 }}>
                      <div style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 30, color: "var(--ink)", lineHeight: 1 }}>{t.time}</div>
                      <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.4 }}>
                        <b style={{ color: "var(--ink)", fontWeight: 600 }}>{t.client}</b><br />
                        {t.shift} shift · pickup time
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 12.5, color: "var(--muted)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dim)" strokeWidth="2"><path d="M12 21s-7-5-7-11a7 7 0 0 1 14 0c0 6-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
                      Site C · yellow gate
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, paddingTop: 13, borderTop: "1px solid var(--line-soft)" }}>
                      {t.status === "cancelled" ? (
                        <>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--late)", display: "flex", alignItems: "center", gap: 6 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            Cancelled · seat freed
                          </span>
                          <button onClick={() => restoreTrip(i)} style={{ marginLeft: "auto", fontFamily: "Poppins", fontWeight: 600, fontSize: 12.5, borderRadius: 10, padding: "9px 14px", cursor: "pointer", border: "1px solid var(--line)", background: "var(--card)", color: "var(--safe)" }}>Undo</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => cancelTrip(i)} style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12.5, borderRadius: 10, padding: "9px 14px", cursor: "pointer", border: "1px solid var(--line)", background: "var(--card)", color: "var(--late)" }}>
                            {t.status === "live" ? "Cancel today" : "Cancel this day"}
                          </button>
                          <span style={{ fontSize: 12, color: "var(--safe)", fontWeight: 600, marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" /></svg>
                            {t.status === "live" ? "Driver on the way" : "Scheduled"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {msg && <Toast key={toastKey} message={msg} onHide={hide} />}
    </div>
  );
}
