export interface InventoryItem {
  id: string
  name: string
  imageUrl: string
  exterior?: string
  float?: number
  stattrak: boolean
  storageUnit?: string
  category: string
  tags?: any[]
  assetid?: string
}

export type FilterState = {
  searchTerm: string
  categories: Record<string, boolean>
  exteriors: Record<string, boolean>
  storage: Record<string, boolean>
  special: Record<string, boolean>
  types: Record<string, boolean>
  storageUnits: Record<string, boolean>
}
