import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { processInventoryData } from "./processInventory"

export async function GET(request: NextRequest) {
  try {
    // Get the steamId from the query parameters
    const searchParams = request.nextUrl.searchParams
    const steamId = searchParams.get("steamid")

    if (!steamId) {
      return NextResponse.json({ error: "Missing steamId parameter" }, { status: 400 })
    }

    // Construct the Steam API URL
    const steamUrl = `https://steamcommunity.com/inventory/${steamId}/730/2?l=english&count=999`

    console.log(`Fetching inventory from Steam API: ${steamUrl}`)

    // Make the request to Steam API
    const response = await fetch(steamUrl, {
      headers: {
        // Steam may check for a browser-like User-Agent
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      console.error(`Steam API error: ${response.status} ${response.statusText}`)
      return NextResponse.json({ error: `Steam API returned ${response.status}` }, { status: response.status })
    }

    // Get the JSON response from Steam
    const data = await response.json()
    const result = await processInventoryData(data, steamId);

    const cookieStore = await cookies()
    cookieStore.set(
      "steam_session",
      JSON.stringify({
        steamId: steamId,
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

    // Return the data to the client
    return NextResponse.json({ result })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ result: { success: false, item_data: [], steamID: null, storage_units: [] } })
  }
}

