"use client"

import { useState, useEffect, useRef } from "react"
import { InventoryGrid } from "@/components/inventory-grid"
import { InventoryFilters, type FilterState } from "@/components/inventory-filters"
import { InventoryStats } from "@/components/inventory-stats"
import { LoadingInventory } from "@/components/loading-inventory"
import { UserProfile } from "@/components/user-profile"
import { fetchInventory, type InventoryItem } from "@/lib/steam-api"
import { Button } from "@/components/ui/button"
import { ChevronDown, Github, Linkedin, Instagram, Mail } from "lucide-react"
import { SteamIcon } from "@/components/steam-icon"
import { SelectedItems } from "@/components/selected-items"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { DollarSign, Euro, PoundSterling } from "lucide-react"


// Supported currencies
const currencies = [
  { code: "USD", char: "$", rate: 1, icon: <DollarSign className="mr-2 h-4 w-4 text-green-500" /> },
  { code: "EUR", char: "€", rate: 0.86, icon: <Euro className="mr-2 h-4 w-4 text-blue-500" /> },
  { code: "GBP", char: "£", rate: 0.75, icon: <PoundSterling className="mr-2 h-4 w-4 text-purple-500" /> },
];


export function Inventory({ steamId }: { steamId: string | null }) {
  const [loginType, setLoginType] = useState<string>("")
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    if (typeof window !== "undefined") {
      const storedCurrency = localStorage.getItem("selected_currency");
      return storedCurrency || "USD";
    }
    return "USD";
  });
  const [items, setItems] = useState<InventoryItem[]>([])
  const [storageUnits, setStorageUnits] = useState<number>()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filteredValue, setFilteredValue] = useState(0)
  const [visibleItems, setVisibleItems] = useState(24)
  const [isScrolled, setIsScrolled] = useState(false)
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([])
  const filterRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    categories: {
      weapon: false,
      container: false,
      sticker: false,
      agent: false,
      charm: false,
    },
    exteriors: {
      "Factory New": false,
      "Minimal Wear": false,
      "Field-Tested": false,
      "Well-Worn": false,
      "Battle-Scarred": false,
    },
    storage: {
      "Main Inventory": true,
      "Storage Units": true,
    },
    special: {
      "StatTrak™": false,
      Souvenir: false,
      "Stickers Applied": false,
      "Name Tag": false,
      "Tradable": false,
      "Trade Protected": false,
    },
    types: {
      Pistols: false,
      SMGs: false,
      Rifles: false,
      Heavy: false,
      Knives: false,
      Gloves: false,
      Case: false,
      Sticker: false,
      Key: false,
      Agent: false,
      "Music Kit": false,
      Patch: false,
      Graffiti: false,
    },
    storageUnits: {},
  })
  const currentPriceBaseRef = useRef("USD");
  const { toast } = useToast()


  // Function to handle logout and redirect to homepage
  const handleLogout = () => {
    localStorage.removeItem("login_type")
    localStorage.removeItem("inventory_data")
    fetch(`/api/auth/logout?steamid=${steamId}`, { method: "POST" })
      .then(() => {
        window.location.replace("/")
      })
      .catch((error) => {
        console.error("Logout error:", error)
      })
  }


  // Update steam prices based on currency change
  function updateSteamPrices(multiplier: number) {
    setItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        steam_price: item.steam_price !== null ? Number((item.steam_price * multiplier).toFixed(2)) : null,
      }))
    );
  }


  // Get conversion rate by currency code
  function getRateByCurrency(code: string) {
    const currency = currencies.find(c => c.code === code);
    return currency ? currency.rate : 1; // fallback to 1 if not found
  }


  // Handle currency change effects
  useEffect(() => {
    const newCurrencyCode = selectedCurrency;
    const oldCurrencyCode = currentPriceBaseRef.current;
    
    // 1. Get the rates
    const oldRate = getRateByCurrency(oldCurrencyCode);
    const newRate = getRateByCurrency(newCurrencyCode);
    
    // 2. Calculate the multiplier
    // Convert from the old base (oldRate) to the new base (newRate)
    const multiplier = newRate / oldRate;

    // 3. Update the prices
    updateSteamPrices(multiplier);

    // 4. Update the reference and storage
    currentPriceBaseRef.current = newCurrencyCode;
    localStorage.setItem("selected_currency", newCurrencyCode);

  }, [selectedCurrency]);


  // On mount, load selected currency from localStorage
  useEffect(() => {
    const storedCurrency = localStorage.getItem("selected_currency");
    if (storedCurrency) {
      setSelectedCurrency(storedCurrency); 
    }
  }, []);


  // Update filtered value when selected items change
  useEffect(() => {
    console.log("Item selected")
    const value = selectedItems.reduce((sum, item) => sum + (item.steam_price || 0) * (item.quantity || 1), 0)
    setFilteredValue(value)
    console.log("Selected items value:", value)
  }, [selectedItems]);


  // Fetch inventory data
  useEffect(() => {
    async function loadInventory() {
      if (!steamId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const data = await fetchInventory(steamId)
        const items = data.item_data

        console.log("Inventory.tsx: Fetched inventory data:", data)

        setError(data.error)

        setStorageUnits(data.storage_units)
        setItems(items)
        setFilteredItems(items)
        setLoginType(data.type)
              
        // On initial load, convert prices if needed
        updateSteamPrices(getRateByCurrency(selectedCurrency));

        // Calculate initial filtered value (all items)
        const initialValue = items.reduce((sum, item) => sum + (item.steam_price || 0) * (item.quantity || 1), 0)
        setFilteredValue(initialValue)

        if (!data.success) {
          toast({
            title: "Error fetching invetory",
            description: data.error,
            variant: "destructive",
          })
          setTimeout(() => {
            handleLogout();
          }, 5000);
          throw new Error(`API error: Error inventory data`)
        }

      } catch (error) {
        console.log("Error loading inventory:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInventory()
  }, [steamId])


  // Handle scroll events to detect when user has scrolled
  useEffect(() => {
    const handleScroll = () => {
      // Get the current scroll position
      const scrollPosition = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Calculate scroll percentage (0 to 1)
      const scrollPercentage = Math.min(scrollPosition / (documentHeight - windowHeight), 1)

      // Update isScrolled state for header visibility
      setIsScrolled(scrollPosition > 100)

      // Synchronize filter scroll with page scroll
      if (filterRef.current) {
        const filterHeight = filterRef.current.scrollHeight
        const filterContainerHeight = filterRef.current.clientHeight

        // Calculate the maximum scroll position for the filter
        const maxFilterScroll = filterHeight - filterContainerHeight

        // Set the filter's scroll position based on the page scroll percentage
        filterRef.current.scrollTop = scrollPercentage * maxFilterScroll
      }
    }

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll)

    // Initial call to set correct positions
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])


  // Handle total value change from filtered items
  const handleTotalValueChange = (value: number) => {
    setFilteredValue(value)
  }


  // Handle showing more items
  const handleShowMore = () => {
    setVisibleItems((prev) => prev + 24) // Add 4 more rows (6 items per row)
  }


  // Handle filtered items update
  const handleFilteredItemsChange = (items: InventoryItem[]) => {
    setFilteredItems(items)
  }


  // Handle item selection
  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItems((prev) => {
      // Check if item is already selected
      const isSelected = prev.some((selectedItem) => selectedItem.id === item.id)

      if (isSelected) {
        // Remove item if already selected
        return prev.filter((selectedItem) => selectedItem.id !== item.id)
      } else {
        // Add item if not selected
        return [...prev, item]
      }
    })
  }


  // Handle removing a selected item
  const handleRemoveSelectedItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id))
  }


  // Handle clearing all selected items
  const handleClearSelectedItems = () => {
    setSelectedItems([])
  }


  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white" style={{ maxHeight: "100vh" }}>
        <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950 shadow-md transition-all duration-300">
          <div className="container mx-auto p-4">
            <div className="flex items-center justify-between">
              {/* Left section */}
              <div className="flex items-center gap-4">
                <img src="/logo.png" width="35" height="35"></img>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  CS2 Vault
                </h1>
              </div>

              {/* Stats in navbar when scrolled */}
                <div
                className={`hidden md:flex items-center space-x-6 ml-8 text-sm transition-all duration-300 ${isScrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">Items:</span>
                    <span className="font-bold">{items.length}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">Storage Units:</span>
                    <span className="font-bold">
                      {storageUnits}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">Filtered Value:</span>
                    <span className="font-bold text-green-500">${filteredValue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">Total Value:</span>
                    <span className="font-bold text-green-500">
                      {items.reduce((sum, item) => sum + (item.steam_price || 0) * (item.quantity || 1), 0).toFixed(2)}
                    </span>
                  </div>
                </div>

              {/* Right section */}
              <div className="flex items-center gap-4">
                {steamId && <UserProfile steamId={steamId} currencies={currencies} selectedCurrency={selectedCurrency} setSelectedCurrency={setSelectedCurrency} />}
              </div>
            </div>
          </div>
        </header>


        <main ref={mainRef} className="container mx-auto p-4 pb-12 flex-grow">
          {/* Only show stats when not scrolled - with smooth transition */}
          <div
            className={`mb-6 transition-all duration-300 ${isScrolled ? "opacity-0 max-h-0 overflow-hidden" : "opacity-100 max-h-20"}`}
          >
            <InventoryStats
              items={items}
              storageUnits={storageUnits}
              filteredValue={filteredValue}
              currencies={currencies}
              selectedCurrency={selectedCurrency}
              hideId={true}
            />
          </div>

          {/* Selected Items Section */}
          <SelectedItems
            items={selectedItems}
            onRemoveItem={handleRemoveSelectedItem}
            onClearAll={handleClearSelectedItems}
          />

          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            {/* Sticky filters */}
            <div
              ref={filterRef}
              className="sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
            >
              <InventoryFilters onFilterChange={setFilters}  storageUnitNames={[]} />
            </div>

            <div ref={itemsRef}>
              {loading ? (
                <LoadingInventory />
              ) : (
                <>
                  <InventoryGrid
                    items={items}
                    filters={filters}
                    onTotalValueChange={handleTotalValueChange}
                    visibleItems={visibleItems}
                    onFilteredItemsChange={handleFilteredItemsChange}
                    onSelectItem={handleSelectItem}
                    selectedItemIds={selectedItems.map((item) => item.id)}
                    error={error}
                    currencies={currencies}
                    selectedCurrency={selectedCurrency}
                    setLoading={setLoading}
                    setError={setError}
                    setStorageUnits={setStorageUnits}
                    setItems={setItems}
                    setTotalFilteredItems={setFilteredItems}
                    setFilteredValue={setFilteredValue}
                    loginType={loginType}
                  />

                  {/* Show more button - only if there are more items to show */}
                  {filteredItems.length > 0 && visibleItems < filteredItems.length && (
                    <div className="mt-6 flex justify-center pb-8">
                      <Button
                        onClick={handleShowMore}
                        variant="outline"
                        className="gap-2 border-gray-700 bg-gray-800 hover:bg-gray-700"
                      >
                        Show More
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>

        {/* Footer to prevent white background when scrolling past content */}
        <footer className="bg-gray-900 py-6 border-t-2 border-gray-600 pt-2">
          <div className="container mx-auto pt-6 pb-2 flex items-center justify-between text-sm text-gray-500">
            <Link
                href="https://github.com/maxtmiller"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors pl-6"
                aria-label="GitHub"
              >
                <Github className="h-7 w-7" />
            </Link>
            <p className="text-center text-lg w-full">
              @ 2025 CS2 Vault • Not affiliated with Valve or Steam
            </p>
            <Link
              href="https://steamcommunity.com/id/LowKey-W-Loki/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors pr-6"
              aria-label="Steam"
            >
              <SteamIcon className="h-7 w-7" />
            </Link>
          </div>
        </footer>
      </div>
    </>
  )
}
