"use client"

import type { InventoryItem } from "@/lib/steam-api"

export function InventoryStats({
  steamId,
  items = [],
  storageUnits = 0,
  filteredValue = 0,
  currencies,
  selectedCurrency,
  hideId = false, // Add this prop to optionally hide the Steam ID
}: {
  steamId?: string | null
  items?: InventoryItem[]
  storageUnits?: number
  filteredValue?: number
  currencies: { code: string; char: string; rate: number; icon: React.ReactNode }[]
  selectedCurrency?: string
  hideId?: boolean
}) {
  // Calculate stats from items
  const itemCount = items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);

  // Count storage units
  const storageUnitCount = storageUnits || 0

  // Calculate total value (Steam prices)
  const totalValue = items.reduce((sum, item) => sum + (item.steam_price || 0) * (item.quantity || 1), 0).toFixed(2)

  return (
    <div className={`grid gap-4 ${hideId ? "grid-cols-4 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-5"}`}>
      {!hideId && (
        <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
          <h3 className="text-sm font-medium text-gray-400">Steam ID</h3>
          <p className="mt-1 text-xl font-bold truncate">{steamId || "Not authenticated"}</p>
        </div>
      )}
      <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
        <h3 className="text-sm font-medium text-gray-400">Total Items</h3>
        <p className="mt-1 text-2xl font-bold">{itemCount}</p>
      </div>
      <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
        <h3 className="text-sm font-medium text-gray-400">Storage Units Loaded</h3>
        <p className="mt-1 text-2xl font-bold">{storageUnitCount}</p>
      </div>
      <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
        <h3 className="text-sm font-medium text-gray-400">Filtered Value</h3>
        <p className="mt-1 text-2xl font-bold text-green-500">{currencies.find(c => c.code === selectedCurrency)?.char}{filteredValue.toFixed(2)}</p>
      </div>
      <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
        <h3 className="text-sm font-medium text-gray-400">Total Value</h3>
        <p className="mt-1 text-2xl font-bold text-green-500">{currencies.find(c => c.code === selectedCurrency)?.char}{totalValue}</p>
      </div>
    </div>
  )
}