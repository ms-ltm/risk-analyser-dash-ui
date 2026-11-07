import { cn } from "@/lib/utils"

export interface RiskSummary {
  total: number
  high: number
  medium: number
  low: number
}

const ITEMS = [
  { key: "total", label: "Total products", dot: null },
  { key: "high", label: "High risk", dot: "bg-red-500" },
  { key: "medium", label: "Medium risk", dot: "bg-amber-500" },
  { key: "low", label: "Low risk", dot: "bg-emerald-500" },
] as const

export function RiskSummaryStats({ summary, total }: { summary?: RiskSummary; total?: number }) {
  return (
    <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      {ITEMS.map(({ key, label, dot }) => {
        const value = key === "total" ? (summary?.total ?? total) : summary?.[key]
        return (
          <div key={key} className="flex items-center gap-1.5">
            {dot && <span className={cn("size-2 rounded-full", dot)} aria-hidden="true" />}
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium text-foreground tabular-nums">
              {value ?? <span className="inline-block h-3.5 w-6 animate-pulse rounded bg-muted align-middle" aria-label="Loading" />}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
