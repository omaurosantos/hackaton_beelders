"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import Navbar from "@/components/Navbar";
import RiskBadge from "@/components/RiskBadge";
import { fetchStudent } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import { UserCircle } from "@phosphor-icons/react";

interface Factor {
  feature: string;
  impact: "positivo" | "negativo";
  value: number;
  contribution: number;
}

interface StudentDetail {
  id: number;
  name: string;
  email: string;
  course: string;
  period: string;
  age_at_enrollment: number;
  risk_score: number;
  risk_level: string;
  factors: Factor[];
  debtor: number;
  tuition_fees_up_to_date: number;
  scholarship_holder: number;
  curricular_units_1st_sem_approved: number;
  curricular_units_1st_sem_grade: number;
  curricular_units_2nd_sem_approved: number;
  curricular_units_2nd_sem_grade: number;
}

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.65 ? "#ef4444" : score >= 0.35 ? "#f59e0b" : "#22c55e";
  const data = [{ name: "score", value: pct, fill: color }];

  return (
    <div className="relative flex items-center justify-center" style={{ height: 160 }}>
      <ResponsiveContainer width={160} height={160}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={70}
          startAngle={210}
          endAngle={-30}
          data={data}
        >
          <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "#f3f4f6" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {pct}%
        </span>
        <span className="text-xs text-gray-400">score</span>
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [role, setRole] = useState<string>("professor");

  useEffect(() => {
    const r = typeof window !== "undefined" ? localStorage.getItem("role") ?? "professor" : "professor";
    setRole(r);
    if (!params.id) return;
    fetchStudent(Number(params.id)).then(setStudent).catch(console.error);
  }, [params.id]);

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fog-50">
        <div className="w-10 h-10 rounded-full border-2 border-fog-200 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fog-50">
      <Navbar role={role as "professor" | "ies"} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="z-btn z-btn--ghost z-btn--sm flex items-center gap-1.5 mb-6 pl-0"
          style={{ color: "var(--fg-muted)" }}
        >
          <ArrowLeft size={15} />
          Voltar
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: student info + gauge */}
          <div className="z-card flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "var(--primary-lightest)" }}>
              <UserCircle size={36} weight="bold" style={{ color: "var(--primary)" }} />
            </div>
            <div className="text-center">
              <h2 className="font-bold text-fog-900" style={{ fontSize: 18 }}>{student.name}</h2>
              <p className="text-sm text-fog-500 mt-0.5">{student.email}</p>
              <p className="text-xs text-fog-400 mt-1">{student.course} · {student.period}</p>
            </div>

            <ScoreGauge score={student.risk_score} />

            <div className="text-center">
              <p className="text-xs text-fog-500 mb-1.5">Nível de risco</p>
              <RiskBadge level={student.risk_level} />
            </div>

            <div className="w-full grid grid-cols-2 gap-2 text-xs pt-2"
              style={{ borderTop: "1px solid var(--fog-100)" }}>
              {[
                { label: "Idade na matrícula", value: `${student.age_at_enrollment} anos`, neutral: true },
                { label: "Devedor", value: student.debtor ? "Sim" : "Não", danger: !!student.debtor },
                { label: "Mensalidade em dia", value: student.tuition_fees_up_to_date ? "Sim" : "Não", danger: !student.tuition_fees_up_to_date },
                { label: "Bolsista", value: student.scholarship_holder ? "Sim" : "Não", neutral: true },
              ].map(({ label, value, danger, neutral }) => (
                <div key={label} className="rounded-lg p-2.5 text-center"
                  style={{ background: danger ? "#fccfd222" : neutral ? "var(--fog-50)" : "#9deeb222" }}>
                  <p className="font-semibold"
                    style={{ color: danger ? "var(--attention-danger)" : neutral ? "var(--fog-900)" : "var(--attention-success)" }}>
                    {value}
                  </p>
                  <p className="text-fog-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: academic performance + factors */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Academic performance */}
            <div className="z-card">
              <h3 className="font-semibold text-fog-900 mb-4">Desempenho Acadêmico</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Disciplinas aprovadas (1º sem)", value: student.curricular_units_1st_sem_approved },
                  { label: "Nota média (1º sem)", value: student.curricular_units_1st_sem_grade },
                  { label: "Disciplinas aprovadas (2º sem)", value: student.curricular_units_2nd_sem_approved },
                  { label: "Nota média (2º sem)", value: student.curricular_units_2nd_sem_grade },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg p-3"
                    style={{ background: "var(--fog-50)" }}>
                    <p className="text-xs text-fog-500">{item.label}</p>
                    <p className="text-2xl font-bold text-fog-900 mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation factors */}
            <div className="z-card">
              <h3 className="font-semibold text-fog-900 mb-0.5">Fatores de Risco Explicativos</h3>
              <p className="text-xs text-fog-400 mb-4">
                Variáveis que mais contribuíram para o score de evasão
              </p>
              <div className="space-y-4">
                {student.factors.map((f, i) => {
                  const abs = Math.abs(f.contribution);
                  const max = Math.abs(student.factors[0].contribution);
                  const pct = Math.round((abs / max) * 100);
                  const isRisk = f.impact === "positivo";
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-fog-800">{f.feature}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-fog-400">val. {f.value}</span>
                          <span className={isRisk ? "z-badge z-badge--danger" : "z-badge z-badge--success"}>
                            {isRisk ? "↑ risco" : "↓ risco"}
                          </span>
                        </div>
                      </div>
                      <div className="w-full rounded-full h-2" style={{ background: "var(--fog-100)" }}>
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: isRisk ? "var(--attention-danger)" : "var(--attention-success)",
                            transition: "width 300ms ease-out",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Intervention suggestions */}
            <div className="rounded-lg p-5"
              style={{ background: "var(--primary-lightest)", borderLeft: "4px solid var(--primary)" }}>
              <h3 className="font-semibold mb-3" style={{ color: "var(--primary-dark)" }}>
                Sugestões de Intervenção
              </h3>
              <ul className="space-y-2 text-sm" style={{ color: "var(--primary-dark)" }}>
                {student.debtor === 1 && (
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">•</span>
                    Verificar pendências financeiras e orientar sobre programas de apoio.
                  </li>
                )}
                {student.tuition_fees_up_to_date === 0 && (
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">•</span>
                    Mensalidade em atraso — contato urgente com setor financeiro.
                  </li>
                )}
                {student.curricular_units_2nd_sem_grade < 10 && (
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">•</span>
                    Nota abaixo da média — indicar tutoria ou monitoria.
                  </li>
                )}
                {student.scholarship_holder === 0 && student.risk_level === "alto" && (
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">•</span>
                    Verificar elegibilidade para bolsas ou financiamento estudantil.
                  </li>
                )}
                {student.risk_level === "alto" && (
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">•</span>
                    Agendar reunião de acompanhamento individual com o aluno.
                  </li>
                )}
                {student.risk_level !== "alto" && (
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">•</span>
                    Manter acompanhamento periódico preventivo.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
