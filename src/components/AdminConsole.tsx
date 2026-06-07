"use client";
import { useState, useCallback, useEffect } from "react";
import {
  groups, members, Member, Trip, tripTemplates,
  dayLabel, fmt, targetMin, cap
} from "@/lib/data";
import MapSvg from "./MapSvg";
import Toast, { useToast } from "./Toast";

type Alloc = Record<number, string>; // memberIndex -> tripId
interface Plan { trips: Trip[]; alloc: Alloc; }

let uidCounter = 0;
function newTripId() { return "t" + (++uidCounter); }

function newTrip(t: Omit<Trip, "id">): Trip {
  return { ...t, id: newTripId() };
}

function computeEta2(t: Trip, tripMems: Array<{ m: Member; i: number }>, shift: string) {
  const m = tripMems.length;
  if (!t.driver || !t.vehicle) return { txt: "—", status: "late" as const, reason: "blocked" };
  if (m === 0) return { txt: "—", status: "none" as const, min: 0, tgt: 0 };
  const tgt = targetMin(shift);
  const etaMin = tgt - t.buffer + m * 3;
  let status: "safe" | "tight" | "late" = "safe";
  if (etaMin > tgt) status = "late";
  else if (etaMin > tgt - 6) status = "tight";
  if (m > cap(t)) status = "late";
  return { txt: fmt(etaMin), status, min: etaMin, tgt };
}

const STMAP: Record<string, [string, string, string]> = {
  safe:  ["s-safe",  '<path d="M20 6L9 17l-5-5"/>',                              "On target"],
  tight: ["s-tight", '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',   "Tight"],
  late:  ["s-late",  '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>', "Late risk"],
  none:  ["s-none",  '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',"Add members"],
};

const stPillFor = (m: Member, allocated: boolean) => {
  if (m.st === "nopin")    return { c: "p-nopin",   t: "No location",  ic: '<path d="M12 21s-7-5-7-11a7 7 0 0 1 14 0c0 6-7 11-7 11z"/>' };
  if (m.st === "review")   return { c: "p-review",  t: "Needs review", ic: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' };
  if (allocated)           return { c: "p-alloc",   t: "Allocated",    ic: '<path d="M20 6L9 17l-5-5"/>' };
  return { c: "p-unalloc", t: "Unallocated", ic: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>' };
};

export default function AdminConsole() {
  const { msg, key: toastKey, toast, hide } = useToast();

  const [day, setDay] = useState(8);
  const [shift, setShift] = useState("08:00");
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [activeTrip, setActiveTrip] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState("all");
  const [modal, setModal] = useState<{ title: string; value: string; onSave: (v: string) => void } | null>(null);
  const [modalInput, setModalInput] = useState("");

  const planKey = `${day}|${shift}`;

  const getPlan = useCallback((d: number, s: string, ps: Record<string, Plan>): Plan => {
    const k = `${d}|${s}`;
    if (ps[k]) return ps[k];
    const trips = tripTemplates(s).map(newTrip);
    return { trips, alloc: {} };
  }, []);

  // Seed initial plan
  useEffect(() => {
    const initial = getPlan(8, "08:00", {});
    if (initial.trips.length) {
      [0, 1, 2, 3, 4, 5].forEach((i) => { initial.alloc[i] = initial.trips[0].id; });
      [6, 7, 8, 9, 10].forEach((i) => { initial.alloc[i] = initial.trips[1].id; });
    }
    setPlans({ "8|08:00": initial });
    setActiveTrip(initial.trips[0]?.id ?? null);
  }, [getPlan]);

  const currentPlan = plans[planKey] ?? getPlan(day, shift, plans);

  const workingMembers = useCallback(() => {
    return members.map((m, i) => ({ m, i })).filter(
      ({ m }) => m.st !== "inactive" && m.shifts.includes(shift) && !m.off.includes(day)
    );
  }, [day, shift]);

  const tripMembers = useCallback((id: string) => {
    return workingMembers().filter((o) => currentPlan.alloc[o.i] === id);
  }, [workingMembers, currentPlan]);

  const isAlloc = (i: number) => currentPlan.alloc[i] != null;

  const updatePlan = (updater: (p: Plan) => Plan) => {
    setPlans((prev) => {
      const old = prev[planKey] ?? getPlan(day, shift, prev);
      return { ...prev, [planKey]: updater({ ...old, alloc: { ...old.alloc }, trips: [...old.trips] }) };
    });
  };

  const handleMemberClick = (i: number) => {
    const m = members[i];
    if (m.st === "nopin")   { toast(`${m.n} has no pinned location — can't allocate yet`); return; }
    if (m.st === "review")  { toast(`${m.n} changed location — approve it first`); return; }
    if (isAlloc(i)) { removeFromTrip(i); return; }
    if (!activeTrip || !currentPlan.trips.find((t) => t.id === activeTrip)) {
      toast("Add or select a trip first, then tap people in"); return;
    }
    const t = currentPlan.trips.find((t) => t.id === activeTrip)!;
    if (!t.driver) { toast(`Assign a driver to ${t.name} before allocating`); return; }
    if (tripMembers(t.id).length >= cap(t)) { toast(`${t.name} is full (${cap(t)} seats)`); return; }
    updatePlan((p) => { p.alloc[i] = activeTrip!; return p; });
    toast(`${m.n} → ${t.name}`);
  };

  const removeFromTrip = (i: number) => {
    const tn = isAlloc(i) ? (currentPlan.trips.find((t) => t.id === currentPlan.alloc[i])?.name ?? "") : "";
    updatePlan((p) => { delete p.alloc[i]; return p; });
    toast(`${members[i].n} removed from ${tn} — now unallocated`);
  };

  const aiAllocate = () => {
    let n = 0;
    updatePlan((p) => {
      workingMembers().forEach(({ m, i }) => {
        if (p.alloc[i] || m.st !== "ok") return;
        const t = p.trips.find(
          (t) => t.group === m.g && t.driver && t.vehicle &&
            workingMembers().filter((o) => p.alloc[o.i] === t.id).length < cap(t)
        );
        if (t) { p.alloc[i] = t.id; n++; }
      });
      return p;
    });
    toast(n ? `Auto-allocate placed ${n} member${n > 1 ? "s" : ""} into matching trips — review & confirm` : "Nothing to auto-allocate (no space or no matching trip)");
  };

  const addTrip = () => {
    const activeT = currentPlan.trips.find((t) => t.id === activeTrip);
    const g = activeT ? activeT.group : "A";
    const n = currentPlan.trips.filter((t) => t.group === g).length + 1;
    const t = newTrip({ group: g, name: `Route ${g} · Trip ${n}`, driver: null, vehicle: null, seats: 6, buffer: 18 });
    updatePlan((p) => { p.trips.push(t); return p; });
    setActiveTrip(t.id);
    toast(`New trip added to Route ${g} — assign a driver & vehicle`);
  };

  const rename = (id: string) => {
    const t = currentPlan.trips.find((t) => t.id === id);
    if (!t) return;
    setModalInput(t.name);
    setModal({
      title: "Rename trip",
      value: t.name,
      onSave: (v) => {
        updatePlan((p) => {
          const tr = p.trips.find((x) => x.id === id);
          if (tr) tr.name = v;
          return p;
        });
        toast(`Renamed to "${v}"`);
      },
    });
  };

  const tryPublish = () => {
    const p = currentPlan;
    if (!p.trips.length) { toast("No trips to publish — add a trip first"); return; }
    const blocked = p.trips.filter((t) => !t.driver || !t.vehicle || tripMembers(t.id).length > cap(t));
    if (blocked.length) {
      setActiveTrip(blocked[0].id);
      toast(`⚠ ${blocked[0].name} is blocked — fix it before publishing`);
    } else {
      toast(`All trips published ✓ Drivers & members notified for ${dayLabel(day)} · ${shift}`);
    }
  };

  const changeSel = (newDay: number, newShift: string) => {
    setDay(newDay);
    setShift(newShift);
    const p = plans[`${newDay}|${newShift}`] ?? getPlan(newDay, newShift, plans);
    setActiveTrip(p.trips[0]?.id ?? null);
  };

  // Filtered members list
  const shown = workingMembers().filter((o) => {
    if (groupFilter === "un") return !isAlloc(o.i);
    if (groupFilter !== "all") return o.m.g === groupFilter;
    return true;
  });

  const work = workingMembers();
  const unallocCount = work.filter((o) => !isAlloc(o.i)).length;

  const activeT = currentPlan.trips.find((t) => t.id === activeTrip) ?? null;
  const activeTripMembers = activeT ? tripMembers(activeT.id) : [];

  // ETA for active trip
  const eta = activeT ? computeEta2(activeT, activeTripMembers, shift) : null;

  const blockedTrips = currentPlan.trips.filter(
    (t) => !t.driver || !t.vehicle || tripMembers(t.id).length > cap(t)
  ).length;

  // Day options
  const dayOpts = Array.from({ length: 30 }, (_, k) => k + 1);
  const shiftOpts: string[] = [];
  for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 30) {
    shiftOpts.push(String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"));
  }

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto", padding: "22px 22px 80px" }}>
      {/* TOPBAR */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: "linear-gradient(150deg,#E0C572,var(--gold),var(--gold-dim))", position: "relative", boxShadow: "0 10px 24px -10px rgba(156,126,43,.6)", flexShrink: 0 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 13, border: "1px solid rgba(255,255,255,.4)" }} />
            <svg style={{ position: "absolute", inset: 0, margin: "auto" }} width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 14l2-5.5A2 2 0 0 1 6.9 7h10.2a2 2 0 0 1 1.9 1.5L21 14M3 14h18M3 14v4h2m16-4v4h-2M6.5 17.5h11" stroke="#0C0D0F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="7" cy="14" r="1.4" fill="#0C0D0F" />
              <circle cx="17" cy="14" r="1.4" fill="#0C0D0F" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 30, letterSpacing: ".2px", margin: 0, lineHeight: 1, color: "var(--ink)" }}>
              VTW <span style={{ color: "var(--gold-dim)" }}>App</span>
            </h1>
            <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4, fontWeight: 400 }}>Staff Transport Operations Platform &middot; Vuyo&apos;s Trans World</div>
          </div>
        </div>
        <span style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--gold-dim)", border: "1px solid var(--gold-bdr)", background: "var(--gold-soft)", padding: "5px 11px", borderRadius: 999, fontWeight: 600 }}>Admin Console</span>
      </div>

      {/* Admin context bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 11.5, color: "var(--muted-2)", fontWeight: 500 }}>
          <b style={{ color: "var(--muted)", fontWeight: 500 }}>Members</b>
          <span style={{ opacity: .45 }}>→</span>
          <b style={{ color: "var(--muted)", fontWeight: 500 }}>Route Groups</b>
          <span style={{ opacity: .45 }}>→</span>
          <b style={{ color: "var(--muted)", fontWeight: 500 }}>Roster</b>
          <span style={{ opacity: .45 }}>→</span>
          <span style={{ color: "var(--gold-dim)", background: "var(--gold-soft)", border: "1px solid var(--gold-bdr)", padding: "4px 10px", borderRadius: 8, fontWeight: 600 }}>Trip Planning</span>
          <span style={{ opacity: .45 }}>→</span>
          <span>Publish</span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginLeft: "auto" }}>
          {/* Client */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "8px 14px", display: "flex", flexDirection: "column", gap: 1, minWidth: 116, boxShadow: "var(--shadow)" }}>
            <span style={{ fontSize: 10, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--muted-2)", fontWeight: 500 }}>Client</span>
            <b style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>Coastal Foods</b>
          </div>
          {/* Day */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "8px 14px", display: "flex", flexDirection: "column", gap: 1, minWidth: 138, boxShadow: "var(--shadow)", cursor: "pointer" }}>
            <span style={{ fontSize: 10, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--muted-2)", fontWeight: 500 }}>Day of month</span>
            <select
              value={day}
              onChange={(e) => changeSel(parseInt(e.target.value, 10), shift)}
              style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13.5, color: "var(--ink)", background: "transparent", border: 0, padding: 0, margin: "0 -2px", cursor: "pointer", outline: "none" }}
            >
              {dayOpts.map((d) => <option key={d} value={d}>{dayLabel(d)}</option>)}
            </select>
          </div>
          {/* Shift */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "8px 14px", display: "flex", flexDirection: "column", gap: 1, minWidth: 138, boxShadow: "var(--shadow)", cursor: "pointer" }}>
            <span style={{ fontSize: 10, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--muted-2)", fontWeight: 500 }}>Shift starts</span>
            <select
              value={shift}
              onChange={(e) => changeSel(day, e.target.value)}
              style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13.5, color: "var(--ink)", background: "transparent", border: 0, padding: 0, margin: "0 -2px", cursor: "pointer", outline: "none" }}
            >
              {shiftOpts.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {/* Arrival target */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "8px 14px", display: "flex", flexDirection: "column", gap: 1, minWidth: 116, boxShadow: "var(--shadow)" }}>
            <span style={{ fontSize: 10, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--muted-2)", fontWeight: 500 }}>Arrival target</span>
            <b style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{fmt(targetMin(shift))}</b>
          </div>
        </div>
      </div>

      {/* Admin grid */}
      <div style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: 18 }}>
        {/* Rail */}
        <nav style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r)", padding: 11, height: "fit-content", position: "sticky", top: 18, boxShadow: "var(--shadow)" }}>
          <RailItem icon={<GridIcon />} label="Overview" />
          <RailItem icon={<HomeIcon />} label="Clients" />
          <RailItem icon={<MembersIcon />} label="Members" />
          <RailItem icon={<MapPinIcon />} label="Route Groups" />
          <RailItem icon={<CalIcon />} label="Rosters" />
          <RailItem icon={<ListIcon />} label="Trip Planning" active />
          <RailItem icon={<ClockIcon />} label="Live Trips" />
          <div style={{ fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted-2)", padding: "12px 12px 6px", fontWeight: 600 }}>Resources</div>
          <RailItem icon={<DriverIcon />} label="Drivers" />
          <RailItem icon={<VehicleIcon />} label="Vehicles" />
          <RailItem icon={<ReportsIcon />} label="Reports" />
          <RailItem icon={<IssuesIcon />} label="Issues" badge="3" />
        </nav>

        {/* Board */}
        <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 18, minWidth: 0 }}>
          {/* Map card */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r)", overflow: "hidden", position: "relative", boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 18px", borderBottom: "1px solid var(--line-soft)", flexWrap: "wrap" }}>
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 23, color: "var(--ink)", lineHeight: 1 }}>
                {activeT?.name ?? "No trip selected"}
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12.5, fontWeight: 500 }}>
                {activeT?.driver ?? "—"}
              </div>
              <span style={{ fontSize: 11.5, color: "var(--ink)", background: "var(--bg2)", padding: "4px 9px", borderRadius: 8, fontWeight: 500 }}>
                {activeT?.vehicle ? `${activeT.vehicle} · ${cap(activeT)} staff seats` : "—"}
              </span>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 11, fontSize: 13 }}>
                <span style={{ color: "var(--muted)", fontSize: 12.5, fontWeight: 500 }}>
                  ETA to site <b style={{ color: "var(--ink)" }}>{eta?.txt ?? "—"}</b>
                </span>
                <StatusChip status={eta?.status ?? "none"} />
              </div>
            </div>
            <div style={{ position: "relative", height: 322, background: "var(--bg2)" }}>
              <MapSvg activeTrip={activeT} tripMembers={activeTripMembers} />
              {(!activeT || activeTripMembers.length === 0) && (
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--muted-2)", fontSize: 13.5, fontWeight: 500, pointerEvents: "none" }}>
                  {!activeT ? 'No trips planned for this shift yet — tap "Add a trip"' : "No members allocated yet — tap people on the left to add them"}
                </div>
              )}
              <div style={{ position: "absolute", left: 16, bottom: 16, background: "rgba(255,255,255,.9)", backdropFilter: "blur(6px)", border: "1px solid var(--line)", borderRadius: 11, padding: "9px 13px", fontSize: 11.5, color: "var(--muted)", display: "flex", gap: 15, boxShadow: "var(--shadow)" }}>
                <i style={{ fontStyle: "normal", display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--gold)", display: "inline-block" }} />Pickup stop</i>
                <i style={{ fontStyle: "normal", display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--black)", display: "inline-block" }} />Destination</i>
              </div>
              <button
                onClick={() => toast("Pickup order optimised by shortest route")}
                className="recalc-btn"
                style={{ fontFamily: "Poppins" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" /></svg>
                Recalculate order
              </button>
            </div>
          </div>

          {/* Two pane */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, minHeight: 380 }}>
            {/* Members pane */}
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r)", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderBottom: "1px solid var(--line-soft)", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 20, color: "var(--ink)" }}>Members working this shift</div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>
                  {work.length} working · <span style={{ color: "var(--tight)", fontWeight: 600 }}>{unallocCount} to allocate</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid var(--line-soft)", flexWrap: "wrap" }}>
                <select
                  className="filt"
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  style={{ fontFamily: "Poppins", fontSize: 12.5, fontWeight: 500, color: "var(--ink)", background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 9, padding: "7px 10px", cursor: "pointer", outline: "none" }}
                >
                  <option value="all">All route groups</option>
                  <option value="A">Route A · Site C / Harare</option>
                  <option value="B">Route B · Kuyasa / Makhaza</option>
                  <option value="C">Route C · Delft / Belhar</option>
                  <option value="un">Unallocated only</option>
                </select>
                <button
                  onClick={aiAllocate}
                  style={{ fontFamily: "Poppins", fontSize: 12.5, fontWeight: 600, color: "var(--gold-dim)", background: "var(--gold-soft)", border: "1px solid var(--gold-bdr)", borderRadius: 9, padding: "7px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, marginLeft: "auto" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z" /><path d="M19 14l.7 1.8L21 16.5l-1.3.7L19 19l-.7-1.8L17 16.5l1.3-.7z" /></svg>
                  Auto-allocate
                </button>
              </div>
              <div style={{ padding: 9, overflowY: "auto", flex: 1, maxHeight: 460 }}>
                {shown.length === 0 ? (
                  <div style={{ padding: "26px 16px", textAlign: "center", color: "var(--muted-2)", fontSize: 13 }}>
                    No active members rostered for this shift{groupFilter !== "all" ? " in that group" : ""}.
                  </div>
                ) : shown.map(({ m, i }) => {
                  const allocated = isAlloc(i);
                  const p = stPillFor(m, allocated);
                  const init = m.n.split(" ").map((w) => w[0]).join("").slice(0, 2);
                  const tname = allocated ? (currentPlan.trips.find((t) => t.id === currentPlan.alloc[i])?.name.replace("Route ", "R") ?? "") : "";
                  return (
                    <div
                      key={i}
                      onClick={() => handleMemberClick(i)}
                      className={`mrow${allocated ? " assigned" : ""}`}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center", fontWeight: 600, fontSize: 12, color: "#fff", background: "var(--ink)" }}>{init}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.15, color: "var(--ink)" }}>{m.n}</div>
                        <div style={{ color: "var(--muted)", fontSize: 11.5 }}>{m.a} · Route {m.g}{allocated ? ` · ${tname}` : ""}</div>
                      </div>
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 8, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5, color: pillColor(p.c).color, background: pillColor(p.c).bg }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" dangerouslySetInnerHTML={{ __html: p.ic }} />
                          {p.t}
                        </span>
                        {allocated && (
                          <button
                            title="Unallocate"
                            onClick={(e) => { e.stopPropagation(); removeFromTrip(i); }}
                            className="rm"
                          >×</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trips pane */}
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r)", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderBottom: "1px solid var(--line-soft)" }}>
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 20, color: "var(--ink)" }}>Trips for this shift</div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>Tap a trip to view &amp; allocate</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted-2)", padding: "8px 14px 0" }}>A route can run several trips · capacity excludes the driver&apos;s seat</div>
              <div style={{ padding: 9, overflowY: "auto", flex: 1, maxHeight: 460 }}>
                {!currentPlan.trips.length && (
                  <div style={{ padding: "22px 14px", textAlign: "center", color: "var(--muted-2)", fontSize: 13, lineHeight: 1.5 }}>
                    No trips planned for {dayLabel(day)} · {shift}.<br />
                    Add a trip, assign a driver &amp; vehicle, then allocate the people on the left.
                  </div>
                )}
                {currentPlan.trips.map((t) => {
                  const mem = tripMembers(t.id);
                  const tEta = computeEta2(t, mem, shift);
                  const over = mem.length > cap(t);
                  const sm2 = STMAP[tEta.status];
                  const etaColor = { safe: "var(--safe)", tight: "var(--tight)", late: "var(--late)", none: "var(--muted)" }[tEta.status];
                  const tgt = fmt(targetMin(shift));
                  return (
                    <div
                      key={t.id}
                      onClick={() => setActiveTrip(t.id)}
                      className={`trip-card${t.id === activeTrip ? " active" : ""}`}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 19, color: "#fff", flexShrink: 0, background: groups[t.group].color }}>{t.group}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 18, color: "var(--ink)", lineHeight: 1, display: "inline-flex", alignItems: "center", gap: 7 }}>
                            {t.name}
                            <svg
                              className="edit-icon"
                              style={{ width: 13, height: 13 }}
                              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                              onClick={(e) => { e.stopPropagation(); rename(t.id); }}
                            ><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                          </div>
                          <div style={{ color: "var(--muted)", fontSize: 11.5, marginTop: 3 }}>{t.driver ?? "— assign driver"} · {t.vehicle ?? "— assign vehicle"}</div>
                        </div>
                        <div style={{ marginLeft: "auto", textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500 }}>
                            <b style={{ color: over ? "var(--late)" : "var(--ink)", fontWeight: 700, fontSize: 16 }}>{mem.length}</b>/{cap(t)}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--muted-2)" }}>staff seats</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 14px 11px" }}>
                        {mem.length ? mem.map((o) => (
                          <span key={o.i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--bg2)", border: "1px solid var(--line-soft)", borderRadius: 999, padding: "4px 6px 4px 11px", fontSize: 11.5, fontWeight: 500, color: "var(--ink)" }}>
                            {o.m.n}
                            <button
                              style={{ border: 0, background: "none", color: "var(--muted-2)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 2px" }}
                              onClick={(e) => { e.stopPropagation(); removeFromTrip(o.i); }}
                            >×</button>
                          </span>
                        )) : <span style={{ fontSize: 11.5, color: "var(--muted-2)", fontStyle: "italic" }}>No members yet — select this trip, then tap people on the left</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", borderTop: "1px solid var(--line-soft)", background: "var(--bg2)" }}>
                        <span style={{ fontSize: 11, color: "var(--muted-2)", fontWeight: 500 }}>Target</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{tgt}</span>
                        <span style={{ marginLeft: "auto" }} />
                        <span style={{ fontSize: 11, color: "var(--muted-2)", fontWeight: 500 }}>ETA</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: etaColor }}>{tEta.txt}</span>
                        &nbsp;
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 11, padding: "3px 9px", borderRadius: 999, color: statusChipStyle(tEta.status).color, background: statusChipStyle(tEta.status).bg }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" dangerouslySetInnerHTML={{ __html: sm2[1] }} />
                          {sm2[2]}
                        </span>
                      </div>
                      {/* Warnings */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: (!t.driver || !t.vehicle || over || (tEta.status === "tight" && !over)) ? "0 14px 12px" : 0 }}>
                        {!t.driver && <WarnRow color="late">No driver assigned</WarnRow>}
                        {!t.vehicle && <WarnRow color="late">No vehicle assigned</WarnRow>}
                        {over && <WarnRow color="late">Over capacity — {mem.length} in {cap(t)} seats</WarnRow>}
                        {tEta.status === "tight" && !over && tEta.min !== undefined && tEta.tgt !== undefined && (
                          <WarnRow color="amber">Tight — only {tEta.tgt - tEta.min} min to spare</WarnRow>
                        )}
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={addTrip}
                  className="addtrip-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                  Add a trip to this shift
                </button>
              </div>
            </div>
          </div>

          {/* Board footer */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => toast("Draft saved")} className="board-btn" style={btnStyle()}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v5h6V4M8 20v-6h8v6" /></svg>
              Save draft
            </button>
            <button onClick={() => toast("Members notified via WhatsApp")} className="board-btn" style={btnStyle()}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16v12H7l-3 3z" /></svg>
              Notify members
            </button>
            <button onClick={tryPublish} className="board-btn-primary" style={btnStyle(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12l4 4L19 6" /></svg>
              Publish trips to drivers
            </button>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted-2)", display: "flex", alignItems: "center", gap: 7 }}>
              {currentPlan.trips.length ? (
                blockedTrips ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--late)" strokeWidth="2"><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17h.01" /></svg>
                    {blockedTrips} trip{blockedTrips > 1 ? "s" : ""} blocked — fix warnings to publish
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--safe)" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>
                    All trips ready to publish
                  </>
                )
              ) : null}
            </span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(12,13,15,.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80, padding: 20 }}
          onClick={() => setModal(null)}
        >
          <div style={{ background: "var(--card)", borderRadius: 18, padding: 22, width: 340, maxWidth: "100%", boxShadow: "var(--shadow-lg)" }} onClick={(e) => e.stopPropagation()}>
            <h4 style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 600, fontSize: 22, margin: "0 0 14px", color: "var(--ink)" }}>{modal.title}</h4>
            <input
              autoFocus
              type="text"
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { modal.onSave(modalInput); setModal(null); } if (e.key === "Escape") setModal(null); }}
              className="modal-input"
              style={{ width: "100%", fontFamily: "Poppins", fontSize: 14, padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 11, color: "var(--ink)" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} style={btnStyle()}>Cancel</button>
              <button onClick={() => { modal.onSave(modalInput); setModal(null); }} style={btnStyle(true)}>Save</button>
            </div>
          </div>
        </div>
      )}

      {msg && <Toast key={toastKey} message={msg} onHide={hide} />}
    </div>
  );
}

function btnStyle(primary = false): React.CSSProperties {
  return {
    fontFamily: "Poppins",
    fontWeight: 600,
    fontSize: 13.5,
    borderRadius: 12,
    padding: "11px 19px",
    cursor: "pointer",
    border: primary ? 0 : "1px solid var(--line)",
    background: primary ? "var(--black)" : "var(--card)",
    color: primary ? "#fff" : "var(--ink)",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "var(--shadow)",
  };
}

function pillColor(c: string): { color: string; bg: string } {
  switch (c) {
    case "p-alloc":    return { color: "var(--safe)", bg: "var(--safe-soft)" };
    case "p-unalloc":  return { color: "var(--tight)", bg: "var(--tight-soft)" };
    case "p-nopin":    return { color: "var(--info)", bg: "var(--info-soft)" };
    case "p-review":   return { color: "#7a4fb0", bg: "rgba(122,79,176,.13)" };
    case "p-inactive": return { color: "var(--late)", bg: "var(--late-soft)" };
    default: return { color: "var(--muted)", bg: "var(--bg3)" };
  }
}

function statusChipStyle(status: string): { color: string; bg: string } {
  switch (status) {
    case "safe":  return { color: "var(--safe)", bg: "var(--safe-soft)" };
    case "tight": return { color: "var(--tight)", bg: "var(--tight-soft)" };
    case "late":  return { color: "var(--late)", bg: "var(--late-soft)" };
    default:      return { color: "var(--muted)", bg: "var(--bg3)" };
  }
}

function StatusChip({ status }: { status: string }) {
  const sm = STMAP[status] ?? STMAP["none"];
  const { color, bg } = statusChipStyle(status);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 12, padding: "5px 12px", borderRadius: 999, color, background: bg }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" dangerouslySetInnerHTML={{ __html: sm[1] }} />
      {sm[2]}
    </span>
  );
}

function WarnRow({ children, color }: { children: React.ReactNode; color: "late" | "amber" }) {
  const isAmber = color === "amber";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: isAmber ? "var(--tight)" : "var(--late)", background: isAmber ? "var(--tight-soft)" : "var(--late-soft)", padding: "7px 10px", borderRadius: 9, fontWeight: 500 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
        {isAmber ? <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> : <><path d="M12 3l9 16H3z" /><path d="M12 10v4" /></>}
      </svg>
      {children}
    </div>
  );
}

// Rail nav icons
function RailItem({ icon, label, active, badge }: { icon: React.ReactNode; label: string; active?: boolean; badge?: string }) {
  return (
    <a className={`rail-item${active ? " on" : ""}`}>
      <span style={{ width: 16, height: 16, flexShrink: 0, display: "flex" }}>{icon}</span>
      {label}
      {badge && <span className="badge">{badge}</span>}
    </a>
  );
}

// SVG icons for rail
const GridIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
const HomeIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M3 21V8l9-5 9 5v13M9 21v-6h6v6" /></svg>;
const MembersIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 6.5a3 3 0 0 1 0 5M18 20a5 5 0 0 0-3-4.6" /></svg>;
const MapPinIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>;
const CalIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>;
const ListIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M4 17l5-5-5-5M11 19h9M11 12h9M11 5h9" /></svg>;
const ClockIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
const DriverIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="8" r="3.2" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>;
const VehicleIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M5 16l1.5-5A2 2 0 0 1 8.4 9.6h7.2A2 2 0 0 1 17.5 11L19 16M5 16h14M5 16v3h2m12-3v3h-2" /></svg>;
const ReportsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M7 3h10l3 4v14H4V7z" /><path d="M8 12h8M8 16h8M8 8h3" /></svg>;
const IssuesIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17h.01" /></svg>;
