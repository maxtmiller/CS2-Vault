import { NextResponse } from 'next/server';
import { readMockInventory } from './readMockInventory';  // Import your function here

export async function GET() {
  try {
    const inventory = await readMockInventory();  // Call the function to read the inventory
    return NextResponse.json(inventory);  // Return inventory as a JSON response
  } catch (error) {
    console.error("Error retrieving inventory:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}