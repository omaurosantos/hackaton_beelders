"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import RiskBadge from "@/components/RiskBadge";
import { fetchDashboardProfessor, fetchStudents, uploadCSV } from "@/lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Users, Warning, TrendUp, CheckCircle, UploadSimple } from "@phosphor-icons/react";

interface CourseOption { id: number; name: string; period: string; }

interface DashboardSummary {
  total: number;
  alto_risco: number;
  medio_risco: number;
  baixo_risco: number;
  taxa_risco: number;
  courses: CourseOption[];
}

interface Student {
  id: number;
  name: string;
  course: string;
  risk_score: number;
  risk_level: string;
  debtor: number;
  tuition_fees_up_to_date: number;
  curricular_units_1st_sem_grade: number;
  curricular_units_2nd_sem_grade: number;
}

const PAGE_SIZE = 10;

export default function ProfessorDashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | undefined>();
  const [riskFilter, setRiskFilter] = useState<string>("todos");
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const [dash, students] = await Promise.all([
        fetchDashboardProfessor(selectedCourse),
        fetchStudents(selectedCourse),
      ]);
      setSummary(dash);
      setAllStudents([...students].sort((a: Student, b: Student) => b.risk_score - a.risk_score));
    } catch { /* ignore */ }
  }, [selectedCourse]);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("role") !== "professor") {
      router.push("/"); return;
    }
    load();
  }, [load, router]);

  useEffect(() => { setPage(1); }, [riskFilter, selectedCourse]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadMsg("");
    try {
      const result = await uploadCSV(file);
      setUploadMsg(result.message);
      load();
    } catch { setUploadMsg("Erro ao processar CSV."); }
    finally { setUploading(false); }
  }

  if (!summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fog-50">
        <div className="w-10 h-10 rounded-full border-2 border-fog-200 border-t-primary animate-spin" />
      </div>
    );
  }

  const filtered = riskFilter === "todos"
    ? allStudents
    : allStudents.filter((s) => s.risk_level === riskFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const gradeAvg = (s: Student) =>
    ((s.curricular_units_1st_sem_grade + s.curricular_units_2nd_sem_grade) / 2).toFixed(1);

  const FILTERS = [
    { key: "todos", label: "Todos",  count: allStudents.length },
    { key: "alto",  label: "Alto",   count: summary.alto_risco },
    { key: "médio", label: "Médio",  count: summary.medio_risco },
    { key: "baixo", label: "Baixo",  count: summary.baixo_risco },
  ] as const;

  return (
    <div className="min-h-screen bg-fog-50">
      <Navbar role="professor" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-bold text-fog-900" style={{ fontSize: 24 }}>Dashboard do Professor</h2>
            <p className="text-fog-500 text-sm mt-0.5">Visão geral da turma e alunos em risco</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedCourse ?? ""}
              onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : undefined)}
              className="text-sm rounded-lg px-3 py-2 bg-white font-medium text-fog-700"
              style={{ border: "1.5px solid var(--fog-200)", height: 40 }}
            >
              <option value="">Todos os cursos</option>
              {summary.courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.period})</option>
              ))}
            </select>

            <label
              className="z-btn z-btn--sm flex items-center gap-2 cursor-pointer"
              style={{
                background: "white",
                color: "var(--fg-muted)",
                border: "1.5px solid var(--fog-200)",
              }}
            >
              <UploadSimple size={15} weight="bold" />
              {uploading ? "Enviando..." : "Importar CSV"}
              <input type="file" accept=".csv" className="hidden" onChange={handleUpload} />
            </label>
          </div>
        </div>

        {uploadMsg && (
          <div className="mb-6 p-4 rounded-lg text-sm font-medium"
            style={{ background: "var(--primary-lightest)", color: "var(--primary)", borderLeft: "4px solid var(--primary)" }}>
            {uploadMsg}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total de Alunos" value={summary.total}
            icon={<Users size={18} weight="bold" />} variant="default" />
          <StatCard title="Alto Risco" value={summary.alto_risco}
            sub={`${((summary.alto_risco / summary.total) * 100).toFixed(0)}% da turma`}
            icon={<Warning size={18} weight="bold" />} variant="danger" />
          <StatCard title="Médio Risco" value={summary.medio_risco}
            icon={<TrendUp size={18} weight="bold" />} variant="warning" />
          <StatCard title="Baixo Risco" value={summary.baixo_risco}
            icon={<CheckCircle size={18} weight="bold" />} variant="success" />
        </div>

        {/* Risk distribution bar */}
        <div className="z-card mb-6">
          <p className="text-sm font-semibold text-fog-700 mb-3">Distribuição de risco na turma</p>
          <div className="flex rounded-full overflow-hidden h-3">
            <div style={{ width: `${(summary.alto_risco / summary.total) * 100}%`, background: "var(--attention-danger)", transition: "width 300ms ease-out" }} title={`Alto: ${summary.alto_risco}`} />
            <div style={{ width: `${(summary.medio_risco / summary.total) * 100}%`, background: "var(--attention-warning)", transition: "width 300ms ease-out" }} title={`Médio: ${summary.medio_risco}`} />
            <div style={{ width: `${(summary.baixo_risco / summary.total) * 100}%`, background: "var(--attention-success)", transition: "width 300ms ease-out" }} title={`Baixo: ${summary.baixo_risco}`} />
          </div>
          <div className="flex gap-5 mt-3 text-xs text-fog-500">
            {[
              { label: "Alto",  color: "var(--attention-danger)" },
              { label: "Médio", color: "var(--attention-warning)" },
              { label: "Baixo", color: "var(--attention-success)" },
            ].map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Student table */}
        <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--fog-100)" }}>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-fog-900">Lista de Alunos</h3>
              <span className="z-badge z-badge--neutral">{filtered.length}</span>
            </div>
            <div className="flex gap-2">
              {FILTERS.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setRiskFilter(key)}
                  className="z-btn z-btn--sm"
                  style={
                    riskFilter === key
                      ? { background: "var(--primary)", color: "white" }
                      : { background: "var(--fog-100)", color: "var(--fg-muted)" }
                  }
                >
                  {label} <span style={{ opacity: 0.7 }}>({count})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-fog-500 uppercase tracking-wide"
                  style={{ background: "var(--fog-50)" }}>
                  <th className="px-5 py-3 text-left">Aluno</th>
                  <th className="px-5 py-3 text-left">Curso</th>
                  <th className="px-5 py-3 text-center">Score</th>
                  <th className="px-5 py-3 text-center">Nível</th>
                  <th className="px-5 py-3 text-center">Nota Média</th>
                  <th className="px-5 py-3 text-center">Devedor</th>
                  <th className="px-5 py-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s) => (
                  <tr key={s.id} className="border-t"
                    style={{ borderColor: "var(--fog-100)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--fog-50)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                    <td className="px-5 py-3.5 font-semibold text-fog-900">{s.name}</td>
                    <td className="px-5 py-3.5 text-fog-500 text-xs">{s.course}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md"
                        style={{ background: "var(--fog-100)", color: "var(--fg-muted)" }}>
                        {(s.risk_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <RiskBadge level={s.risk_level} />
                    </td>
                    <td className="px-5 py-3.5 text-center text-fog-700 font-medium">{gradeAvg(s)}</td>
                    <td className="px-5 py-3.5 text-center">
                      {s.debtor
                        ? <span className="z-badge z-badge--danger">Sim</span>
                        : <span className="z-badge z-badge--success">Não</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => router.push(`/student/${s.id}`)}
                        className="z-btn z-btn--sm z-btn--secondary"
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-fog-400 text-sm">
                      Nenhum aluno neste filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: "1px solid var(--fog-100)" }}>
              <span className="text-xs text-fog-500">
                Página {page} de {totalPages} · {filtered.length} alunos
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-fog-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ border: "1.5px solid var(--fog-200)" }}
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                    if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("…");
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((n, i) =>
                    n === "…" ? (
                      <span key={`e-${i}`} className="text-xs text-fog-400 px-1">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n as number)}
                        className="w-8 h-8 rounded-md text-xs font-semibold transition-colors"
                        style={
                          page === n
                            ? { background: "var(--primary)", color: "white" }
                            : { border: "1.5px solid var(--fog-200)", color: "var(--fg-muted)" }
                        }
                      >
                        {n}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-fog-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ border: "1.5px solid var(--fog-200)" }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
