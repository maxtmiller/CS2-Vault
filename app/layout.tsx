import type React from "react"
import type { Metadata } from 'next'
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/react"
import './globals.css'

export const metadata: Metadata = {
  title: 'CS2Vault',
  description: 'Effortlessly view all your CS2 items, including those stored away, and discover the best suggestions for your collection.',
  icons: {
    icon: [
      { url: "/logo.png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/logo.jpg", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/logo.png",
        color: "#9333EA",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
