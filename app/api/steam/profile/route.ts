import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { XMLParser } from "fast-xml-parser"

export async function GET(request: NextRequest) {
  try {
    // Get the steamId from the query parameters
    const searchParams = request.nextUrl.searchParams
    const steamId = searchParams.get("steamid")

    if (!steamId) {
      return NextResponse.json({ error: "Missing steamId parameter" }, { status: 400 })
    }

    // Verify the user is requesting their own profile
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("steam_session")

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Parse the session
    const session = JSON.parse(sessionCookie.value)

    // Verify the user is requesting their own profile
    if (session.steamId !== steamId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Fetch the Steam profile data
    const response = await fetch(`http://steamcommunity.com/profiles/${steamId}/?xml=1`)

    if (!response.ok) {
      return NextResponse.json({ error: `Steam API returned ${response.status}` }, { status: response.status })
    }

    const xmlData = await response.text()

    // Parse XML data
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "_",
    })
    const result = parser.parse(xmlData)

    if (!result.profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Extract profile data
    const profile = result.profile

    return NextResponse.json({
      steamID64: profile.steamID64,
      steamName: profile.steamID,
      avatarMedium: profile.avatarMedium,
      avatarIcon: profile.avatarIcon,
      avatarFull: profile.avatarFull,
      onlineState: profile.onlineState,
      memberSince: profile.memberSince,
      location: profile.location,
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile data" }, { status: 500 })
  }
}

