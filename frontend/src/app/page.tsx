"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChalkboardTeacher, Buildings, ArrowRight, ChartBar } from "@phosphor-icons/react";
import { setStoredRole } from "@/lib/storage";

const PROFILES = [
  {
    id: "professor" as const,
    label: "Professor",
    description: "Acompanhe sua turma e identifique alunos em risco com antecedência.",
    icon: ChalkboardTeacher,
  },
  {
    id: "ies" as const,
    label: "Gestão IES",
    description: "Visão institucional agregada por curso, período e tendência.",
    icon: Buildings,
  },
];

export default function LoginPage() {
  const [role, setRole] = useState<"professor" | "ies" | null>(null);
  const router = useRouter();

  function handleLogin() {
    if (!role) return;
    setStoredRole(role);
    router.push(`/dashboard/${role}`);
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — hidden on mobile */}
      <div
        className="hidden lg:flex flex-col justify-between w-[440px] shrink-0 p-12"
        style={{ background: "var(--primary)" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-14">
            <ChartBar size={26} weight="bold" color="white" />
            <span className="text-white font-bold text-lg">EvasãoZero</span>
          </div>
          <h1 className="text-white font-bold leading-tight mb-4 text-4xl">
            Identifique riscos<br />antes que virem<br />evasão.
          </h1>
          <p className="text-white/70 text-sm leading-relaxed">
            Plataforma de predição de evasão acadêmica com IA para professores
            e instituições agirem no momento certo.
          </p>
        </div>
        <div className="space-y-3">
          {[
            { n: "4.424", label: "alunos analisados no modelo" },
            { n: "3 níveis", label: "de risco — baixo, médio e alto" },
            { n: "5 fatores", label: "explicativos por aluno" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,.15)", color: "white" }}>
                {item.n}
              </span>
              <span className="text-white/70 text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 lg:p-14"
        style={{ background: "var(--fog-50)" }}>
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--primary)" }}>
            <ChartBar size={18} weight="bold" color="white" />
          </div>
          <span className="font-bold text-fog-900 text-lg">EvasãoZero</span>
        </div>

        <div className="w-full max-w-sm sm:max-w-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-fog-900 mb-1">
              Bem-vindo de volta
            </h2>
            <p className="text-fog-600 text-sm">Selecione seu perfil de acesso para continuar.</p>
          </div>

          <div className="space-y-3 mb-6">
            {PROFILES.map(({ id, label, description, icon: Icon }) => {
              const selected = role === id;
              return (
                <button
                  key={id}
                  onClick={() => setRole(id)}
                  className="w-full text-left rounded-xl border-2 p-4 transition-all outline-none"
                  style={{
                    borderColor: selected ? "var(--primary)" : "var(--fog-200)",
                    background: selected ? "var(--primary-lightest)" : "white",
                    boxShadow: selected ? "none" : "var(--shadow-sm)",
                    transition: "var(--transition)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: selected ? "var(--primary-light)" : "var(--fog-100)" }}>
                      <Icon size={18} weight="bold"
                        style={{ color: selected ? "var(--primary)" : "var(--fog-600)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm"
                          style={{ color: selected ? "var(--primary)" : "var(--fog-900)" }}>
                          {label}
                        </span>
                        {selected && <span className="z-badge z-badge--primary">Selecionado</span>}
                      </div>
                      <p className="text-fog-600 text-xs mt-0.5 leading-relaxed">{description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button onClick={handleLogin} disabled={!role}
            className="z-btn z-btn--primary z-btn--block z-btn--lg gap-2">
            <ArrowRight size={17} weight="bold" />
            Acessar dashboard
          </button>

          <p className="text-center text-fog-400 mt-5 text-xs">
            Protótipo demonstrativo — sem autenticação real
          </p>
        </div>
      </div>
    </div>
  );
}
