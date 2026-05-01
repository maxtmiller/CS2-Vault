"use client"

import { useState, useEffect, useRef } from "react"
import type { InventoryItem } from "@/lib/steam-api"
import { Package, Database, TrendingUp, Layers } from "lucide-react"

function useCountUp(target: number, duration = 650) {
  const [current, setCurrent] = useState(target)
  const prevRef = useRef(target)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const from = prevRef.current
    const startTime = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(from + (target - from) * eased)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        prevRef.current = target
      }
    }

    if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration])

  return current
}

export function InventoryStats({
  steamId,
  items = [],
  storageUnits = 0,
  filteredValue = 0,
  currencies,
  selectedCurrency,
  hideId = false,
}: {
  steamId?: string | null
  items?: InventoryItem[]
  storageUnits?: number
  filteredValue?: number
  currencies: { code: string; char: string; rate: number; icon: React.ReactNode }[]
  selectedCurrency?: string
  hideId?: boolean
}) {
  const itemCount = items.reduce((sum, item) => sum + (item.quantity ?? 1), 0)
  const totalValue = items
    .reduce((sum, item) => sum + (item.steam_price || 0) * (item.quantity || 1), 0)
  const currencyChar = currencies.find(c => c.code === selectedCurrency)?.char ?? "$"

  const animatedItemCount = useCountUp(itemCount)
  const animatedStorageUnits = useCountUp(storageUnits)
  const animatedFilteredValue = useCountUp(filteredValue)
  const animatedTotalValue = useCountUp(totalValue)

  const stats = [
    ...(!hideId && steamId
      ? [{ label: "Steam ID", value: steamId, icon: null, truncate: true }]
      : []),
    {
      label: "Total Items",
      value: Math.round(animatedItemCount).toLocaleString(),
      icon: <Package className="h-4 w-4 text-blue-400/70" />,
    },
    {
      label: "Storage Units",
      value: Math.round(animatedStorageUnits).toLocaleString(),
      icon: <Database className="h-4 w-4 text-purple-400/70" />,
    },
    {
      label: "Filtered Value",
      value: `${currencyChar}${animatedFilteredValue.toFixed(2)}`,
      icon: <TrendingUp className="h-4 w-4 text-green-400/70" />,
      accent: "text-green-400",
    },
    {
      label: "Total Value",
      value: `${currencyChar}${animatedTotalValue.toFixed(2)}`,
      icon: <Layers className="h-4 w-4 text-emerald-400/70" />,
      accent: "text-emerald-400",
    },
  ]

  const colCount = hideId ? 4 : 5

  return (
    <div className={`grid gap-3 grid-cols-2 ${colCount === 4 ? "sm:grid-cols-4" : "sm:grid-cols-5"}`}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-gray-800/60 bg-gradient-to-br from-gray-900 to-gray-950 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-none">
              {stat.label}
            </span>
            {stat.icon}
          </div>
          <p
            className={`text-xl font-bold truncate ${
              stat.accent ?? "text-white"
            }`}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  )
}
