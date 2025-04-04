import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { InventoryItem } from "@/lib/steam-api"

export async function fetchInventoryFromJSON(steamId: string): Promise<InventoryItem[]> {
  console.log("Fetching inventory from mock data...");

  try {
    const response = await fetch(`/api/steam/fetch-inventory?steamid=${steamId}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
}

export async function fetchAllInventoryData(authData: string, loginType: number): Promise<any | null> {
  console.log("Fetching inventory from mock data...");

  try {
    const response = await fetch("/api/steam/retrieve-inventory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ authData: authData, loginType: loginType }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const storage_units = data.result.storage_units.length
    const item_data = JSON.parse(data.result.item_data)

    return { item_data, storage_units }
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
}


export async function fetchVisibleInventoryData(steamId: string): Promise<any | null> {
  try {
    // Use our proxy endpoint instead of calling Steam directly
    const response = await fetch(`/api/steam/inventory?steamid=${steamId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const result = data.processedData.item_data

    return { item_data: result, storage_units: 0 }
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return []
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
