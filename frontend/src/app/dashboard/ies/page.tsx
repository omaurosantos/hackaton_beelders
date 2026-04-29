"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import { fetchDashboardIES, fetchModelMetrics } from "@/lib/api";
import { getStoredRole } from "@/lib/storage";
import {
  Users,
  Warning,
  TrendUp,
  CheckCircle,
  ArrowClockwise,
  ChartBar,
  X,
} from "@phosphor-icons/react";

// ── Interfaces ────────────────────────────────────────────────────────────────

interface CourseRow {
  course: string; period: string; total: number;
  alto: number; medio: number; baixo: number;
  avg_score: number; taxa_risco: number;
}
interface Alert { course: string; period: string; taxa_risco: number; alto: number; }
interface TrendPoint { month: string; taxa: number; }
interface TopFactor { factor: string; affected_students: number; avg_contribution: number; }

interface IESData {
  total: number; alto_risco: number; medio_risco: number; baixo_risco: number;
  taxa_risco_geral: number; by_course: CourseRow[]; alertas: Alert[];
  trend: TrendPoint[]; top_factors: TopFactor[];
}

interface ConfusionMatrix {
  true_negative: number; false_positive: number;
  false_negative: number; true_positive: number;
}
interface ThresholdMetric { threshold: number; precision: number; recall: number; f1: number; alert_rate: number; }
interface ModelMetrics {
  dataset: { total_rows_after_filter: number; train_rows: number; test_rows: number };
  validation: {
    roc_auc: number; precision: number; recall: number;
    f1: number; accuracy: number; threshold: number; confusion_matrix: ConfusionMatrix;
  };
  thresholds: { justification: string };
  threshold_analysis: ThresholdMetric[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const pct = (value: number) => `${Math.round(value * 100)}%`;

const FACTOR_CATEGORY: Record<string, { label: string; color: string; bg: string }> = {
  "Devedor":                            { label: "Financeiro", color: "#b45309", bg: "#fef3c7" },
  "Mensalidade em dia":                 { label: "Financeiro", color: "#b45309", bg: "#fef3c7" },
  "Bolsista":                           { label: "Financeiro", color: "#b45309", bg: "#fef3c7" },
  "Nota média (1º sem)":               { label: "Acadêmico",  color: "#1d4ed8", bg: "#dbeafe" },
  "Nota média (2º sem)":               { label: "Acadêmico",  color: "#1d4ed8", bg: "#dbeafe" },
  "Disciplinas aprovadas (1º sem)":    { label: "Acadêmico",  color: "#1d4ed8", bg: "#dbeafe" },
  "Disciplinas aprovadas (2º sem)":    { label: "Acadêmico",  color: "#1d4ed8", bg: "#dbeafe" },
  "Disciplinas matriculadas (1º sem)": { label: "Acadêmico",  color: "#1d4ed8", bg: "#dbeafe" },
  "Disciplinas matriculadas (2º sem)": { label: "Acadêmico",  color: "#1d4ed8", bg: "#dbeafe" },
  "Qualificação anterior":             { label: "Acadêmico",  color: "#1d4ed8", bg: "#dbeafe" },
  "Taxa de desemprego":                { label: "Econômico",  color: "#6d28d9", bg: "#ede9fe" },
  "Taxa de inflação":                  { label: "Econômico",  color: "#6d28d9", bg: "#ede9fe" },
  "PIB":                               { label: "Econômico",  color: "#6d28d9", bg: "#ede9fe" },
};
function getCategory(factor: string) {
  return FACTOR_CATEGORY[factor] ?? { label: "Pessoal", color: "#065f46", bg: "#d1fae5" };
}
const CATEGORY_ACTION: Record<string, string> = {
  "Financeiro": "Considere programas de apoio financeiro, renegociação de dívidas ou bolsas emergenciais.",
  "Acadêmico":  "Reforce tutoria, monitoramento de desempenho e oferta de reforço pedagógico.",
  "Econômico":  "Contexto externo — priorize suporte socioeconômico e flexibilização de mensalidades.",
  "Pessoal":    "Ofereça apoio psicossocial, orientação acadêmica e flexibilidade de horários.",
};

// ── Model Metrics Modal ───────────────────────────────────────────────────────

function MetricsModal({
  metrics, metricsError, onClose,
}: {
  metrics: ModelMetrics | null;
  metricsError: boolean;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const validationCards = metrics ? [
    { label: "ROC AUC",   value: metrics.validation.roc_auc.toFixed(2), hint: "separação geral" },
    { label: "Precision", value: pct(metrics.validation.precision),      hint: "alertas corretos" },
    { label: "Recall",    value: pct(metrics.validation.recall),          hint: "evasões capturadas" },
    { label: "F1-score",  value: pct(metrics.validation.f1),              hint: "equilíbrio" },
  ] : [];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,20,30,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl bg-white"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,.18)" }}
      >
        {/* Modal header */}
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--fog-100)" }}>
          <div>
            <h3 className="font-semibold text-fog-900">Validação do Modelo</h3>
            {metrics && (
              <p className="text-xs text-fog-400 mt-0.5">
                Teste em {metrics.dataset.test_rows} registros · split 80/20 estratificado
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {metrics && (
              <span className="z-badge z-badge--primary">
                limiar {pct(metrics.validation.threshold)}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--fog-500)" }}
              aria-label="Fechar"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="p-5 space-y-5">
          {metricsError && (
            <p className="text-sm text-fog-500 text-center py-8">
              Métricas indisponíveis. Publique o backend atualizado para habilitar esta seção.
            </p>
          )}

          {!metrics && !metricsError && (
            <div className="flex items-center justify-center gap-3 py-8">
              <span className="w-5 h-5 rounded-full border-2 border-fog-200 border-t-primary animate-spin" />
              <p className="text-sm text-fog-500">Carregando métricas...</p>
            </div>
          )}

          {metrics && (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {validationCards.map((card) => (
                  <div key={card.label} className="rounded-xl p-3 text-center"
                    style={{ background: "var(--fog-50)" }}>
                    <p className="text-xs font-semibold text-fog-500">{card.label}</p>
                    <p className="text-2xl font-bold text-fog-900 mt-1">{card.value}</p>
                    <p className="text-xs text-fog-400 mt-0.5">{card.hint}</p>
                  </div>
                ))}
              </div>

              {/* Confusion matrix */}
              <div>
                <p className="text-xs font-semibold text-fog-500 uppercase mb-2">Matriz de confusão</p>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  {[
                    { label: "Verdadeiro negativo", value: metrics.validation.confusion_matrix.true_negative, tone: "neutral" },
                    { label: "Falso positivo",       value: metrics.validation.confusion_matrix.false_positive, tone: "warning" },
                    { label: "Falso negativo",       value: metrics.validation.confusion_matrix.false_negative, tone: "danger" },
                    { label: "Verdadeiro positivo",  value: metrics.validation.confusion_matrix.true_positive,  tone: "success" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg p-3"
                      style={{
                        background: item.tone === "danger"  ? "#fccfd222"
                          : item.tone === "warning" ? "#ffe1a855"
                          : item.tone === "success" ? "#9deeb222"
                          : "var(--fog-50)",
                      }}>
                      <p className="text-xl font-bold text-fog-900">{item.value}</p>
                      <p className="text-fog-500 mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Threshold table */}
              <div>
                <p className="text-xs font-semibold text-fog-500 uppercase mb-2">Troca por limiar</p>
                <div className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--fog-100)" }}>
                  <table className="w-full text-xs">
                    <thead style={{ background: "var(--fog-50)" }}>
                      <tr className="text-fog-500">
                        <th className="px-3 py-2 text-left">Limiar</th>
                        <th className="px-3 py-2 text-center">Prec.</th>
                        <th className="px-3 py-2 text-center">Recall</th>
                        <th className="px-3 py-2 text-center">Alertas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--fog-100)" }}>
                      {metrics.threshold_analysis.map((row) => (
                        <tr key={row.threshold}>
                          <td className="px-3 py-2 font-semibold text-fog-900">{pct(row.threshold)}</td>
                          <td className="px-3 py-2 text-center text-fog-700">{pct(row.precision)}</td>
                          <td className="px-3 py-2 text-center text-fog-700">{pct(row.recall)}</td>
                          <td className="px-3 py-2 text-center text-fog-700">{pct(row.alert_rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Justification */}
              <div className="rounded-xl p-4" style={{ background: "var(--primary-lightest)" }}>
                <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--primary)" }}>
                  Justificativa dos limiares
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--primary-dark)" }}>
                  {metrics.thresholds.justification}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IESDashboard() {
  const router = useRouter();
  const [data, setData] = useState<IESData | null>(null);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [metricsError, setMetricsError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [iesData] = await Promise.all([
        fetchDashboardIES(),
        fetchModelMetrics()
          .then(setMetrics)
          .catch((err) => { console.error(err); setMetricsError(true); }),
      ]);
      setData(iesData);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (getStoredRole() !== "ies") { router.push("/"); return; }
    load();
  }, [router, load]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fog-50">
        <div className="w-10 h-10 rounded-full border-2 border-fog-200 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fog-50">
      <Navbar role="ies" />

      {showMetrics && (
        <MetricsModal
          metrics={metrics}
          metricsError={metricsError}
          onClose={() => setShowMetrics(false)}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 mb-5 sm:mb-8">
          <div>
            <h2 className="font-bold text-fog-900 text-xl sm:text-2xl">Dashboard Institucional</h2>
            <p className="text-fog-500 text-sm mt-0.5">Visão agregada por curso e período</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowMetrics(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
              style={{ borderColor: "var(--fog-200)", background: "white", color: "var(--fog-600)" }}
              title="Ver validação do modelo"
            >
              <ChartBar size={15} weight="bold" />
              Modelo
            </button>
            <button
              onClick={load}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
              style={{ borderColor: "var(--fog-200)", background: "white", color: "var(--fog-700)" }}
              title="Atualizar dados"
            >
              <ArrowClockwise size={15} weight="bold" className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <StatCard title="Total de Alunos" value={data.total}
            icon={<Users size={16} weight="bold" />} variant="default" />
          <StatCard title="Alto Risco" value={data.alto_risco}
            icon={<Warning size={16} weight="bold" />} variant="danger" />
          <StatCard title="Médio Risco" value={data.medio_risco}
            icon={<TrendUp size={16} weight="bold" />} variant="warning" />
          <StatCard title="Baixo Risco" value={data.baixo_risco}
            icon={<CheckCircle size={16} weight="bold" />} variant="success" />
        </div>

        {/* ── Modelo link (mobile only) ── */}
        <button
          onClick={() => setShowMetrics(true)}
          className="sm:hidden w-full flex items-center justify-between px-4 py-3 rounded-xl mb-4 text-sm font-medium"
          style={{
            background: "white",
            border: "1px solid var(--fog-200)",
            color: "var(--fog-600)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <span className="flex items-center gap-2">
            <ChartBar size={15} weight="bold" />
            Ver validação do modelo
          </span>
          <span className="text-fog-400">→</span>
        </button>

        {/* ── Top Factors ── */}
        {data.top_factors && data.top_factors.length > 0 && (
          <div className="z-card p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="mb-5">
              <h3 className="font-semibold text-fog-900 text-sm sm:text-base">
                Principais Motivos de Risco Institucional
              </h3>
              <p className="text-xs text-fog-400 mt-0.5">
                Fatores que mais elevam o risco dos {Math.min(data.alto_risco + data.medio_risco, 100)} alunos em situação mais crítica · % = parcela desses alunos afetada
              </p>
            </div>

            <div className="space-y-4">
              {data.top_factors.map((f, i) => {
                const sampleSize = Math.min(data.alto_risco + data.medio_risco, 100);
                const barPct = sampleSize ? Math.round((f.affected_students / sampleSize) * 100) : 0;
                const cat = getCategory(f.factor);
                return (
                  <div key={f.factor}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: i === 0 ? "var(--primary)" : "var(--fog-100)",
                          color: i === 0 ? "white" : "var(--fog-600)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-fog-900 truncate">{f.factor}</span>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: cat.bg, color: cat.color }}
                        >
                          {cat.label}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-fog-700 shrink-0">
                        {f.affected_students} alunos
                      </span>
                    </div>
                    <div className="ml-9 flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--fog-100)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${barPct}%`, background: cat.color, opacity: 0.7 }}
                        />
                      </div>
                      <span className="text-xs text-fog-400 w-8 text-right">{barPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Category actions */}
            {(() => {
              const cats = [...new Set(data.top_factors.map((f) => getCategory(f.factor).label))];
              return cats.length > 0 ? (
                <div className="mt-5 pt-4 grid sm:grid-cols-2 gap-3" style={{ borderTop: "1px solid var(--fog-100)" }}>
                  {cats.map((c) => (
                    <div key={c} className="rounded-lg p-3" style={{ background: "var(--fog-50)" }}>
                      <p className="text-xs font-semibold text-fog-700 mb-1">{c}</p>
                      <p className="text-xs text-fog-500 leading-relaxed">{CATEGORY_ACTION[c]}</p>
                    </div>
                  ))}
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* ── Charts ── */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="lg:col-span-2 z-card p-4 sm:p-6">
            <h3 className="font-semibold text-fog-900 mb-4 text-sm sm:text-base">Taxa de Risco por Curso (%)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.by_course.map((c) => ({
                  ...c,
                  alto_pct:  c.total ? Math.round((c.alto  / c.total) * 100) : 0,
                  medio_pct: c.total ? Math.round((c.medio / c.total) * 100) : 0,
                  baixo_pct: c.total ? Math.round((c.baixo / c.total) * 100) : 0,
                }))}
                layout="vertical"
                margin={{ left: 0, right: 8 }}
              >
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: "#868d95" }} />
                <YAxis type="category" dataKey="course" width={130} tick={{ fontSize: 10, fill: "#868d95" }} />
                <Tooltip
                  formatter={(v: number, name: string) => [`${v}%`, name]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #d1d5db", fontSize: 12 }}
                />
                <Bar dataKey="alto_pct"  name="Alto"  fill="#da1e28" stackId="a" />
                <Bar dataKey="medio_pct" name="Médio" fill="#ffb005" stackId="a" />
                <Bar dataKey="baixo_pct" name="Baixo" fill="#198038" stackId="a" radius={[0, 4, 4, 0]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="z-card p-4 sm:p-6">
            <h3 className="font-semibold text-fog-900 mb-4 text-sm sm:text-base">Tendência (6 meses)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.trend} margin={{ left: -10, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaee" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#868d95" }} />
                <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#868d95" }} />
                <Tooltip
                  formatter={(v: number) => `${v}%`}
                  contentStyle={{ borderRadius: 8, border: "1px solid #d1d5db", fontSize: 12 }}
                />
                <Line type="monotone" dataKey="taxa" stroke="#304ffe" strokeWidth={2.5}
                  dot={{ r: 4, fill: "#304ffe", strokeWidth: 0 }} name="% em risco" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Alerts + Course table ── */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="z-card">
            <h3 className="font-semibold text-fog-900 mb-4 flex items-center gap-2">
              <Warning size={16} weight="bold" style={{ color: "var(--attention-danger)" }} />
              Alertas de Evasão
            </h3>
            {data.alertas.length === 0 ? (
              <p className="text-sm text-fog-400">Nenhum alerta crítico no momento.</p>
            ) : (
              <ul className="space-y-3">
                {data.alertas.map((a, i) => (
                  <li key={i} className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: "#fccfd222", borderLeft: "4px solid var(--attention-danger)" }}>
                    <div>
                      <p className="text-sm font-semibold text-fog-900">{a.course}</p>
                      <p className="text-xs text-fog-500">{a.period} · {a.alto} em alto risco</p>
                    </div>
                    <span className="z-badge z-badge--danger text-sm font-bold">{a.taxa_risco}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--fog-100)" }}>
              <h3 className="font-semibold text-fog-900">Resumo por Curso</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold text-fog-500 uppercase"
                    style={{ background: "var(--fog-50)" }}>
                    <th className="px-4 py-3 text-left" scope="col">Curso</th>
                    <th className="px-4 py-3 text-center" scope="col">Total</th>
                    <th className="px-4 py-3 text-center" scope="col">Alto</th>
                    <th className="px-4 py-3 text-center" scope="col">% Risco</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--fog-100)" }}>
                  {data.by_course.map((c, i) => (
                    <tr key={i} className="hover:bg-fog-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-fog-900 text-sm">{c.course}</p>
                        <p className="text-xs text-fog-400">{c.period}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-fog-700 font-medium">{c.total}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="z-badge z-badge--danger">{c.alto}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-bold" style={{
                          color: c.taxa_risco > 50 ? "var(--attention-danger)"
                            : c.taxa_risco > 30 ? "var(--attention-warning)"
                            : "var(--attention-success)",
                        }}>
                          {c.taxa_risco}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
