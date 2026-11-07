import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TablePaginationProps {
  page: number
  totalPages: number
  totalRecords: number
  pageSize: number
  hasPrevious: boolean
  hasNext: boolean
  onPageChange: (page: number) => void
}

export function TablePagination({
  page,
  totalPages,
  totalRecords,
  pageSize,
  hasPrevious,
  hasNext,
  onPageChange,
}: TablePaginationProps) {
  const start = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalRecords)

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row"
    >
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}</span>
        {"–"}
        <span className="font-medium text-foreground">{end}</span> of{" "}
        <span className="font-medium text-foreground">{totalRecords}</span> products
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-sm" onClick={() => onPageChange(1)} disabled={!hasPrevious} aria-label="First page">
          <ChevronsLeft />
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => onPageChange(page - 1)} disabled={!hasPrevious} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        <span className="px-3 text-sm tabular-nums" aria-live="polite">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <Button variant="outline" size="icon-sm" onClick={() => onPageChange(page + 1)} disabled={!hasNext} aria-label="Next page">
          <ChevronRight />
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => onPageChange(totalPages)} disabled={!hasNext} aria-label="Last page">
          <ChevronsRight />
        </Button>
      </div>
    </nav>
  )
}
