import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const steamId = searchParams.get("steamid")

    // Step 3: Create a session cookie
    const cookieStore = await cookies()
    cookieStore.set(
      "steam_session",
      JSON.stringify({
        steamId,
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

    return NextResponse.redirect(new URL("/", request.url))
  } catch (error) {
    console.error("Error in Steam callback:", error)
    return NextResponse.redirect(new URL("/", request.url))
  }
}