"use client";
import { Trip, Member, groups, DEST } from "@/lib/data";

interface MapSvgProps {
  activeTrip: Trip | null;
  tripMembers: Array<{ m: Member; i: number }>;
}

export default function MapSvg({ activeTrip, tripMembers }: MapSvgProps) {

  const destEl = (
    <g transform={`translate(${DEST.x},${DEST.y})`}>
      <circle r={15} fill="#0C0D0F" opacity={0.10} />
      <rect x={-9} y={-9} width={18} height={18} rx={4} fill="#0C0D0F" />
      <path d="M-4 0l3 3 5-6" stroke="#fff" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text y={30} textAnchor="middle" fontFamily="Poppins" fontSize={10} fontWeight={600} fill="#111315">{DEST.label}</text>
    </g>
  );

  if (!activeTrip) {
    return (
      <svg id="mapSvg" viewBox="0 0 820 322" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "100%" }}>
        <rect width="820" height="322" fill="#F5F5F2" />
        <g stroke="rgba(12,13,15,.045)" strokeWidth={1}>
          {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={322} />)}
          {Array.from({ length: 4 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * 80} x2={820} y2={i * 80} />)}
        </g>
        <path d="M-20 90 Q200 70 420 120 T860 130" stroke="rgba(12,13,15,.055)" strokeWidth={11} fill="none" />
        <path d="M-20 224 Q240 254 460 204 T860 224" stroke="rgba(12,13,15,.055)" strokeWidth={11} fill="none" />
        <path d="M180 -20 Q210 160 160 340" stroke="rgba(12,13,15,.055)" strokeWidth={9} fill="none" />
        <path d="M560 -20 Q600 160 640 340" stroke="rgba(12,13,15,.055)" strokeWidth={9} fill="none" />
        <ellipse cx={700} cy={60} rx={80} ry={42} fill="#E3E6E2" />
        <text x={700} y={64} textAnchor="middle" fontFamily="Poppins" fontSize={10} fill="#878C94">False Bay</text>
        {destEl}
      </svg>
    );
  }

  const col = groups[activeTrip.group].color;
  const mm = [...tripMembers].sort((a, b) => (a.m.x || 0) - (b.m.x || 0));
  const hasMembers = mm.length > 0;
  const blocked = !activeTrip.driver || !activeTrip.vehicle;

  let pathD = "";
  if (hasMembers) {
    const pts = [...mm.map((o) => [o.m.x || 0, o.m.y || 0]), [DEST.x, DEST.y]];
    pathD = pts.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
  }

  return (
    <svg id="mapSvg" viewBox="0 0 820 322" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "100%" }}>
      <rect width="820" height="322" fill="#F5F5F2" />
      <g stroke="rgba(12,13,15,.045)" strokeWidth={1}>
        {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={322} />)}
        {Array.from({ length: 4 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * 80} x2={820} y2={i * 80} />)}
      </g>
      <path d="M-20 90 Q200 70 420 120 T860 130" stroke="rgba(12,13,15,.055)" strokeWidth={11} fill="none" />
      <path d="M-20 224 Q240 254 460 204 T860 224" stroke="rgba(12,13,15,.055)" strokeWidth={11} fill="none" />
      <path d="M180 -20 Q210 160 160 340" stroke="rgba(12,13,15,.055)" strokeWidth={9} fill="none" />
      <path d="M560 -20 Q600 160 640 340" stroke="rgba(12,13,15,.055)" strokeWidth={9} fill="none" />
      <ellipse cx={700} cy={60} rx={80} ry={42} fill="#E3E6E2" />
      <text x={700} y={64} textAnchor="middle" fontFamily="Poppins" fontSize={10} fill="#878C94">False Bay</text>

      {hasMembers && pathD && (
        <path
          d={pathD}
          stroke={col}
          strokeWidth={blocked ? 2.5 : 3}
          fill="none"
          strokeDasharray={blocked ? "4 7" : undefined}
          strokeLinejoin="round"
          opacity={blocked ? 0.45 : 0.95}
        />
      )}

      {mm.map((o, i) => (
        <g key={o.i} transform={`translate(${o.m.x || 0},${o.m.y || 0})`}>
          <circle r={13} fill={col} opacity={0.15} />
          <circle r={9.5} fill="#FFFFFF" stroke={col} strokeWidth={2.4} />
          <text y={3.5} textAnchor="middle" fontFamily="Poppins" fontSize={9.5} fontWeight={700} fill={col}>{i + 1}</text>
          <text y={-15} textAnchor="middle" fontFamily="Poppins" fontSize={9.5} fontWeight={500} fill="#54585F">{o.m.a}</text>
        </g>
      ))}

      {destEl}
    </svg>
  );
}
