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
import { fetchDashboardIES } from "@/lib/api";
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

export default function IESDashboard() {
  const router = useRouter();
  const [data, setData] = useState<IESData | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("role") !== "ies") {
      router.push("/");
      return;
    }
    fetchDashboardIES().then(setData).catch(console.error);
  }, [router]);

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
            sub={`${data.taxa_risco_geral}% de risco geral`}
            icon={<Warning size={16} weight="bold" />} variant="danger" />
          <StatCard title="Médio Risco" value={data.medio_risco}
            icon={<TrendUp size={16} weight="bold" />} variant="warning" />
          <StatCard title="Baixo Risco" value={data.baixo_risco}
            icon={<CheckCircle size={16} weight="bold" />} variant="success" />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Bar chart */}
          <div className="lg:col-span-2 z-card p-4 sm:p-6">
            <h3 className="font-semibold text-fog-900 mb-4 text-sm sm:text-base">Taxa de Risco por Curso (%)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.by_course} layout="vertical" margin={{ left: 0, right: 8 }}>
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: "#868d95" }} />
                <YAxis type="category" dataKey="course" width={130} tick={{ fontSize: 10, fill: "#868d95" }} />
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 8, border: "1px solid #d5d9e0", fontSize: 12 }} />
                <Bar dataKey="alto" name="Alto" fill="#da1e28" stackId="a" />
                <Bar dataKey="medio" name="Médio" fill="#ffb005" stackId="a" />
                <Bar dataKey="baixo" name="Baixo" fill="#198038" stackId="a" radius={[0,4,4,0]} />
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
