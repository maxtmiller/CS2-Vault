import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { session } from "../login/qr/polling"; // Import the session

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const steamId = searchParams.get("steamid");

    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.delete("steam_session");

    // Reset the global session variable if it exists
    if (session) {
      try {
        // Attempt to end the session if possible
        if (typeof session.endSession === "function") {
          await session.endSession();
        }

        // Reset the session properties
        if (session.accessToken) {
          session.accessToken = null;
        }
        if (session.refreshToken) {
          session.refreshToken = null;
        }
      } catch (error) {
        console.error("Error ending session:", error);
        // Continue with logout even if ending session fails
      }
    }

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 }
    );
  }
}
