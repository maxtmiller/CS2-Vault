import { EventEmitter } from "events"
import { LoginSession, EAuthTokenPlatformType } from "steam-session"
import QRCode from "qrcode"
import { cookies } from "next/headers"

export let session: LoginSession // Make session available outside the function
export const authEmitter = new EventEmitter() // Create a global emitter for authentication events

export async function flowLoginRegularQR() {
  const emitterAccount = new EventEmitter()
  return new Promise(async (resolve) => {
    session = new LoginSession(EAuthTokenPlatformType.SteamClient)
    console.log("Start with QR")

    session.on("authenticated", async () => {
      console.log(`Logged into Steam as ${session.accountName}`)

      const cookieStore = await cookies()
      cookieStore.set(
        "steam_session",
        JSON.stringify({
          steamId: session.steamID,
          authenticated: true,
          accountName: session.accountName,
          refreshToken: session.refreshToken,
          accessToken: session.accessToken,
          // accessTokenSetAt: session.accessTokenSetAt,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        }),
        {
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 24 * 60 * 60, // 24 hours
          path: "/",
        },
      )

      // Emit the authenticated event to the global emitter
      authEmitter.emit("authenticated", {
        steamId: session.steamID,
        accountName: session.accountName,
        refreshToken: session.refreshToken,
        accessToken: session.accessToken,
        // accessTokenSetAt: session.accessTokenSetAt,
      })

      resolve({ responseStatus: "loggedIn", session })
    })

    session.once("timeout", () => {
      console.log("Login attempt timed out.")
      resolve({ responseStatus: "defaultError" })
    })

    session.once("error", (err) => {
      console.log("Error:", err.message)
      resolve({ responseStatus: "defaultError" })
    })

    try {
      console.log("Attempting to start QR login...")
      const result = await session.startWithQR()
      // console.log("QR Login Result:", result)

      if (!result || !result.qrChallengeUrl) {
        throw new Error("QR Challenge URL is missing")
      }

      console.log(`Scan this QR code to log in: ${result.qrChallengeUrl}`)

      // Generate QR code data URL to send to the client
      const qrCodeDataUrl = await QRCode.toDataURL(result.qrChallengeUrl)

      emitterAccount.emit("qrLogin:show", qrCodeDataUrl)

      // Return the QR code URL for the client to display
      resolve({
        responseStatus: "waitingForQR",
        qrCodeDataUrl,
        qrChallengeUrl: result.qrChallengeUrl,
        session,
      })
    } catch (err) {
      if (err instanceof Error) {
        console.error("QR Login failed:", err.message)
      } else {
        console.error(`Unknown error:`, err) // Handle non-Error cases
      }
      resolve({ responseStatus: "defaultError" })
    }
  })
}

export async function refreshQrCode() {
  if (!session) {
    return { responseStatus: "defaultError", message: "Session not initialized." }
  }
  try {
    const result = await session.startWithQR()
    if (!result || !result.qrChallengeUrl) {
      throw new Error("QR Challenge URL is missing")
    }
    const qrCodeDataUrl = await QRCode.toDataURL(result.qrChallengeUrl)
    return { responseStatus: "waitingForQR", qrCodeDataUrl, qrChallengeUrl: result.qrChallengeUrl }
  } catch (err) {
    if (err instanceof Error) {
      console.error("QR Refresh failed:", err.message)
    } else {
      console.error(`Unknown error:`, err) // Handle non-Error cases
    }
    return { responseStatus: "defaultError" }
  }
}

