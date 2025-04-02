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

