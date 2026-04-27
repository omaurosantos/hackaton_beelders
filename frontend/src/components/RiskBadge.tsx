const cfg: Record<string, string> = {
  alto:  "z-badge z-badge--danger",
  médio: "z-badge z-badge--warning",
  baixo: "z-badge z-badge--success",
};

const label: Record<string, string> = {
  alto: "Alto risco",
  médio: "Médio risco",
  baixo: "Baixo risco",
};

export default function RiskBadge({ level }: { level: string }) {
  return (
    <span className={cfg[level] ?? "z-badge z-badge--neutral"}>
      {label[level] ?? level}
    </span>
  );
}
