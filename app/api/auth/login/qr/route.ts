import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { flowLoginRegularQR, refreshQrCode } = await import("./polling")

    const refresh = request.nextUrl.searchParams.get('refresh');

    let result: any;

    if (refresh === 'true') {
        result = await refreshQrCode();
    } else {
        result = await flowLoginRegularQR();
    }

    // Only send the qrCodeDataUrl
    return NextResponse.json({ qrCodeDataUrl: result.qrCodeDataUrl });

  } catch (error) {
    console.error("Error in QR authentication:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}