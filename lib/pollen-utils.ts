// Utility functions for processing pollen data from Google Maps Pollen API

export interface PollenTypeInfo {
  code: string
  displayName: string
  inSeason: boolean
  indexInfo: {
    code: string
    displayName: string
    value: number
    category: string
    indexDescription: string
    color: any
  }
  healthRecommendations: string[]
}

export interface PlantInfo {
  code: string
  displayName: string
  inSeason?: boolean
  indexInfo?: {
    code: string
    displayName: string
    value: number
    category: string
    indexDescription: string
    color: any
  }
  plantDescription?: {
    type: string
    family: string
    season: string
    specialColors: string
    specialShapes: string
    crossReaction: string
    picture?: string
    pictureCloseup?: string
  }
}

export interface ProcessedPollenData {
  totalUPI: number
  totalCategory: string
  pollenTypes: PollenTypeInfo[]
  plants: PlantInfo[]
}

// Default pollen type data for missing types
const DEFAULT_POLLEN_TYPES = {
  TREE: {
    code: "TREE",
    displayName: "Tree",
    inSeason: false,
    indexInfo: {
      code: "UPI",
      displayName: "Universal Pollen Index",
      value: 0,
      category: "None",
      indexDescription: "No pollen detected",
      color: {},
    },
    healthRecommendations: ["No tree pollen detected today."],
  },
  GRASS: {
    code: "GRASS",
    displayName: "Grass",
    inSeason: false,
    indexInfo: {
      code: "UPI",
      displayName: "Universal Pollen Index",
      value: 0,
      category: "None",
      indexDescription: "No pollen detected",
      color: {},
    },
    healthRecommendations: ["No grass pollen detected today."],
  },
  WEED: {
    code: "WEED",
    displayName: "Weed",
    inSeason: false,
    indexInfo: {
      code: "UPI",
      displayName: "Universal Pollen Index",
      value: 0,
      category: "None",
      indexDescription: "No pollen detected",
      color: {},
    },
    healthRecommendations: ["No weed pollen detected today."],
  },
}

export function getUPICategory(upi: number): string {
  if (upi === 0) return "None"
  if (upi <= 1.0) return "Very Low"
  if (upi <= 2.0) return "Low"
  if (upi <= 3.0) return "Moderate"
  if (upi <= 4.0) return "High"
  return "Very High"
}

export function formatUPI(upi: number): string {
  // Remove trailing .0 for whole numbers
  return upi % 1 === 0 ? upi.toString() : upi.toFixed(1)
}

export function calculateAverageUPI(pollenTypes: PollenTypeInfo[]): number {
  const totalUPI = pollenTypes.reduce((sum, type) => sum + (type.indexInfo?.value ?? 0), 0)
  return Math.round((totalUPI / 3) * 10) / 10 // divide by 3 (Tree, Grass, Weed)
}

function ensureCompleteType(partial: Partial<PollenTypeInfo>): PollenTypeInfo {
  return {
    code: partial.code as string,
    displayName: partial.displayName ?? "",
    inSeason: partial.inSeason ?? false,
    indexInfo: partial.indexInfo ?? {
      code: "UPI",
      displayName: "Universal Pollen Index",
      value: 0,
      category: "None",
      indexDescription: "No pollen detected",
      color: {},
    },
    healthRecommendations: partial.healthRecommendations ?? ["No pollen detected today."],
  }
}

export function processPollenData(apiData: any): ProcessedPollenData {
  const dailyInfo = apiData.dailyInfo?.[0]
  if (!dailyInfo) {
    // Return default data if no daily info
    return {
      totalUPI: 0,
      totalCategory: "None",
      pollenTypes: Object.values(DEFAULT_POLLEN_TYPES),
      plants: [],
    }
  }

  // Create a map of existing pollen types from API
  const apiPollenTypes = new Map<string, PollenTypeInfo>()
  if (dailyInfo.pollenTypeInfo) {
    dailyInfo.pollenTypeInfo.forEach((type: PollenTypeInfo) => {
      apiPollenTypes.set(type.code, type)
    })
  }

  // Ensure all three pollen types are present, using defaults if missing
  const pollenTypes: PollenTypeInfo[] = []
  const requiredTypes = ["TREE", "GRASS", "WEED"]

  requiredTypes.forEach((code) => {
    if (apiPollenTypes.has(code)) {
      pollenTypes.push(ensureCompleteType(apiPollenTypes.get(code)!))
    } else {
      pollenTypes.push(ensureCompleteType(DEFAULT_POLLEN_TYPES[code]))
    }
  })

  // Calculate average UPI
  const averageUPI = calculateAverageUPI(pollenTypes)
  const totalCategory = getUPICategory(averageUPI)

  return {
    totalUPI: averageUPI,
    totalCategory,
    pollenTypes,
    plants: dailyInfo.plantInfo || [],
  }
}
