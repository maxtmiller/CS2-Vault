import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// API route handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { authData, loginType } = body

    const { initializeCSGOInventory } = await import("./generateItemData");

    const auth = JSON.parse(authData);
    const result = await initializeCSGOInventory(auth, loginType);

    const cookieStore = await cookies()
    cookieStore.set(
      "steam_session",
      JSON.stringify({
        steamId: result.steamID,
        authenticated: true,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60, // 24 hours
        path: "/",
      },
    )

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error retrieving inventory:", error)
    return NextResponse.json({ result: { success: false, details: error, item_data: [], steamID: null, storage_units: [] } })
  }
}