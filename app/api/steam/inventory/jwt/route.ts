import { type NextRequest, NextResponse } from "next/server"

// API route handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { authData, loginType } = body

    const { initializeCSGOInventory } = await import("./generateItemData");

    const auth = JSON.parse(authData);
    const result = await initializeCSGOInventory(auth, loginType);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error retrieving inventory:", error)
    return NextResponse.json({ result: error })
  }
}