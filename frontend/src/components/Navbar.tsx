"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChartBar, SignOut } from "@phosphor-icons/react";
import { removeStoredRole } from "@/lib/storage";

interface Props {
  role: "professor" | "ies";
}

export default function Navbar({ role }: Props) {
  const router = useRouter();

  function logout() {
    removeStoredRole();
    router.push("/");
  }

  return (
    <nav
      className="bg-white border-b"
      style={{ borderColor: "var(--border-default)", height: 56 }}
    >
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/${role}`} className="flex items-center gap-2">
            <ChartBar size={20} weight="bold" style={{ color: "var(--primary)" }} />
            <span className="font-bold text-fog-900 text-sm sm:text-base">EvasãoZero</span>
          </Link>

          <div className="h-4 w-px hidden sm:block" style={{ background: "var(--fog-200)" }} />

          <span className="z-badge z-badge--primary hidden sm:inline-flex">
            {role === "professor" ? "Professor" : "Gestão IES"}
          </span>
        </div>

        <button
          onClick={logout}
          className="z-btn z-btn--ghost z-btn--sm flex items-center gap-1.5"
          style={{ color: "var(--fg-muted)" }}
        >
          <SignOut size={15} weight="bold" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </nav>
  );
}
