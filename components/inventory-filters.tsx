"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, RotateCcw } from "lucide-react"


export type FilterState = {
  searchTerm: string
  categories: Record<string, boolean>
  exteriors: Record<string, boolean>
  storage: Record<string, boolean>
  special: Record<string, boolean>
  types: Record<string, boolean>
  storageUnits: Record<string, boolean>
}


export function InventoryFilters({
  onFilterChange,
  storageUnitNames = [],
}: {
  onFilterChange: (filters: FilterState) => void
  storageUnitNames?: string[]
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categories, setCategories] = useState({
    weapon: false,
    container: false,
    sticker: false,
    agent: false,
    charm: false,
  })
  const [exteriors, setExteriors] = useState({
    "Factory New": false,
    "Minimal Wear": false,
    "Field-Tested": false,
    "Well-Worn": false,
    "Battle-Scarred": false,
  })
  const [storage, setStorage] = useState({
    "Main Inventory": true,
    "Storage Units": true,
  })
  const [special, setSpecial] = useState({
    "StatTrak™": false,
    "Souvenir": false,
    "Stickers Applied": false,
    "Name Tag": false,
    "Tradable": false,
    "Trade Protected": false,
  })
  const [types, setTypes] = useState({
    Pistols: false,
    SMGs: false,
    Rifles: false,
    Heavy: false,
    Knives: false,
    Gloves: false
  })
  const [storageUnits, setStorageUnits] = useState<Record<string, boolean>>({})


  // Initialize storage units state when storageUnitNames changes
  useEffect(() => {
    if (storageUnitNames.length > 0) {
      const newStorageUnits: Record<string, boolean> = {}
      storageUnitNames.forEach((name) => {
        newStorageUnits[name] = false
      })
      setStorageUnits(newStorageUnits)
    }
  }, [storageUnitNames])


  // Update filters when any filter state changes
  useEffect(() => {
    onFilterChange({
      searchTerm,
      categories,
      exteriors,
      storage,
      special,
      types,
      storageUnits,
    })
  }, [searchTerm, categories, exteriors, storage, special, types, storageUnits, onFilterChange])


  // Handle checkbox changes
  const handleCategoryChange = (category: string, checked: boolean) => {
    setCategories((prev) => ({ ...prev, [category]: checked }))
  }

  const handleExteriorChange = (exterior: string, checked: boolean) => {
    setExteriors((prev) => ({ ...prev, [exterior]: checked }))
  }

  const handleStorageChange = (location: string, checked: boolean) => {
    setStorage((prev) => ({ ...prev, [location]: checked }))
  }

  const handleSpecialChange = (attribute: string, checked: boolean) => {
    setSpecial((prev) => ({ ...prev, [attribute]: checked }))
  }

  const handleTypeChange = (type: string, checked: boolean) => {
    setTypes((prev) => ({ ...prev, [type]: checked }))
  }

  const handleStorageUnitChange = (unit: string, checked: boolean) => {
    setStorageUnits((prev) => ({ ...prev, [unit]: checked }))
  }


  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("")
    setCategories({
      weapon: false,
      container: false,
      sticker: false,
      agent: false,
      charm: false,
    })
    setExteriors({
      "Factory New": false,
      "Minimal Wear": false,
      "Field-Tested": false,
      "Well-Worn": false,
      "Battle-Scarred": false,
    })
    setStorage({
      "Main Inventory": true,
      "Storage Units": true,
    })
    setSpecial({
      "StatTrak™": false,
      "Souvenir": false,
      "Stickers Applied": false,
      "Name Tag": false,
      "Tradable": false,
      "Trade Protected": false,
    })
    setTypes({
      Pistols: false,
      SMGs: false,
      Rifles: false,
      Heavy: false,
      Knives: false,
      Gloves: false
    })

    // Reset storage units
    const resetStorageUnits: Record<string, boolean> = {}
    Object.keys(storageUnits).forEach((unit) => {
      resetStorageUnits[unit] = false
    })
    setStorageUnits(resetStorageUnits)
  }


  return (
    <div className="space-y-4 rounded-xl border border-gray-800/60 bg-gray-900/80 p-4 shadow-lg">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Search items..."
          className="bg-gray-800/80 pl-9 border-gray-700/60 focus:border-blue-500 h-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Accordion
        type="multiple"
        defaultValue={["storage", "category", "type"]}
        className="space-y-1"
      >

        <AccordionItem value="storage" className="border-gray-800/60">
          <AccordionTrigger className="text-sm font-medium text-gray-300 hover:text-blue-400 hover:no-underline py-2.5">Storage Location</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {(["Main Inventory", "Storage Units"] as const).map((loc) => {
                const id = `storage-${loc.toLowerCase().replace(/\s+/g, "-")}`
                const checked = storage[loc]
                return (
                  <div key={loc} className="flex items-center space-x-2">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(c: Boolean | "indeterminate") => handleStorageChange(loc, c === true)}
                    />
                    <Label htmlFor={id} className={`text-sm cursor-pointer transition-colors ${checked ? "text-blue-400" : "text-gray-400"}`}>{loc}</Label>
                  </div>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="category" className="border-gray-800/60">
          <AccordionTrigger className="text-sm font-medium text-gray-300 hover:text-blue-400 hover:no-underline py-2.5">Category</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pb-1">
              {([
                ["category-weapon", "weapon", "Weapons", categories.weapon, handleCategoryChange],
                ["category-sticker", "sticker", "Stickers", categories.sticker, handleCategoryChange],
                ["category-container", "container", "Containers", categories.container, handleCategoryChange],
                ["category-agent", "agent", "Agents", categories.agent, handleCategoryChange],
                ["category-charm", "charm", "Charms", categories.charm, handleCategoryChange],
              ] as [string, string, string, boolean, (k: string, v: boolean) => void][]).map(([id, key, label, checked, handler]) => (
                <div key={id} className="flex items-center space-x-2">
                  <Checkbox id={id} checked={checked} onCheckedChange={(c) => handler(key, c === true)} />
                  <Label htmlFor={id} className={`text-sm cursor-pointer transition-colors ${checked ? "text-blue-400" : "text-gray-400"}`}>{label}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="type" className="border-gray-800/60">
          <AccordionTrigger className="text-sm font-medium text-gray-300 hover:text-blue-400 hover:no-underline py-2.5">Weapon Type</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pb-1">
              {([
                ["type-knife", "Knives", types["Knives"]],
                ["type-glove", "Gloves", types["Gloves"]],
                ["type-pistol", "Pistols", types["Pistols"]],
                ["type-smg", "SMGs", types["SMGs"]],
                ["type-rifle", "Rifles", types["Rifles"]],
                ["type-shotgun", "Heavy", types["Heavy"]],
              ] as [string, string, boolean][]).map(([id, key, checked]) => (
                <div key={id} className="flex items-center space-x-2">
                  <Checkbox id={id} checked={checked} onCheckedChange={(c) => handleTypeChange(key, c === true)} />
                  <Label htmlFor={id} className={`text-sm cursor-pointer transition-colors ${checked ? "text-blue-400" : "text-gray-400"}`}>
                    {key === "Heavy" ? "Shotguns / LMGs" : key}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="exterior" className="border-gray-800/60">
          <AccordionTrigger className="text-sm font-medium text-gray-300 hover:text-blue-400 hover:no-underline py-2.5">Wear Condition</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pb-1">
              {(["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"] as const).map((wear) => {
                const id = `exterior-${wear.toLowerCase().replace(/\s+/g, "-").replace(/-/g, "")}`
                const checked = exteriors[wear]
                return (
                  <div key={wear} className="flex items-center space-x-2">
                    <Checkbox id={id} checked={checked} onCheckedChange={(c) => handleExteriorChange(wear, c === true)} />
                    <Label htmlFor={id} className={`text-sm cursor-pointer transition-colors ${checked ? "text-blue-400" : "text-gray-400"}`}>{wear}</Label>
                  </div>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {Object.keys(storageUnits).length > 0 && (
          <AccordionItem value="storageUnits" className="border-gray-800/60">
            <AccordionTrigger className="text-sm font-medium text-gray-300 hover:text-blue-400 hover:no-underline py-2.5">Storage Units</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pb-1">
                {Object.keys(storageUnits).map((unit) => {
                  const id = `storage-unit-${unit.toLowerCase().replace(/\s+/g, "-")}`
                  const checked = storageUnits[unit]
                  return (
                    <div key={unit} className="flex items-center space-x-2">
                      <Checkbox id={id} checked={checked} onCheckedChange={(c) => handleStorageUnitChange(unit, c === true)} />
                      <Label htmlFor={id} className={`text-sm cursor-pointer transition-colors ${checked ? "text-blue-400" : "text-gray-400"}`}>{unit}</Label>
                    </div>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="special" className="border-gray-800/60">
          <AccordionTrigger className="text-sm font-medium text-gray-300 hover:text-blue-400 hover:no-underline py-2.5">Special Attributes</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pb-1">
              {(["StatTrak™", "Souvenir", "Stickers Applied", "Name Tag", "Tradable", "Trade Protected"] as const).map((attr) => {
                const id = `special-${attr.toLowerCase().replace(/[™\s]+/g, "-")}`
                const checked = special[attr]
                return (
                  <div key={attr} className="flex items-center space-x-2">
                    <Checkbox id={id} checked={checked} onCheckedChange={(c) => handleSpecialChange(attr, c === true)} />
                    <Label htmlFor={id} className={`text-sm cursor-pointer transition-colors ${checked ? "text-blue-400" : "text-gray-400"}`}>{attr}</Label>
                  </div>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 w-full text-gray-400 hover:text-white hover:bg-gray-800/60 border border-gray-800/60 mt-1"
        onClick={resetFilters}
      >
        <RotateCcw className="h-3 w-3" />
        Reset Filters
      </Button>
    </div>
  )
}
