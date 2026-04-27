interface Props {
  title: string;
  value: string | number;
  sub?: string;
  variant?: "default" | "danger" | "warning" | "success";
  icon?: React.ReactNode;
}

const variants = {
  default: {
    card: "bg-white",
    title: "text-fog-600",
    value: "text-fog-900",
    sub: "text-fog-500",
    icon: "bg-fog-100 text-fog-600",
  },
  danger: {
    card: "bg-white",
    title: "text-fog-600",
    value: "text-risk-high",
    sub: "text-fog-500",
    icon: "bg-risk-highBg text-risk-high",
  },
  warning: {
    card: "bg-white",
    title: "text-fog-600",
    value: "text-risk-mid",
    sub: "text-fog-500",
    icon: "bg-risk-midBg text-risk-mid",
  },
  success: {
    card: "bg-white",
    title: "text-fog-600",
    value: "text-risk-low",
    sub: "text-fog-500",
    icon: "bg-risk-lowBg text-risk-low",
  },
};

export default function StatCard({ title, value, sub, variant = "default", icon }: Props) {
  const t = variants[variant];
  return (
    <div className={`z-card flex flex-col gap-3 ${t.card}`}>
      <div className="flex items-start justify-between gap-2">
        <span className={`text-sm font-semibold ${t.title}`}>{title}</span>
        {icon && (
          <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${t.icon}`}>
            {icon}
          </span>
        )}
      </div>
      <div>
        <span className={`text-3xl font-bold ${t.value}`}>{value}</span>
        {sub && <p className={`text-xs mt-1 ${t.sub}`}>{sub}</p>}
      </div>
    </div>
  );
}
