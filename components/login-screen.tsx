"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { SteamIcon } from "@/components/steam-icon"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, KeyRound, Loader2, SquareArrowOutUpRight, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function LoginScreen() {
  const [jwtToken, setJwtToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [qrRefreshNeeded, setQrRefreshNeeded] = useState(false)
  const [pollingError, setPollingError] = useState<string | null>(null)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollingCountRef = useRef<number>(0)
  const { toast } = useToast()

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [])

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current)
      pollingTimeoutRef.current = null
    }
    setIsPolling(false)
    pollingCountRef.current = 0
  }

  const handleSteamOAuth = async () => {
    window.location.href = "/api/auth/steam"
  }

  const handleQrLogin = async (data: any) => {
    setIsLoading(true)
    try {
      stopPolling()

      const authData = {
        responseStatus: data.responseStatus,
        accountName: data.session.accountName,
        refreshToken: data.session.refreshToken,
        accessToken: data.session.accessToken,
        // accessTokenSetAt: data.session.accessTokenSetAt,
      }

      const response = await fetch("/api/steam/retrieve-inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ authData: data, loginType: 1 }),
      })

      if (response.ok) {
        const inventoryData = await response.json()

        if (inventoryData.success && inventoryData.item_data) {
          localStorage.setItem(
            "cs2_inventory_data",
            JSON.stringify({
              timestamp: Date.now(),
              data: inventoryData.item_data,
              steamID: inventoryData.steamID,
              storage_units: inventoryData.storage_units || [],
            }),
          )

          toast({
            title: "Login successful",
            description: `Retrieved ${inventoryData.item_data?.length || 0} items from inventory`,
          })

          // Use window.location.replace instead of window.location.href for a full page reload
          window.location.replace("/")
        } else {
          toast({
            title: "Login successful",
            description: "Redirecting to inventory...",
          })
          window.location.replace("/")
        }
      } else {
        toast({
          title: "Inventory retrieval failed",
          description: "Failed to retrieve inventory data",
          variant: "destructive",
        })
        throw new Error("Failed to retrieve inventory data")
      }
    } catch (error) {
      console.error("QR login error:", error)
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsPolling(false)
    }
  }

  const checkLoginStatus = async () => {
    try {
      pollingCountRef.current += 1

      if (pollingCountRef.current > 60) {
        stopPolling()
        setQrRefreshNeeded(true)
        setPollingError("Polling timeout. Please refresh the QR code.")
        return
      }

      const response = await fetch("/api/auth/login-status", {
        // Add cache: 'no-store' to prevent caching
        cache: "no-store",
        headers: {
          // Add a timestamp to prevent caching
          "X-Timestamp": Date.now().toString(),
        },
      })

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.loggedIn) {
        console.log("User authenticated via QR code")
        await handleQrLogin(data)
      } else if (data.reason === "expired") {
        stopPolling()
        setQrRefreshNeeded(true)
        setPollingError("Session expired. Please refresh the QR code.")
      } else if (pollingCountRef.current > 40) {
        setQrRefreshNeeded(true)
      }
    } catch (error) {
      console.error("Error checking login status:", error)
      setPollingError("Error checking login status. Please try again.")
      stopPolling()
    }
  }

  const handleQrPolling = async (refresh = false) => {
    setIsLoading(true)
    setQrRefreshNeeded(false)

    try {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }

      const response = await fetch(`/api/auth/qr${refresh ? "?refresh=true" : ""}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`QR code generation failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.qrCodeDataUrl) {
        setQrCodeDataUrl(data.qrCodeDataUrl)
        setIsPolling(true)

        pollingIntervalRef.current = setInterval(checkLoginStatus, 3000)

        setTimeout(() => {
          setQrRefreshNeeded(true)
        }, 120000)
      } else {
        throw new Error("No QR code data received")
      }
    } catch (error) {
      console.error("Error during QR login:", error)
      toast({
        title: "QR Code Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleJwtLogin = async () => {
    if (!jwtToken.trim()) return

    setIsLoading(true)
    try {
      
      const response = await fetch("/api/steam/retrieve-inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ authData: jwtToken, loginType: 2 }),
      })

      if (response.ok) {
        // Parse the response to get the inventory data
        const inventoryData = await response.json()

        // Store the inventory data in localStorage
        if (inventoryData.success && inventoryData.item_data) {
          localStorage.setItem(
            "cs2_inventory_data",
            JSON.stringify({
              timestamp: Date.now(),
              data: inventoryData.item_data,
              steamID: inventoryData.steamID,
              storage_units: inventoryData.storage_units || [],
            }),
          )

          toast({
            title: "Login successful",
            description: `Retrieved ${inventoryData.item_data?.length || 0} items from inventory`,
          })

          // Use window.location.replace instead of window.location.href for a full page reload
          window.location.replace("/")
        } else {
          toast({
            title: "Login successful",
            description: "Redirecting to inventory...",
          })
          window.location.replace("/")
        }
      } else {
        toast({
          title: "Inventory retrieval failed",
          description: "Invalid JWT token",
          variant: "destructive",
        })
        throw new Error("Invalid JWT token")
      }
    } catch (error) {
      console.error("JWT login error:", error)
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4 text-white">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold">CS2 Inventory Viewer</h1>
        <p className="text-gray-300">View all your CS2 items including those in storage units</p>
      </div>

      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Sign In</CardTitle>
          <CardDescription className="text-gray-400">Choose your preferred login method</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="jwt" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-700">
              <TabsTrigger value="steam" className="data-[state=active]:bg-gray-900">
                Steam
              </TabsTrigger>
              <TabsTrigger value="qr" className="data-[state=active]:bg-gray-900">
                QR Code
              </TabsTrigger>
              <TabsTrigger value="jwt" className=" disabled data-[state=active]:bg-gray-900">
                JWT Token
              </TabsTrigger>
            </TabsList>

            <TabsContent value="steam" className="mt-4">
              <div className="flex justify-center">
                <Button
                  onClick={handleSteamOAuth}
                  className="flex items-center text-white-100 gap-2 bg-[#0b327a] hover:bg-[#2a475e] w-full"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SteamIcon className="h-5 w-5" />}
                  Sign in with Steam
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="qr" className="mt-4">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-lg">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl || "/placeholder.svg"}
                      style={{ width: "330px", height: "330px" }}
                      alt="QR Code"
                    />
                  ) : (
                    <QrCode className="h-48 w-48 text-gray-900" />
                  )}
                </div>

                <div className="flex flex-col w-full gap-2">
                  {!qrCodeDataUrl ? (
                    <Button onClick={() => handleQrPolling(false)} className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating QR Code...
                        </>
                      ) : (
                        "Generate QR Code"
                      )}
                    </Button>
                  ) : (
                    <>
                      {isPolling && !pollingError && (
                        <div className="text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Waiting for QR scan...
                        </div>
                      )}

                      {pollingError && <div className="text-center text-sm text-red-400 mb-2">{pollingError}</div>}

                      {(qrRefreshNeeded || pollingError) && (
                        <div className="text-center text-sm text-amber-400 mb-2">
                          QR code may have expired. Please refresh.
                        </div>
                      )}

                      <Button
                        onClick={() => handleQrPolling()}
                        className="w-full border-gray-600"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh QR Code
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="jwt" className="mt-4">
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Paste your Steam JWT token below</p>
                  <div className="flex items-center gap-1">
                      <Input
                      type="password"
                      placeholder="JWT Token"
                      value={jwtToken}
                      onChange={(e) => setJwtToken(e.target.value)}
                      className="bg-gray-700 border-gray-600 flex-1"
                      />
                      <Button
                      className="bg-[#0a4894] hover:bg-[#2a475e] text-white h-10 w-10 flex items-center justify-center"
                      onClick={() => window.open("https://steamcommunity.com/chat/clientjstoken", "_blank")}
                      >
                          <SquareArrowOutUpRight className="h-8 w-8" />
                      </Button>
                  </div>
                </div>
                <Button onClick={handleJwtLogin} className="w-full" disabled={isLoading || !jwtToken.trim()}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Login with JWT
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}