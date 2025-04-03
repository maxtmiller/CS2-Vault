import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { session, authEmitter } from "../qr/polling"

// Create a variable to track if we've received an authentication event
let lastAuthEvent: any = null

// Listen for authentication events
authEmitter.on("authenticated", (data) => {
  console.log("Auth event received in login-status:", data)
  lastAuthEvent = {
    timestamp: Date.now(),
    data,
  }
})

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  try {
    // Check if we have a recent auth event (within the last 10 seconds)
    if (lastAuthEvent && Date.now() - lastAuthEvent.timestamp < 10000) {
      console.log("Using recent auth event for login status")

      // Clear the event after using it
      const authData = lastAuthEvent.data
      lastAuthEvent = null

      console.log("line 27: ", authData)

      return NextResponse.json({
        loggedIn: true,
        responseStatus: "loggedIn",
        session: authData,
      })
    }

    console.log("line 34: ", session)

    // Check if we have an active session from the QR login
    if (session && session.accessToken) {
      // Verify the session is still valid
      try {
        // You could add additional validation here if needed
        return NextResponse.json({
          loggedIn: true,
          responseStatus: "loggedIn",
          session: {
            accountName: session.accountName,
            steamID: session.steamID,
            refreshToken: session.refreshToken,
            accessToken: session.accessToken,
            // accessTokenSetAt: session.accessTokenSetAt,
          },
        })
      } catch (error) {
        console.error("Session validation error:", error)
        // If validation fails, continue to cookie check
      }
    }
    // Check if we have a session cookie as fallback
    // const cookieStore = await cookies()
    // const sessionCookie = cookieStore.get("steam_session")

    // console.log("line 67: ", sessionCookie)

    // if (sessionCookie && sessionCookie.value !== "true") {
    //   try {
    //     const sessionData = JSON.parse(sessionCookie.value)
    //     console.log("line 63:", sessionData)
    //     console.log(sessionCookie)
    //     console.log(cookieStore.get("steam_session"))

    //     // Check if the session is expired
    //     if (sessionData.expiresAt && sessionData.expiresAt < Date.now()) {
    //       // Session expired, clear the cookie
    //       cookieStore.delete("steam_session")
    //       return NextResponse.json({ loggedIn: false, reason: "expired" })
    //     }

    //     return NextResponse.json({
    //       loggedIn: true,
    //       responseStatus: "loggedIn",
    //       session: sessionData,
    //     })
    //   } catch (error) {
    //     console.error("Error parsing session cookie:", error)
    //     // Invalid cookie, clear it
    //     cookieStore.delete("steam_session")
    //   }
    // }

    // No active session found
    return NextResponse.json({ loggedIn: false })
  } catch (error) {
    console.error("Error checking login status:", error)
    return NextResponse.json({ loggedIn: false, error: "Failed to check login status" })
  }
}