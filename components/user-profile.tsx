"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DollarSign, Euro, PoundSterling, ChevronDown } from "lucide-react"

interface ProfileData {
  steamID64: string
  steamName: string
  avatarMedium: string
  avatarIcon: string
  avatarFull: string
  onlineState?: string
  memberSince?: string
  location?: string
}

export function UserProfile({ steamId, currencies, selectedCurrency, setSelectedCurrency }: { 
  steamId: string, 
  currencies: { code: string; char: string; rate: number; icon: React.ReactNode }[],
  selectedCurrency: string, 
  setSelectedCurrency: (currency: string) => void 
}) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function handleCurrencyChange(currency: string) {
    setSelectedCurrency(currency);
  }

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true)
        const response = await fetch(`/api/steam/profile?steamid=${steamId}`)

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
        setProfile(data)
      } catch (err) {
        console.error("Failed to fetch profile:", err)
        setError("Failed to load profile data")
      } finally {
        setLoading(false)
      }
    }

    if (steamId) {
      fetchProfile()
    }
  }, [steamId])

  const handleLogout = () => {
    localStorage.removeItem("login_type")
    localStorage.removeItem("inventory_data")
    fetch(`/api/auth/logout?steamid=${steamId}`, { method: "POST" })
      .then(() => {
        window.location.replace("/")
      })
      .catch((error) => {
        console.error("Logout error:", error)
      })
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Steam ID: {steamId}</p>
          <p className="text-sm text-red-400">{error || "Profile not available"}</p>
        </div>
        <Button onClick={handleLogout} variant="destructive" size="sm">
          Logout
        </Button>
      </div>
    )
  }

  const steamProfileUrl = `https://steamcommunity.com/profiles/${steamId}`

  return (
    <div className="flex items-center space-x-4">
        <div className="flex-grow ml-4 flex flex-col justify-center items-end">
            <h3 className="font-medium text-white">{profile.steamName}</h3>
            <p className="text-xs text-gray-400">{steamId}</p>
        </div>
        <Link
            href={steamProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative h-10 w-10 overflow-hidden border-2 border-gray-500 rounded-full transition-all duration-300 hover:border-4 hover:border-blue-500"
        >
            <Image
            src={profile.avatarMedium || "/placeholder.svg"}
            alt={profile.steamName}
            width={64}
            height={64}
            className="object-cover"
            />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="">
              <p className="mr-2 text-sm text-600-white hover:text-blue">
                {selectedCurrency}
              </p>
              <ChevronDown className="h-4 w-4 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {currencies.map((c) => (
              <DropdownMenuItem key={c.code} onClick={() => handleCurrencyChange(c.code)}>
                {c.icon}
                {c.code}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={handleLogout} className="bg-red-600 text-white hover:bg-red-700 rounded-full">
            Logout
        </Button>
    </div>
  )
}
