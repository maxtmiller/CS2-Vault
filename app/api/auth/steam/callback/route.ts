import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Get all OpenID parameters from the request
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get("openid.mode")

    // Ensure this is an OpenID response
    if (mode !== "id_res") {
      console.error("Invalid OpenID mode:", mode)
      return NextResponse.redirect(new URL("/", request.url))
    }

    // Step 1: Verify the authentication response
    // Create a new set of parameters for verification
    const verifyParams = new URLSearchParams()

    // Copy all openid parameters
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith("openid.")) {
        // For verification, we change mode to 'check_authentication'
        if (key === "openid.mode") {
          verifyParams.append(key, "check_authentication")
        } else {
          verifyParams.append(key, value)
        }
      }
    }

    // Send verification request to Steam
    const verifyResponse = await fetch("https://steamcommunity.com/openid/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: verifyParams.toString(),
    })

    const verifyText = await verifyResponse.text()

    // If verification failed, redirect to home
    if (!verifyText.includes("is_valid:true")) {
      console.error("Steam authentication verification failed")
      return NextResponse.redirect(new URL("/", request.url))
    }

    // Step 2: Extract the Steam ID
    // The claimed_id parameter contains the Steam ID in the format:
    // https://steamcommunity.com/openid/id/76561198XXXXXXXXX
    const claimedId = searchParams.get("openid.claimed_id") || ""
    const steamIdMatch = claimedId.match(/(\d+)$/)

    if (!steamIdMatch) {
      console.error("Could not extract Steam ID from claimed_id:", claimedId)
      return NextResponse.redirect(new URL("/", request.url))
    }

    const steamId = steamIdMatch[1]

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

    // Step 4: Redirect to the inventory page
    // We don't fetch inventory data here - we'll let the client fetch it
    return NextResponse.redirect(new URL("/", request.url))
  } catch (error) {
    console.error("Error in Steam callback:", error)
    return NextResponse.redirect(new URL("/", request.url))
  }
}

