import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { InventoryItem } from "@/lib/steam-api"

export async function fetchInventoryFromJSON(): Promise<InventoryItem[]> {
  console.log("Fetching inventory from mock data...");

  try {
    const response = await fetch(`/api/steam/fetch-inventory`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
