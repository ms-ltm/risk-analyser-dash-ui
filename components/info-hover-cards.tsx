"use client"

import type { ReactNode } from "react"
import { Info } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { RiskBadge } from "@/components/risk-badge"
import { getRiskFactors, type RiskyProduct } from "@/lib/risk-types"

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 })
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 })
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : shortDate.format(date)
}

function InfoHoverCard({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <HoverCard>
      <HoverCardTrigger
        delay={150}
        render={
          <button
            type="button"
            aria-label={label}
            className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          />
        }
      >
        <Info className="size-3.5" aria-hidden="true" />
      </HoverCardTrigger>
      <HoverCardContent side="bottom" align="start" className={className ?? "w-80 p-3"}>
        {children}
      </HoverCardContent>
    </HoverCard>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}

export function RiskInfoCard({ product }: { product: RiskyProduct }) {
  const factors = getRiskFactors(product.risk_analysis)
  return (
    <InfoHoverCard label={`Risk breakdown for ${product.name}`} className="w-72 p-3">
      <Section title="Risk breakdown">
        {factors.length === 0 ? (
          <p className="text-xs text-muted-foreground">No individual risk factors available.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {factors.map((factor) => (
              <li key={factor.key} className="flex items-center justify-between gap-4 text-xs">
                <span>{factor.label}</span>
                <RiskBadge level={factor.level} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </InfoHoverCard>
  )
}

export function ProductInfoCard({ product }: { product: RiskyProduct }) {
  const { pricing, inventory, upcoming_replenishments = [], current_promotions = [] } = product
  return (
    <InfoHoverCard label={`Details for ${product.name}`}>
      <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
        <Section title="Pricing">
          {pricing ? (
            <>
              <Row label="MRP" value={currency.format(pricing.mrp)} />
              <Row label="Selling price" value={currency.format(pricing.sp)} />
              <Row label="Cost price" value={currency.format(pricing.cp)} />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Not available</p>
          )}
        </Section>

        <Section title="Inventory">
          <Row label="Current stock" value={number.format(inventory.current_stock)} />
          <Row label="Min stock" value={number.format(inventory.min_stock)} />
          <Row label="Max stock" value={number.format(inventory.max_stock)} />
        </Section>

        <Section title="Sales velocity">
          <Row label="Units / day" value={number.format(product.sales_velocity)} />
        </Section>

        <Section title={`Upcoming replenishments (${upcoming_replenishments.length})`}>
          {upcoming_replenishments.length === 0 ? (
            <p className="text-xs text-muted-foreground">None scheduled</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {upcoming_replenishments.map((r, i) => (
                <li key={`${r.expected_date}-${i}`} className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-muted-foreground">
                    {formatDate(r.expected_date)} · in {r.days_until_arrival}d
                  </span>
                  <span className="font-medium tabular-nums">+{number.format(r.quantity)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={`Current promotions (${current_promotions.length})`}>
          {current_promotions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No active promotions</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {current_promotions.map((p) => (
                <li key={p.promotion_id} className="flex flex-col gap-0.5 text-xs">
                  <span className="truncate font-mono text-[11px]">{p.promotion_id}</span>
                  <span className="text-muted-foreground">
                    {formatDate(p.start_date)} – {formatDate(p.end_date)}
                    {p.active ? " · Active" : " · Inactive"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </InfoHoverCard>
  )
}
