import { cn } from "@/lib/utils"
import type { RiskLevel } from "@/lib/risk-types"

const RISK_CONFIG: Record<RiskLevel, { label: string; priority: string; className: string; dot: string }> = {
  high: {
    label: "High",
    priority: "P1",
    className: "border-red-200 bg-red-50 text-red-700 ring-red-100 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900",
    dot: "bg-red-500",
  },
  medium: {
    label: "Medium",
    priority: "P2",
    className: "border-amber-200 bg-amber-50 text-amber-700 ring-amber-100 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900",
    dot: "bg-amber-500",
  },
  low: {
    label: "Low",
    priority: "P3",
    className:  "border-emerald-200 bg-emerald-50 text-emerald-700 ring-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900",
    dot: "bg-emerald-500",
  },
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const config = RISK_CONFIG[level] ?? RISK_CONFIG.low
  return (
    <span
      className={cn(
         "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ring-1 ring-inset",
        config.className,
      )}
    >
      <span className={cn( "size-2 rounded-full", config.dot)} aria-hidden="true" />
      {config.label}
      <span className="font-mono font-normal opacity-70">({config.priority})</span>
    </span>
  )
}
