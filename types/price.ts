export interface PriceData {
  [key: string]: {
    steam: {
      last_24h: number
      last_7d: number
      last_30d: number
      last_90d: number
      last_ever: number
    }
  }
}
