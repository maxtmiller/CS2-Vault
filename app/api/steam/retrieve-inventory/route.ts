import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// API route handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { authData, loginType } = body

    const { initializeCSGOInventory } = await import("./generateItemData");

    let auth;
    if (loginType !== 1) {
      auth = JSON.parse(authData);
    } else {
      auth = authData.session
    }

    // console.log("Retrieve Inventory API:")
    // console.log(auth); // Ensure auth is defined
    // console.log(typeof auth); // Should be 'object'
    // console.log(Object.keys(auth)); // Check available keys
    // // console.log(typeof authData)
    // // console.log(authData.refreshToken)
    // // console.log(auth.refreshToken)

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
    return NextResponse.json({ error: "Failed to retrieve inventory", details: error }, { status: 500 })
  }
}