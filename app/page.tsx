import { Inventory } from "@/components/inventory"
import { LoginScreen } from "@/components/login-screen"
import { cookies } from "next/headers"

export default async function Home() {
  // Check if the user is authenticated by looking for the steam session cookie
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("steam_session")

  let isAuthenticated = false
  let steamId = null

  // Parse the session cookie if it exists
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value)
      isAuthenticated = session.authenticated === true
      steamId = session.steamId
      console.log("User authenticated with Steam ID:", steamId)
    } catch (error) {
      console.error("Error parsing session cookie:", error)
    }
  }

  // If not authenticated, show the login page
  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return <Inventory steamId={steamId} />
}

