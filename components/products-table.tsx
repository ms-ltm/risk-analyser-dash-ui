import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, PackageSearch,} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { RiskBadge } from "@/components/risk-badge"
import { ProductInfoCard, RiskInfoCard,} from "@/components/info-hover-cards"
import { cn } from "@/lib/utils"
import { getDaysLeft,  type RiskLevel, type RiskyProduct,} from "@/lib/risk-types"
import { calculateStockoutRisk, getNextReplenishment, } from "@/lib/calculate-stockout-risk"

const numberFormat = new Intl.NumberFormat("en-US")

const decimalFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

const dateTimeFormat = new Intl.DateTimeFormat(
  "en-US",
  {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
)

function LastAnalyzed({ value,}: { value: string}) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return (
      <span className="text-muted-foreground">
        —
      </span>
    )
  }

  return (
    <time
      dateTime={value}
      title={date.toISOString()}
      className="tabular-nums text-muted-foreground"
    >
      {dateTimeFormat.format(date)}
    </time>
  )
}

function DaysLeft({ days, outOfStock,}: {  days: number | null
  outOfStock: boolean }) {
  if (days === null && !outOfStock) {
    return (
      <span className="text-slate-400">
        —
      </span>
    )
  }

  const normalizedDays = days ?? 0

  return (
    <span
      className={cn(
        "whitespace-nowrap tabular-nums",
        outOfStock &&
          "font-semibold text-red-600",
        !outOfStock &&
          normalizedDays <= 7 &&
          "font-semibold text-red-600",
        !outOfStock &&
          normalizedDays > 7 &&
          normalizedDays <= 21 &&
          "font-semibold text-amber-600",
        !outOfStock &&
          normalizedDays > 21 &&
          "font-medium text-slate-700",
      )}
    >
      {outOfStock
        ? "Out of stock"
        : normalizedDays === 0
          ? "< 1 day"
          : `${normalizedDays} ${
              normalizedDays === 1
                ? "day"
                : "days"
            }`}
    </span>
  )
}

function IncomingReplenishment({ product,}: { product: RiskyProduct}) {
  const incoming = getNextReplenishment(product)

  if (!incoming) {
    return (
      <span className="text-muted-foreground">
        None
      </span>
    )
  }

  const dayLabel =  incoming.daysUntilArrival === 1 ? "day" : "days"

  return (
    <span
      className="whitespace-nowrap font-medium tabular-nums"
      title={`${numberFormat.format(
        incoming.quantity,
      )} units expected in ${
        incoming.daysUntilArrival
      } ${dayLabel}`}
    >
      {numberFormat.format(incoming.quantity)}
      {" / "}
      {incoming.daysUntilArrival}d
    </span>
  )
}

interface ProductsTableProps {
  products: RiskyProduct[]
  isLoading: boolean
  pageSize?: number
}

type SortKey =
  | "product"
  | "stock"
  | "daysLeft"
  | "salesVelocity"
  | "replenishment"

type SortDirection = "asc" | "desc"

function compareNullableNumbers( firstValue: number | null, secondValue: number | null,) {
  if ( firstValue === null && secondValue === null) {
    return 0
  }

  if (firstValue === null) {
    return 1
  }

  if (secondValue === null) {
    return -1
  }

  return firstValue - secondValue
}

export function ProductsTable({ products, isLoading, pageSize = 10,}: ProductsTableProps) {
  const [sortKey, setSortKey] =
    useState<SortKey | null>(null)

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(
        (currentDirection) =>
          currentDirection === "asc"
            ? "desc"
            : "asc",
      )
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const productsWithCalculatedRisk =
    useMemo(() => {
      return products.map((product) => ({
        product,
        calculatedRisk:
          calculateStockoutRisk(product),
      }))
    }, [products])

  const sortedProducts = useMemo(() => {
    if (!sortKey) {
      return productsWithCalculatedRisk
    }

    return [
      ...productsWithCalculatedRisk,
    ].sort((firstItem, secondItem) => {
      const a = firstItem.product
      const b = secondItem.product

      let comparison = 0

      if (sortKey === "product") {
        comparison = a.name.localeCompare(
          b.name,
          undefined,
          {
            sensitivity: "base",
          },
        )
      } else if (sortKey === "stock") {
        comparison = a.inventory.current_stock - b.inventory.current_stock
      } else if (sortKey === "daysLeft") {
        const aDays = a.inventory.current_stock <= 0 ? 0 : getDaysLeft(a)

        const bDays = b.inventory.current_stock <= 0 ? 0 : getDaysLeft(b)

        comparison = compareNullableNumbers( aDays, bDays, )
      } else if ( sortKey === "salesVelocity") {
        comparison = a.sales_velocity - b.sales_velocity
      } else if ( sortKey === "replenishment" ) {
        const aReplenishment = getNextReplenishment(a)

        const bReplenishment = getNextReplenishment(b)

        comparison =  compareNullableNumbers( aReplenishment ?.daysUntilArrival ?? null, bReplenishment ?.daysUntilArrival ?? null,)

        if ( comparison === 0 && aReplenishment && bReplenishment) {
          comparison = aReplenishment.quantity - bReplenishment.quantity
        }
      }

      if (sortDirection === "asc") {
        return comparison
      }

      return comparison * -1
    })
  }, [
    productsWithCalculatedRisk,
    sortKey,
    sortDirection,
  ])

  const SortIcon = ({ column,}: { column: SortKey}) => {
    if (sortKey !== column) {
      return (
        <ArrowUpDown
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      )
    }

    if (sortDirection === "asc") {
      return (
        <ArrowUp
          className="size-4"
          aria-hidden="true"
        />
      )
    }

    return (
      <ArrowDown
        className="size-4"
        aria-hidden="true"
      />
    )
  }

  return (
    <Table className="min-w-[1180px]">
      <TableHeader>
        <TableRow className="border-indigo-100 bg-indigo-50/80 hover:bg-indigo-50/80">
          <TableHead className="min-w-56 pl-4">
            <button
              type="button"
              onClick={() =>
                handleSort("product")
              }
              className="flex items-center gap-1 font-semibold text-indigo-900 transition hover:text-indigo-600">
              Product
              <SortIcon column="product" />
            </button>
          </TableHead>

          <TableHead className="text-right">
            <button
              type="button"
              onClick={() =>
                handleSort("stock")
              }
              className="ml-auto flex items-center justify-end gap-1 font-semibold text-indigo-900 transition hover:text-indigo-600">
              Stock
              <SortIcon column="stock" />
            </button>
          </TableHead>

          <TableHead className="text-right">
            <button
              type="button"
              onClick={() =>
                handleSort("daysLeft")
              }
              className="ml-auto flex items-center justify-end gap-1 font-semibold text-indigo-900 transition hover:text-indigo-600">
              Days left
              <SortIcon column="daysLeft" />
            </button>
          </TableHead>

          <TableHead className="text-right">
            <button
              type="button"
              onClick={() =>
                handleSort(
                  "salesVelocity",
                )
              }
              className="ml-auto flex items-center justify-end gap-1 font-semibold text-indigo-900 transition hover:text-indigo-600">
              Sales/Day
              <SortIcon column="salesVelocity" />
            </button>
          </TableHead>

          <TableHead className="text-right">
            <button
              type="button"
              onClick={() =>
                handleSort(
                  "replenishment",
                )
              }
              className="ml-auto flex items-center justify-end gap-1 font-semibold text-indigo-900 transition hover:text-indigo-600"
              title="Incoming quantity / days until next replenishment">
              Incoming
              <SortIcon column="replenishment" />
            </button>
          </TableHead>

          <TableHead className="font-semibold text-indigo-900">  Risk </TableHead>
          <TableHead className="min-w-80 font-semibold text-indigo-900">  Reason </TableHead>
          <TableHead className="pr-4 font-semibold text-indigo-900"> Last analyzed </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading ? (
          Array.from({
            length: pageSize,
          }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="pl-4">
                <Skeleton className="mb-1.5 h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </TableCell>

              <TableCell> <Skeleton className="ml-auto h-4 w-12" /></TableCell>
              <TableCell> <Skeleton className="ml-auto h-4 w-14" /> </TableCell>
              <TableCell> <Skeleton className="ml-auto h-4 w-14" /> </TableCell>
              <TableCell> <Skeleton className="ml-auto h-4 w-16" /> </TableCell>
              <TableCell> <Skeleton className="h-6 w-24" /> </TableCell>
              <TableCell> <Skeleton className="h-4 w-full" /> </TableCell>
              <TableCell className="pr-4"> <Skeleton className="h-4 w-24" /> </TableCell>
            </TableRow>
          ))
        ) : sortedProducts.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={8}
              className="h-48 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <PackageSearch className="size-8" aria-hidden="true"/>
                <p className="text-sm"> No products match your search.  </p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          sortedProducts.map(
            ({
              product,
              calculatedRisk,
            }) => {
              const productWithCalculatedRisk: RiskyProduct =
                {
                  ...product,
                  risk_analysis: {
                    ...product.risk_analysis,
                    overall_risk:
                      calculatedRisk.level,
                    reason:
                      calculatedRisk.reason,
                  },
                }

              return (
                <TableRow
                  key={product.product_id}
                  className={ cn("align-top transition-colors",
                          calculatedRisk.level === "high" && "bg-red-50/20 hover:bg-red-50/60",
                          calculatedRisk.level === "medium" && "bg-amber-50/20 hover:bg-amber-50/60",
                          calculatedRisk.level === "low" && "hover:bg-emerald-50/40",
                  )}
                >
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-900">
                        {product.name}
                      </span>

                      <ProductInfoCard
                        product={product}
                      />
                    </div>

                    <div className="mt-1 font-mono text-xs text-slate-400">
                      {product.product_id}
                    </div>
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    {numberFormat.format(
                      product.inventory
                        .current_stock,
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <DaysLeft
                      days={getDaysLeft(
                        product,
                      )}
                      outOfStock={
                        product.inventory
                          .current_stock <= 0
                      }
                    />
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    {decimalFormat.format(
                      product.sales_velocity,
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <IncomingReplenishment
                      product={product}
                    />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <RiskBadge
                        level={
                          calculatedRisk.level
                        }
                      />

                      <RiskInfoCard
                        product={
                          productWithCalculatedRisk
                        }
                      />
                    </div>
                  </TableCell>

                  <TableCell className="max-w-xl whitespace-normal text-sm leading-6 text-slate-600">
                    {calculatedRisk.reason}
                  </TableCell>

                  <TableCell className="whitespace-nowrap pr-4 text-sm">
                    <LastAnalyzed
                      value={
                        product.analyzed_at
                      }
                    />
                  </TableCell>
                </TableRow>
              )
            },
          )
        )}
      </TableBody>
    </Table>
  )
}