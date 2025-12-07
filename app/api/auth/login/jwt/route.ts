import { type NextRequest, NextResponse } from "next/server"
import { createSteamSession } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const steamId = searchParams.get("steamid")

    await createSteamSession(steamId || "");

    return NextResponse.redirect(new URL("/", request.url))
  } catch (error) {
    console.error("Error in Steam callback:", error)
    return NextResponse.redirect(new URL("/", request.url))
  }
}
