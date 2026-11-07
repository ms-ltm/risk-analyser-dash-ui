import { NextResponse, type NextRequest } from "next/server"
import type { RiskyProductsResponse } from "@/lib/risk-types"

const UPSTREAM_URL = "https://risk-analyser.onrender.com/risky-products"
const CONCURRENCY = 10

async function fetchPage(page: number, search: string): Promise<RiskyProductsResponse> {
  const url = new URL(UPSTREAM_URL)
  url.searchParams.set("page", String(page))
  if (search) url.searchParams.set("search", search)
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(60_000) })
  if (!res.ok) throw new Error(`Upstream responded with ${res.status}`)
  return res.json()
}

export async function GET(request: NextRequest) {
  const search = (request.nextUrl.searchParams.get("search") ?? "").trim().slice(0, 100)

  try {
    const first = await fetchPage(1, search)
    const pages = [first]
    const remaining = Array.from({ length: Math.max(0, first.total_pages - 1) }, (_, i) => i + 2)

    for (let i = 0; i < remaining.length; i += CONCURRENCY) {
      const batch = await Promise.all(remaining.slice(i, i + CONCURRENCY).map((p) => fetchPage(p, search)))
      pages.push(...batch)
    }

    const counts = { high: 0, medium: 0, low: 0 }
    for (const page of pages) {
      for (const product of page.products) {
        const level = product.risk_analysis?.overall_risk
        if (level === "high" || level === "medium" || level === "low") counts[level]++
      }
    }

    return NextResponse.json(
      { total: first.total_records, ...counts },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch {
    return NextResponse.json({ error: "Could not load risk summary" }, { status: 502 })
  }
}
