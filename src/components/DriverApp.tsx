"use client";
import { useState, useEffect, useRef } from "react";
import { driverStops } from "@/lib/data";
import Toast, { useToast } from "./Toast";

type StopResult = { r: "v" | "n" | "o"; reason?: string };

export default function DriverApp() {
  const { msg, key: toastKey, toast, hide } = useToast();
  const [dCur, setDCur] = useState(0);
  const [dResults, setDResults] = useState<(StopResult | null)[]>(Array(driverStops.length).fill(null));
  const [phase, setPhase] = useState<"next" | "arrive" | "override" | "done">("next");
  const [pinEntry, setPinEntry] = useState("");
  const [graceLeft, setGraceLeft] = useState(120);
  const [finished, setFinished] = useState(false);
  const graceRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doneCount = dResults.filter((r) => r !== null).length;

  const startGrace = () => {
    if (graceRef.current) clearInterval(graceRef.current);
    setGraceLeft(120);
    graceRef.current = setInterval(() => {
      setGraceLeft((prev) => {
        if (prev <= 1) {
          clearInterval(graceRef.current!);
          toast("Grace period ended — you may leave");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (graceRef.current) clearInterval(graceRef.current); }, []);

  const arrive = () => {
    setPinEntry("");
    setGraceLeft(120);
    setPhase("arrive");
    startGrace();
  };

  const pinKey = (k: string) => {
    if (pinEntry.length >= 4) return;
    const next = pinEntry + k;
    setPinEntry(next);
    if (next.length === 4) {
      if (next === driverStops[dCur].pin) {
        // correct - unlock picked button
      } else {
        toast("PIN incorrect — try again or override");
        setTimeout(() => setPinEntry(""), 400);
      }
    }
  };

  const pinDel = () => setPinEntry((p) => p.slice(0, -1));

  const markPicked = () => {
    if (graceRef.current) clearInterval(graceRef.current);
    const res = [...dResults]; res[dCur] = { r: "v" };
    setDResults(res);
    if (dCur + 1 >= driverStops.length) { setPhase("done"); }
    else { setDCur((c) => c + 1); setPhase("next"); }
    toast("✓ Verified pickup recorded");
  };

  const markNoShow = () => {
    if (graceRef.current) clearInterval(graceRef.current);
    const res = [...dResults]; res[dCur] = { r: "n" };
    setDResults(res);
    if (dCur + 1 >= driverStops.length) { setPhase("done"); }
    else { setDCur((c) => c + 1); setPhase("next"); }
    toast("No-show logged with time & GPS");
  };

  const doOverride = (reason: string) => {
    if (graceRef.current) clearInterval(graceRef.current);
    const res = [...dResults]; res[dCur] = { r: "o", reason };
    setDResults(res);
    if (dCur + 1 >= driverStops.length) { setPhase("done"); }
    else { setDCur((c) => c + 1); setPhase("next"); }
    toast(`Override pickup: ${reason}`);
  };

  const pinUnlocked = pinEntry.length === 4 && pinEntry === driverStops[dCur]?.pin;
  const graceMin = Math.floor(graceLeft / 60);
  const graceSec = String(graceLeft % 60).padStart(2, "0");
  const graceOffset = 113 * (1 - graceLeft / 120);

  const v = dResults.filter((r) => r?.r === "v").length;
  const o = dResults.filter((r) => r?.r === "o").length;
  const n = dResults.filter((r) => r?.r === "n").length;

  const ProgressList = () => (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column" }}>
      {driverStops.map((s, i) => {
        const done = i < dCur || (i === dCur && phase === "done");
        const cur = i === dCur && phase !== "done";
        const res = dResults[i];
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "9px 2px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24 }}>
              <div style={{
                width: 14, height: 14, borderRadius: "50%", zIndex: 2,
                background: done || (res !== null) ? "var(--gold)" : "var(--card)",
                border: cur ? "2px solid var(--gold)" : "2px solid var(--line)",
                boxShadow: cur ? "0 0 0 4px var(--gold-soft)" : undefined,
              }} />
              {i < driverStops.length - 1 && <div style={{ width: 2, flex: 1, background: "var(--line)", margin: "2px 0" }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)" }}>{s.n}</div>
              <div style={{ fontSize: 11, color: "var(--muted-2)" }}>{s.eta} · {s.a.split(" — ")[0]}</div>
            </div>
            {res ? (
              <span style={{
                fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 8,
                color: res.r === "v" ? "var(--safe)" : res.r === "o" ? "var(--tight)" : "var(--late)",
                background: res.r === "v" ? "var(--safe-soft)" : res.r === "o" ? "var(--tight-soft)" : "var(--late-soft)",
              }}>
                {res.r === "v" ? "Verified" : res.r === "o" ? "Override" : "No show"}
              </span>
            ) : cur ? (
              <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 8, color: "var(--gold-dim)", background: "var(--gold-soft)" }}>Current</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );

  const s = driverStops[dCur];

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
      <div style={{ width: 392, maxWidth: "100%", background: "#000", borderRadius: 42, padding: 13, boxShadow: "var(--shadow-lg), 0 0 0 1px rgba(0,0,0,.1)", position: "relative" }}>
        <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", width: 120, height: 26, background: "#000", borderRadius: "0 0 16px 16px", zIndex: 6 }} />
        <div style={{ background: "var(--bg)", borderRadius: 31, overflow: "hidden", height: 768, position: "relative", color: "var(--ink)", fontSize: 15 }}>
          <div style={{ height: "100%", overflowY: "auto" }} className="scrollable">
            {/* Header */}
            <div style={{ padding: "46px 22px 16px", background: "var(--black)", color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 26, lineHeight: 1.05 }}>
                  <span style={{ display: "block", fontFamily: "Poppins", fontWeight: 400, fontSize: 12, color: "rgba(255,255,255,.62)", marginBottom: 5 }}>Good morning</span>
                  Sipho Mbeki
                </div>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(150deg,#E0C572,var(--gold),var(--gold-dim))", display: "grid", placeItems: "center", fontWeight: 700, color: "var(--black)" }}>SM</div>
              </div>
              <div style={{ display: "flex", gap: 5, marginTop: 18, background: "rgba(255,255,255,.09)", padding: 4, borderRadius: 12 }}>
                {["Today", "This week", "Completed", "Issues"].map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => i > 0 && toast(tab === "This week" ? "This week — 5 trips scheduled" : tab === "Completed" ? "Completed trips appear here" : "No open issues")}
                    style={{ flex: 1, fontFamily: "Poppins", fontWeight: i === 0 ? 600 : 500, fontSize: 12.5, color: i === 0 ? "var(--black)" : "rgba(255,255,255,.62)", background: i === 0 ? "var(--gold)" : "none", border: 0, padding: 8, borderRadius: 9, cursor: "pointer" }}
                  >{tab}</button>
                ))}
              </div>
            </div>

            {/* Trip card */}
            <div style={{ margin: "15px 18px", background: "var(--ink)", color: "#fff", borderRadius: 20, padding: 17, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,.25),transparent 70%)" }} />
              <span style={{ fontSize: 10, letterSpacing: ".12em", color: "var(--gold)", background: "rgba(201,168,76,.16)", padding: "4px 10px", borderRadius: 7, fontWeight: 600 }}>ROUTE A · MORNING</span>
              <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 27, margin: "12px 0 3px" }}>Coastal Foods</h3>
              <div style={{ color: "rgba(255,255,255,.62)", fontSize: 13 }}>Epping Industrial · arrive by 07:30</div>
              <div style={{ display: "flex", gap: 20, marginTop: 15 }}>
                <div><div style={{ fontWeight: 700, fontSize: 18 }}>6</div><div style={{ color: "rgba(255,255,255,.55)", fontSize: 11, marginTop: 2 }}>Pickups</div></div>
                <div><div style={{ fontWeight: 700, fontSize: 18 }}>{doneCount}/6</div><div style={{ color: "rgba(255,255,255,.55)", fontSize: 11, marginTop: 2 }}>Done</div></div>
                <div><div style={{ fontWeight: 700, fontSize: 18 }}>Rumion</div><div style={{ color: "rgba(255,255,255,.55)", fontSize: 11, marginTop: 2 }}>6 staff seats</div></div>
              </div>
            </div>

            {/* Driver flow */}
            <div style={{ padding: "4px 18px 18px" }}>
              {phase === "done" ? (
                <>
                  <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)", margin: "12px 4px 10px", fontWeight: 600 }}>All stops complete</div>
                  <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 22, padding: 19, boxShadow: "var(--shadow-md)", textAlign: "center" }}>
                    <div style={{ width: 62, height: 62, borderRadius: "50%", background: "linear-gradient(150deg,#E0C572,#C9A84C,#9C7E2B)", display: "grid", placeItems: "center", margin: "6px auto 14px" }}>
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0C0D0F" strokeWidth="2.6"><path d="M5 12l5 5L20 7" /></svg>
                    </div>
                    <div style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 30, color: "var(--ink)", lineHeight: 1.05 }}>Arrive at Epping</div>
                    <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 6, lineHeight: 1.45 }}>Tap below when staff are dropped at the site</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                      <div style={{ flex: 1, background: "var(--bg2)", borderRadius: 14, padding: 12, textAlign: "center" }}><div style={{ fontWeight: 700, fontSize: 16, color: "var(--safe)" }}>{v}</div><div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>Verified</div></div>
                      <div style={{ flex: 1, background: "var(--bg2)", borderRadius: 14, padding: 12, textAlign: "center" }}><div style={{ fontWeight: 700, fontSize: 16, color: "var(--tight)" }}>{o}</div><div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>Override</div></div>
                      <div style={{ flex: 1, background: "var(--bg2)", borderRadius: 14, padding: 12, textAlign: "center" }}><div style={{ fontWeight: 700, fontSize: 16, color: "var(--late)" }}>{n}</div><div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>No show</div></div>
                    </div>
                    {!finished ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 11, marginTop: 16 }}>
                        <button
                          onClick={() => { setFinished(true); toast("Trip completed · arrived 07:24 · 6 min ahead of target"); }}
                          style={{ border: 0, borderRadius: 16, padding: 21, fontFamily: "Poppins", fontWeight: 600, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "var(--black)", color: "var(--gold)" }}
                        >
                          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 11l3 3L22 4M21 12v7H3V5h12" /></svg>
                          Trip completed
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", color: "var(--muted-2)", fontSize: 13, marginTop: 20, paddingBottom: 10 }}>Report sent to VTW control room ✓</div>
                    )}
                  </div>
                  <ProgressList />
                </>
              ) : phase === "next" ? (
                <>
                  <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)", margin: "12px 4px 10px", fontWeight: 600 }}>Next pickup · stop {dCur + 1} of 6</div>
                  <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 22, padding: 19, boxShadow: "var(--shadow-md)" }}>
                    <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gold-dim)", fontWeight: 600 }}>Heading to</div>
                    <div style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 30, marginTop: 6, color: "var(--ink)", lineHeight: 1.05 }}>{s.n}</div>
                    <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 6, lineHeight: 1.45 }}>{s.a}</div>
                    <div style={{ marginTop: 12, background: "var(--gold-soft)", border: "1px solid var(--gold-bdr)", borderRadius: 12, padding: "11px 13px", fontSize: 13, color: "var(--gold-dim)", display: "flex", gap: 9, alignItems: "flex-start" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>
                      {s.note}
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                      <div style={{ flex: 1, background: "var(--bg2)", borderRadius: 14, padding: 12, textAlign: "center" }}><div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>{s.eta}</div><div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>Scheduled</div></div>
                      <div style={{ flex: 1, background: "var(--bg2)", borderRadius: 14, padding: 12, textAlign: "center" }}><div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>{s.km}</div><div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>Distance</div></div>
                      <div style={{ flex: 1, background: "var(--bg2)", borderRadius: 14, padding: 12, textAlign: "center" }}><div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>2:00</div><div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>Grace</div></div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginTop: 16 }}>
                      <button onClick={() => toast("Opening navigation…")} style={{ border: 0, borderRadius: 16, padding: 18, fontFamily: "Poppins", fontWeight: 600, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, gridColumn: "1/-1", background: "var(--ink)", color: "#fff" }}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l18-8-8 18-2-8z" /></svg>
                        Navigate
                      </button>
                      <button onClick={arrive} style={{ border: 0, borderRadius: 16, padding: 21, fontFamily: "Poppins", fontWeight: 600, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, gridColumn: "1/-1", background: "linear-gradient(150deg,#E0C572,var(--gold),var(--gold-dim))", color: "var(--black)" }}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12l5 5L20 7" /></svg>
                        I&apos;ve arrived
                      </button>
                      <button onClick={() => toast("Calling passenger…")} style={{ border: 0, borderRadius: 16, padding: 18, fontFamily: "Poppins", fontWeight: 600, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "var(--safe-soft)", color: "var(--safe)" }}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
                        Call
                      </button>
                      <button onClick={() => toast("Opening WhatsApp…")} style={{ border: 0, borderRadius: 16, padding: 18, fontFamily: "Poppins", fontWeight: 600, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "var(--info-soft)", color: "var(--info)" }}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16v12H7l-3 3z" /></svg>
                        WhatsApp
                      </button>
                    </div>
                  </div>
                  <ProgressList />
                </>
              ) : phase === "arrive" ? (
                <>
                  <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)", margin: "12px 4px 10px", fontWeight: 600 }}>At stop · confirm pickup</div>
                  <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 22, padding: 19, boxShadow: "var(--shadow-md)" }}>
                    <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink)", fontWeight: 600 }}>Verify passenger</div>
                    <div style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 30, marginTop: 6, color: "var(--ink)", lineHeight: 1.05 }}>{s.n}</div>
                    <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>Ask for their 4-digit PIN <span style={{ color: "var(--muted-2)" }}>(try {s.pin})</span></div>
                    {/* PIN pad */}
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: "flex", gap: 11, justifyContent: "center", margin: "15px 0 6px" }}>
                        {[0, 1, 2, 3].map((idx) => (
                          <div key={idx} style={{ width: 54, height: 64, borderRadius: 14, background: pinEntry[idx] ? "var(--card)" : "var(--bg2)", border: pinEntry[idx] ? "2px solid var(--gold)" : "2px solid var(--line)", display: "grid", placeItems: "center", fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 30, color: "var(--ink)" }}>
                            {pinEntry[idx] ?? ""}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 10 }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => (
                          <button key={k} onClick={() => pinKey(String(k))} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: 16, fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 24, color: "var(--ink)", cursor: "pointer" }}>{k}</button>
                        ))}
                        <button style={{ background: "none", border: "none", cursor: "default" }} />
                        <button onClick={() => pinKey("0")} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: 16, fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 24, color: "var(--ink)", cursor: "pointer" }}>0</button>
                        <button onClick={pinDel} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: 16, fontFamily: "Poppins", fontWeight: 600, fontSize: 16, color: "var(--muted)", cursor: "pointer" }}>⌫</button>
                      </div>
                    </div>
                    {/* Grace bar */}
                    <div style={{ marginTop: 15, background: "var(--late-soft)", borderRadius: 14, padding: "12px 15px", display: "flex", alignItems: "center", gap: 12 }}>
                      <svg width="42" height="42" viewBox="0 0 42 42" style={{ flexShrink: 0 }}>
                        <circle cx="21" cy="21" r="18" fill="none" stroke="rgba(195,47,34,.18)" strokeWidth="4" />
                        <circle cx="21" cy="21" r="18" fill="none" stroke="#C32F22" strokeWidth="4" strokeLinecap="round" strokeDasharray="113" strokeDashoffset={graceOffset} transform="rotate(-90 21 21)" />
                      </svg>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 18, color: "var(--late)" }}>{graceMin}:{graceSec}</div>
                        <div style={{ fontSize: 12, color: "#9a5249" }}>Grace period — leave when it ends</div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginTop: 14 }}>
                      <button onClick={markNoShow} style={{ border: 0, borderRadius: 16, padding: 18, fontFamily: "Poppins", fontWeight: 600, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "var(--late-soft)", color: "var(--late)" }}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        No show
                      </button>
                      <button
                        onClick={markPicked}
                        disabled={!pinUnlocked}
                        style={{ border: 0, borderRadius: 16, padding: 18, fontFamily: "Poppins", fontWeight: 600, fontSize: 16, cursor: pinUnlocked ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "linear-gradient(150deg,#E0C572,var(--gold),var(--gold-dim))", color: "var(--black)", opacity: pinUnlocked ? 1 : 0.45, pointerEvents: pinUnlocked ? "auto" : "none" }}
                      >
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12l5 5L20 7" /></svg>
                        Picked up
                      </button>
                      <button onClick={() => setPhase("override")} style={{ border: 0, borderRadius: 16, padding: 14, fontFamily: "Poppins", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "var(--bg2)", color: "var(--ink)", gridColumn: "1/-1" }}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 1.5" /></svg>
                        PIN not working? Override pickup
                      </button>
                    </div>
                  </div>
                  <ProgressList />
                </>
              ) : /* override */ (
                <>
                  <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)", margin: "12px 4px 10px", fontWeight: 600 }}>Override reason</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {["Phone off", "Couldn't access PIN", "Network issue", "Known to driver", "Admin approved"].map((r) => (
                      <button key={r} onClick={() => doOverride(r)} style={{ border: 0, borderRadius: 16, padding: "14px 16px", fontFamily: "Poppins", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 9, background: "var(--bg2)", color: "var(--ink)" }}>
                        {r}
                      </button>
                    ))}
                  </div>
                  <ProgressList />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {msg && <Toast key={toastKey} message={msg} onHide={hide} />}
    </div>
  );
}
