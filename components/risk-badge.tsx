import { cn } from "@/lib/utils"
import type { RiskLevel } from "@/lib/risk-types"

const RISK_CONFIG: Record<RiskLevel, { label: string; priority: string; className: string; dot: string }> = {
  high: {
    label: "High",
    priority: "P1",
    className: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900",
    dot: "bg-red-500",
  },
  medium: {
    label: "Medium",
    priority: "P2",
    className: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900",
    dot: "bg-amber-500",
  },
  low: {
    label: "Low",
    priority: "P3",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900",
    dot: "bg-emerald-500",
  },
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const config = RISK_CONFIG[level] ?? RISK_CONFIG.low
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
        config.className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", config.dot)} aria-hidden="true" />
      {config.label}
      <span className="font-mono opacity-70">({config.priority})</span>
    </span>
  )
}
