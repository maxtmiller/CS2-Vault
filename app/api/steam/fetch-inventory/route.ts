import { type NextRequest, NextResponse } from "next/server"
import { readInventory } from './readInventory';  // Import your function here

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const steamId = searchParams.get("steamid")

    const inventory = await readInventory(steamId);  // Call the function to read the inventory
    return NextResponse.json(inventory);  // Return inventory as a JSON response
  } catch (error) {
    console.error("Error retrieving inventory:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}