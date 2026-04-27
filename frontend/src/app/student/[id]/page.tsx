"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import RiskBadge from "@/components/RiskBadge";
import { fetchStudent } from "@/lib/api";
import { getStoredRole } from "@/lib/storage";
import { ArrowLeft } from "lucide-react";
import { UserCircle, Info } from "@phosphor-icons/react";

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
  curricular_units_1st_sem_enrolled: number;
  curricular_units_1st_sem_approved: number;
  curricular_units_1st_sem_grade: number;
  curricular_units_2nd_sem_enrolled: number;
  curricular_units_2nd_sem_approved: number;
  curricular_units_2nd_sem_grade: number;
}

const GRADE_MAX = 10;
const GRADE_ATTENTION_THRESHOLD = 5;

function formatNumber(value: number, maximumFractionDigits = 1) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits });
}

function approvalRate(approved: number, enrolled: number) {
  if (!enrolled) return 0;
  return Math.round((approved / enrolled) * 100);
}

const SCORE_TOOLTIP =
  "Probabilidade estimada de evasão ao longo do curso, calculada por IA com base no desempenho acadêmico e situação financeira. Não indica um semestre específico — reflete o risco acumulado atual e sinaliza urgência de intervenção.";

function ScoreGauge({ score }: { score: number }) {
  const [showTip, setShowTip] = useState(false);
  const pct = Math.round(score * 100);
  const color = score >= 0.65 ? "#ef4444" : score >= 0.35 ? "#f59e0b" : "#22c55e";

  const SIZE = 160;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 58;
  const SW = 14;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const pt = (deg: number) => ({
    x: cx + R * Math.cos(toRad(deg)),
    y: cy - R * Math.sin(toRad(deg)),
  });

  const START_DEG = 210;
  const SPAN_DEG = 240;
  const endDeg = START_DEG - (pct / 100) * SPAN_DEG;

  const arcPath = (fromDeg: number, toDeg: number) => {
    const span = Math.abs(fromDeg - toDeg);
    if (span < 0.5) return "";
    const from = pt(fromDeg);
    const to = pt(toDeg);
    return `M ${from.x} ${from.y} A ${R} ${R} 0 ${span > 180 ? 1 : 0} 1 ${to.x} ${to.y}`;
  };

  // Arc endpoints sit at y ≈ cy + R*sin(30°) = 80+29 = 109; clip below that
  const CLIP_H = 112;

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="relative" style={{ width: SIZE, height: CLIP_H, overflow: "hidden" }}>
        <svg width={SIZE} height={SIZE}>
          <path d={arcPath(START_DEG, START_DEG - SPAN_DEG)} fill="none" stroke="#f3f4f6" strokeWidth={SW} strokeLinecap="round" />
          {pct > 0 && (
            <path d={arcPath(START_DEG, endDeg)} fill="none" stroke={color} strokeWidth={SW} strokeLinecap="round" />
          )}
        </svg>
        {/* % centered in the arc's visual area (top ≈22, bottom ≈109 → mid ≈65) */}
        <div className="absolute inset-x-0 flex justify-center" style={{ top: 52 }}>
          <span className="text-3xl font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400">score de evasão</span>
        <button
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          onFocus={() => setShowTip(true)}
          onBlur={() => setShowTip(false)}
          className="text-gray-400 hover:text-gray-600 outline-none"
          aria-label="O que é o score?"
        >
          <Info size={13} weight="bold" />
        </button>
      </div>

      {showTip && (
        <div
          className="absolute z-10 rounded-lg p-3 text-xs leading-relaxed shadow-lg"
          style={{
            top: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 260,
            background: "var(--fog-900)",
            color: "white",
          }}
        >
          <div
            className="absolute"
            style={{
              top: -5,
              left: "50%",
              transform: "translateX(-50%)",
              width: 10,
              height: 10,
              background: "var(--fog-900)",
              clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            }}
          />
          {SCORE_TOOLTIP}
        </div>
      )}
    </div>
  );
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [role, setRole] = useState<string>("professor");

  useEffect(() => {
    setRole(getStoredRole() ?? "professor");
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

  const semesters = [
    {
      label: "1º semestre",
      enrolled: student.curricular_units_1st_sem_enrolled,
      approved: student.curricular_units_1st_sem_approved,
      grade: student.curricular_units_1st_sem_grade / 2,
    },
    {
      label: "2º semestre",
      enrolled: student.curricular_units_2nd_sem_enrolled,
      approved: student.curricular_units_2nd_sem_approved,
      grade: student.curricular_units_2nd_sem_grade / 2,
    },
  ];
  const totalEnrolled = semesters.reduce((sum, semester) => sum + semester.enrolled, 0);
  const totalApproved = semesters.reduce((sum, semester) => sum + semester.approved, 0);
  const averageGrade = semesters.reduce((sum, semester) => sum + semester.grade, 0) / semesters.length;

  return (
    <div className="min-h-screen bg-fog-50">
      <Navbar role={role as "professor" | "ies"} />

      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-8">
        <button
          onClick={() => router.back()}
          className="z-btn z-btn--ghost z-btn--sm flex items-center gap-1.5 mb-5 pl-0"
          style={{ color: "var(--fg-muted)" }}
        >
          <ArrowLeft size={15} />
          Voltar
        </button>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
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

            <div className="relative w-full flex justify-center">
              <ScoreGauge score={student.risk_score} />
            </div>

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
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-semibold text-fog-900">Desempenho Acadêmico</h3>
                  <p className="text-xs text-fog-400 mt-1">
                    Notas na escala 0 a {GRADE_MAX}; ponto de atenção abaixo de {GRADE_ATTENTION_THRESHOLD}/{GRADE_MAX}.
                  </p>
                </div>
                <span className="z-badge z-badge--neutral self-start">
                  Média geral {formatNumber(averageGrade)}/{GRADE_MAX}
                </span>
              </div>

              <div className="grid sm:grid-cols-3 rounded-lg overflow-hidden mb-4"
                style={{ border: "1px solid var(--fog-100)" }}>
                <div className="p-3 border-b sm:border-b-0" style={{ borderColor: "var(--fog-100)" }}>
                  <p className="text-xs text-fog-500">Disciplinas matriculadas</p>
                  <p className="text-2xl font-bold text-fog-900 mt-1">{totalEnrolled}</p>
                </div>
                <div className="p-3 border-b sm:border-b-0 sm:border-l" style={{ borderColor: "var(--fog-100)" }}>
                  <p className="text-xs text-fog-500">Disciplinas aprovadas</p>
                  <p className="text-2xl font-bold text-fog-900 mt-1">
                    {totalApproved} de {totalEnrolled}
                  </p>
                </div>
                <div className="p-3 sm:border-l" style={{ borderColor: "var(--fog-100)" }}>
                  <p className="text-xs text-fog-500">Taxa de aprovação</p>
                  <p className="text-2xl font-bold text-fog-900 mt-1">
                    {approvalRate(totalApproved, totalEnrolled)}%
                  </p>
                </div>
              </div>

              {/* Mobile: card per semester */}
              <div className="sm:hidden space-y-3">
                {semesters.map((semester) => {
                  const rate = approvalRate(semester.approved, semester.enrolled);
                  const gradeNeedsAttention = semester.grade < GRADE_ATTENTION_THRESHOLD;
                  return (
                    <div key={semester.label} className="rounded-lg p-3"
                      style={{ border: "1px solid var(--fog-100)" }}>
                      <p className="font-semibold text-fog-900 text-sm mb-2">{semester.label}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-fog-400">Matriculadas</p>
                          <p className="font-semibold text-fog-900 mt-0.5">{semester.enrolled}</p>
                        </div>
                        <div>
                          <p className="text-fog-400">Aprovadas</p>
                          <p className="font-semibold text-fog-900 mt-0.5">{semester.approved} de {semester.enrolled}</p>
                        </div>
                        <div>
                          <p className="text-fog-400">Aprovação</p>
                          <p className="font-semibold text-fog-900 mt-0.5">{rate}%</p>
                        </div>
                        <div>
                          <p className="text-fog-400">Nota média</p>
                          <div className="mt-0.5">
                            <span className={gradeNeedsAttention ? "z-badge z-badge--warning" : "z-badge z-badge--success"}>
                              {formatNumber(semester.grade)}/{GRADE_MAX}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs font-semibold text-fog-500 uppercase tracking-wide"
                      style={{ background: "var(--fog-50)" }}>
                      <th className="px-3 py-2.5 text-left">Semestre</th>
                      <th className="px-3 py-2.5 text-center">Matriculadas</th>
                      <th className="px-3 py-2.5 text-center">Aprovadas</th>
                      <th className="px-3 py-2.5 text-center">Aprovação</th>
                      <th className="px-3 py-2.5 text-center">Nota média</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semesters.map((semester) => {
                      const rate = approvalRate(semester.approved, semester.enrolled);
                      const gradeNeedsAttention = semester.grade < GRADE_ATTENTION_THRESHOLD;
                      return (
                        <tr key={semester.label} className="border-t" style={{ borderColor: "var(--fog-100)" }}>
                          <td className="px-3 py-3 font-semibold text-fog-900">{semester.label}</td>
                          <td className="px-3 py-3 text-center text-fog-700">{semester.enrolled}</td>
                          <td className="px-3 py-3 text-center text-fog-700">
                            {semester.approved} de {semester.enrolled}
                          </td>
                          <td className="px-3 py-3 text-center text-fog-700">{rate}%</td>
                          <td className="px-3 py-3 text-center">
                            <span className={gradeNeedsAttention ? "z-badge z-badge--warning" : "z-badge z-badge--success"}>
                              {formatNumber(semester.grade)}/{GRADE_MAX}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-1.5">
                        <span className="text-sm font-medium text-fog-800">{f.feature}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-fog-400 hidden sm:inline">val. {f.value}</span>
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
