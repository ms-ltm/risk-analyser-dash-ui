"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { AlertCircle, RefreshCw, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductsTable } from "@/components/products-table"
import { TablePagination } from "@/components/table-pagination"
import { RiskSummaryStats, type RiskSummary } from "@/components/risk-summary-stats"
import { cn } from "@/lib/utils"
import type { RiskyProductsResponse } from "@/lib/risk-types"

const REFRESH_INTERVAL_MS = 5 * 60 * 1000

async function fetcher(url: string): Promise<RiskyProductsResponse> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Request failed (${res.status})`)
  }
  return res.json()
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })

export function RiskDashboard() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput.trim(), 400)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    setPage(1)
  }, [search])

  const params = new URLSearchParams({ page: String(page) })
  if (search) params.set("search", search)

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `/api/risky-products?${params.toString()}`,
    fetcher,
    {
      refreshInterval: REFRESH_INTERVAL_MS,
      keepPreviousData: true,
      revalidateOnFocus: false,
      onSuccess: () => setLastUpdated(new Date()),
    },
  )

  const summaryKey = `/api/risk-summary${search ? `?search=${encodeURIComponent(search)}` : ""}`
  const { data: summary, mutate: mutateSummary, isValidating: summaryValidating } = useSWR<RiskSummary>(
    summaryKey,
    fetcher as unknown as (url: string) => Promise<RiskSummary>,
    { refreshInterval: REFRESH_INTERVAL_MS, keepPreviousData: true, revalidateOnFocus: false },
  )

  const refreshAll = () => {
    mutate()
    mutateSummary()
  }

  const showSkeleton = isLoading && !data

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Stock risk monitor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Products at risk of stockout, ranked by AI risk analysis. Auto-refreshes every 5 minutes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {isValidating ? "Refreshing…" : lastUpdated ? `Updated ${timeFormat.format(lastUpdated)}` : null}
          </p>
          <Button variant="outline" onClick={refreshAll} disabled={isValidating || summaryValidating}>
            <RefreshCw className={cn((isValidating || summaryValidating) && "animate-spin")} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </header>

      <section aria-label="Risky products" className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="product-search" className="sr-only">Search products</label>
            <Input
              id="product-search"
              type="search"
              placeholder="Search by product ID or name…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pr-8 pl-8"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <RiskSummaryStats summary={summary} total={data?.total_records} />
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 border-b bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            <span>{error.message}. </span>
            <button type="button" onClick={() => mutate()} className="font-medium underline underline-offset-4">
              Try again
            </button>
          </div>
        )}

        <div className={cn("transition-opacity", isValidating && data && "opacity-60")}>
          <ProductsTable products={data?.products ?? []} isLoading={showSkeleton} pageSize={data?.page_size} />
        </div>

        {data && (
          <TablePagination
            page={data.page}
            totalPages={data.total_pages}
            totalRecords={data.total_records}
            pageSize={data.page_size}
            hasPrevious={data.has_previous_page}
            hasNext={data.has_next_page}
            onPageChange={setPage}
          />
        )}
      </section>
    </main>
  )
}
