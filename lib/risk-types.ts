export type RiskLevel = "high" | "medium" | "low"

export interface Replenishment {
  quantity: number
  expected_date: string
  days_until_arrival: number
}

export interface Promotion {
  active: boolean
  promotion_id: string
  start_date: string
  end_date: string
}

export interface RiskAnalysis {
  overall_risk: RiskLevel
  reason: string
  days_left_risk?: RiskLevel
  replenishment_risk?: RiskLevel
  sales_trend_risk?: RiskLevel
  promotion_risk?: RiskLevel
  promotion_calendar_risk?: RiskLevel
  historical_sales_risk?: RiskLevel
  [key: string]: string | undefined
}

export interface RiskyProduct {
  product_id: string
  name: string
  analyzed_at: string
  sales_velocity: number
  pricing?: {
    mrp: number
    cp: number
    sp: number
  }
  inventory: {
    min_stock: number
    max_stock: number
    current_stock: number
  }
  upcoming_replenishments?: Replenishment[]
  current_promotions?: Promotion[]
  risk_analysis: RiskAnalysis
}

export interface RiskyProductsResponse {
  page: number
  page_size: number
  total_records: number
  total_pages: number
  has_next_page: boolean
  has_previous_page: boolean
  search: string | null
  products: RiskyProduct[]
}

export function getDaysLeft(product: RiskyProduct): number | null {
  const { current_stock } = product.inventory
  if (!product.sales_velocity || product.sales_velocity <= 0) return null
  return Math.floor(current_stock / product.sales_velocity)
}

const RISK_LEVELS: readonly string[] = ["high", "medium", "low"]

export function getRiskFactors(analysis: RiskAnalysis): { key: string; label: string; level: RiskLevel }[] {
  return Object.entries(analysis)
    .filter(
      ([key, value]) =>
        key.endsWith("_risk") && key !== "overall_risk" && typeof value === "string" && RISK_LEVELS.includes(value),
    )
    .map(([key, value]) => ({ key, label: humanizeRiskKey(key), level: value as RiskLevel }))
}

function humanizeRiskKey(key: string): string {
  const words = key.replace(/_risk$/, "").split("_")
  const text = words.join(" ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}
