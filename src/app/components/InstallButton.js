"use client";

import { useEffect, useState } from "react";
import { FaDownload } from "react-icons/fa";

export default function InstallButton() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return <span>Installed ✓</span>;

  if (!promptEvent) {
    return <span>On iPhone: Share → Add to Home Screen</span>;
  }

  return (
    <button
      onClick={async () => {
        promptEvent.prompt();
        await promptEvent.userChoice;
        setPromptEvent(null);
      }}
      style={{
        background: "#69c9d0",
        color: "#06121a",
        border: "none",
        borderRadius: 10,
        padding: "8px 14px",
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <FaDownload /> Install app
    </button>
  );
}
