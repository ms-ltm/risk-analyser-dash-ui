import {  AlertCircle, Boxes, ShieldCheck, TriangleAlert, type LucideIcon,} from "lucide-react"
import { cn } from "@/lib/utils"

export interface RiskSummary {
  total: number
  high: number
  medium: number
  low: number
}

interface SummaryCardConfig {
  key: keyof RiskSummary
  label: string
  description: string
  icon: LucideIcon
  cardClassName: string
  iconClassName: string
  valueClassName: string
}

const ITEMS: SummaryCardConfig[] = [
  {
    key: "total",
    label: "Total products",
    description: "Currently monitored",
    icon: Boxes,
    cardClassName:
      "border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50",
    iconClassName:
      "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-indigo-200",
    valueClassName: "text-indigo-900",
  },
  {
    key: "high",
    label: "High risk",
    description: "Needs action now (P1)",
    icon: AlertCircle,
    cardClassName:
      "border-red-200 bg-gradient-to-br from-red-50 to-rose-50",
    iconClassName:
      "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-200",
    valueClassName: "text-red-700",
  },
  {
    key: "medium",
    label: "Medium risk",
    description: "Watch closely (P2)",
    icon: TriangleAlert,
    cardClassName:
      "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50",
    iconClassName:
      "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-200",
    valueClassName: "text-amber-700",
  },
  {
    key: "low",
    label: "Low risk",
    description: "Healthy for now (P3)",
    icon: ShieldCheck,
    cardClassName:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50",
    iconClassName:
      "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-200",
    valueClassName: "text-emerald-700",
  },
]

function SummarySkeleton() {
  return (
    <span
      className="mt-1 inline-block h-6 w-10 animate-pulse rounded bg-slate-200/70"
      aria-label="Loading"
    />
  )
}

export function RiskSummaryStats({
  summary,
}: {
  summary?: RiskSummary
}) {
  return (
    <section
      aria-label="Risk summary"
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon
        const value = summary?.[item.key]

        return (
          <article
            key={item.key}
            className={cn(
              "flex min-w-0 items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
              item.cardClassName,
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
                item.iconClassName,
              )}
            >
              <Icon
                className="size-5"
                aria-hidden="true"
              />
            </div>

            {/* Card information */}
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-medium text-slate-600">
                {item.label}
              </h2>

              {value === undefined ? (
                <SummarySkeleton />
              ) : (
                <p
                  className={cn(
                    "mt-0.5 text-xl font-bold leading-none tracking-tight tabular-nums",
                    item.valueClassName,
                  )}
                >
                  {value}
                </p>
              )}

              <p className="mt-1 truncate text-[11px] leading-4 text-slate-500">
                {item.description}
              </p>
            </div>
          </article>
        )
      })}
    </section>
  )
}