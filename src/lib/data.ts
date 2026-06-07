export const groups: Record<string, { label: string; color: string }> = {
  A: { label: "Site C / Harare / Ilitha", color: "#C9A84C" },
  B: { label: "Kuyasa / Makhaza / Mandela", color: "#0C0D0F" },
  C: { label: "Delft / Belhar", color: "#5A6472" },
};

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface Member {
  n: string;
  a: string;
  g: string;
  x?: number;
  y?: number;
  note?: string;
  st: "ok" | "nopin" | "review" | "inactive";
  shifts: string[];
  off: number[];
}

export const members: Member[] = [
  { n: "T. Nomvete",  a: "Site C",         g: "A", x: 158, y: 92,  note: "Yellow gate next to the spaza", st: "ok",       shifts: ["08:00", "15:00"], off: [] },
  { n: "L. Khumalo",  a: "Harare",          g: "A", x: 255, y: 124, note: "Blue gate, 2nd from corner",    st: "ok",       shifts: ["08:00"],           off: [] },
  { n: "P. Adams",    a: "Harare ext 4",    g: "A", x: 330, y: 96,  note: "Wait at the shop",              st: "ok",       shifts: ["08:00"],           off: [9] },
  { n: "N. Mthembu",  a: "Site C",          g: "A", x: 190, y: 150, note: "By the clinic taxi stop",       st: "ok",       shifts: ["08:00"],           off: [] },
  { n: "Z. Sithole",  a: "Ilitha Park",     g: "A", x: 545, y: 120, note: "Green roof corner house",       st: "ok",       shifts: ["08:00"],           off: [9] },
  { n: "B. Daniels",  a: "Town Two",        g: "A", x: 640, y: 178, note: "Garage forecourt",              st: "ok",       shifts: ["08:00", "15:00"], off: [] },
  { n: "M. Jacobs",   a: "Kuyasa",          g: "B", x: 120, y: 188, st: "ok",       shifts: ["08:00", "15:00"], off: [] },
  { n: "S. Petersen", a: "Makhaza",         g: "B", x: 240, y: 218, st: "ok",       shifts: ["08:00", "15:00"], off: [10] },
  { n: "A. Booi",     a: "Makhaza",         g: "B", x: 330, y: 200, st: "ok",       shifts: ["08:00"],           off: [] },
  { n: "K. Mokoena",  a: "Mandela Park",    g: "B", x: 600, y: 168, st: "ok",       shifts: ["08:00"],           off: [] },
  { n: "T. Mei",      a: "Kuyasa",          g: "B", x: 150, y: 212, st: "ok",       shifts: ["08:00"],           off: [] },
  { n: "N. Abrahams", a: "Makhaza",         g: "B", x: 290, y: 226, st: "ok",       shifts: ["08:00", "15:00"], off: [] },
  { n: "D. Williams", a: "Delft",           g: "C", x: 135, y: 124, st: "ok",       shifts: ["08:00"],           off: [] },
  { n: "R. Ndlovu",   a: "Belhar",          g: "C", x: 280, y: 96,  st: "ok",       shifts: ["08:00"],           off: [] },
  { n: "V. Gqola",    a: "Delft South",     g: "C",                  st: "nopin",   shifts: ["08:00"],           off: [] },
  { n: "F. Cele",     a: "Khayelitsha",     g: "B",                  st: "review",  shifts: ["08:00"],           off: [] },
  { n: "O. Maart",    a: "Mitchells Plain", g: "A",                  st: "inactive", shifts: ["08:00"],          off: [] },
];

export interface TripTemplate {
  group: string;
  name: string;
  driver: string | null;
  vehicle: string | null;
  seats: number;
  buffer: number;
}

export interface Trip extends TripTemplate {
  id: string;
}

export function tripTemplates(sh: string): TripTemplate[] {
  if (sh === "08:00") return [
    { group: "A", name: "Route A · Morning",   driver: "S. Mbeki",    vehicle: "Toyota Rumion", seats: 7, buffer: 24 },
    { group: "B", name: "Route B · Trip 1",    driver: "J. Petersen", vehicle: "VW Caddy",      seats: 6, buffer: 20 },
    { group: "B", name: "Route B · Trip 2",    driver: "T. Nkosi",    vehicle: "VW Caddy",      seats: 6, buffer: 16 },
    { group: "C", name: "Route C · Morning",   driver: null,          vehicle: null,            seats: 6, buffer: 18 },
  ];
  if (sh === "15:00") return [
    { group: "A", name: "Route A · Afternoon", driver: "S. Mbeki",    vehicle: "Toyota Rumion", seats: 7, buffer: 24 },
    { group: "B", name: "Route B · Afternoon", driver: "J. Petersen", vehicle: "VW Caddy",      seats: 6, buffer: 20 },
  ];
  return [];
}

export const DEST = { x: 740, y: 240, label: "Epping (site)" };

export const driverStops = [
  { n: "T. Nomvete", a: "Site C — Mew Way, yellow gate",      note: "Yellow gate next to the spaza. Call on arrival.", eta: "06:42", km: "1.2 km", pin: "4291" },
  { n: "L. Khumalo", a: "Harare — Sulani Drive",              note: "Blue gate, second house from corner.",            eta: "06:48", km: "2.1 km", pin: "7730" },
  { n: "P. Adams",   a: "Harare ext 4 — Pama Rd",            note: "Wait at the shop, not inside.",                  eta: "06:53", km: "1.4 km", pin: "1185" },
  { n: "N. Mthembu", a: "Site C — near clinic",               note: "By the clinic taxi stop.",                       eta: "06:58", km: "1.9 km", pin: "6402" },
  { n: "Z. Sithole", a: "Ilitha Park — Walter Sisulu",        note: "Green roof, corner house.",                      eta: "07:05", km: "3.0 km", pin: "3318" },
  { n: "B. Daniels", a: "Town Two — Lansdowne Rd",            note: "At the garage forecourt.",                       eta: "07:10", km: "2.4 km", pin: "9057" },
];

export const myTripsData = [
  { day: "Today · Mon 8 Jun",  client: "Coastal Foods", shift: "Morning · 08:00",   time: "06:42", status: "live" as const },
  { day: "Tue 9 Jun",          client: "Coastal Foods", shift: "Morning · 08:00",   time: "06:42", status: "scheduled" as const },
  { day: "Wed 10 Jun",         client: "Coastal Foods", shift: "Morning · 08:00",   time: "06:42", status: "scheduled" as const },
  { day: "Thu 11 Jun",         client: "Coastal Foods", shift: "Afternoon · 15:00", time: "13:35", status: "scheduled" as const },
  { day: "Fri 12 Jun",         client: "Coastal Foods", shift: "Morning · 08:00",   time: "06:42", status: "scheduled" as const },
];

export type TripStatus = "live" | "scheduled" | "cancelled";

export interface MyTrip {
  day: string;
  client: string;
  shift: string;
  time: string;
  status: TripStatus;
}

export const DAYS_LIST = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function dayLabel(d: number): string {
  // Start from Jun 2026: day 1 = Mon (weekday index 1)
  const base = new Date(2026, 5, 1); // Jun 1
  base.setDate(base.getDate() + d - 1);
  const dow = DAYS_LIST[base.getDay()];
  return `${dow} ${d} Jun`;
}

export function fmt(min: number): string {
  min = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(min / 60);
  const mm = min % 60;
  return String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
}

export function shiftMin(shift: string): number {
  const [h, m] = shift.split(":").map(Number);
  return h * 60 + m;
}

export function targetMin(shift: string): number {
  return (shiftMin(shift) - 30 + 1440) % 1440;
}

export function cap(t: Trip): number {
  return t.seats - 1;
}
