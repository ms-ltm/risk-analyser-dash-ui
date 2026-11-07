import { NextResponse, type NextRequest } from "next/server"

const UPSTREAM_URL = "https://risk-analyser.onrender.com/risky-products"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1)
  const search = (searchParams.get("search") ?? "").trim().slice(0, 100)

  const upstream = new URL(UPSTREAM_URL)
  upstream.searchParams.set("page", String(page))
  if (search) upstream.searchParams.set("search", search)

  try {
    const res = await fetch(upstream, {
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream responded with ${res.status}` },
        { status: 502 },
      )
    }
    const data = await res.json()
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json(
      { error: "Could not reach the risk analyser service" },
      { status: 504 },
    )
  }
}
