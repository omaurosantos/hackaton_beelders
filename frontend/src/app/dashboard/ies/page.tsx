"use client";
import { useEffect, useState } from "react";
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
import { Users, Warning, TrendUp, CheckCircle } from "@phosphor-icons/react";

interface CourseRow {
  course: string;
  period: string;
  total: number;
  alto: number;
  medio: number;
  baixo: number;
  avg_score: number;
  taxa_risco: number;
}

interface Alert {
  course: string;
  period: string;
  taxa_risco: number;
  alto: number;
}

interface TrendPoint {
  month: string;
  taxa: number;
}

interface IESData {
  total: number;
  alto_risco: number;
  medio_risco: number;
  baixo_risco: number;
  taxa_risco_geral: number;
  by_course: CourseRow[];
  alertas: Alert[];
  trend: TrendPoint[];
}

interface ConfusionMatrix {
  true_negative: number;
  false_positive: number;
  false_negative: number;
  true_positive: number;
}

interface ThresholdMetric {
  threshold: number;
  precision: number;
  recall: number;
  f1: number;
  alert_rate: number;
}

interface ModelMetrics {
  dataset: {
    total_rows_after_filter: number;
    train_rows: number;
    test_rows: number;
  };
  validation: {
    roc_auc: number;
    precision: number;
    recall: number;
    f1: number;
    accuracy: number;
    threshold: number;
    confusion_matrix: ConfusionMatrix;
  };
  thresholds: {
    justification: string;
  };
  threshold_analysis: ThresholdMetric[];
}

const pct = (value: number) => `${Math.round(value * 100)}%`;

export default function IESDashboard() {
  const router = useRouter();
  const [data, setData] = useState<IESData | null>(null);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [metricsError, setMetricsError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("role") !== "ies") {
      router.push("/");
      return;
    }
    fetchDashboardIES().then(setData).catch(console.error);
    fetchModelMetrics()
      .then(setMetrics)
      .catch((error) => {
        console.error(error);
        setMetricsError(true);
      });
  }, [router]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fog-50">
        <div className="w-10 h-10 rounded-full border-2 border-fog-200 border-t-primary animate-spin" />
      </div>
    );
  }

  const validationCards = metrics
    ? [
        { label: "ROC AUC", value: metrics.validation.roc_auc.toFixed(2), hint: "separação geral" },
        { label: "Precision", value: pct(metrics.validation.precision), hint: "alertas corretos" },
        { label: "Recall", value: pct(metrics.validation.recall), hint: "evasões capturadas" },
        { label: "F1-score", value: pct(metrics.validation.f1), hint: "equilíbrio" },
      ]
    : [];
  const highRiskRate = data.total ? ((data.alto_risco / data.total) * 100).toFixed(0) : "0";

  return (
    <div className="min-h-screen bg-fog-50">
      <Navbar role="ies" />

      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-8">
        <div className="mb-5 sm:mb-8">
          <h2 className="font-bold text-fog-900 text-xl sm:text-2xl">Dashboard Institucional</h2>
          <p className="text-fog-500 text-sm mt-0.5">Visão agregada por curso e período</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <StatCard title="Total de Alunos" value={data.total}
            icon={<Users size={16} weight="bold" />} variant="default" />
          <StatCard title="Alto Risco" value={data.alto_risco}
            sub={`${highRiskRate}% dos alunos`}
            icon={<Warning size={16} weight="bold" />} variant="danger" />
          <StatCard title="Médio Risco" value={data.medio_risco}
            icon={<TrendUp size={16} weight="bold" />} variant="warning" />
          <StatCard title="Baixo Risco" value={data.baixo_risco}
            icon={<CheckCircle size={16} weight="bold" />} variant="success" />
        </div>

        {metrics ? (
          <div className="z-card mb-4 sm:mb-6 p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="font-semibold text-fog-900 text-sm sm:text-base">Validação do Modelo</h3>
                <p className="text-xs text-fog-500 mt-1">
                  Teste em {metrics.dataset.test_rows} registros, com split 80/20 estratificado.
                </p>
              </div>
              <span className="z-badge z-badge--primary self-start">
                limiar operacional {pct(metrics.validation.threshold)}
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {validationCards.map((card) => (
                <div key={card.label} className="rounded-lg p-3" style={{ background: "var(--fog-50)" }}>
                  <p className="text-xs font-semibold text-fog-500">{card.label}</p>
                  <p className="text-2xl font-bold text-fog-900 mt-1">{card.value}</p>
                  <p className="text-xs text-fog-400 mt-0.5">{card.hint}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold text-fog-500 uppercase mb-2">Matriz de confusão</p>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  {[
                    { label: "Verdadeiro negativo", value: metrics.validation.confusion_matrix.true_negative, tone: "neutral" },
                    { label: "Falso positivo", value: metrics.validation.confusion_matrix.false_positive, tone: "warning" },
                    { label: "Falso negativo", value: metrics.validation.confusion_matrix.false_negative, tone: "danger" },
                    { label: "Verdadeiro positivo", value: metrics.validation.confusion_matrix.true_positive, tone: "success" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg p-3"
                      style={{
                        background: item.tone === "danger"
                          ? "#fccfd222"
                          : item.tone === "warning"
                          ? "#ffe1a855"
                          : item.tone === "success"
                          ? "#9deeb222"
                          : "var(--fog-50)",
                      }}>
                      <p className="text-xl font-bold text-fog-900">{item.value}</p>
                      <p className="text-fog-500 mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

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

              <div className="rounded-lg p-4" style={{ background: "var(--primary-lightest)" }}>
                <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--primary)" }}>
                  Justificativa dos thresholds
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--primary-dark)" }}>
                  {metrics.thresholds.justification}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="z-card mb-4 sm:mb-6 p-4 sm:p-6">
            <h3 className="font-semibold text-fog-900 text-sm sm:text-base">Validação do Modelo</h3>
            <div className="flex items-center gap-3 mt-3">
              {!metricsError && (
                <span className="w-5 h-5 rounded-full border-2 border-fog-200 border-t-primary animate-spin shrink-0" />
              )}
              <p className="text-sm text-fog-500">
                {metricsError
                  ? "Métricas indisponíveis. Publique o backend atualizado para habilitar esta seção."
                  : "Carregando métricas de validação..."}
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Bar chart */}
          <div className="lg:col-span-2 z-card p-4 sm:p-6">
            <h3 className="font-semibold text-fog-900 mb-4 text-sm sm:text-base">Taxa de Risco por Curso (%)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.by_course.map((c) => ({
                  ...c,
                  alto_pct: c.total ? Math.round((c.alto / c.total) * 100) : 0,
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
                  contentStyle={{ borderRadius: 8, border: "1px solid #d5d9e0", fontSize: 12 }}
                />
                <Bar dataKey="alto_pct" name="Alto" fill="#da1e28" stackId="a" />
                <Bar dataKey="medio_pct" name="Médio" fill="#ffb005" stackId="a" />
                <Bar dataKey="baixo_pct" name="Baixo" fill="#198038" stackId="a" radius={[0, 4, 4, 0]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trend */}
          <div className="z-card p-4 sm:p-6">
            <h3 className="font-semibold text-fog-900 mb-4 text-sm sm:text-base">Tendência (6 meses)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.trend} margin={{ left: -10, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaee" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#868d95" }} />
                <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#868d95" }} />
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 8, border: "1px solid #d5d9e0", fontSize: 12 }} />
                <Line type="monotone" dataKey="taxa" stroke="#304ffe" strokeWidth={2.5}
                  dot={{ r: 4, fill: "#304ffe", strokeWidth: 0 }} name="% em risco" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Alertas */}
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

          {/* Tabela por curso */}
          <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--fog-100)" }}>
              <h3 className="font-semibold text-fog-900">Resumo por Curso</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold text-fog-500 uppercase"
                    style={{ background: "var(--fog-50)" }}>
                    <th className="px-4 py-3 text-left">Curso</th>
                    <th className="px-4 py-3 text-center">Total</th>
                    <th className="px-4 py-3 text-center">Alto</th>
                    <th className="px-4 py-3 text-center">% Risco</th>
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
                        <span className="text-xs font-bold"
                          style={{ color: c.taxa_risco > 50
                            ? "var(--attention-danger)"
                            : c.taxa_risco > 30
                            ? "var(--attention-warning)"
                            : "var(--attention-success)"
                          }}
                        >
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
