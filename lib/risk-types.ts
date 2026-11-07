export type RiskLevel = "high" | "medium" | "low"

export interface RiskyProduct {
  product_id: string
  name: string
  analyzed_at: string
  sales_velocity: number
  inventory: {
    min_stock: number
    max_stock: number
    current_stock: number
  }
  risk_analysis: {
    overall_risk: RiskLevel
    reason: string
  }
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
