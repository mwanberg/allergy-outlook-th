import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AirQualityIndicatorProps {
  level: string
  aqi: number
  emoji: string
  description: string
  color: string
  className?: string
}

export function AirQualityIndicator({ level, aqi, emoji, description, color, className }: AirQualityIndicatorProps) {
  return (
    <div className={cn("text-center", className)}>
      <div className="text-6xl mb-4 animate-pulse">{emoji}</div>
      <Badge className={cn("text-lg px-4 py-2 mb-3", color)}>{level}</Badge>
      <div className="text-3xl font-bold text-gray-800 mb-2">AQI {aqi}</div>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
}
