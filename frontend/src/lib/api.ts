const BASE = "/api";

const NO_CACHE = { cache: "no-store" as RequestCache };

export async function fetchDashboardProfessor(courseId?: number) {
  const url = courseId
    ? `${BASE}/dashboard/professor?course_id=${courseId}`
    : `${BASE}/dashboard/professor`;
  const res = await fetch(url, NO_CACHE);
  if (!res.ok) throw new Error("Erro ao carregar dashboard professor");
  return res.json();
}

export async function fetchDashboardIES() {
  const res = await fetch(`${BASE}/dashboard/ies`, NO_CACHE);
  if (!res.ok) throw new Error("Erro ao carregar dashboard IES");
  return res.json();
}

export async function fetchModelMetrics() {
  const res = await fetch(`${BASE}/model/metrics`, NO_CACHE);
  if (!res.ok) throw new Error("Erro ao carregar métricas do modelo");
  return res.json();
}

export async function fetchStudents(courseId?: number, riskLevel?: string) {
  const params = new URLSearchParams();
  if (courseId) params.set("course_id", String(courseId));
  if (riskLevel) params.set("risk_level", riskLevel);
  const res = await fetch(`${BASE}/students?${params}`, NO_CACHE);
  if (!res.ok) throw new Error("Erro ao carregar alunos");
  return res.json();
}

export async function fetchStudent(id: number) {
  const res = await fetch(`${BASE}/students/${id}`);
  if (!res.ok) throw new Error("Erro ao carregar aluno");
  return res.json();
}

export async function uploadCSV(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/upload/csv`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Erro ao fazer upload");
  return res.json();
}
