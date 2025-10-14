"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, RotateCcw } from "lucide-react"

// Update the FilterState type to include all filter categories
export type FilterState = {
  searchTerm: string
  categories: Record<string, boolean>
  exteriors: Record<string, boolean>
  storage: Record<string, boolean>
  special: Record<string, boolean>
  types: Record<string, boolean>
  storageUnits: Record<string, boolean>
}

// Update the InventoryFilters component to include all filter categories
export function InventoryFilters({
  onFilterChange,
  storageUnitNames = [], // Add parameter to receive available storage unit names
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

  // New state for specific storage units
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
    <div className="space-y-6 rounded-lg border border-gray-800 bg-gray-900 p-4 shadow-lg">
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search items..."
            className="bg-gray-800 pl-9 border-gray-700 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Accordion
        type="multiple"
        defaultValue={["storage", "category", "type"]}
        className="space-y-2"
      >

        <AccordionItem value="storage" className="border-gray-800">
          <AccordionTrigger className="hover:text-blue-400 hover:no-underline">Storage Location</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="storage-inventory"
                  checked={storage["Main Inventory"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleStorageChange("Main Inventory", checked === true)}
                />
                <Label htmlFor="storage-inventory">Main Inventory</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="storage-units"
                  checked={storage["Storage Units"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleStorageChange("Storage Units", checked === true)}
                />
                <Label htmlFor="storage-units">Storage Units</Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="category" className="border-gray-800">
          <AccordionTrigger className="hover:text-blue-400 hover:no-underline">Category</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="category-weapon"
                  checked={categories.weapon}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleCategoryChange("weapon", checked === true)}
                />
                <Label htmlFor="category-weapon">Weapons</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="category-sticker"
                  checked={categories.sticker}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleCategoryChange("sticker", checked === true)}
                />
                <Label htmlFor="category-sticker">Stickers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="category-container"
                  checked={categories.container}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleCategoryChange("container", checked === true)}
                />
                <Label htmlFor="category-container">Containers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="category-agent"
                  checked={categories.agent}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleCategoryChange("agent", checked === true)}
                />
                <Label htmlFor="category-agent">Agents</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="category-charm"
                  checked={categories.charm}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleCategoryChange("charm", checked === true)}
                />
                <Label htmlFor="category-charm">Charms</Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="type" className="border-gray-800">
          <AccordionTrigger className="hover:text-blue-400 hover:no-underline">Weapon Type</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="type-knife"
                  checked={types["Knives"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleTypeChange("Knives", checked === true)}
                />
                <Label htmlFor="type-knife">Knives</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="type-glove"
                  checked={types["Gloves"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleTypeChange("Gloves", checked === true)}
                />
                <Label htmlFor="type-glove">Gloves</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="type-pistol"
                  checked={types["Pistols"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleTypeChange("Pistols", checked === true)}
                />
                <Label htmlFor="type-pistol">Pistols</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="type-smg"
                  checked={types["SMGs"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleTypeChange("SMGs", checked === true)}
                />
                <Label htmlFor="type-smg">SMGs</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="type-rifle"
                  checked={types["Rifles"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleTypeChange("Rifles", checked === true)}
                />
                <Label htmlFor="type-rifle">Rifles</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="type-shotgun"
                  checked={types["Heavy"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleTypeChange("Heavy", checked === true)}
                />
                <Label htmlFor="type-shotgun">Shotguns</Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="exterior" className="border-gray-800">
          <AccordionTrigger className="hover:text-blue-400 hover:no-underline">Wear Condition</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exterior-fn"
                  checked={exteriors["Factory New"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleExteriorChange("Factory New", checked === true)}
                />
                <Label htmlFor="exterior-fn">Factory New</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exterior-mw"
                  checked={exteriors["Minimal Wear"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleExteriorChange("Minimal Wear", checked === true)}
                />
                <Label htmlFor="exterior-mw">Minimal Wear</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exterior-ft"
                  checked={exteriors["Field-Tested"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleExteriorChange("Field-Tested", checked === true)}
                />
                <Label htmlFor="exterior-ft">Field-Tested</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exterior-ww"
                  checked={exteriors["Well-Worn"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleExteriorChange("Well-Worn", checked === true)}
                />
                <Label htmlFor="exterior-ww">Well-Worn</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exterior-bs"
                  checked={exteriors["Battle-Scarred"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleExteriorChange("Battle-Scarred", checked === true)}
                />
                <Label htmlFor="exterior-bs">Battle-Scarred</Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {Object.keys(storageUnits).length > 0 && (
          <AccordionItem value="storageUnits" className="border-gray-800">
            <AccordionTrigger className="hover:text-blue-400">Storage Units</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {Object.keys(storageUnits).map((unit) => (
                  <div key={unit} className="flex items-center space-x-2">
                    <Checkbox
                      id={`storage-unit-${unit.toLowerCase().replace(/\s+/g, "-")}`}
                      checked={storageUnits[unit]}
                      onCheckedChange={(checked: Boolean | "indeterminate") => handleStorageUnitChange(unit, checked === true)}
                    />
                    <Label htmlFor={`storage-unit-${unit.toLowerCase().replace(/\s+/g, "-")}`}>{unit}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="special" className="border-gray-800">
          <AccordionTrigger className="hover:text-blue-400 hover:no-underline">Special Attributes</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="special-stattrak"
                  checked={special["StatTrak™"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleSpecialChange("StatTrak™", checked === true)}
                />
                <Label htmlFor="special-stattrak">StatTrak™</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="special-souvenir"
                  checked={special["Souvenir"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleSpecialChange("Souvenir", checked === true)}
                />
                <Label htmlFor="special-souvenir">Souvenir</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="special-stickered"
                  checked={special["Stickers Applied"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleSpecialChange("Stickers Applied", checked === true)}
                />
                <Label htmlFor="special-stickered">Stickers Applied</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="special-nametag"
                  checked={special["Name Tag"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleSpecialChange("Name Tag", checked === true)}
                />
                <Label htmlFor="special-nametag">Name Tag</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="special-tradable"
                  checked={special["Tradable"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleSpecialChange("Tradable", checked === true)}
                />
                <Label htmlFor="special-tradable">Tradable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="special-tradeprotected"
                  checked={special["Trade Protected"]}
                  onCheckedChange={(checked: Boolean | "indeterminate") => handleSpecialChange("Trade Protected", checked === true)}
                />
                <Label htmlFor="special-tradeprotected">Trade Protected</Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1 w-full text-gray-200 border-gray-700 bg-red-500 hover:bg-red-700"
          onClick={resetFilters}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>
    </div>
  )
}

