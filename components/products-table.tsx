import { PackageSearch } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { RiskBadge } from "@/components/risk-badge"
import { cn } from "@/lib/utils"
import { getDaysLeft, type RiskyProduct } from "@/lib/risk-types"

const numberFormat = new Intl.NumberFormat("en-US")

function DaysLeft({ days }: { days: number | null }) {
  if (days === null) return <span className="text-muted-foreground">—</span>
  return (
    <span
      className={cn(
        "tabular-nums",
        days <= 7 && "font-semibold text-red-600 dark:text-red-400",
        days > 7 && days <= 21 && "font-medium text-amber-700 dark:text-amber-400",
      )}
    >
      {days} {days === 1 ? "day" : "days"}
    </span>
  )
}

interface ProductsTableProps {
  products: RiskyProduct[]
  isLoading: boolean
  pageSize?: number
}

export function ProductsTable({ products, isLoading, pageSize = 10 }: ProductsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="min-w-56 pl-4">Product</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="text-right">Days left</TableHead>
          <TableHead>Risk</TableHead>
          <TableHead className="min-w-80 pr-4">Reason</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: pageSize }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="pl-4">
                <Skeleton className="mb-1.5 h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </TableCell>
              <TableCell><Skeleton className="ml-auto h-4 w-12" /></TableCell>
              <TableCell><Skeleton className="ml-auto h-4 w-14" /></TableCell>
              <TableCell><Skeleton className="h-6 w-24" /></TableCell>
              <TableCell className="pr-4"><Skeleton className="h-4 w-full" /></TableCell>
            </TableRow>
          ))
        ) : products.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={5} className="h-48 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <PackageSearch className="size-8" aria-hidden="true" />
                <p className="text-sm">No products match your search.</p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          products.map((product) => (
            <TableRow key={product.product_id} className="align-top">
              <TableCell className="pl-4">
                <div className="font-medium">{product.name}</div>
                <div className="font-mono text-xs text-muted-foreground">{product.product_id}</div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {numberFormat.format(product.inventory.current_stock)}
              </TableCell>
              <TableCell className="text-right">
                <DaysLeft days={getDaysLeft(product)} />
              </TableCell>
              <TableCell>
                <RiskBadge level={product.risk_analysis.overall_risk} />
              </TableCell>
              <TableCell className="max-w-xl whitespace-normal pr-4 text-sm leading-relaxed text-muted-foreground">
                {product.risk_analysis.reason}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
