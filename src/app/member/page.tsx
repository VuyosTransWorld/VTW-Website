import MemberApp from "@/components/MemberApp";

export default function MemberPage() {
  return (
    <div style={{ minHeight: "100vh", padding: "30px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ marginBottom: 24, fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted-2)", fontWeight: 600 }}>
        Member App
      </div>
      <MemberApp />
    </div>
  );
}
