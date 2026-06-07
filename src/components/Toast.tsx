"use client";
import { useEffect, useState, useCallback } from "react";

interface ToastProps {
  message: string;
  onHide: () => void;
}

export default function Toast({ message, onHide }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onHide, 300);
    }, 2400);
    return () => clearTimeout(t);
  }, [message, onHide]);

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 26,
        transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
        background: "var(--black)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,.08)",
        padding: "13px 18px",
        borderRadius: 13,
        fontSize: 13.5,
        fontWeight: 500,
        boxShadow: "var(--shadow-lg)",
        opacity: visible ? 1 : 0,
        transition: "0.3s var(--d)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: 10,
        pointerEvents: "none",
        maxWidth: "88vw",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.4">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState("");
  const [key, setKey] = useState(0);

  const toast = useCallback((message: string) => {
    setMsg(message);
    setKey((k) => k + 1);
  }, []);

  const hide = useCallback(() => setMsg(""), []);

  return { msg, key, toast, hide };
}
