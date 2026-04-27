"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChartBar, SignOut } from "@phosphor-icons/react";

interface Props {
  role: "professor" | "ies";
}

export default function Navbar({ role }: Props) {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("role");
    router.push("/");
  }

  return (
    <nav
      className="bg-white border-b"
      style={{ borderColor: "var(--border-default)", height: 64 }}
    >
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href={`/dashboard/${role}`} className="flex items-center gap-2">
          <ChartBar size={22} weight="bold" style={{ color: "var(--primary)" }} />
          <span className="font-bold text-fog-900" style={{ fontSize: 16 }}>EvasãoZero</span>
        </Link>

        <div
          className="h-5 w-px"
          style={{ background: "var(--fog-200)" }}
        />

        <span className="z-badge z-badge--primary">
          {role === "professor" ? "Professor" : "Gestão IES"}
        </span>
      </div>

      <button
        onClick={logout}
        className="z-btn z-btn--ghost z-btn--sm flex items-center gap-2"
        style={{ color: "var(--fg-muted)" }}
      >
        <SignOut size={16} weight="bold" />
        Sair
      </button>
      </div>
    </nav>
  );
}
