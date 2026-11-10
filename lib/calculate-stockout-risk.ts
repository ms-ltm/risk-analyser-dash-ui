import type {
  RiskLevel,
  RiskyProduct,
} from "@/lib/risk-types"

const numberFormat = new Intl.NumberFormat("en-US")

const decimalFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

export interface NextReplenishment {
  quantity: number
  daysUntilArrival: number
  expectedDate: string | null
}

export interface CalculatedRisk {
  level: RiskLevel
  reason: string
  stockCoverageDays: number | null
  coverageGapDays: number | null
}

export function getNextReplenishment(
  product: RiskyProduct,
): NextReplenishment | null {
  const replenishments =
    product.upcoming_replenishments ?? []

  const validReplenishments =
    replenishments.filter(
      (replenishment) =>
        Number.isFinite(
          replenishment.days_until_arrival,
        ) &&
        replenishment.days_until_arrival >= 0 &&
        Number.isFinite(
          replenishment.quantity,
        ) &&
        replenishment.quantity > 0,
    )

  if (validReplenishments.length === 0) {
    return null
  }

  const earliestDays = Math.min(
    ...validReplenishments.map(
      (replenishment) =>
        replenishment.days_until_arrival,
    ),
  )

  const earliestReplenishments =
    validReplenishments.filter(
      (replenishment) =>
        replenishment.days_until_arrival ===
        earliestDays,
    )

  const totalQuantity =
    earliestReplenishments.reduce(
      (total, replenishment) =>
        total + replenishment.quantity,
      0,
    )

  return {
    quantity: totalQuantity,
    daysUntilArrival: earliestDays,
    expectedDate:
      earliestReplenishments[0]
        ?.expected_date ?? null,
  }
}

export function getStockCoverage(
  product: RiskyProduct,
): number | null {
  const currentStock =
    product.inventory.current_stock

  const salesVelocity =
    product.sales_velocity

  if (
    !Number.isFinite(currentStock) ||
    !Number.isFinite(salesVelocity) ||
    salesVelocity <= 0
  ) {
    return null
  }

  if (currentStock <= 0) {
    return 0
  }

  return currentStock / salesVelocity
}

export function calculateStockoutRisk(
  product: RiskyProduct,
): CalculatedRisk {
  const currentStock =
    product.inventory.current_stock

  const salesVelocity =
    product.sales_velocity

  const nextReplenishment =
    getNextReplenishment(product)

  /*
   * Rule 1:
   * Already out of stock means High risk.
   */
  if (currentStock <= 0) {
    if (nextReplenishment) {
      return {
        level: "high",
        stockCoverageDays: 0,
        coverageGapDays:
          nextReplenishment.daysUntilArrival,
        reason:
          `Current stock is zero, so the product is already out of stock. ` +
          `${numberFormat.format(
            nextReplenishment.quantity,
          )} units are expected in ` +
          `${nextReplenishment.daysUntilArrival} day${
            nextReplenishment.daysUntilArrival ===
            1
              ? ""
              : "s"
          }.`,
      }
    }

    return {
      level: "high",
      stockCoverageDays: 0,
      coverageGapDays: null,
      reason:
        "Current stock is zero, so the product is already out of stock. No upcoming replenishment is scheduled.",
    }
  }

  /*
   * A valid positive sales velocity is required
   * to calculate stock coverage.
   */
  if (
    !Number.isFinite(salesVelocity) ||
    salesVelocity <= 0
  ) {
    return {
      level: "low",
      stockCoverageDays: null,
      coverageGapDays: null,
      reason:
        "Current stock is available, but there is no positive recent sales velocity. Stock coverage cannot be calculated from the available data.",
    }
  }

  const stockCoverageDays =
    currentStock / salesVelocity

  /*
   * Rules when no replenishment is scheduled.
   */
  if (!nextReplenishment) {
    if (stockCoverageDays <= 7) {
      return {
        level: "high",
        stockCoverageDays,
        coverageGapDays: null,
        reason:
          `Current stock is ${numberFormat.format(
            currentStock,
          )} units and recent sales velocity is ` +
          `${decimalFormat.format(
            salesVelocity,
          )} units/day. Stock provides approximately ` +
          `${decimalFormat.format(
            stockCoverageDays,
          )} days of coverage, and no replenishment is scheduled.`,
      }
    }

    if (stockCoverageDays <= 14) {
      return {
        level: "medium",
        stockCoverageDays,
        coverageGapDays: null,
        reason:
          `Current stock provides approximately ${decimalFormat.format(
            stockCoverageDays,
          )} days of coverage at ` +
          `${decimalFormat.format(
            salesVelocity,
          )} units/day. No replenishment is scheduled, so replenishment should be planned.`,
      }
    }

    return {
      level: "low",
      stockCoverageDays,
      coverageGapDays: null,
      reason:
        `Current stock provides approximately ${decimalFormat.format(
          stockCoverageDays,
        )} days of coverage at ` +
        `${decimalFormat.format(
          salesVelocity,
        )} units/day. No replenishment is scheduled, but current coverage exceeds 14 days.`,
    }
  }

  /*
   * Coverage gap:
   *
   * next shipment days - stock coverage days
   */
  const coverageGapDays =
    nextReplenishment.daysUntilArrival -
    stockCoverageDays

  /*
   * Gap greater than 3 days means High risk.
   */
  if (coverageGapDays > 3) {
    return {
      level: "high",
      stockCoverageDays,
      coverageGapDays,
      reason:
        `Current stock is ${numberFormat.format(
          currentStock,
        )} units at ` +
        `${decimalFormat.format(
          salesVelocity,
        )} units/day, providing approximately ` +
        `${decimalFormat.format(
          stockCoverageDays,
        )} days of coverage. The next replenishment of ` +
        `${numberFormat.format(
          nextReplenishment.quantity,
        )} units arrives in ` +
        `${nextReplenishment.daysUntilArrival} days, leaving a ` +
        `${decimalFormat.format(
          coverageGapDays,
        )}-day coverage gap.`,
    }
  }

  /*
   * Gap greater than 0 and at most 3 days
   * means Medium risk.
   */
  if (coverageGapDays > 0) {
    return {
      level: "medium",
      stockCoverageDays,
      coverageGapDays,
      reason:
        `Current stock provides approximately ${decimalFormat.format(
          stockCoverageDays,
        )} days of coverage. The next replenishment of ` +
        `${numberFormat.format(
          nextReplenishment.quantity,
        )} units arrives in ` +
        `${nextReplenishment.daysUntilArrival} days, leaving a ` +
        `${decimalFormat.format(
          coverageGapDays,
        )}-day coverage gap.`,
    }
  }

  /*
   * Gap less than or equal to zero
   * means Low risk.
   */
  const bufferDays =
    Math.abs(coverageGapDays)

  return {
    level: "low",
    stockCoverageDays,
    coverageGapDays,
    reason:
      `Current stock provides approximately ${decimalFormat.format(
        stockCoverageDays,
      )} days of coverage. The next replenishment of ` +
      `${numberFormat.format(
        nextReplenishment.quantity,
      )} units arrives in ` +
      `${nextReplenishment.daysUntilArrival} days, providing approximately ` +
      `${decimalFormat.format(
        bufferDays,
      )} days of buffer before current stock is exhausted.`,
  }
}