"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { AlertCircle, BarChart3, Box, Heart, RefreshCw, Search, ShieldCheck, TriangleAlert, X,} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductsTable } from "@/components/products-table";
import { TablePagination } from "@/components/table-pagination";
import { RiskSummaryStats, type RiskSummary,} from "@/components/risk-summary-stats";
import { calculateStockoutRisk } from "@/lib/calculate-stockout-risk";
import { cn } from "@/lib/utils";
import type { RiskyProductsResponse } from "@/lib/risk-types";
// import { samplke_response } from "./ui/sampleResponse";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/*
 * Set to false when you want to use the real API.
 */
const USE_SAMPLE_DATA = false;

async function fetcher(url: string): Promise<RiskyProductsResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(body?.error ?? `Request failed (${response.status})`);
  }

  return response.json();
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debounced;
}

const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

export function RiskDashboard() {
  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState("");

  const search = useDebouncedValue(searchInput.trim(), 400);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    USE_SAMPLE_DATA ? new Date() : null,
  );

  useEffect(() => { setPage(1);}, [search]);

  const params = new URLSearchParams({
    page: String(page),
  });

  if (search) {
    params.set("search", search);
  }

  const swrKey = USE_SAMPLE_DATA ? null: `/api/risky-products?${params.toString()}`;

  const {
    data: apiData,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<RiskyProductsResponse>(swrKey, fetcher, {
    refreshInterval: REFRESH_INTERVAL_MS,

    keepPreviousData: false,

    revalidateOnFocus: false,

    onSuccess: () => setLastUpdated(new Date()),
  });

  const data = USE_SAMPLE_DATA
    ? (samplke_response as RiskyProductsResponse)
    : error
      ? undefined
      : apiData

  const visibleProducts = useMemo(() => {
    const products = data?.products ?? [];

    if (!USE_SAMPLE_DATA || !search) {
      return products;
    }

    const normalizedSearch = search.toLowerCase();

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.product_id.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [data?.products, search]);

  const calculatedSummary = useMemo<RiskSummary>(() => {
    return visibleProducts.reduce<RiskSummary>(
      (summary, product) => {
        const risk = calculateStockoutRisk(product);

        summary[risk.level] += 1;

        return summary;
      },
      {
        total: visibleProducts.length,
        high: 0,
        medium: 0,
        low: 0,
      },
    );
  }, [visibleProducts]);

  const refreshAll = async () => {
    if (USE_SAMPLE_DATA) {
      setLastUpdated(new Date());
      return;
    }

    await mutate();
  };

  const showSkeleton =!USE_SAMPLE_DATA && isLoading && !data && !error

  const isRefreshing = !USE_SAMPLE_DATA && isValidating;

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50/80 via-slate-50 to-white">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 px-5 py-4 text-white shadow-md shadow-indigo-200/50 sm:px-6">
          <div
            className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -bottom-32 right-48 size-72 rounded-full bg-violet-300/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-inner ring-1 ring-white/20 backdrop-blur">
                <BarChart3 className="size-5" aria-hidden="true" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    Stock risk monitor
                  </h1>

                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium ring-1 ring-white/20">
                    Synthetic demo
                  </span>
                </div>

                <p className="mt-1 max-w-3xl text-xs text-indigo-100 sm:text-sm">
                  Stockout risk based on current inventory, recent sales
                  velocity and incoming replenishment.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-xs text-indigo-100" aria-live="polite">
                {isRefreshing
                  ? "Refreshing…"
                  : lastUpdated
                    ? `Updated ${timeFormat.format(lastUpdated)}`
                    : null}
              </p>

              <Button
                variant="secondary"
                onClick={refreshAll}
                disabled={isRefreshing}
                className="border-0 bg-white/90 text-indigo-700 shadow-sm hover:bg-white"
              >
                <RefreshCw
                  className={cn("size-4", isRefreshing && "animate-spin")}
                  aria-hidden="true"
                />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        {/* Summary cards */}
        <RiskSummaryStats summary={calculatedSummary} />

        {/* Main table card */}
        <section
          aria-label="At-risk products"
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40"
        >
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                At-risk products
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Click a column header to sort ascending or descending.
              </p>
            </div>

            <div className="relative w-full lg:max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />

              <label htmlFor="product-search" className="sr-only">
                Search products
              </label>

              <Input
                id="product-search"
                type="search"
                placeholder="Search by product ID or name..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="h-11 rounded-xl border-slate-200 bg-slate-50/70 pl-10 pr-10 shadow-sm transition focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {!USE_SAMPLE_DATA && error && (
            <div
              role="alert"
              className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700"
            >
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />

              <span>{error.message}. </span>

              <button
                type="button"
                onClick={() => mutate()}
                className="font-medium underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          )}

          <div
            className={cn(
              "overflow-x-auto transition-opacity",
              isRefreshing && data && "opacity-60",
            )}
          >
            <ProductsTable
              products={visibleProducts}
              isLoading={showSkeleton}
              pageSize={data?.page_size ?? 10}
            />
          </div>

          {data && !search && (
            <div className="border-t border-slate-200 bg-slate-50/50">
              <TablePagination
                page={data.page}
                totalPages={data.total_pages}
                totalRecords={data.total_records}
                pageSize={data.page_size}
                hasPrevious={data.has_previous_page}
                hasNext={data.has_next_page}
                onPageChange={setPage}
              />
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
